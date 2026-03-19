# Freemen Provisioner - Product Roadmap

## Current Version: 1.0.0

---

## Phase 2.1: Device Identity & Onboarding

### device_id System
**Priority:** High
**Estimated Effort:** 2-3 days

**Features:**
- [ ] Generate unique device_id on first provision
- [ ] Store device_id in local configuration
- [ ] Display device_id in dashboard and diagnostics
- [ ] Include device_id in all API communications
- [ ] Device naming/labeling system

**Implementation:**
```typescript
interface DeviceIdentity {
  deviceId: string;      // UUID v4
  deviceName: string;    // User-friendly name
  createdAt: string;     // ISO timestamp
  lastSeen: string;      // Last activity
  platform: string;      // win32, linux, darwin
}
```

### Local Onboarding Flow
**Priority:** High
**Estimated Effort:** 2-3 days

**Features:**
- [ ] First-run onboarding wizard
- [ ] Welcome screen with feature overview
- [ ] Configuration verification steps
- [ ] Local network printer discovery
- [ ] Test print capability
- [ ] Onboarding completion confirmation

---

## Phase 2.2: Claim Token System

### Token Generation
**Priority:** High
**Estimated Effort:** 3-4 days

**Features:**
- [ ] Generate secure claim tokens (JWT or custom)
- [ ] Token expiration handling
- [ ] Single-use token validation
- [ ] Token refresh mechanism
- [ ] QR code display for mobile scanning

**Token Structure:**
```typescript
interface ClaimToken {
  token: string;           // Base64 encoded
  deviceId: string;        // Associated device
  expiresAt: string;       // Expiration timestamp
  maxUses: number;         // 1 for single-use
  usedCount: number;       // Current usage
  permissions: string[];   // Granted permissions
}
```

### Token Display UI
- [ ] Large, readable token display
- [ ] Copy button with confirmation
- [ ] QR code generation
- [ ] Expiration countdown
- [ ] Regenerate token action

---

## Phase 2.3: Cloud Pairing

### Dynamic Cloud Connection
**Priority:** Medium
**Estimated Effort:** 4-5 days

**Features:**
- [ ] Cloud API integration
- [ ] Device registration with cloud
- [ ] Real-time connection status
- [ ] Automatic reconnection
- [ ] Offline queue for commands

**Flow:**
```
1. User enters claim token on cloud dashboard
2. Cloud verifies token with device
3. Device receives pairing confirmation
4. Secure channel established
5. Device appears in cloud dashboard
```

### Cloud Dashboard Integration
- [ ] Device list synchronization
- [ ] Remote configuration push
- [ ] Status monitoring
- [ ] Command execution
- [ ] Logs streaming

---

## Phase 2.4: Enhanced Provisioning

### Multi-Device Management
**Priority:** Medium
**Estimated Effort:** 3-4 days

**Features:**
- [ ] Device inventory view
- [ ] Batch provisioning
- [ ] Configuration templates
- [ ] Clone device settings
- [ ] Export/import configurations

### Printer Discovery
- [ ] Network scanner for Brother printers
- [ ] mDNS/Bonjour discovery
- [ ] Manual IP entry
- [ ] Connection testing
- [ ] Printer status display

---

## Phase 2.5: Auto-Updates

### Update System
**Priority:** Medium
**Estimated Effort:** 2-3 days

**Features:**
- [ ] Check for updates on launch
- [ ] Download updates in background
- [ ] Update notification UI
- [ ] One-click update installation
- [ ] Rollback capability
- [ ] Release notes display

**Tauri Updater Configuration:**
```json
{
  "updater": {
    "active": true,
    "endpoints": [
      "https://releases.freemen.io/provisioner/{{target}}/{{current_version}}"
    ],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}
```

---

## Phase 2.6: Advanced Features

### Configuration Backup/Restore
- [ ] Export full configuration
- [ ] Encrypted backup option
- [ ] Cloud backup integration
- [ ] Restore wizard
- [ ] Version history

### Logging & Telemetry
- [ ] Local log storage
- [ ] Log viewer UI
- [ ] Log export
- [ ] Optional telemetry (opt-in)
- [ ] Crash reporting

### Localization
- [ ] French translation
- [ ] Spanish translation
- [ ] German translation
- [ ] Language selector in settings

---

## Technical Debt & Improvements

### Code Quality
- [ ] Add unit tests for services
- [ ] Add integration tests for flows
- [ ] Add E2E tests with Playwright
- [ ] Improve TypeScript strictness
- [ ] Add ESLint/Prettier configuration

### Performance
- [ ] Bundle size optimization
- [ ] Lazy loading for routes
- [ ] Image optimization
- [ ] Memory leak audit

### Security
- [ ] Security audit
- [ ] Code signing certificate
- [ ] Dependency vulnerability scan
- [ ] CSP hardening

---

## Version History

### v1.0.0 (Current)
- ✅ Cloudflare provisioning wizard
- ✅ Raspberry Pi headless setup
- ✅ Ubuntu deployment flow
- ✅ Diagnostics page
- ✅ Premium UI design
- ✅ Windows packaging

### v1.1.0 (Planned)
- Device identity system
- Local onboarding flow
- Claim token generation

### v1.2.0 (Planned)
- Cloud pairing
- Remote management
- Auto-updates

### v2.0.0 (Future)
- Multi-device management
- Advanced printer discovery
- Full localization

---

## Contributing

To contribute to the roadmap:

1. Open an issue on GitHub
2. Describe the feature request
3. Discuss implementation approach
4. Submit PR when ready

**GitHub:** https://github.com/Potarius/freemen-printer-proxy
