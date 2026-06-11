# --- Etape 1: Construction/Build de l'application ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copie des fichiers de configuration NPM
COPY package*.json ./

# Installation de toutes les dépendances (y compris devDependencies pour compiler TypeScript)
RUN npm ci

# Copie du code source et des fichiers nécessaires
COPY . .

# Génération du client Prisma
RUN npx prisma generate

# Compilation TypeScript du projet NestJS
RUN npm run build

# --- Etape 2: Image de Production ---
FROM node:20-alpine

WORKDIR /usr/src/app

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Copie des fichiers package.json
COPY package*.json ./

# Installation des dépendances de production uniquement
RUN npm ci --only=production

# Copie des artefacts de compilation du builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/fra.traineddata ./fra.traineddata

# Exposition du port
EXPOSE 3000

# Commande de démarrage (exécute prisma db push au démarrage pour s'assurer que la base de données est à jour, puis lance l'API)
CMD ["sh", "-c", "npx prisma db push && node dist/main.js"]
