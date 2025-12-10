# 🍽️ Wakelni -- Application Web Transactionnelle (Django + Next.js + Stripe)

Projet de plateforme de repas faits maison reliant **clients** et
**cuisiniers**, avec :

-   Backend en **Django + Django REST Framework**
-   Frontend en **Next.js (React)**
-   Authentification JWT
-   Paiement en ligne avec **Stripe**
-   Gestion des commandes, avis et réclamations

------------------------------------------------------------------------

## 1. Architecture générale

``` text
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

------------------------------------------------------------------------

## 2. Lancement de l'application

### Backend

``` bash
cd wakelni-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

``` bash
cd wakelni-frontend
npm install
npm run dev
```

------------------------------------------------------------------------

## 3. Fonctionnement

-   Le frontend communique avec le backend via HTTP (fetch API).
-   Les données transitent en JSON.
-   Authentification sécurisée via JWT.
-   Le token est stocké dans le navigateur et transmis dans les headers.

------------------------------------------------------------------------

## 4. Fonctionnalités principales

### Client

-   Création de compte et connexion
-   Consultation des plats
-   Ajout au panier
-   Paiement Stripe
-   Historique des commandes
-   Avis sur plat
-   Réclamations

### Cuisinier

-   Ajout de plats
-   Gestion des commandes
-   Réception des avis
-   Gestion des réclamations

------------------------------------------------------------------------

## 5. Auteur

Projet réalisé par **Sawsen Klai**
