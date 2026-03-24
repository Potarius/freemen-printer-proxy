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
  type?: string;
}

export interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  account?: {
    id: string;
    name: string;
  };
  name_servers?: string[];
}

export interface CloudflareTunnel {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  account_tag?: string;
  connections?: CloudflareTunnelConnection[];
}

export interface CloudflareTunnelConnection {
  id: string;
  is_pending_reconnect: boolean;
  client_id: string;
  client_version: string;
  opened_at: string;
  origin_ip: string;
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

export interface CloudflareDNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied: boolean;
  ttl: number;
}

export interface CloudflareTokenStatus {
  id: string;
  status: 'active' | 'disabled' | 'expired';
  not_before?: string;
  expires_on?: string;
}

export interface CloudflareApiError {
  code: number;
  message: string;
  error_chain?: CloudflareApiError[];
}

export interface CloudflareApiResponse<T> {
  success: boolean;
  errors: CloudflareApiError[];
  messages: string[];
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
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
  size?: number;
  isExecutable?: boolean;
}

export interface ConfigPackage {
  deviceId: string;
  outputDir: string;
  files: GeneratedFile[];
}

// ============================================
// DEVICE PACKAGE TYPES
// ============================================

export interface DevicePackageConfig {
  deviceId: string;
  deviceName: string;
  platform: TargetPlatform;
  hostname: string;
  tunnelName: string;
  tunnelToken: string;
  tunnelId: string;
  accountId: string;
  zoneId: string;
  zoneName: string;
  servicePort: number;
  apiKey: string;
  printerIp?: string;
  printerPort?: number;
}

export interface DevicePackageFile {
  name: string;
  relativePath: string;
  description: string;
  content: string;
  size: number;
  isExecutable: boolean;
  category: 'config' | 'script' | 'docker' | 'docs';
}

export interface DevicePackage {
  id: string;
  createdAt: string;
  platform: TargetPlatform;
  outputPath: string;
  files: DevicePackageFile[];
  summary: DevicePackageSummary;
}

export interface DevicePackageSummary {
  deviceId: string;
  deviceName: string;
  platform: TargetPlatform;
  publicUrl: string;
  tunnelName: string;
  tunnelId: string;
  totalFiles: number;
  totalSize: number;
  deploymentSteps: string[];
}

// ============================================
// RASPBERRY PI SETUP TYPES
// ============================================

export interface PiSetupConfig {
  hostname: string;
  username: string;
  password: string;
  wifiSsid?: string;
  wifiPassword?: string;
  wifiCountry: string;
  enableSsh: boolean;
  timezone: string;
  locale: string;
  keyboardLayout: string;
}

export interface PiBootFile {
  name: string;
  path: string;
  description: string;
  content: string;
  required: boolean;
}

export interface PiSetupPackage {
  id: string;
  createdAt: string;
  config: PiSetupConfig;
  bootFiles: PiBootFile[];
  devicePackagePath?: string;
  sdCardPath?: string;
}

export interface DetectedDrive {
  letter: string;
  label: string;
  type: 'removable' | 'fixed' | 'unknown';
  size: number;
  freeSpace: number;
  isBootPartition: boolean;
}

export interface PiSetupStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  optional?: boolean;
}

// ============================================
// UBUNTU DEPLOYMENT TYPES
// ============================================

export type DeploymentMode = 'fresh' | 'update' | 'reprovision';

export interface DeploymentCommand {
  id: string;
  label: string;
  command: string;
  description: string;
  category: 'prerequisite' | 'setup' | 'deploy' | 'verify' | 'maintenance';
  optional?: boolean;
  dangerous?: boolean;
}

export interface DeploymentStep {
  id: string;
  title: string;
  description: string;
  commands: DeploymentCommand[];
  status: 'pending' | 'active' | 'completed' | 'skipped';
  estimatedTime?: string;
}

export interface UbuntuDeployConfig {
  targetHost: string;
  targetUser: string;
  installPath: string;
  deviceId?: string;
  tunnelToken?: string;
  apiKey?: string;
  printerIp?: string;
  printerPort?: number;
}

export interface DeploymentPackage {
  id: string;
  mode: DeploymentMode;
  config: UbuntuDeployConfig;
  steps: DeploymentStep[];
  commands: DeploymentCommand[];
  scripts: {
    name: string;
    description: string;
    content: string;
  }[];
  createdAt: string;
}

export interface DeploymentSummary {
  mode: DeploymentMode;
  targetHost: string;
  installPath: string;
  totalCommands: number;
  estimatedTime: string;
  hasCloudflare: boolean;
  hasPrinter: boolean;
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
