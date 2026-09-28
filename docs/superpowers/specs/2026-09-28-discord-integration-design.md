# Intégration Discord (une mission par canal) — design

Date : 2026-09-28
Statut : approuvé (brainstorming), en attente du plan d'implémentation

## Contexte et objectif

L'utilisateur a posé un scaffold vide `apps/bot/` (`index.ts`, `src/commands/status.ts`, `src/commands/mission.ts`, tous à 0 octet) pour un bot Discord. Objectif : chaque canal Discord peut être lié à une **mission**, un contexte/tâche précis porté par un agent existant (`.claude/agents/*.md`). Un agent peut porter plusieurs missions en parallèle, chacune avec son propre historique — distinct de la conversation `/dashboard/chat` de l'agent. Écrire dans le canal revient à discuter avec l'agent dans le contexte de cette mission ; la réponse est postée dans le canal.

## Hors scope (v1)

- Streaming Discord (édition progressive du message) — un seul message posté une fois la réponse complète reçue.
- Lien avec les routines/cron existantes.
- Lien avec le système de Memory (ARMS) — pas encore implémenté (voir `2026-09-28-agent-memory-design.md`).
- Fermeture/archivage d'une mission, restriction par rôle Discord.
- Plusieurs canaux pour une même mission, ou plusieurs missions actives sur un même canal (contrainte d'unicité en DB).

## Architecture

`apps/bot` est un processus Node séparé d'`apps/web` (comme `apps/web` l'est du futur `packages/*`), qui ne parle **qu'à l'API HTTP d'`apps/web`** — jamais directement à la base SQLite ni au CLI `claude`. Toute la logique métier (DB, invocation du CLI Claude via `src/lib/claude-cli.ts`, gestion des sessions) reste dans `apps/web`, exactement comme pour le frontend Next.js. `apps/bot` est un client fin : il traduit les événements Discord en appels HTTP, et les réponses HTTP en messages Discord.

Ce choix (plutôt qu'un accès direct à la DB + spawn du CLI depuis `apps/bot`) évite de dupliquer `claude-cli.ts`/`chat.ts` et des écritures concurrentes non coordonnées sur le même fichier SQLite depuis deux processus.

## Modèle de données (ajouté à la SQLite existante d'`apps/web`, `src/lib/db.ts`)

```sql
CREATE TABLE missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_slug TEXT NOT NULL,
  discord_channel_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE mission_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_id INTEGER NOT NULL REFERENCES missions(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'agent', 'error')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE mission_sessions (
  mission_id INTEGER PRIMARY KEY REFERENCES missions(id),
  claude_session_id TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

`mission_messages`/`mission_sessions` sont l'équivalent exact de `chat_messages`/`chat_sessions`, mais clés par `mission_id` au lieu de `slug` — ce qui permet à un même agent d'avoir plusieurs fils de conversation isolés (un par mission), sans toucher au chat existant.

## Nouvelles routes API (`apps/web/app/api/v1/missions/`)

- **`POST /missions`** — `{ agentSlug, discordChannelId, title }`. Vérifie que `agentSlug` existe (`getAgent`), refuse (409) si `discordChannelId` a déjà une mission. Crée la ligne `missions`, renvoie la mission créée.
- **`GET /missions?channelId=...`** — renvoie la mission liée à ce canal (`null`/404 si aucune), avec le nombre de messages échangés et si une réponse est en cours (busy).
- **`POST /missions/:id/message`** — `{ message }`. Réutilise la même logique que `sendChatMessage` (`src/lib/chat.ts`) mais paramétrée par `mission_id` : insère le message `user` dans `mission_messages`, appelle `invokeClaude` (mode JSON, pas streaming — cf. décision plus bas) avec `--resume <mission_sessions.claude_session_id>` ou `--agent <agentSlug>` selon le premier tour, insère la réponse `agent`/`error`, renvoie `{ reply }`. Répond `409` si une réponse est déjà en cours pour cette mission (même pattern de verrou en mémoire que `busyAgents`, mais une `Map` par `mission_id`).

Cette route non-streaming justifie de réutiliser `invokeClaude` (JSON simple) plutôt que `invokeClaudeStreaming` : Discord ne consomme pas le flux mot-à-mot, donc pas besoin du mode `stream-json`.

## Bot Discord (`apps/bot`)

- **`index.ts`** — client `discord.js` (`GatewayIntentBits.Guilds`, `GuildMessages`, `MessageContent`), enregistrement des commandes slash au démarrage, écoute `interactionCreate` (commandes) et `messageCreate` (relais).
- **`src/commands/mission.ts`** — `/mission create agent:<slug> titre:<texte>`, exécutée dans le canal cible → `POST /missions` avec `discordChannelId = interaction.channelId`. Répond avec un message de confirmation ou l'erreur (agent introuvable, canal déjà lié).
- **`src/commands/status.ts`** — `/status` → `GET /missions?channelId=<canal courant>`. Si aucune mission sur ce canal : message "Aucune mission liée à ce canal." Sinon : agent, titre, nombre de messages, état busy/libre.
- **Relais de message** : sur `messageCreate`, ignore les messages du bot lui-même ; pour tout autre message, appelle `GET /missions?channelId=` — si une mission existe, `POST /missions/:id/message` avec le contenu du message, puis poste la réponse (`reply.content`) comme un seul message Discord une fois reçue. Si `409` (déjà occupé), poste un message court "Une réponse est déjà en cours pour cette mission."
- **Config** (variables d'env, `.env` non commité) : `DISCORD_BOT_TOKEN`, `DISCORD_APPLICATION_ID`, `API_BASE` (URL de base d'`apps/web`, ex. `http://localhost:3000/api/v1`).

## Gestion des erreurs

- `agentSlug` inconnu à la création de mission → `404` côté API, message d'erreur clair posté par le bot.
- Canal déjà lié à une mission → `409` côté API, le bot indique la mission existante plutôt que d'en recréer une.
- Mission déjà occupée (réponse en cours) → `409`, le bot informe sans renvoyer de nouvelle requête.
- Échec réseau bot → apps/web (apps/web non démarré, timeout) → le bot capture l'erreur `fetch` et poste un message générique d'erreur dans le canal plutôt que de rester silencieux.
- Timeout CLI côté `apps/web` (5 min, inchangé) → remonte comme message `role: "error"` classique, relayé tel quel par le bot.

## Tests

- Routes `missions/*` : tests unitaires côté `apps/web` sur la logique de verrouillage par `mission_id` et la contrainte d'unicité de `discord_channel_id` (même esprit que les tests existants sur `chat.ts`/`routines.ts`).
- `apps/bot` : pas de test e2e Discord (nécessiterait un vrai serveur Discord) ; à défaut, tests unitaires sur la logique pure (parsing des options de commande, construction des appels HTTP) si le volume de code le justifie une fois écrit.
