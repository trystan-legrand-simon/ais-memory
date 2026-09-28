# Chat streaming mot-à-mot — design

Date : 2026-09-28
Statut : approuvé (brainstorming), en attente du plan d'implémentation

## Contexte et objectif

`/chat` sur `apps/dashboard` invoque aujourd'hui le CLI Claude Code en headless via `src/lib/claude-cli.ts` (`invokeClaude`, `claude -p --output-format json ...`), qui attend la fin complète de l'exécution avant de parser le JSON et retourner `{status, output, sessionId, exitCode}`. `src/lib/chat.ts` (`sendChatMessage`) insère ensuite le message `agent`/`error` complet en base d'un coup. Le résultat visible : la réponse de l'agent apparaît en un seul bloc, pas au fil de sa génération comme dans le CLI Claude Code interactif.

Vérifié concrètement pendant le brainstorming (`claude -p --output-format stream-json --include-partial-messages --verbose ...`) : le CLI expose bien un mode streaming NDJSON. Chaque fragment de texte arrive comme `{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"..."}}}`, et la ligne finale `{"type":"result", "result": "...", "is_error": ..., "session_id": "..."}` porte exactement les mêmes champs que le mode JSON actuel — la logique de parsing du résultat final existante reste réutilisable telle quelle.

## Hors scope (v1)

- Streaming visible sur d'autres onglets/fenêtres que celui qui envoie le message : décision actée avec l'utilisateur — seul l'onglet émetteur voit le mot-à-mot (lecture directe du flux HTTP de sa propre requête `POST /chat`). Les autres onglets continuent de voir le message complet apparaître d'un coup via le WS existant (`src/ws-server.ts`), une fois le message inséré en base — aucun changement necessaire sur le process WS pour cette feature.
- Rendu markdown en direct pendant le streaming (formatage éventuel appliqué uniquement une fois le message figé, si applicable — non traité ici, hors scope).
- Annulation d'une réponse en cours de génération depuis l'UI (pas de bouton "stop").

## Décision d'architecture : le CLI continue même si le client se déconnecte

Si l'onglet qui a envoyé le message est fermé ou perd la connexion avant la fin de la réponse, le process `claude` déjà lancé côté serveur va jusqu'au bout et le message complet est bien inséré en base — exactement comme aujourd'hui. Rouvrir le chat plus tard (ou consulter un autre onglet déjà ouvert, via le WS existant) montre la réponse complète, juste sans avoir vu le mot-à-mot se construire. Ça implique que l'invocation CLI (portée par `sendChatMessage`) ne doit **pas** être liée au cycle de vie de la réponse HTTP streamée : une écriture échouée dans le stream (client parti) est ignorée silencieusement, sans interrompre `sendChatMessage`.

## Architecture

- **`invokeClaudeStreaming(args, onDelta: (text: string) => void)`** dans `src/lib/claude-cli.ts` : nouvelle fonction à côté de `invokeClaude` (qui reste inchangée, toujours utilisée par `run-agent.ts` pour les runs d'agent — hors scope ici, pas de streaming pour les runs). Spawn `claude -p --output-format stream-json --include-partial-messages --verbose --permission-mode bypassPermissions ...args`. Parse stdout ligne par ligne (NDJSON), en bufferisant les lignes coupées entre deux chunks `data`. Pour chaque ligne `{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":...}}}`, appelle `onDelta(text)` immédiatement. Sur la ligne `{"type":"result", ...}`, construit le même `ClaudeInvocationResult` que `invokeClaude` aujourd'hui (`status` depuis `is_error`, `output` depuis `result`, `sessionId` depuis `session_id`). Même timeout de 5 minutes et même gestion d'erreur de spawn que `invokeClaude`.
- **`sendChatMessage(slug, message, onDelta)`** dans `src/lib/chat.ts` : `onDelta` devient un paramètre obligatoire (seul appelant restant : la route de chat). Insère le message `user` en base (inchangé), appelle `invokeClaudeStreaming` en lui passant `onDelta`, puis insère le message `agent`/`error` complet en base une fois terminé (inchangé — c'est toujours ce qui alimente le WS existant pour les autres onglets).
- **`POST /api/v1/agents/[slug]/chat`** (`app/api/v1/agents/[slug]/chat/route.ts`) : le check `ChatAlreadyBusyError` reste fait **avant** d'ouvrir le stream (réponse JSON 409 classique si l'agent est déjà occupé, pas de `ReadableStream` inutile). Sinon, retourne un `Response` dont le corps est un `ReadableStream` : chaque appel à `onDelta` écrit une ligne NDJSON `{"type":"delta","text":"..."}` dans le stream (encodée en UTF-8), une ligne finale `{"type":"done"}` une fois `sendChatMessage` résolu, ou `{"type":"error","message":"..."}` si elle rejette. Chaque écriture est entourée d'un `try/catch` : si le controller du stream est fermé (client parti), l'erreur est ignorée — `sendChatMessage` continue de tourner et d'insérer le message final en base normalement.
- **Client `/chat`** (`app/chat/page.tsx`) : `handleSend` n'attend plus `res.json()` mais lit `res.body.getReader()` avec un `TextDecoder`, découpe par ligne, parse chaque frame NDJSON. Sur `{"type":"delta"}`, accumule le texte et met à jour une bulle "en cours" affichée en direct (état local séparé de `messages`, ex. `streamingText`). Sur `{"type":"done"}`, fige cette bulle comme message final dans `messages` (le texte accumulé est déjà le message complet — pas de re-fetch nécessaire) et vide l'état de streaming. Sur `{"type":"error"}`, ajoute un message `role: "error"` avec le message reçu.

## Gestion des erreurs

- Erreur de spawn du CLI (process introuvable) → frame `{"type":"error","message":"..."}` écrite dans le stream (si encore écouté), et `sendChatMessage` insère bien un message `error` en base comme aujourd'hui.
- Ligne NDJSON illisible (JSON.parse échoue sur une ligne de stdout) → ignorée silencieusement dans `invokeClaudeStreaming`, ne casse pas le parsing des lignes suivantes.
- `ChatAlreadyBusyError` → détecté avant l'ouverture du stream (cf. Architecture), réponse JSON 409 inchangée par rapport à aujourd'hui.
- Timeout CLI (5 min, inchangé) → le child est tué comme aujourd'hui ; frame d'erreur envoyée si le stream est encore écouté, message `error` inséré en base.
- Écriture dans le stream qui échoue (client déconnecté) → catch/ignore dans la route, ne remonte jamais jusqu'à `sendChatMessage`/`invokeClaudeStreaming`, qui continuent indépendamment (cf. décision d'architecture).

## Tests

- `claude-cli.test.ts` (nouveau) : logique de parsing NDJSON isolée du vrai spawn — extraction des `text_delta` dans l'ordre depuis une suite de lignes simulées, construction du résultat final à partir d'une ligne `"type":"result"` simulée (succès et erreur), tolérance à une ligne malformée au milieu du flux.
- Pas de test e2e sur le streaming réseau lui-même (cohérent avec le reste du dashboard, aucune suite e2e en v1).
