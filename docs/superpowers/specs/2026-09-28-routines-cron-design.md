# Routines planifiées (Cron) — design

Date : 2026-09-28
Statut : approuvé (brainstorming), en attente du plan d'implémentation

## Contexte et objectif

Le dashboard `apps/dashboard` sait déjà lancer un agent (`.claude/agents/*.md`) à la demande : `runAgent(slug)` (`src/lib/run-agent.ts`) spawn `claude -p --agent <slug> ...` en headless, capture le résultat et l'enregistre dans SQLite (table `runs`). Il manque la capacité de planifier ce même déclenchement de façon récurrente (ex. lancer `relecteur-jury` tous les soirs) sans intervention manuelle.

Contrainte clé validée avec l'utilisateur : le dashboard doit rester utilisable sur Windows, macOS et Linux. Une intégration scheduler native par OS (launchd/Task Scheduler/cron système) a été écartée : elle demanderait de coder et maintenir trois mécanismes différents pour un outil personnel, alors qu'un scheduler in-process portable suffit à l'usage visé.

## Hors scope (v1)

- Rattrapage des runs manqués si le dashboard était fermé à l'heure prévue (ignoré silencieusement).
- Expressions cron arbitraires (seulement présets quotidien/hebdomadaire à une heure donnée).
- Prompt personnalisé par routine (toujours le prompt par défaut de l'agent, identique au bouton "Lancer" existant).
- Notifications push (email, desktop, etc.) : les résultats des runs planifiés sont consultables a posteriori dans l'historique existant, pas de canal de notification actif en v1.
- Déclenchement fiable dashboard fermé (le scheduler ne tourne que pendant que `next dev`/`next start` est actif — limite assumée, cf. décision d'architecture ci-dessous).

## Décision d'architecture : scheduler in-process

Deux approches ont été comparées :

1. **In-process, portable** (retenue) — un `setInterval` côté serveur Next.js vérifie chaque minute les routines dues. Identique sur les trois OS, zéro dépendance ou intégration système. Limite assumée : ne se déclenche que si le process est en cours d'exécution au moment prévu.
2. **Intégration native par OS** (écartée) — plus fiable (dashboard fermé n'empêche pas le déclenchement) mais demande trois implémentations distinctes (plist launchd, `schtasks` Windows, crontab/systemd Linux), complexité disproportionnée pour un outil perso.

## Modèle de données

Nouvelle table dans `src/lib/db.ts` :

```sql
CREATE TABLE IF NOT EXISTS routines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  frequency TEXT NOT NULL,        -- 'daily' | 'weekly'
  time TEXT NOT NULL,             -- 'HH:MM', heure locale 24h
  day_of_week INTEGER,            -- 0 (dimanche) à 6 (samedi), NULL si daily
  enabled INTEGER NOT NULL DEFAULT 1,
  last_fired_at TEXT,             -- ISO 8601, NULL si jamais déclenchée
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_routines_enabled ON routines(enabled);
```

Les résultats d'exécution d'une routine sont enregistrés dans la table `runs` existante (même `slug`), sans champ supplémentaire — une routine ne fait que déclencher `runAgent(slug)`, qui écrit déjà dans `runs` indépendamment de l'origine (manuel ou planifié).

## Scheduler (`src/lib/scheduler.ts`)

- Démarré une seule fois au boot du serveur, avec le même pattern `globalThis` que `db.ts` pour survivre au hot-reload de `next dev` sans dupliquer l'intervalle.
- `setInterval` toutes les 60s : lit les routines `enabled = 1`, calcule si l'heure locale courante correspond à `time` (et `day_of_week` si `frequency = 'weekly'`), et que `last_fired_at` ne date pas déjà de la même minute.
- Routine due → appelle `runAgent(slug)` (fire-and-forget, ne bloque pas la boucle) et met à jour `last_fired_at`.
- Si `runAgent` lève `AgentAlreadyRunningError` (un run manuel ou une autre routine tourne déjà pour ce slug) → le déclenchement est ignoré pour ce passage, retenté naturellement à la prochaine échéance planifiée (pas de retry immédiat dans la même minute).
- Pas de rattrapage : si le process était arrêté à l'heure prévue, rien ne se passe au redémarrage — la routine reprendra simplement à sa prochaine échéance future.
- Si l'agent ciblé par une routine n'existe plus dans `.claude/agents/` au moment du check → la routine est automatiquement désactivée (`enabled = 0`), visible dans l'UI comme "agent introuvable".

## API routes (Next.js route handlers)

- `GET /api/v1/routines` — liste toutes les routines
- `POST /api/v1/routines` — crée une routine `{ slug, frequency, time, dayOfWeek? }` ; valide que `slug` correspond à un agent existant, que `time` est au format `HH:MM`, et que `dayOfWeek` est présent et dans `[0,6]` si `frequency = 'weekly'`
- `PATCH /api/v1/routines/[id]` — modifie un sous-ensemble de champs (toggle `enabled`, changement d'horaire)
- `DELETE /api/v1/routines/[id]` — supprime une routine

## UI — nouvelle page `/routines`

Ajoutée à la nav (`src/components/sidebar.tsx`), icône type `Clock`.

- Liste des routines existantes : agent cible, fréquence lisible en français ("tous les jours à 22:00", "tous les lundis à 09:00"), toggle actif/inactif, bouton supprimer, lien vers l'historique des runs de cet agent (filtre la page `/sessions` par `slug`)
- Formulaire de création : select agent (liste tirée de `GET /api/v1/agents`), select fréquence (Quotidien / Hebdomadaire), si Hebdomadaire → select jour de la semaine, time picker (`HH:MM`)
- Agent introuvable (supprimé après création de la routine) → badge d'état visuel, routine grisée, pas d'action possible sauf suppression

## Gestion des erreurs

- Payload de création invalide (agent inexistant, format d'heure invalide, `dayOfWeek` manquant en hebdo) → 400, message affiché dans le formulaire
- Routine introuvable sur `PATCH`/`DELETE` → 404 géré côté UI
- Toute erreur d'exécution du run planifié lui-même (CLI introuvable, exit code non nul) suit le chemin d'erreur déjà géré par `runAgent`/`recordRun` — rien de nouveau à gérer ici

## Tests

- `scheduler.test.ts` : logique "routine due maintenant ?" pour `daily` et `weekly`, avec `vi.useFakeTimers()` pour contrôler l'heure simulée — pas de test sur un vrai intervalle de 60s qui tourne en réel
- Tests CRUD sur la table `routines` dans `db.ts` (round-trip création → lecture → mise à jour → suppression), même approche que les tests existants sur `chat_sessions`/`runs`
- Pas de suite e2e (cohérent avec le reste du dashboard en v1)
