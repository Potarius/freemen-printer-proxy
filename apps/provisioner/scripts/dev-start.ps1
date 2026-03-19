# Freemen Provisioner - Development Start Script
# This script handles common dev environment issues like port conflicts

param(
    [switch]$Web,      # Run web-only (no Tauri)
    [switch]$Force,    # Force kill existing processes
    [switch]$Help
)

$DEV_PORT = 1420
$APP_NAME = "Freemen Provisioner"

function Write-Header {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $APP_NAME - Dev Environment" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Write-Header
    Write-Host "Usage: .\dev-start.ps1 [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Web     Run web-only mode (Vite without Tauri)"
    Write-Host "  -Force   Force kill any process using port $DEV_PORT"
    Write-Host "  -Help    Show this help message"
    Write-Host ""
    Write-Host "Common Commands:"
    Write-Host "  npm run dev         - Start Vite dev server only"
    Write-Host "  npm run tauri:dev   - Start Tauri + Vite dev"
    Write-Host "  npm run tauri:build - Build production installer"
    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "  If port $DEV_PORT is busy, run: .\dev-start.ps1 -Force"
    Write-Host "  Or manually: netstat -ano | findstr :$DEV_PORT"
    Write-Host ""
}

function Test-PortInUse {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

function Get-ProcessOnPort {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connection) {
        $processId = $connection.OwningProcess | Select-Object -First 1
        return Get-Process -Id $processId -ErrorAction SilentlyContinue
    }
    return $null
}

function Stop-ProcessOnPort {
    param([int]$Port)
    $process = Get-ProcessOnPort -Port $Port
    if ($process) {
        Write-Host "Stopping process: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
        return $true
    }
    return $false
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Write-Header

# Check if port is in use
if (Test-PortInUse -Port $DEV_PORT) {
    $process = Get-ProcessOnPort -Port $DEV_PORT
    Write-Host "! Port $DEV_PORT is already in use" -ForegroundColor Red
    
    if ($process) {
        Write-Host "  Process: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Gray
    }
    
    if ($Force) {
        Write-Host ""
        Write-Host "Forcing process termination..." -ForegroundColor Yellow
        if (Stop-ProcessOnPort -Port $DEV_PORT) {
            Write-Host "Process stopped successfully" -ForegroundColor Green
        }
    } else {
        Write-Host ""
        Write-Host "Options:" -ForegroundColor Yellow
        Write-Host "  1. Run with -Force to kill the process"
        Write-Host "  2. Manually stop the existing dev server"
        Write-Host "  3. Use a different terminal if it's already running"
        Write-Host ""
        exit 1
    }
}

Write-Host "Port $DEV_PORT is available" -ForegroundColor Green
Write-Host ""

# Start the appropriate dev command
if ($Web) {
    Write-Host "Starting web-only dev server..." -ForegroundColor Cyan
    Write-Host "URL: http://localhost:$DEV_PORT" -ForegroundColor Gray
    Write-Host ""
    npm run dev
} else {
    Write-Host "Starting Tauri dev environment..." -ForegroundColor Cyan
    Write-Host "This will start both Vite and Tauri" -ForegroundColor Gray
    Write-Host ""
    npm run tauri:dev
}
