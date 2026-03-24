/**
 * Ubuntu Deployment Store
 * Manages Ubuntu/Linux deployment state with Zustand
 */

import { create } from 'zustand';
import type {
  DeploymentMode,
  DeploymentPackage,
  DeploymentSummary,
  UbuntuDeployConfig,
} from '../types';
import {
  getUbuntuDeploymentService,
  DEFAULT_DEPLOY_CONFIG,
} from '../services/ubuntu-deployment-service';

// ============================================
// TYPES
// ============================================

export interface UbuntuDeployState {
  // Mode selection
  mode: DeploymentMode | null;
  
  // Configuration
  config: UbuntuDeployConfig;
  
  // Generated package
  deploymentPackage: DeploymentPackage | null;
  
  // Wizard state
  currentStep: number;
  
  // Copied commands tracking
  copiedCommands: Set<string>;
  
  // Status
  isGenerating: boolean;
  error: string | null;
  
  // Actions
  setMode: (mode: DeploymentMode) => void;
  setConfig: (config: Partial<UbuntuDeployConfig>) => void;
  setTargetHost: (host: string) => void;
  setTargetUser: (user: string) => void;
  setInstallPath: (path: string) => void;
  setDeviceId: (deviceId: string) => void;
  setTunnelToken: (token: string) => void;
  setApiKey: (apiKey: string) => void;
  setPrinterConfig: (ip: string, port: number) => void;
  
  generatePackage: () => DeploymentPackage | null;
  getSummary: () => DeploymentSummary | null;
  
  markCommandCopied: (commandId: string) => void;
  copyAllCommands: () => string;
  copyStepCommands: (stepId: string) => string;
  downloadScript: (scriptName: string) => void;
  
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  
  clearError: () => void;
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  mode: null as DeploymentMode | null,
  config: { ...DEFAULT_DEPLOY_CONFIG },
  deploymentPackage: null as DeploymentPackage | null,
  currentStep: 0,
  copiedCommands: new Set<string>(),
  isGenerating: false,
  error: null as string | null,
};

// ============================================
// STORE
// ============================================

export const useUbuntuDeployStore = create<UbuntuDeployState>((set, get) => ({
  ...initialState,

  setMode: (mode: DeploymentMode) => {
    set({ mode, currentStep: 1 });
  },

  setConfig: (partialConfig: Partial<UbuntuDeployConfig>) => {
    set((state) => ({
      config: { ...state.config, ...partialConfig },
    }));
  },

  setTargetHost: (host: string) => {
    set((state) => ({
      config: { ...state.config, targetHost: host },
    }));
  },

  setTargetUser: (user: string) => {
    set((state) => ({
      config: { ...state.config, targetUser: user },
    }));
  },

  setInstallPath: (path: string) => {
    set((state) => ({
      config: { ...state.config, installPath: path },
    }));
  },

  setDeviceId: (deviceId: string) => {
    set((state) => ({
      config: { ...state.config, deviceId },
    }));
  },

  setTunnelToken: (token: string) => {
    set((state) => ({
      config: { ...state.config, tunnelToken: token },
    }));
  },

  setApiKey: (apiKey: string) => {
    set((state) => ({
      config: { ...state.config, apiKey },
    }));
  },

  setPrinterConfig: (ip: string, port: number) => {
    set((state) => ({
      config: { ...state.config, printerIp: ip, printerPort: port },
    }));
  },

  generatePackage: (): DeploymentPackage | null => {
    const { mode, config } = get();
    if (!mode) {
      set({ error: 'Please select a deployment mode' });
      return null;
    }

    set({ isGenerating: true, error: null });

    try {
      const service = getUbuntuDeploymentService();
      const deploymentPackage = service.generatePackage(mode, config);
      
      set({
        deploymentPackage,
        isGenerating: false,
      });
      
      return deploymentPackage;
    } catch (err) {
      set({
        error: `Failed to generate package: ${(err as Error).message}`,
        isGenerating: false,
      });
      return null;
    }
  },

  getSummary: (): DeploymentSummary | null => {
    const { mode, config } = get();
    if (!mode) return null;
    
    const service = getUbuntuDeploymentService();
    return service.generateSummary(mode, config);
  },

  markCommandCopied: (commandId: string) => {
    set((state) => {
      const newSet = new Set(state.copiedCommands);
      newSet.add(commandId);
      return { copiedCommands: newSet };
    });
  },

  copyAllCommands: (): string => {
    const { deploymentPackage } = get();
    if (!deploymentPackage) return '';

    const commands = deploymentPackage.steps
      .flatMap(step => [
        `# ${step.title}`,
        ...step.commands.map(cmd => cmd.command),
        '',
      ])
      .join('\n');

    // Mark all as copied
    const allIds = deploymentPackage.commands.map(c => c.id);
    set((state) => ({
      copiedCommands: new Set([...state.copiedCommands, ...allIds]),
    }));

    return commands;
  },

  copyStepCommands: (stepId: string): string => {
    const { deploymentPackage } = get();
    if (!deploymentPackage) return '';

    const step = deploymentPackage.steps.find(s => s.id === stepId);
    if (!step) return '';

    const commands = step.commands.map(cmd => cmd.command).join('\n');

    // Mark step commands as copied
    const stepIds = step.commands.map(c => c.id);
    set((state) => ({
      copiedCommands: new Set([...state.copiedCommands, ...stepIds]),
    }));

    return commands;
  },

  downloadScript: (scriptName: string) => {
    const { deploymentPackage } = get();
    if (!deploymentPackage) return;

    const script = deploymentPackage.scripts.find(s => s.name === scriptName);
    if (!script) return;

    try {
      const blob = new Blob([script.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = script.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      set({ error: `Failed to download script: ${(err as Error).message}` });
    }
  },

  nextStep: () => {
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 4),
    }));
  },

  prevStep: () => {
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    }));
  },

  goToStep: (step: number) => {
    set({ currentStep: Math.max(0, Math.min(step, 4)) });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      ...initialState,
      copiedCommands: new Set<string>(),
    });
  },
}));

// ============================================
// STEP DEFINITIONS
// ============================================

export const UBUNTU_DEPLOY_STEPS = [
  {
    id: 'mode',
    title: 'Select Mode',
    description: 'Choose deployment type',
  },
  {
    id: 'config',
    title: 'Configure',
    description: 'Set target and options',
  },
  {
    id: 'commands',
    title: 'Commands',
    description: 'Review deployment steps',
  },
  {
    id: 'deploy',
    title: 'Deploy',
    description: 'Execute deployment',
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'Verify and finish',
  },
];
