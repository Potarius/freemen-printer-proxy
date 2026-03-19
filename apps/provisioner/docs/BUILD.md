# Freemen Provisioner - Build & Packaging Guide

## Prerequisites

### System Requirements

- **Node.js** 18+ (LTS recommended)
- **Rust** 1.70+ (for Tauri)
- **npm** 9+ or **pnpm** 8+

### Windows-specific Requirements

For Windows builds, you need:

- **Microsoft Visual Studio C++ Build Tools**
- **WebView2** (usually pre-installed on Windows 10/11)
- **NSIS** (for NSIS installer) - automatically downloaded by Tauri

### Installation

```bash
# Install Rust (if not installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js dependencies
cd apps/provisioner
npm install
```

---

## Development

### Running in Development Mode

```bash
# Start the development server (browser only)
npm run dev

# Start with Tauri (full desktop app)
npm run tauri:dev
```

The development server runs at `http://localhost:1420`

### Using the Dev Helper Script (Windows)

For a smoother dev experience, use the helper script:

```powershell
# Start Tauri dev (handles port conflicts)
.\scripts\dev-start.ps1

# Start web-only mode
.\scripts\dev-start.ps1 -Web

# Force kill any process on port 1420 and start
.\scripts\dev-start.ps1 -Force

# Show help
.\scripts\dev-start.ps1 -Help
```

### Port Conflict Resolution

If port 1420 is already in use:

```powershell
# Find what's using the port
netstat -ano | findstr :1420

# Or use PowerShell
Get-NetTCPConnection -LocalPort 1420

# Kill the process (replace PID)
taskkill /F /PID <process_id>
```

### Development URLs

| URL | Description |
|-----|-------------|
| `/` | Home page / Dashboard |
| `/wizard` | Provisioning wizard |
| `/pi-setup` | Raspberry Pi setup |
| `/ubuntu-deploy` | Ubuntu deployment |
| `/diagnostics` | System diagnostics |
| `/settings` | App settings |

---

## Building

### Build Frontend Only

```bash
npm run build
```

Output: `dist/` folder

### Build Desktop Application

```bash
# Build for current platform
npm run tauri:build

# Build with debug symbols
npm run tauri:build -- --debug
```

### Build Outputs (Windows)

After a successful build, find outputs in:

```
src-tauri/target/release/
├── freemen-provisioner.exe          # Standalone executable
└── bundle/
    ├── msi/
    │   └── Freemen Provisioner_1.0.0_x64_en-US.msi
    └── nsis/
        └── Freemen Provisioner_1.0.0_x64-setup.exe
```

---

## Packaging

### Windows Installer (NSIS)

The NSIS installer is the recommended distribution method:

```bash
npm run tauri:build
```

Features:
- User-level installation (no admin required)
- Automatic WebView2 installation
- Start menu shortcut
- Uninstaller included

### MSI Package

MSI is also generated for enterprise deployment:

```bash
npm run tauri:build
```

Features:
- System-level installation
- Group Policy compatible
- Silent installation support

### Silent Installation

```bash
# NSIS silent install
"Freemen Provisioner_1.0.0_x64-setup.exe" /S

# MSI silent install
msiexec /i "Freemen Provisioner_1.0.0_x64_en-US.msi" /quiet
```

---

## Icons

Icons must be placed in `src-tauri/icons/`:

| File | Size | Format |
|------|------|--------|
| `32x32.png` | 32x32 | PNG |
| `128x128.png` | 128x128 | PNG |
| `128x128@2x.png` | 256x256 | PNG |
| `icon.ico` | Multi-size | ICO |
| `icon.icns` | Multi-size | ICNS (macOS) |

### Generating Icons

Use the Tauri icon generator:

```bash
npx tauri icon path/to/source-icon.png
```

---

## Configuration

### Environment Variables

No environment variables required for basic functionality.

For development:
```bash
VITE_DEV=true  # Enable development features
```

### Tauri Configuration

Main config: `src-tauri/tauri.conf.json`

Key settings:
- `package.productName` - Application name
- `package.version` - Version number
- `bundle.identifier` - Unique identifier
- `bundle.targets` - Build targets (msi, nsis)

---

## Troubleshooting

### Build Fails with Rust Errors

```bash
# Update Rust
rustup update

# Clean and rebuild
cd src-tauri
cargo clean
cd ..
npm run tauri:build
```

### WebView2 Missing

The installer automatically downloads WebView2. For manual installation:
https://developer.microsoft.com/en-us/microsoft-edge/webview2/

### NSIS Not Found

Tauri downloads NSIS automatically. If it fails:
1. Download NSIS manually from https://nsis.sourceforge.io/
2. Add to PATH
3. Retry build

### Build Takes Too Long

First builds are slow due to Rust compilation. Subsequent builds are faster.

```bash
# Use release profile for smaller binaries
npm run tauri:build -- --release
```

### Dev Server Port Already in Use

If you see "beforeDevCommand terminated with non-zero status":

1. **Use the helper script**: `.\scripts\dev-start.ps1 -Force`
2. **Or manually kill the process**:
   ```powershell
   # Find and kill process on port 1420
   $pid = (Get-NetTCPConnection -LocalPort 1420).OwningProcess
   Stop-Process -Id $pid -Force
   ```
3. **Check for zombie Vite processes**:
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
   ```

### Tauri Dev Hangs or Shows Blank Window

1. Ensure Vite is running: check `http://localhost:1420` in browser
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Restart: `npm run tauri:dev`

---

## Release Checklist

Before releasing:

- [ ] Update version in `package.json`
- [ ] Update version in `src-tauri/tauri.conf.json`
- [ ] Update version in `src-tauri/Cargo.toml`
- [ ] Run full QA checklist (see QA.md)
- [ ] Test on clean Windows installation
- [ ] Verify installer runs correctly
- [ ] Verify uninstaller works
- [ ] Create GitHub release with artifacts

---

## Distribution

### Recommended Files to Distribute

| File | Description | Size (approx) |
|------|-------------|---------------|
| `*-setup.exe` | NSIS installer | ~5-10 MB |
| `*.msi` | MSI installer | ~5-10 MB |
| `*.exe` (standalone) | Portable | ~5-10 MB |

### Code Signing (Optional)

For production releases, sign the executables:

```json
// tauri.conf.json
"bundle": {
  "windows": {
    "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
    "timestampUrl": "http://timestamp.digicert.com"
  }
}
```

---

## Support

- GitHub Issues: https://github.com/Potarius/freemen-printer-proxy/issues
- Documentation: See `/docs` folder
