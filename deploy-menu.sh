#!/bin/bash

# ============================================
# Freemen Printer Proxy - Deployment Manager
# Interactive admin tool for deployment and maintenance
# ============================================

set -o pipefail

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Se placer dans le répertoire du script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Get version from package.json
get_version() {
    if [ -f package.json ]; then
        grep '"version"' package.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/'
    else
        echo "unknown"
    fi
}

VERSION=$(get_version)

# Detect docker compose command
get_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo ""
    fi
}

COMPOSE_CMD=$(get_compose_cmd)

# Fonctions
print_header() {
    clear
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         FREEMEN PRINTER PROXY - DEPLOYMENT MANAGER           ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo -e "║  Version: ${GREEN}${VERSION}${CYAN}                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    if [ -z "$COMPOSE_CMD" ]; then
        print_error "Docker Compose non trouvé!"
        echo "  Installez Docker avec: curl -fsSL https://get.docker.com | sh"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon non accessible"
        echo "  Vérifiez que Docker est démarré et que vous avez les permissions"
        return 1
    fi
    
    return 0
}

# Actions individuelles
do_pull() {
    print_status "Pull des dernières modifications..."
    if [ -d .git ]; then
        if git pull; then
            print_success "Pull réussi"
            VERSION=$(get_version)
            return 0
        else
            print_error "Échec du pull"
            return 1
        fi
    else
        print_warning "Pas un dépôt Git, pull ignoré"
        return 0
    fi
}

do_stop() {
    print_status "Arrêt des conteneurs existants..."
    if $COMPOSE_CMD down 2>/dev/null; then
        print_success "Conteneurs arrêtés"
        return 0
    else
        print_warning "Aucun conteneur à arrêter ou erreur"
        return 0
    fi
}

do_build() {
    print_status "Construction de l'image Docker..."
    if $COMPOSE_CMD build --no-cache; then
        print_success "Build réussi"
        return 0
    else
        print_error "Échec du build"
        return 1
    fi
}

do_start() {
    print_status "Démarrage des conteneurs..."
    if $COMPOSE_CMD up -d; then
        print_success "Conteneurs démarrés"
        return 0
    else
        print_error "Échec du démarrage"
        return 1
    fi
}

do_logs() {
    print_status "Affichage des logs (Ctrl+C pour quitter)..."
    $COMPOSE_CMD logs -f
}

do_status() {
    print_status "Statut des conteneurs:"
    echo ""
    $COMPOSE_CMD ps
    echo ""
    
    print_status "Version: ${GREEN}${VERSION}${NC}"
    echo ""
    
    print_status "Santé du service:"
    if command -v curl &> /dev/null; then
        HEALTH=$(curl -s http://localhost:6500/health 2>/dev/null)
        if [ -n "$HEALTH" ]; then
            if command -v jq &> /dev/null; then
                echo "$HEALTH" | jq .
            else
                echo "$HEALTH"
            fi
        else
            print_warning "Service non accessible sur localhost:6500"
        fi
    else
        print_warning "curl non disponible pour le health check"
    fi
    echo ""
    
    # Show local IP for convenience
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
    print_status "Dashboard: ${CYAN}http://${LOCAL_IP}:6500${NC}"
}

# Déploiement complet
do_full_deploy() {
    print_header
    echo -e "${YELLOW}=== DÉPLOIEMENT COMPLET ===${NC}"
    echo ""
    
    do_stop
    echo ""
    do_pull
    echo ""
    do_build
    echo ""
    do_start
    echo ""
    
    print_status "Attente du démarrage (5s)..."
    sleep 5
    
    do_status
    
    print_success "Déploiement complet terminé!"
}

# Redémarrage rapide (sans pull/build)
do_restart() {
    print_header
    echo -e "${YELLOW}=== REDÉMARRAGE RAPIDE ===${NC}"
    echo ""
    
    do_stop
    echo ""
    do_start
    echo ""
    
    sleep 3
    do_status
    
    print_success "Redémarrage terminé!"
}

# Run update script (calls scripts/update.sh)
do_update() {
    print_header
    echo -e "${YELLOW}=== MISE À JOUR ===${NC}"
    echo ""
    
    if [ -x "./scripts/update.sh" ]; then
        ./scripts/update.sh
    else
        print_warning "scripts/update.sh non trouvé, exécution manuelle..."
        do_pull
        echo ""
        do_stop
        echo ""
        do_build
        echo ""
        do_start
        echo ""
        sleep 3
        do_status
    fi
}

# Run diagnostics (calls scripts/doctor.sh)
do_doctor() {
    print_header
    echo -e "${YELLOW}=== DIAGNOSTICS ===${NC}"
    echo ""
    
    if [ -x "./scripts/doctor.sh" ]; then
        ./scripts/doctor.sh
    else
        print_warning "scripts/doctor.sh non trouvé"
        do_status
    fi
}

# Menu principal
show_menu() {
    print_header
    
    # Check prerequisites first
    if ! check_prerequisites; then
        echo ""
        echo -e "${RED}Erreurs détectées. Corrigez les problèmes ci-dessus.${NC}"
        echo ""
        echo -e "Appuyez sur Entrée pour quitter..."
        read -r
        exit 1
    fi
    
    echo -e "${YELLOW}Choisissez une option:${NC}"
    echo ""
    echo -e "  ${GREEN}1)${NC} 🚀 Déploiement complet (pull + build + restart)"
    echo -e "  ${GREEN}2)${NC} 🔄 Redémarrage rapide (stop + start)"
    echo -e "  ${GREEN}3)${NC} ⬇️  Pull uniquement"
    echo -e "  ${GREEN}4)${NC} 🔨 Build uniquement"
    echo -e "  ${GREEN}5)${NC} ⏹️  Stop conteneurs"
    echo -e "  ${GREEN}6)${NC} ▶️  Start conteneurs"
    echo -e "  ${GREEN}7)${NC} 📋 Voir les logs"
    echo -e "  ${GREEN}8)${NC} 📊 Voir le statut"
    echo -e "  ${GREEN}9)${NC} 🔨 Rebuild + Restart (sans pull)"
    echo -e "  ${CYAN}u)${NC} ⬆️  Mise à jour (scripts/update.sh)"
    echo -e "  ${CYAN}d)${NC} 🩺 Diagnostics (scripts/doctor.sh)"
    echo -e "  ${RED}0)${NC} ❌ Quitter"
    echo ""
    echo -n "Votre choix: "
}

# Boucle principale
while true; do
    show_menu
    read -r choice
    
    case $choice in
        1)
            do_full_deploy
            ;;
        2)
            do_restart
            ;;
        3)
            print_header
            do_pull
            ;;
        4)
            print_header
            do_build
            ;;
        5)
            print_header
            do_stop
            ;;
        6)
            print_header
            do_start
            ;;
        7)
            print_header
            do_logs
            ;;
        8)
            print_header
            do_status
            ;;
        9)
            print_header
            echo -e "${YELLOW}=== REBUILD + RESTART ===${NC}"
            echo ""
            do_stop
            echo ""
            do_build
            echo ""
            do_start
            echo ""
            sleep 3
            do_status
            print_success "Rebuild + Restart terminé!"
            ;;
        u|U)
            do_update
            ;;
        d|D)
            do_doctor
            ;;
        0|q|Q)
            echo ""
            print_status "Au revoir!"
            exit 0
            ;;
        *)
            print_error "Option invalide"
            ;;
    esac
    
    echo ""
    echo -e "${CYAN}Appuyez sur Entrée pour continuer...${NC}"
    read -r
done
