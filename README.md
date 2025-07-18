# A-D-AGENT 🚀

**A-D-AGENT** is a comprehensive web-based exploit development and management platform designed specifically for **Attack & Defense (A-D) Capture The Flag (CTF)** competitions. It provides a VS Code-like interface for writing, testing, and automatically executing Python exploits against multiple target services.

## ✨ Features

### 🖥️ **Web-Based IDE**
- **VS Code-like Interface**: Familiar file explorer, code editor with syntax highlighting
- **Monaco Editor**: Full-featured code editor with Python syntax highlighting
- **Tabbed Interface**: Switch between Code Editor and Statistics views
- **Persistent State**: Automatically saves your work using localStorage

### 🔧 **Exploit Development**
- **Service-Based Organization**: Organize exploits by target services
- **Template Generation**: New files come with pre-configured headers and structure
- **Real-time Testing**: Run exploits directly from the interface with custom IP targets
- **AI-Powered Rewriting**: Improve code quality using OpenAI integration

### 🎯 **Automated Attack Execution**
- **Continuous Scanning**: Automatically runs all exploits against configured target IPs
- **Concurrent Execution**: Multiple exploits run simultaneously for efficiency
- **Timeout Protection**: 5-second timeout prevents hanging exploits
- **Smart Retry Logic**: Failed exploits are retried based on error response analysis

### 🚩 **Flag Management**
- **Automatic Detection**: Finds flags using configurable regex patterns
- **Deduplication**: Prevents duplicate flag submissions
- **Persistent Logging**: All captured flags logged to `flags.txt` with timestamps
- **Batch Submission**: Configurable flag submission (single or batch mode)
- **Retry Logic**: Intelligently retries flag submission on specific error conditions

### 📊 **Real-time Statistics & Monitoring**
- **Live Dashboard**: Real-time statistics showing flag capture rates by IP/service
- **Event Timeline**: Detailed activity log with timestamps and status indicators
- **Performance Metrics**: Track exploit success rates, timeouts, and errors
- **Auto-refresh**: Statistics update every 10 seconds automatically

### 🐳 **Docker Integration**
- **One-Command Deployment**: Complete containerized setup
- **Multi-stage Build**: Optimized Docker image with Go backend and React frontend
- **Volume Persistence**: Flag data persists between container restarts
- **Easy Cleanup**: Smart cleanup scripts that preserve other Docker projects

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MateiMartin/A-D-AGENT.git
   cd A-D-AGENT
   ```

2. **Configure for your CTF** (see Configuration section below):
   ```bash
   nano config.go  # Edit target IPs, services, and flag submission settings
   ```

3. **Start the application**:
   ```bash
   # Linux/WSL
   ./start.sh
   
   # Windows
   start.bat
   ```

4. **Access the interface**:
   - Open your browser to `http://localhost:1337`
   - You'll see the VS Code-like interface ready for exploit development

## ⚙️ Configuration

A-D-AGENT is configured entirely through the `config.go` file. This allows you to customize the tool for any CTF environment:

### 🎯 **Target Services Configuration**

```go
// Define your target services and IP ranges
var Service1 = Service{
    Name: "WebService",    // Service name (no spaces)
    IPs:  helper.GenerateIPRange("10.10.%d.10", 1, 50), // Targets 10.10.1.10 to 10.10.50.10
}

var Service2 = Service{
    Name: "DatabaseService",
    IPs:  []string{"192.168.1.100", "192.168.1.101"}, // Specific IPs
}
```

### 🚩 **Flag Configuration**

```go
// Customize flag format for your CTF
const FLAG_REGEX = `CTF{[a-zA-Z0-9_]+}`  // Standard CTF flag format
// Examples for other formats:
// const FLAG_REGEX = `flag{[a-zA-Z0-9_]+}`
// const FLAG_REGEX = `[A-Z0-9]{32}`  // MD5-like flags
```

### ⏱️ **Timing Configuration**

```go
// How often to run all exploits (in seconds)
var TickerInterval = 10 * time.Second  // Run every 10 seconds

// Exclude your own team's IPs from attacks
var MYSERVICES_IPS = []string{
    "10.10.100.10",  // Your team's IP
    "10.10.100.11",  // Your team's backup IP
}
```

### 📤 **Flag Submission Configuration**

```go
// Flag submission endpoint
var URL = "http://ctf-checker.example.com/submit"

// HTTP headers for authentication
var HEADERS = map[string]string{
    "Authorization": "Bearer your-token",
    "Content-Type":  "application/json",
    // Add session cookies, API keys, etc.
}

// Batch vs single submission
var NUMBER_OF_FLAGS_TO_SEND_AT_ONCE = 5  // Send 5 flags per request
// Set to 1 for single flag submission

// JSON key for flags in submission
var FLAG_KEY = "flags"  // {"flags": ["CTF{...}", "CTF{...}"]}

// Error messages that trigger retry (don't remove flags from queue)
var ERROR_MESSAGES = []string{
    "Rate limit exceeded",
    "Temporary server error",
    "Database unavailable",
}
```

### 🤖 **AI Integration (Optional)**

```go
// OpenAI API key for code improvement features
var OPENAI_API_KEY = "sk-your-openai-api-key-here"
// Leave empty to disable AI features
```

## 📝 Creating and Managing Exploits

### 1. **Create New Exploit**
   - Click the `+` button in the file explorer
   - Select target service from dropdown
   - Enter filename (`.py` extension added automatically)
   - Start coding with the provided template

### 2. **Exploit Template Structure**
   ```python
   import requests
   import sys

   host = sys.argv[1]  # Target IP passed automatically

   # =============================================
   # ===== WRITE YOUR CODE BELOW THIS LINE =====
   # =============================================

   # Your exploit code here
   # The output should contain the flag for automatic detection
   ```

### 3. **Testing Exploits**
   - Click the "▶️ Run" button in the code editor
   - Enter a target IP address
   - View real-time output and any captured flags

### 4. **AI Code Improvement**
   - Click the "🤖 AI Rewrite" button
   - AI will clean up and optimize your code while preserving functionality
   - Review and apply changes as needed

## 📊 Monitoring & Statistics

### **Statistics Dashboard**
- **Flag Statistics**: Cards showing flags captured per IP/service
- **Total Flags**: Overall count of unique flags captured
- **Last Capture**: Timestamp of most recent flag from each target

### **Event Timeline**
- **🚩 Flag Captured**: New flag found and logged
- **✅ Exploit Success**: Exploit ran successfully with flag found
- **✔️ Exploit Completed**: Exploit ran without errors but no flag found
- **⏰ Exploit Timeout**: Exploit exceeded 5-second timeout
- **❌ Exploit Error**: Exploit failed with error
- **📤 Flag Submitted**: Flags successfully submitted to checker

### **Real-time Updates**
- Statistics refresh every 10 seconds automatically
- Manual refresh button available
- Persistent event history (last 50 events)

## 📁 File Management

### **Automatic Saving**
- All code changes automatically sync to backend
- Files stored in project's `tmp/` directory
- Format: `exploit_{service}_{filename}.py`

### **Persistent Storage**
- Exploits persist between application restarts
- Flag data saved to `flags.txt` with timestamps
- Configuration preserved in localStorage

### **File Operations**
- **Create**: New files with service-specific templates
- **Edit**: Real-time code editing with syntax highlighting
- **Delete**: Safe deletion with confirmation dialogs
- **Run**: Test individual exploits with custom targets

## 🔄 Automated Operation Flow

1. **Continuous Scanning**: Every 10 seconds (configurable), A-D-AGENT:
   - Finds all exploit files in `tmp/` directory
   - Runs each exploit against all target IPs for its service
   - Excludes your team's IPs from attacks

2. **Flag Detection**: When an exploit runs:
   - Output scanned for flag patterns using regex
   - New flags added to internal queue
   - Duplicates automatically filtered out
   - Flags logged to `flags.txt` immediately

3. **Flag Submission**: Every 30 seconds (TickerInterval + 20s):
   - Collects all queued flags
   - Submits to configured checker endpoint
   - Handles retry logic for temporary failures
   - Removes successfully submitted flags from queue

4. **Statistics Updates**: Real-time tracking of:
   - Flags captured per IP/service
   - Exploit success/failure rates
   - Event timeline with detailed logging

## 🛠️ Management Commands

### **Normal Operation**
```bash
# Start A-D-AGENT (includes automatic cleanup)
./start.sh        # Linux/WSL
start.bat         # Windows
```

### **Manual Cleanup**
```bash
# Clean up A-D-AGENT containers/data only
./cleanup.sh      # Linux/WSL
cleanup.bat       # Windows
```

### **Debugging**
```bash
# View container logs
docker logs ad-agent

# Access container shell
docker exec -it ad-agent sh

# Check flag file
cat flags.txt

# Monitor exploit files
ls -la tmp/
```

## 🎯 CTF Competition Usage

### **Pre-Competition Setup**
1. Configure `config.go` with target IP ranges and flag format
2. Set up flag submission endpoint and authentication
3. Test with sample exploits to verify connectivity
4. Deploy using `./start.sh`

### **During Competition**
1. Create exploits for each discovered service
2. Test exploits using the "Run" feature
3. Monitor statistics dashboard for success rates
4. Watch event timeline for real-time activity
5. Use AI rewrite to optimize slow or failing exploits

### **Flag Submission Strategy**
- Flags automatically submitted every 30 seconds
- Failed submissions retried on next cycle
- All flags logged to `flags.txt` for backup
- Statistics show submission success rates

## 🔧 Advanced Configuration

### **Custom Flag Patterns**
```go
// Multiple flag formats
const FLAG_REGEX = `(CTF{[^}]+}|flag{[^}]+}|[A-F0-9]{32})`
```

### **Dynamic IP Ranges**
```go
// Generate large IP ranges
Service{
    Name: "WebServers",
    IPs:  helper.GenerateIPRange("172.16.%d.10", 1, 255), // 255 targets
}
```

### **Complex Headers**
```go
var HEADERS = map[string]string{
    "Authorization":     "Bearer " + os.Getenv("CTF_TOKEN"),
    "X-Team-ID":        "team-123",
    "User-Agent":       "A-D-AGENT/1.0",
    "X-Submission-Key": "your-submission-key",
}
```

## 🎮 Example CTF Scenario

**Scenario**: CTF with 3 services across 50 teams (IP range 10.10.1-50.X)

```go
// config.go setup
var WebService = Service{
    Name: "WebService",
    IPs:  helper.GenerateIPRange("10.10.%d.80", 1, 50),
}

var DatabaseService = Service{
    Name: "DatabaseService", 
    IPs:  helper.GenerateIPRange("10.10.%d.3306", 1, 50),
}

var SSHService = Service{
    Name: "SSHService",
    IPs:  helper.GenerateIPRange("10.10.%d.22", 1, 50),
}

// Your team is team 25
var MYSERVICES_IPS = []string{
    "10.10.25.80",   // Your web service
    "10.10.25.3306", // Your database
    "10.10.25.22",   // Your SSH service
}

// CTF-specific flag format
const FLAG_REGEX = `DUCTF{[a-zA-Z0-9_]+}`

// Flag submission to CTF platform
var URL = "https://ctf.example.com/api/submit"
var HEADERS = map[string]string{
    "Authorization": "Bearer your-team-token",
    "Content-Type":  "application/json",
}
```

**Result**: A-D-AGENT will automatically attack 147 targets (49 teams × 3 services) every 10 seconds, capture flags, and submit them to the CTF platform.

---

## 🤝 Contributing

Contributions are welcome! Please read [DEVELOPMENT.md](DEVELOPMENT.md) for technical details about the codebase architecture.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Ready to dominate your next A-D CTF? Configure `config.go` and let A-D-AGENT do the heavy lifting while you focus on developing winning exploits! 🏆**
