#!/bin/bash

echo "🚀 Building and starting A-D-AGENT for Attack & Defense..."
echo "==============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Clean up previous containers and data
echo "🧹 Cleaning up previous containers and data..."

# Stop and remove existing containers
if docker ps -a | grep -q "ad-agent"; then
    echo "🛑 Stopping existing ad-agent container..."
    docker-compose down --remove-orphans
fi

# Remove existing Docker images to force rebuild
if docker images | grep -q "a-d-agent"; then
    echo "🗑️  Removing old Docker images..."
    docker rmi $(docker images "a-d-agent*" -q) 2>/dev/null || true
fi

# Clear previous data files
echo "🗂️  Clearing previous data..."
if [ -f "./flags.txt" ]; then
    echo "  - Backing up old flags.txt to flags_backup_$(date +%Y%m%d_%H%M%S).txt"
    mv ./flags.txt "./flags_backup_$(date +%Y%m%d_%H%M%S).txt"
fi

if [ -d "./tmp" ]; then
    echo "  - Clearing tmp directory..."
    rm -rf ./tmp/*
fi

# Create fresh directories
mkdir -p ./tmp
touch ./flags.txt

echo "✅ Cleanup complete!"
echo ""

# Build and run with docker-compose
echo "🔨 Building Docker image..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🚀 Starting A-D-AGENT..."
    echo "=================================================="
    echo "🎯 A-D-AGENT will be available at: http://localhost:1337"
    echo "🚩 Flags will be logged to: ./flags.txt"
    echo "📊 API endpoints at: http://localhost:1337/api/"
    echo "=================================================="
    echo ""
    docker-compose up
else
    echo "❌ Build failed!"
    exit 1
fi
