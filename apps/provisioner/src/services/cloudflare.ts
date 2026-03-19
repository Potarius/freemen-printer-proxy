/**
 * Cloudflare API Service
 * Real implementation for Cloudflare API interactions
 * Uses Tauri HTTP client when available (bypasses CORS)
 * 
 * Required API Token Permissions:
 * - Account: Cloudflare Tunnel: Edit
 * - Account: Account Settings: Read
 * - Zone: Zone: Read
 * - Zone: DNS: Edit
 */

import type {
  CloudflareAccount,
  CloudflareZone,
  CloudflareTunnel,
  CloudflareTokenStatus,
  CloudflareDNSRecord,
  CloudflareApiError,
  CloudflareApiResponse,
} from '../types';
import { httpRequest, HttpError, isTauri } from './http-client';

// ============================================
// CONSTANTS
// ============================================

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

// ============================================
// ERROR CLASSES
// ============================================

export class CloudflareApiException extends Error {
  public readonly code: number;
  public readonly errors: CloudflareApiError[];
  public readonly httpStatus: number;

  constructor(message: string, code: number, errors: CloudflareApiError[], httpStatus: number) {
    super(message);
    this.name = 'CloudflareApiException';
    this.code = code;
    this.errors = errors;
    this.httpStatus = httpStatus;
  }

  static fromResponse(errors: CloudflareApiError[], httpStatus: number): CloudflareApiException {
    const primaryError = errors[0] || { code: 0, message: 'Unknown error' };
    const message = errors.map(e => `[${e.code}] ${e.message}`).join('; ');
    return new CloudflareApiException(message, primaryError.code, errors, httpStatus);
  }

  getUserFriendlyMessage(): string {
    // Map common error codes to user-friendly messages
    const errorMessages: Record<number, string> = {
      6003: 'Invalid API token format',
      6111: 'API token is missing required permissions',
      7003: 'API token has expired or been revoked',
      9109: 'Tunnel name already exists',
      1000: 'Invalid request format',
      10000: 'Authentication error - check your API token',
    };

    const primaryCode = this.errors[0]?.code || 0;
    return errorMessages[primaryCode] || this.message;
  }
}

export class NetworkException extends Error {
  public readonly category: string;
  public readonly details?: string;

  constructor(
    message: string, 
    category: 'network' | 'cors' | 'timeout' | 'connection' | 'unknown' = 'unknown',
    details?: string
  ) {
    super(message);
    this.name = 'NetworkException';
    this.category = category;
    this.details = details;
  }

  static fromHttpError(error: HttpError): NetworkException {
    const messages: Record<string, string> = {
      'network': 'No internet connection. Please check your network settings.',
      'connection': 'Unable to reach Cloudflare API. The service may be temporarily unavailable.',
      'timeout': 'Request timed out. Please try again.',
      'cors': 'Request blocked by browser security. Please use the desktop application.',
      'unknown': error.message,
    };
    
    return new NetworkException(
      messages[error.category] || error.message,
      error.category as 'network' | 'cors' | 'timeout' | 'connection' | 'unknown',
      error.details
    );
  }
}

// ============================================
// SERVICE INTERFACE
// ============================================

export interface ICloudflareService {
  verifyToken(): Promise<CloudflareTokenStatus>;
  getAccounts(): Promise<CloudflareAccount[]>;
  getZones(accountId?: string): Promise<CloudflareZone[]>;
  getTunnels(accountId: string): Promise<CloudflareTunnel[]>;
  getTunnel(accountId: string, tunnelId: string): Promise<CloudflareTunnel>;
  createTunnel(accountId: string, name: string): Promise<CloudflareTunnel>;
  getTunnelToken(accountId: string, tunnelId: string): Promise<string>;
  createDNSRecord(zoneId: string, subdomain: string, tunnelId: string): Promise<CloudflareDNSRecord>;
  getDNSRecords(zoneId: string, name?: string): Promise<CloudflareDNSRecord[]>;
  configureTunnelIngress(accountId: string, tunnelId: string, hostname: string, serviceUrl: string): Promise<void>;
  deleteTunnel(accountId: string, tunnelId: string): Promise<void>;
}

// ============================================
// REAL CLOUDFLARE SERVICE
// ============================================

export class CloudflareService implements ICloudflareService {
  private apiToken: string;

  constructor(apiToken: string) {
    if (!apiToken || apiToken.trim().length === 0) {
      throw new Error('API token is required');
    }
    this.apiToken = apiToken.trim();
    
    // Log which HTTP client will be used
    console.log(`[CloudflareService] Using ${isTauri() ? 'Tauri native' : 'browser fetch'} HTTP client`);
  }

  /**
   * Make an authenticated request to the Cloudflare API
   * Uses Tauri HTTP client when available (bypasses CORS)
   */
  private async request<T>(
    endpoint: string,
    options: { method?: string; body?: object } = {}
  ): Promise<T> {
    const url = `${CF_API_BASE}${endpoint}`;
    const method = (options.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    
    console.debug(`[CloudflareService] ${method} ${endpoint}`);
    
    try {
      const response = await httpRequest<CloudflareApiResponse<T>>(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: options.body,
      });

      // Check for HTTP-level errors
      if (!response.ok) {
        const data = response.data;
        if (data && typeof data === 'object' && 'errors' in data) {
          throw CloudflareApiException.fromResponse(
            (data as CloudflareApiResponse<T>).errors || [],
            response.status
          );
        }
        throw new CloudflareApiException(
          `HTTP ${response.status}`,
          response.status,
          [],
          response.status
        );
      }

      // Check Cloudflare API-level errors
      const data = response.data;
      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        throw CloudflareApiException.fromResponse(
          (data as CloudflareApiResponse<T>).errors || [],
          response.status
        );
      }

      // Extract result from Cloudflare response wrapper
      if (data && typeof data === 'object' && 'result' in data) {
        return (data as CloudflareApiResponse<T>).result;
      }
      
      return data as T;
    } catch (error) {
      if (error instanceof CloudflareApiException) {
        console.error(`[CloudflareService] API error:`, error.message);
        throw error;
      }
      if (error instanceof HttpError) {
        console.error(`[CloudflareService] HTTP error [${error.category}]:`, error.message);
        throw NetworkException.fromHttpError(error);
      }
      
      console.error(`[CloudflareService] Unexpected error:`, error);
      throw new NetworkException(
        `Request failed: ${(error as Error).message}`,
        'unknown',
        (error as Error).message
      );
    }
  }

  /**
   * Verify the API token and return its status
   */
  async verifyToken(): Promise<CloudflareTokenStatus> {
    return this.request<CloudflareTokenStatus>('/user/tokens/verify');
  }

  /**
   * Get all accounts accessible with this token
   */
  async getAccounts(): Promise<CloudflareAccount[]> {
    return this.request<CloudflareAccount[]>('/accounts?per_page=50');
  }

  /**
   * Get all zones, optionally filtered by account
   */
  async getZones(accountId?: string): Promise<CloudflareZone[]> {
    let endpoint = '/zones?per_page=50&status=active';
    if (accountId) {
      endpoint += `&account.id=${accountId}`;
    }
    return this.request<CloudflareZone[]>(endpoint);
  }

  /**
   * Get all tunnels for an account
   */
  async getTunnels(accountId: string): Promise<CloudflareTunnel[]> {
    const tunnels = await this.request<CloudflareTunnel[]>(
      `/accounts/${accountId}/cfd_tunnel?is_deleted=false`
    );
    return tunnels.map(t => ({
      ...t,
      createdAt: t.createdAt || new Date().toISOString(),
    }));
  }

  /**
   * Get a specific tunnel by ID
   */
  async getTunnel(accountId: string, tunnelId: string): Promise<CloudflareTunnel> {
    const tunnel = await this.request<CloudflareTunnel>(
      `/accounts/${accountId}/cfd_tunnel/${tunnelId}`
    );
    return {
      ...tunnel,
      createdAt: tunnel.createdAt || new Date().toISOString(),
    };
  }

  /**
   * Create a new remotely-managed Cloudflare Tunnel
   * No secret required - Cloudflare manages the credentials
   */
  async createTunnel(accountId: string, name: string): Promise<CloudflareTunnel> {
    // Generate a random secret for the tunnel
    const secret = this.generateTunnelSecret();
    
    const tunnel = await this.request<CloudflareTunnel>(
      `/accounts/${accountId}/cfd_tunnel`,
      {
        method: 'POST',
        body: {
          name,
          tunnel_secret: secret,
          config_src: 'cloudflare', // Remotely-managed tunnel
        },
      }
    );

    return {
      ...tunnel,
      createdAt: tunnel.createdAt || new Date().toISOString(),
    };
  }

  /**
   * Generate a cryptographically random tunnel secret (32 bytes, base64)
   */
  private generateTunnelSecret(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Get the tunnel token for cloudflared to authenticate
   */
  async getTunnelToken(accountId: string, tunnelId: string): Promise<string> {
    return this.request<string>(`/accounts/${accountId}/cfd_tunnel/${tunnelId}/token`);
  }

  /**
   * Get DNS records for a zone, optionally filtered by name
   */
  async getDNSRecords(zoneId: string, name?: string): Promise<CloudflareDNSRecord[]> {
    let endpoint = `/zones/${zoneId}/dns_records?per_page=100`;
    if (name) {
      endpoint += `&name=${encodeURIComponent(name)}`;
    }
    return this.request<CloudflareDNSRecord[]>(endpoint);
  }

  /**
   * Create or update a DNS CNAME record pointing to the tunnel
   */
  async createDNSRecord(
    zoneId: string,
    subdomain: string,
    tunnelId: string
  ): Promise<CloudflareDNSRecord> {
    // Get zone details to construct full hostname
    const zones = await this.request<CloudflareZone[]>(`/zones?per_page=1`);
    const zone = zones.find(z => z.id === zoneId);
    
    // Construct full hostname
    const fullHostname = subdomain.includes('.') ? subdomain : `${subdomain}.${zone?.name || ''}`;
    
    // Check for existing record
    const existingRecords = await this.getDNSRecords(zoneId, fullHostname);
    
    const recordData = {
      type: 'CNAME',
      name: subdomain,
      content: `${tunnelId}.cfargotunnel.com`,
      proxied: true,
      ttl: 1, // Auto TTL when proxied
    };

    if (existingRecords.length > 0) {
      // Update existing record
      return this.request<CloudflareDNSRecord>(
        `/zones/${zoneId}/dns_records/${existingRecords[0].id}`,
        {
          method: 'PUT',
          body: recordData,
        }
      );
    } else {
      // Create new record
      return this.request<CloudflareDNSRecord>(
        `/zones/${zoneId}/dns_records`,
        {
          method: 'POST',
          body: recordData,
        }
      );
    }
  }

  /**
   * Configure tunnel ingress rules
   */
  async configureTunnelIngress(
    accountId: string,
    tunnelId: string,
    hostname: string,
    serviceUrl: string
  ): Promise<void> {
    await this.request(
      `/accounts/${accountId}/cfd_tunnel/${tunnelId}/configurations`,
      {
        method: 'PUT',
        body: {
          config: {
            ingress: [
              {
                hostname,
                service: serviceUrl,
                originRequest: {
                  connectTimeout: 30,
                  noTLSVerify: false,
                },
              },
              {
                service: 'http_status:404',
              },
            ],
          },
        },
      }
    );
  }

  /**
   * Delete a tunnel (must have no active connections)
   */
  async deleteTunnel(accountId: string, tunnelId: string): Promise<void> {
    await this.request(
      `/accounts/${accountId}/cfd_tunnel/${tunnelId}`,
      { method: 'DELETE' }
    );
  }
}

// ============================================
// MOCK SERVICE FOR DEVELOPMENT
// ============================================

export class MockCloudflareService implements ICloudflareService {
  private delay = (ms = 800) => new Promise(resolve => 
    setTimeout(resolve, ms + Math.random() * 400)
  );

  async verifyToken(): Promise<CloudflareTokenStatus> {
    await this.delay();
    return {
      id: 'mock_token_id',
      status: 'active',
      not_before: '2024-01-01T00:00:00Z',
      expires_on: '2025-12-31T23:59:59Z',
    };
  }

  async getAccounts(): Promise<CloudflareAccount[]> {
    await this.delay();
    return [
      { id: 'acc_mock_123', name: 'Personal Account', type: 'standard' },
      { id: 'acc_mock_456', name: 'Business Account', type: 'enterprise' },
    ];
  }

  async getZones(accountId?: string): Promise<CloudflareZone[]> {
    await this.delay();
    const zones: CloudflareZone[] = [
      { 
        id: 'zone_mock_abc', 
        name: 'example.com', 
        status: 'active',
        account: { id: 'acc_mock_123', name: 'Personal Account' },
      },
      { 
        id: 'zone_mock_def', 
        name: 'mycompany.io', 
        status: 'active',
        account: { id: 'acc_mock_456', name: 'Business Account' },
      },
      { 
        id: 'zone_mock_ghi', 
        name: 'dev.internal', 
        status: 'active',
        account: { id: 'acc_mock_123', name: 'Personal Account' },
      },
    ];
    
    if (accountId) {
      return zones.filter(z => z.account?.id === accountId);
    }
    return zones;
  }

  async getTunnels(accountId: string): Promise<CloudflareTunnel[]> {
    await this.delay();
    return [
      {
        id: 'tun_existing_123',
        name: 'existing-tunnel',
        status: 'healthy',
        createdAt: '2024-01-15T10:30:00Z',
        account_tag: accountId,
      },
    ];
  }

  async getTunnel(accountId: string, tunnelId: string): Promise<CloudflareTunnel> {
    await this.delay();
    return {
      id: tunnelId,
      name: 'mock-tunnel',
      status: 'healthy',
      createdAt: new Date().toISOString(),
      account_tag: accountId,
    };
  }

  async createTunnel(accountId: string, name: string): Promise<CloudflareTunnel> {
    await this.delay(1200);
    return {
      id: `tun_${Date.now().toString(36)}`,
      name,
      status: 'inactive',
      createdAt: new Date().toISOString(),
      account_tag: accountId,
    };
  }

  async getTunnelToken(_accountId: string, tunnelId: string): Promise<string> {
    await this.delay();
    // Generate a mock JWT-like token
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      t: tunnelId,
      a: 'mock_account',
      iat: Date.now(),
    }));
    return `${header}.${payload}.mock_signature`;
  }

  async getDNSRecords(_zoneId: string, _name?: string): Promise<CloudflareDNSRecord[]> {
    await this.delay();
    return [];
  }

  async createDNSRecord(
    _zoneId: string,
    subdomain: string,
    tunnelId: string
  ): Promise<CloudflareDNSRecord> {
    await this.delay(1000);
    return {
      id: `dns_${Date.now().toString(36)}`,
      type: 'CNAME',
      name: subdomain,
      content: `${tunnelId}.cfargotunnel.com`,
      proxied: true,
      ttl: 1,
    };
  }

  async configureTunnelIngress(): Promise<void> {
    await this.delay(800);
  }

  async deleteTunnel(): Promise<void> {
    await this.delay();
  }
}

// ============================================
// FACTORY & SINGLETON
// ============================================

let serviceInstance: ICloudflareService | null = null;

/**
 * Create or get a Cloudflare service instance
 * @param apiToken - The Cloudflare API token
 * @param forceMock - Force using mock service (for testing)
 */
export function createCloudflareService(
  apiToken: string,
  forceMock = false
): ICloudflareService {
  // Check for mock mode via environment variable or force flag
  const useMock = forceMock || (typeof import.meta !== 'undefined' && 
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_USE_MOCK_CLOUDFLARE === 'true');
  
  if (useMock) {
    console.log('[CloudflareService] Using mock service');
    serviceInstance = new MockCloudflareService();
  } else {
    console.log('[CloudflareService] Using real Cloudflare API');
    serviceInstance = new CloudflareService(apiToken);
  }
  
  return serviceInstance;
}

/**
 * Get the current service instance
 */
export function getCloudflareService(): ICloudflareService | null {
  return serviceInstance;
}

/**
 * Clear the service instance (for logout/token change)
 */
export function clearCloudflareService(): void {
  serviceInstance = null;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Validate API token format (basic check)
 */
export function isValidTokenFormat(token: string): boolean {
  // Cloudflare API tokens are typically 40 characters
  // They can start with various prefixes
  const trimmed = token.trim();
  return trimmed.length >= 32 && /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

/**
 * Get required permissions description
 */
export function getRequiredPermissions(): { permission: string; reason: string }[] {
  return [
    { 
      permission: 'Account : Cloudflare Tunnel : Edit', 
      reason: 'Create and manage tunnels' 
    },
    { 
      permission: 'Account : Account Settings : Read', 
      reason: 'List available accounts' 
    },
    { 
      permission: 'Zone : Zone : Read', 
      reason: 'List available domains' 
    },
    { 
      permission: 'Zone : DNS : Edit', 
      reason: 'Create DNS records for tunnel' 
    },
  ];
}
