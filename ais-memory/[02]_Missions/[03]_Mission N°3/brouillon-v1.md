---

# Mission 3 - Mise en place d'une solution de détection et de traitement des incidents de sécurité (Wazuh)

---

# Mission N°3 - Mise en place d'une solution de détection et de traitement des incidents de sécurité (Wazuh)

> **Note de cadrage** : contrairement aux Missions 1 et 2, réalisées dans le cadre de mon alternance chez Thales, cette mission est un **projet personnel complémentaire**, mené en autonomie sur un lab que je monte chez moi (Hyper-V sur Windows 11 Pro). Je le présente ainsi explicitement plutôt que comme une mission d'entreprise : il n'y a pas de hiérarchie à valider, pas d'impact sur la production de Thales, et je le dis clairement au jury. La raison d'être de ce projet est expliquée en §1.
>
> ⚠️ **À vérifier avant de conserver cette mission dans le dossier final** : confirmer auprès de l'organisme de formation qu'un projet personnel réalisé hors entreprise peut être présenté comme une mission du dossier. Si ce n'est pas accepté, il faudra soit chercher une activité réelle chez Thales pour BC03, soit adapter la présentation (ex. l'intégrer en annexe plutôt qu'en tant que "Mission").
>
> ⚠️ **État d'avancement** : ce brouillon couvre ce qui est *prévu*. Le lab n'est pas encore réalisé — les sections 5 (mise en œuvre), 6 (résultat mesurable) devront être réécrites au passé une fois le lab effectivement monté et testé, avec les preuves réelles (captures, logs, extraits de règles) à l'appui.

## 1. Contexte et problématique

Dans le cadre de mon alternance chez Thales, les Missions 1 et 2 couvrent respectivement l'administration/sécurisation des infrastructures réseau, systèmes et virtualisées (BC01) et la conception/mise en œuvre d'une solution de supervision (BC02). En revanche, je n'ai pas eu l'occasion de participer à une activité de détection et de traitement d'incidents de sécurité (BC03) durant mon alternance.

Pour combler ce manque et démontrer cette compétence du référentiel, j'ai décidé de mettre en place, en autonomie et sur mon propre matériel, une solution de détection d'incidents basée sur Wazuh (SIEM/EDR open source), afin de simuler un scénario réaliste de détection et de traitement d'un incident de sécurité.

## 2. Impact

Ce projet n'a pas d'impact sur la production ou l'organisation de Thales — ce n'est pas son objet. Son impact est double :
- pour mon dossier de certification, il permet de démontrer concrètement une compétence du bloc BC03 qui ne pouvait pas être illustrée par une mission professionnelle ;
- pour ma pratique, il me permet de manipuler un outil de détection d'incidents (analyse de logs, règles de détection, réponse à incident) que je compte approfondir dans la suite de mon parcours (Pentesting / Red Teaming).

## 3. Parties prenantes

Ce projet est mené seul, en dehors du cadre professionnel : il n'y a pas de validation hiérarchique ni de collaboration d'équipe à ce stade. Je le précise pour rester honnête sur le contexte si la question m'est posée en entretien.

## 4. Planning prévisionnel

*[À compléter : sur quelle période comptez-vous réaliser ce lab, et par rapport à quelle date de rendu du dossier ?]*

## 5. Grandes étapes de réalisation

### 5.1 Analyse du besoin

Le besoin est de disposer d'un environnement permettant de détecter et de tracer un incident de sécurité de bout en bout : une action suspecte sur une machine, sa détection par l'outil, l'alerte générée, et la réponse apportée.

### 5.2 Choix et architecture de la solution

J'ai choisi Wazuh (fork open source d'OSSEC, avec indexer et dashboard intégrés) plutôt qu'une solution commerciale, pour sa gratuité et parce que c'est un outil largement utilisé en entreprise et couvert par la certification.

Architecture prévue :
- Hyperviseur : Hyper-V sur Windows 11 Pro
- 1 VM Linux (Ubuntu ou Debian) hébergeant Wazuh manager + indexer + dashboard (déploiement all-in-one)
- 1 VM Linux cible avec agent Wazuh installé, pour un scénario de bruteforce SSH
- 1 VM Windows cible avec agent Wazuh installé, pour un scénario de File Integrity Monitoring sur un dossier sensible

### 5.3 Installation et sécurisation du serveur Wazuh

*[À rédiger après réalisation : étapes d'installation, mesures de durcissement appliquées au serveur Wazuh lui-même]*

### 5.4 Déploiement des agents et configuration de la détection

*[À rédiger après réalisation : déploiement des agents sur les VM cibles, règles/decoders configurés ou personnalisés, activation du FIM]*

### 5.5 Scénario de test et preuve de détection

Scénario prévu : tentative de connexion SSH échouée de manière répétée sur la VM Linux cible, devant déclencher une règle Wazuh et générer une alerte visible dans le dashboard — capture d'écran de l'alerte à joindre en preuve.

*[À compléter après réalisation avec le résultat réel du test]*

### 5.6 Documentation

*[À rédiger après réalisation]*

## 6. Résultat mesurable

*[À compléter après réalisation effective du lab : nombre d'agents déployés, exemple réel d'alerte détectée et traitée avec capture/log à l'appui — c'est la preuve la plus importante pour cette mission, elle ne doit pas rester générique]*

## 7. Compétences mobilisées

### BC03 - Participer à la gestion de la cybersécurité

- Participer à la mesure et à l'analyse du niveau de sécurité de l'infrastructure : *à confirmer selon ce que le scénario de test permet réellement de démontrer*
- Participer à la détection et au traitement des incidents de sécurité : couverte par le scénario de détection (§5.5) une fois réalisé et prouvé

---
