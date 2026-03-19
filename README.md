# Freemen Printer Proxy

Local proxy service for Brother QL and TD label printers. Exposes your network printer via REST API for seamless cloud integration.

**Supported platforms:** Raspberry Pi (headless) • Ubuntu/Debian • Any Linux with Docker

---

## Features

- **Automatic Discovery** — Scan and detect Brother printers on your network
- **Multi-Model Support** — Works with QL-710W, QL-800, QL-820NWB, TD-4550DNWB, and more
- **Web Dashboard** — Configure and monitor from any browser
- **Secure API** — Authentication via API key, rate limiting included
- **Docker Ready** — Simple deployment on Raspberry Pi or server
- **Print Statistics** — Track daily, monthly, and total print jobs

---

## Quick Start

### Automated Installation (Recommended)

```bash
git clone https://github.com/freemen-solutions/freemen-printer-proxy.git
cd freemen-printer-proxy

# For standard Linux
./scripts/install.sh

# For Raspberry Pi
./scripts/install-pi.sh
```

The script handles Docker installation, configuration, and startup automatically.

### Manual Installation

```bash
git clone https://github.com/freemen-solutions/freemen-printer-proxy.git
cd freemen-printer-proxy

# Configure
cp .env.example .env
nano .env  # Set your API_KEY

# Start with Docker
docker compose up -d
```

**Dashboard:** http://localhost:6500

---

## Supported Platforms

| Platform | Architecture | Notes |
|----------|--------------|-------|
| Raspberry Pi 4/5 | ARM64 | Recommended for dedicated print server |
| Raspberry Pi 3B+ | ARM64 | Use 64-bit OS |
| Ubuntu/Debian | AMD64 | Server or desktop |
| Any Linux | AMD64/ARM64 | With Docker support |

---

## Compatible Printers

### QL Series (Label Printers)
- QL-710W, QL-720NW
- QL-800, QL-810W, QL-820NWB
- QL-1100, QL-1110NWB

### TD Series (Desktop Thermal)
- TD-4410D, TD-4420DN
- TD-4520DN, TD-4550DNWB

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `6500` | HTTP server port |
| `API_KEY` | *(required)* | Authentication key |
| `PRINTER_IP` | *(empty)* | Pre-configured printer IP |
| `PRINTER_PORT` | `9100` | Printer port |
| `PRINTER_PROTOCOL` | `jetdirect` | Protocol: `jetdirect` or `ipp` |

### Dashboard Configuration

1. Open http://YOUR_IP:6500
2. Enter your API key
3. Go to **Configuration** tab
4. Click **Quick Scan** to find printers
5. Select your printer

---

## API Usage

All endpoints except `/health` require the `X-API-Key` header.

### Print a QR Code

```bash
curl -X POST http://localhost:6500/print/qr \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "https://example.com/item/12345",
    "labelSize": "medium",
    "productName": "My Product",
    "productNumber": "12345"
  }'
```

### Available Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | No | Health check |
| `/status` | GET | Yes | Detailed status |
| `/config` | GET | Yes | Current configuration |
| `/config/printer` | POST | Yes | Set active printer |
| `/discover/quick` | GET | Yes | Quick network scan |
| `/discover` | GET | Yes | Full network scan |
| `/print/test` | POST | Yes | Test print |
| `/print/qr` | POST | Yes | Print QR code label |
| `/print/raw` | POST | Yes | Print raw data |

---

## Documentation

- **[Install on Raspberry Pi](docs/INSTALL_RASPBERRY_PI.md)** — Complete Pi setup guide
- **[Install on Linux](docs/INSTALL_LINUX.md)** — Server/desktop installation
- **[Architecture](docs/ARCHITECTURE.md)** — Technical overview
- **[Update Guide](docs/UPDATE.md)** — How to update
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** — Common issues and solutions

---

## Project Structure

```
freemen-printer-proxy/
├── server.js              # Express application
├── docker-compose.yml     # Docker configuration
├── Dockerfile             # Docker image
├── .env.example           # Environment template
├── lib/                   # Core modules
├── middleware/            # Express middleware
├── public/                # Web dashboard
├── scripts/               # Installation scripts
├── docs/                  # Documentation
├── data/                  # Persistent config (gitignored)
└── logs/                  # Application logs (gitignored)
```

---

## Useful Commands

```bash
# View logs
docker compose logs -f

# Restart
docker compose restart

# Stop
docker compose down

# Update
./scripts/update.sh

# Diagnostics
./scripts/doctor.sh
```

---

## Security Notes

- **Change the default API key** — Generate a secure key for production
- **Local network only** — The service is designed for local access
- **Use a tunnel for remote access** — Cloudflare Tunnel, Tailscale, or similar

---

## License

MIT

---

## Author

[Freemen Solutions](https://freemen.solutions)