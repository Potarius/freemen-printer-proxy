# Freemen Printer Proxy

Micro-service pour imprimer sur des imprimantes Brother QL et TD series via API REST. Idéal pour déployer sur Raspberry Pi avec Docker.

## ✨ Fonctionnalités

- 🔍 **Scan réseau** — Découverte automatique des imprimantes Brother
- 🖨️ **Multi-modèles** — Compatible QL-710W, QL-800, QL-820NWB, TD-4550DNWB, etc.
- 🎨 **Dashboard web** — Interface de configuration et monitoring
- 🔐 **API sécurisée** — Authentification par clé API
- 📊 **Statistiques** — Suivi des impressions (jour/mois/total)
- 🐳 **Docker ready** — Déploiement simple sur Raspberry Pi ou serveur

## 🏗️ Architecture

```
Votre serveur/app → HTTPS/Tunnel → Printer Proxy → Imprimante Brother (réseau local)
```

## 🚀 Installation

### Option 1: Docker (recommandé)

```bash
# Cloner le dépôt
git clone https://github.com/votre-user/freemen-printer-proxy.git
cd freemen-printer-proxy

# Configurer l'environnement
cp .env.example .env
nano .env  # Modifier API_KEY au minimum

# Démarrer avec Docker Compose
docker-compose up -d
```

Le dashboard est accessible sur `http://localhost:6500`

### Option 2: Node.js

```bash
# Cloner et installer
git clone https://github.com/votre-user/freemen-printer-proxy.git
cd freemen-printer-proxy
npm install

# Configurer
cp .env.example .env
nano .env

# Démarrer
npm start
```

## 🍓 Déploiement Raspberry Pi

1. **Installer Ubuntu Server** sur votre Raspberry Pi
2. **Installer Docker:**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```
3. **Cloner et démarrer:**
   ```bash
   git clone https://github.com/votre-user/freemen-printer-proxy.git
   cd freemen-printer-proxy
   cp .env.example .env
   nano .env  # Configurer API_KEY
   docker-compose up -d
   ```
4. **Configurer un tunnel** (Cloudflare Tunnel, ngrok, etc.) pour accès distant

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur | `6500` |
| `API_KEY` | Clé d'authentification API | `dev-key-...` |
| `PRINTER_IP` | IP de l'imprimante (optionnel si scan) | `192.168.1.100` |
| `PRINTER_PORT` | Port imprimante | `9100` |
| `PRINTER_PROTOCOL` | `jetdirect` ou `ipp` | `jetdirect` |

### Configuration via Dashboard

1. Accédez au dashboard (`http://localhost:6500`)
2. Cliquez sur l'onglet **Configuration**
3. Utilisez **Scan rapide** ou **Scan complet** pour trouver les imprimantes
4. Sélectionnez votre imprimante pour la configurer

## 🖨️ Modèles compatibles

### Série QL (Label Printers)
- QL-710W, QL-720NW
- QL-800, QL-810W, QL-820NWB
- QL-1100, QL-1110NWB

### Série TD (Desktop Thermal)
- TD-4410D, TD-4420DN
- TD-4520DN, TD-4550DNWB

## 📋 API Endpoints

Tous les endpoints (sauf `/health` et `/models`) nécessitent le header `X-API-Key`.

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/health` | GET | Santé du service |
| `/status` | GET | Statut imprimante + service |
| `/models` | GET | Liste des modèles compatibles |
| `/config` | GET | Configuration actuelle |
| `/config/printer` | POST | Définir l'imprimante active |
| `/discover/quick` | GET | Scan rapide du réseau (~5s) |
| `/discover` | GET | Scan complet du réseau (~1-2 min) |
| `/test-printer` | POST | Tester une IP spécifique |
| `/print/test` | POST | Imprimer une page de test |
| `/print/qr` | POST | Imprimer un QR code |

### Exemple: Imprimer un QR code

```bash
curl -X POST http://localhost:6500/print/qr \
  -H "X-API-Key: votre-clé-api" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "https://example.com/product/12345",
    "labelSize": "medium",
    "quantity": 1
  }'
```

**Tailles disponibles:**
- `small` : 29×29mm (QR + numéro)
- `medium` : 62×29mm (QR + nom + numéro)
- `large` : 62×62mm (QR centré + texte)

## � Structure du projet

```
freemen-printer-proxy/
├── server.js           # Serveur Express principal
├── docker-compose.yml  # Configuration Docker
├── Dockerfile          # Image Docker
├── .env.example        # Variables d'environnement
├── lib/
│   ├── printer.js      # Communication imprimante
│   ├── discovery.js    # Scan réseau
│   ├── config.js       # Persistance configuration
│   └── printerModels.js # Base de données modèles
├── middleware/
│   └── rateLimiter.js  # Rate limiting
├── public/
│   └── index.html      # Dashboard web
├── data/               # Configuration persistée
└── logs/               # Logs applicatifs
```

## 🔐 Sécurité

- **Changez la clé API** — Ne gardez jamais la clé par défaut en production
- **Utilisez un tunnel sécurisé** — Cloudflare Tunnel, ngrok, ou reverse proxy avec HTTPS
- **Rate limiting inclus** — Protection contre les abus

## 🤝 Contribution

Les contributions sont les bienvenues! Ouvrez une issue ou une pull request.

## 📄 Licence

MIT

## 👤 Auteur

[Freemen Solutions](https://freemen.solutions)