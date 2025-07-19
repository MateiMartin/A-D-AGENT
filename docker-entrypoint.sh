#!/bin/sh

echo "🚀 Starting A-D-AGENT Docker Container..."
echo "=================================================="

# Create flags.txt if it doesn't exist
touch /app/flags.txt
echo "📁 Created flags.txt file for logging found flags"

# Create tmp directory for exploits
mkdir -p /app/tmp
echo "📂 Created tmp directory for exploit scripts"

# Debug: List the file structure and network info
echo "📋 File structure check:"
echo "  - Frontend dist: $(ls -la /app/frontend/dist/ 2>/dev/null | wc -l) files"
echo "  - Assets folder: $(ls -la /app/frontend/dist/assets/ 2>/dev/null | wc -l) files"
echo "  - Backend binary: $(ls -la /app/backend/main 2>/dev/null && echo "✅ Found" || echo "❌ Missing")"

echo "🌐 Network diagnostics:"
echo "  - Container IP: $(hostname -i 2>/dev/null || echo "N/A")"
echo "  - DNS servers: $(cat /etc/resolv.conf | grep nameserver | head -3 || echo "N/A")"
echo "  - Default route: $(ip route show default 2>/dev/null | head -1 || echo "N/A")"

# Start the backend server (which now serves both API and frontend)
echo "🔧 Starting A-D-AGENT server on port 1337..."
cd /app
./backend/main &
SERVER_PID=$!

# Wait a moment for server to start
sleep 5

# Check if server is running
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ A-D-AGENT server started successfully (PID: $SERVER_PID)"
else
    echo "❌ Failed to start A-D-AGENT server"
    exit 1
fi

echo "=================================================="
echo "🎯 A-D-AGENT is ready for Attack & Defense!"
echo "🌐 Access the application at: http://localhost:1337"
echo "🚩 Flags will be logged to: /app/flags.txt"
echo "📊 API endpoints available at: http://localhost:1337/api/"
echo "=================================================="

# Function to handle graceful shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down A-D-AGENT..."
    echo "Stopping server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null
    echo "✅ Shutdown complete"
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGTERM SIGINT

# Monitor the server process and restart if it crashes
while true; do
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo "⚠️  Server crashed! Restarting..."
        cd /app
        ./backend/main &
        SERVER_PID=$!
        sleep 3
        if kill -0 $SERVER_PID 2>/dev/null; then
            echo "✅ Server restarted successfully (PID: $SERVER_PID)"
        else
            echo "❌ Failed to restart server"
            exit 1
        fi
    fi
    
    sleep 5
done
