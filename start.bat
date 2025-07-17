REM For Windows users
@echo off
echo 🚀 Building and starting A-D-AGENT for Attack ^& Defense...
echo ===============================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Clean up previous containers and data
echo 🧹 Cleaning up previous containers and data...

REM Stop and remove existing containers
docker ps -a | findstr "ad-agent" >nul 2>&1
if not errorlevel 1 (
    echo 🛑 Stopping existing ad-agent container...
    docker-compose down --remove-orphans
)

REM Remove existing Docker images to force rebuild
docker images | findstr "a-d-agent" >nul 2>&1
if not errorlevel 1 (
    echo 🗑️  Removing old Docker images...
    for /f "tokens=3" %%i in ('docker images ^| findstr "a-d-agent"') do docker rmi %%i 2>nul
)

REM Clear previous data files
echo 🗂️  Clearing previous data...
if exist "flags.txt" (
    set timestamp=%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set timestamp=%timestamp: =0%
    echo   - Backing up old flags.txt to flags_backup_%timestamp%.txt
    move "flags.txt" "flags_backup_%timestamp%.txt"
)

if exist "tmp" (
    echo   - Clearing tmp directory...
    del /q "tmp\*" 2>nul
)

REM Create fresh directories
if not exist "tmp" mkdir tmp
echo. > flags.txt

echo ✅ Cleanup complete!
echo.

REM Build and run with docker-compose
echo 🔨 Building Docker image...
docker-compose build --no-cache

if %errorlevel% equ 0 (
    echo ✅ Build successful!
    echo 🚀 Starting A-D-AGENT...
    echo ==================================================
    echo 🎯 A-D-AGENT will be available at: http://localhost:1337
    echo 🚩 Flags will be logged to: .\flags.txt
    echo 📊 API endpoints at: http://localhost:1337/api/
    echo ==================================================
    echo.
    docker-compose up
) else (
    echo ❌ Build failed!
    exit /b 1
)
