@echo off
echo 🧹 A-D-AGENT Complete Cleanup Script
echo =====================================
echo ⚠️  This will remove ALL containers, images, and data!
echo.

set /p confirm="Are you sure you want to proceed? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Cleanup cancelled.
    exit /b 1
)

echo 🛑 Stopping all A-D-AGENT containers...
docker-compose down --remove-orphans --volumes

echo 🗑️  Removing Docker images...
for /f "tokens=3" %%i in ('docker images ^| findstr "a-d-agent"') do docker rmi %%i 2>nul
docker image prune -f

echo 📁 Backing up and clearing data files...
if exist "flags.txt" (
    set timestamp=%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set timestamp=%timestamp: =0%
    move "flags.txt" "flags_backup_%timestamp%.txt"
    echo   - Backed up flags.txt
)

if exist "tmp" (
    del /q "tmp\*" 2>nul
    echo   - Cleared tmp directory
)

echo 🧽 Cleaning Docker system...
docker system prune -f

echo.
echo ✅ Complete cleanup finished!
echo 🚀 You can now run start.bat for a fresh start
