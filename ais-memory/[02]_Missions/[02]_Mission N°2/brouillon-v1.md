---

# Mission N°2 - Mise en place et déploiement d’une solution de supervision Zabbix

---

# Mission N°2 - Mise en place et déploiement d’une solution de supervision Zabbix

## 1. Contexte et problématique

À mon arrivée en alternance au sein du service Sûreté et Sécurité, les infrastructures techniques associées aux systèmes de sécurité ne disposaient pas d’une solution de supervision centralisée permettant de suivre leur disponibilité et leur état de fonctionnement.

Cette absence de supervision concernait notamment les équipements liés à la vidéoprotection ainsi que plusieurs composants de l’infrastructure serveur. En cas d'indisponibilité d'un équipement, la détection reposait principalement sur un constat effectué par les utilisateurs ou les équipes opérationnelles. Cette situation ne permettait donc pas toujours d’identifier rapidement un dysfonctionnement.

Le besoin identifié avec mon responsable et mon tuteur était donc de mettre en place une solution permettant de :

- centraliser la supervision des équipements ;
- détecter automatiquement les indisponibilités ;
- disposer d’une vision globale de l’état de l’infrastructure ;
- mettre en place des alertes adaptées au niveau de criticité ;
- améliorer la traçabilité des événements ;
- produire des éléments de reporting exploitables dans le cadre du suivi de l’infrastructure.

J’ai étudié différentes possibilités et me suis orienté vers **Zabbix**, solution de supervision open source permettant de superviser des équipements réseau, des serveurs, des machines virtuelles et des équipements spécialisés grâce à des modèles et contrôles personnalisables.

L’objectif n’était donc pas uniquement d’installer un serveur Zabbix, mais de concevoir une solution de supervision adaptée aux contraintes de l’environnement de Sûreté et Sécurité.

---

## 2. Impact

L’absence de supervision pouvait avoir un impact direct sur la disponibilité des systèmes de sécurité.

Par exemple, l’indisponibilité d’une caméra peut entraîner une perte de visibilité sur une zone surveillée. La criticité dépend alors de la localisation et du rôle de l’équipement concerné.

De la même manière, l’indisponibilité d’un serveur ou d’un hyperviseur peut affecter plusieurs services hébergés sur celui-ci.

La mise en place de Zabbix devait donc permettre de passer d’une logique principalement réactive à une logique davantage proactive :

| Situation avant supervision | Situation après mise en place de Zabbix |
| --- | --- |
| Détection principalement manuelle | Détection automatisée |
| Absence de vision centralisée | Tableau de supervision centralisé |
| Difficulté à identifier rapidement l'équipement concerné | Identification de l'équipement en défaut |
| Peu de traçabilité | Historique des événements |
| Réaction après constat du problème | Alerte dès détection du défaut |
| Reporting limité | Reporting automatisé |

L'objectif était ainsi de réduire le délai entre l'apparition d'un dysfonctionnement et sa prise en compte par les équipes concernées.

---

## 3. Parties prenantes

La réalisation de cette mission a impliqué plusieurs parties prenantes.

| Partie prenante | Rôle |
| --- | --- |
| Responsable / tuteur | Identification du besoin, validation des orientations et suivi de la mission |
| Service Sûreté et Sécurité | Expression des besoins opérationnels et utilisation des informations de supervision |
| Équipe infrastructure / informatique | Environnement serveur, réseau et intégration dans l'infrastructure existante |
| Moi-même, alternant | Étude, conception, installation, configuration, intégration, tests et documentation de la solution |
| Équipes d'audit | Exploitation des informations et rapports nécessaires au suivi de l'infrastructure |

Mon intervention a porté principalement sur la conception et la mise en œuvre technique de la solution de supervision ainsi que sur sa documentation.

---

## 4. Planning prévisionnel

La mission s'est déroulée progressivement sur une période d'environ un an et demi, afin d'intégrer progressivement les différents équipements et d'adapter la supervision aux besoins du service.

| Étape | Objectif |
| --- | --- |
| 1. Analyse du besoin | Identifier les équipements à superviser et les besoins opérationnels |
| 2. Choix de la solution | Étudier les possibilités et définir l'architecture Zabbix |
| 3. Préparation de l'environnement | Préparer la machine virtuelle et le système Rocky Linux |
| 4. Installation | Installer et configurer Zabbix, Nginx et PostgreSQL |
| 5. Sécurisation | Appliquer les mesures de durcissement du serveur |
| 6. Première intégration | Ajouter les premiers équipements à superviser |
| 7. Développement des modèles | Adapter la supervision aux équipements Axis et Bosch |
| 8. Supervision infrastructure | Ajouter les hyperviseurs et machines virtuelles |
| 9. Cartographie | Construire une représentation de l'état de disponibilité |
| 10. Alerting | Définir les niveaux de criticité et les notifications |
| 11. Reporting | Mettre en place les rapports périodiques |
| 12. Documentation | Documenter l'architecture, les configurations et l'exploitation |

---

## 5. Grandes étapes de réalisation

### 5.1 Analyse du besoin

La première étape a consisté à identifier les équipements nécessitant une supervision et les informations réellement utiles aux équipes.

Le périmètre comprenait notamment les équipements de vidéoprotection ainsi que l'infrastructure serveur et virtuelle.

Les principaux besoins identifiés étaient :

- supervision de la disponibilité ;
- identification des équipements indisponibles ;
- récupération d'informations techniques ;
- différenciation des niveaux de criticité ;
- génération d'alertes ;
- représentation synthétique de l'état de l'infrastructure ;
- génération de rapports.

Une attention particulière a été portée à l'évolutivité de la solution afin de pouvoir ajouter ultérieurement de nouveaux équipements sans remettre en cause l'architecture existante.

### 5.2 Choix et architecture de la solution

J'ai étudié les possibilités de supervision adaptées au contexte de l'entreprise.

Le choix s'est porté sur Zabbix notamment pour :

- son modèle open source ;
- l'absence de coût de licence pour son utilisation ;
- sa capacité à superviser différents types d'équipements ;
- ses possibilités de personnalisation ;
- la disponibilité de modèles de supervision ;
- ses mécanismes d'alerting ;
- sa capacité à évoluer avec l'infrastructure.

L'architecture retenue repose sur une machine virtuelle Rocky Linux dédiée à Zabbix, avec Nginx pour le serveur Web et PostgreSQL pour la base de données.

La supervision a été pensée afin de pouvoir intégrer progressivement les équipements du périmètre.

### 5.3 Installation et sécurisation du serveur Zabbix

J'ai installé le serveur Zabbix sur une machine virtuelle Rocky Linux.

Avant la mise en production, le système a été mis à jour et plusieurs mesures de sécurisation ont été appliquées.

J'ai notamment travaillé sur :

- l'utilisation de l'authentification SSH par clé ;
- la désactivation de l'accès direct du compte root ;
- la restriction des communications avec le pare-feu `firewalld` ;
- l'utilisation de comptes dédiés pour les services ;
- la limitation de l'exécution des services avec des privilèges élevés ;
- la sécurisation de l'accès à l'interface Web.

Le serveur Zabbix étant lui-même un composant critique de supervision, il était important de ne pas négliger sa propre sécurité.

### 5.4 Création et adaptation des modèles de supervision

Une partie importante de la mission a consisté à adapter la supervision aux équipements réellement présents dans l'infrastructure.

Pour les équipements de vidéoprotection, les besoins identifiés comprenaient notamment :

- disponibilité ;
- identification ;
- état de fonctionnement ;
- récupération de certaines informations techniques.

Les modèles existants ne couvrant pas nécessairement l'ensemble des informations recherchées, j'ai adapté et développé des éléments de supervision spécifiques.

Cette approche permettait d'obtenir des informations pertinentes sans dépendre exclusivement des modèles standards fournis avec la solution.

### 5.5 Intégration des équipements

Une fois la plateforme opérationnelle, les équipements ont été intégrés progressivement.

Le périmètre comprenait notamment :

- les équipements de vidéoprotection ;
- les hyperviseurs Hyper-V ;
- les machines virtuelles Windows Server ;
- les machines virtuelles Linux ;
- les différents composants nécessaires au fonctionnement de l'infrastructure.

L'intégration progressive permettait de vérifier le comportement de la supervision avant d'étendre le périmètre.

### 5.6 Matrice des flux de supervision

Afin de documenter les communications nécessaires au fonctionnement de la supervision, j'ai identifié les principaux flux entre le serveur Zabbix et les équipements supervisés.

La matrice technique définitive doit être renseignée avec les adresses IP, VLAN, protocoles et ports réellement utilisés dans l'environnement.

| ID | Source | Destination | Fonction | Direction | Protocole / port |
| --- | --- | --- | --- | --- | --- |
| Z01 | Serveur Zabbix | Équipements supervisés | Collecte des informations | À confirmer selon le mode | À vérifier |
| Z02 | Équipements supervisés | Serveur Zabbix | Remontée d'informations | À confirmer selon le mode | À vérifier |
| Z03 | Serveur Zabbix | Hyperviseurs Hyper-V | Supervision | Selon méthode utilisée | À vérifier |
| Z04 | Serveur Zabbix | Machines Windows | Supervision | Selon méthode utilisée | À vérifier |
| Z05 | Serveur Zabbix | Machines Linux | Supervision | Selon méthode utilisée | À vérifier |
| Z06 | Serveur Zabbix | Serveur SMTP | Envoi des alertes | Sortant | À vérifier |
| Z07 | Poste administrateur | Serveur Zabbix | Administration | Entrant | HTTPS / port à confirmer |

Cette matrice permet de disposer d'une vision claire des communications nécessaires et constitue également un support utile pour vérifier la cohérence avec la segmentation réseau et les règles de filtrage.

Les ports et protocoles définitifs doivent être reportés à partir de la configuration réellement déployée afin d'éviter toute approximation dans la documentation.

### 5.7 Mise en place de la cartographie

Une cartographie de disponibilité a ensuite été mise en place afin de disposer d'une représentation synthétique de l'état des équipements supervisés.

Cette représentation permet de distinguer rapidement les équipements disponibles et ceux présentant un défaut.

Elle facilite ainsi le diagnostic initial lorsqu'une alerte est générée.

### 5.8 Mise en place des alertes

Des niveaux de criticité ont été définis afin d'adapter les notifications à l'importance des événements.

Lorsqu'un équipement passe dans un état nécessitant une intervention, une notification peut être transmise par courrier électronique aux personnes concernées.

Par exemple, lorsqu'une caméra devient indisponible, l'alerte permet d'identifier l'équipement concerné et son état.

Cette automatisation permet de réduire la dépendance à une détection exclusivement humaine.

### 5.9 Reporting

Un reporting périodique a également été mis en place afin de fournir une vision synthétique de l'état de l'infrastructure.

Ces rapports permettent notamment de conserver une trace des événements observés et de disposer d'éléments exploitables lors des opérations de suivi ou d'audit.

### 5.10 Documentation et transfert

La dernière étape a consisté à documenter la solution afin de permettre sa compréhension et son exploitation dans la durée.

La documentation porte notamment sur :

- l'architecture ;
- les composants utilisés ;
- les équipements supervisés ;
- les modèles de supervision ;
- les alertes ;
- les règles de fonctionnement ;
- les procédures d'exploitation.

Cette étape est importante afin que la solution ne dépende pas uniquement des connaissances de la personne ayant réalisé son déploiement.

---

## 6. Résultat mesurable

La mise en œuvre de Zabbix a permis de disposer d'une supervision centralisée de l'infrastructure concernée.

Les résultats obtenus sont notamment :

- centralisation de la supervision ;
- supervision des équipements de vidéoprotection intégrés ;
- supervision des hyperviseurs et machines virtuelles intégrés ;
- détection automatisée des indisponibilités ;
- génération d'alertes par niveau de criticité ;
- représentation synthétique de l'état de l'infrastructure ;
- mise en place d'un reporting périodique ;
- documentation de la solution.

La solution permet ainsi d'identifier plus rapidement les équipements présentant un défaut qu'avec une détection reposant uniquement sur un constat humain.

La valeur mesurable de la solution devra être complétée par des indicateurs issus de la configuration réelle, notamment l'intervalle de supervision, le nombre exact d'équipements supervisés et, si disponible, un exemple d'incident réellement détecté par Zabbix.

---

## 7. Compétences mobilisées

Cette mission m'a permis de mobiliser plusieurs compétences du référentiel RNCP37680.

### BC01 - Administrer et sécuriser les infrastructures

**Appliquer les bonnes pratiques dans l'administration des infrastructures**

J'ai appliqué des pratiques d'administration et de sécurisation lors de la préparation du serveur Zabbix : mises à jour, comptes dédiés, authentification SSH par clé, restriction de l'accès root et configuration du pare-feu.

**Administrer et sécuriser les infrastructures systèmes**

La mise en œuvre d'une machine virtuelle Rocky Linux, l'installation des composants Zabbix, Nginx et PostgreSQL ainsi que leur configuration m'ont permis de mobiliser les compétences liées à l'administration d'une infrastructure système.

**Administrer et sécuriser les infrastructures réseaux**

La conception des flux nécessaires à la supervision et leur intégration dans l'environnement réseau m'ont permis de prendre en compte les communications entre le serveur de supervision et les équipements supervisés.

### BC02 - Concevoir et mettre en œuvre une solution en réponse à un besoin d'évolution

**Concevoir une solution technique répondant à des besoins d'évolution de l'infrastructure**

J'ai analysé le besoin de supervision, étudié les solutions possibles puis conçu une architecture adaptée au contexte de l'entreprise.

**Mettre en production des évolutions de l'infrastructure**

J'ai participé à la mise en production de la solution Zabbix et à l'intégration progressive des équipements.

**Mettre en œuvre et optimiser la supervision des infrastructures**

Cette compétence constitue le cœur de la mission. J'ai mis en œuvre Zabbix, développé ou adapté les modèles de supervision, intégré les équipements, créé une cartographie, configuré les alertes et mis en place du reporting.

### BC03 - Participer à la gestion de la cybersécurité

Cette mission contribue également à la sécurité de l'infrastructure par la sécurisation du serveur de supervision et par l'amélioration de la capacité de détection des indisponibilités.

Cependant, les compétences du bloc BC03 ne seront retenues dans le dossier que lorsque les actions réalisées correspondent précisément aux situations prévues par le référentiel, notamment lorsqu'elles concernent effectivement l'analyse du niveau de sécurité, la politique de sécurité ou le traitement d'un incident de sécurité.