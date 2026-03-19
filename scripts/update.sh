#!/bin/bash
#
# Freemen Printer Proxy - Update Script
# Pulls latest changes and rebuilds the container
#
# Usage: ./scripts/update.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Header
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}          ${GREEN}Freemen Printer Proxy${NC} - Update                  ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

info "Project directory: $PROJECT_DIR"

# Check for local changes
check_local_changes() {
    if [ -d .git ]; then
        if ! git diff --quiet 2>/dev/null; then
            warn "You have local changes that may be overwritten"
            read -p "Continue anyway? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                info "Update cancelled"
                exit 0
            fi
        fi
    fi
}

# Determine docker compose command
get_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        error "Docker Compose not found"
        exit 1
    fi
}

COMPOSE_CMD=$(get_compose_cmd)
info "Using: $COMPOSE_CMD"

# Main update process
main() {
    # Step 1: Check for local changes
    info "Step 1/5: Checking for local changes..."
    check_local_changes
    success "Ready to update"
    
    # Step 2: Pull latest changes
    info "Step 2/5: Pulling latest changes..."
    if [ -d .git ]; then
        git fetch origin
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
        git pull origin "$CURRENT_BRANCH" || {
            warn "Git pull failed. Continuing with local version..."
        }
        success "Repository updated"
    else
        warn "Not a git repository. Skipping git pull."
    fi
    
    # Step 3: Backup current .env
    info "Step 3/5: Backing up configuration..."
    if [ -f .env ]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        success "Configuration backed up"
    fi
    
    # Step 4: Stop current container
    info "Step 4/5: Stopping current container..."
    $COMPOSE_CMD down || warn "No container running"
    success "Container stopped"
    
    # Step 5: Rebuild and restart
    info "Step 5/5: Rebuilding and restarting..."
    $COMPOSE_CMD build --no-cache
    $COMPOSE_CMD up -d
    
    # Wait for health check
    info "Waiting for service to be healthy..."
    sleep 5
    
    # Check if running
    if $COMPOSE_CMD ps | grep -q "Up"; then
        success "Service is running"
    else
        error "Service may not have started correctly"
        echo "Check logs with: $COMPOSE_CMD logs"
        exit 1
    fi
    
    # Get local IP
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
    
    # Final message
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}                 Update Complete!                         ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BLUE}Dashboard:${NC}  http://${LOCAL_IP}:6500"
    echo ""
    echo -e "  ${BLUE}Commands:${NC}"
    echo "  - View logs:  $COMPOSE_CMD logs -f"
    echo "  - Status:     $COMPOSE_CMD ps"
    echo "  - Diagnose:   ./scripts/doctor.sh"
    echo ""
}

# Run main function
main "$@"
