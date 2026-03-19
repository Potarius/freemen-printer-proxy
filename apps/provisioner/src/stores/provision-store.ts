/**
 * Provision Store
 * Zustand store for provisioning wizard state
 */

import { create } from 'zustand';
import type { 
  CloudflareAccount, 
  CloudflareZone, 
  CloudflareTunnel,
  TargetPlatform,
  WizardStep,
  ConfigPackage
} from '../types';

interface ProvisionState {
  // Wizard navigation
  currentStep: number;
  steps: WizardStep[];
  
  // Form data
  apiToken: string;
  selectedAccount: CloudflareAccount | null;
  selectedZone: CloudflareZone | null;
  deviceName: string;
  hostname: string;
  targetPlatform: TargetPlatform;
  
  // Results
  tunnel: CloudflareTunnel | null;
  tunnelToken: string | null;
  configPackage: ConfigPackage | null;
  
  // Status
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setApiToken: (token: string) => void;
  setSelectedAccount: (account: CloudflareAccount | null) => void;
  setSelectedZone: (zone: CloudflareZone | null) => void;
  setDeviceName: (name: string) => void;
  setHostname: (hostname: string) => void;
  setTargetPlatform: (platform: TargetPlatform) => void;
  setTunnel: (tunnel: CloudflareTunnel | null) => void;
  setTunnelToken: (token: string | null) => void;
  setConfigPackage: (pkg: ConfigPackage | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateStepStatus: (stepIndex: number, status: WizardStep['status']) => void;
  reset: () => void;
}

const DEFAULT_STEPS: WizardStep[] = [
  { id: 'auth', title: 'Authentication', description: 'Connect to Cloudflare', status: 'active' },
  { id: 'account', title: 'Account', description: 'Select account', status: 'pending' },
  { id: 'zone', title: 'Domain', description: 'Choose domain', status: 'pending' },
  { id: 'device', title: 'Device', description: 'Configure device', status: 'pending' },
  { id: 'tunnel', title: 'Tunnel', description: 'Create tunnel', status: 'pending' },
  { id: 'complete', title: 'Complete', description: 'Download config', status: 'pending' },
];

const initialState = {
  currentStep: 0,
  steps: DEFAULT_STEPS,
  apiToken: '',
  selectedAccount: null,
  selectedZone: null,
  deviceName: '',
  hostname: '',
  targetPlatform: 'raspberry-pi' as TargetPlatform,
  tunnel: null,
  tunnelToken: null,
  configPackage: null,
  isLoading: false,
  error: null,
};

export const useProvisionStore = create<ProvisionState>((set, get) => ({
  ...initialState,

  setStep: (step) => {
    const { steps } = get();
    const newSteps = steps.map((s, i) => ({
      ...s,
      status: i < step ? 'completed' : i === step ? 'active' : 'pending',
    })) as WizardStep[];
    set({ currentStep: step, steps: newSteps });
  },

  nextStep: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      const newSteps = [...steps];
      newSteps[currentStep] = { ...newSteps[currentStep], status: 'completed' };
      newSteps[currentStep + 1] = { ...newSteps[currentStep + 1], status: 'active' };
      set({ currentStep: currentStep + 1, steps: newSteps });
    }
  },

  prevStep: () => {
    const { currentStep, steps } = get();
    if (currentStep > 0) {
      const newSteps = [...steps];
      newSteps[currentStep] = { ...newSteps[currentStep], status: 'pending' };
      newSteps[currentStep - 1] = { ...newSteps[currentStep - 1], status: 'active' };
      set({ currentStep: currentStep - 1, steps: newSteps });
    }
  },

  setApiToken: (apiToken) => set({ apiToken }),
  setSelectedAccount: (selectedAccount) => set({ selectedAccount }),
  setSelectedZone: (selectedZone) => set({ selectedZone }),
  setDeviceName: (deviceName) => set({ deviceName }),
  setHostname: (hostname) => set({ hostname }),
  setTargetPlatform: (targetPlatform) => set({ targetPlatform }),
  setTunnel: (tunnel) => set({ tunnel }),
  setTunnelToken: (tunnelToken) => set({ tunnelToken }),
  setConfigPackage: (configPackage) => set({ configPackage }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  updateStepStatus: (stepIndex, status) => {
    const { steps } = get();
    const newSteps = [...steps];
    newSteps[stepIndex] = { ...newSteps[stepIndex], status };
    set({ steps: newSteps });
  },

  reset: () => set(initialState),
}));
