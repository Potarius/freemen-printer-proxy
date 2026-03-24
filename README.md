# Freemen Printer Proxy

A self-hosted printer proxy that exposes a local network printer securely over the internet via Cloudflare Tunnel. Runs on a Raspberry Pi — fully headless, zero-touch provisioning, and automatically self-updating.

Copyright (c) 2024 [Freemen Solutions Inc.](https://freemen.solutions)

---

## How it works

Your ERP or cloud application sends print jobs to a public HTTPS endpoint. The Freemen Printer Proxy receives those jobs through a Cloudflare Tunnel and forwards them to a local printer on the LAN — no port forwarding, no VPN, no static IP required.

\
---

## Requirements

- Raspberry Pi 3 / 4 / 5 (64-bit OS, with network access)
- SD card — 8 GB minimum, 16 GB recommended
- A Cloudflare account with a domain
- The **Freemen Provisioner** desktop app (Windows)

---

## Provisioning a device

1. Download and run the **Freemen Provisioner** app.
2. Follow the wizard:
   - Connect your Cloudflare account with an API token
   - Choose a tunnel name and public hostname (e.g. )
   - Set Pi username, password, and optional WiFi credentials
   - Save your generated API key — it will be embedded in the device
   - Download the Raspberry Pi OS image and flash it to your SD card
3. Insert the SD card into the Pi and power it on.
4. Wait approximately 10 minutes for automated setup to finish.
5. Your printer proxy is live at .

### What happens on first boot

**Boot 1** — offline setup (~30 seconds):
- Hostname configured, SSH enabled
- Install service registered to run after network is available
- Pi reboots automatically

**Boot 2** — network installation (~5–10 minutes):
- Docker CE installed via official apt repository
- cloudflared downloaded and tunnel service started
- freemen-printer-proxy container pulled from GHCR and started
- watchtower container started for automatic future updates

---

## Sending print jobs

\
All endpoints except  require the  header.

---

## API reference

| Endpoint | Method | Description |
|----------|--------|-------------|
|  | GET | Health check (no auth) |
|  | GET | Service and printer status |
|  | GET | Current configuration |
|  | POST | Set active printer IP |
|  | GET | Scan network for printers |
|  | POST | Print a test page |
|  | POST | Send raw print data |
|  | POST | Print a QR code label |

---

## Automatic updates

The Pi runs [Watchtower](https://containrrr.dev/watchtower/), which checks  every hour. Push a new image and all deployed devices update themselves automatically.

**To deploy an update:**
1. Build and push a new image to 2. All Pis will pull and restart the new image within the hour

---

## Debugging a Pi that won't come online

Pull the SD card, insert it into a Windows PC, and open the FAT32 boot partition. You will find:

-  — full timestamped log of the setup process
-  — last reached status (e.g.  or )

| Status | Meaning |
|--------|---------|
|  | Stage 1 done, waiting for stage 2 on next boot |
|  | Stage 2 running — network install in progress |
|  | No internet on second boot — check cable or WiFi credentials |
|  | Docker install failed |
|  | Cloudflare tunnel token rejected — re-provision with a new token |
|  | Could not pull image from GHCR |
|  | Setup finished successfully |

---

## Project structure

\
---

## Running without a Pi

To run the proxy directly on any Linux machine with Docker:

\
---

## License

Copyright (c) 2024 Freemen Solutions Inc.

Licensed under the [Polyform Noncommercial License 1.0.0](LICENSE).  
Free to use and modify for personal and non-commercial purposes.  
Commercial use is not permitted without a separate agreement.

For commercial licensing inquiries, contact [Freemen Solutions Inc.](https://freemen.solutions)
