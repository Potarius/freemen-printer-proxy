#!/bin/bash
#
# Freemen Printer Proxy - Update Script
# Non-interactive, robust update process
#
# Usage: ./scripts/update.sh [--force]
#
# Options:
#   --force    Skip confirmation prompts
#

set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print helpers
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
step() { echo -e "${CYAN}[STEP $1/$TOTAL_STEPS]${NC} $2"; }

# Configuration
TOTAL_STEPS=7
FORCE_MODE=false
UPDATE_FAILED=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --force|-f)
            FORCE_MODE=true
            ;;
    esac
done

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Get version from package.json
get_version() {
    if [ -f package.json ]; then
        grep '"version"' package.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/'
    else
        echo "unknown"
    fi
}

OLD_VERSION=$(get_version)

# Header
print_header() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}          ${GREEN}Freemen Printer Proxy${NC} - Update                  ${BLUE}║${NC}"
    echo -e "${BLUE}╠══════════════════════════════════════════════════════════╣${NC}"
    echo -e "${BLUE}║${NC}  Current version: ${YELLOW}${OLD_VERSION}${NC}                                    ${BLUE}║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_header
info "Project directory: $PROJECT_DIR"
echo ""

# Determine docker compose command
get_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo ""
    fi
}

# Step 1: Check prerequisites
step 1 "Checking prerequisites..."

COMPOSE_CMD=$(get_compose_cmd)
if [ -z "$COMPOSE_CMD" ]; then
    error "Docker Compose not found"
    echo "  Install Docker: curl -fsSL https://get.docker.com | sh"
    exit 1
fi
success "Docker Compose: $COMPOSE_CMD"

if ! docker info &> /dev/null; then
    error "Docker daemon not accessible"
    echo "  Make sure Docker is running and you have permissions"
    exit 1
fi
success "Docker daemon accessible"

# Step 2: Check for local changes
step 2 "Checking for local changes..."

if [ -d .git ]; then
    if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
        warn "You have uncommitted local changes"
        if [ "$FORCE_MODE" = false ]; then
            read -p "Continue anyway? Changes may be lost. (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                info "Update cancelled by user"
                exit 0
            fi
        else
            warn "Force mode: continuing despite local changes"
        fi
    else
        success "No local changes detected"
    fi
else
    warn "Not a git repository - skipping git operations"
fi

# Step 3: Backup configuration
step 3 "Backing up configuration..."

BACKUP_DIR="$PROJECT_DIR/.backups"
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

if [ -f .env ]; then
    cp .env "$BACKUP_DIR/.env.backup.$BACKUP_TIMESTAMP"
    success "Backed up .env"
fi

if [ -f data/printer-config.json ]; then
    cp data/printer-config.json "$BACKUP_DIR/printer-config.backup.$BACKUP_TIMESTAMP.json"
    success "Backed up printer configuration"
fi

# Clean old backups (keep last 5)
ls -t "$BACKUP_DIR"/.env.backup.* 2>/dev/null | tail -n +6 | xargs -r rm -f
ls -t "$BACKUP_DIR"/printer-config.backup.*.json 2>/dev/null | tail -n +6 | xargs -r rm -f

# Step 4: Pull latest changes
step 4 "Pulling latest changes..."

if [ -d .git ]; then
    git fetch origin 2>/dev/null || {
        warn "Git fetch failed - continuing with local version"
    }
    
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    
    if git pull origin "$CURRENT_BRANCH" 2>/dev/null; then
        NEW_VERSION=$(get_version)
        if [ "$OLD_VERSION" != "$NEW_VERSION" ]; then
            success "Updated: $OLD_VERSION → $NEW_VERSION"
        else
            success "Already at latest version: $NEW_VERSION"
        fi
    else
        warn "Git pull failed - continuing with current code"
    fi
else
    info "Skipping git pull (not a repository)"
fi

# Step 5: Stop current container
step 5 "Stopping current container..."

if $COMPOSE_CMD ps 2>/dev/null | grep -q "Up\|running"; then
    if $COMPOSE_CMD down 2>/dev/null; then
        success "Container stopped"
    else
        warn "Error stopping container - attempting force"
        $COMPOSE_CMD down --remove-orphans 2>/dev/null || true
    fi
else
    info "No running container found"
fi

# Step 6: Rebuild and restart
step 6 "Building and starting container..."

# Build with no cache to ensure fresh image
if ! $COMPOSE_CMD build --no-cache 2>&1; then
    error "Build failed"
    UPDATE_FAILED=true
else
    success "Build completed"
fi

# Start container
if [ "$UPDATE_FAILED" = false ]; then
    if ! $COMPOSE_CMD up -d 2>&1; then
        error "Failed to start container"
        UPDATE_FAILED=true
    else
        success "Container started"
    fi
fi

# Step 7: Verify health
step 7 "Verifying service health..."

if [ "$UPDATE_FAILED" = true ]; then
    error "Update failed - check logs with: $COMPOSE_CMD logs"
    exit 1
fi

# Wait for container to be ready
info "Waiting for service to initialize..."
sleep 5

# Check container status
RETRIES=3
HEALTHY=false

for i in $(seq 1 $RETRIES); do
    if $COMPOSE_CMD ps 2>/dev/null | grep -qE "Up|running"; then
        # Try health endpoint
        if command -v curl &> /dev/null; then
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6500/health 2>/dev/null || echo "000")
            if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "503" ]; then
                HEALTHY=true
                break
            fi
        else
            # No curl, just check if container is up
            HEALTHY=true
            break
        fi
    fi
    
    if [ $i -lt $RETRIES ]; then
        info "Retry $i/$RETRIES - waiting..."
        sleep 3
    fi
done

if [ "$HEALTHY" = true ]; then
    success "Service is healthy"
else
    warn "Service may not be fully healthy - check logs"
fi

# Get final version
FINAL_VERSION=$(get_version)

# Get local IP
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

# Final summary
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}                 Update Complete!                         ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Version:${NC}    ${YELLOW}${FINAL_VERSION}${NC}"
echo -e "  ${BLUE}Dashboard:${NC}  http://${LOCAL_IP}:6500"
echo ""
echo -e "  ${BLUE}Commands:${NC}"
echo "  - View logs:    $COMPOSE_CMD logs -f"
echo "  - Status:       $COMPOSE_CMD ps"
echo "  - Diagnostics:  ./scripts/doctor.sh"
echo "  - Admin menu:   ./deploy-menu.sh"
echo ""

if [ "$HEALTHY" = false ]; then
    warn "Service health check incomplete - verify manually"
    exit 1
fi

exit 0
