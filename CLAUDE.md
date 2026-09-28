# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Nature du dépôt

Ce n'est pas un projet de code : c'est l'espace de travail d'un candidat au **TP Administrateur d'Infrastructures Sécurisées (AIS, RNCP37680, niveau 6)**, pour rédiger le dossier de projet et le support de soutenance. Pas de build, lint ou test à exécuter ici.

## Structure

- `Mémoire AIS/main.md` — le dossier de projet en cours de rédaction (vide pour l'instant).
- `Mémoire AIS/Présentation/` — le support de présentation pour la soutenance (40 min), à construire.
- `.claude/skills/dossier-projet-ais/SKILL.md` — skill dédiée qui pilote toute rédaction/relecture/vérification de couverture liée au dossier.
- `.claude/skills/dossier-projet-ais/references/referentiel.md` — référentiel officiel RNCP37680 (blocs BC01/BC02/BC03, modalités d'évaluation). À lire avant toute rédaction ou vérification de couverture.

## Règle centrale (portée par la skill `dossier-projet-ais`)

Le candidat passe 1 h d'entretien technique sur ce qu'il a écrit : toute affirmation doit être défendable devant le jury.

- Ne rédiger qu'à partir de ce que l'utilisateur fournit (notes, configs, captures, logs, schémas). Ne jamais inventer un outil, un chiffre ou un test non fourni.
- S'il manque une info, poser la question plutôt que de combler avec du plausible.
- Distinguer clairement ce qui est **fait et vérifié** de ce qui est **prévu/recommandé**.
- Éviter le remplissage générique type définitions de cours ; le jury veut voir l'infra et les choix du candidat.

## Sous-agents disponibles (`.claude/agents/`)

Quatre agents projet, tous en lecture seule (Read/Grep/Glob) et ancrés sur le même principe (ne jamais inventer, distinguer fait/prévu, poser les questions manquantes) :

- `relecteur-jury` — relit le dossier avec un regard de jury externe (affirmations sans preuve, incohérences, remplissage générique).
- `verificateur-referentiel` — produit la matrice de couverture BC01/BC02/BC03 (compétence → preuve → statut).
- `preparateur-questions-jury` — génère les questions probables de l'entretien technique et signale celles sans réponse prête.
- `redacteur-ais` — rédige/reformule une section à partir du matériel brut fourni, propose 2 formulations sur les passages délicats.

## Configuration du dépôt

- `.claude/settings.json` : réponses en français, accès en lecture/écriture restreint au dépôt, secrets (`.env`, clés, `.kdbx`) explicitement bloqués en lecture, `WebFetch` limité à francecompetences.fr et travail-emploi.gouv.fr (sources officielles du référentiel).
