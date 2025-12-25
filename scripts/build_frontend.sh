#!/usr/bin/env bash
# Build the BirdVibes React frontend
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$REPO_DIR/frontend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Building BirdVibes Frontend${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js not installed${NC}"
    echo "Install with: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ required (found v$NODE_VERSION)${NC}"
    exit 1
fi

cd "$FRONTEND_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Build for production
echo -e "${YELLOW}Building production bundle...${NC}"
npm run build

echo -e "${GREEN}Build complete!${NC}"
echo "Output: $FRONTEND_DIR/dist/"
