# A-D-AGENT Docker Scripts Guide

## Script Differences

### `start.sh` (Host Machine)
- **Purpose**: Main launcher script that runs on your Windows machine
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

### `cleanup.sh` (Host Machine)
- **Purpose**: Complete reset script for deep cleaning
- **What it does**:
  - Stops all containers and removes volumes
  - Removes all Docker images related to A-D-AGENT
  - Backs up and clears all data files
  - Cleans Docker system cache
- **When to use**: When you want to completely reset everything

## Usage

### Normal Startup (Recommended)
```bash
./start.sh
```
This automatically cleans up and starts fresh.

### Complete Reset (When needed)
```bash
./cleanup.sh
./start.sh
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
- **Docker volumes**: Completely reset with each start.sh run

## Benefits of New Setup

1. **Always Fresh Start**: No stale data or containers
2. **Data Safety**: Automatic backup of flag files
3. **Force Rebuild**: Ensures latest code is always used
4. **Clean Environment**: No conflicts from previous runs
5. **Easy Recovery**: Separate cleanup script for deep resets
