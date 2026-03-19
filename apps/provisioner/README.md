# Freemen Provisioner

Desktop application for provisioning Freemen Printer Proxy devices with Cloudflare Tunnel.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Tauri** | Desktop app framework (Rust backend) |
| **React 18** | UI framework |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS** | Utility-first styling |
| **Zustand** | State management |
| **Vite** | Build tool |

### Why Tauri over Electron?

- **Smaller bundle** — ~10MB vs ~150MB
- **Better performance** — Native webview, Rust backend
- **Lower memory** — No Chromium overhead
- **Native file access** — Easy Tauri commands

## Architecture

```
apps/provisioner/
├── src/                      # React frontend
│   ├── components/           # UI components
│   │   ├── layout/          # Layout (Sidebar, Titlebar)
│   │   └── wizard/          # Wizard components
│   ├── pages/               # Route pages
│   ├── services/            # Business logic
│   │   ├── cloudflare.ts    # Cloudflare API
│   │   └── config-generator.ts
│   ├── stores/              # Zustand state
│   ├── types/               # TypeScript types
│   └── styles/              # Global CSS
├── src-tauri/               # Tauri/Rust backend
│   ├── src/main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── vite.config.ts
```

## Development

### Prerequisites

- Node.js 18+
- Rust (for Tauri)
- Windows/Mac/Linux

### Setup

```bash
cd apps/provisioner
npm install
```

### Run in Development

```bash
# Web only (for UI development)
npm run dev

# Full Tauri app
npm run tauri:dev
```

### Build

```bash
npm run tauri:build
```

## Features

### Implemented (Phase 1.3)

- [x] App shell with navigation
- [x] Premium dark theme
- [x] Wizard step system
- [x] Cloudflare service (mockable)
- [x] Config generator service
- [x] Zustand state management
- [x] Home page with quick actions
- [x] Provision wizard (6 steps)
- [x] Settings page

### Pending

- [ ] Real Cloudflare API integration
- [ ] File system operations via Tauri
- [ ] Build and package for Windows
- [ ] Auto-update system

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — Quick actions, features |
| `/provision` | Provision wizard — 6-step flow |
| `/settings` | Settings — Preferences |

## Wizard Steps

1. **Authentication** — Enter Cloudflare API token
2. **Account** — Select Cloudflare account
3. **Domain** — Choose zone/domain
4. **Device** — Configure device name, hostname, platform
5. **Tunnel** — Create Cloudflare Tunnel
6. **Complete** — Download config package

## Services

### CloudflareService

Real API integration with Cloudflare:
- `verifyToken()` — Validate API token
- `getAccounts()` — List accounts
- `getZones()` — List domains
- `createTunnel()` — Create tunnel
- `getTunnelToken()` — Get tunnel token
- `createTunnelDNS()` — Create CNAME record

### MockCloudflareService

Development mock with simulated delays.

### ConfigGeneratorService

Generates device config files:
- `device.json` — Device configuration
- `device.env` — Environment variables
- `docker-compose.cloudflare.yml` — Docker Compose
- `setup.sh` — Platform setup script

## Styling

- Dark theme by default
- Freemen brand colors
- Custom Tailwind classes in `globals.css`
- Component classes: `.card`, `.btn-primary`, `.input`, etc.

## State Management

Zustand store in `stores/provision-store.ts`:
- Wizard navigation state
- Form data (token, account, zone, device)
- Results (tunnel, token, config package)
- Loading/error states
