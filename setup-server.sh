#!/bin/bash
# Setup script for initial server configuration

set -e

echo "🔧 HVLSV Tools - Initial Server Setup"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Python and dependencies
echo "📦 Installing Python..."
apt install -y python3 python3-pip python3-venv

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install Certbot
echo "📦 Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Install FFmpeg
echo "📦 Installing FFmpeg..."
apt install -y ffmpeg

# Install Git
echo "📦 Installing Git..."
apt install -y git

# Create app user
echo "👤 Creating hvlsv user..."
if id "hvlsv" &>/dev/null; then
    echo "User hvlsv already exists"
else
    adduser hvlsv --disabled-password --gecos ""
    echo "User hvlsv created"
fi

# Setup firewall
echo "🛡️  Setting up firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

# Install fail2ban
echo "🛡️  Installing fail2ban..."
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

echo ""
echo "✅ Server setup completed!"
echo ""
echo "Next steps:"
echo "1. Switch to hvlsv user: su - hvlsv"
echo "2. Clone repository: git clone https://github.com/yourusername/hvlsv-tool.git"
echo "3. Follow README.md for deployment"
