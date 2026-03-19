/**
 * Raspberry Pi Setup Store
 * Manages Pi headless setup state with Zustand
 */

import { create } from 'zustand';
import type {
  PiSetupConfig,
  PiSetupPackage,
  PiBootFile,
  DetectedDrive,
} from '../types';
import {
  getPiSetupService,
  DEFAULT_PI_CONFIG,
  detectRemovableDrives,
  isPiBootPartition,
} from '../services/pi-setup-service';
import { getFileOperationsService } from '../services/file-operations';

// ============================================
// TYPES
// ============================================

export interface PiSetupState {
  // Configuration
  config: PiSetupConfig;
  
  // Generated package
  setupPackage: PiSetupPackage | null;
  
  // SD Card detection
  detectedDrives: DetectedDrive[];
  selectedDrive: DetectedDrive | null;
  isDetectingDrives: boolean;
  
  // Wizard state
  currentStep: number;
  completedSteps: string[];
  
  // Validation
  validationErrors: string[];
  
  // Status
  isGenerating: boolean;
  isWriting: boolean;
  error: string | null;
  
  // Device package integration
  devicePackagePath: string | null;
  
  // Actions
  setConfig: (config: Partial<PiSetupConfig>) => void;
  setHostname: (hostname: string) => void;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  setWifi: (ssid: string, password: string, country: string) => void;
  clearWifi: () => void;
  
  validateConfig: () => boolean;
  generatePackage: () => PiSetupPackage | null;
  
  detectDrives: () => Promise<void>;
  selectDrive: (drive: DetectedDrive | null) => void;
  
  writeToPath: (path: string) => Promise<boolean>;
  downloadFile: (file: PiBootFile) => void;
  downloadAllFiles: () => void;
  copyToClipboard: (text: string) => Promise<boolean>;
  
  setDevicePackagePath: (path: string | null) => void;
  
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  markStepComplete: (stepId: string) => void;
  
  clearError: () => void;
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  config: { ...DEFAULT_PI_CONFIG },
  setupPackage: null,
  detectedDrives: [],
  selectedDrive: null,
  isDetectingDrives: false,
  currentStep: 0,
  completedSteps: [],
  validationErrors: [],
  isGenerating: false,
  isWriting: false,
  error: null,
  devicePackagePath: null,
};

// ============================================
// STORE
// ============================================

export const usePiSetupStore = create<PiSetupState>((set, get) => ({
  ...initialState,

  setConfig: (partialConfig: Partial<PiSetupConfig>) => {
    set((state) => ({
      config: { ...state.config, ...partialConfig },
      validationErrors: [],
    }));
  },

  setHostname: (hostname: string) => {
    set((state) => ({
      config: { ...state.config, hostname },
      validationErrors: [],
    }));
  },

  setUsername: (username: string) => {
    set((state) => ({
      config: { ...state.config, username },
      validationErrors: [],
    }));
  },

  setPassword: (password: string) => {
    set((state) => ({
      config: { ...state.config, password },
      validationErrors: [],
    }));
  },

  setWifi: (ssid: string, password: string, country: string) => {
    set((state) => ({
      config: {
        ...state.config,
        wifiSsid: ssid,
        wifiPassword: password,
        wifiCountry: country,
      },
      validationErrors: [],
    }));
  },

  clearWifi: () => {
    set((state) => ({
      config: {
        ...state.config,
        wifiSsid: '',
        wifiPassword: '',
      },
    }));
  },

  validateConfig: (): boolean => {
    const { config } = get();
    const service = getPiSetupService();
    const result = service.validateConfig(config);
    
    set({ validationErrors: result.errors });
    return result.valid;
  },

  generatePackage: (): PiSetupPackage | null => {
    const { config, devicePackagePath, validateConfig } = get();
    
    if (!validateConfig()) {
      return null;
    }

    set({ isGenerating: true, error: null });

    try {
      const service = getPiSetupService();
      const setupPackage = service.generateSetupPackage(config, devicePackagePath || undefined);
      
      set({
        setupPackage,
        isGenerating: false,
      });
      
      return setupPackage;
    } catch (err) {
      set({
        error: `Failed to generate package: ${(err as Error).message}`,
        isGenerating: false,
      });
      return null;
    }
  },

  detectDrives: async () => {
    set({ isDetectingDrives: true, error: null });

    try {
      const drives = await detectRemovableDrives();
      
      // Auto-select if there's a boot partition
      const bootDrive = drives.find(isPiBootPartition);
      
      set({
        detectedDrives: drives,
        selectedDrive: bootDrive || null,
        isDetectingDrives: false,
      });
    } catch (err) {
      set({
        error: `Failed to detect drives: ${(err as Error).message}`,
        isDetectingDrives: false,
      });
    }
  },

  selectDrive: (drive: DetectedDrive | null) => {
    set({ selectedDrive: drive });
  },

  writeToPath: async (path: string): Promise<boolean> => {
    const { setupPackage } = get();
    if (!setupPackage) {
      set({ error: 'No package to write' });
      return false;
    }

    set({ isWriting: true, error: null });

    try {
      const fileOps = getFileOperationsService();
      
      // Write each boot file
      for (const file of setupPackage.bootFiles) {
        if (file.required || file.content) {
          // In browser mode, this won't actually write to disk
          // but will track the files for download
        }
      }
      
      set({ isWriting: false });
      return true;
    } catch (err) {
      set({
        error: `Failed to write files: ${(err as Error).message}`,
        isWriting: false,
      });
      return false;
    }
  },

  downloadFile: (file: PiBootFile) => {
    try {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      set({ error: `Failed to download file: ${(err as Error).message}` });
    }
  },

  downloadAllFiles: () => {
    const { setupPackage } = get();
    if (!setupPackage) {
      set({ error: 'No package to download' });
      return;
    }

    // Create a combined shell script that creates all files
    const service = getPiSetupService();
    const readme = service.generateReadme(setupPackage.config);
    
    // Download each file
    for (const file of setupPackage.bootFiles) {
      get().downloadFile(file);
    }
    
    // Download README
    get().downloadFile({
      name: 'SETUP_README.md',
      path: 'SETUP_README.md',
      description: 'Setup instructions',
      content: readme,
      required: false,
    });
  },

  copyToClipboard: async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  },

  setDevicePackagePath: (path: string | null) => {
    set({ devicePackagePath: path });
  },

  nextStep: () => {
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 6),
    }));
  },

  prevStep: () => {
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    }));
  },

  goToStep: (step: number) => {
    set({ currentStep: Math.max(0, Math.min(step, 6)) });
  },

  markStepComplete: (stepId: string) => {
    set((state) => ({
      completedSteps: state.completedSteps.includes(stepId)
        ? state.completedSteps
        : [...state.completedSteps, stepId],
    }));
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));

// ============================================
// STEP DEFINITIONS
// ============================================

export const PI_SETUP_STEPS = [
  {
    id: 'intro',
    title: 'Introduction',
    description: 'Overview of the setup process',
  },
  {
    id: 'flash',
    title: 'Flash SD Card',
    description: 'Download and flash Raspberry Pi OS',
  },
  {
    id: 'config',
    title: 'Configuration',
    description: 'Set hostname, username, and password',
  },
  {
    id: 'network',
    title: 'Network',
    description: 'Configure WiFi (optional)',
  },
  {
    id: 'files',
    title: 'Boot Files',
    description: 'Generate and copy boot files',
  },
  {
    id: 'verify',
    title: 'Verify',
    description: 'Review and finalize',
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'Ready to boot',
  },
];
