#!/bin/bash
#
# Freemen Printer Proxy - Installation Script
# Compatible with: Ubuntu, Debian, Raspberry Pi OS, and other Linux distributions
#
# Usage: ./scripts/install.sh
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
echo -e "${BLUE}║${NC}        ${GREEN}Freemen Printer Proxy${NC} - Installation              ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}        Brother QL/TD Label Printer Gateway              ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root (warn but don't block)
if [ "$EUID" -eq 0 ]; then
    warn "Running as root. Consider using a regular user with sudo access."
fi

# Detect architecture
ARCH=$(uname -m)
info "Detected architecture: $ARCH"

case $ARCH in
    x86_64)
        info "Platform: AMD64 (Standard Linux/Server)"
        ;;
    aarch64|arm64)
        info "Platform: ARM64 (Raspberry Pi / ARM Server)"
        ;;
    armv7l)
        warn "Platform: ARMv7 (32-bit ARM) - Consider using 64-bit OS for better performance"
        ;;
    *)
        warn "Unknown architecture: $ARCH - Proceeding anyway"
        ;;
esac

# Check for Docker
check_docker() {
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
        success "Docker installed: v$DOCKER_VERSION"
        return 0
    else
        return 1
    fi
}

# Check for Docker Compose
check_docker_compose() {
    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "unknown")
        success "Docker Compose (plugin) installed: v$COMPOSE_VERSION"
        return 0
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f4 | tr -d ',')
        success "Docker Compose (standalone) installed: v$COMPOSE_VERSION"
        return 0
    else
        return 1
    fi
}

# Install Docker if needed
install_docker() {
    info "Installing Docker..."
    
    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu based
        curl -fsSL https://get.docker.com | sh
        sudo usermod -aG docker $USER
        success "Docker installed successfully"
        warn "You may need to log out and back in for group changes to take effect"
    elif command -v dnf &> /dev/null; then
        # Fedora/RHEL based
        sudo dnf install -y docker docker-compose-plugin
        sudo systemctl enable --now docker
        sudo usermod -aG docker $USER
        success "Docker installed successfully"
    else
        error "Could not detect package manager. Please install Docker manually:"
        echo "  https://docs.docker.com/engine/install/"
        exit 1
    fi
}

# Main installation
main() {
    # Step 1: Check/Install Docker
    echo ""
    info "Step 1/4: Checking Docker..."
    if ! check_docker; then
        warn "Docker not found"
        read -p "Would you like to install Docker? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_docker
        else
            error "Docker is required. Please install it manually."
            exit 1
        fi
    fi
    
    # Step 2: Check Docker Compose
    info "Step 2/4: Checking Docker Compose..."
    if ! check_docker_compose; then
        warn "Docker Compose not found"
        error "Docker Compose is required. It should be included with Docker."
        echo "  Try: sudo apt-get install docker-compose-plugin"
        exit 1
    fi
    
    # Step 3: Setup environment
    echo ""
    info "Step 3/4: Setting up environment..."
    
    # Get script directory and project root
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
    cd "$PROJECT_DIR"
    
    info "Project directory: $PROJECT_DIR"
    
    # Create .env if it doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            success "Created .env from .env.example"
            
            # Generate a random API key
            if command -v openssl &> /dev/null; then
                NEW_API_KEY=$(openssl rand -hex 32)
                sed -i "s/API_KEY=dev-key-change-in-production/API_KEY=$NEW_API_KEY/" .env
                success "Generated secure API key"
            else
                warn "Could not generate API key. Please edit .env and set a secure API_KEY"
            fi
        else
            error ".env.example not found. Cannot create configuration."
            exit 1
        fi
    else
        success ".env file already exists"
    fi
    
    # Create data directory if needed
    mkdir -p data logs
    success "Created data and logs directories"
    
    # Step 4: Build and start
    echo ""
    info "Step 4/4: Building and starting Freemen Printer Proxy..."
    
    # Use docker compose (plugin) or docker-compose (standalone)
    if docker compose version &> /dev/null; then
        docker compose build
        docker compose up -d
    else
        docker-compose build
        docker-compose up -d
    fi
    
    success "Freemen Printer Proxy is now running!"
    
    # Get local IP
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
    
    # Final message
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}              Installation Complete!                      ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BLUE}Dashboard:${NC}  http://${LOCAL_IP}:6500"
    echo -e "  ${BLUE}Health:${NC}     http://${LOCAL_IP}:6500/health"
    echo ""
    echo -e "  ${YELLOW}Next steps:${NC}"
    echo "  1. Open the dashboard in your browser"
    echo "  2. Enter your API key when prompted (check .env file)"
    echo "  3. Go to Configuration tab to scan for printers"
    echo "  4. Select your Brother printer to start printing"
    echo ""
    echo -e "  ${BLUE}Useful commands:${NC}"
    echo "  - View logs:    docker compose logs -f"
    echo "  - Stop:         docker compose down"
    echo "  - Restart:      docker compose restart"
    echo "  - Update:       ./scripts/update.sh"
    echo "  - Diagnostics:  ./scripts/doctor.sh"
    echo ""
}

# Run main function
main "$@"
