# A-D-AGENT Docker Setup

This Docker setup provides a complete Attack & Defense competition environment for the A-D-AGENT exploit development platform.

## 🚀 Quick Start

### Option 1: Docker Build & Run
```bash
# Build the Docker image
docker build -t ad-agent .

# Run the container
docker run -p 1337:1337 -v $(pwd)/flags.txt:/app/flags.txt ad-agent
```

### Option 2: Docker Compose (Recommended)
```bash
# Build and run with docker-compose
docker-compose up --build

# Run in detached mode
docker-compose up -d --build
```

## 🌐 Access

- **Web Interface**: http://localhost:1337
- **API Endpoints**: http://localhost:1337/api/

## 📁 Features

### Automatic Flag Logging
- All captured flags are automatically logged to `flags.txt`
- Format: `[timestamp] FLAG (from IP - Service)`
- File is persistent and mounted to host system

### Complete Environment
- ✅ Backend API server
- ✅ Frontend web interface with VS Code-like editor
- ✅ Real-time statistics and event tracking
- ✅ Automated exploit execution
- ✅ Flag submission to checker systems
- ✅ File management for exploit scripts

### Pre-installed Python Libraries
- `requests` - HTTP library
- `pycryptodome` - Cryptographic library
- `beautifulsoup4` - HTML parsing
- `urllib3` - HTTP client

## 📊 Usage in Attack & Defense

1. **Access the interface** at http://localhost:1337
2. **Create exploit scripts** using the Code Editor tab
3. **Monitor progress** using the Statistics tab
4. **View captured flags** in the mounted `flags.txt` file
5. **Configure services** in `config.go` before building

## 🔧 Configuration

### Services Configuration
Edit `config.go` before building to configure:
- Target IP ranges
- Service definitions
- Flag submission settings
- Timing intervals

### Environment Variables
- `PORT` - Server port (default: 1337)
- `GIN_MODE` - Gin mode (default: release)

## 📝 Logs & Monitoring

### Container Logs
```bash
# View real-time logs
docker-compose logs -f

# View specific service logs
docker logs ad-agent
```

### Flag Monitoring
```bash
# Monitor flags in real-time
tail -f flags.txt
```

### Health Check
The container includes a health check that verifies the API is responding.

## 🛠 Development

### Rebuilding After Changes
```bash
# Rebuild and restart
docker-compose down
docker-compose up --build
```

### Accessing Container Shell
```bash
# Access running container
docker exec -it ad-agent sh
```

## 📂 Volume Mounts

- `./flags.txt:/app/flags.txt` - Flag logging file
- `./tmp:/app/tmp` - Exploit scripts directory (optional)

## 🔄 Auto-restart

The container automatically restarts if the server process crashes, ensuring high availability during competitions.

## 🏆 Attack & Defense Ready

This setup is optimized for:
- ✅ Rapid deployment in competition environments
- ✅ Persistent flag collection
- ✅ Real-time monitoring and statistics
- ✅ Automated exploit execution cycles
- ✅ Easy service configuration
- ✅ Fault tolerance and auto-recovery
