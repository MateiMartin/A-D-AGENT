#!/bin/bash

echo "🧹 A-D-AGENT Complete Cleanup Script"
echo "====================================="
echo "⚠️  This will remove ALL containers, images, and data!"
echo ""

read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled."
    exit 1
fi

echo "🛑 Stopping all A-D-AGENT containers..."
docker-compose down --remove-orphans --volumes

echo "🗑️  Removing Docker images..."
# Remove only A-D-AGENT related images
docker rmi $(docker images "a-d-agent*" -q) 2>/dev/null || true
docker rmi $(docker images "*ad-agent*" -q) 2>/dev/null || true

echo "📁 Backing up and clearing data files..."
if [ -f "./flags.txt" ]; then
    mv ./flags.txt "./flags_backup_$(date +%Y%m%d_%H%M%S).txt"
    echo "  - Backed up flags.txt"
fi

if [ -d "./tmp" ]; then
    rm -rf ./tmp/*
    echo "  - Cleared tmp directory"
fi

echo "🧽 A-D-AGENT cleanup complete!"
echo "ℹ️  Note: Other Docker containers and images are preserved"
echo "🚀 You can now run ./start.sh for a fresh start"
