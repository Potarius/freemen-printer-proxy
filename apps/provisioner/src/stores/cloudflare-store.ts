/**
 * Cloudflare State Store
 * Manages Cloudflare API state with Zustand
 */

import { create } from 'zustand';
import type {
  CloudflareAccount,
  CloudflareZone,
  CloudflareTunnel,
  CloudflareTokenStatus,
  CloudflareDNSRecord,
} from '../types';
import {
  createCloudflareService,
  clearCloudflareService,
  CloudflareApiException,
  NetworkException,
  isValidTokenFormat,
  type ICloudflareService,
  type TunnelValidationResult,
  type DNSValidationResult,
} from '../services/cloudflare';

// ============================================
// TYPES
// ============================================

export interface CloudflareError {
  message: string;
  code?: number;
  isNetwork?: boolean;
}

export interface CloudflareState {
  // Service
  service: ICloudflareService | null;
  
  // Auth
  apiToken: string;
  tokenStatus: CloudflareTokenStatus | null;
  isTokenValidated: boolean;
  
  // Data
  accounts: CloudflareAccount[];
  zones: CloudflareZone[];
  selectedAccount: CloudflareAccount | null;
  selectedZone: CloudflareZone | null;
  
  // Tunnel
  tunnel: CloudflareTunnel | null;
  tunnelToken: string | null;
  dnsRecord: CloudflareDNSRecord | null;
  
  // Pre-creation validation
  tunnelNameValidation: TunnelValidationResult | null;
  hostnameValidation: DNSValidationResult | null;
  isValidatingTunnelName: boolean;
  isValidatingHostname: boolean;
  useExistingTunnel: boolean;
  
  // Loading states
  isValidatingToken: boolean;
  isLoadingAccounts: boolean;
  isLoadingZones: boolean;
  isCreatingTunnel: boolean;
  isCreatingDNS: boolean;
  isConfiguringIngress: boolean;
  
  // Errors
  error: CloudflareError | null;
  
  // Actions
  setApiToken: (token: string) => void;
  validateToken: () => Promise<boolean>;
  loadAccounts: () => Promise<void>;
  loadZones: (accountId?: string) => Promise<void>;
  selectAccount: (account: CloudflareAccount | null) => void;
  selectZone: (zone: CloudflareZone | null) => void;
  createTunnel: (name: string) => Promise<CloudflareTunnel | null>;
  createDNSRecord: (subdomain: string) => Promise<CloudflareDNSRecord | null>;
  configureTunnelIngress: (hostname: string, serviceUrl: string) => Promise<boolean>;
  getTunnelToken: () => Promise<string | null>;
  clearError: () => void;
  reset: () => void;
  
  // Validation actions
  validateTunnelName: (name: string) => Promise<TunnelValidationResult>;
  validateHostname: (hostname: string) => Promise<DNSValidationResult>;
  setUseExistingTunnel: (useExisting: boolean) => void;
  clearTunnelValidation: () => void;
  clearHostnameValidation: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  service: null,
  apiToken: '',
  tokenStatus: null,
  isTokenValidated: false,
  accounts: [],
  zones: [],
  selectedAccount: null,
  selectedZone: null,
  tunnel: null,
  tunnelToken: null,
  dnsRecord: null,
  tunnelNameValidation: null,
  hostnameValidation: null,
  isValidatingTunnelName: false,
  isValidatingHostname: false,
  useExistingTunnel: false,
  isValidatingToken: false,
  isLoadingAccounts: false,
  isLoadingZones: false,
  isCreatingTunnel: false,
  isCreatingDNS: false,
  isConfiguringIngress: false,
  error: null,
};

// ============================================
// STORE
// ============================================

export const useCloudflareStore = create<CloudflareState>((set, get) => ({
  ...initialState,

  setApiToken: (token: string) => {
    set({ apiToken: token, error: null });
  },

  validateToken: async (): Promise<boolean> => {
    const { apiToken } = get();
    
    // Basic format validation
    if (!isValidTokenFormat(apiToken)) {
      set({
        error: { message: 'Invalid token format. Cloudflare API tokens are typically 40+ characters.' },
        isTokenValidated: false,
      });
      return false;
    }

    set({ isValidatingToken: true, error: null });

    try {
      // Create service with the token
      const service = createCloudflareService(apiToken);
      
      // Verify the token
      const tokenStatus = await service.verifyToken();
      
      if (tokenStatus.status !== 'active') {
        set({
          error: { message: `Token is ${tokenStatus.status}. Please use an active API token.` },
          isValidatingToken: false,
          isTokenValidated: false,
        });
        return false;
      }

      // Token is valid - load accounts and zones
      set({
        service,
        tokenStatus,
        isTokenValidated: true,
        isValidatingToken: false,
      });

      // Pre-load accounts and zones
      await get().loadAccounts();
      await get().loadZones();

      return true;
    } catch (error) {
      const cfError = handleError(error);
      set({
        error: cfError,
        isValidatingToken: false,
        isTokenValidated: false,
        service: null,
      });
      clearCloudflareService();
      return false;
    }
  },

  loadAccounts: async () => {
    const { service } = get();
    if (!service) return;

    set({ isLoadingAccounts: true, error: null });

    try {
      const accounts = await service.getAccounts();
      set({
        accounts,
        isLoadingAccounts: false,
        // Auto-select if only one account
        selectedAccount: accounts.length === 1 ? accounts[0] : null,
      });
    } catch (error) {
      set({
        error: handleError(error),
        isLoadingAccounts: false,
      });
    }
  },

  loadZones: async (accountId?: string) => {
    const { service } = get();
    if (!service) return;

    set({ isLoadingZones: true, error: null });

    try {
      const zones = await service.getZones(accountId);
      set({
        zones,
        isLoadingZones: false,
      });
    } catch (error) {
      set({
        error: handleError(error),
        isLoadingZones: false,
      });
    }
  },

  selectAccount: (account: CloudflareAccount | null) => {
    set({ selectedAccount: account, selectedZone: null });
    if (account) {
      get().loadZones(account.id);
    }
  },

  selectZone: (zone: CloudflareZone | null) => {
    set({ selectedZone: zone });
  },

  createTunnel: async (name: string): Promise<CloudflareTunnel | null> => {
    const { service, selectedAccount } = get();
    if (!service || !selectedAccount) {
      set({ error: { message: 'No account selected' } });
      return null;
    }

    set({ isCreatingTunnel: true, error: null });

    try {
      const tunnel = await service.createTunnel(selectedAccount.id, name);
      set({
        tunnel,
        isCreatingTunnel: false,
      });
      return tunnel;
    } catch (error) {
      const cfError = handleError(error);
      set({
        error: cfError,
        isCreatingTunnel: false,
      });
      return null;
    }
  },

  createDNSRecord: async (subdomain: string): Promise<CloudflareDNSRecord | null> => {
    const { service, selectedZone, tunnel } = get();
    if (!service || !selectedZone || !tunnel) {
      set({ error: { message: 'Missing zone or tunnel' } });
      return null;
    }

    set({ isCreatingDNS: true, error: null });

    try {
      const dnsRecord = await service.createDNSRecord(
        selectedZone.id,
        subdomain,
        tunnel.id
      );
      set({
        dnsRecord,
        isCreatingDNS: false,
      });
      return dnsRecord;
    } catch (error) {
      set({
        error: handleError(error),
        isCreatingDNS: false,
      });
      return null;
    }
  },

  configureTunnelIngress: async (hostname: string, serviceUrl: string): Promise<boolean> => {
    const { service, selectedAccount, tunnel } = get();
    if (!service || !selectedAccount || !tunnel) {
      set({ error: { message: 'Missing account or tunnel' } });
      return false;
    }

    set({ isConfiguringIngress: true, error: null });

    try {
      await service.configureTunnelIngress(
        selectedAccount.id,
        tunnel.id,
        hostname,
        serviceUrl
      );
      set({ isConfiguringIngress: false });
      return true;
    } catch (error) {
      set({
        error: handleError(error),
        isConfiguringIngress: false,
      });
      return false;
    }
  },

  getTunnelToken: async (): Promise<string | null> => {
    const { service, selectedAccount, tunnel } = get();
    if (!service || !selectedAccount || !tunnel) {
      set({ error: { message: 'Missing account or tunnel' } });
      return null;
    }

    try {
      const tunnelToken = await service.getTunnelToken(selectedAccount.id, tunnel.id);
      set({ tunnelToken });
      return tunnelToken;
    } catch (error) {
      set({ error: handleError(error) });
      return null;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    clearCloudflareService();
    set(initialState);
  },

  // ============================================
  // VALIDATION ACTIONS
  // ============================================

  validateTunnelName: async (name: string): Promise<TunnelValidationResult> => {
    const { service, selectedAccount } = get();
    
    if (!service || !selectedAccount) {
      const result: TunnelValidationResult = {
        status: 'error',
        message: 'No account selected',
      };
      set({ tunnelNameValidation: result });
      return result;
    }

    set({ isValidatingTunnelName: true, tunnelNameValidation: null });

    try {
      const result = await service.checkTunnelNameExists(selectedAccount.id, name);
      set({
        tunnelNameValidation: result,
        isValidatingTunnelName: false,
        // If tunnel exists, store it for potential reuse
        tunnel: result.existingTunnel || get().tunnel,
      });
      return result;
    } catch (error) {
      const result: TunnelValidationResult = {
        status: 'error',
        message: `Validation failed: ${(error as Error).message}`,
      };
      set({
        tunnelNameValidation: result,
        isValidatingTunnelName: false,
      });
      return result;
    }
  },

  validateHostname: async (hostname: string): Promise<DNSValidationResult> => {
    const { service, selectedZone } = get();
    
    if (!service || !selectedZone) {
      const result: DNSValidationResult = {
        status: 'error',
        message: 'No zone selected',
      };
      set({ hostnameValidation: result });
      return result;
    }

    set({ isValidatingHostname: true, hostnameValidation: null });

    try {
      const result = await service.checkDNSRecordExists(selectedZone.id, hostname);
      set({
        hostnameValidation: result,
        isValidatingHostname: false,
      });
      return result;
    } catch (error) {
      const result: DNSValidationResult = {
        status: 'error',
        message: `Validation failed: ${(error as Error).message}`,
      };
      set({
        hostnameValidation: result,
        isValidatingHostname: false,
      });
      return result;
    }
  },

  setUseExistingTunnel: (useExisting: boolean) => {
    const { tunnelNameValidation } = get();
    set({ useExistingTunnel: useExisting });
    
    // If using existing tunnel, set it as the active tunnel
    if (useExisting && tunnelNameValidation?.existingTunnel) {
      set({ tunnel: tunnelNameValidation.existingTunnel });
    }
  },

  clearTunnelValidation: () => {
    set({
      tunnelNameValidation: null,
      isValidatingTunnelName: false,
      useExistingTunnel: false,
    });
  },

  clearHostnameValidation: () => {
    set({
      hostnameValidation: null,
      isValidatingHostname: false,
    });
  },
}));

// ============================================
// HELPERS
// ============================================

function handleError(error: unknown): CloudflareError {
  if (error instanceof CloudflareApiException) {
    return {
      message: error.getUserFriendlyMessage(),
      code: error.code,
      isNetwork: false,
    };
  }
  
  if (error instanceof NetworkException) {
    return {
      message: error.message,
      isNetwork: true,
    };
  }
  
  if (error instanceof Error) {
    return { message: error.message };
  }
  
  return { message: 'An unknown error occurred' };
}
