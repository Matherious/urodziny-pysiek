#!/bin/bash

# Urodziny v2 Transfer Helper
# Packs the project and serves it over HTTP for easy LAN transfer.

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_NAME="urodziny_v2_transfer"
ZIP_NAME="${PROJECT_NAME}.zip"

echo -e "${BLUE}=== Preparing ${PROJECT_NAME} for transfer ===${NC}"

# 1. Clean previous artifacts
if [ -f "$ZIP_NAME" ]; then
    echo "Removing old $ZIP_NAME..."
    rm "$ZIP_NAME"
fi

# 2. Create Zip Archive
echo -e "${YELLOW}Compressing project files...${NC}"
echo "(Excluding node_modules, .next, .git, .env for safety/size)"

# Using zip with exclusion list
# -r: recursive
# -q: quiet
# -x: exclude pattern
zip -r -q "$ZIP_NAME" . \
    -x "node_modules/*" \
    -x ".next/*" \
    -x ".git/*" \
    -x ".env" \
    -x "*.DS_Store" \
    -x "dist/*" \
    -x "tmp/*"

echo -e "${GREEN}✓ Archive created: $ZIP_NAME${NC}"
FILE_SIZE=$(ls -lh "$ZIP_NAME" | awk '{print $5}')
echo "Size: $FILE_SIZE"

# 3. Get Local IP Address
# Try to get IP on typical interfaces (en0 for Wi-Fi on Mac usually)
IP_ADDR=$(ipconfig getifaddr en0)

if [ -z "$IP_ADDR" ]; then
    # Fallback attempt
    IP_ADDR=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | cut -d\  -f2 | head -1)
fi

PORT=8000

echo -e "\n${BLUE}=== READY TO SHARE ===${NC}"
echo -e "Tell your colleague to open this URL in their browser:"
echo -e "${GREEN}http://${IP_ADDR}:${PORT}/${ZIP_NAME}${NC}"
echo -e "\nOr run this command on their machine:"
echo -e "curl -O http://${IP_ADDR}:${PORT}/${ZIP_NAME}"

echo -e "\n${YELLOW}Starting server... (Press Ctrl+C to stop)${NC}"

# 4. Start Python HTTP Server
# Python 3 is installed on most Macs
python3 -m http.server $PORT
