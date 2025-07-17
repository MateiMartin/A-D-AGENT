@echo off
echo 🚀 Building and starting A-D-AGENT for Attack ^& Defense...
echo ===============================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Build and run with docker-compose
echo 🔨 Building Docker image...
docker-compose build

if %errorlevel% equ 0 (
    echo ✅ Build successful!
    echo 🚀 Starting A-D-AGENT...
    docker-compose up
) else (
    echo ❌ Build failed!
    exit /b 1
)
