# Freemen Printer Proxy - Cloudflare Tunnel Provisioner
# PowerShell wrapper for Windows users

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║     Freemen Printer Proxy - Cloudflare Provisioner       ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check for Node.js
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "  [ERROR] Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "  [OK] Node.js found: $(node --version)" -ForegroundColor Green

# Check if dependencies are installed
$NodeModulesPath = Join-Path $ScriptDir "node_modules"
if (-not (Test-Path $NodeModulesPath)) {
    Write-Host ""
    Write-Host "  [INFO] Installing dependencies..." -ForegroundColor Cyan
    Push-Location $ScriptDir
    npm install --silent
    Pop-Location
    Write-Host "  [OK] Dependencies installed" -ForegroundColor Green
}

# Run the provisioner
Write-Host ""
Write-Host "  Starting provisioner..." -ForegroundColor Cyan
Write-Host ""

Push-Location $ScriptDir
node index.js
$ExitCode = $LASTEXITCODE
Pop-Location

exit $ExitCode
