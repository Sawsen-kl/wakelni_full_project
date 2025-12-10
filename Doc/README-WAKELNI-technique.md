# WAKELNI -- README Technique (Backend, Frontend, Base de données)

## 1. Vue d'ensemble

WAKELNI est une application web transactionnelle qui met en relation : -
des cuisiniers qui publient des plats faits maison, - des clients qui
commandent, paient en ligne, laissent des avis et peuvent déposer des
réclamations.

L'application est découpée en trois grandes parties : - Backend : API
REST en Django + Django REST Framework, connectée à PostgreSQL (Neon). -
Frontend : interface utilisateur en Next.js (React). - Base de données :
PostgreSQL (instance Neon).

La communication entre frontend et backend se fait via des requêtes HTTP
sécurisées avec des JWT.

## 2. Architecture générale

### wakelni-backend/

Projet Django (API REST)

Apps principales : - users - plats - paniers - commandes - avis -
reclamations

### wakelni-frontend/

Projet Next.js (App Router)

Pages principales : - /login, /register - /client, /client/panier,
/client/commandes, /client/reclamations, /client/profile,
/client/contact - /cuisinier, /cuisinier/plat-nouveau,
/cuisinier/commandes, /cuisinier/reclamations, /cuisinier/avis

## 3. Backend -- Django / DRF

### 3.1. Technologies

-   Python 3.11
-   Django
-   Django REST Framework
-   JWT (simplejwt)
-   PostgreSQL (Neon)
-   Stripe

### 3.2. Authentification et rôles

-   Rôles : CLIENT, CUISINIER
-   JWT stocké dans le localStorage
-   Vues protégées par IsAuthenticated

### 3.3. App plats

-   CRUD des plats côté cuisinier
-   Endpoints principaux :
    -   GET /api/plats/
    -   GET /api/plats/mes-plats/
    -   POST /api/plats/
    -   PATCH /api/plats/`<id>`{=html}/

### 3.4. App paniers

-   Ajout, modification, suppression du panier
-   Endpoints :
    -   POST /api/paniers/ajouter/
    -   POST /api/paniers/modifier/
    -   POST /api/paniers/vider/
    -   GET /api/paniers/moi/

### 3.5. App commandes

-   Gestion des statuts de commandes
-   Client :
    -   GET /api/commandes/mes-commandes/
    -   POST /api/commandes/`<id>`{=html}/annuler/
    -   POST /api/commandes/`<id>`{=html}/confirmer-reception/
-   Cuisinier :
    -   PATCH /api/commandes/`<id>`{=html}/changer-statut/

### 3.6. Avis

-   Note 1 à 5
-   Un seul avis par client et par plat
-   Endpoints :
    -   POST /api/avis/laisser-avis/
    -   GET /api/avis/mon-avis/
    -   GET /api/avis/avis-par-plat/
    -   GET /api/avis/avis-cuisinier/

### 3.7. Réclamations

-   Une seule réclamation par commande et plat
-   Endpoints :
    -   POST /api/reclamations/creer/
    -   GET /api/reclamations/mes-reclamations/
    -   GET /api/reclamations/cuisinier/
    -   POST /api/reclamations/`<uuid>`{=html}/changer-statut/

## 4. Frontend -- Next.js

### 4.1. Technologies

-   Next.js
-   React
-   TypeScript

### 4.2. Client HTTP (lib/api.ts)

-   Gestion du token JWT
-   Gestion automatique des erreurs 401

### 4.3. Pages Client

-   Plats
-   Panier
-   Commandes
-   Réclamations
-   Profil
-   Contact

### 4.4. Pages Cuisinier

-   Gestion des plats
-   Commandes
-   Réclamations
-   Avis

## 5. Base de Données (PostgreSQL - Neon)

Tables principales : - users_user - plats_plat - paniers_panier -
commandes_commande - commandes_lignecommande - avis_avis -
reclamations_reclamation

## 6. Communication Backend ↔ Frontend

-   API REST sécurisée par JWT
-   Authorization: Bearer `<token>`{=html}
-   Gestion automatique de la session côté frontend
