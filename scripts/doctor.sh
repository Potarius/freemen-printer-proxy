#!/bin/bash
#
# Freemen Printer Proxy - Diagnostic Script
# Checks system status and helps troubleshoot issues
#
# Usage: ./scripts/doctor.sh
#

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print helpers
header() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }
info() { echo -e "  ${BLUE}•${NC} $1"; }
ok() { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Header
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}       ${GREEN}Freemen Printer Proxy${NC} - System Diagnostics        ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"

# System Information
header "System Information"
info "OS: $(uname -s) $(uname -r)"
info "Architecture: $(uname -m)"
info "Hostname: $(hostname)"

if [ -f /proc/device-tree/model ]; then
    info "Device: $(cat /proc/device-tree/model 2>/dev/null || echo 'Unknown')"
fi

# Network Information
header "Network Information"
LOCAL_IPS=$(hostname -I 2>/dev/null || ip -4 addr show | grep inet | grep -v 127.0.0.1 | awk '{print $2}' | cut -d'/' -f1 | tr '\n' ' ')
info "Local IP(s): $LOCAL_IPS"

# Docker Status
header "Docker Status"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',')
    ok "Docker installed: v$DOCKER_VERSION"
    
    if docker info &> /dev/null; then
        ok "Docker daemon running"
    else
        fail "Docker daemon not accessible (try: sudo usermod -aG docker $USER)"
    fi
else
    fail "Docker not installed"
fi

# Docker Compose Status
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "unknown")
    ok "Docker Compose (plugin): v$COMPOSE_VERSION"
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version 2>/dev/null | cut -d' ' -f4 | tr -d ',')
    ok "Docker Compose (standalone): v$COMPOSE_VERSION"
    COMPOSE_CMD="docker-compose"
else
    fail "Docker Compose not installed"
    COMPOSE_CMD=""
fi

# Project Files
header "Project Files"
info "Project directory: $PROJECT_DIR"

if [ -f "$PROJECT_DIR/.env" ]; then
    ok ".env file exists"
    
    # Check for default API key
    if grep -q "API_KEY=dev-key-change-in-production" "$PROJECT_DIR/.env" 2>/dev/null; then
        warn "API_KEY is set to default value (change for production)"
    else
        ok "API_KEY is configured"
    fi
else
    fail ".env file missing (run: cp .env.example .env)"
fi

if [ -f "$PROJECT_DIR/.env.example" ]; then
    ok ".env.example exists"
else
    warn ".env.example missing"
fi

if [ -d "$PROJECT_DIR/data" ]; then
    ok "data/ directory exists"
    if [ -f "$PROJECT_DIR/data/printer-config.json" ]; then
        ok "Printer configuration saved"
    else
        info "No printer configuration yet"
    fi
else
    warn "data/ directory missing"
fi

if [ -d "$PROJECT_DIR/logs" ]; then
    ok "logs/ directory exists"
else
    warn "logs/ directory missing"
fi

# Container Status
header "Container Status"
if [ -n "$COMPOSE_CMD" ]; then
    CONTAINER_STATUS=$($COMPOSE_CMD ps 2>/dev/null)
    
    if echo "$CONTAINER_STATUS" | grep -q "freemen-printer-proxy"; then
        if echo "$CONTAINER_STATUS" | grep -q "Up"; then
            ok "Container is running"
            
            # Get container health
            HEALTH=$(docker inspect --format='{{.State.Health.Status}}' freemen-printer-proxy 2>/dev/null || echo "unknown")
            if [ "$HEALTH" = "healthy" ]; then
                ok "Container health: healthy"
            elif [ "$HEALTH" = "unhealthy" ]; then
                fail "Container health: unhealthy"
            else
                info "Container health: $HEALTH"
            fi
        else
            fail "Container exists but not running"
        fi
    else
        info "Container not found (run: $COMPOSE_CMD up -d)"
    fi
else
    warn "Cannot check container status (Docker Compose not available)"
fi

# Port Status
header "Port Status"
PORT=6500

if command -v ss &> /dev/null; then
    if ss -tuln | grep -q ":$PORT "; then
        ok "Port $PORT is listening"
    else
        warn "Port $PORT is not listening"
    fi
elif command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":$PORT "; then
        ok "Port $PORT is listening"
    else
        warn "Port $PORT is not listening"
    fi
else
    info "Cannot check port status (ss/netstat not available)"
fi

# Health Check
header "Service Health Check"
HEALTH_URL="http://localhost:$PORT/health"

if command -v curl &> /dev/null; then
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    
    if [ "$HEALTH_RESPONSE" = "200" ]; then
        ok "Health endpoint responding (HTTP 200)"
        
        # Get more details
        HEALTH_DATA=$(curl -s "$HEALTH_URL" 2>/dev/null)
        if command -v jq &> /dev/null; then
            PRINTER_CONNECTED=$(echo "$HEALTH_DATA" | jq -r '.printer.connected' 2>/dev/null)
            PRINTER_IP=$(echo "$HEALTH_DATA" | jq -r '.printer.ip' 2>/dev/null)
            
            if [ "$PRINTER_CONNECTED" = "true" ]; then
                ok "Printer connected: $PRINTER_IP"
            elif [ -z "$PRINTER_IP" ] || [ "$PRINTER_IP" = "null" ] || [ "$PRINTER_IP" = "" ]; then
                info "No printer configured yet"
            else
                warn "Printer not connected: $PRINTER_IP"
            fi
        fi
    elif [ "$HEALTH_RESPONSE" = "503" ]; then
        warn "Service degraded (printer not connected)"
    else
        fail "Health endpoint not responding (HTTP $HEALTH_RESPONSE)"
    fi
elif command -v wget &> /dev/null; then
    if wget -q --spider "$HEALTH_URL" 2>/dev/null; then
        ok "Health endpoint responding"
    else
        fail "Health endpoint not responding"
    fi
else
    info "Cannot perform health check (curl/wget not available)"
fi

# Recent Logs
header "Recent Container Logs"
if [ -n "$COMPOSE_CMD" ]; then
    echo ""
    $COMPOSE_CMD logs --tail=10 2>/dev/null || info "No logs available"
fi

# Summary
header "Summary"
echo ""
LOCAL_IP=$(echo "$LOCAL_IPS" | awk '{print $1}')
echo -e "  ${BLUE}Dashboard URL:${NC}  http://${LOCAL_IP}:6500"
echo -e "  ${BLUE}Health URL:${NC}     http://${LOCAL_IP}:6500/health"
echo ""
echo -e "  ${YELLOW}Useful Commands:${NC}"
echo "  - Start:    $COMPOSE_CMD up -d"
echo "  - Stop:     $COMPOSE_CMD down"
echo "  - Logs:     $COMPOSE_CMD logs -f"
echo "  - Restart:  $COMPOSE_CMD restart"
echo ""
