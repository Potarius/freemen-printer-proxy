# Cloudflare Premium Assisted Flow

## Overview

The Freemen Provisioner uses a **premium assisted flow** for Cloudflare configuration. Instead of requiring users to manually enter technical IDs, the application guides them through a streamlined experience.

---

## Flow Steps

### Step 1: Connect to Cloudflare

**What the user does:**
- Enters their Cloudflare API token
- Clicks "Connect to Cloudflare"

**What happens automatically:**
- Token is validated against Cloudflare API
- Accounts are auto-discovered
- Zones (domains) are loaded

**Required Token Permissions:**
| Permission | Scope | Purpose |
|------------|-------|---------|
| Zone : Zone : Read | All zones | List available domains |
| Zone : DNS : Edit | All zones | Create DNS records |
| Account : Cloudflare Tunnel : Edit | All accounts | Create/manage tunnels |
| Account : Account Settings : Read | All accounts | List accounts |

### Step 2: Account Selection

**Auto-selection:** If the token has access to only one account, it's automatically selected.

**Manual selection:** If multiple accounts exist, the user chooses from a premium dropdown showing:
- Account name
- Account ID (truncated for readability)

### Step 3: Domain Selection

**What the user does:**
- Selects their domain from a searchable list
- Can refresh the list if needed

**Displayed information:**
- Domain name (e.g., `example.com`)
- Zone status (active/pending)

### Step 4: Configure Access URL

**What the user enters:**
- Subdomain (e.g., `printer`)

**Live preview shows:**
- Full URL: `https://printer.example.com`

**Advanced settings (optional):**
- Custom tunnel name

### Step 5: Ready State

The user sees a summary card with:
- Selected account
- Selected domain
- Full public URL
- Tunnel name

---

## Technical Details

### No Manual ID Entry Required

The old flow required:
```
❌ account_id: manually copied from Cloudflare dashboard
❌ zone_id: manually copied from Cloudflare dashboard
```

The new flow:
```
✅ Account: auto-discovered from token
✅ Zone: auto-discovered from account
✅ IDs: resolved internally, never shown to user
```

### Internal State

The following is stored internally (users never see these):
- `account.id` - Used for tunnel API calls
- `zone.id` - Used for DNS record creation
- `tunnel.id` - Created during provisioning

### API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /user/tokens/verify` | Validate token |
| `GET /accounts` | List accessible accounts |
| `GET /zones` | List domains for account |
| `POST /accounts/{id}/cfd_tunnel` | Create tunnel |
| `PUT /accounts/{id}/cfd_tunnel/{id}/configurations` | Configure ingress |
| `POST /zones/{id}/dns_records` | Create DNS CNAME |
| `GET /accounts/{id}/cfd_tunnel/{id}/token` | Get tunnel token |

---

## Creating an API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. Add permissions:
   - **Account** → Cloudflare Tunnel → Edit
   - **Account** → Account Settings → Read
   - **Zone** → Zone → Read
   - **Zone** → DNS → Edit
5. Set zone resources to "All zones" or specific zones
6. Create and copy the token

---

## What Gets Created

During provisioning, the app creates:

1. **Cloudflare Tunnel**
   - Remotely-managed tunnel
   - Named based on user input
   - Configured with ingress rules

2. **DNS CNAME Record**
   - Points subdomain to tunnel
   - Proxied through Cloudflare
   - Auto TTL

3. **Device Package**
   - Contains tunnel token
   - Docker compose configuration
   - Deployment scripts

---

## Continuity to SD Disk / Deployment

After Cloudflare provisioning succeeds, the user can:

1. **Continue to Device Configuration**
   - Set device name
   - Configure printer settings

2. **Review & Provision**
   - See full summary
   - Start automated provisioning

3. **Download Package**
   - Get deployment files
   - Copy to target device

4. **SD Card Setup (Raspberry Pi)**
   - Navigate to Pi Setup
   - Create bootable SD card
   - Include device package

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid token format | Token too short or wrong characters | Re-copy from Cloudflare |
| Token expired | Token has expiration date | Create new token |
| No accounts found | Token lacks account access | Add account permissions |
| No zones found | Token lacks zone access | Add zone permissions |
| Tunnel name exists | Duplicate tunnel name | Choose different name |
| DNS record exists | Subdomain already in use | Choose different subdomain |

---

## Mock Mode

For development without real Cloudflare access:

```bash
# Enable mock mode
VITE_USE_MOCK_CLOUDFLARE=true npm run dev
```

Mock mode provides:
- Fake accounts and zones
- Simulated API responses
- No real resources created

---

## Support

- GitHub Issues: https://github.com/Potarius/freemen-printer-proxy/issues
- Cloudflare Docs: https://developers.cloudflare.com/
