# Cloudflare Tunnel Setup

Expose your Freemen Printer Proxy securely to the internet using Cloudflare Tunnel.

## Overview

Cloudflare Tunnel creates an encrypted connection from your device to Cloudflare's edge, allowing secure remote access without opening ports on your router.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Internet                                    │
│                                                                 │
│  ┌──────────────┐     ┌─────────────┐     ┌─────────────────┐  │
│  │ Your Phone/  │────▶│  Cloudflare │────▶│ Your Network    │  │
│  │ Laptop       │     │  Edge       │     │                 │  │
│  │ (anywhere)   │     │             │     │ ┌─────────────┐ │  │
│  └──────────────┘     └─────────────┘     │ │ cloudflared │ │  │
│                              │            │ │     ↓       │ │  │
│                              │            │ │ Printer     │ │  │
│                              │            │ │ Proxy       │ │  │
│                              │            │ └─────────────┘ │  │
│                              │            │                 │  │
│                              │            │ ┌─────────────┐ │  │
│                              └────────────│ │ Brother     │ │  │
│                                           │ │ Printer     │ │  │
│                                           │ └─────────────┘ │  │
│                                           └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- No port forwarding required
- Automatic HTTPS
- DDoS protection
- Zero Trust security

---

## Prerequisites

1. **Cloudflare Account** (free tier works)
2. **Domain** added to Cloudflare (nameservers must point to Cloudflare)
3. **API Token** with the required permissions
4. **Node.js** installed on your provisioning machine (Windows/Mac/Linux)

---

## API Token Permissions

Create an API token at [Cloudflare Dashboard → Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens).

**Required permissions:**

| Permission | Access | Purpose |
|------------|--------|---------|
| Zone : Zone | Read | List available domains |
| Zone : DNS | Edit | Create CNAME records |
| Account : Cloudflare Tunnel | Edit | Create and manage tunnels |
| Account : Account Settings | Read | List accounts |

**Recommended token template:** Start with "Edit Cloudflare Tunnel" and add Zone permissions.

---

## Quick Start (Windows)

### 1. Open Provisioner

```powershell
cd freemen-printer-proxy\tools\provisioner
.\provision.bat
```

Or with PowerShell:

```powershell
.\provision.ps1
```

### 2. Follow the Interactive Prompts

1. Enter your Cloudflare API Token
2. Select your Cloudflare account
3. Select your domain (zone)
4. Enter a hostname (e.g., `printer.yourdomain.com`)
5. Choose target platform (Raspberry Pi or Linux)

### 3. Deploy to Device

The provisioner generates a folder with all needed files. Copy it to your device and run the setup script.

---

## Quick Start (Mac/Linux)

```bash
cd freemen-printer-proxy/tools/provisioner
npm install
node index.js
```

---

## Generated Files

The provisioner creates a device package in `tools/provisioner/output/<device-id>/`:

| File | Description |
|------|-------------|
| `device.json` | Device configuration (ID, hostname, tunnel info) |
| `device.env` | Environment variables for the proxy |
| `docker-compose.cloudflare.yml` | Docker Compose with cloudflared sidecar |
| `cloudflared.service` | Systemd service for non-Docker installs |
| `setup-pi.sh` or `setup-linux.sh` | Automated setup script |
| `README.md` | Device-specific instructions |

---

## Manual Deployment

If you prefer manual setup:

### 1. Install cloudflared

**Raspberry Pi (ARM64):**
```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
```

**Ubuntu/Debian (AMD64):**
```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
```

### 2. Run with Token

```bash
cloudflared tunnel --no-autoupdate run --token YOUR_TUNNEL_TOKEN
```

### 3. Or Install as Service

```bash
sudo cloudflared service install YOUR_TUNNEL_TOKEN
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## Docker Deployment

Use the generated `docker-compose.cloudflare.yml` as an override:

```bash
# Copy generated files
cp device.env .env
cp docker-compose.cloudflare.yml docker-compose.override.yml

# Start with cloudflared
docker compose up -d
```

This starts both the printer proxy and cloudflared as containers.

---

## Tunnel Management

### View Tunnel Status

```bash
# Check if cloudflared is running
systemctl status cloudflared

# Or for Docker
docker logs freemen-cloudflared
```

### Cloudflare Dashboard

Manage tunnels at: [Cloudflare Zero Trust → Networks → Tunnels](https://one.dash.cloudflare.com/)

From here you can:
- View connection status
- Edit ingress rules
- Rotate tokens
- Delete tunnels

---

## Troubleshooting

### Tunnel Not Connecting

1. **Check token validity:**
   ```bash
   cloudflared tunnel --no-autoupdate run --token YOUR_TOKEN
   ```

2. **Check network connectivity:**
   ```bash
   curl -I https://api.cloudflare.com
   ```

3. **View logs:**
   ```bash
   journalctl -u cloudflared -f
   ```

### DNS Not Resolving

1. Verify the CNAME record exists in Cloudflare DNS
2. Record should point to `<tunnel-id>.cfargotunnel.com`
3. Ensure "Proxied" (orange cloud) is enabled

### 502 Bad Gateway

1. Ensure the printer proxy is running
2. Check the ingress service URL matches your setup
3. Verify the proxy is accessible locally first

---

## Security Considerations

1. **Never commit tunnel tokens** - They're like passwords
2. **Use scoped API tokens** - Don't use Global API Key
3. **Rotate tokens** if compromised via Cloudflare dashboard
4. **Keep API key authentication** - The tunnel doesn't replace it

---

## Re-provisioning

To start fresh with a different Cloudflare account:

1. Delete old tunnel in Cloudflare dashboard
2. Remove generated files from `tools/provisioner/output/`
3. Run the provisioner again

---

## Architecture: Provisioning vs Runtime

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROVISIONING (once)                          │
│                    Windows/Mac workstation                      │
│                                                                 │
│   ┌─────────────┐         ┌───────────────┐                    │
│   │ Provisioner │────────▶│ Cloudflare    │                    │
│   │ CLI         │  API    │ API           │                    │
│   └─────────────┘         └───────────────┘                    │
│         │                                                       │
│         │ generates                                             │
│         ▼                                                       │
│   ┌─────────────┐                                              │
│   │ Config      │                                              │
│   │ Package     │                                              │
│   └─────────────┘                                              │
│         │                                                       │
│         │ copy to device                                        │
└─────────│───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RUNTIME (always)                             │
│                    Raspberry Pi / Linux server                  │
│                                                                 │
│   ┌─────────────┐         ┌───────────────┐                    │
│   │ cloudflared │◀───────▶│ Cloudflare    │                    │
│   │             │ tunnel  │ Edge          │                    │
│   └─────────────┘         └───────────────┘                    │
│         │                                                       │
│         │ routes to                                             │
│         ▼                                                       │
│   ┌─────────────┐         ┌───────────────┐                    │
│   │ Printer     │────────▶│ Brother       │                    │
│   │ Proxy       │         │ Printer       │                    │
│   └─────────────┘         └───────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

**Key distinction:**
- **Provisioning** happens once, from your workstation
- **Runtime** happens continuously, on the device
- The device never needs direct Cloudflare API access

---

## Next Steps: Phase 2 Onboarding

Future versions will support:
- Device ID generation at first boot
- Cloud-based claim tokens
- Zero-touch onboarding via web dashboard
- Automatic tunnel provisioning from cloud

See [ARCHITECTURE.md](ARCHITECTURE.md) for the roadmap.
