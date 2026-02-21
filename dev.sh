#!/bin/bash
# BirdVibes Development Server
# Runs both PHP backend and React frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PHP_PORT=8080
VITE_PORT=5173

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CLEANED_UP=false

cleanup() {
    if [ "$CLEANED_UP" = true ]; then return; fi
    CLEANED_UP=true

    echo -e "\n${YELLOW}Shutting down servers...${NC}"

    # Kill all child processes of this script (recursive)
    pkill -TERM -P $$ 2>/dev/null || true
    sleep 1
    pkill -KILL -P $$ 2>/dev/null || true

    # Force-release ports in case anything survived
    fuser -k -TERM ${PHP_PORT}/tcp 2>/dev/null || true
    fuser -k -TERM ${VITE_PORT}/tcp 2>/dev/null || true
    sleep 0.5
    fuser -k -KILL ${PHP_PORT}/tcp 2>/dev/null || true
    fuser -k -KILL ${VITE_PORT}/tcp 2>/dev/null || true

    echo -e "${GREEN}Stopped.${NC}"
}

trap cleanup EXIT

# Check dependencies
if ! command -v php &> /dev/null; then
    echo -e "${RED}Error: PHP not installed${NC}"
    echo "Install with: sudo apt install php php-sqlite3"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js not installed${NC}"
    echo "Install Node.js 20+ with:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
    echo "  sudo apt install -y nodejs"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm not installed${NC}"
    exit 1
fi

# Check Node.js version (Vite 7 requires Node 20+)
NODE_MAJOR=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
    echo -e "${RED}Error: Node.js 20+ required (found $(node -v))${NC}"
    echo "Vite 7 requires Node.js 20 or later."
    echo "Upgrade with:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
    echo "  sudo apt install -y nodejs"
    exit 1
fi

# Set up dev environment
setup_dev_env() {
    echo -e "${YELLOW}Setting up development environment...${NC}"

    # Create config directory and symlink
    if [ ! -f /etc/birdnet/birdnet.conf ]; then
        echo -e "${YELLOW}Creating dev config (requires sudo)...${NC}"
        sudo mkdir -p /etc/birdnet
        sudo cp "$SCRIPT_DIR/dev/birdnet.conf" /etc/birdnet/birdnet.conf
        # Update BIRDNET_USER to current user
        sudo sed -i "s/BIRDNET_USER=.*/BIRDNET_USER=$USER/" /etc/birdnet/birdnet.conf
    fi

    # Create mock database if it doesn't exist
    if [ ! -f "$SCRIPT_DIR/scripts/birds.db" ]; then
        echo -e "${YELLOW}Creating mock database...${NC}"
        php "$SCRIPT_DIR/dev/setup_mock_db.php"
    fi
}

# Check if frontend dependencies installed
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd "$SCRIPT_DIR/frontend"
    npm install
fi

# Set up dev environment
setup_dev_env

# Kill anything already on our ports
fuser -k -KILL ${PHP_PORT}/tcp 2>/dev/null || true
fuser -k -KILL ${VITE_PORT}/tcp 2>/dev/null || true

echo -e "${GREEN}Starting BirdVibes Development Servers${NC}"
echo "=================================="

# Get local IP for network access
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')

# Start PHP backend on all interfaces
echo -e "${YELLOW}Starting PHP backend on :$PHP_PORT${NC}"
cd "$SCRIPT_DIR"
php -S 0.0.0.0:$PHP_PORT router.php &

sleep 1

# Check if PHP started
if ! fuser ${PHP_PORT}/tcp &>/dev/null; then
    echo -e "${RED}Failed to start PHP server${NC}"
    exit 1
fi

# Start Vite frontend
echo -e "${YELLOW}Starting React frontend on :$VITE_PORT${NC}"
cd "$SCRIPT_DIR/frontend"
npm run dev &

echo ""
echo -e "${GREEN}Servers running:${NC}"
echo -e "  Local:   ${GREEN}http://localhost:$VITE_PORT${NC}"
if [ -n "$LOCAL_IP" ]; then
echo -e "  Network: ${GREEN}http://$LOCAL_IP:$VITE_PORT${NC}"
fi
echo -e "  Backend: ${GREEN}http://localhost:$PHP_PORT${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"

# Wait for either process to exit
wait
