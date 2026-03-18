#!/bin/bash

# ============================================
# Freemen Printer Proxy - Deployment Manager
# ============================================

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Se placer dans le répertoire du script
cd "$(dirname "$0")"

# Fonctions
print_header() {
    clear
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         FREEMEN PRINTER PROXY - DEPLOYMENT MANAGER           ║"
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

# Actions individuelles
do_pull() {
    print_status "Pull des dernières modifications..."
    if git pull; then
        print_success "Pull réussi"
        return 0
    else
        print_error "Échec du pull"
        return 1
    fi
}

do_stop() {
    print_status "Arrêt des conteneurs existants..."
    if docker-compose down 2>/dev/null || docker compose down 2>/dev/null; then
        print_success "Conteneurs arrêtés"
        return 0
    else
        print_warning "Aucun conteneur à arrêter ou erreur"
        return 0
    fi
}

do_build() {
    print_status "Construction de l'image Docker..."
    if docker-compose build --no-cache 2>/dev/null || docker compose build --no-cache 2>/dev/null; then
        print_success "Build réussi"
        return 0
    else
        print_error "Échec du build"
        return 1
    fi
}

do_start() {
    print_status "Démarrage des conteneurs..."
    if docker-compose up -d 2>/dev/null || docker compose up -d 2>/dev/null; then
        print_success "Conteneurs démarrés"
        return 0
    else
        print_error "Échec du démarrage"
        return 1
    fi
}

do_logs() {
    print_status "Affichage des logs (Ctrl+C pour quitter)..."
    docker-compose logs -f 2>/dev/null || docker compose logs -f 2>/dev/null
}

do_status() {
    print_status "Statut des conteneurs:"
    echo ""
    docker-compose ps 2>/dev/null || docker compose ps 2>/dev/null
    echo ""
    print_status "Santé du service:"
    curl -s http://localhost:6500/health | jq . 2>/dev/null || curl -s http://localhost:6500/health
    echo ""
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

# Menu principal
show_menu() {
    print_header
    echo -e "${YELLOW}Choisissez une option:${NC}"
    echo ""
    echo -e "  ${GREEN}1)${NC} Déploiement complet (pull + build + restart)"
    echo -e "  ${GREEN}2)${NC} Redémarrage rapide (stop + start)"
    echo -e "  ${GREEN}3)${NC} Pull uniquement"
    echo -e "  ${GREEN}4)${NC} Build uniquement"
    echo -e "  ${GREEN}5)${NC} Stop conteneurs"
    echo -e "  ${GREEN}6)${NC} Start conteneurs"
    echo -e "  ${GREEN}7)${NC} Voir les logs"
    echo -e "  ${GREEN}8)${NC} Voir le statut"
    echo -e "  ${GREEN}9)${NC} Rebuild + Restart (sans pull)"
    echo -e "  ${RED}0)${NC} Quitter"
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
        0)
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
