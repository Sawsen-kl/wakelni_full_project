# 🍽️ Wakelni – Application Web Transactionnelle (Django + Next.js + Stripe)

Projet de plateforme de repas faits maison reliant **clients** et **cuisiniers**, avec :

- Backend en **Django + Django REST Framework**
- Frontend en **Next.js (React)**  
- Authentification JWT
- Paiement en ligne avec **Stripe**
- Gestion des commandes, avis et réclamations

---

## 1. Architecture générale

```text
+-----------------------+          +----------------------------+
|  Frontend Next.js     |  HTTP    |  Backend Django / DRF      |
|  (wakelni-frontend)   +--------->+  (wakelni-backend)         |
|  http://localhost:3000|  JSON    |  http://localhost:8000     |
+-----------------------+          +----------------------------+
                                           |
                                           | ORM
                                           v
                                    Base de données (Neon / SQLite)

```
- Le frontend appelle le backend via des requêtes HTTP (GET, POST, PATCH, DELETE) sur des URLs du type /api/....
- Les réponses sont en JSON.
- L’authentification se fait avec des tokens JWT envoyés dans l’en-tête :

```http
Authorization: Bearer <accessToken>
```
Le frontend lit l’URL du backend via la variable d’environnement :
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```
---

## 2. Arborescence (simplifiée)
```text
wakelni_full_project/
├── wakelni-backend/          # Projet Django (API)
│   ├── manage.py
│   ├── wakelni_backend/      # settings, urls, wsgi
│   ├── users/                # utilisateurs, login, register, rôles
│   ├── plats/                # plats des cuisiniers
│   ├── paniers/              # panier du client
│   ├── commandes/            # commandes et statuts
│   ├── avis/                 # avis sur les plats
│   ├── reclamations/         # réclamations sur les commandes
│   └── ...
└── wakelni-frontend/         # Projet Next.js
    ├── app/
    │   ├── login/
    │   ├── client/
    │   │   ├── page.tsx
    │   │   ├── commandes/
    │   │   └── reclamations/
    │   └── cuisinier/
    ├── lib/api.ts            # helper pour appeler le backend
    └── ...
```
---

## 2. Lancer le backend (Django / DRF)

### 3.1. Prérequis

- Python 3.11 (ou 3.10)
- pip
- (optionnel) Base de données Neon/PostgreSQL
→ sinon, SQLite par défaut fonctionne aussi.

### 3.2. Installation

Depuis le dossier wakelni-backend :
```bash
cd wakelni-backend

# Créer un virtualenv
python -m venv venv
# Activer le venv
# Windows :
venv\Scripts\activate
# macOS / Linux :
# source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```
### 3.3. Variables d’environnement backend

Créer un fichier .env (ou utiliser les settings existants) avec au minimum :

```env
SECRET_KEY=change_me_en_prod
DEBUG=True

# Exemple Neon / Postgres (adapter)
DATABASE_URL=postgres://user:password@host:port/dbname

# ou, pour SQLite, Django peut utiliser le settings par défaut

# Stripe (si utilisé côté backend)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```
### 3.4. Migrations & superuser
```bash
# appliquer les migrations
python manage.py makemigrations
python manage.py migrate

# créer un superuser admin
python manage.py createsuperuser
```
### 3.5. Lancer le serveur backend
```bash
python manage.py runserver
```

Le backend écoute par défaut sur :

http://127.0.0.1:8000

## 4. Lancer le frontend (Next.js)
### 4.1. Prérequis

Node.js >= 18

npm ou yarn

### 4.2. Installation

Depuis le dossier wakelni-frontend :
```bash
cd wakelni-frontend

# Installer les dépendances
npm install
# ou
# yarn
```
### 4.3. Variables d’environnement frontend

Créer un fichier .env.local dans wakelni-frontend :
```env
# URL de l’API Django
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# Clé publique Stripe (si utilisée côté frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### 4.4. Lancer le serveur frontend
```bash
npm run dev
# ou
# yarn dev
```

Le frontend écoute par défaut sur :

http://localhost:3000

## 5. Fonctionnement côté CLIENT
### 5.1. Authentification

1. Le client se connecte via la page /login.
2. Le frontend envoie une requête vers l’API Django (ex. /api/users/login/).
3. Le backend renvoie :
    - access (JWT)
    - refresh (JWT)
    - infos utilisateur (nom, rôle, email…)

Le frontend stocke accessToken + infos dans localStorage.
Toutes les requêtes suivantes passent par lib/api.ts, qui ajoute le header :
```http
Authorization: Bearer <accessToken>
```
### 5.2. Parcours principal client

- Accueil client : /client
    - Liste des plats disponibles (GET /api/plats/)
    - Ajout au panier (POST /api/paniers/ajouter/)

- Panier : /client/panier
    - Consultation panier (GET /api/paniers/…)
    - Paiement Stripe : appel à un endpoint backend qui crée une Session Stripe, puis redirection.

- Commandes : /client/commandes
    - Liste des commandes (GET /api/commandes/mes-commandes/)
    - Confirmation de réception / annulation via POST sur des endpoints dédiés.

- Avis sur les plats :
    - Modal depuis la page /client sur un plat :
        - GET /api/avis/avis-par-plat/?plat_id=... → liste des avis
        - GET /api/avis/mon-avis/?plat_id=... → avis du client connecté
        - POST /api/avis/laisser-avis/ → création / mise à jour de l’avis
(seulement si le client a déjà commandé ce plat)

- Réclamations :
    - Page /client/reclamations
        - GET /api/reclamations/mes-reclamations/ → historique des réclamations
        - POST /api/reclamations/creer/
            - Body : commande_id, motif, description
            - Unicité : une seule réclamation par client / commande / plat

## 6. Fonctionnement côté CUISINIER
### 6.1. Dashboard cuisinier : /cuisinier

Fonctionnalités (selon ce qui a été implémenté) :
- voir ses plats (GET /api/plats/mes-plats/)
- ajouter un plat (POST /api/plats/ via formulaire /cuisinier/plat-nouveau)

### 6.2. Commandes : /cuisinier/commandes

- GET /api/commandes/mes-commandes/
(Commandes associées à ce cuisinier)
- Changer le statut d’une commande :
    - PATCH /api/commandes/<id>/changer-statut/
    - Statuts possibles : EN_ATTENTE, EN_PREPARATION, PRET, REMIS, COMPLETEE, ANNULEE

### 6.3. Avis reçus : /cuisinier/avis

- GET /api/avis/avis-cuisinier/
Liste des avis sur les plats de ce cuisinier :
email client, nom client, plat, note, commentaire, date.

### 6.4. Réclamations reçues : /cuisinier/reclamations

- GET /api/reclamations/cuisinier/
Récupère les réclamations où cuisinier == request.user.
- Mise à jour du statut d’une réclamation :
    - POST /api/reclamations/<uuid:pk>/changer-statut/
    - Body :
```json
{ "statut": "LU" | "EN_COURS" | "TRAITEE" | "REJETEE" | "OUVERT" }
```
## 7. API – Récapitulatif des endpoints principaux

⚠️ Les préfixes exacts peuvent varier, adapter selon ton urls.py.

- Auth / Users
    - POST /api/users/register/
    - POST /api/users/login/

- Plats
    - GET /api/plats/
    - POST /api/plats/ (cuisinier)

- Panier / Paiement
    - POST /api/paniers/ajouter/
    - GET /api/paniers/…
    - POST /api/paiement/… (Stripe Checkout, selon ton implémentation)

- Commandes
    - GET /api/commandes/mes-commandes/
    - POST /api/commandes/<id>/annuler/
    - POST /api/commandes/<id>/confirmer-reception/
    - PATCH /api/commandes/<id>/changer-statut/ (cuisinier)

- Avis
    - GET /api/avis/avis-par-plat/?plat_id=...
    - GET /api/avis/mon-avis/?plat_id=...
    - POST /api/avis/laisser-avis/
    - GET /api/avis/avis-cuisinier/ (cuisinier)

- Réclamations
    - GET /api/reclamations/mes-reclamations/ (client)
    - POST /api/reclamations/creer/ (client)
    - GET /api/reclamations/cuisinier/ (cuisinier)
    - POST /api/reclamations/<uuid:pk>/changer-statut/ (cuisinier)

## 8. Lancer l’application – Récapitulatif

1. Backend
```bash
cd wakelni-backend
python -m venv venv
venv\Scripts\activate   # ou source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

2. Frontend
```bash
cd wakelni-frontend
npm install
# vérifier que NEXT_PUBLIC_API_URL pointe vers le backend
npm run dev
```

3. Aller sur :
➜ http://localhost:3000

## 9. Notes pour le rapport / démo

- Séparation claire des responsabilités :
    - Django = API + logique métier + base de données.
    - Next.js = interface utilisateur, composant React, appels API.

- Sécurité :
    - JWT pour l’authentification.
    - Rôles : CLIENT / CUISINIER.
    - Vérification côté backend avant de :
        - laisser un avis (commande obligatoire)
        - créer une réclamation (commande du client)
        - voir les réclamations / avis (cuisinier seulement pour les siens).

- Extensibilité :
    - Ajout possible : historique des paiements, factures PDF, notifications, etc.

