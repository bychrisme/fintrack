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
Téléchargez le code source sur votre serveur de production (dans `/var/www/fintrack` par exemple) :
```bash
git clone <URL_VOTRE_DEPOT> fintrack
cd fintrack/backend
```

### 2. Installation des Dépendances
Installez les packages requis (y compris les dépendances de développement nécessaires à la compilation TypeScript) :
```bash
npm install
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

### 2. Lancer le conteneur NestJS connecté à un PostgreSQL externe
Pour démarrer uniquement le backend Dockerisé connecté à une base de données PostgreSQL distante ou pré-existante, exécutez la commande suivante :
```bash
docker run -d \
  --name fintrack-api \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@hostname:5432/dbname?schema=public" \
  -e JWT_SECRET="remplacez_ceci_par_une_cle_secrete_longue_et_securisee" \
  fintrack-backend
```

### 3. Exécuter avec Docker Compose (Recommandé)
Le projet intègre un fichier `docker-compose.yml` complet à la racine du projet qui lance simultanément l'API NestJS et un serveur de base de données PostgreSQL persistant.

Pour démarrer l'ensemble des services :
```bash
# À la racine globale du projet (où se trouve docker-compose.yml)
docker compose up -d
```

Le service backend utilise un script de démarrage qui attend automatiquement que le conteneur PostgreSQL soit actif et à l'écoute sur le port `5432` avant d'appliquer les schémas Prisma (`npx prisma db push`) et de lancer l'API.

Pour consulter l'état des services et les logs :
```bash
# Voir l'état des conteneurs
docker compose ps

# Voir les logs en temps réel de l'API
docker compose logs -f backend
```

