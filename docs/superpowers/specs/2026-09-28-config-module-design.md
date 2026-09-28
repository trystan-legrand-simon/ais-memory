# Dashboard — module Configuration (`.claude/settings.json`) — design

Date : 2026-09-28
Statut : approuvé (brainstorming), en attente du plan d'implémentation

## Contexte et objectif

Le dashboard (`apps/dashboard`, cf. `docs/superpowers/specs/2026-09-27-agent-dashboard-design.md`) couvre aujourd'hui trois sources de vérité du dépôt : les agents (`.claude/agents/*.md`), l'ordre du pipeline (`.claude/agents/graph.json`) et le dossier de mémoire (`Mémoire AIS/*.md`). Il ne couvre pas `.claude/settings.json` — le fichier qui contrôle les permissions accordées à Claude Code (règles `allow`/`deny`), les hooks, et divers réglages (modèle, langue, worktree...).

Le déclencheur : deux modifications récentes de `.claude/` ont été faites à la main (ajout de règles `deny` bloquant la lecture de secrets via Bash, correction d'un agent). La première n'a aucune UI dans le dashboard ; la seconde en a déjà une (éditeur d'agent existant sur `/graph`). Ce module comble ce manque pour `settings.json` uniquement.

C'est la brique 2 d'une vision plus large ("Agentic OS", cf. mémoire projet) qui a été volontairement redécoupée en une nouvelle brique ciblée, plutôt que de spécifier le shell/bureau complet d'un coup — même logique de réduction de scope qui avait produit la brique 1 (le dashboard actuel).

## Hors scope (v1 de ce module)

- Édition de `.claude/skills/` (SKILL.md, references/) — pas de besoin actif identifié, remis à une brique future si le besoin apparaît.
- Édition de `.claude/settings.local.json` — le fichier n'existe pas dans ce dépôt aujourd'hui.
- Formulaire structuré dédié pour `hooks`, `env`, `worktree` — traités en JSON brut (voir Modèle de données).
- Constructeur de règle de permission par outil/paramètre — les règles restent des chaînes libres au format Claude Code (ex. `Bash(cat *.env*)`).
- Authentification / multi-utilisateur (inchangé depuis la brique 1 : outil local, usage personnel).
- Historique des versions / undo au-delà de l'écriture atomique (pas de diff, pas de rollback UI).

## Architecture

- Nouvelle page `app/config/page.tsx`, séparée de `/settings` (qui reste dédiée à l'état runtime du dashboard lui-même — CLI, chemins, reset de chat — et n'édite aucun fichier du dépôt cible).
- Nouvelle entrée de navigation "Config" dans la sidebar (icône `ShieldCheck`, `lucide-react`), positionnée après "Dossier" dans `NAV`.
- Pas de nouveau backend séparé : une route API Next.js de plus, même pattern que l'existant (`/api/v1/graph`).
- Nouveau composant shadcn à ajouter au projet : `alert-dialog` (absent aujourd'hui de `src/components/ui/`), utilisé pour la confirmation de suppression d'une règle `deny`.

## Modèle de données

Aucune duplication : `.claude/settings.json` reste la seule source de vérité, lu et réécrit directement.

`src/lib/settings.ts` (nouveau fichier, même famille que `agents.ts`/`files.ts`) :

- `readSettings(): Promise<Record<string, unknown>>` — lit le fichier, `JSON.parse`. Si le JSON est invalide (édition manuelle cassée), lève une erreur explicite (pas de tentative de réparation automatique).
- `writeSettings(next: Record<string, unknown>): Promise<void>` — sérialise avec `JSON.stringify(next, null, 2)` + retour à la ligne final, écrit dans un fichier temporaire (`settings.json.tmp`) puis `fs.rename` vers `settings.json` (écriture atomique : une écriture interrompue ne doit jamais laisser le fichier de permissions dans un état tronqué).
- Le serveur ne mute que les clés effectivement modifiées par l'UI avant de rappeler `writeSettings` avec l'objet complet — comme `agents.ts` évite `matter.stringify` pour ne pas reformatter tout le fichier, on ne touche jamais aux clés que l'utilisateur n'a pas éditées, pour préserver leur ordre et leur formatage (`JSON.parse` préserve l'ordre d'insertion des clés ; on le garde donc intact tant qu'on ne fait que des mutations ciblées, jamais un objet reconstruit de zéro).

Validation serveur (dans la route API, avant `writeSettings`) :
- le body doit être un objet JSON (pas un tableau, pas un scalaire) ;
- si `permissions` est présent, `permissions.allow` et `permissions.deny` doivent être des tableaux de strings s'ils existent ;
- toute autre clé passe telle quelle (le module ne valide pas la sémantique de `hooks`/`env`/`worktree`, seulement leur forme JSON générique).

## UI — rendu générique par type de valeur

Pour chaque clé top-level du fichier sauf `$schema` et `permissions` :
- **valeur scalaire** (string/number/boolean, ex. `language`, `model`, `editorMode`, `teammateMode`, `autoUpdatesChannel`, `cleanupPeriodDays`) → un champ `Input` simple, libellé par le nom de la clé, avec la valeur actuelle. Type `number` pour les valeurs numériques, `text` sinon (pas de validation d'enum : on ne code pas en dur une liste de valeurs autorisées non observée dans le fichier). Tous les champs scalaires partagent un seul bouton "Enregistrer" pour cette section (un seul `PUT` pour l'ensemble des scalaires modifiés).
- **objet/tableau** (ex. `hooks`, `env`, `worktree`, `modelSettings`) → un bloc `Textarea` contenant le JSON de cette sous-section, avec son propre bouton "Enregistrer" (un `PUT` par bloc, indépendant des autres) ; erreur de parsing affichée inline sans bloquer les autres blocs.
- `$schema` → affiché en lecture seule (texte informatif), non éditable.

Granularité de sauvegarde, résumée : la section Permissions sauvegarde immédiatement à chaque ajout/suppression de règle (pas de bouton Enregistrer différé — une règle ajoutée ou supprimée est un événement discret) ; la section scalaires a un bouton Enregistrer unique pour tous ses champs ; chaque bloc JSON a son propre bouton Enregistrer indépendant.

Ce rendu est dérivé dynamiquement des clés présentes dans le fichier lu — aucune liste de clés connues codée en dur côté UI, pour ne pas devenir obsolète si le fichier évolue.

**Section Permissions** (traitement dédié, au-dessus du rendu générique) :
- Deux listes, `Allow` et `Deny`, chaque règle affichée en ligne avec un bouton de suppression.
- Un champ texte + bouton "Ajouter" par liste, pour saisir une nouvelle règle brute (même format que le fichier, ex. `Read(./**/*.pem)`).
- Supprimer une règle de la liste `Deny` déclenche une confirmation (`AlertDialog`) — ces règles bloquent typiquement l'accès à des secrets, donc un clic accidentel ne doit pas rouvrir un accès sensible silencieusement. Aucune confirmation sur `Allow`.
- Chaque changement (ajout/suppression d'une règle, scalaire modifié, bloc JSON enregistré) déclenche un `PUT` complet vers `/api/v1/settings` avec l'objet entier reconstruit côté client à partir de l'état affiché.

## API routes

- `GET /api/v1/settings` — retourne `readSettings()` tel quel (JSON).
- `PUT /api/v1/settings` — valide le body (voir Modèle de données), appelle `writeSettings()`, retourne l'objet écrit.

## Gestion des erreurs

- JSON invalide sur disque à la lecture → `GET` retourne une erreur explicite ; la page `/config` affiche une bannière d'erreur avec le message, le reste du dashboard (autres pages) n'est pas affecté.
- Body invalide à l'écriture (mauvaise forme JSON, `permissions.allow`/`deny` pas un tableau de strings) → `PUT` rejeté (400), message affiché dans l'UI, aucune écriture disque.
- Échec d'écriture disque (permissions fichier, disque plein...) → erreur remontée à l'UI ; l'écriture atomique garantit que `settings.json` existant n'est pas corrompu par une écriture partielle.

## Tests

- `settings.test.ts` (vitest, même convention que `agents.test.ts`) : round-trip lecture → modification d'un seul champ (un scalaire, puis une règle de permission) → écriture → relecture, en vérifiant que tous les champs non touchés (y compris l'ordre des clés et des règles non modifiées) restent strictement identiques à l'original. C'est le point le plus risqué : ce fichier contrôle les permissions réelles de Claude Code sur ce dépôt.
- Vérification de types (`tsc --noEmit`) sur `apps/dashboard`, comme pour le reste du projet.
- Pas de suite e2e (cohérent avec la brique 1).
