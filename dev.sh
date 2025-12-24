#!/bin/bash
# BirdNET-Pi Development Server
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

cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    kill $PHP_PID 2>/dev/null || true
    kill $VITE_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check dependencies
if ! command -v php &> /dev/null; then
    echo -e "${RED}Error: PHP not installed${NC}"
    echo "Install with: sudo apt install php php-sqlite3"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm not installed${NC}"
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

echo -e "${GREEN}Starting BirdNET-Pi Development Servers${NC}"
echo "=================================="

# Start PHP backend
echo -e "${YELLOW}Starting PHP backend on :$PHP_PORT${NC}"
cd "$SCRIPT_DIR"
php -S localhost:$PHP_PORT router.php &
PHP_PID=$!

sleep 1

# Check if PHP started
if ! kill -0 $PHP_PID 2>/dev/null; then
    echo -e "${RED}Failed to start PHP server${NC}"
    exit 1
fi

# Start Vite frontend
echo -e "${YELLOW}Starting React frontend on :$VITE_PORT${NC}"
cd "$SCRIPT_DIR/frontend"
npm run dev &
VITE_PID=$!

echo ""
echo -e "${GREEN}Servers running:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:$VITE_PORT${NC}"
echo -e "  Backend:  ${GREEN}http://localhost:$PHP_PORT${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"

# Wait for either process to exit
wait
