# Live updates (WebSocket) — design

Date : 2026-09-28
Statut : approuvé (brainstorming), en attente du plan d'implémentation

## Contexte et objectif

Le dashboard `apps/dashboard` n'a aujourd'hui aucun mécanisme de mise à jour live : chaque page (`/graph`, `/sessions`, `/routines`, `/chat`) ne fetch ses données qu'une fois, au montage (`useEffect`). Le besoin déclencheur vient de la feature Routines/Cron (`docs/superpowers/specs/2026-09-28-routines-cron-design.md`) : une routine planifiée se déclenche en tâche de fond via le scheduler in-process, et son résultat n'apparaît qu'après un rechargement manuel de `/sessions` ou `/routines`.

Décision de périmètre validée avec l'utilisateur : couvrir tout le dashboard concerné par des événements serveur→client (runs, routines, messages de chat), pas seulement les pages liées aux routines.

## Hors scope (v1)

- Streaming token par token du chat : le CLI `claude -p --output-format json` (`src/lib/claude-cli.ts`) ne renvoie le résultat qu'une fois l'exécution terminée ; ça reste inchangé. Le live se limite à pousser le message complet dès qu'il est prêt, pas à l'afficher au fil de sa génération.
- Filtrage/topics côté serveur WS : un seul canal, broadcast à tous les clients connectés (outil local mono-utilisateur).
- Historique/replay des événements manqués pendant une déconnexion : au reconnect, le client garde les données de son dernier fetch REST, pas de rattrapage des événements WS manqués entre-temps (cohérent avec la limite déjà acceptée pour les routines : pas de rattrapage).
- Authentification/sécurisation du canal WS (outil local, usage personnel, même hypothèse que le reste du dashboard).

## Architecture

Next.js App Router ne supporte pas nativement une connexion WebSocket persistante dans ses route handlers. Décision actée avec l'utilisateur : un **process WS séparé**, indépendant du process Next.js.

- Nouveau fichier `src/ws-server.ts` : démarre un serveur `ws` (lib `ws`, nouvelle dépendance) sur un port dédié, `4001` par défaut (configurable via `WS_PORT` si besoin plus tard, pas exposé en v1).
- Ce process **lit SQLite en lecture seule** (même fichier `.data/dashboard.sqlite` que le process Next.js, via `node:sqlite`) — aucune communication inter-process à construire, la DB est déjà la source de vérité partagée entre les deux process.
- Toutes les ~1.5s, il interroge les tables `runs`, `routines`, `chat_messages` pour les lignes plus récentes qu'un curseur en mémoire par table (`last_seen_id`, initialisé au démarrage à `MAX(id)` de chaque table pour ne pas rejouer l'historique existant au lancement).
- Toute nouvelle ligne détectée devient un événement broadcasté à tous les clients WS connectés :
  ```json
  { "type": "run", "data": { /* RunRecord */ } }
  { "type": "routine", "data": { /* Routine */ } }
  { "type": "chat_message", "data": { "slug": "...", "role": "...", "content": "...", "createdAt": "..." } }
  ```
- Pour `routines`, le curseur suit aussi les updates (pas seulement les inserts), puisque `enabled`/`lastFiredAt` changent sur une ligne existante plutôt que d'en créer une nouvelle — détection par comparaison de `last_fired_at`/`enabled` face à un instantané précédent de chaque routine, gardé en mémoire dans le process WS.

## Lancement

- Nouvelle dev dependency : `ws` (serveur) et `concurrently` (orchestration des process).
- `package.json` du dashboard : le script `dev` devient `concurrently "next dev" "tsx src/ws-server.ts"` (`tsx` déjà nécessaire pour exécuter le `.ts` du process WS sans étape de build ; `start` suit le même principe avec la version compilée).
- Aucun changement pour l'utilisateur : `make dev` / `pnpm dev` lance toujours tout en une seule commande.

## Client (`src/lib/use-live-events.ts`)

- Hook partagé `useLiveEvents(onEvent: (event: LiveEvent) => void)` : ouvre une connexion `WebSocket` native vers `ws://localhost:4001`, appelle `onEvent` à chaque message reçu, gère la reconnexion automatique avec un backoff simple (ex. retry à 1s, 2s, 5s puis toutes les 5s) si la connexion tombe.
- Le WS est un **enrichissement, jamais une dépendance dure** : si le process WS n'est pas joignable (ex. tout premier lancement, port occupé), chaque page reste fonctionnelle avec son fetch REST initial existant — juste sans mise à jour live. Le hook échoue silencieusement en arrière-plan et continue de retenter la connexion.

## Intégration par page

- **`/sessions`** : sur un événement `run`, insère la nouvelle exécution en tête de la liste locale (ou met à jour si l'`id` existe déjà) sans refetch complet.
- **`/routines`** : sur un événement `routine`, met à jour `lastFiredAt`/`enabled` de la routine correspondante dans la liste locale par `id`.
- **`/graph`** : le panneau latéral (`Sheet`) d'un agent ouvert écoute les événements `run` dont le `slug` correspond à l'agent affiché, et met à jour `RunOutputPanel` (statut + sortie) en conséquence — couvre le cas où une routine déclenche cet agent pendant que le panneau est ouvert, invisible aujourd'hui.
- **`/chat`** : sur un événement `chat_message` pour l'agent actif, ajoute le message à la conversation affichée si son `id`/contenu n'y est pas déjà — couvre le cas d'un message ajouté depuis un autre onglet/une autre fenêtre du dashboard.
- Pages non concernées (`/dossier`, `/config`, `/settings`) : aucun changement, restent en fetch-on-mount uniquement.

## Gestion des erreurs

- Process WS indisponible ou pas encore démarré → chaque page reste fonctionnelle via son fetch REST initial (cf. section Client ci-dessus) ; pas de message d'erreur visible pour l'utilisateur, juste absence de live jusqu'à reconnexion.
- Erreur de lecture SQLite côté process WS (ex. fichier verrouillé pendant une écriture concurrente) → le tick de poll en cours est ignoré, retenté au tick suivant (~1.5s après), pas de crash du process WS.
- Message WS malformé côté client → ignoré silencieusement (pas de crash de page).

## Tests

- `ws-server.test.ts` : logique de détection de nouveauté par curseur — nouvelles lignes `runs`/`chat_messages` (inserts), changements `routines` (updates sur `enabled`/`last_fired_at`) — isolée de la vraie boucle réseau/poll temporisée, testable en appelant directement la fonction de diff avec un état de curseur donné.
- Pas de test e2e sur la connexion WebSocket elle-même (cohérent avec l'absence de suite e2e dans le reste du dashboard).
