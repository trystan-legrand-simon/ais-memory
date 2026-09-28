# AIS Memory

Ce dépôt regroupe plusieurs chantiers indépendants menés en parallèle.

## Dossier de projet TP AIS

Espace de travail pour le **TP Administrateur d'Infrastructures Sécurisées**
(AIS, RNCP37680, niveau 6) : rédaction du dossier de projet et du support de
soutenance.

- `ais-memory/main.md` — dossier de projet
- `ais-memory/[01]_Présentation/` — présentation du candidat, de l'entreprise,
  organigramme, parc informatique
- `ais-memory/[02]_Missions/` — brouillons des missions 1 à 3
- `.claude/skills/dossier-projet-ais/` — skill de rédaction/relecture/vérification
  de couverture par rapport au référentiel RNCP37680

Ce n'est pas du code : pas de build, lint ou test à exécuter sur cette partie.
Le détail de la démarche et des règles de rédaction est dans `CLAUDE.md`.

## Agent Dashboard (`apps/dashboard`)

Dashboard Next.js pour piloter les agents Claude Code définis dans
`.claude/agents/*.md` : graphe des agents, chat multi-tours en streaming,
lancement headless, éditeur de config, routines planifiées (cron
cross-platform), mises à jour live via WebSocket.

```bash
cd apps/dashboard
pnpm install
pnpm dev
```

Stack : Next.js (App Router) + shadcn/ui + React Flow, SQLite (`node:sqlite`)
pour l'historique de chat/runs/routines. Design docs des fonctionnalités dans
`docs/superpowers/specs/`.

## Socle Agentic OS (`packages/`)

Squelette du futur socle partagé de l'Agentic OS, indépendant du dashboard :

- `packages/core` — types et logique cœur
- `packages/runtime` — adaptateurs d'exécution (`claude`, `codex`, `ollama`)
- `packages/shared` — utilitaires partagés
- `packages/storage` — persistance
- `scripts/` — `dev.ts`, `build.ts`, `migrate.ts`
- `tests/integration`, `tests/e2e`

En construction — pas encore de code dedans.
