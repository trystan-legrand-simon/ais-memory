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

> Reformulation structurée à partir du brouillon `[02]_Missions/[01]_Mission N°1/brouillon-v1.md` (contenu intégral, tableaux, matrice des flux M01-M08 et planning en 15 étapes disponibles dans le fichier source). Cette version réorganise le contenu du brouillon selon la structure type d'une section de réalisation ; elle n'ajoute aucune information qui ne figure pas déjà dans le brouillon.

**Contexte et besoin.** Dans le cadre de mon alternance au sein du service Sûreté et Sécurité, j'ai participé à l'administration et à l'évolution de l'infrastructure supportant le contrôle d'accès (TILLYS), le contrôle d'intrusion (Microsésame Cube), la gestion des armoires à clés (Keycabinet) et la vidéoprotection (Milestone XProtect), sur une infrastructure déjà opérationnelle à mon arrivée, segmentée en 4 VLAN (CI, CA, KC, CCTV) et virtualisée sur des hôtes Hyper-V.

Cette infrastructure faisait l'objet d'une démarche de modernisation visant à améliorer sa disponibilité et à préparer les besoins futurs, notamment via l'évolution progressive du parc de caméras vers l'IP et le remplacement de la solution vidéo Geutebruck par Milestone XProtect.

Problématique retenue : *comment faire évoluer l'infrastructure informatique supportant les systèmes de sécurité physique tout en assurant leur disponibilité, en maîtrisant les flux réseau et en permettant la modernisation progressive de la vidéoprotection ?*

**Choix techniques et alternatives écartées.** Le brouillon documente les choix retenus (HPE ProLiant + Hyper-V + Windows Server 2022 côté infrastructure physique, RAID 5 sur 12 disques Enterprise HDD de 22 To côté stockage, migration vers Milestone XProtect côté logiciel vidéo, segmentation en 4 VLAN côté réseau) mais ne détaille pas de comparaison avec des alternatives (autres constructeurs serveurs, autres niveaux de RAID, autres VMS que Milestone). Je ne peux donc pas rédiger cette partie sans information supplémentaire — voir question 4bis en fin de document.

**Mise en œuvre.** Les grandes étapes réalisées, résumées ici (détail complet dans le brouillon source) :
- intégration de 5 serveurs physiques HPE ProLiant comme hôtes Hyper-V, répartis en 2 serveurs Management et 3 serveurs Recording ;
- administration matérielle à distance via HPE iLO (console distante, supervision matérielle, opérations de maintenance) ;
- installation de Windows Server 2022 sur les hyperviseurs et mise en place d'Hyper-V, hébergeant notamment Zabbix, Squid, Keycabinet, SAS Fischer, Microsésame et les services Milestone XProtect ;
- segmentation réseau en 4 VLAN (CI, CA, KC, CCTV) et amorce d'une matrice des flux (M01-M08) recensant les flux fonctionnels identifiés (caméras → Milestone, Milestone → stockage, Smart Client → serveurs, Zabbix → équipements supervisés, etc.), mais dont les adresses IP, VLAN et protocoles/ports restent marqués **[À VÉRIFIER]** dans le brouillon — je ne les reprends donc pas ici ;
- migration progressive de Geutebruck vers Milestone XProtect, selon une séquence en 10 sous-étapes (préparation infrastructure, serveurs, stockage, installation, intégration progressive des équipements, vérifications, tests, validation, mise en production) ;
- dimensionnement du stockage vidéo : 12 disques Enterprise HDD de 22 To, RAID 5, capacité brute 264 To, capacité théorique RAID 5 242 To (calculs figurant explicitement dans le brouillon) ;
- supervision de l'ensemble via une VM Zabbix (Rocky Linux), dont la mise en œuvre détaillée constitue le cœur de la Mission 2 (§2.2).

> Remarque de cohérence à ne pas trancher ici : le parc informatique (§1.4) liste 6 hôtes Hyper-V nommés (MGT-1, MGT-2, REC-1, REC-2, REC-3, KIMERA), alors que cette mission décrit 5 serveurs physiques HPE ProLiant. Voir question 1 en fin de document.

**Tests et preuves de fonctionnement.** Le planning prévisionnel du brouillon prévoit une étape 13 « Tests — vérifier le fonctionnement des différents services » et une étape 14 « Validation — valider l'environnement avec les parties prenantes ». Le brouillon ne détaille cependant aucun résultat de test ni preuve concrète (capture, log, rapport de validation) pour cette mission. Deux formulations possibles selon ce qui est réellement disponible :

- *Formulation A (si des preuves existent)* : « Les tests réalisés à l'étape 13 ont permis de vérifier [préciser : visualisation, enregistrement, disponibilité des VM, etc.], avec pour preuve [capture / ticket / rapport à joindre en annexe]. »
- *Formulation B (si aucune preuve n'est disponible ou vérifiable a posteriori)* : « Les tests et la validation font partie du planning suivi lors de la migration, mais je ne dispose pas aujourd'hui de trace formelle de leurs résultats à joindre au dossier. » — à assumer tel quel en entretien plutôt que de laisser croire à une preuve qui n'existe pas.

**Difficultés rencontrées et résolution.** Le brouillon ne relate pas d'épisode de difficulté technique identifié et résolu pour cette mission (contrairement à la Mission 2, où l'inadéquation des modèles Zabbix standards est explicitement mentionnée). Deux options :

- *Formulation A* : ne pas inclure de rubrique « difficultés » pour cette mission, et le dire clairement si le jury pose la question à l'oral (« je n'ai pas identifié de difficulté majeure à isoler dans cette mission, la migration s'étant faite de façon progressive et planifiée »).
- *Formulation B* : si une difficulté réelle existe mais n'a pas été notée dans le brouillon (ex. délai de réception du matériel, incompatibilité rencontrée pendant la migration Geutebruck → Milestone, contrainte de disponibilité pendant les tests), la décrire ici avec le contexte, la cause et la résolution effectivement appliquée.

**Compétences du référentiel couvertes.**
- BC01 : administration des infrastructures systèmes (Windows Server 2022, HPE iLO), réseaux (segmentation en 4 VLAN, matrice des flux) et virtualisées (Hyper-V, cinq hôtes HPE ProLiant hébergeant plusieurs services).
- BC02 : conception d'une solution répondant à un besoin d'évolution (modernisation vidéo, stockage, réseau) et mise en production progressive (migration Geutebruck → Milestone). La compétence « mettre en œuvre et optimiser la supervision » est davantage démontrée dans la Mission 2.
- BC03 : le brouillon indique explicitement ne pas rattacher automatiquement cette mission au BC03, faute d'activité d'analyse ou de traitement d'incident de sécurité personnellement réalisée dans ce cadre.

*Voir le fichier source pour : tableau des parties prenantes, planning prévisionnel en 15 étapes, matrice des flux M01-M08 complète, résultats chiffrés détaillés.*

### 2.2 Mission N°2 — Mise en place et déploiement d'une solution de supervision Zabbix

> Reformulation structurée à partir du brouillon `[02]_Missions/[02]_Mission N°2/brouillon-v1.md` (contenu intégral, tableau des parties prenantes, matrice des flux Z01-Z07 et planning en 12 étapes disponibles dans le fichier source). Cette version réorganise le contenu du brouillon selon la structure type d'une section de réalisation ; elle n'ajoute aucune information qui ne figure pas déjà dans le brouillon.

**Contexte et besoin.** À mon arrivée au sein du service Sûreté et Sécurité, les infrastructures techniques liées aux systèmes de sécurité — vidéoprotection comme infrastructure serveur/virtuelle — ne disposaient pas de supervision centralisée : la détection d'une indisponibilité reposait sur un constat humain (utilisateur ou équipe opérationnelle), ce qui ne permettait pas toujours d'identifier rapidement un dysfonctionnement.

Avec mon responsable et mon tuteur, j'ai identifié le besoin de centraliser la supervision, détecter automatiquement les indisponibilités, disposer d'une vision globale de l'infrastructure, définir des niveaux de criticité, améliorer la traçabilité des événements et produire du reporting exploitable.

**Choix techniques et alternatives écartées.** Après étude de plusieurs possibilités, je me suis orienté vers Zabbix, motivé par son modèle open source (absence de coût de licence), sa capacité à superviser des types d'équipements variés, ses possibilités de personnalisation et de modélisation, ses mécanismes d'alerting et sa capacité à évoluer avec l'infrastructure. Le brouillon ne nomme pas les solutions concurrentes étudiées (ex. Nagios, Centreon, PRTG, Zabbix vs. autre) ; je ne peux donc pas les citer sans information complémentaire — voir question en fin de document si le jury demande une comparaison argumentée.

Côté architecture, j'ai retenu une VM Rocky Linux dédiée, avec Nginx en frontal Web et PostgreSQL comme base de données, pensée pour permettre l'intégration progressive des équipements sans remise en cause de l'architecture.

**Mise en œuvre.**
- installation et sécurisation du serveur Zabbix (Rocky Linux) : mises à jour système, authentification SSH par clé, désactivation de l'accès direct du compte root, restriction des flux via `firewalld`, comptes de service dédiés, limitation des services exécutés avec des privilèges élevés ;
- adaptation et développement de modèles de supervision pour les équipements Axis et Bosch, les modèles standards de Zabbix ne couvrant pas l'ensemble des informations recherchées (disponibilité, identification, état de fonctionnement, informations techniques) ;
- intégration progressive des équipements : vidéoprotection, hyperviseurs Hyper-V, VM Windows Server et VM Linux ;
- ébauche d'une matrice des flux de supervision (Z01-Z07 : collecte Zabbix ↔ équipements, supervision des hyperviseurs et des VM, envoi des alertes vers un serveur SMTP, administration via le poste administrateur) — adresses IP, VLAN et protocoles/ports restent marqués **[À VÉRIFIER]** dans le brouillon, je ne les reprends donc pas ici ;
- mise en place d'une cartographie de disponibilité, de niveaux de criticité avec notification par e-mail, et d'un reporting périodique ;
- documentation de l'architecture, des composants, des équipements supervisés, des modèles, des alertes et des procédures d'exploitation.

**Tests et preuves de fonctionnement.** Le brouillon affirme au passé composé que la supervision est opérationnelle (« la mise en œuvre de Zabbix a permis de disposer d'une supervision centralisée de l'infrastructure concernée ») et cite comme résultats obtenus : centralisation, supervision des équipements de vidéoprotection et de l'infrastructure virtuelle, détection automatisée, alertes par criticité, cartographie, reporting périodique. Ce sont donc des éléments que je peux présenter comme faits et vérifiés dans leur principe.

En revanche, le brouillon indique lui-même, sans ambiguïté, que la preuve chiffrée et l'exemple concret manquent encore : intervalle de supervision, nombre exact d'équipements supervisés, et exemple d'incident réellement détecté par Zabbix. Deux formulations possibles selon ce qui peut être produit avant le rendu :

- *Formulation A (si les indicateurs et un exemple d'alerte sont récupérables dans la configuration Zabbix actuelle)* : les intégrer avec capture d'écran de l'alerte, ce qui constitue la preuve la plus convaincante pour la compétence BC02 « mettre en œuvre et optimiser la supervision ».
- *Formulation B (si ces éléments ne sont pas récupérables avant le rendu)* : assumer explicitement la limite à l'oral (« je n'ai pas conservé/extrait d'exemple d'alerte réelle à date de rédaction du dossier, mais je peux décrire le mécanisme et le principe de fonctionnement de l'alerting mis en place »), plutôt que de citer un chiffre ou un incident non vérifié.

**Difficultés rencontrées et résolution.** Le brouillon identifie une difficulté concrète et sa résolution : les modèles de supervision standards fournis par Zabbix ne couvraient pas l'ensemble des besoins identifiés pour les équipements Axis et Bosch (disponibilité, identification, état de fonctionnement, informations techniques). J'ai résolu ce point en adaptant et en développant des éléments de supervision spécifiques à ces équipements, plutôt que de dépendre exclusivement des modèles standards.

**Compétences du référentiel couvertes.**
- BC01 : bonnes pratiques d'administration et de sécurisation du serveur (mises à jour, SSH par clé, restriction root, `firewalld`, comptes de service dédiés), administration système (VM Rocky Linux, Zabbix, Nginx, PostgreSQL) et prise en compte des flux réseau nécessaires à la supervision.
- BC02 : conception de la solution en réponse au besoin de supervision, mise en production progressive, et surtout « mettre en œuvre et optimiser la supervision des infrastructures », cœur de cette mission.
- BC03 : contribution indirecte mentionnée par le brouillon (sécurisation du serveur de supervision, amélioration de la détection) mais explicitement non revendiquée tant qu'aucune activité d'analyse de sécurité, de politique de sécurité ou de traitement d'incident n'est démontrée dans ce cadre précis.

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
4bis. Le brouillon ne détaille pas de comparaison entre les choix retenus (HPE ProLiant, RAID 5, Milestone XProtect) et d'éventuelles alternatives écartées. Y a-t-il eu une réflexion documentée (cahier des charges, comparatif fournisseurs, arbitrage coût/besoin) sur ces choix, même informelle, à restituer pour la section « choix techniques » ?
5. Le mécanisme de failover/continuité de service de Milestone (§5.8 du brouillon) est décrit comme « à décrire en fonction de la configuration effectivement mise en œuvre » — est-il réellement configuré, et si oui comment (cluster, réplication, autre) ?
6. Le placement précis des VM sur les hôtes physiques n'est pas détaillé — est-ce vérifiable si le jury demande le détail de l'architecture de virtualisation ?
6bis. Le brouillon ne relate aucune difficulté technique concrète (imprévu, blocage, arbitrage sous contrainte) rencontrée pendant cette mission. Y en a-t-il une à documenter (délai matériel, incompatibilité, contrainte de disponibilité pendant les tests, etc.), ou faut-il assumer qu'il n'y en a pas eu de notable ?
6ter. Le planning prévoit des étapes « Tests » (13) et « Validation » (14) mais aucun résultat de test n'est détaillé dans le brouillon. Disposez-vous d'une preuve (rapport, capture, ticket) de ces tests à joindre en annexe, ou faut-il l'assumer comme non disponible ?

**Mission N°2**
7. La matrice des flux de supervision (Z01-Z07) a les mêmes zones « à vérifier » — mêmes éléments attendus (adressage, protocoles Zabbix agent/agentless, SNMP le cas échéant, port SMTP).
7bis. Le brouillon mentionne avoir « étudié différentes possibilités » avant de choisir Zabbix, sans nommer les solutions concurrentes étudiées. Vous en souvenez-vous (Nagios, Centreon, PRTG, autre) ? Le jury pourrait demander cette comparaison.
8. Avez-vous un exemple réel d'alerte Zabbix effectivement détectée et traitée (capture, log) ? C'est la preuve la plus convaincante pour BC02 « mettre en œuvre et optimiser la supervision ».
9. Intervalle de supervision et nombre exact d'équipements supervisés à ce jour : disponibles dans la configuration Zabbix ?

**Mission N°3**
10. Quelle est la date de rendu du dossier, et le lab Wazuh sera-t-il réalisé avant cette date ? Cela conditionne le choix entre la Formulation A et la Formulation B ci-dessus.
11. Avez-vous confirmé auprès de l'organisme de formation qu'un projet personnel hors entreprise peut être présenté comme une « mission » du dossier, ou faut-il le présenter autrement (annexe) ?

**Plan général**
12. Y a-t-il des consignes de l'organisme de formation (nombre de pages, plan imposé, gabarit) qui doivent primer sur la structure actuelle (par mission) ?
