#!/bin/bash
# Party App - Production Start Script

# Note: This script expects to be run either from a system with Node
# OR via the bootstrap.sh script which sets up the local environment.

echo "🚀 Starting Production Setup..."

# 1. Install Dependencies
echo "📦 Installing modules..."
npm install

# 2. Database Setup
echo "🗄️  Setting up Database..."
npx prisma generate
npx prisma db push

# 3. Build Application
echo "🏗️  Building Next.js App..."
npm run build

# 4. Start Server
echo "✅ Setup Complete. Starting Server..."
echo "👉 Application will be available at http://localhost:3000"
npm start
