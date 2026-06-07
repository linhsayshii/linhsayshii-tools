#!/bin/bash
# Quick deployment script for HVLSV Tools

set -e

echo "🚀 Starting deployment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Pull latest code
echo -e "${BLUE}📥 Pulling latest code...${NC}"
git pull origin main

# Backend deployment
echo -e "${BLUE}🔧 Deploying Backend...${NC}"
cd backend
source venv/bin/activate
pip install -r requirements.txt --quiet
cd ..

echo -e "${GREEN}✅ Restarting backend service...${NC}"
sudo systemctl restart hvlsv-api

# Frontend deployment
echo -e "${BLUE}🎨 Building Frontend...${NC}"
cd frontend
npm install --silent
npm run build

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Check services
echo -e "${BLUE}🔍 Checking services...${NC}"
if sudo systemctl is-active --quiet hvlsv-api; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "❌ Backend is NOT running!"
    sudo systemctl status hvlsv-api
    exit 1
fi

if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "❌ Nginx is NOT running!"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "Website: ${BLUE}https://hnglinh.io.vn${NC}"
echo -e "API:     ${BLUE}https://hnglinh.io.vn/api/${NC}"
