/**
 * Ubuntu Deployment Service
 * Generates deployment commands and scripts for Ubuntu/Linux
 */

import type {
  DeploymentMode,
  DeploymentCommand,
  DeploymentStep,
  DeploymentPackage,
  DeploymentSummary,
  UbuntuDeployConfig,
} from '../types';

// ============================================
// CONSTANTS
// ============================================

export const DEFAULT_DEPLOY_CONFIG: UbuntuDeployConfig = {
  targetHost: 'localhost',
  targetUser: 'freemen',
  installPath: '/opt/freemen-printer-proxy',
  printerPort: 9100,
};

export const DEPLOYMENT_MODE_INFO: Record<DeploymentMode, { title: string; description: string; icon: string }> = {
  fresh: {
    title: 'Fresh Install',
    description: 'Install Freemen Printer Proxy on a new machine',
    icon: '🚀',
  },
  update: {
    title: 'Update Existing',
    description: 'Update an existing installation to the latest version',
    icon: '🔄',
  },
  reprovision: {
    title: 'Reprovision',
    description: 'Reconfigure an existing installation with new settings',
    icon: '⚙️',
  },
};

// ============================================
// UBUNTU DEPLOYMENT SERVICE
// ============================================

export class UbuntuDeploymentService {
  /**
   * Generate deployment package based on mode and config
   */
  generatePackage(mode: DeploymentMode, config: UbuntuDeployConfig): DeploymentPackage {
    const steps = this.generateSteps(mode, config);
    const commands = steps.flatMap(s => s.commands);
    const scripts = this.generateScripts(mode, config);

    return {
      id: `deploy-${Date.now().toString(36)}`,
      mode,
      config,
      steps,
      commands,
      scripts,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generate deployment steps based on mode
   */
  generateSteps(mode: DeploymentMode, config: UbuntuDeployConfig): DeploymentStep[] {
    switch (mode) {
      case 'fresh':
        return this.generateFreshInstallSteps(config);
      case 'update':
        return this.generateUpdateSteps(config);
      case 'reprovision':
        return this.generateReprovisionSteps(config);
    }
  }

  /**
   * Generate fresh install steps
   */
  private generateFreshInstallSteps(config: UbuntuDeployConfig): DeploymentStep[] {
    const steps: DeploymentStep[] = [];

    // Step 1: Prerequisites
    steps.push({
      id: 'prerequisites',
      title: 'Install Prerequisites',
      description: 'Install Docker and required dependencies',
      estimatedTime: '2-5 min',
      status: 'pending',
      commands: [
        {
          id: 'update-packages',
          label: 'Update package lists',
          command: 'sudo apt-get update',
          description: 'Update the package manager cache',
          category: 'prerequisite',
        },
        {
          id: 'install-curl',
          label: 'Install curl',
          command: 'sudo apt-get install -y curl git',
          description: 'Install curl and git for downloading',
          category: 'prerequisite',
        },
        {
          id: 'install-docker',
          label: 'Install Docker',
          command: 'curl -fsSL https://get.docker.com | sh',
          description: 'Install Docker using the official script',
          category: 'prerequisite',
        },
        {
          id: 'add-user-docker',
          label: 'Add user to docker group',
          command: `sudo usermod -aG docker ${config.targetUser}`,
          description: 'Allow user to run Docker without sudo',
          category: 'prerequisite',
        },
      ],
    });

    // Step 2: Clone/Download
    steps.push({
      id: 'download',
      title: 'Download Project',
      description: 'Clone the repository to the target machine',
      estimatedTime: '1 min',
      status: 'pending',
      commands: [
        {
          id: 'create-dir',
          label: 'Create install directory',
          command: `sudo mkdir -p ${config.installPath}`,
          description: 'Create the installation directory',
          category: 'setup',
        },
        {
          id: 'set-ownership',
          label: 'Set directory ownership',
          command: `sudo chown ${config.targetUser}:${config.targetUser} ${config.installPath}`,
          description: 'Set ownership to the target user',
          category: 'setup',
        },
        {
          id: 'clone-repo',
          label: 'Clone repository',
          command: `git clone https://github.com/Potarius/freemen-printer-proxy.git ${config.installPath}`,
          description: 'Clone the project from GitHub',
          category: 'setup',
        },
        {
          id: 'cd-project',
          label: 'Navigate to project',
          command: `cd ${config.installPath}`,
          description: 'Change to the project directory',
          category: 'setup',
        },
      ],
    });

    // Step 3: Configure
    steps.push({
      id: 'configure',
      title: 'Configure Environment',
      description: 'Set up environment variables and configuration',
      estimatedTime: '1 min',
      status: 'pending',
      commands: this.generateConfigCommands(config),
    });

    // Step 4: Deploy
    steps.push({
      id: 'deploy',
      title: 'Build & Deploy',
      description: 'Build the Docker image and start the service',
      estimatedTime: '3-5 min',
      status: 'pending',
      commands: [
        {
          id: 'docker-build',
          label: 'Build Docker image',
          command: 'docker compose build',
          description: 'Build the application Docker image',
          category: 'deploy',
        },
        {
          id: 'docker-up',
          label: 'Start containers',
          command: 'docker compose up -d',
          description: 'Start the service in detached mode',
          category: 'deploy',
        },
      ],
    });

    // Step 5: Verify
    steps.push({
      id: 'verify',
      title: 'Verify Installation',
      description: 'Check that the service is running correctly',
      estimatedTime: '1 min',
      status: 'pending',
      commands: [
        {
          id: 'wait',
          label: 'Wait for startup',
          command: 'sleep 5',
          description: 'Wait for the service to initialize',
          category: 'verify',
        },
        {
          id: 'check-status',
          label: 'Check container status',
          command: 'docker compose ps',
          description: 'Verify containers are running',
          category: 'verify',
        },
        {
          id: 'health-check',
          label: 'Health check',
          command: 'curl -s http://localhost:6500/health | jq .',
          description: 'Check the service health endpoint',
          category: 'verify',
        },
        {
          id: 'run-doctor',
          label: 'Run diagnostics',
          command: './scripts/doctor.sh',
          description: 'Run the diagnostic script',
          category: 'verify',
          optional: true,
        },
      ],
    });

    return steps;
  }

  /**
   * Generate update steps
   */
  private generateUpdateSteps(config: UbuntuDeployConfig): DeploymentStep[] {
    return [
      {
        id: 'backup',
        title: 'Backup Configuration',
        description: 'Backup current configuration before updating',
        estimatedTime: '30 sec',
        status: 'pending',
        commands: [
          {
            id: 'cd-project',
            label: 'Navigate to project',
            command: `cd ${config.installPath}`,
            description: 'Change to the project directory',
            category: 'setup',
          },
          {
            id: 'backup-env',
            label: 'Backup .env file',
            command: 'cp .env .env.backup.$(date +%Y%m%d_%H%M%S)',
            description: 'Create a timestamped backup of the environment file',
            category: 'setup',
          },
        ],
      },
      {
        id: 'update',
        title: 'Pull & Rebuild',
        description: 'Pull latest code and rebuild the container',
        estimatedTime: '3-5 min',
        status: 'pending',
        commands: [
          {
            id: 'git-pull',
            label: 'Pull latest changes',
            command: 'git pull origin main',
            description: 'Pull the latest code from GitHub',
            category: 'deploy',
          },
          {
            id: 'docker-down',
            label: 'Stop containers',
            command: 'docker compose down',
            description: 'Stop the running containers',
            category: 'deploy',
          },
          {
            id: 'docker-build',
            label: 'Rebuild image',
            command: 'docker compose build --no-cache',
            description: 'Rebuild the Docker image with latest code',
            category: 'deploy',
          },
          {
            id: 'docker-up',
            label: 'Start containers',
            command: 'docker compose up -d',
            description: 'Start the updated service',
            category: 'deploy',
          },
        ],
      },
      {
        id: 'verify',
        title: 'Verify Update',
        description: 'Verify the service is running correctly',
        estimatedTime: '1 min',
        status: 'pending',
        commands: [
          {
            id: 'wait',
            label: 'Wait for startup',
            command: 'sleep 5',
            description: 'Wait for the service to initialize',
            category: 'verify',
          },
          {
            id: 'health-check',
            label: 'Health check',
            command: 'curl -s http://localhost:6500/health | jq .',
            description: 'Verify the service is healthy',
            category: 'verify',
          },
          {
            id: 'check-version',
            label: 'Check version',
            command: 'grep \'"version"\' package.json',
            description: 'Verify the updated version',
            category: 'verify',
          },
        ],
      },
    ];
  }

  /**
   * Generate reprovision steps
   */
  private generateReprovisionSteps(config: UbuntuDeployConfig): DeploymentStep[] {
    return [
      {
        id: 'stop',
        title: 'Stop Service',
        description: 'Stop the current service before reconfiguring',
        estimatedTime: '30 sec',
        status: 'pending',
        commands: [
          {
            id: 'cd-project',
            label: 'Navigate to project',
            command: `cd ${config.installPath}`,
            description: 'Change to the project directory',
            category: 'setup',
          },
          {
            id: 'docker-down',
            label: 'Stop containers',
            command: 'docker compose down',
            description: 'Stop the running containers',
            category: 'deploy',
          },
        ],
      },
      {
        id: 'reconfigure',
        title: 'Update Configuration',
        description: 'Apply new configuration settings',
        estimatedTime: '1 min',
        status: 'pending',
        commands: this.generateConfigCommands(config),
      },
      {
        id: 'restart',
        title: 'Restart Service',
        description: 'Start the service with new configuration',
        estimatedTime: '1 min',
        status: 'pending',
        commands: [
          {
            id: 'docker-up',
            label: 'Start containers',
            command: 'docker compose up -d',
            description: 'Start the service with new config',
            category: 'deploy',
          },
          {
            id: 'wait',
            label: 'Wait for startup',
            command: 'sleep 5',
            description: 'Wait for the service to initialize',
            category: 'verify',
          },
          {
            id: 'health-check',
            label: 'Health check',
            command: 'curl -s http://localhost:6500/health | jq .',
            description: 'Verify the service is healthy',
            category: 'verify',
          },
        ],
      },
    ];
  }

  /**
   * Generate configuration commands
   */
  private generateConfigCommands(config: UbuntuDeployConfig): DeploymentCommand[] {
    const commands: DeploymentCommand[] = [];

    // Create .env from example if needed
    commands.push({
      id: 'create-env',
      label: 'Create .env file',
      command: '[ ! -f .env ] && cp .env.example .env || echo ".env exists"',
      description: 'Create environment file from example if not exists',
      category: 'setup',
    });

    // Generate API key if provided
    if (config.apiKey) {
      commands.push({
        id: 'set-api-key',
        label: 'Set API key',
        command: `sed -i 's/API_KEY=.*/API_KEY=${config.apiKey}/' .env`,
        description: 'Configure the API key in .env',
        category: 'setup',
      });
    } else {
      commands.push({
        id: 'generate-api-key',
        label: 'Generate API key',
        command: 'sed -i "s/API_KEY=.*/API_KEY=$(openssl rand -hex 32)/" .env',
        description: 'Generate a secure random API key',
        category: 'setup',
      });
    }

    // Set device ID if provided
    if (config.deviceId) {
      commands.push({
        id: 'set-device-id',
        label: 'Set device ID',
        command: `echo "DEVICE_ID=${config.deviceId}" >> .env`,
        description: 'Configure the device identifier',
        category: 'setup',
      });
    }

    // Set tunnel token if provided
    if (config.tunnelToken) {
      commands.push({
        id: 'set-tunnel-token',
        label: 'Set Cloudflare tunnel token',
        command: `echo "TUNNEL_TOKEN=${config.tunnelToken}" >> .env`,
        description: 'Configure the Cloudflare tunnel token',
        category: 'setup',
      });
    }

    // Set printer config if provided
    if (config.printerIp) {
      commands.push({
        id: 'set-printer-ip',
        label: 'Set printer IP',
        command: `echo "PRINTER_IP=${config.printerIp}" >> .env`,
        description: 'Configure the printer IP address',
        category: 'setup',
      });
      commands.push({
        id: 'set-printer-port',
        label: 'Set printer port',
        command: `echo "PRINTER_PORT=${config.printerPort || 9100}" >> .env`,
        description: 'Configure the printer port',
        category: 'setup',
      });
    }

    // Create directories
    commands.push({
      id: 'create-dirs',
      label: 'Create data directories',
      command: 'mkdir -p data logs',
      description: 'Create required data and log directories',
      category: 'setup',
    });

    return commands;
  }

  /**
   * Generate deployment scripts
   */
  private generateScripts(mode: DeploymentMode, config: UbuntuDeployConfig): { name: string; description: string; content: string }[] {
    const scripts = [];

    // All-in-one deployment script
    scripts.push({
      name: 'deploy.sh',
      description: 'All-in-one deployment script',
      content: this.generateDeployScript(mode, config),
    });

    // Quick commands reference
    scripts.push({
      name: 'commands.sh',
      description: 'Quick reference commands',
      content: this.generateCommandsReference(config),
    });

    return scripts;
  }

  /**
   * Generate all-in-one deployment script
   */
  private generateDeployScript(mode: DeploymentMode, config: UbuntuDeployConfig): string {
    const steps = this.generateSteps(mode, config);

    return `#!/bin/bash
#
# Freemen Printer Proxy - ${DEPLOYMENT_MODE_INFO[mode].title}
# Generated by Freemen Provisioner
#
# Usage: ./deploy.sh
#

set -e

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m'

info() { echo -e "\${BLUE}[INFO]\${NC} $1"; }
success() { echo -e "\${GREEN}[OK]\${NC} $1"; }
warn() { echo -e "\${YELLOW}[WARN]\${NC} $1"; }
error() { echo -e "\${RED}[ERROR]\${NC} $1"; exit 1; }

echo ""
echo -e "\${BLUE}╔══════════════════════════════════════════════════════════╗\${NC}"
echo -e "\${BLUE}║\${NC}     Freemen Printer Proxy - ${DEPLOYMENT_MODE_INFO[mode].title}                  \${BLUE}║\${NC}"
echo -e "\${BLUE}╚══════════════════════════════════════════════════════════╝\${NC}"
echo ""

${steps.map((step, i) => `
# Step ${i + 1}: ${step.title}
info "Step ${i + 1}/${steps.length}: ${step.title}..."
${step.commands.map(cmd => cmd.command).join('\n')}
success "${step.title} complete"
echo ""
`).join('')}

echo -e "\${GREEN}╔══════════════════════════════════════════════════════════╗\${NC}"
echo -e "\${GREEN}║\${NC}              Deployment Complete!                        \${GREEN}║\${NC}"
echo -e "\${GREEN}╚══════════════════════════════════════════════════════════╝\${NC}"
echo ""
echo "  Dashboard: http://$(hostname -I | awk '{print $1}'):6500"
echo ""
`;
  }

  /**
   * Generate commands reference script
   */
  private generateCommandsReference(config: UbuntuDeployConfig): string {
    return `#!/bin/bash
#
# Freemen Printer Proxy - Quick Commands Reference
#

# Navigate to project
cd ${config.installPath}

# ─── COMMON COMMANDS ────────────────────────────────────────────────

# Start the service
# docker compose up -d

# Stop the service
# docker compose down

# Restart the service
# docker compose restart

# View logs (follow mode)
# docker compose logs -f

# View last 50 log lines
# docker compose logs --tail=50

# ─── MAINTENANCE ────────────────────────────────────────────────────

# Update to latest version
# ./scripts/update.sh

# Run diagnostics
# ./scripts/doctor.sh

# Interactive admin menu
# ./deploy-menu.sh

# ─── TROUBLESHOOTING ────────────────────────────────────────────────

# Check container status
# docker compose ps

# Check container health
# docker inspect --format='{{.State.Health.Status}}' freemen-printer-proxy

# Check health endpoint
# curl -s http://localhost:6500/health | jq .

# Check ports
# ss -tuln | grep 6500

# ─── CONFIGURATION ──────────────────────────────────────────────────

# Edit environment
# nano .env

# View current config
# cat .env

# Backup config
# cp .env .env.backup
`;
  }

  /**
   * Generate deployment summary
   */
  generateSummary(mode: DeploymentMode, config: UbuntuDeployConfig): DeploymentSummary {
    const steps = this.generateSteps(mode, config);
    const totalCommands = steps.reduce((acc, s) => acc + s.commands.length, 0);
    
    const timeMap: Record<DeploymentMode, string> = {
      fresh: '8-12 minutes',
      update: '3-5 minutes',
      reprovision: '2-3 minutes',
    };

    return {
      mode,
      targetHost: config.targetHost,
      installPath: config.installPath,
      totalCommands,
      estimatedTime: timeMap[mode],
      hasCloudflare: !!config.tunnelToken,
      hasPrinter: !!config.printerIp,
    };
  }

  /**
   * Generate SSH command prefix for remote deployment
   */
  generateSshPrefix(config: UbuntuDeployConfig): string {
    if (config.targetHost === 'localhost' || config.targetHost === '127.0.0.1') {
      return '';
    }
    return `ssh ${config.targetUser}@${config.targetHost} `;
  }

  /**
   * Generate SCP command for copying files
   */
  generateScpCommand(config: UbuntuDeployConfig, localFile: string, remotePath: string): string {
    if (config.targetHost === 'localhost' || config.targetHost === '127.0.0.1') {
      return `cp ${localFile} ${remotePath}`;
    }
    return `scp ${localFile} ${config.targetUser}@${config.targetHost}:${remotePath}`;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

let serviceInstance: UbuntuDeploymentService | null = null;

export function getUbuntuDeploymentService(): UbuntuDeploymentService {
  if (!serviceInstance) {
    serviceInstance = new UbuntuDeploymentService();
  }
  return serviceInstance;
}
