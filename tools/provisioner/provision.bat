@echo off
REM Freemen Printer Proxy - Cloudflare Tunnel Provisioner
REM Batch wrapper for Windows users

powershell -ExecutionPolicy Bypass -File "%~dp0provision.ps1"
pause
