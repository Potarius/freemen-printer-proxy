/**
 * Cloudflare API Integration
 * Uses API Token (not Global API Key) for security
 */

const fetch = require('node-fetch');

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

class CloudflareAPI {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.accountId = null;
  }

  async request(endpoint, options = {}) {
    const url = `${CF_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      const errors = data.errors?.map(e => e.message).join(', ') || 'Unknown error';
      throw new Error(`Cloudflare API Error: ${errors}`);
    }

    return data;
  }

  /**
   * Verify token and get account info
   */
  async verifyToken() {
    const data = await this.request('/user/tokens/verify');
    return data.result;
  }

  /**
   * Get accounts accessible with this token
   */
  async getAccounts() {
    const data = await this.request('/accounts');
    return data.result;
  }

  /**
   * Get zones (domains) for an account
   */
  async getZones(accountId = null) {
    let endpoint = '/zones?per_page=50';
    if (accountId) {
      endpoint += `&account.id=${accountId}`;
    }
    const data = await this.request(endpoint);
    return data.result;
  }

  /**
   * Get existing tunnels for an account
   */
  async getTunnels(accountId) {
    const data = await this.request(`/accounts/${accountId}/cfd_tunnel`);
    return data.result;
  }

  /**
   * Create a new Cloudflare Tunnel (remotely managed)
   */
  async createTunnel(accountId, tunnelName, tunnelSecret) {
    const data = await this.request(`/accounts/${accountId}/cfd_tunnel`, {
      method: 'POST',
      body: JSON.stringify({
        name: tunnelName,
        tunnel_secret: tunnelSecret,
        config_src: 'cloudflare', // Remotely managed
      }),
    });
    return data.result;
  }

  /**
   * Get tunnel token for cloudflared
   */
  async getTunnelToken(accountId, tunnelId) {
    const data = await this.request(`/accounts/${accountId}/cfd_tunnel/${tunnelId}/token`);
    return data.result;
  }

  /**
   * Create DNS record for tunnel (CNAME to tunnel UUID)
   */
  async createTunnelDNS(zoneId, hostname, tunnelId) {
    // First check if record exists
    const existingRecords = await this.request(`/zones/${zoneId}/dns_records?name=${hostname}`);
    
    if (existingRecords.result && existingRecords.result.length > 0) {
      // Update existing record
      const recordId = existingRecords.result[0].id;
      const data = await this.request(`/zones/${zoneId}/dns_records/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify({
          type: 'CNAME',
          name: hostname,
          content: `${tunnelId}.cfargotunnel.com`,
          proxied: true,
        }),
      });
      return { ...data.result, updated: true };
    }

    // Create new record
    const data = await this.request(`/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'CNAME',
        name: hostname,
        content: `${tunnelId}.cfargotunnel.com`,
        proxied: true,
      }),
    });
    return { ...data.result, updated: false };
  }

  /**
   * Configure tunnel ingress rules
   */
  async configureTunnelIngress(accountId, tunnelId, hostname, serviceUrl) {
    const config = {
      ingress: [
        {
          hostname: hostname,
          service: serviceUrl,
        },
        {
          service: 'http_status:404',
        },
      ],
    };

    const data = await this.request(`/accounts/${accountId}/cfd_tunnel/${tunnelId}/configurations`, {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
    return data.result;
  }

  /**
   * Delete a tunnel
   */
  async deleteTunnel(accountId, tunnelId) {
    const data = await this.request(`/accounts/${accountId}/cfd_tunnel/${tunnelId}`, {
      method: 'DELETE',
    });
    return data.result;
  }
}

module.exports = CloudflareAPI;
