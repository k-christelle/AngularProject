# Gestion des Assignments - Application Angular
## Description
Ce projet est une application web développée avec **Angular** (frontend) et **Node.js** (backend) pour gérer des assignments (devoirs) dans un contexte académique. L'application permet à un administrateur (`LineoL`) de créer, modifier, et supprimer des assignments, et aux utilisateurs réguliers de consulter les assignments qui leur sont attribués. Elle inclut une interface utilisateur moderne avec Angular Material, une sidebar pour la navigation, et un backend connecté à une base de données MongoDB.
---
## Fonctionnalités Implémentées
### 1. Frontend (Angular)
- **Architecture Standalone** : L'application utilise des composants standalone (pas de `NgModule`), ce qui simplifie la structure du projet.
- **Authentification Simple** :
  - Page de connexion (`/login`) et d'inscription (`/signup`) pour les utilisateurs.
  - Gestion de l'état de connexion avec `AuthService` utilisant le `localStorage` et un `BehaviorSubject` pour une mise à jour réactive.
- **Sidebar (Barre de navigation latérale)** :
  - Implémentée avec `MatSidenav` d'Angular Material.
  - Contient des liens dynamiques :
    - "Assignments" (toujours visible).
    - "Créer un compte" et "Connexion" (visibles si l'utilisateur n'est pas connecté).
    - "Déconnexion" (visible si l'utilisateur est connecté).
  - Mise à jour réactive après connexion/déconnexion grâce à un Observable.
- **Gestion des Assignments** (`AssignmentsComponent`) :
  - Liste des assignments dans un tableau (`MatTable`) avec les colonnes : titre, description, date de création, créateur, assigné à, matière, note, remarques, et actions.
  - Création d'assignments (réservée à l'admin `LineoL`) via un formulaire.
  - Modification d'assignments via une boîte de dialogue (`MatDialog`).
  - Suppression d'assignments avec confirmation.
- **Interface Utilisateur** :
  - Utilisation d'Angular Material pour les composants (tableau, formulaires, sidebar, boîtes de dialogue, notifications).
  - Notifications avec `MatSnackBar` pour confirmer les actions (création, modification, suppression).
### 2. Backend (Node.js)
- **API REST** :
  - Endpoints pour gérer les utilisateurs (`/api/users`) et les assignments (`/api/assignments`).
  - `GET /api/assignments?nom=<nom>` : Récupère les assignments créés par l'admin (`LineoL`) ou assignés à un utilisateur.
  - `POST /api/assignments` : Crée un nouvel assignment.
  - `PUT /api/assignments/:id` : Met à jour un assignment existant (réservé à l'admin).
  - `DELETE /api/assignments/:id` : Supprime un assignment (réservé à l'admin).
- **Base de Données** :
  - MongoDB utilisé pour stocker les utilisateurs et les assignments.
  - Collections : `Users` (utilisateurs) et `Assignments` (assignments).
- **Sécurité** :
  - Vérification que seul l'admin (`LineoL`) peut créer, modifier, ou supprimer des assignments.
---
## Prérequis
Pour exécuter cette application sur votre machine, vous devez avoir les outils suivants installés :
- **Node.js** (version 18 ou supérieure) : [Télécharger](https://nodejs.org/)
- **Angular CLI** (version 17 ou supérieure) : Installez-le globalement avec :
  ```bash
  npm install -g @angular/cli
  ```
- **MongoDB** (version 4.4 ou supérieure) : [Télécharger](https://www.mongodb.com/try/download/community)

---
## Installation et Exécution
### 1. Cloner le Répertoire
```bash
git clone https://github.com/k-christelle/AngularProject.git
cd AngularProject
```

### 2. Installer les Dépendances
Pour installer les dépendances du frontend et du backend :
```bash
# Dans le dossier racine du projet
npm install
```

### 3. Démarrer l'Application
Pour démarrer l'application en mode développement :
```bash
# Démarrer le serveur backend
npm run start:server

# Dans un autre terminal, démarrer le frontend Angular
ng serve
```

L'application sera accessible à l'adresse local.

---
## Génération des Données
Pour faciliter les tests et démonstrations, nous avons utilisé [Mockaroo](https://www.mockaroo.com/) pour générer un ensemble de données d'assignments fictifs. Cet outil nous a permis de créer rapidement des données réalistes pour peupler notre base de données MongoDB.

### Peupler la base (interface)
- Une fois connecté en tant qu'admin (`LineoL`), cliquez sur **"Peupler la base (data.ts)"** dans la page des assignments.
- Cela injecte automatiquement les données de `src/app/shared/data.ts` dans MongoDB.
- Cette action n’est effectuée que manuellement : le peuplement ne se produit plus automatiquement à chaque chargement de page.

### Réinitialiser la base
- Un bouton **"Réinitialiser la base"** est également disponible pour tout effacer puis repopuler en une seule action.
- Cette opération est réservée à l’administrateur et vide **tous** les assignments avant de relancer le peuplement.

### Points techniques importants
- Le backend expose désormais deux endpoints distincts pour le seed :
  - `DELETE /api/assignments` (vide la collection puis repopule la base)
  - `POST /api/assignments` (ajoute un assignment)

---
## Connexion Admin
Pour accéder aux fonctionnalités d'administration (création, modification et suppression d'assignments), utilisez les identifiants suivants :
- **Nom d'utilisateur** : LineoL
- **Mot de passe** : admin

---
## Notes Techniques
- **Version d’Angular** : Ce projet utilise **Angular 21** (dépendances en `^21.2.2` dans `angularProjectFront/package.json`).
- **Utilisation des signaux (signals)** : L’état de l’application (utilisateur connecté, liste des assignments, etc.) est géré avec les **Angular Signals** (`signal`, `computed`) pour une réactivité fine et une meilleure performance.
- **Gestion des Dates** : En raison de certaines difficultés rencontrées lors de la manipulation des dates dans notre application, nous avons opté pour stocker les dates sous forme de chaînes de caractères (string) plutôt que d'utiliser le type Date natif de JavaScript/TypeScript.


---
## Fonctionnalités Impréssionnant
- Animation sur les différents formulaires pour un design de qualité
