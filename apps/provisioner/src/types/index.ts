/**
 * Core types for Freemen Provisioner
 */

// ============================================
// DEVICE TYPES
// ============================================

export type TargetPlatform = 'raspberry-pi' | 'linux' | 'windows';

export interface DeviceConfig {
  id: string;
  name: string;
  platform: TargetPlatform;
  createdAt: string;
}

export interface DeviceProvisionResult {
  device: DeviceConfig;
  cloudflare: CloudflareTunnelConfig;
  files: GeneratedFile[];
}

// ============================================
// CLOUDFLARE TYPES
// ============================================

export interface CloudflareAccount {
  id: string;
  name: string;
}

export interface CloudflareZone {
  id: string;
  name: string;
  status: string;
}

export interface CloudflareTunnel {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export interface CloudflareTunnelConfig {
  accountId: string;
  zoneId: string;
  zoneName: string;
  tunnel: {
    id: string;
    name: string;
    token: string;
  };
  hostname: string;
}

// ============================================
// WIZARD TYPES
// ============================================

export type WizardStepStatus = 'pending' | 'active' | 'completed' | 'error';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  status: WizardStepStatus;
}

export interface ProvisionWizardState {
  currentStep: number;
  steps: WizardStep[];
  // Step data
  apiToken: string | null;
  selectedAccount: CloudflareAccount | null;
  selectedZone: CloudflareZone | null;
  deviceName: string;
  hostname: string;
  targetPlatform: TargetPlatform;
  // Results
  tunnel: CloudflareTunnel | null;
  tunnelToken: string | null;
}

// ============================================
// FILE GENERATION TYPES
// ============================================

export interface GeneratedFile {
  name: string;
  path: string;
  description: string;
  content?: string;
}

export interface ConfigPackage {
  deviceId: string;
  outputDir: string;
  files: GeneratedFile[];
}

// ============================================
// UI TYPES
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  outputDirectory: string;
  rememberToken: boolean;
}
