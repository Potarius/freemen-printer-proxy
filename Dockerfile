FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le reste du code
COPY . .

# Créer les dossiers nécessaires
RUN mkdir -p logs data

# Port exposé
EXPOSE 6500

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:6500/health || exit 1

# Démarrer le service
CMD ["node", "server.js"]
