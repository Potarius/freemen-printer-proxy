#!/usr/bin/env node
/**
 * Freemen Printer Proxy - Cloudflare Tunnel Provisioner
 * Interactive CLI for Windows/Mac/Linux
 * 
 * Usage: node index.js
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const boxen = require('boxen');
const path = require('path');
const crypto = require('crypto');
const CloudflareAPI = require('./lib/cloudflare');
const ConfigGenerator = require('./lib/config-generator');

// ============================================
// CONSTANTS
// ============================================

const VERSION = '1.0.0';
const DEFAULT_SERVICE_PORT = 6500;

// ============================================
// UI HELPERS
// ============================================

function clearScreen() {
  process.stdout.write('\x1Bc');
}

function printHeader() {
  console.log('');
  console.log(boxen(
    chalk.bold.cyan('Freemen Printer Proxy') + '\n' +
    chalk.gray('Cloudflare Tunnel Provisioner') + '\n' +
    chalk.gray(`v${VERSION}`),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: 'cyan',
    }
  ));
}

function printSection(title) {
  console.log('');
  console.log(chalk.cyan.bold(`━━━ ${title} ━━━`));
  console.log('');
}

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.log(chalk.red('✗') + ' ' + message);
}

function printInfo(message) {
  console.log(chalk.blue('ℹ') + ' ' + message);
}

function printWarning(message) {
  console.log(chalk.yellow('⚠') + ' ' + message);
}

// ============================================
// MAIN PROVISIONER
// ============================================

async function main() {
  clearScreen();
  printHeader();

  try {
    // Step 1: Get API Token
    printSection('1. Cloudflare Authentication');
    
    printInfo('You need a Cloudflare API Token with the following permissions:');
    console.log(chalk.gray('   • Zone:Zone:Read'));
    console.log(chalk.gray('   • Zone:DNS:Edit'));
    console.log(chalk.gray('   • Account:Cloudflare Tunnel:Edit'));
    console.log(chalk.gray('   • Account:Account Settings:Read'));
    console.log('');
    printInfo('Create one at: ' + chalk.underline('https://dash.cloudflare.com/profile/api-tokens'));
    console.log('');

    const { apiToken } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiToken',
        message: 'Enter your Cloudflare API Token:',
        mask: '*',
        validate: (input) => input.length > 20 || 'API Token seems too short',
      },
    ]);

    // Verify token
    const spinner = ora('Verifying API token...').start();
    const cf = new CloudflareAPI(apiToken);
    
    try {
      await cf.verifyToken();
      spinner.succeed('API token verified');
    } catch (error) {
      spinner.fail('Invalid API token');
      printError(error.message);
      process.exit(1);
    }

    // Step 2: Get Accounts
    printSection('2. Select Account');
    
    spinner.start('Fetching accounts...');
    const accounts = await cf.getAccounts();
    spinner.stop();

    if (accounts.length === 0) {
      printError('No accounts found. Check your API token permissions.');
      process.exit(1);
    }

    let selectedAccount;
    if (accounts.length === 1) {
      selectedAccount = accounts[0];
      printSuccess(`Using account: ${selectedAccount.name}`);
    } else {
      const { accountId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'accountId',
          message: 'Select Cloudflare account:',
          choices: accounts.map(a => ({ name: a.name, value: a.id })),
        },
      ]);
      selectedAccount = accounts.find(a => a.id === accountId);
    }

    // Step 3: Get Zones
    printSection('3. Select Domain (Zone)');

    spinner.start('Fetching zones...');
    const zones = await cf.getZones(selectedAccount.id);
    spinner.stop();

    if (zones.length === 0) {
      printError('No zones found in this account.');
      process.exit(1);
    }

    const { zoneId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'zoneId',
        message: 'Select domain for the tunnel:',
        choices: zones.map(z => ({ 
          name: `${z.name} ${chalk.gray(`(${z.status})`)}`, 
          value: z.id 
        })),
      },
    ]);

    const selectedZone = zones.find(z => z.id === zoneId);
    printSuccess(`Selected zone: ${selectedZone.name}`);

    // Step 4: Configure Device
    printSection('4. Device Configuration');

    const configGen = new ConfigGenerator(path.join(process.cwd(), 'output'));
    const defaultDeviceId = configGen.generateDeviceId();

    const { deviceName, hostname, targetPlatform } = await inquirer.prompt([
      {
        type: 'input',
        name: 'deviceName',
        message: 'Device name (friendly name):',
        default: 'My Printer Proxy',
      },
      {
        type: 'input',
        name: 'hostname',
        message: `Hostname (subdomain.${selectedZone.name}):`,
        default: `printer.${selectedZone.name}`,
        validate: (input) => {
          if (!input.includes('.')) return 'Enter full hostname (e.g., printer.example.com)';
          if (!input.endsWith(selectedZone.name)) return `Hostname must end with ${selectedZone.name}`;
          return true;
        },
      },
      {
        type: 'list',
        name: 'targetPlatform',
        message: 'Target platform:',
        choices: [
          { name: 'Raspberry Pi (ARM64)', value: 'raspberry-pi' },
          { name: 'Ubuntu/Linux (AMD64)', value: 'linux' },
        ],
      },
    ]);

    // Generate tunnel name from hostname
    const tunnelName = `freemen-${hostname.split('.')[0]}-${Date.now().toString(36)}`;

    // Step 5: Create Tunnel
    printSection('5. Creating Cloudflare Tunnel');

    // Generate tunnel secret (32 bytes base64)
    const tunnelSecret = crypto.randomBytes(32).toString('base64');

    spinner.start('Creating tunnel...');
    let tunnel;
    try {
      tunnel = await cf.createTunnel(selectedAccount.id, tunnelName, tunnelSecret);
      spinner.succeed(`Tunnel created: ${tunnel.name}`);
    } catch (error) {
      spinner.fail('Failed to create tunnel');
      printError(error.message);
      process.exit(1);
    }

    // Get tunnel token
    spinner.start('Retrieving tunnel token...');
    let tunnelToken;
    try {
      tunnelToken = await cf.getTunnelToken(selectedAccount.id, tunnel.id);
      spinner.succeed('Tunnel token retrieved');
    } catch (error) {
      spinner.fail('Failed to get tunnel token');
      printError(error.message);
      process.exit(1);
    }

    // Step 6: Configure DNS
    printSection('6. Configuring DNS');

    spinner.start(`Creating DNS record for ${hostname}...`);
    try {
      const dnsResult = await cf.createTunnelDNS(zoneId, hostname, tunnel.id);
      if (dnsResult.updated) {
        spinner.succeed(`DNS record updated: ${hostname}`);
      } else {
        spinner.succeed(`DNS record created: ${hostname}`);
      }
    } catch (error) {
      spinner.warn('DNS configuration failed (you may need to add it manually)');
      printWarning(error.message);
    }

    // Step 7: Configure Tunnel Ingress
    spinner.start('Configuring tunnel ingress...');
    try {
      await cf.configureTunnelIngress(
        selectedAccount.id, 
        tunnel.id, 
        hostname, 
        `http://freemen-printer-proxy:${DEFAULT_SERVICE_PORT}`
      );
      spinner.succeed('Tunnel ingress configured');
    } catch (error) {
      spinner.warn('Ingress configuration failed (you may need to configure manually)');
      printWarning(error.message);
    }

    // Step 8: Generate Config Files
    printSection('7. Generating Configuration Files');

    const configOptions = {
      deviceId: defaultDeviceId,
      deviceName,
      targetPlatform,
      hostname,
      tunnelName: tunnel.name,
      tunnelId: tunnel.id,
      tunnelToken,
      zoneId,
      zoneName: selectedZone.name,
      accountId: selectedAccount.id,
      servicePort: DEFAULT_SERVICE_PORT,
    };

    spinner.start('Generating configuration files...');
    const outputDir = path.join(process.cwd(), 'output', defaultDeviceId);
    const outputGen = new ConfigGenerator(outputDir);
    const generatedFiles = outputGen.writeAllConfigs(configOptions);
    spinner.succeed(`Generated ${generatedFiles.length} files`);

    // Final Summary
    printSection('✓ Provisioning Complete');

    console.log(boxen(
      chalk.bold('Device Summary\n\n') +
      `${chalk.gray('Device ID:')}     ${chalk.cyan(defaultDeviceId)}\n` +
      `${chalk.gray('Device Name:')}   ${deviceName}\n` +
      `${chalk.gray('Platform:')}      ${targetPlatform}\n` +
      `${chalk.gray('Tunnel:')}        ${tunnel.name}\n` +
      `${chalk.gray('Hostname:')}      ${chalk.green(hostname)}\n` +
      `${chalk.gray('Public URL:')}    ${chalk.underline.green(`https://${hostname}`)}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
      }
    ));

    console.log(chalk.bold('\nGenerated Files:'));
    console.log(chalk.gray(`Location: ${outputDir}\n`));
    generatedFiles.forEach(f => {
      console.log(`  ${chalk.cyan('•')} ${f.name} ${chalk.gray(`- ${f.description}`)}`);
    });

    console.log('');
    printInfo('Next steps:');
    console.log(chalk.gray('  1. Copy the output folder to your target device'));
    console.log(chalk.gray('  2. Run the setup script on the device'));
    console.log(chalk.gray('  3. Configure your printer in the dashboard'));
    console.log('');

    // Ask to open output folder
    const { openFolder } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'openFolder',
        message: 'Open output folder?',
        default: true,
      },
    ]);

    if (openFolder) {
      const { exec } = require('child_process');
      const command = process.platform === 'win32' 
        ? `explorer "${outputDir}"`
        : process.platform === 'darwin'
        ? `open "${outputDir}"`
        : `xdg-open "${outputDir}"`;
      exec(command);
    }

    console.log('');
    printSuccess('Provisioning complete! Happy printing! 🖨️');
    console.log('');

  } catch (error) {
    console.log('');
    printError('An unexpected error occurred:');
    console.log(chalk.red(error.message));
    if (process.env.DEBUG) {
      console.log(error.stack);
    }
    process.exit(1);
  }
}

// Run
main().catch(console.error);
