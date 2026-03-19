#!/bin/bash
#
# Freemen Printer Proxy - Raspberry Pi Installation Script
# Optimized for: Raspberry Pi OS Lite 64-bit (headless)
#
# Usage: ./scripts/install-pi.sh
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
echo -e "${BLUE}║${NC}   ${GREEN}Freemen Printer Proxy${NC} - Raspberry Pi Installation     ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}         Optimized for Pi OS Lite 64-bit                  ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running on Raspberry Pi
check_raspberry_pi() {
    if [ -f /proc/device-tree/model ]; then
        PI_MODEL=$(cat /proc/device-tree/model 2>/dev/null || echo "Unknown")
        if [[ "$PI_MODEL" == *"Raspberry Pi"* ]]; then
            success "Detected: $PI_MODEL"
            return 0
        fi
    fi
    
    # Check architecture as fallback
    ARCH=$(uname -m)
    if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
        warn "ARM64 device detected (not confirmed as Raspberry Pi)"
        return 0
    fi
    
    return 1
}

# Check system requirements
check_requirements() {
    info "Checking system requirements..."
    
    # Check available memory
    TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
    if [ "$TOTAL_MEM" -lt 512 ]; then
        warn "Low memory detected: ${TOTAL_MEM}MB. Minimum recommended: 512MB"
    else
        success "Memory: ${TOTAL_MEM}MB"
    fi
    
    # Check available disk space
    AVAILABLE_SPACE=$(df -m / | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 500 ]; then
        warn "Low disk space: ${AVAILABLE_SPACE}MB. Minimum recommended: 500MB"
    else
        success "Disk space: ${AVAILABLE_SPACE}MB available"
    fi
    
    # Check if 64-bit
    if [ "$(getconf LONG_BIT)" = "64" ]; then
        success "64-bit OS detected"
    else
        warn "32-bit OS detected. 64-bit is recommended for better performance"
    fi
}

# Optimize Docker for Raspberry Pi
optimize_for_pi() {
    info "Applying Raspberry Pi optimizations..."
    
    # Set Docker to use less memory for logging
    if [ -d /etc/docker ]; then
        if [ ! -f /etc/docker/daemon.json ]; then
            sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF
            success "Configured Docker logging limits"
            sudo systemctl restart docker 2>/dev/null || true
        fi
    fi
}

# Show network information for headless access
show_network_info() {
    echo ""
    info "Network Information (for headless access):"
    echo ""
    
    # Get all IP addresses
    echo "  Your Pi IP addresses:"
    ip -4 addr show | grep inet | grep -v 127.0.0.1 | awk '{print "    - " $2}' | cut -d'/' -f1
    
    # Get hostname
    HOSTNAME=$(hostname)
    echo ""
    echo "  Hostname: $HOSTNAME"
    echo "  mDNS:     $HOSTNAME.local (if avahi is installed)"
}

# Main installation
main() {
    # Check if on Raspberry Pi
    if ! check_raspberry_pi; then
        warn "This script is optimized for Raspberry Pi."
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Use ./scripts/install.sh for standard Linux installation."
            exit 0
        fi
    fi
    
    # Check requirements
    check_requirements
    
    # Get script directory
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # Run the main installation script
    echo ""
    info "Running main installation..."
    "$SCRIPT_DIR/install.sh"
    
    # Apply Pi-specific optimizations
    optimize_for_pi
    
    # Show network info for headless users
    show_network_info
    
    # Pi-specific tips
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}           Raspberry Pi Setup Complete!                   ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${YELLOW}Raspberry Pi Tips:${NC}"
    echo ""
    echo "  • Access dashboard from another device on your network"
    echo "  • Make sure your Brother printer is on the same network"
    echo "  • The Pi will auto-start the proxy on boot"
    echo ""
    echo "  • To enable remote access (optional):"
    echo "    Consider setting up Cloudflare Tunnel or similar"
    echo ""
    echo "  • For production use:"
    echo "    - Change the API_KEY in .env"
    echo "    - Consider using a static IP for your Pi"
    echo ""
}

# Run main function
main "$@"
