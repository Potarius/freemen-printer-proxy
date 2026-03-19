# Installation on Raspberry Pi

Complete guide for deploying Freemen Printer Proxy on a Raspberry Pi in headless mode.

## Prerequisites

### Hardware
- **Raspberry Pi 4** (recommended) or Pi 3B+
- **MicroSD card**: 8GB minimum, 16GB+ recommended
- **Power supply**: Official Raspberry Pi power adapter
- **Network**: Ethernet cable or WiFi configuration

### Software
- **Raspberry Pi OS Lite 64-bit** (recommended)
- SSH access enabled

### Network
- Brother label printer connected to the same network
- Printer network IP address (or will be discovered via scan)

---

## Step 1: Prepare the SD Card

### Option A: Using Raspberry Pi Imager (Recommended)

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Insert your SD card
3. Click **Choose OS** → **Raspberry Pi OS (other)** → **Raspberry Pi OS Lite (64-bit)**
4. Click **Choose Storage** → Select your SD card
5. Click the **gear icon** (⚙️) for advanced options:
   - ✅ Enable SSH (use password authentication)
   - ✅ Set username and password
   - ✅ Configure WiFi (if not using Ethernet)
   - ✅ Set locale settings
6. Click **Write**

### Option B: Manual Configuration

1. Flash Raspberry Pi OS Lite 64-bit to SD card
2. Create an empty file named `ssh` in the boot partition
3. For WiFi, create `wpa_supplicant.conf` in boot partition:

```
country=US
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="YourWiFiName"
    psk="YourWiFiPassword"
}
```

---

## Step 2: First Boot and SSH Access

1. Insert SD card into Pi and power on
2. Wait 2-3 minutes for first boot to complete
3. Find your Pi's IP address:
   - Check your router's connected devices
   - Or use: `ping raspberrypi.local` (if mDNS works)
   - Or scan: `nmap -sn 192.168.1.0/24`

4. SSH into your Pi:
```bash
ssh pi@YOUR_PI_IP
# or
ssh pi@raspberrypi.local
```

5. Update the system:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## Step 3: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Apply group changes (or logout/login)
newgrp docker

# Verify Docker is working
docker --version
docker run hello-world
```

---

## Step 4: Clone and Install Freemen Printer Proxy

```bash
# Clone the repository
git clone https://github.com/freemen-solutions/freemen-printer-proxy.git
cd freemen-printer-proxy

# Run the installation script
chmod +x scripts/*.sh
./scripts/install-pi.sh
```

The script will:
- Check system requirements
- Create configuration from template
- Generate a secure API key
- Build and start the Docker container
- Display access information

---

## Step 5: Access the Dashboard

From any device on your network, open a browser and go to:

```
http://YOUR_PI_IP:6500
```

Or if mDNS works:
```
http://raspberrypi.local:6500
```

You'll be prompted for your API key. Find it in:
```bash
grep API_KEY .env
```

---

## Step 6: Configure Your Printer

1. Open the **Configuration** tab in the dashboard
2. Click **Quick Scan** to find printers on your network
3. Select your Brother printer from the list
4. The printer will be configured and saved automatically

---

## Auto-Start on Boot

The Docker container is configured to restart automatically. Your printer proxy will start when the Pi boots.

To verify:
```bash
docker compose ps
```

---

## Recommended: Static IP Address

For reliable access, configure a static IP:

### Option A: Via Router
Assign a static DHCP lease to your Pi's MAC address in your router settings.

### Option B: On the Pi
Edit `/etc/dhcpcd.conf`:
```bash
sudo nano /etc/dhcpcd.conf
```

Add at the end:
```
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

Reboot:
```bash
sudo reboot
```

---

## Optional: Remote Access

For accessing your printer proxy from outside your network:

### Cloudflare Tunnel (Recommended)
```bash
# Install cloudflared
curl -L https://pkg.cloudflare.com/cloudflared-linux-arm64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create printer-proxy

# Configure (see Cloudflare documentation)
```

### Alternative: Tailscale VPN
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

---

## Troubleshooting

### Can't find the Pi on the network
- Ensure Ethernet is connected or WiFi credentials are correct
- Try waiting longer after boot (up to 5 minutes)
- Connect a monitor to see boot messages

### Docker won't start
```bash
sudo systemctl status docker
sudo systemctl restart docker
```

### Container keeps restarting
```bash
docker compose logs -f
```

### Printer not found during scan
- Ensure printer is on and connected to network
- Check printer has a valid IP (print network config from printer)
- Try manual IP configuration if scan fails

---

## Useful Commands

```bash
# View real-time logs
docker compose logs -f

# Restart the service
docker compose restart

# Stop the service
docker compose down

# Update to latest version
./scripts/update.sh

# Run diagnostics
./scripts/doctor.sh

# Check container status
docker compose ps
```

---

## Next Steps

- [Configure your first printer](./TROUBLESHOOTING.md)
- [Understand the architecture](./ARCHITECTURE.md)
- [Update guide](./UPDATE.md)
