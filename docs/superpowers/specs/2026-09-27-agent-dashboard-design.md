# Dashboard graphe d'agents — design

Date : 2026-09-27
Statut : approuvé (brainstorming), en attente du plan d'implémentation

## Contexte et objectif

Ce dépôt sert à rédiger le dossier de projet du TP Administrateur d'Infrastructures Sécurisées (AIS, RNCP37680). Il contient déjà 4 sous-agents projet en lecture seule (`.claude/agents/`) qui assistent la rédaction :

- `relecteur-jury`
- `verificateur-referentiel`
- `preparateur-questions-jury`
- `redacteur-ais`

L'idée de départ (« Agentic OS », une interface façon bureau pour agents) a été volontairement réduite en premier sous-projet concret et utile immédiatement : un dashboard web local qui visualise ces 4 agents comme un graphe de nœuds/liens, permet de les éditer, de définir l'ordre recommandé du pipeline entre eux, de les lancer, et d'éditer le contenu du mémoire (fichiers Markdown de `Mémoire AIS/`).

Ce dashboard est le premier module du futur monorepo « Agentic OS » ; il ne construit pas le shell de bureau plus large (fenêtres, autres apps) — seulement cette brique.

## Hors scope (v1)

- Exécution automatique de la chaîne complète du pipeline (un agent à la fois uniquement)
- Aperçu markdown rendu dans l'éditeur de dossier (texte brut uniquement)
- Shell façon bureau/OS, autres « apps »
- Authentification / multi-utilisateur (outil local, usage personnel)

## Architecture

- Monorepo pnpm (le `pnpm-workspace.yaml` existant à la racine du dépôt sera renseigné).
- Une app Next.js (App Router, TypeScript) sous `apps/dashboard`.
- Tailwind CSS + shadcn/ui pour les composants d'interface.
- React Flow pour le rendu du graphe de nœuds/liens.
- Pas de backend séparé : les API routes Next.js (route handlers) font office de backend pour la lecture/écriture de fichiers et l'exécution du CLI Claude Code.
- Deux vues principales, navigables via une barre d'onglets shadcn (`Tabs` ou sidebar) : **Graphe** et **Dossier**.

## Modèle de données

Aucune duplication des données existantes :

- Chaque nœud du graphe est lu **en direct** depuis `.claude/agents/<slug>.md` (frontmatter YAML : nom, description, outils autorisés ; corps : prompt système).
- Un nouveau fichier `.claude/agents/graph.json` stocke uniquement ce qui n'existe pas déjà ailleurs :
  - positions des nœuds dans le canvas : `{ "id": "<slug>", "x": number, "y": number }`
  - liens du pipeline : `{ "from": "<slug>", "to": "<slug>" }`, représentant l'ordre d'exécution recommandé (pas une dépendance de données stricte, pas d'exécution automatique en chaîne).

Éditer un agent depuis le dashboard réécrit son fichier `.md` (frontmatter + corps). Éditer/ajouter/retirer un lien ou déplacer un nœud réécrit `graph.json`.

## Vue Graphe

- Canvas React Flow avec un nœud par agent existant dans `.claude/agents/`.
- Les liens définis dans `graph.json` sont rendus comme des flèches entre nœuds ; l'utilisateur peut en créer/supprimer par interaction directe sur le canvas (React Flow gère nativement le tracé de liens).
- Cliquer sur un nœud ouvre un panneau latéral (`Sheet` shadcn) contenant :
  - un formulaire éditable : nom, description, outils autorisés, prompt (textarea), avec bouton Enregistrer
  - un bouton **Lancer** qui déclenche l'exécution de cet agent
  - une zone de sortie affichant le statut (idle / en cours / succès / erreur) et la sortie (stdout/stderr) de la dernière exécution
- Un seul agent à la fois peut être lancé par nœud ; le bouton Lancer est désactivé pendant qu'une exécution est en cours pour ce nœud. Pas de file d'attente ni d'exécution en chaîne en v1.

## Vue Dossier

- Layout deux colonnes (`Resizable` shadcn) :
  - gauche : arborescence des fichiers `.md` sous `Mémoire AIS/` (liste récursive simple, pas de composant tree dédié nécessaire)
  - droite : `Textarea` liée au fichier sélectionné, bouton Enregistrer
- Pas d'aperçu markdown rendu en v1.

## API routes (Next.js route handlers)

- `GET /api/agents` — liste les agents en parsant le frontmatter de chaque `.claude/agents/*.md`
- `PATCH /api/agents/[slug]` — réécrit le fichier agent (frontmatter + corps)
- `GET /api/graph` — lit `graph.json` (le crée vide si absent)
- `PUT /api/graph` — écrit `graph.json`
- `POST /api/agents/[slug]/run` — exécute l'agent en mode headless via le CLI Claude Code sur ce dépôt, capture stdout/stderr et le code de sortie
- `GET /api/files` — liste les fichiers `.md` sous `Mémoire AIS/`
- `GET /api/files/[...path]` — lit le contenu d'un fichier
- `PUT /api/files/[...path]` — écrit le contenu d'un fichier

Toutes les routes de fichiers valident que le chemin résolu reste à l'intérieur du dépôt (garde anti path-traversal), même si l'outil est destiné à un usage local.

**Point ouvert à résoudre pendant l'implémentation** : la syntaxe exacte du CLI Claude Code pour lancer un sous-agent précis en mode headless/non-interactif sur ce dépôt et en récupérer la sortie programmatiquement. Ne pas inventer ce flag — le vérifier (documentation CLI, `claude --help`) avant d'écrire `POST /api/agents/[slug]/run`.

## Gestion des erreurs

- CLI introuvable ou code de sortie non nul → statut `error` dans le panneau, stderr affiché, pas de crash de l'app.
- Écriture de fichier hors du dépôt → requête rejetée (400).
- Lecture d'un agent/fichier inexistant → 404 géré côté UI (message, pas de page blanche).

## Tests

- Vérification de types (`tsc --noEmit`) sur `apps/dashboard`.
- Tests unitaires ciblés sur le parsing/réécriture du frontmatter des agents (round-trip lecture → écriture → relecture ne doit pas corrompre le fichier), qui est le point le plus risqué (fichiers `.claude/agents/*.md` utilisés ailleurs par Claude Code).
- Pas de suite e2e en v1.
