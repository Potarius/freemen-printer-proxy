/**
 * Device Package Generator Service
 * Generates complete deployment packages for Freemen Printer Proxy devices
 */

import type {
  TargetPlatform,
  DevicePackageConfig,
  DevicePackageFile,
  DevicePackage,
  DevicePackageSummary,
} from '../types';

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_SERVICE_PORT = 6500;
const DEFAULT_PRINTER_PORT = 9100;

// ============================================
// DEVICE PACKAGE GENERATOR
// ============================================

export class DevicePackageGenerator {
  private baseOutputDir: string;

  constructor(baseOutputDir: string = './output') {
    this.baseOutputDir = baseOutputDir;
  }

  /**
   * Generate a complete device package
   */
  generatePackage(config: DevicePackageConfig): DevicePackage {
    const files: DevicePackageFile[] = [];
    const outputPath = `${this.baseOutputDir}/${config.deviceId}`;

    // Generate all files
    files.push(this.generateDeviceJson(config));
    files.push(this.generateDeviceEnv(config));
    files.push(this.generateDockerCompose(config));
    files.push(this.generateDockerComposeOverride(config));
    files.push(this.generateSetupScript(config));
    files.push(this.generateCloudflaredService(config));
    files.push(this.generateReadme(config, files));

    // Calculate summary
    const summary = this.generateSummary(config, files);

    return {
      id: config.deviceId,
      createdAt: new Date().toISOString(),
      platform: config.platform,
      outputPath,
      files,
      summary,
    };
  }

  /**
   * device.json - Main device configuration
   */
  private generateDeviceJson(config: DevicePackageConfig): DevicePackageFile {
    const content = JSON.stringify({
      $schema: 'https://freemen.io/schemas/device-v1.json',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      generatedBy: 'Freemen Provisioner',
      
      device: {
        id: config.deviceId,
        name: config.deviceName,
        platform: config.platform,
      },
      
      cloudflare: {
        accountId: config.accountId,
        zoneId: config.zoneId,
        zoneName: config.zoneName,
        tunnel: {
          id: config.tunnelId,
          name: config.tunnelName,
        },
        hostname: config.hostname,
        publicUrl: `https://${config.hostname}`,
      },
      
      service: {
        port: config.servicePort || DEFAULT_SERVICE_PORT,
        localUrl: `http://localhost:${config.servicePort || DEFAULT_SERVICE_PORT}`,
      },
      
      printer: config.printerIp ? {
        ip: config.printerIp,
        port: config.printerPort || DEFAULT_PRINTER_PORT,
        protocol: 'jetdirect',
      } : null,
    }, null, 2);

    return {
      name: 'device.json',
      relativePath: 'device.json',
      description: 'Device configuration (JSON)',
      content,
      size: content.length,
      isExecutable: false,
      category: 'config',
    };
  }

  /**
   * device.env - Environment variables for runtime
   */
  private generateDeviceEnv(config: DevicePackageConfig): DevicePackageFile {
    const lines = [
      '# ============================================',
      '# Freemen Printer Proxy - Device Configuration',
      '# ============================================',
      `# Generated: ${new Date().toISOString()}`,
      '# DO NOT COMMIT THIS FILE TO VERSION CONTROL',
      '',
      '# Device Identity',
      `DEVICE_ID=${config.deviceId}`,
      `DEVICE_NAME=${config.deviceName}`,
      '',
      '# Service Configuration',
      `PORT=${config.servicePort || DEFAULT_SERVICE_PORT}`,
      'API_KEY=${API_KEY:-change-me-in-production}',
      '',
      '# Cloudflare Tunnel',
      `TUNNEL_TOKEN=${config.tunnelToken}`,
      `TUNNEL_ID=${config.tunnelId}`,
      `TUNNEL_NAME=${config.tunnelName}`,
      `PUBLIC_HOSTNAME=${config.hostname}`,
      `PUBLIC_URL=https://${config.hostname}`,
      '',
      '# Printer Configuration',
      `PRINTER_IP=${config.printerIp || ''}`,
      `PRINTER_PORT=${config.printerPort || DEFAULT_PRINTER_PORT}`,
      'PRINTER_PROTOCOL=jetdirect',
      '',
      '# Logging',
      'LOG_LEVEL=info',
      '',
    ];

    const content = lines.join('\n');

    return {
      name: 'device.env',
      relativePath: 'device.env',
      description: 'Environment variables',
      content,
      size: content.length,
      isExecutable: false,
      category: 'config',
    };
  }

  /**
   * docker-compose.yml - Base Docker Compose
   */
  private generateDockerCompose(config: DevicePackageConfig): DevicePackageFile {
    const content = `# ============================================
# Freemen Printer Proxy - Docker Compose
# ============================================
# Device: ${config.deviceId}
# Public URL: https://${config.hostname}

version: '3.8'

services:
  freemen-printer-proxy:
    image: ghcr.io/potarius/freemen-printer-proxy:latest
    container_name: freemen-printer-proxy
    restart: unless-stopped
    env_file:
      - device.env
    ports:
      - "${config.servicePort || DEFAULT_SERVICE_PORT}:${config.servicePort || DEFAULT_SERVICE_PORT}"
    networks:
      - freemen-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${config.servicePort || DEFAULT_SERVICE_PORT}/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: freemen-cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token \${TUNNEL_TOKEN}
    env_file:
      - device.env
    networks:
      - freemen-network
    depends_on:
      - freemen-printer-proxy

networks:
  freemen-network:
    name: freemen-network
    driver: bridge
`;

    return {
      name: 'docker-compose.yml',
      relativePath: 'docker-compose.yml',
      description: 'Docker Compose configuration',
      content,
      size: content.length,
      isExecutable: false,
      category: 'docker',
    };
  }

  /**
   * docker-compose.override.yml - Local overrides
   */
  private generateDockerComposeOverride(config: DevicePackageConfig): DevicePackageFile {
    const content = `# ============================================
# Freemen Printer Proxy - Docker Compose Override
# ============================================
# Use this file for local customizations
# This file is automatically loaded by docker compose

version: '3.8'

services:
  freemen-printer-proxy:
    # Uncomment to build locally instead of pulling image
    # build:
    #   context: .
    #   dockerfile: Dockerfile
    
    # Add local volumes if needed
    # volumes:
    #   - ./data:/app/data

  # cloudflared:
    # Add cloudflared customizations here
`;

    return {
      name: 'docker-compose.override.yml',
      relativePath: 'docker-compose.override.yml',
      description: 'Docker Compose overrides (optional)',
      content,
      size: content.length,
      isExecutable: false,
      category: 'docker',
    };
  }

  /**
   * setup.sh - Platform-specific setup script
   */
  private generateSetupScript(config: DevicePackageConfig): DevicePackageFile {
    const isPi = config.platform === 'raspberry-pi';
    const scriptName = isPi ? 'setup.sh' : 'setup.sh';
    
    const content = isPi
      ? this.generatePiSetupScript(config)
      : this.generateLinuxSetupScript(config);

    return {
      name: scriptName,
      relativePath: scriptName,
      description: `Setup script for ${isPi ? 'Raspberry Pi' : 'Linux'}`,
      content,
      size: content.length,
      isExecutable: true,
      category: 'script',
    };
  }

  private generatePiSetupScript(config: DevicePackageConfig): string {
    return `#!/bin/bash
# ============================================
# Freemen Printer Proxy - Raspberry Pi Setup
# ============================================
# Device: ${config.deviceId}
# Public URL: https://${config.hostname}
# Generated: ${new Date().toISOString()}

set -e

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
CYAN='\\033[0;36m'
NC='\\033[0m' # No Color

echo -e "\${CYAN}"
echo "╔═══════════════════════════════════════════╗"
echo "║   Freemen Printer Proxy - Pi Setup        ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "\${NC}"

echo -e "Device ID: \${CYAN}${config.deviceId}\${NC}"
echo -e "Public URL: \${CYAN}https://${config.hostname}\${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "\${RED}Error: Please run as root (sudo ./setup.sh)\${NC}"
  exit 1
fi

# Check architecture
ARCH=$(uname -m)
if [[ "$ARCH" != "aarch64" && "$ARCH" != "armv7l" ]]; then
  echo -e "\${YELLOW}Warning: Expected ARM architecture, got $ARCH\${NC}"
fi

echo -e "\${YELLOW}[1/5]\${NC} Updating system packages..."
apt-get update -qq

echo -e "\${YELLOW}[2/5]\${NC} Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker pi 2>/dev/null || true
  systemctl enable docker
  systemctl start docker
  echo -e "\${GREEN}✓ Docker installed\${NC}"
else
  echo -e "\${GREEN}✓ Docker already installed\${NC}"
fi

echo -e "\${YELLOW}[3/5]\${NC} Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  apt-get install -y docker-compose-plugin
  echo -e "\${GREEN}✓ Docker Compose installed\${NC}"
else
  echo -e "\${GREEN}✓ Docker Compose already installed\${NC}"
fi

echo -e "\${YELLOW}[4/5]\${NC} Setting up Freemen Printer Proxy..."
# Create data directory
mkdir -p /opt/freemen-printer-proxy
cp -r . /opt/freemen-printer-proxy/
cd /opt/freemen-printer-proxy

# Set permissions
chmod 600 device.env
chmod +x setup.sh

echo -e "\${YELLOW}[5/5]\${NC} Starting services..."
docker compose pull
docker compose up -d

echo ""
echo -e "\${GREEN}╔═══════════════════════════════════════════╗\${NC}"
echo -e "\${GREEN}║   Setup Complete!                         ║\${NC}"
echo -e "\${GREEN}╚═══════════════════════════════════════════╝\${NC}"
echo ""
echo -e "Local URL:  \${CYAN}http://localhost:${config.servicePort || DEFAULT_SERVICE_PORT}\${NC}"
echo -e "Public URL: \${CYAN}https://${config.hostname}\${NC}"
echo ""
echo -e "Commands:"
echo -e "  \${YELLOW}docker compose logs -f\${NC}  - View logs"
echo -e "  \${YELLOW}docker compose restart\${NC} - Restart services"
echo -e "  \${YELLOW}docker compose down\${NC}    - Stop services"
echo ""
`;
  }

  private generateLinuxSetupScript(config: DevicePackageConfig): string {
    return `#!/bin/bash
# ============================================
# Freemen Printer Proxy - Linux Setup
# ============================================
# Device: ${config.deviceId}
# Public URL: https://${config.hostname}
# Generated: ${new Date().toISOString()}

set -e

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
CYAN='\\033[0;36m'
NC='\\033[0m' # No Color

echo -e "\${CYAN}"
echo "╔═══════════════════════════════════════════╗"
echo "║   Freemen Printer Proxy - Linux Setup     ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "\${NC}"

echo -e "Device ID: \${CYAN}${config.deviceId}\${NC}"
echo -e "Public URL: \${CYAN}https://${config.hostname}\${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "\${RED}Error: Please run as root (sudo ./setup.sh)\${NC}"
  exit 1
fi

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
  x86_64)
    CF_ARCH="amd64"
    echo -e "Architecture: \${CYAN}x86_64 (amd64)\${NC}"
    ;;
  aarch64)
    CF_ARCH="arm64"
    echo -e "Architecture: \${CYAN}aarch64 (arm64)\${NC}"
    ;;
  *)
    echo -e "\${RED}Unsupported architecture: $ARCH\${NC}"
    exit 1
    ;;
esac
echo ""

echo -e "\${YELLOW}[1/5]\${NC} Updating system packages..."
if command -v apt-get &> /dev/null; then
  apt-get update -qq
elif command -v dnf &> /dev/null; then
  dnf check-update -q || true
elif command -v yum &> /dev/null; then
  yum check-update -q || true
fi

echo -e "\${YELLOW}[2/5]\${NC} Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo -e "\${GREEN}✓ Docker installed\${NC}"
else
  echo -e "\${GREEN}✓ Docker already installed\${NC}"
fi

echo -e "\${YELLOW}[3/5]\${NC} Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  # Try plugin first
  if command -v apt-get &> /dev/null; then
    apt-get install -y docker-compose-plugin 2>/dev/null || true
  fi
  # Fallback to standalone
  if ! docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d '"' -f 4)
    curl -L "https://github.com/docker/compose/releases/download/\${COMPOSE_VERSION}/docker-compose-linux-\${CF_ARCH}" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
  fi
  echo -e "\${GREEN}✓ Docker Compose installed\${NC}"
else
  echo -e "\${GREEN}✓ Docker Compose already installed\${NC}"
fi

echo -e "\${YELLOW}[4/5]\${NC} Setting up Freemen Printer Proxy..."
# Create installation directory
INSTALL_DIR="/opt/freemen-printer-proxy"
mkdir -p "$INSTALL_DIR"
cp -r . "$INSTALL_DIR/"
cd "$INSTALL_DIR"

# Set permissions
chmod 600 device.env
chmod +x setup.sh

echo -e "\${YELLOW}[5/5]\${NC} Starting services..."
docker compose pull
docker compose up -d

echo ""
echo -e "\${GREEN}╔═══════════════════════════════════════════╗\${NC}"
echo -e "\${GREEN}║   Setup Complete!                         ║\${NC}"
echo -e "\${GREEN}╚═══════════════════════════════════════════╝\${NC}"
echo ""
echo -e "Local URL:  \${CYAN}http://localhost:${config.servicePort || DEFAULT_SERVICE_PORT}\${NC}"
echo -e "Public URL: \${CYAN}https://${config.hostname}\${NC}"
echo ""
echo -e "Commands:"
echo -e "  \${YELLOW}docker compose logs -f\${NC}  - View logs"
echo -e "  \${YELLOW}docker compose restart\${NC} - Restart services"
echo -e "  \${YELLOW}docker compose down\${NC}    - Stop services"
echo ""
`;
  }

  /**
   * cloudflared.service - Systemd service for non-Docker installs
   */
  private generateCloudflaredService(config: DevicePackageConfig): DevicePackageFile {
    const content = `# ============================================
# Freemen Cloudflared - Systemd Service
# ============================================
# Use this if you want to run cloudflared without Docker
# Install: sudo cp cloudflared.service /etc/systemd/system/
# Enable:  sudo systemctl enable cloudflared
# Start:   sudo systemctl start cloudflared

[Unit]
Description=Freemen Cloudflared Tunnel (${config.deviceId})
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel --no-autoupdate run --token ${config.tunnelToken}
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
`;

    return {
      name: 'cloudflared.service',
      relativePath: 'cloudflared.service',
      description: 'Systemd service for cloudflared (optional)',
      content,
      size: content.length,
      isExecutable: false,
      category: 'config',
    };
  }

  /**
   * README.md - Human-readable instructions
   */
  private generateReadme(config: DevicePackageConfig, files: DevicePackageFile[]): DevicePackageFile {
    const isPi = config.platform === 'raspberry-pi';
    const platformName = isPi ? 'Raspberry Pi' : 'Linux';
    
    const content = `# Freemen Printer Proxy - Device Package

> Generated by Freemen Provisioner  
> Date: ${new Date().toISOString()}

## Device Information

| Property | Value |
|----------|-------|
| Device ID | \`${config.deviceId}\` |
| Device Name | ${config.deviceName} |
| Platform | ${platformName} |
| Public URL | https://${config.hostname} |
| Tunnel Name | ${config.tunnelName} |

## Quick Start

### Option 1: Automated Setup (Recommended)

\`\`\`bash
# Copy this folder to your ${platformName}
# Then run:
sudo chmod +x setup.sh
sudo ./setup.sh
\`\`\`

### Option 2: Manual Docker Setup

\`\`\`bash
# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
\`\`\`

### Option 3: Systemd Service (No Docker)

\`\`\`bash
# Install cloudflared manually first
# Then copy and enable the service:
sudo cp cloudflared.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
\`\`\`

## Files Included

| File | Description |
|------|-------------|
${files.map(f => `| \`${f.name}\` | ${f.description} |`).join('\n')}

## Configuration

### Printer Setup

After deployment, configure your printer in \`device.env\`:

\`\`\`env
PRINTER_IP=192.168.1.100
PRINTER_PORT=9100
PRINTER_PROTOCOL=jetdirect
\`\`\`

Then restart:

\`\`\`bash
docker compose restart
\`\`\`

### API Key

Change the default API key in \`device.env\`:

\`\`\`env
API_KEY=your-secure-api-key-here
\`\`\`

## Verification

1. **Local access**: http://localhost:${config.servicePort || DEFAULT_SERVICE_PORT}
2. **Public access**: https://${config.hostname}
3. **Health check**: http://localhost:${config.servicePort || DEFAULT_SERVICE_PORT}/health

## Troubleshooting

### Check service status

\`\`\`bash
docker compose ps
docker compose logs freemen-printer-proxy
docker compose logs cloudflared
\`\`\`

### Restart services

\`\`\`bash
docker compose restart
\`\`\`

### View tunnel status

Visit: https://one.dash.cloudflare.com/ → Networks → Tunnels

## Security Notes

⚠️ **Important:**
- DO NOT commit these files to version control
- The \`device.env\` contains sensitive tunnel token
- Treat the tunnel token like a password
- Change the default API key before production use

## Support

For issues, visit: https://github.com/Potarius/freemen-printer-proxy
`;

    return {
      name: 'README.md',
      relativePath: 'README.md',
      description: 'Setup instructions',
      content,
      size: content.length,
      isExecutable: false,
      category: 'docs',
    };
  }

  /**
   * Generate package summary
   */
  private generateSummary(config: DevicePackageConfig, files: DevicePackageFile[]): DevicePackageSummary {
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const isPi = config.platform === 'raspberry-pi';

    const deploymentSteps = [
      `1. Copy this folder to your ${isPi ? 'Raspberry Pi' : 'Linux server'}`,
      '2. Open a terminal in the folder',
      '3. Run: sudo chmod +x setup.sh',
      '4. Run: sudo ./setup.sh',
      `5. Access locally: http://localhost:${config.servicePort || DEFAULT_SERVICE_PORT}`,
      `6. Access publicly: https://${config.hostname}`,
    ];

    return {
      deviceId: config.deviceId,
      deviceName: config.deviceName,
      platform: config.platform,
      publicUrl: `https://${config.hostname}`,
      tunnelName: config.tunnelName,
      tunnelId: config.tunnelId,
      totalFiles: files.length,
      totalSize,
      deploymentSteps,
    };
  }

  /**
   * Format file size for display
   */
  static formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

let generatorInstance: DevicePackageGenerator | null = null;

export function getDevicePackageGenerator(outputDir?: string): DevicePackageGenerator {
  if (!generatorInstance || outputDir) {
    generatorInstance = new DevicePackageGenerator(outputDir);
  }
  return generatorInstance;
}
