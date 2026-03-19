/**
 * SD Card Service
 * Handles SD card detection, file writing, and Pi boot configuration
 * Uses Tauri commands for native disk operations
 */

import { invoke } from '@tauri-apps/api/tauri';
import type { PiSetupConfig, PiBootFile, DevicePackage } from '../types';

// ============================================
// TYPES
// ============================================

export interface DetectedDrive {
  letter: string;
  label: string;
  driveType: string;
  size: number;
  freeSpace: number;
  isRemovable: boolean;
  fileSystem: string;
}

export interface SDWriteProgress {
  step: string;
  current: number;
  total: number;
  message: string;
}

export interface SDWriteResult {
  success: boolean;
  filesWritten: string[];
  errors: string[];
  bootPath: string;
}

// ============================================
// TAURI DETECTION
// ============================================

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

// ============================================
// DRIVE DETECTION
// ============================================

/**
 * Detect removable drives (SD cards, USB drives)
 */
export async function detectDrives(): Promise<DetectedDrive[]> {
  if (!isTauri()) {
    console.log('[SDCard] Browser mode - returning mock drives');
    return getMockDrives();
  }

  try {
    interface TauriDrive {
      letter: string;
      label: string;
      drive_type: string;
      size: number;
      free_space: number;
      is_removable: boolean;
      file_system: string;
    }

    const drives = await invoke<TauriDrive[]>('detect_drives');
    
    return drives.map(d => ({
      letter: d.letter,
      label: d.label,
      driveType: d.drive_type,
      size: d.size,
      freeSpace: d.free_space,
      isRemovable: d.is_removable,
      fileSystem: d.file_system,
    }));
  } catch (error) {
    console.error('[SDCard] Failed to detect drives:', error);
    throw new Error(`Drive detection failed: ${error}`);
  }
}

/**
 * Mock drives for browser testing
 */
function getMockDrives(): DetectedDrive[] {
  return [
    {
      letter: 'E',
      label: 'boot',
      driveType: 'Removable',
      size: 268435456, // 256MB
      freeSpace: 134217728,
      isRemovable: true,
      fileSystem: 'FAT32',
    },
    {
      letter: 'F',
      label: 'rootfs',
      driveType: 'Removable',
      size: 32212254720, // 30GB
      freeSpace: 28991029248,
      isRemovable: true,
      fileSystem: 'ext4',
    },
  ];
}

/**
 * Check if a drive is a Raspberry Pi boot partition
 */
export async function isPiBootPartition(driveLetter: string): Promise<boolean> {
  if (!isTauri()) {
    // In browser mode, check label
    return driveLetter.toLowerCase() === 'e' || driveLetter.toLowerCase().includes('boot');
  }

  try {
    const path = `${driveLetter}:\\`;
    return await invoke<boolean>('is_pi_boot_partition', { path });
  } catch (error) {
    console.error('[SDCard] Failed to check boot partition:', error);
    return false;
  }
}

/**
 * Check if a path exists
 */
export async function pathExists(path: string): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  try {
    return await invoke<boolean>('path_exists', { path });
  } catch {
    return false;
  }
}

// ============================================
// PASSWORD HASHING
// ============================================

/**
 * Hash password using SHA-512 for Pi userconf.txt
 */
export async function hashPassword(password: string): Promise<string> {
  if (!isTauri()) {
    // Return placeholder in browser mode
    console.warn('[SDCard] Browser mode - returning placeholder hash');
    return '$6$placeholder$BROWSER_MODE_HASH_NOT_REAL';
  }

  try {
    return await invoke<string>('hash_password', { password });
  } catch (error) {
    console.error('[SDCard] Failed to hash password:', error);
    throw new Error(`Password hashing failed: ${error}`);
  }
}

// ============================================
// FILE OPERATIONS
// ============================================

/**
 * Write a text file to the SD card
 */
export async function writeFile(path: string, content: string): Promise<void> {
  if (!isTauri()) {
    console.log('[SDCard] Browser mode - simulating file write:', path);
    return;
  }

  try {
    await invoke('write_file', { path, content });
  } catch (error) {
    throw new Error(`Failed to write ${path}: ${error}`);
  }
}

/**
 * Write a binary file to the SD card
 */
export async function writeBinaryFile(path: string, content: Uint8Array): Promise<void> {
  if (!isTauri()) {
    console.log('[SDCard] Browser mode - simulating binary write:', path);
    return;
  }

  try {
    await invoke('write_binary_file', { path, content: Array.from(content) });
  } catch (error) {
    throw new Error(`Failed to write ${path}: ${error}`);
  }
}

/**
 * Create a directory
 */
export async function createDirectory(path: string): Promise<void> {
  if (!isTauri()) {
    console.log('[SDCard] Browser mode - simulating directory creation:', path);
    return;
  }

  try {
    await invoke('create_directory', { path });
  } catch (error) {
    throw new Error(`Failed to create directory ${path}: ${error}`);
  }
}

/**
 * List files in a directory
 */
export async function listDirectory(path: string): Promise<string[]> {
  if (!isTauri()) {
    return [];
  }

  try {
    return await invoke<string[]>('list_directory', { path });
  } catch (error) {
    console.error('[SDCard] Failed to list directory:', error);
    return [];
  }
}

// ============================================
// PI BOOT FILE GENERATION
// ============================================

/**
 * Generate SSH enable file (empty file)
 */
export function generateSshFile(): PiBootFile {
  return {
    name: 'ssh',
    path: 'ssh',
    description: 'Enables SSH on first boot',
    content: '',
    required: true,
  };
}

/**
 * Generate userconf.txt with hashed password
 */
export function generateUserconfFile(username: string, hashedPassword: string): PiBootFile {
  return {
    name: 'userconf.txt',
    path: 'userconf.txt',
    description: 'Sets the default username and password',
    content: `${username}:${hashedPassword}`,
    required: true,
  };
}

/**
 * Generate wpa_supplicant.conf for WiFi
 */
export function generateWpaSupplicantFile(
  ssid: string,
  password: string,
  country: string
): PiBootFile {
  const content = `country=${country}
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="${ssid}"
    psk="${password}"
    key_mgmt=WPA-PSK
}
`;

  return {
    name: 'wpa_supplicant.conf',
    path: 'wpa_supplicant.conf',
    description: 'WiFi network configuration',
    content,
    required: false,
  };
}

/**
 * Generate firstrun.sh script for initial setup
 */
export function generateFirstRunScript(config: PiSetupConfig, devicePackage?: DevicePackage): PiBootFile {
  const tunnelSetup = devicePackage?.tunnelToken ? `
# Setup Cloudflare Tunnel
mkdir -p /opt/freemen-printer-proxy
echo '${devicePackage.tunnelToken}' > /opt/freemen-printer-proxy/tunnel-token.txt
chown -R ${config.username}:${config.username} /opt/freemen-printer-proxy
` : '';

  const content = `#!/bin/bash
# Freemen Printer Proxy - First Run Setup
# Generated by Freemen Provisioner
# This script runs once on first boot

set -e

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a /var/log/freemen-firstrun.log
}

log "Starting Freemen first-run setup..."

# Set hostname
log "Setting hostname to ${config.hostname}"
hostnamectl set-hostname ${config.hostname}
echo "${config.hostname}" > /etc/hostname

# Set timezone
log "Setting timezone to ${config.timezone}"
timedatectl set-timezone ${config.timezone}

# Update system
log "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Docker
log "Installing Docker..."
curl -fsSL https://get.docker.com | sh
usermod -aG docker ${config.username}

# Install Docker Compose
log "Installing Docker Compose..."
apt-get install -y docker-compose-plugin || apt-get install -y docker-compose

${tunnelSetup}

# Enable and start Docker
systemctl enable docker
systemctl start docker

# Create freemen service directory
mkdir -p /opt/freemen-printer-proxy
chown -R ${config.username}:${config.username} /opt/freemen-printer-proxy

log "Freemen first-run setup complete!"
log "System will reboot in 10 seconds..."

# Clean up
rm -f /boot/firstrun.sh /boot/firmware/firstrun.sh 2>/dev/null || true
sed -i 's| systemd.run.*||g' /boot/cmdline.txt /boot/firmware/cmdline.txt 2>/dev/null || true

# Reboot to apply all changes
sleep 10
reboot
`;

  return {
    name: 'firstrun.sh',
    path: 'firstrun.sh',
    description: 'First boot setup script',
    content,
    required: true,
  };
}

/**
 * Generate cmdline.txt addition instructions
 */
export function generateCmdlineAddition(): string {
  return ' systemd.run=/boot/firstrun.sh systemd.run_success_action=reboot systemd.unit=kernel-command-line.target';
}

// ============================================
// MAIN SD WRITE FUNCTION
// ============================================

/**
 * Write all Pi configuration files to SD card boot partition
 */
export async function writeToSDCard(
  bootPath: string,
  config: PiSetupConfig,
  devicePackage?: DevicePackage,
  onProgress?: (progress: SDWriteProgress) => void
): Promise<SDWriteResult> {
  const result: SDWriteResult = {
    success: false,
    filesWritten: [],
    errors: [],
    bootPath,
  };

  const files: PiBootFile[] = [];
  const totalSteps = 6;
  let currentStep = 0;

  const reportProgress = (step: string, message: string) => {
    currentStep++;
    onProgress?.({
      step,
      current: currentStep,
      total: totalSteps,
      message,
    });
  };

  try {
    // Step 1: Verify boot partition
    reportProgress('verify', 'Verifying boot partition...');
    const isPiBoot = await isPiBootPartition(bootPath.charAt(0));
    if (!isPiBoot) {
      console.warn('[SDCard] Path may not be a Pi boot partition, proceeding anyway');
    }

    // Step 2: Generate SSH file
    reportProgress('ssh', 'Creating SSH enable file...');
    if (config.enableSsh) {
      files.push(generateSshFile());
    }

    // Step 3: Generate and hash password, create userconf
    reportProgress('userconf', 'Setting up user credentials...');
    if (config.username && config.password) {
      const hashedPassword = await hashPassword(config.password);
      files.push(generateUserconfFile(config.username, hashedPassword));
    }

    // Step 4: Generate WiFi config if needed
    reportProgress('wifi', 'Configuring network...');
    if (config.wifiSsid && config.wifiPassword) {
      files.push(generateWpaSupplicantFile(
        config.wifiSsid,
        config.wifiPassword,
        config.wifiCountry
      ));
    }

    // Step 5: Generate firstrun script
    reportProgress('firstrun', 'Creating first boot script...');
    files.push(generateFirstRunScript(config, devicePackage));

    // Step 6: Write all files
    reportProgress('write', 'Writing files to SD card...');
    for (const file of files) {
      const filePath = `${bootPath}\\${file.name}`;
      try {
        await writeFile(filePath, file.content);
        result.filesWritten.push(file.name);
        console.log(`[SDCard] Written: ${file.name}`);
      } catch (error) {
        result.errors.push(`Failed to write ${file.name}: ${error}`);
        console.error(`[SDCard] Failed to write ${file.name}:`, error);
      }
    }

    // Check for cmdline.txt to provide instructions
    const cmdlinePath = `${bootPath}\\cmdline.txt`;
    const cmdlineExists = await pathExists(cmdlinePath);
    if (cmdlineExists) {
      console.log('[SDCard] cmdline.txt found - user may need to edit it manually');
    }

    result.success = result.errors.length === 0;
    return result;

  } catch (error) {
    result.errors.push(`SD card write failed: ${error}`);
    return result;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Check if drive looks like a Pi boot partition based on label/size
 */
export function looksLikePiBootPartition(drive: DetectedDrive): boolean {
  const label = drive.label.toLowerCase();
  const isBootLabel = label.includes('boot') || label === 'bootfs';
  const isSmallSize = drive.size > 0 && drive.size < 1024 * 1024 * 1024; // < 1GB
  
  return isBootLabel || (drive.isRemovable && isSmallSize);
}

/**
 * Get drive display name
 */
export function getDriveDisplayName(drive: DetectedDrive): string {
  const size = formatBytes(drive.size);
  return `${drive.letter}: ${drive.label || 'Removable'} (${size})`;
}
