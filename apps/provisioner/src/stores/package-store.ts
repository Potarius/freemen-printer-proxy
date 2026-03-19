/**
 * Package Store
 * Manages device package generation state with Zustand
 */

import { create } from 'zustand';
import type {
  DevicePackage,
  DevicePackageConfig,
  DevicePackageFile,
  TargetPlatform,
} from '../types';
import { DevicePackageGenerator, getDevicePackageGenerator } from '../services/device-package-generator';
import { getFileOperationsService, type PackageWriteResult } from '../services/file-operations';

// ============================================
// TYPES
// ============================================

export interface PackageState {
  // Package data
  package: DevicePackage | null;
  
  // Write result
  writeResult: PackageWriteResult | null;
  
  // Status
  isGenerating: boolean;
  isWriting: boolean;
  error: string | null;
  
  // Actions
  generatePackage: (config: DevicePackageConfig) => DevicePackage;
  writePackage: () => Promise<PackageWriteResult | null>;
  downloadFile: (file: DevicePackageFile) => void;
  downloadPackage: () => Promise<void>;
  openOutputFolder: () => Promise<boolean>;
  copyDeploymentSteps: () => Promise<boolean>;
  copyToClipboard: (text: string) => Promise<boolean>;
  clearPackage: () => void;
  clearError: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  package: null,
  writeResult: null,
  isGenerating: false,
  isWriting: false,
  error: null,
};

// ============================================
// STORE
// ============================================

export const usePackageStore = create<PackageState>((set, get) => ({
  ...initialState,

  generatePackage: (config: DevicePackageConfig): DevicePackage => {
    set({ isGenerating: true, error: null });
    
    try {
      const generator = getDevicePackageGenerator();
      const pkg = generator.generatePackage(config);
      
      set({
        package: pkg,
        isGenerating: false,
      });
      
      return pkg;
    } catch (err) {
      set({
        error: `Failed to generate package: ${(err as Error).message}`,
        isGenerating: false,
      });
      throw err;
    }
  },

  writePackage: async (): Promise<PackageWriteResult | null> => {
    const { package: pkg } = get();
    if (!pkg) {
      set({ error: 'No package to write' });
      return null;
    }

    set({ isWriting: true, error: null });

    try {
      const fileOps = getFileOperationsService();
      const result = await fileOps.writePackage(pkg);
      
      set({
        writeResult: result,
        isWriting: false,
        error: result.success ? null : result.errors.join(', '),
      });
      
      return result;
    } catch (err) {
      set({
        error: `Failed to write package: ${(err as Error).message}`,
        isWriting: false,
      });
      return null;
    }
  },

  downloadFile: (file: DevicePackageFile): void => {
    try {
      const fileOps = getFileOperationsService();
      fileOps.downloadFile(file);
    } catch (err) {
      set({ error: `Failed to download file: ${(err as Error).message}` });
    }
  },

  downloadPackage: async (): Promise<void> => {
    const { package: pkg } = get();
    if (!pkg) {
      set({ error: 'No package to download' });
      return;
    }

    try {
      const fileOps = getFileOperationsService();
      await fileOps.downloadPackageAsZip(pkg);
    } catch (err) {
      set({ error: `Failed to download package: ${(err as Error).message}` });
    }
  },

  openOutputFolder: async (): Promise<boolean> => {
    const { writeResult } = get();
    if (!writeResult?.outputPath) {
      set({ error: 'No output folder to open' });
      return false;
    }

    try {
      const fileOps = getFileOperationsService();
      return await fileOps.openFolder(writeResult.outputPath);
    } catch (err) {
      set({ error: `Failed to open folder: ${(err as Error).message}` });
      return false;
    }
  },

  copyDeploymentSteps: async (): Promise<boolean> => {
    const { package: pkg } = get();
    if (!pkg) {
      set({ error: 'No package available' });
      return false;
    }

    const steps = pkg.summary.deploymentSteps.join('\n');
    return get().copyToClipboard(steps);
  },

  copyToClipboard: async (text: string): Promise<boolean> => {
    try {
      const fileOps = getFileOperationsService();
      return await fileOps.copyToClipboard(text);
    } catch {
      return false;
    }
  },

  clearPackage: () => {
    set(initialState);
  },

  clearError: () => {
    set({ error: null });
  },
}));

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create package config from wizard state
 */
export function createPackageConfig(
  deviceId: string,
  deviceName: string,
  platform: TargetPlatform,
  hostname: string,
  tunnelName: string,
  tunnelToken: string,
  tunnelId: string,
  accountId: string,
  zoneId: string,
  zoneName: string,
  printerIp?: string,
  printerPort?: number
): DevicePackageConfig {
  return {
    deviceId,
    deviceName,
    platform,
    hostname,
    tunnelName,
    tunnelToken,
    tunnelId,
    accountId,
    zoneId,
    zoneName,
    servicePort: 6500,
    printerIp,
    printerPort,
  };
}
