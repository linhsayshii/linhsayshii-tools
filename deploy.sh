#!/bin/bash
# Unified deployment & setup script for hnglinh Tools

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function: Initial Server Setup
run_setup() {
    echo -e "${BLUE}🔧 hnglinh-tools - Initial Server Setup${NC}"
    echo "======================================"
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then 
        echo -e "${RED}❌ Please run setup as root (use: sudo ./deploy.sh --setup)${NC}"
        exit 1
    fi

    # Update system
    echo -e "${BLUE}📦 Updating system...${NC}"
    apt update && apt upgrade -y

    # Install Node.js 20.x
    echo -e "${BLUE}📦 Installing Node.js 20.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs

    # Install Python and dependencies
    echo -e "${BLUE}📦 Installing Python...${NC}"
    apt install -y python3 python3-pip python3-venv

    # Install Nginx
    echo -e "${BLUE}📦 Installing Nginx...${NC}"
    apt install -y nginx

    # Install Certbot
    echo -e "${BLUE}📦 Installing Certbot...${NC}"
    apt install -y certbot python3-certbot-nginx

    # Install FFmpeg
    echo -e "${BLUE}📦 Installing FFmpeg...${NC}"
    apt install -y ffmpeg

    # Install Git
    echo -e "${BLUE}📦 Installing Git...${NC}"
    apt install -y git

    # Create app user
    echo -e "${BLUE}👤 Creating hnglinh user...${NC}"
    if id "hnglinh" &>/dev/null; then
        echo "User hnglinh already exists"
    else
        adduser hnglinh --disabled-password --gecos ""
        usermod -aG sudo hnglinh
        echo "User hnglinh created and added to sudo group"
    fi

    # Setup firewall
    echo -e "${BLUE}🛡️  Setting up firewall...${NC}"
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "y" | ufw enable

    # Install fail2ban
    echo -e "${BLUE}🛡️  Installing fail2ban...${NC}"
    apt install -y fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban

    echo ""
    echo -e "${GREEN}✅ Server setup completed!${NC}"
    echo ""
    echo "Next steps:"
    echo -e "1. Switch to app user: ${BLUE}su - hnglinh${NC}"
    echo -e "2. Clone repository: ${BLUE}git clone https://github.com/linhsayshii/linhsayshii-tools.git${NC}"
    echo -e "3. Follow ${YELLOW}manual_deploy.md${NC} to configure Systemd and Nginx."
    exit 0
}

# Check if setup argument is passed
if [ "$1" == "--setup" ]; then
    run_setup
fi

# ==========================================
# Standard Deployment Flow (Quick Update)
# ==========================================
echo -e "${BLUE}🚀 Starting deployment...${NC}"

# Pull latest code
echo -e "${BLUE}📥 Pulling latest code...${NC}"
git pull origin main

# Backend deployment
echo -e "${BLUE}🔧 Deploying Backend...${NC}"
cd backend
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating one...${NC}"
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
deactivate
cd ..

echo -e "${GREEN}✅ Restarting backend service...${NC}"
sudo systemctl restart hnglinh-api

# Frontend deployment
echo -e "${BLUE}🎨 Building Frontend...${NC}"
cd frontend
npm install --silent
npm run build
cd ..

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Check services
echo -e "${BLUE}🔍 Checking services...${NC}"
if sudo systemctl is-active --quiet hnglinh-api; then
    echo -e "${GREEN}✅ Backend (hnglinh-api) is running${NC}"
else
    echo -e "${RED}❌ Backend (hnglinh-api) is NOT running!${NC}"
    sudo systemctl status hnglinh-api
    exit 1
fi

if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx is NOT running!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "Website: ${BLUE}https://hnglinh.io.vn${NC}"
echo -e "API:     ${BLUE}https://hnglinh.io.vn/api/${NC}"
