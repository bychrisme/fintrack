# FinTrack Client - Guide de Déploiement en Production

Ce document décrit la procédure étape par étape pour compiler et déployer l'interface utilisateur React + Vite de **FinTrack** dans un environnement de production.

---

## 📋 Prérequis de Production

Le frontend étant une application monopage (SPA) statique après compilation, vous aurez besoin de :
- **Node.js** (pour compiler les fichiers statiques de production)
- **Nginx** (ou Apache/Caddy) pour servir ces fichiers statiques de manière performante
- **Certbot** (pour sécuriser le site en HTTPS via Let's Encrypt)

---

## 🚀 Étapes de Déploiement

### 1. Compilation des Fichiers Statiques
Dans votre répertoire frontend sur votre serveur de production :
```bash
cd /var/www/bychrisme/fintrack/frontend
npm install
```

Configurez l'URL publique de votre API backend lors de la compilation. Le compilateur Vite injectera cette variable d'environnement :
```bash
# Lancez le build de production
VITE_API_URL="https://fintrack.bychrisme.dev/api" npm run build
```
Cette commande génère un répertoire `dist/` contenant les fichiers HTML, CSS et JavaScript compilés, optimisés et minifiés.

---

### 2. Configuration du Serveur Web Nginx
Déplacez ou pointez votre configuration Nginx vers le dossier `/var/www/bychrisme/fintrack/frontend/dist`.

Créez un nouveau bloc de configuration Nginx :
```bash
sudo nano /etc/nginx/sites-available/fintrack
```

Ajoutez la configuration ci-dessous :
```nginx
server {
    listen 80;
    server_name fintrack.bychrisme.dev www.fintrack.bychrisme.dev;

    # 1. Servir le frontend React (SPA)
    location / {
        root /var/www/bychrisme/fintrack/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 2. Proxy inverse vers l'API backend NestJS (tournant sur le port 3001)
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activez le site et relancez Nginx :
```bash
sudo ln -s /etc/nginx/sites-available/fintrack /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 3. Sécurisation HTTPS avec SSL (Let's Encrypt)
Pour activer le chiffrement SSL gratuit et configurer automatiquement Nginx en HTTPS :
```bash
# Installation de Certbot
sudo apt install snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Obtention du certificat SSL
sudo certbot --nginx -d fintrack.bychrisme.dev
```

Certbot modifiera automatiquement votre fichier de configuration Nginx pour rediriger le trafic HTTP (port 80) vers HTTPS (port 443) de manière sécurisée.

---

## 🛠️ Commandes Utiles de Maintenance

- **Tester la configuration Nginx** :
  ```bash
  sudo nginx -t
  ```
- **Redémarrer Nginx** :
  ```bash
  sudo systemctl restart nginx
  ```
- **Consulter les logs d'accès et d'erreurs Nginx** :
  ```bash
  sudo tail -f /var/log/nginx/access.log
  sudo tail -f /var/log/nginx/error.log
  ```
