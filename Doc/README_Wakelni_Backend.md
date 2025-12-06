# Wakelni – Backend Django (API)

Backend de l’application **Wakelni** : plateforme de commande de plats entre **cuisiniers** et **clients**.

- Framework : **Django 5.2.8**
- API : **Django REST Framework**
- Authentification : **JWT (djangorestframework-simplejwt)**
- Base de données : **PostgreSQL (Neon.tech)**

Ce document explique **toutes les étapes d’installation** et recense **toutes les apps Django** du projet :  
`users`, `plats`, `commandes`, `paniers`, `reclamations`, `avis`, `notifications_app`, `paiements`.

---

## 1. Prérequis

- Python **3.11**
- `pip`
- (Recommandé) `virtualenv`
- Un compte **Neon.tech** pour la base PostgreSQL
- Git (si le projet est cloné depuis un dépôt)

---

## 2. Installation du projet

### 2.1. Positionnement dans le dossier

```bash
cd C:\applicationWebTransactionnel\wakelni_full_project\wakelni-backend
```

### 2.2. Création et activation de l’environnement virtuel

```bash
python -m venv venv

# Activation sous Windows (PowerShell / CMD)
venv\Scripts\activate
```

### 2.3. Installation des dépendances Python

Librairies principales :

- `Django==5.2.8`
- `djangorestframework`
- `djangorestframework-simplejwt`
- `psycopg2-binary`
- `dj-database-url` (optionnel)
- autres libs listées dans `requirements.txt`

Installation (exemple) :

```bash
pip install -r requirements.txt
```

ou, si besoin de recréer le fichier :

```bash
pip install django==5.2.8 djangorestframework djangorestframework-simplejwt psycopg2-binary dj-database-url
pip freeze > requirements.txt
```

---

## 3. Création des applications Django

Les apps ont été créées avec les commandes suivantes :

```bash
python manage.py startapp users
python manage.py startapp plats
python manage.py startapp commandes
python manage.py startapp paniers
python manage.py startapp reclamations
python manage.py startapp avis
python manage.py startapp notifications_app
python manage.py startapp paiements
```

Ces apps sont déclarées dans `wakelni_backend/settings.py` :

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework.authtoken',

    'users',
    'plats',
    'commandes',
    'paniers',
    'reclamations',
    'avis',
    'notifications_app',
    'paiements',
]
```

Le projet utilise un **User personnalisé** :

```python
AUTH_USER_MODEL = 'users.User'
```

### Rôle des principales apps

- **users** : modèle `User` (client / cuisinier), inscription, login, JWT.
- **plats** : gestion des plats proposés par les cuisiniers.
- **paniers** : gestion du panier d’un client avant la création d’une commande.
- **commandes** : commande finale + lignes de commande.
- **reclamations** : réclamations client après une commande.
- **avis** : notes et commentaires sur un plat / une commande.
- **notifications_app** : notifications envoyées aux cuisiniers / clients (ex : nouvelle commande).
- **paiements** : informations de paiement / statut de paiement (selon le diagramme de classes).

---

## 4. Configuration de la base de données Neon

### 4.1. Création de la base sur Neon

Sur **Neon.tech** :

1. Créer un projet PostgreSQL.
2. Créer une base (ex. `neondb`).
3. Créer un utilisateur (ex. `neondb_owner`) avec mot de passe.
4. Récupérer l’URL de connexion, par ex. :

```text
postgresql://neondb_owner:TON_MOT_DE_PASSE@ep-frosty-river-a44qkd3q-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 4.2. Fichier `.env` (mémo des infos de connexion)

Exemple :

```env
DATABASE_URL='postgresql://neondb_owner:TON_MOT_DE_PASSE@ep-frosty-river-a44qkd3q-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=TON_MOT_DE_PASSE
DB_HOST=ep-frosty-river-a44qkd3q-pooler.us-east-1.aws.neon.tech
DB_PORT=5432
```

### 4.3. Configuration `DATABASES` dans `settings.py`

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "neondb",
        "USER": "neondb_owner",
        "PASSWORD": "TON_MOT_DE_PASSE",
        "HOST": "ep-frosty-river-a44qkd3q-pooler.us-east-1.aws.neon.tech",
        "PORT": "5432",
        "OPTIONS": {
            "sslmode": "require",
        },
    }
}
```

---

## 5. Django REST Framework & JWT

Configuration de base dans `settings.py` :

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    )
}
```

Les URLs principales sont dans `wakelni_backend/urls.py` :

```python
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def home(request):
    return JsonResponse({"message": "API Wakelni fonctionne 🍲"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home),

    path('api/users/', include('users.urls')),
    path('api/plats/', include('plats.urls')),
    path('api/commandes/', include('commandes.urls')),
    path('api/paniers/', include('paniers.urls')),
    path('api/reclamations/', include('reclamations.urls')),
    path('api/avis/', include('avis.urls')),
    path('api/notifications/', include('notifications_app.urls')),
    path('api/paiements/', include('paiements.urls')),
]
```

Côté `users.urls`, on retrouve notamment :

- `POST /api/users/register/` – inscription (client ou cuisinier)
- `POST /api/users/login/` – récupération des tokens JWT (access + refresh)
- `POST /api/users/refresh/` – renouvellement du token access
- `GET  /api/users/me/` – informations sur l’utilisateur connecté

---

## 6. Migrations

Après avoir défini les modèles dans toutes les apps :

```bash
# Génération des migrations pour toutes les apps métiers
python manage.py makemigrations users plats commandes paniers reclamations avis notifications_app paiements

# Application de toutes les migrations sur la base Neon
python manage.py migrate
```

Pour vérifier :

```bash
python manage.py showmigrations
```

---

## 7. Création d’un super utilisateur (admin)

```bash
python manage.py createsuperuser
# → saisir username, email, mot de passe
```

Puis se connecter sur :

- `http://127.0.0.1:8000/admin/`

---

## 8. Lancer le serveur de développement

Dans le venv :

```bash
python manage.py runserver
```

Le backend est alors disponible sur :

```text
http://127.0.0.1:8000
```

Endpoints de test rapides :

- `GET /` → message JSON : `{"message": "API Wakelni fonctionne 🍲"}`
- `POST /api/users/register/` → création d’un client ou cuisinier
- `POST /api/users/login/` → obtention des tokens JWT
- `GET /api/plats/` → liste des plats
- `POST /api/plats/` → création d’un plat (JWT requis)
- `GET /api/paniers/` → opérations sur le panier
- `GET /api/commandes/` → suivi des commandes
- `GET /api/avis/` → consultation / ajout d’avis
- `GET /api/notifications/` → notifications
- `GET /api/reclamations/` → gestion des réclamations
- `GET /api/paiements/` → informations de paiement (selon implémentation)

---

## 9. Résumé des commandes importantes

```bash
# 1) Création et activation du venv
python -m venv venv
venv\Scripts\activate

# 2) Installation des dépendances
pip install -r requirements.txt

# 3) Création des apps (déjà fait dans le projet)
python manage.py startapp users
python manage.py startapp plats
python manage.py startapp commandes
python manage.py startapp paniers
python manage.py startapp reclamations
python manage.py startapp avis
python manage.py startapp notifications_app
python manage.py startapp paiements

# 4) Migrations
python manage.py makemigrations users plats commandes paniers reclamations avis notifications_app paiements
python manage.py migrate

# 5) Superuser
python manage.py createsuperuser

# 6) Lancer le serveur
python manage.py runserver
```

Ce README décrit l’installation complète du **backend Wakelni** avec **toutes les apps** :
`users`, `plats`, `commandes`, `paniers`, `reclamations`, `avis`, `notifications_app`, `paiements`.
