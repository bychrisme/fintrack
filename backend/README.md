# FinTrack API - Guide de Déploiement en Production

Ce document décrit la procédure étape par étape pour déployer le serveur API NestJS de **FinTrack** dans un environnement de production.

---

## 📋 Prérequis de Production

Assurez-vous que votre serveur (VPS Linux / Cloud) dispose des outils suivants :
- **Node.js** (version 20 ou supérieure recommandée)
- **NPM** (généralement installé avec Node.js)
- **PM2** (gestionnaire de processus Node.js pour maintenir l'application en ligne) :
  ```bash
  sudo npm install -g pm2
  ```
- **Git** (pour récupérer le code source)

---

## 🚀 Étapes de Déploiement

### 1. Préparation du répertoire de production
Accédez au répertoire de votre projet sur votre serveur (par exemple `/var/www/bychrisme/fintrack/backend`) :
```bash
cd /var/www/bychrisme/fintrack/backend
```

### 2. Installation des Dépendances
Installez les packages requis (en utilisant `--legacy-peer-deps` pour éviter les conflits de dépendances internes NestJS) :
```bash
npm install --legacy-peer-deps
```

### 3. Configuration de l'Environnement (`.env`)
Créez un fichier `.env` à la racine du dossier `backend/` :
```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/fintrackdb"
JWT_SECRET="remplacez_ceci_par_une_cle_secrete_longue_et_securisee"
```
> [!IMPORTANT]
> - **Base de données** : Si vous utilisez SQLite en production, configurez `DATABASE_URL="file:./dev.db"`. Si vous utilisez PostgreSQL, modifiez également le `provider = "postgresql"` dans `prisma/schema.prisma` avant d'appliquer les migrations.
> - **JWT_SECRET** : Ne partagez jamais votre clé JWT secrète de production.

### 4. Migrations & Import de l'Apprentissage OCR
Avant de déployer et de seeder la base de données en production, vous pouvez **exporter l'apprentissage OCR** (les correspondances magasin/produits que vous avez apprises en local) pour les injecter en production :

```bash
# 1. (En local) Exporter les correspondances OCR depuis SQLite vers un fichier JSON
node prisma/export_ocr.js
```
Cette commande génère le fichier `prisma/ocr_learning.json`. Transférez ce fichier sur votre serveur de production dans le même dossier `backend/prisma/`.

Ensuite, initialisez la base de données en production :
```bash
# 2. Générer le client Prisma
npx prisma generate

# 3. Déployer le schéma sur votre base de données de production
npx prisma db push

# 4. Injecter les données et l'apprentissage OCR exporté
npx ts-node prisma/seed.ts
```

### 5. Compilation en JavaScript de Production
Compilez le projet TypeScript vers des fichiers JavaScript optimisés dans le dossier `dist/` :
```bash
npm run build
```

### 6. Lancement du Processus avec PM2
Pour lancer le serveur en arrière-plan et s'assurer qu'il redémarre automatiquement en cas de crash ou de redémarrage de la machine :
```bash
# Démarrer le serveur API
pm2 start dist/main.js --name "fintrack-backend"

# Configurer le démarrage de PM2 au boot du système
pm2 startup
pm2 save
```

---

## 🛠️ Commandes d'Administration Utiles

- **Consulter les logs en temps réel** :
  ```bash
  pm2 logs fintrack-backend
  ```
- **Vérifier l'état du serveur** :
  ```bash
  pm2 status
  ```
- **Redémarrer le serveur** (après une mise à jour de configuration ou de code) :
  ```bash
  pm2 restart fintrack-backend
  ```
- **Arrêter le serveur** :
  ```bash
  pm2 stop fintrack-backend
  ```

---

## 🐳 Déploiement avec Docker

Le projet intègre un fichier `Dockerfile` multi-stage optimisé pour construire une image légère pour la production.

### 1. Construire l'image Docker
Depuis la racine du dossier `backend/` :
```bash
docker build -t fintrack-backend .
```

### 2. Options de Déploiement :

#### Option A : Architecture Hybride (Recommandé)
Vous pouvez faire tourner uniquement la base de données PostgreSQL dans un conteneur Docker et exécuter l'API NestJS directement sur le serveur avec PM2.

**1. Démarrer uniquement la base de données PostgreSQL** :
```bash
# Dans le dossier backend/ (où se trouve docker-compose.yml)
docker compose up -d postgres
```

**2. Configurer le backend** :
Modifiez le fichier `backend/.env` pour vous connecter à la base de données PostgreSQL exposée sur `localhost:5432` :
```env
DATABASE_URL="postgresql://fintrack_user:fintrack_production_password_change_me@localhost:5432/fintrack_db?schema=public"
```

**3. Initialiser et démarrer l'API** :
```bash
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts  # (Optionnel) Pour importer l'apprentissage OCR
npm run build
pm2 start dist/main.js --name "fintrack-backend"
```

#### Option B : Architecture Tout-en-un (Docker Compose)
Pour exécuter à la fois l'API et la base de données PostgreSQL dans des conteneurs séparés :

**1. Lancer les conteneurs** :
```bash
# Dans le dossier backend/
docker compose up -d
```

**2. Gérer les conteneurs** :
```bash
# Voir l'état des conteneurs
docker compose ps

# Voir les logs de l'API en temps réel
docker compose logs -f backend
```

