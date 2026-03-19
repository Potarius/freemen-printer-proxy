# Architecture

Technical overview of Freemen Printer Proxy.

## Overview

Freemen Printer Proxy is a local service that bridges your Brother label printer to external systems via a REST API. It runs on your local network (Raspberry Pi, server, or desktop) and provides:

- **Printer Discovery**: Automatic detection of Brother printers on the network
- **Print API**: REST endpoints to send print jobs
- **Web Dashboard**: Local configuration and monitoring interface
- **Persistence**: Configuration saved locally for reliability

```
┌─────────────────────────────────────────────────────────────────┐
│                     Your Network                                │
│                                                                 │
│  ┌──────────────┐     ┌───────────────────┐     ┌───────────┐  │
│  │ Your App/    │────▶│ Freemen Printer   │────▶│  Brother  │  │
│  │ Cloud Server │ API │ Proxy (Pi/Server) │ RAW │  Printer  │  │
│  └──────────────┘     └───────────────────┘     └───────────┘  │
│                              │                                  │
│                              │ Web UI                           │
│                              ▼                                  │
│                       ┌─────────────┐                          │
│                       │  Dashboard  │                          │
│                       │  (Browser)  │                          │
│                       └─────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Express Server (`server.js`)

The main application:
- HTTP API endpoints
- Static file serving (dashboard)
- Authentication middleware
- Print job processing

**Key routes:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check (public) |
| `/status` | GET | Detailed status (auth) |
| `/config` | GET | Current configuration |
| `/config/printer` | POST | Set active printer |
| `/discover/quick` | GET | Quick network scan |
| `/discover` | GET | Full network scan |
| `/print/test` | POST | Test print |
| `/print/qr` | POST | Print QR code label |
| `/print/raw` | POST | Print raw data |
| `/admin/info` | GET | System info (version, uptime) |
| `/admin/logs` | GET | Recent application logs |
| `/admin/check-update` | GET | Update information |
| `/admin/restart-info` | GET | Restart instructions |

### 2. Printer Client (`lib/printer.js`)

Handles communication with Brother printers:
- JetDirect protocol (port 9100)
- IPP protocol (port 631)
- Connection testing
- Raw data transmission

### 3. Network Discovery (`lib/discovery.js`)

Discovers printers on the local network:
- Quick scan: Common IP ranges
- Full scan: Entire subnet
- Port scanning (9100, 631)
- Brother model detection

### 4. Configuration Manager (`lib/config.js`)

Persistent configuration storage:
- Active printer settings
- Saved printers list
- User preferences
- Scan history

Data stored in: `data/printer-config.json`

### 5. Web Dashboard (`public/index.html`)

Single-page application:
- Printer status display
- Configuration UI
- Network scanning
- Print statistics

---

## Data Flow

### Print Request Flow

```
1. Client sends POST /print/qr
        │
        ▼
2. API authenticates request (X-API-Key)
        │
        ▼
3. Generate label (QR code + text)
        │
        ▼
4. Convert to Brother raster format
        │
        ▼
5. Open TCP connection to printer (port 9100)
        │
        ▼
6. Send raw print data
        │
        ▼
7. Printer prints label
        │
        ▼
8. Return success response
```

### Configuration Flow

```
1. User opens dashboard
        │
        ▼
2. Dashboard fetches /config
        │
        ▼
3. User clicks "Scan"
        │
        ▼
4. Discovery scans network
        │
        ▼
5. Returns found printers
        │
        ▼
6. User selects printer
        │
        ▼
7. POST /config/printer saves config
        │
        ▼
8. Config persisted to data/printer-config.json
```

---

## File Structure

```
freemen-printer-proxy/
├── server.js              # Main Express application
├── package.json           # Dependencies and scripts
├── Dockerfile             # Docker build instructions
├── docker-compose.yml     # Docker Compose configuration
├── .env.example           # Environment template
│
├── lib/
│   ├── printer.js         # Printer communication
│   ├── discovery.js       # Network scanning
│   ├── config.js          # Configuration persistence
│   ├── printerModels.js   # Brother model database
│   └── qrGenerator.js     # QR code generation
│
├── middleware/
│   └── rateLimiter.js     # API rate limiting
│
├── public/
│   └── index.html         # Web dashboard (SPA)
│
├── scripts/
│   ├── install.sh         # Linux installation
│   ├── install-pi.sh      # Raspberry Pi installation
│   ├── update.sh          # Update script
│   └── doctor.sh          # Diagnostics
│
├── docs/                  # Documentation
│
├── data/                  # Persistent data (gitignored)
│   └── printer-config.json
│
└── logs/                  # Application logs (gitignored)
```

---

## Security

### Authentication
- API key authentication via `X-API-Key` header
- Key stored in `.env` file
- Dashboard prompts for key on first access

### Rate Limiting
- Configurable request limits
- Prevents abuse and DoS

### Network Security
- Runs on local network only by default
- No external connections required
- Optional tunnel for remote access

### Docker Security
- Runs as non-root user
- Minimal Alpine base image
- No unnecessary privileges

---

## Multi-Target Support

### Raspberry Pi (ARM64)
- Docker image builds for ARM64
- Optimized for headless operation
- Low resource requirements

### Linux Server (AMD64)
- Standard Docker deployment
- Same codebase and image
- Supports reverse proxy setup

### Architecture Detection
```javascript
// The Docker image uses multi-arch base
FROM node:20-alpine  // Supports AMD64 + ARM64
```

---

## Evolution Roadmap

### Current: Phase 1.1 — Local Administration

The proxy is now fully administrable locally:

**Implemented:**
- Version visible in API, dashboard footer, and Admin tab
- Admin endpoints (`/admin/info`, `/admin/logs`, `/admin/check-update`)
- Interactive admin menu (`deploy-menu.sh`)
- Robust update script with 7-step process
- Dashboard Admin tab with system info and logs
- Configuration backups during updates

**Admin Tools:**
| Tool | Purpose |
|------|---------|
| `deploy-menu.sh` | Interactive admin/deployment menu |
| `scripts/update.sh` | Non-interactive robust update |
| `scripts/doctor.sh` | System diagnostics |
| Dashboard Admin tab | Web-based monitoring |

---

## Future: Phase 2 — Tokenized Onboarding

Phase 2 will introduce a cloud-connected onboarding flow:

### Planned Components

1. **Device ID**: Unique identifier for each proxy instance
2. **Claim Token**: One-time token to associate device with user
3. **Device Token**: Persistent authentication for cloud communication
4. **Local Onboarding Page**: Guided setup wizard
5. **Cloudflare Tunnel**: Secure remote access without port forwarding

### Planned Flow

```
1. User deploys proxy
        │
        ▼
2. Proxy generates device_id
        │
        ▼
3. User accesses local onboarding page
        │
        ▼
4. User enters claim_token from cloud dashboard
        │
        ▼
5. Proxy exchanges claim for device_token
        │
        ▼
6. Proxy establishes cloudflared tunnel
        │
        ▼
7. Cloud server can now route print jobs
```

This architecture is designed to support this evolution without breaking changes to the current local-only functionality.

---

## Dependencies

### Production
| Package | Purpose |
|---------|---------|
| express | HTTP server |
| cors | Cross-origin support |
| helmet | Security headers |
| dotenv | Environment config |
| winston | Logging |
| qrcode | QR generation |
| rate-limiter-flexible | Rate limiting |
| ipp | IPP protocol |
| axios | HTTP client |
| pdfkit | PDF generation |

### Development
| Package | Purpose |
|---------|---------|
| nodemon | Auto-restart |
| jest | Testing |
| supertest | API testing |

---

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 6500 | HTTP server port |
| `API_KEY` | (required) | Authentication key |
| `PRINTER_IP` | (empty) | Pre-configured printer IP |
| `PRINTER_PORT` | 9100 | Printer port |
| `PRINTER_PROTOCOL` | jetdirect | Protocol (jetdirect/ipp) |
| `SCAN_SUBNET` | (auto) | Network to scan |
| `LOG_LEVEL` | info | Logging verbosity |
| `NODE_ENV` | development | Environment mode |
