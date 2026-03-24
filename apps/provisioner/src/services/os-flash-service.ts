/**
 * OS Flash Service
 * Wraps Tauri commands for downloading Raspberry Pi OS and flashing it
 * raw to a physical disk (SD card).
 */

import { invoke } from '@tauri-apps/api/tauri';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

// ============================================
// TYPES
// ============================================

export interface PhysicalDisk {
  number: number;
  friendlyName: string;
  size: number;
  busType: string;
  isRemovable: boolean;
  status: string;
}

export interface DownloadProgress {
  downloaded: number;
  total: number;
  percent: number;
}

export interface FlashProgress {
  compressedRead: number;
  compressedTotal: number;
  written: number;
  percent: number;
}

// ============================================
// OS CATALOGUE
// ============================================

export interface OsOption {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  tags: string[];
  url: string;
  filename: string;
  approxCompressedMb: number;
  approxWrittenGb: number;
  recommended?: boolean;
  /** 'pi' = red/pink icon, 'ubuntu' = orange icon */
  variant: 'pi' | 'ubuntu';
}

export const OS_OPTIONS: OsOption[] = [
  {
    id: 'pi-os-lite-64',
    name: 'Raspberry Pi OS Lite',
    subtitle: '64-bit · Headless',
    description:
      'Minimal image with no desktop. Optimised for servers and IoT. The recommended choice for Freemen Printer Proxy.',
    tags: ['ARM64', 'Bookworm', 'Headless'],
    url: 'https://downloads.raspberrypi.com/raspios_lite_arm64_latest',
    filename: 'pi-os-lite-arm64.img.xz',
    approxCompressedMb: 500,
    approxWrittenGb: 2.7,
    recommended: true,
    variant: 'pi',
  },
  {
    id: 'ubuntu-server-2404',
    name: 'Ubuntu Server 24.04 LTS',
    subtitle: '64-bit · Noble Numbat',
    description:
      'Latest Ubuntu LTS release. Enterprise-grade stability with 5 years of security updates.',
    tags: ['ARM64', 'Noble', 'Server', 'LTS'],
    url: 'https://cdimage.ubuntu.com/releases/24.04/release/ubuntu-24.04.2-preinstalled-server-arm64+raspi.img.xz',
    filename: 'ubuntu-server-24.04-arm64.img.xz',
    approxCompressedMb: 1000,
    approxWrittenGb: 3.5,
    variant: 'ubuntu',
  },
  {
    id: 'ubuntu-server-2204',
    name: 'Ubuntu Server 22.04 LTS',
    subtitle: '64-bit · Jammy Jellyfish',
    description:
      'Battle-tested Ubuntu LTS. Wide hardware support and extended security maintenance until 2027.',
    tags: ['ARM64', 'Jammy', 'Server', 'LTS'],
    url: 'https://cdimage.ubuntu.com/releases/22.04.5/release/ubuntu-22.04.5-preinstalled-server-arm64+raspi.img.xz',
    filename: 'ubuntu-server-22.04-arm64.img.xz',
    approxCompressedMb: 900,
    approxWrittenGb: 3.2,
    variant: 'ubuntu',
  },
  {
    id: 'pi-os-desktop-64',
    name: 'Raspberry Pi OS Desktop',
    subtitle: '64-bit · With GUI',
    description:
      'Full desktop environment with graphical interface. Use this if you will connect a monitor and keyboard.',
    tags: ['ARM64', 'Bookworm', 'Desktop'],
    url: 'https://downloads.raspberrypi.com/raspios_arm64_latest',
    filename: 'pi-os-desktop-arm64.img.xz',
    approxCompressedMb: 1100,
    approxWrittenGb: 4.0,
    variant: 'pi',
  },
];

/** Kept for backward compatibility */
export const PI_OS_URL = OS_OPTIONS[0].url;
export const PI_OS_FILENAME = OS_OPTIONS[0].filename;
export const PI_OS_APPROX_BYTES = OS_OPTIONS[0].approxCompressedMb * 1024 * 1024;

// ============================================
// TAURI DETECTION
// ============================================

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

// ============================================
// COMMANDS
// ============================================

/**
 * Returns the temp directory path where images are downloaded.
 * Creates it if it doesn't exist.
 */
export async function getDownloadPath(): Promise<string> {
  return invoke<string>('get_download_path');
}

/**
 * List physical disks on this machine (Windows, requires admin).
 */
export async function listPhysicalDisks(): Promise<PhysicalDisk[]> {
  const raw = await invoke<Array<{
    number: number;
    friendly_name: string;
    size: number;
    bus_type: string;
    is_removable: boolean;
    status: string;
  }>>('list_physical_disks');

  return raw.map((d) => ({
    number: d.number,
    friendlyName: d.friendly_name,
    size: d.size,
    busType: d.bus_type,
    isRemovable: d.is_removable,
    status: d.status,
  }));
}

/**
 * Start a streaming download of the OS image.
 * Progress is delivered via the 'download-progress' Tauri event.
 * Rejects with "cancelled" if cancelled.
 */
export async function downloadOsImage(
  url: string,
  destPath: string,
): Promise<void> {
  return invoke('download_image', { url, destPath });
}

/**
 * Subscribe to download progress events.
 * Returns an unsubscribe function.
 */
export function onDownloadProgress(
  callback: (p: DownloadProgress) => void,
): Promise<UnlistenFn> {
  return listen<{ downloaded: number; total: number; percent: number }>(
    'download-progress',
    (event) => {
      callback({
        downloaded: event.payload.downloaded,
        total: event.payload.total,
        percent: event.payload.percent,
      });
    },
  );
}

/**
 * Take a physical disk offline so we can write to it exclusively.
 * Requires Administrator. Throws on failure.
 */
export async function prepareDiskForFlash(diskNumber: number): Promise<void> {
  return invoke('prepare_disk_for_flash', { diskNumber });
}

/**
 * Decompress the .img.xz file and stream it raw to the given physical disk.
 * Progress is delivered via the 'flash-progress' Tauri event.
 * Rejects with "cancelled" if cancelled.
 */
export async function flashImageToDisk(
  imagePath: string,
  diskNumber: number,
): Promise<void> {
  return invoke('flash_image_to_disk', { imagePath, diskNumber });
}

/**
 * Subscribe to flash progress events.
 * Returns an unsubscribe function.
 */
export function onFlashProgress(
  callback: (p: FlashProgress) => void,
): Promise<UnlistenFn> {
  return listen<{
    compressed_read: number;
    compressed_total: number;
    written: number;
    percent: number;
  }>('flash-progress', (event) => {
    callback({
      compressedRead: event.payload.compressed_read,
      compressedTotal: event.payload.compressed_total,
      written: event.payload.written,
      percent: event.payload.percent,
    });
  });
}

/**
 * Bring a physical disk back online after flashing.
 */
export async function restoreDisk(diskNumber: number): Promise<void> {
  return invoke('restore_disk', { diskNumber });
}

/**
 * Cancel the active download or flash operation.
 */
export function cancelOperation(): void {
  invoke('cancel_operation').catch(console.error);
}

// ============================================
// UTILITIES
// ============================================

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatSpeed(bytesPerSec: number): string {
  return formatBytes(bytesPerSec) + '/s';
}

/**
 * Whether a disk looks like an SD card / USB flash drive based on bus type and size.
 */
/**
 * Check whether an OS image has already been downloaded at the given path.
 */
export async function imageExists(destPath: string): Promise<boolean> {
  return invoke<boolean>('path_exists', { path: destPath });
}

export function looksLikeSdCard(disk: PhysicalDisk): boolean {
  const bus = disk.busType.toUpperCase();
  const isUsb = bus === 'USB' || bus === 'SD' || bus === 'MMC';
  const isSmall = disk.size > 0 && disk.size < 512 * 1024 * 1024 * 1024; // < 512 GB
  return disk.isRemovable || (isUsb && isSmall);
}
