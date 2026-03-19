/**
 * Cloudflare API Service
 * Handles all Cloudflare API interactions
 */

import type { CloudflareAccount, CloudflareZone, CloudflareTunnel } from '../types';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

export class CloudflareService {
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${CF_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      const errors = data.errors?.map((e: { message: string }) => e.message).join(', ') || 'Unknown error';
      throw new Error(`Cloudflare API Error: ${errors}`);
    }

    return data.result;
  }

  async verifyToken(): Promise<{ status: string }> {
    return this.request('/user/tokens/verify');
  }

  async getAccounts(): Promise<CloudflareAccount[]> {
    return this.request('/accounts');
  }

  async getZones(accountId?: string): Promise<CloudflareZone[]> {
    let endpoint = '/zones?per_page=50';
    if (accountId) {
      endpoint += `&account.id=${accountId}`;
    }
    return this.request(endpoint);
  }

  async getTunnels(accountId: string): Promise<CloudflareTunnel[]> {
    return this.request(`/accounts/${accountId}/cfd_tunnel`);
  }

  async createTunnel(accountId: string, name: string, secret: string): Promise<CloudflareTunnel> {
    return this.request(`/accounts/${accountId}/cfd_tunnel`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        tunnel_secret: secret,
        config_src: 'cloudflare',
      }),
    });
  }

  async getTunnelToken(accountId: string, tunnelId: string): Promise<string> {
    return this.request(`/accounts/${accountId}/cfd_tunnel/${tunnelId}/token`);
  }

  async createTunnelDNS(zoneId: string, hostname: string, tunnelId: string): Promise<void> {
    // Check for existing record
    const existing: { id: string }[] = await this.request(`/zones/${zoneId}/dns_records?name=${hostname}`);
    
    const recordData = {
      type: 'CNAME',
      name: hostname,
      content: `${tunnelId}.cfargotunnel.com`,
      proxied: true,
    };

    if (existing && existing.length > 0) {
      await this.request(`/zones/${zoneId}/dns_records/${existing[0].id}`, {
        method: 'PUT',
        body: JSON.stringify(recordData),
      });
    } else {
      await this.request(`/zones/${zoneId}/dns_records`, {
        method: 'POST',
        body: JSON.stringify(recordData),
      });
    }
  }

  async configureTunnelIngress(accountId: string, tunnelId: string, hostname: string, serviceUrl: string): Promise<void> {
    await this.request(`/accounts/${accountId}/cfd_tunnel/${tunnelId}/configurations`, {
      method: 'PUT',
      body: JSON.stringify({
        config: {
          ingress: [
            { hostname, service: serviceUrl },
            { service: 'http_status:404' },
          ],
        },
      }),
    });
  }

  async deleteTunnel(accountId: string, tunnelId: string): Promise<void> {
    await this.request(`/accounts/${accountId}/cfd_tunnel/${tunnelId}`, {
      method: 'DELETE',
    });
  }
}

// Mock service for development/testing
export class MockCloudflareService {
  private delay = () => new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

  async verifyToken(): Promise<{ status: string }> {
    await this.delay();
    return { status: 'active' };
  }

  async getAccounts(): Promise<CloudflareAccount[]> {
    await this.delay();
    return [
      { id: 'acc_123', name: 'My Account' },
      { id: 'acc_456', name: 'Work Account' },
    ];
  }

  async getZones(): Promise<CloudflareZone[]> {
    await this.delay();
    return [
      { id: 'zone_123', name: 'example.com', status: 'active' },
      { id: 'zone_456', name: 'mycompany.io', status: 'active' },
    ];
  }

  async createTunnel(_accountId: string, name: string): Promise<CloudflareTunnel> {
    await this.delay();
    return {
      id: `tunnel_${Date.now()}`,
      name,
      status: 'inactive',
      createdAt: new Date().toISOString(),
    };
  }

  async getTunnelToken(): Promise<string> {
    await this.delay();
    return 'eyJhIjoiMTIzNDU2Nzg5MCIsInQiOiJtb2NrLXRva2VuIiwicyI6Im1vY2stc2VjcmV0In0=';
  }

  async createTunnelDNS(): Promise<void> {
    await this.delay();
  }

  async configureTunnelIngress(): Promise<void> {
    await this.delay();
  }
}

// Factory function
export function createCloudflareService(apiToken: string, useMock = false) {
  if (useMock || import.meta.env.DEV) {
    console.log('[CloudflareService] Using mock service');
    return new MockCloudflareService();
  }
  return new CloudflareService(apiToken);
}
