# Installation on Linux

Guide for deploying Freemen Printer Proxy on a standard Linux server or desktop.

## Supported Distributions

- **Ubuntu** 20.04, 22.04, 24.04
- **Debian** 11, 12
- **Fedora** 38+
- **Any Linux** with Docker support

## Prerequisites

- Linux system with x86_64 (AMD64) or ARM64 architecture
- Docker and Docker Compose
- Git
- Network access to your Brother printer

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/freemen-solutions/freemen-printer-proxy.git
cd freemen-printer-proxy

# Run the installation script
chmod +x scripts/*.sh
./scripts/install.sh
```

That's it! The script handles everything automatically.

---

## Manual Installation

If you prefer manual installation:

### 1. Install Docker

**Ubuntu/Debian:**
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker

# Verify
docker --version
```

**Fedora:**
```bash
sudo dnf install docker docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

### 2. Clone the Repository

```bash
git clone https://github.com/freemen-solutions/freemen-printer-proxy.git
cd freemen-printer-proxy
```

### 3. Configure Environment

```bash
# Create .env from template
cp .env.example .env

# Generate a secure API key
API_KEY=$(openssl rand -hex 32)
sed -i "s/API_KEY=dev-key-change-in-production/API_KEY=$API_KEY/" .env

# Or manually edit .env
nano .env
```

### 4. Start the Service

```bash
# Build and start
docker compose up -d

# Verify it's running
docker compose ps

# Check logs
docker compose logs -f
```

---

## Access the Dashboard

Open your browser to:
```
http://localhost:6500
```

Or from another machine:
```
http://YOUR_SERVER_IP:6500
```

Enter your API key when prompted (found in `.env` file).

---

## Configure Your Printer

1. Go to the **Configuration** tab
2. Use **Quick Scan** to discover printers
3. Select your Brother printer
4. Start printing!

---

## Running as a System Service

Docker Compose with `restart: unless-stopped` handles auto-restart. The service will:
- Start automatically on boot (if Docker daemon starts)
- Restart automatically if it crashes
- Persist configuration in the `data/` directory

To verify auto-start:
```bash
# Reboot and check
sudo reboot
# After reboot:
docker compose ps
```

---

## Running Without Docker

If you can't use Docker:

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
npm install --production

# Configure
cp .env.example .env
nano .env

# Start
npm start
```

For production, use a process manager:
```bash
# Install PM2
sudo npm install -g pm2

# Start with PM2
pm2 start server.js --name freemen-printer-proxy
pm2 save
pm2 startup
```

---

## Firewall Configuration

If you have a firewall, allow port 6500:

**UFW (Ubuntu):**
```bash
sudo ufw allow 6500/tcp
```

**firewalld (Fedora/CentOS):**
```bash
sudo firewall-cmd --permanent --add-port=6500/tcp
sudo firewall-cmd --reload
```

---

## Using a Reverse Proxy

### Nginx

```nginx
server {
    listen 80;
    server_name printer.yourdomain.com;

    location / {
        proxy_pass http://localhost:6500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Caddy

```
printer.yourdomain.com {
    reverse_proxy localhost:6500
}
```

---

## Useful Commands

```bash
# View logs
docker compose logs -f

# Restart service
docker compose restart

# Stop service
docker compose down

# Update
./scripts/update.sh

# Diagnostics
./scripts/doctor.sh

# Rebuild after changes
docker compose build --no-cache
docker compose up -d
```

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

---

## Next Steps

- [Understand the architecture](./ARCHITECTURE.md)
- [Update guide](./UPDATE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
