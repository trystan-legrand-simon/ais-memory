# AIS Memory

Ce dépôt regroupe deux chantiers indépendants menés en parallèle.

## Dossier de projet TP AIS

Espace de travail pour le **TP Administrateur d'Infrastructures Sécurisées**
(AIS, RNCP37680, niveau 6) : rédaction du dossier de projet et du support de
soutenance.

- `Mémoire AIS/main.md` — dossier de projet
- `Mémoire AIS/Présentation/` — support de soutenance (40 min)
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
