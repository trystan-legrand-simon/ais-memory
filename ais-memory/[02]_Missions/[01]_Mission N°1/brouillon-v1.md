---

# Mission 1 - Modernisation de l’infrastructure de vidéoprotection et des systèmes de sécurité

---

# Mission N°1 - Modernisation de l’infrastructure de vidéoprotection et des systèmes de sécurité

## 1. Contexte et problématique

Dans le cadre de mon alternance au sein du service Sûreté et Sécurité, j’ai été amené à participer à l’administration et à l’évolution de l’infrastructure informatique supportant plusieurs systèmes de sécurité physique du site.

À mon arrivée, les systèmes de contrôle d’accès, de contrôle d’intrusion, de gestion des armoires à clés et de vidéoprotection étaient déjà opérationnels. Cependant, l’infrastructure faisait l’objet d’une démarche de modernisation afin de faire évoluer les systèmes existants, d’améliorer leur disponibilité et de disposer d’une infrastructure capable d’accompagner les besoins futurs.

L’infrastructure regroupe plusieurs systèmes de sécurité :

- le **contrôle d’accès**, associé au système **TILLYS** ;
- le **contrôle d’intrusion**, associé au système **Microsésame Cube** ;
- la **gestion des armoires à clés**, avec **Keycabinet** ;
- la **vidéoprotection**, basée sur **Milestone XProtect** ;
- les infrastructures systèmes et réseaux nécessaires au fonctionnement de ces solutions ;
- la supervision de l’infrastructure avec **Zabbix**.

Afin de séparer les différents environnements, l’infrastructure réseau repose notamment sur quatre VLAN dédiés aux systèmes de sécurité :

| VLAN | Fonction |
| --- | --- |
| **CI** | Contrôle d’Intrusion |
| **CA** | Contrôle d’Accès |
| **KC** | Keycabinet |
| **CCTV** | Vidéoprotection |

Cette segmentation permet d’isoler logiquement les différents environnements et de maîtriser les communications nécessaires entre les systèmes.

### Infrastructure de virtualisation

L’environnement repose sur **cinq serveurs physiques HPE ProLiant** utilisés comme hôtes de virtualisation Hyper-V.

Ces serveurs sont répartis entre deux environnements :

- **2 serveurs associés à l’environnement Management** ;
- **3 serveurs associés à l’environnement Recording**.

La virtualisation permet d’héberger plusieurs services nécessaires au fonctionnement des systèmes de sécurité tout en séparant les différents environnements au niveau des machines virtuelles.

Les machines virtuelles identifiées comprennent notamment :

- **Zabbix**, sous Rocky Linux, utilisé pour la supervision ;
- **Squid**, sous Rocky Linux ;
- **Keycabinet** ;
- **SAS Fischer** ;
- **Microsésame** ;
- les services liés à **Milestone XProtect**.

Le placement précis de chaque machine virtuelle sur les différents hôtes physiques n’est pas détaillé dans ce dossier lorsqu’il n’a pas été vérifié à partir de l’architecture réellement déployée.

### Modernisation de la vidéoprotection

La vidéoprotection représente une composante importante de cette infrastructure.

Le parc actuellement identifié comprend **250 caméras**, réparties de la manière suivante :

| Type de caméra | Nombre | Part du parc |
| --- | --- | --- |
| Caméras IP | 50 | 20 % |
| Caméras analogiques | 200 | 80 % |
| **Total** | **250** | **100 %** |

La modernisation comprend notamment une évolution progressive du parc de caméras vers l’IP.

Cette évolution matérielle s’accompagne également d’une évolution de la solution logicielle de gestion vidéo. L’ancien environnement basé sur **Geutebruck** est progressivement remplacé par **Milestone XProtect**.

Cette modernisation nécessite donc de faire évoluer simultanément plusieurs composants de l’infrastructure : serveurs, virtualisation, réseau, stockage, systèmes d’enregistrement et logiciels de gestion vidéo.

### Problématique

La problématique de cette mission peut ainsi être formulée :

> **Comment faire évoluer l’infrastructure informatique supportant les systèmes de sécurité physique tout en assurant leur disponibilité, en maîtrisant les flux réseau et en permettant la modernisation progressive de la vidéoprotection ?**
> 

Cette problématique doit être traitée en tenant compte des contraintes propres à une infrastructure de sécurité : disponibilité des services, segmentation réseau, capacité de stockage, supervision, continuité de service et maîtrise des opérations de migration.

---

## 2. Impact

Les systèmes concernés par cette mission participent directement au fonctionnement des dispositifs de sûreté et de sécurité du site.

Une indisponibilité d’un de ces systèmes peut avoir un impact opérationnel sur les activités des équipes concernées.

### Contrôle d’accès

Le système de contrôle d’accès permet de gérer les droits d’accès aux différentes zones du site.

Une indisponibilité peut notamment perturber :

- l’entrée et la sortie des collaborateurs ;
- l’accès aux zones nécessitant une autorisation ;
- la gestion des badges ;
- certaines opérations réalisées par les équipes de sûreté.

L’infrastructure informatique doit donc garantir la disponibilité des composants nécessaires au fonctionnement de ce système.

### Contrôle d’intrusion

Le système de contrôle d’intrusion participe à la surveillance des événements liés à la sécurité du bâtiment.

Son infrastructure doit permettre aux équipes concernées de disposer des informations nécessaires à l’exploitation du système.

### Gestion des clés

Le système **Keycabinet** permet de gérer les armoires à clés utilisées dans le cadre de la sécurité du site.

Son intégration dans une infrastructure virtualisée et segmentée nécessite de prendre en compte les aspects systèmes, réseaux et disponibilité.

### Vidéoprotection

La vidéoprotection constitue également un outil important pour les équipes chargées de la sécurité.

Le système permet notamment :

- la visualisation des caméras ;
- la surveillance des différentes zones ;
- l’enregistrement des flux ;
- la consultation des séquences enregistrées ;
- la recherche d’événements.

Une indisponibilité de l’infrastructure de vidéoprotection peut donc réduire les capacités de surveillance et d’exploitation des enregistrements.

### Impact sur l’infrastructure

La modernisation doit permettre :

- d’améliorer l’administration des systèmes ;
- de séparer les différents environnements réseau ;
- d’accompagner l’évolution du parc de caméras ;
- de disposer d’une capacité de stockage adaptée ;
- de renforcer la supervision ;
- de faciliter l’évolution des services ;
- de limiter les interruptions pendant les opérations de migration.

L’enjeu est donc de faire évoluer l’infrastructure tout en conservant un niveau de disponibilité compatible avec les besoins des systèmes de sécurité.

---

## 3. Parties prenantes

Plusieurs acteurs interviennent dans cette mission.

| Partie prenante | Rôle |
| --- | --- |
| **Service Sûreté et Sécurité** | Expression des besoins, exploitation des systèmes de sécurité et validation fonctionnelle |
| **Équipe informatique / infrastructure** | Administration et évolution de l’infrastructure informatique |
| **Moi-même, alternant** | Participation aux opérations d’administration, de configuration, de migration, de supervision et de documentation |
| **Istal Energie** | Prestataire intervenant sur les systèmes techniques concernés selon son périmètre |
| **Goron** | Exploitation opérationnelle des dispositifs de sécurité et utilisation de la vidéoprotection |
| **Éditeurs / constructeurs / intégrateurs** | Fourniture des solutions et support technique selon les besoins |

La réalisation de cette mission nécessite donc une coordination entre les équipes informatiques, les équipes de sûreté et les différents prestataires intervenant sur les systèmes.

Dans le cadre de mon alternance, mon intervention doit être distinguée de celle des autres acteurs. Je me suis principalement impliqué dans les opérations techniques qui m’ont été confiées ainsi que dans l’administration, la supervision et la documentation de l’environnement.

---

## 4. Planning prévisionnel

La modernisation de l’infrastructure est réalisée progressivement afin de limiter les risques liés aux changements effectués sur des systèmes en production.

| Étape | Opération | Objectif |
| --- | --- | --- |
| 1 | Analyse de l’existant | Identifier l’architecture et les besoins |
| 2 | Préparation | Définir l’architecture cible et les opérations nécessaires |
| 3 | Réception des HPE | Préparer le matériel |
| 4 | Installation physique | Installer et raccorder les serveurs |
| 5 | Configuration iLO | Permettre l’administration matérielle à distance |
| 6 | Installation Windows Server | Préparer les hyperviseurs |
| 7 | Configuration Hyper-V | Mettre en place la virtualisation |
| 8 | Configuration réseau | Mettre en place les réseaux et VLAN nécessaires |
| 9 | Déploiement des VM | Installer les services nécessaires |
| 10 | Déploiement Milestone | Préparer la nouvelle plateforme de vidéoprotection |
| 11 | Configuration du stockage | Préparer l’espace destiné aux enregistrements |
| 12 | Migration | Faire évoluer progressivement l’ancien environnement |
| 13 | Tests | Vérifier le fonctionnement des différents services |
| 14 | Validation | Valider l’environnement avec les parties prenantes |
| 15 | Mise en production | Exploiter la nouvelle infrastructure |

Cette organisation permet de séparer les différentes phases du projet et de limiter les risques lors des opérations réalisées sur une infrastructure critique.

---

## 5. Grandes étapes de réalisation

### 5.1. Intégration des serveurs HPE ProLiant

La première étape consiste à intégrer les nouveaux serveurs physiques dans l’infrastructure.

Cinq serveurs **HPE ProLiant** sont utilisés comme hôtes Hyper-V.

L’environnement est organisé autour de :

- **deux serveurs associés à l’environnement Management** ;
- **trois serveurs associés à l’environnement Recording**.

Les serveurs sont installés dans les baies prévues à cet effet puis raccordés aux réseaux nécessaires à leur fonctionnement.

Cette étape permet de disposer de la couche physique nécessaire à la mise en œuvre de l’infrastructure virtualisée.

### 5.2. Administration matérielle avec HPE iLO

Les serveurs HPE disposent de la technologie **HPE iLO — Integrated Lights-Out**, permettant leur administration à distance.

Cette interface permet notamment :

- d’accéder à une console distante ;
- de consulter l’état du matériel ;
- de surveiller certains composants ;
- d’effectuer des opérations d’administration à distance ;
- de faciliter les opérations de maintenance.

L’utilisation d’iLO permet ainsi de disposer d’un niveau d’administration indépendant du système d’exploitation installé sur les serveurs.

### 5.3. Installation de Windows Server 2022

Les serveurs physiques utilisés comme hyperviseurs sont préparés avec **Windows Server 2022**.

Cette étape comprend notamment :

- l’installation du système ;
- la configuration initiale ;
- la configuration réseau ;
- l’installation des mises à jour nécessaires ;
- la préparation du système pour l’utilisation d’Hyper-V.

Cette couche système constitue la base nécessaire à la virtualisation des différents services.

### 5.4. Mise en place de la virtualisation Hyper-V

La virtualisation repose sur **Microsoft Hyper-V**.

Elle permet d’héberger plusieurs services sur les serveurs physiques tout en séparant les différents environnements au niveau des machines virtuelles.

Les services identifiés comprennent notamment :

- Zabbix ;
- Squid ;
- Keycabinet ;
- SAS Fischer ;
- Microsésame ;
- Milestone XProtect.

La virtualisation permet ainsi de dissocier les services de leur matériel physique et facilite leur administration et leur évolution.

Cette activité mobilise directement les compétences relatives à l’administration des infrastructures virtualisées.

### 5.5. Segmentation réseau

L’infrastructure réseau est organisée autour de VLAN dédiés aux différents systèmes de sécurité.

Les quatre VLAN identifiés sont :

| VLAN | Système / fonction |
| --- | --- |
| **CI** | Contrôle d’Intrusion |
| **CA** | Contrôle d’Accès |
| **KC** | Keycabinet |
| **CCTV** | Vidéoprotection |

Cette segmentation permet de séparer logiquement les différents environnements et de maîtriser les communications nécessaires entre eux.

Le VLAN **CCTV** est notamment associé à l’environnement de vidéoprotection et aux équipements IP concernés.

La segmentation doit cependant être accompagnée d’une identification précise des flux nécessaires au fonctionnement des applications. L’objectif est de permettre les communications indispensables tout en évitant les communications inutiles entre environnements.

#### Matrice des flux

La matrice des flux constitue un support permettant de documenter les communications nécessaires entre les différents composants de l’infrastructure.

À ce stade, seuls les flux fonctionnels dont l’existence est identifiée sont présentés. Les adresses IP, protocoles et ports doivent être complétés à partir de la configuration réellement déployée.

| ID | Source | Destination | Fonction | Direction | Protocole / port |
| --- | --- | --- | --- | --- | --- |
| M01 | Caméras IP | Infrastructure Milestone | Transmission des flux vidéo | Caméra → serveur | À vérifier |
| M02 | Milestone | Caméras IP | Administration / configuration | Serveur → caméra | À vérifier |
| M03 | Services Milestone | Stockage | Écriture des enregistrements | Serveur → stockage | À vérifier |
| M04 | Management Milestone | Recording Server | Administration des services | Selon architecture | À vérifier |
| M05 | Smart Client | Infrastructure Milestone | Authentification / exploitation | Client → serveur | À vérifier |
| M06 | Smart Client | Recording Server | Consultation des flux / enregistrements | Client → serveur | À vérifier |
| M07 | Zabbix | Équipements / serveurs supervisés | Supervision | Selon méthode | À vérifier |
| M08 | Administrateur | Services d’administration | Administration | Poste → infrastructure | À vérifier |

Cette matrice pourra ensuite être complétée avec :

- les adresses IP sources ;
- les adresses IP destinations ;
- les VLAN sources ;
- les VLAN destinations ;
- les protocoles ;
- les ports ;
- les règles de filtrage ;
- la justification de chaque flux.

La documentation de ces flux permet de disposer d’une vision technique de l’architecture et facilite les opérations de diagnostic, d’administration et d’évolution.

### 5.6. Déploiement de Milestone XProtect

L’environnement de vidéoprotection évolue progressivement d’une solution basée sur **Geutebruck** vers **Milestone XProtect**.

Milestone XProtect permet notamment :

- de gérer les équipements de vidéoprotection ;
- de gérer l’enregistrement des flux ;
- de visualiser les caméras ;
- de consulter les enregistrements ;
- d’effectuer des recherches dans les séquences ;
- d’exploiter les flux via le client prévu à cet effet.

Le changement de solution nécessite de prendre en compte l’ensemble de l’infrastructure sous-jacente :

**caméras → réseau → serveurs → virtualisation → Milestone → stockage → supervision**

Cette opération constitue donc une évolution importante de l’infrastructure.

### 5.7. Mise en place du stockage vidéo

L’enregistrement vidéo nécessite une capacité de stockage importante.

L’infrastructure comprend **12 disques Enterprise HDD de 22 To**.

La capacité brute est donc :

> 12 × 22 To = **264 To**
> 

Les disques sont configurés en **RAID 5**.

La capacité théorique du RAID 5, avant prise en compte du formatage et des éventuelles réserves, est :

> (12 − 1) × 22 To = **242 To**
> 

| Élément | Valeur |
| --- | --- |
| Nombre de disques | 12 |
| Capacité unitaire | 22 To |
| Capacité brute | 264 To |
| Niveau RAID | RAID 5 |
| Capacité théorique RAID 5 | 242 To |

La capacité réellement disponible au niveau du système peut être inférieure à cette valeur en fonction du formatage et de la configuration retenue.

Le stockage constitue donc un élément dimensionnant de l’infrastructure de vidéoprotection, compte tenu du volume important généré par les enregistrements.

### 5.8. Continuité de service et mécanismes de reprise

La disponibilité des systèmes de sécurité constitue une contrainte importante de l’infrastructure.

Les mécanismes de reprise ou de **failover** permettent, lorsqu’ils sont configurés, de limiter l’impact d’une défaillance d’un composant sur l'exploitation du système.

Dans le cas de Milestone, les mécanismes de continuité de service doivent être décrits en fonction de la configuration effectivement mise en œuvre.

L’objectif est de réduire le risque d’interruption des fonctions essentielles de vidéoprotection et de permettre une reprise des services concernés dans les conditions prévues par l’architecture.

### 5.9. Migration de Geutebruck vers Milestone

La migration de l’ancien environnement **Geutebruck** vers **Milestone XProtect** constitue une étape majeure de la modernisation.

La migration est réalisée progressivement afin de limiter les impacts sur l’exploitation.

Les principales étapes sont :

1. préparation de l’infrastructure ;
2. préparation des serveurs ;
3. préparation du stockage ;
4. installation et configuration de Milestone ;
5. intégration progressive des équipements ;
6. vérification de la visualisation ;
7. vérification de l’enregistrement ;
8. réalisation des tests ;
9. validation ;
10. passage en production des éléments concernés.

Chaque évolution doit être vérifiée afin de s'assurer que les fonctions nécessaires restent disponibles après migration.

### 5.10. Supervision avec Zabbix

La supervision constitue un élément important de l’exploitation de l’infrastructure.

Une machine virtuelle **Zabbix sous Rocky Linux** est présente dans l’environnement.

Elle permet de centraliser la supervision des équipements et services qui lui sont intégrés.

La supervision permet notamment de suivre :

- la disponibilité des équipements ;
- l’état des services ;
- certaines ressources systèmes ;
- les événements nécessitant une intervention.

Cette supervision complète les mécanismes d’administration de l’infrastructure en fournissant une vision centralisée de son état.

---

## 6. Résultat mesurable

La modernisation permet de disposer d’une infrastructure structurée autour de plusieurs niveaux : infrastructure physique, réseau, virtualisation, systèmes, applications, stockage et supervision.

### Infrastructure physique

| Élément | Résultat |
| --- | --- |
| Serveurs HPE ProLiant | **5** |
| Serveurs associés à Management | **2** |
| Serveurs associés à Recording | **3** |
| Hyperviseur | **Hyper-V** |
| Système serveur | **Windows Server 2022** |
| Disques vidéo | **12 × 22 To** |
| Capacité brute | **264 To** |
| RAID | **RAID 5** |
| Capacité théorique RAID 5 | **242 To** |

### Infrastructure réseau

| Élément | Résultat |
| --- | --- |
| VLAN de sécurité identifiés | **4** |
| CI | Contrôle d’Intrusion |
| CA | Contrôle d’Accès |
| KC | Keycabinet |
| CCTV | Vidéoprotection |

### Vidéoprotection

Le parc actuellement identifié comprend :

| Type | Quantité | Pourcentage |
| --- | --- | --- |
| Caméras IP | **50** | **20 %** |
| Caméras analogiques | **200** | **80 %** |
| **Total** | **250** | **100 %** |

Ces données permettent de disposer d’un état quantifié du parc de vidéoprotection au moment considéré.

Elles montrent également que la modernisation vers une infrastructure majoritairement ou totalement IP constitue une évolution progressive.

### Services virtualisés

L’environnement virtualisé comprend notamment :

- Zabbix ;
- Squid ;
- Keycabinet ;
- SAS Fischer ;
- Microsésame ;
- les services liés à Milestone XProtect.

La virtualisation permet d’héberger ces services sur une infrastructure physique commune tout en conservant une séparation logique entre les différents environnements.

### Résultat global

La mission permet ainsi de disposer d’une infrastructure capable d’accompagner la modernisation progressive des systèmes de sécurité et de la vidéoprotection.

Les principaux résultats quantifiables sont :

- **5 hôtes physiques HPE ProLiant** ;
- **2 environnements Management et 3 environnements Recording** ;
- **Hyper-V** comme couche de virtualisation ;
- **Windows Server 2022** sur les hyperviseurs ;
- **4 VLAN dédiés aux systèmes de sécurité** ;
- **250 caméras identifiées**, dont 50 IP et 200 analogiques ;
- **264 To de stockage brut** ;
- **242 To de capacité théorique en RAID 5** ;
- une plateforme **Milestone XProtect** en cours de modernisation ;
- une supervision assurée par **Zabbix**.

---

## 7. Compétences mobilisées

Cette mission mobilise principalement les compétences des **BC01 et BC02 du RNCP37680**.

### BC01 — Administrer et sécuriser les infrastructures

Le premier bloc de compétences concerne notamment l’administration des infrastructures réseaux, systèmes et virtualisées ainsi que l’application des bonnes pratiques d’administration.

#### Administration des infrastructures systèmes

La préparation des serveurs sous **Windows Server 2022**, l'administration des systèmes Windows et Linux ainsi que l'intégration des différents services m'ont permis de travailler sur plusieurs environnements systèmes.

#### Administration et sécurisation des infrastructures réseaux

La mise en œuvre d'une architecture comprenant quatre VLAN dédiés aux systèmes de sécurité m'a permis de prendre en compte la segmentation des environnements et les communications nécessaires entre les différents systèmes.

La création et la documentation de la matrice des flux permettent également de formaliser les communications nécessaires au fonctionnement des applications.

#### Administration des infrastructures virtualisées

L'environnement repose sur **cinq serveurs physiques HPE ProLiant utilisant Hyper-V**.

La mise en œuvre et l'exploitation de cet environnement m'ont permis de travailler sur l'administration d'une infrastructure virtualisée hébergeant plusieurs services.

#### Application des bonnes pratiques d'administration

La mission m'a également amené à prendre en compte différentes problématiques liées à :

- la disponibilité ;
- la segmentation ;
- la supervision ;
- le stockage ;
- la continuité de service ;
- la documentation ;
- la maîtrise des changements.

---

### BC02 — Concevoir et mettre en œuvre une solution en réponse à un besoin d’évolution

Le deuxième bloc concerne notamment la conception de solutions techniques, leur mise en production et la mise en œuvre de la supervision.

#### Concevoir une solution technique répondant à un besoin d’évolution

La modernisation de l'infrastructure de vidéoprotection constitue une évolution répondant à plusieurs besoins :

- modernisation de la solution logicielle ;
- évolution progressive du parc de caméras ;
- adaptation de l'infrastructure serveur ;
- augmentation des capacités de stockage ;
- amélioration de la supervision ;
- évolution de l'architecture réseau.

L'analyse des différents composants nécessaires permet de comprendre les interactions entre les couches physiques, réseau, virtualisation, systèmes, applications et stockage.

#### Mettre en production des évolutions de l’infrastructure

La mise en place des serveurs, de la virtualisation, du stockage et de la plateforme Milestone nécessite une préparation progressive, des tests et une validation avant la mise en production.

La migration de l'environnement Geutebruck vers Milestone XProtect constitue notamment une évolution importante de l'infrastructure existante.

#### Mettre en œuvre et optimiser la supervision des infrastructures

La présence de **Zabbix** permet de superviser les équipements et services intégrés à la plateforme.

La supervision fournit ainsi une visibilité sur l'état de l'infrastructure et permet de détecter les anomalies nécessitant une intervention.

---

### BC03 — Participer à la gestion de la cybersécurité

Le BC03 concerne notamment :

- la mesure et l'analyse du niveau de sécurité de l'infrastructure ;
- l'élaboration et la mise en œuvre de la politique de sécurité ;
- la détection et le traitement des incidents de sécurité.

Dans le cadre de cette mission, je ne rattache pas automatiquement les opérations d'administration aux compétences du BC03.

La mission comporte néanmoins des éléments contribuant à la sécurisation de l'infrastructure, notamment :

- la segmentation des environnements par VLAN ;
- la maîtrise des communications entre systèmes ;
- la documentation des flux ;
- la supervision ;
- la prise en compte de la disponibilité et de la continuité de service.

Les compétences BC03 pourront être démontrées plus précisément dans le dossier si des activités réelles d'analyse de sécurité, d'application de règles de sécurité, de gestion de politique de sécurité ou de traitement d'un incident de sécurité ont été réalisées personnellement dans le cadre de cette mission.