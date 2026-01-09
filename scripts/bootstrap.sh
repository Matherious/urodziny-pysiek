#!/bin/bash
set -e

# Configuration
NODE_VERSION="v20.10.0"
PLATFORM="darwin-arm64"
DIST_DIR=".local-node"
NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-${PLATFORM}.tar.gz"

echo "🔧 Initializing Hermetic Environment (Self-Repair Mode)..."

# 1. Download Node.js if not present
if [ ! -d "${DIST_DIR}" ]; then
    echo "⬇️  Downloading Node.js ${NODE_VERSION} for ${PLATFORM}..."
    curl -o node.tar.gz "${NODE_URL}"
    
    echo "📦 Extracting Node.js..."
    tar -xzf node.tar.gz
    rm node.tar.gz
    
    # Rename for simplicity
    mv "node-${NODE_VERSION}-${PLATFORM}" "${DIST_DIR}"
    echo "✅ Node.js installed locally to ./${DIST_DIR}"
else
    echo "✅ Local Node.js detected."
fi

# 2. Setup PATH
export PATH="$(pwd)/${DIST_DIR}/bin:$PATH"

echo "🧪 Verifying Environment..."
echo "Node: $(node -v)"
echo "NPM:  $(npm -v)"

# 3. Handover to Production Script
echo "Rocket Launch sequence initiated..."
chmod +x scripts/prod-start.sh

# Re-run prod-start.sh but now with the correct PATH
./scripts/prod-start.sh
