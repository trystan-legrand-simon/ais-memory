# Dossier de projet — TP Administrateur d'Infrastructures Sécurisées (RNCP37680)

> Document de travail assemblé à partir des fiches de présentation et des brouillons de mission (`ais-memory/`). Les passages marqués **[À VÉRIFIER]** ou **[À COMPLÉTER]** reprennent les zones d'incertitude déjà identifiées dans les brouillons sources ; ils ne doivent pas être présentés au jury tels quels.

---

## 1. Présentation

### 1.1 Présentation du candidat

Ancien chauffeur Poids Lourd et Super Poids Lourd, passionné par le monde informatique et la tech, je me suis formé de manière autodidacte dans plusieurs disciplines techniques tels que le développement web, l'administration systèmes et réseaux puis la cybersécurité.

Je suis actuellement en alternance chez Thales, sur le site de Gémenos, où j'occupe un poste d'apprenti en administration systèmes, sûreté, sécurité et cybersécurité. J'y interviens notamment sur la gestion et la supervision du contrôle d'accès et d'intrusion, ce qui constitue le périmètre principal des missions présentées dans ce dossier.

À la suite de cette alternance, j'aimerais poursuivre mes études dans un domaine plus approfondi de la cybersécurité comme le Pentesting, le Red Teaming et l'AI Red Teaming. Pour cela, j'ai effectué les démarches d'inscription au Master 1 - Expert en CyberSécurité Pentester, un Titre Professionnel de niveau 7 auprès de Ynov Campus / Connect (RNCP37832), et j'espère poursuivre mon alternance chez Thales.

### 1.2 Présentation de l'entreprise

Thales est un groupe industriel français de haute technologie, leader dans les domaines de la défense, de l'aérospatial, du transport, de la sécurité numérique et de l'identité numérique.

Le site de Gémenos (Bouches-du-Rhône), où j'effectue mon alternance, est historiquement issu de l'entreprise française Gemplus, fondée en 1988 et reconnue comme un leader mondial dans la fabrication de cartes à puces. En 2000, Gemplus poursuit son développement avant d'être intégrée au groupe Thales à la suite de différentes évolutions industrielles.

Depuis 2023, le site de Gémenos regroupe deux divisions stratégiques du groupe :

- **Thales DMS** (Defence Mission Systems), spécialisée dans les systèmes de mission pour la défense ;
- **Thales CDI** (Cybersecurity and Digital Identity), spécialisée dans la cybersécurité et les solutions d'identité numérique.

Le site s'étend sur près de 30 000 m² et rassemble environ 1 000 collaborateurs, qui contribuent au développement de solutions technologiques innovantes destinées à des clients civils et militaires à l'échelle internationale.

Activité principale de l'établissement (NAF/APE) : Fabrication de cartes électroniques assemblées (26.12Z).

*[À insérer : image façade, image de localisation — mentionnées dans le brouillon source mais non fournies pour l'instant]*

### 1.3 Organigramme du service

**[À COMPLÉTER]** — le fichier source `[03]_organigramme-du-service.md` est vide. Aucune information sur la structure hiérarchique du service Sûreté et Sécurité n'a été fournie.

### 1.4 Présentation du parc informatique

Le parc informatique du périmètre Sûreté et Sécurité est constitué de :

- 250 caméras AXIS / BOSCH :
  - 200 caméras analogiques ;
  - 50 caméras IP ;
- 6 hôtes Windows Server 2022 - Hyper-V :
  - MGT-1 : Management N°1 ;
  - MGT-2 : Management N°2 ;
  - REC-1 : Record N°1 ;
  - REC-2 : Record N°2 ;
  - REC-3 : Record N°3 ;
  - KIMERA ;
- 1 VM Rocky Linux - Squid Proxy ;
- 1 VM Rocky Linux - Zabbix Server ;
- 1 VM Contrôle d'Accès (CA) ;
- 1 VM Contrôle d'Intrusion (CI) ;
- 1 VM Contrôle des SAS Fischer (SAS) ;
- 1 VM KeyCabinet pour la gestion des armoires à clés ;
- 1 VM Windows Server 2022 - Veeam Backup ;
- 1 VM Windows Server 2022 - Milestone XProtect (VMS).

Le réseau repose sur 4 VLAN :

- 1 VLAN pour le Contrôle d'Accès (CA) ;
- 1 VLAN pour le Contrôle d'Intrusion (CI) ;
- 1 VLAN pour les caméras (CCTV) ;
- 1 VLAN pour les armoires à clés (KC).

**[À COMPLÉTER]** : le fichier source mentionne un « Schéma Réseau » non fourni. Ce schéma serait un appui utile pour le jury lors de la présentation de l'architecture.

> Remarque de cohérence : la liste ci-dessus fait apparaître 6 hôtes Hyper-V (MGT-1, MGT-2, REC-1, REC-2, REC-3, KIMERA), alors que la Mission 1 (§2.5) décrit **5 serveurs physiques HPE ProLiant** (2 Management + 3 Recording). À clarifier avant la version finale — voir questions en fin de document.

---

## 2. Missions

### 2.1 Mission N°1 — Modernisation de l'infrastructure de vidéoprotection et des systèmes de sécurité

> Contenu repris du brouillon `[02]_Missions/[01]_Mission N°1/brouillon-v1.md`, déjà structuré et rédigé à la première personne. Reproduit ici sans réécriture de fond ; voir la version source pour le détail intégral (tableaux, matrice des flux, planning).

**Contexte et problématique.** Dans le cadre de mon alternance au sein du service Sûreté et Sécurité, j'ai participé à l'administration et à l'évolution de l'infrastructure supportant le contrôle d'accès (TILLYS), le contrôle d'intrusion (Microsésame Cube), la gestion des armoires à clés (Keycabinet) et la vidéoprotection (Milestone XProtect), sur une infrastructure segmentée en 4 VLAN (CI, CA, KC, CCTV) et virtualisée sur des hôtes Hyper-V.

Problématique retenue : *comment faire évoluer l'infrastructure informatique supportant les systèmes de sécurité physique tout en assurant leur disponibilité, en maîtrisant les flux réseau et en permettant la modernisation progressive de la vidéoprotection ?*

**Grandes étapes de réalisation** (résumé — détail complet dans le brouillon source) :
- intégration de 5 serveurs physiques HPE ProLiant comme hôtes Hyper-V (2 Management, 3 Recording) ;
- administration matérielle via HPE iLO ;
- installation de Windows Server 2022 et mise en place d'Hyper-V ;
- segmentation réseau en 4 VLAN et amorce d'une matrice des flux (protocoles/ports encore marqués **[À VÉRIFIER]** dans le brouillon) ;
- migration progressive de Geutebruck vers Milestone XProtect ;
- dimensionnement du stockage vidéo : 12 disques Enterprise HDD de 22 To, RAID 5, capacité brute 264 To, capacité théorique RAID 5 242 To ;
- supervision via Zabbix (VM Rocky Linux).

**Compétences mobilisées.** BC01 (administration systèmes, réseaux, infrastructures virtualisées) et BC02 (conception d'une solution d'évolution, mise en production, supervision). Le brouillon indique explicitement ne pas rattacher automatiquement cette mission au BC03, faute d'activité d'analyse ou de traitement d'incident de sécurité personnellement réalisée dans ce cadre.

*Voir le fichier source pour : tableau des parties prenantes, planning prévisionnel en 15 étapes, matrice des flux M01-M08, résultats chiffrés détaillés.*

### 2.2 Mission N°2 — Mise en place et déploiement d'une solution de supervision Zabbix

> Contenu repris du brouillon `[02]_Missions/[02]_Mission N°2/brouillon-v1.md`, déjà structuré et rédigé à la première personne.

**Contexte et problématique.** À mon arrivée, les infrastructures liées aux systèmes de sécurité ne disposaient pas de supervision centralisée : la détection d'une indisponibilité reposait sur un constat humain. Avec mon responsable et mon tuteur, j'ai identifié le besoin de centraliser la supervision, détecter automatiquement les indisponibilités, définir des niveaux de criticité et produire du reporting. Je me suis orienté vers Zabbix (open source) après étude des possibilités.

**Grandes étapes de réalisation** (résumé) :
- analyse du besoin et du périmètre (vidéoprotection + infrastructure serveur/virtuelle) ;
- architecture retenue : VM Rocky Linux dédiée, Nginx en frontal Web, PostgreSQL comme base de données ;
- installation et sécurisation du serveur Zabbix : mises à jour, authentification SSH par clé, désactivation de l'accès root direct, restriction des flux via `firewalld`, comptes de service dédiés ;
- adaptation/développement de modèles de supervision pour les équipements Axis et Bosch, les modèles standards ne couvrant pas tous les besoins identifiés ;
- intégration progressive des équipements (vidéoprotection, hyperviseurs Hyper-V, VM Windows et Linux) ;
- ébauche de matrice des flux de supervision (Z01-Z07, protocoles/ports encore marqués **[À VÉRIFIER]**) ;
- mise en place d'une cartographie de disponibilité, d'alertes par niveau de criticité (notification e-mail) et d'un reporting périodique ;
- documentation de l'architecture et des procédures d'exploitation.

**Résultat mesurable.** Supervision centralisée opérationnelle sur le périmètre décrit, détection automatisée, alerting par criticité, reporting périodique. Le brouillon signale lui-même que la valeur mesurable doit encore être complétée par des indicateurs réels (intervalle de supervision, nombre exact d'équipements supervisés, exemple d'incident réellement détecté).

**Compétences mobilisées.** BC01 (bonnes pratiques d'administration et de sécurisation du serveur, administration système et réseau) et BC02, avec en particulier « mettre en œuvre et optimiser la supervision des infrastructures » comme cœur de la mission. Le BC03 est mentionné comme contribution indirecte (sécurisation du serveur de supervision, amélioration de la détection) mais explicitement non revendiqué tant qu'aucune activité d'analyse de sécurité, de politique de sécurité ou de traitement d'incident n'est démontrée.

*Voir le fichier source pour : tableau des parties prenantes, planning en 12 étapes (~1,5 an), matrice des flux Z01-Z07 complète.*

### 2.3 Mission N°3 — Détection et traitement des incidents de sécurité (Wazuh)

**Statut : non intégrée au dossier en l'état — projet non réalisé.**

Le brouillon source (`[02]_Missions/[03]_Mission N°3/brouillon-v1.md`) le précise lui-même : il s'agit d'un projet personnel, hors alternance, mené sur un lab Hyper-V/Windows 11 Pro à domicile, destiné à combler l'absence d'activité BC03 en entreprise. Les sections « mise en œuvre » et « résultat mesurable » y sont rédigées au conditionnel/futur et contiennent des placeholders explicites (`[À rédiger après réalisation]`) car le lab n'a pas encore été monté ni testé.

Conformément à la règle du dossier (ne jamais décrire au passé ce qui n'a pas été fait), je ne rédige pas cette mission comme acquise. Deux options, selon votre situation réelle au moment du rendu :

**Formulation A — si le lab est réalisé avant le rendu du dossier :** reprendre le plan de la Mission 3 et rédiger les sections 5 et 6 au passé composé, avec preuves à l'appui (capture de l'alerte Wazuh déclenchée par le bruteforce SSH, extrait de règle/decoder utilisé ou personnalisé, log de détection FIM sur la VM Windows). Sans ces preuves, la section resterait un point faible évident en entretien technique — le jury demandera à voir l'alerte.

**Formulation B — si le lab n'est pas réalisé avant le rendu :** ne pas inclure la Mission 3 comme mission à part entière. Deux sous-options possibles : (1) rechercher une activité réelle chez Thales pouvant illustrer BC03 (participation à une analyse de vulnérabilité, à une revue de politique de sécurité, à un traitement d'incident même mineur) et documenter celle-ci à la place ; (2) présenter le lab Wazuh en annexe comme démarche personnelle de montée en compétence, sans lui faire porter la couverture du bloc BC03 dans la matrice de couverture.

Le choix entre A et B vous appartient — c'est vous qui devrez le défendre devant le jury.

---

## 3. Questions à traiter avant de finaliser ce dossier

**Cohérence générale**
1. La fiche parc informatique liste 6 hôtes Hyper-V nommés (MGT-1, MGT-2, REC-1, REC-2, REC-3, KIMERA) ; la Mission 1 parle de 5 serveurs physiques HPE ProLiant (2 Management + 3 Recording). S'agit-il de 5 hôtes physiques dont l'un porte plusieurs rôles logiques, ou bien d'un 6ᵉ serveur (KIMERA) non compté dans la Mission 1 ? À clarifier pour éviter une contradiction devant le jury.
2. Le schéma réseau et les images (façade, localisation) mentionnés dans les fiches de présentation sont-ils disponibles ? Ils seraient utiles au moins pour le support de soutenance.
3. L'organigramme du service est vide : qui sont mon tuteur, mon responsable, et où se situe mon rôle dans la hiérarchie ? Cette information est probablement attendue en introduction d'entretien.

**Mission N°1**
4. La matrice des flux (M01-M08) est marquée « à vérifier » pour les adresses IP, VLAN et protocoles/ports. Avez-vous ces éléments dans une configuration réelle (règles de pare-feu, capture Wireshark, doc constructeur Milestone) à joindre en annexe ?
5. Le mécanisme de failover/continuité de service de Milestone (§5.8 du brouillon) est décrit comme « à décrire en fonction de la configuration effectivement mise en œuvre » — est-il réellement configuré, et si oui comment (cluster, réplication, autre) ?
6. Le placement précis des VM sur les hôtes physiques n'est pas détaillé — est-ce vérifiable si le jury demande le détail de l'architecture de virtualisation ?

**Mission N°2**
7. La matrice des flux de supervision (Z01-Z07) a les mêmes zones « à vérifier » — mêmes éléments attendus (adressage, protocoles Zabbix agent/agentless, SNMP le cas échéant, port SMTP).
8. Avez-vous un exemple réel d'alerte Zabbix effectivement détectée et traitée (capture, log) ? C'est la preuve la plus convaincante pour BC02 « mettre en œuvre et optimiser la supervision ».
9. Intervalle de supervision et nombre exact d'équipements supervisés à ce jour : disponibles dans la configuration Zabbix ?

**Mission N°3**
10. Quelle est la date de rendu du dossier, et le lab Wazuh sera-t-il réalisé avant cette date ? Cela conditionne le choix entre la Formulation A et la Formulation B ci-dessus.
11. Avez-vous confirmé auprès de l'organisme de formation qu'un projet personnel hors entreprise peut être présenté comme une « mission » du dossier, ou faut-il le présenter autrement (annexe) ?

**Plan général**
12. Y a-t-il des consignes de l'organisme de formation (nombre de pages, plan imposé, gabarit) qui doivent primer sur la structure actuelle (par mission) ?
