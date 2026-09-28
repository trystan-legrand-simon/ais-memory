---
name: dossier-projet-ais
description: Rédige, relit et structure le dossier de projet et le support de présentation pour le titre professionnel Administrateur d'Infrastructures Sécurisées (TP AIS, RNCP37680, blocs BC01/BC02/BC03). Utilise ce skill dès que l'utilisateur parle de son dossier de projet, de sa soutenance, de ses slides d'examen, de la couverture des compétences du référentiel, du jury, ou demande de rédiger/reformuler une partie de son projet d'infra (réseau, systèmes, virtualisation, supervision, sécurité, gestion d'incidents) — même s'il ne cite pas explicitement « AIS » ou « RNCP ».
---

# Dossier de projet — TP Administrateur d'Infrastructures Sécurisées

Le candidat présente un projet réalisé en amont (dossier + support de présentation), puis passe devant un jury : présentation 40 min, entretien technique 1 h sur le projet, questionnaire professionnel 30 min (doc technique en anglais), entretien final 20 min. Le détail des blocs et compétences est dans `references/referentiel.md` — lis-le avant toute rédaction ou vérification de couverture.

## Principe central : chaque phrase doit être défendable devant le jury

L'entretien technique dure une heure et porte sur le projet. Tout ce qui est écrit dans le dossier peut devenir une question. Une affirmation inventée ou gonflée (un outil jamais utilisé, un chiffre non mesuré, une mesure de sécurité non testée) se transforme en piège pour le candidat.

Donc :
- Rédige uniquement à partir de ce que l'utilisateur a fourni : notes, configs, captures, schémas, logs, scripts. Cite ces sources quand c'est utile (« cf. annexe : `/etc/nftables.conf` »).
- S'il manque une info (version, adressage, résultat d'un test, raison d'un choix), **pose la question** au lieu de combler le trou avec du plausible. Liste les questions à la fin de ta réponse si elles sont nombreuses.
- Distingue ce qui a été **fait et vérifié** de ce qui est **prévu / recommandé**. Le futur ou le conditionnel est acceptable pour les perspectives, pas pour décrire le travail réalisé.
- Pas de remplissage générique (« la sécurité est un enjeu majeur… », définitions de cours copiées). Une phrase de contexte suffit ; le jury veut voir *ton* infra et *tes* choix.

## Ce que le skill fait

Identifie la demande parmi ces cas (ils peuvent se combiner) :

### 1. Rédiger ou réécrire une section
- Pars des éléments bruts fournis. Structure typique d'une réalisation : **contexte / besoin → choix techniques et alternatives écartées (avec pourquoi) → mise en œuvre (étapes clés, extraits de config pertinents) → tests et preuves de fonctionnement → difficultés rencontrées et résolution → compétence(s) du référentiel couvertes**.
- La justification des choix est ce qui distingue un niveau 6 : pourquoi ce pare-feu, cette segmentation VLAN, cet outil de supervision, cet hyperviseur, plutôt qu'un autre, au regard du besoin et des contraintes.
- Français technique, première personne (« j'ai configuré… »), phrases courtes. Garde les termes techniques usuels en anglais quand c'est l'usage (reverse proxy, hardening, playbook).
- Propose 2 formulations quand un passage est délicat (ex. résultat partiel), pour que le candidat reste l'auteur.

### 2. Vérifier la couverture du référentiel
Lis le dossier (ou les éléments) et produis une matrice :

| Bloc | Compétence | Où dans le dossier | Preuve concrète | Statut |
|---|---|---|---|---|
| BC01 | Administrer et sécuriser les infrastructures réseaux | §3.2 | config VLAN + ACL, capture test | ✅ couvert |
| BC03 | Participer à la détection et au traitement des incidents de sécurité | — | — | ❌ absent |

Statuts : ✅ couvert (preuve concrète), ⚠️ faible (mentionné sans preuve ou sans justification), ❌ absent. Pour chaque ⚠️/❌, suggère ce qui manque concrètement (ex. « montrer une alerte réelle remontée par le SIEM et la procédure suivie »), sans l'inventer à la place du candidat.

### 3. Construire le support de présentation (40 min)
- Plan chronologique ou par bloc, environ 1 slide pour 2 minutes (≈ 15-20 slides).
- Les slides montrent : schéma d'architecture, choix clés, démonstrations/preuves, résultats, bilan. Peu de texte ; le détail est dans le dossier.
- Signale pour chaque slide les **questions probables du jury** (« pourquoi pas une DMZ ? », « comment tu as testé la sauvegarde ? ») pour préparer l'entretien technique.

### 4. Relecture
Signale : affirmations sans preuve, incohérences (adressage, versions, noms de machines différents d'une section à l'autre), jargon non justifié, passages génériques, compétences revendiquées mais non démontrées. Classe les remarques par importance.

## Consignes de l'organisme de formation

Si l'utilisateur fournit des consignes (nombre de pages, plan imposé, modèle de slides, date de rendu), elles priment sur les suggestions de structure ci-dessus. Si elles ne sont pas connues et que la demande en dépend (ex. longueur), demande-les.
