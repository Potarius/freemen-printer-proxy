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

### Implemented (Phase 1.5)

- [x] App shell with navigation
- [x] Premium dark theme with Freemen branding
- [x] 9-step premium wizard UI
- [x] **Real Cloudflare API integration**
- [x] API token validation with user-friendly errors
- [x] Zone/domain listing from Cloudflare
- [x] Remotely-managed tunnel creation
- [x] DNS record creation (CNAME)
- [x] Tunnel ingress configuration
- [x] Tunnel token retrieval
- [x] Zustand state management with cloudflare-store
- [x] Comprehensive error handling
- [x] Config generator service
- [x] Home page with quick actions
- [x] Settings page

### Pending

- [ ] File system operations via Tauri commands
- [ ] Build and package for Windows/Mac/Linux
- [ ] Auto-update system
- [ ] Secure token storage (keychain)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — Quick actions, features |
| `/wizard` | **Premium Wizard** — 9-step provisioning flow |
| `/provision` | Legacy provision page |
| `/settings` | Settings — Preferences |

## Wizard Steps (Phase 1.5)

| Step | Title | Description |
|------|-------|-------------|
| 1 | Welcome | Introduction with feature highlights |
| 2 | Platform | Select Raspberry Pi or Linux |
| 3 | Authentication | Enter & validate Cloudflare API token |
| 4 | Domain | Select zone from Cloudflare account |
| 5 | Access | Configure hostname and tunnel name |
| 6 | Device | Set device name and printer config |
| 7 | Review | Summary of all settings |
| 8 | Provision | Real-time progress with task tracking |
| 9 | Complete | Success page with download options |

## Services

### CloudflareService (Real API)

Full Cloudflare API v4 integration:

```typescript
interface ICloudflareService {
  verifyToken(): Promise<CloudflareTokenStatus>;
  getAccounts(): Promise<CloudflareAccount[]>;
  getZones(accountId?: string): Promise<CloudflareZone[]>;
  getTunnels(accountId: string): Promise<CloudflareTunnel[]>;
  createTunnel(accountId: string, name: string): Promise<CloudflareTunnel>;
  getTunnelToken(accountId: string, tunnelId: string): Promise<string>;
  createDNSRecord(zoneId: string, subdomain: string, tunnelId: string): Promise<CloudflareDNSRecord>;
  configureTunnelIngress(accountId: string, tunnelId: string, hostname: string, serviceUrl: string): Promise<void>;
}
```

**Error Handling:**
- `CloudflareApiException` — API errors with user-friendly messages
- `NetworkException` — Connection errors
- Automatic error code mapping to actionable messages

### MockCloudflareService

Development mock with simulated delays. Enable with:
```bash
VITE_USE_MOCK_CLOUDFLARE=true npm run dev
```

### ConfigGeneratorService

Generates device config files:
- `device.json` — Device configuration
- `device.env` — Environment variables
- `docker-compose.cloudflare.yml` — Docker Compose
- `setup.sh` — Platform setup script

## Cloudflare Store (Zustand)

State management for Cloudflare operations:

```typescript
// stores/cloudflare-store.ts
const {
  apiToken, setApiToken,
  validateToken,           // Validates token and loads accounts/zones
  isTokenValidated,
  zones, selectedZone, selectZone,
  accounts, selectedAccount, selectAccount,
  createTunnel,           // Creates remotely-managed tunnel
  createDNSRecord,        // Creates CNAME pointing to tunnel
  configureTunnelIngress, // Sets up ingress rules
  getTunnelToken,         // Retrieves token for cloudflared
  error, clearError,
  reset,                  // Clears all state (for new device)
} = useCloudflareStore();

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
