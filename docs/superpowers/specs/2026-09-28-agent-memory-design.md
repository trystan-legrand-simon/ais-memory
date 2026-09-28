# Mémoire par agent (brique "Memory" du framework ARMS)

Date : 2026-09-28
Statut : validé, prêt pour implémentation

## Contexte

Le framework personnel ARMS de l'utilisateur (Skills → Memory → Routines →
Applications) prévoit une brique "Memory" décrite dans ses notes comme
"Routeurs + a tree of files". Le terme "routeur" n'était pas défini plus
précisément par l'utilisateur ; une recherche web a montré que le pattern
correspondant, courant en 2026 pour la mémoire d'agents, est
"organize then retrieve" : une arborescence de fichiers navigable, avec un
fichier index qui sert de point d'entrée (le "routeur") listant chaque entrée
avec une description courte, plutôt qu'une recherche vectorielle plate. C'est
exactement le système de mémoire que Claude Code utilise pour lui-même
(`MEMORY.md` + fichiers individuels avec frontmatter). Ce design reprend ce
pattern, adapté à `apps/web`.

Deux stubs vides existaient déjà et sont remplacés par ce design :
- `app/api/v1/memory/route.ts` (route à plat) → remplacé par une route nichée
  sous l'agent, cohérente avec `agents/[slug]/chat` et `agents/[slug]/run`.
- `app/dashboard/memory/page.tsx` → devient la page décrite ci-dessous.

## Périmètre (v1)

- Mémoire **scopée par agent** (un arbre par slug, comme `.claude/agents/<slug>.md`).
- Écriture **manuelle uniquement** via la page `/dashboard/memory` — pas
  d'auto-extraction depuis les conversations.
- Stockage et consultation seulement — **pas d'injection automatique** dans
  les invocations du CLI (`invokeClaude`/`invokeClaudeStreaming`). Ce
  branchement est un chantier séparé, à traiter une fois ce stockage validé
  en usage réel.
- Pas de recherche dans l'UI — peu d'entrées attendues au démarrage.

## Stockage

Fichiers sur disque sous `.claude/memory/<slug>/`, **versionnés dans git**
(comme `.claude/agents/*.md`) — la mémoire d'un agent est aussi portable et
review-able que son prompt.

Chaque entrée est un fichier markdown avec frontmatter, parsé avec
`gray-matter` (déjà utilisé par `src/lib/agents.ts`, aucune nouvelle
dépendance) :

```md
---
title: Préférence de déploiement
description: L'agent redacteur-ais préfère toujours proposer 2 formulations sur les passages sensibles
updated: 2026-09-28T12:00:00.000Z
---

Contenu libre en markdown.
```

Le nom de fichier est un slug dérivé du titre à la création (ex:
`preference-de-deploiement.md`), stable ensuite même si le titre change.

`.claude/memory/<slug>/INDEX.md` liste toutes les entrées de l'agent (titre +
description, une ligne chacune). Contrairement à `MEMORY.md` (édité à la
main), cet index est **régénéré automatiquement** par l'API à chaque
création/modification/suppression d'entrée — pas d'étape manuelle, pas de
risque de désynchronisation.

Pas de taxonomie de type (user/feedback/project comme le système de Claude
Code) en v1 — juste titre, description, contenu.

## Module `src/lib/memory.ts`

Nouveau fichier, même style que `src/lib/agents.ts` / `src/lib/routines.ts` :

- `listMemoryEntries(slug): MemoryEntry[]` — lit tous les `.md` du dossier
  (hors `INDEX.md`), parse le frontmatter.
- `getMemoryEntry(slug, id): MemoryEntry | null`
- `createMemoryEntry(slug, { title, description, content }): MemoryEntry` —
  génère le slug de fichier, écrit le fichier, régénère `INDEX.md`.
- `updateMemoryEntry(slug, id, { title?, description?, content? }): MemoryEntry`
  — met à jour `updated`, régénère `INDEX.md`.
- `deleteMemoryEntry(slug, id): void` — supprime le fichier, régénère
  `INDEX.md`.
- `regenerateIndex(slug): void` — interne, appelée par les trois fonctions
  d'écriture ci-dessus.

Écriture atomique (write vers fichier temporaire puis rename), comme le fait
déjà `agents.ts` pour préserver le round-trip byte-exact des agents.

`MEMORY_DIR = path.join(REPO_ROOT, ".claude", "memory")` ajouté à
`repo-paths.ts`, à côté de `AGENTS_DIR`.

## API

Convention nichée, comme `chat` et `run` existants :

- `app/api/v1/agents/[slug]/memory/route.ts`
  - `GET` → liste des entrées (id, title, description, updated — pas le
    contenu complet, pour rester léger)
  - `POST` → crée une entrée (`{ title, description, content }`)
- `app/api/v1/agents/[slug]/memory/[id]/route.ts`
  - `GET` → entrée complète (avec contenu)
  - `PATCH` → met à jour une entrée
  - `DELETE` → supprime une entrée

Le stub existant `app/api/v1/memory/route.ts` est supprimé.

## UI — `app/dashboard/memory/page.tsx`

Même schéma que `/dashboard/chat` :

- Colonne de gauche : liste des agents (comme la page chat), sélection d'un
  agent.
- Colonne de droite : liste des entrées de mémoire de l'agent sélectionné
  (titre + description), bouton "Nouvelle entrée" en haut.
- Clic sur une entrée → éditeur inline (titre, description, corps markdown en
  `Textarea`) avec boutons Enregistrer / Supprimer.

Pas de mise à jour live via WebSocket pour cette page en v1 — la mémoire
n'est éditée qu'à un seul endroit (cette page), pas de risque de
désynchronisation multi-onglets à résoudre tout de suite (contrairement au
chat, où plusieurs onglets peuvent recevoir des messages).

## Erreurs

- Slug d'agent inconnu → `404` (même pattern que `chat`/`run` existants,
  vérifié via `getAgent(slug)`).
- Id d'entrée invalide ou inexistant → `404`.
- Titre vide à la création → `400`.

## Tests

`src/lib/memory.test.ts`, même esprit que `agents.test.ts` /
`routines.test.ts` :
- création → apparaît dans `listMemoryEntries` et dans `INDEX.md`.
- mise à jour → `updated` change, `INDEX.md` reflète la nouvelle description.
- suppression → disparaît de la liste et de `INDEX.md`.
- round-trip frontmatter (écrire puis relire donne les mêmes champs).

## Hors scope (explicitement différé)

- Injection automatique de la mémoire dans les invocations CLI.
- Auto-extraction de mémoire depuis les conversations de chat.
- Recherche dans l'UI.
- Taxonomie de types d'entrées.
- Mémoire partagée entre agents (chaque agent reste isolé en v1).
