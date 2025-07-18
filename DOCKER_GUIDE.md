# A-D-AGENT Docker Scripts Guide

## Fixed Docker Build Issue

**Problem**: The original Dockerfile used `npm ci --only=production` which skipped dev dependencies, but Vite (needed for building) was in devDependencies.

**Solution**: Changed to `npm ci` to install all dependencies during build phase. This is correct because:
- Build tools like Vite are needed during Docker build
- Final image only contains the built frontend (dist/) not the source or dev dependencies
- This keeps the final image size small while ensuring proper builds

## Script Differences

### `start.sh` / `start.bat` (Host Machine)
- **Purpose**: Main launcher script that runs on your machine (Linux/Windows)
- **What it does**:
  - Checks if Docker is running
  - Cleans up previous containers and data automatically
  - Backs up old flags.txt files with timestamps
  - Builds Docker image with fresh cache (`--no-cache`)
  - Starts the application using docker-compose
- **When to use**: Every time you want to start A-D-AGENT

### `docker-entrypoint.sh` (Inside Container)
- **Purpose**: Container initialization script that runs inside Docker
- **What it does**:
  - Creates necessary files and directories (`flags.txt`, `tmp/`)
  - Starts the Go backend server
  - Monitors server health and restarts if it crashes
  - Handles graceful shutdown when container stops
- **When to use**: Automatically called by Docker (you don't run this directly)

### `cleanup.sh` / `cleanup.bat` (Host Machine)
- **Purpose**: Safe cleanup script that only affects A-D-AGENT
- **What it does**:
  - Stops A-D-AGENT containers and removes volumes
  - Removes only A-D-AGENT Docker images
  - Backs up and clears A-D-AGENT data files
  - **Preserves other Docker containers and images**
- **When to use**: When you want to reset A-D-AGENT without affecting other Docker projects

## Usage

### Linux/WSL
```bash
# Normal startup (recommended)
./start.sh

# Safe cleanup (A-D-AGENT only)
./cleanup.sh
./start.sh
```

### Windows
```cmd
REM Normal startup (recommended)
start.bat

REM Safe cleanup (A-D-AGENT only)
cleanup.bat
start.bat
```

### Manual Control
```bash
# Stop without cleanup
docker-compose down

# Start without rebuild
docker-compose up

# Rebuild only
docker-compose build
```

## Data Persistence

- **flags.txt**: Automatically backed up with timestamps before cleanup
- **tmp/**: Cleared on each start (contains temporary exploit scripts)
- **Docker volumes**: Completely reset with each start script run

## Benefits of New Setup

1. **Always Fresh Start**: No stale data or containers
2. **Data Safety**: Automatic backup of flag files
3. **Force Rebuild**: Ensures latest code is always used
4. **Clean Environment**: No conflicts from previous runs
5. **Easy Recovery**: Separate cleanup script for deep resets
6. **Cross-Platform**: Works on both Linux and Windows
