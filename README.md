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

A-D-AGENT supports multiple flag submission methods to work with different CTF infrastructures:

```go
// Choose submission method: "http", "netcat", or "both"
var SUBMISSION_METHOD = "http"

// HTTP Submission Configuration (when using "http" or "both")
var URL = "http://ctf-checker.example.com/submit"
var HEADERS = map[string]string{
    "Authorization": "Bearer your-token",
    "Content-Type":  "application/json",
    // Add session cookies, API keys, etc.
}
var FLAG_KEY = "flags"  // JSON key: {"flags": ["CTF{...}", "CTF{...}"]}
var NUMBER_OF_FLAGS_TO_SEND_AT_ONCE = 5  // Batch size (HTTP only)

// Netcat Submission Configuration (when using "netcat" or "both")
var NETCAT_HOST = "10.10.10.1"      // Flag server IP/hostname
var NETCAT_PORT = 9999               // Flag server port
var NETCAT_TIMEOUT = 10              // Connection timeout (seconds)
var NETCAT_FORMAT = "flag_newline"   // Format: "flag_only", "flag_newline", "submit_prefix", "json"

// Error messages that trigger retry (apply to both methods)
var ERROR_MESSAGES = []string{
    "Rate limit exceeded",
    "Temporary server error", 
    "Database unavailable",
}
```

**Submission Method Options:**
- **`"http"`**: Submit flags via HTTP/HTTPS requests (most common)
- **`"netcat"`**: Submit flags via raw TCP connections (simple flag servers)
- **`"both"`**: Submit using both methods for maximum reliability

**Netcat Format Options:**
- **`"flag_only"`**: Send just the flag: `CTF{example_flag}`
- **`"flag_newline"`**: Send flag with newline: `CTF{example_flag}\n`
- **`"submit_prefix"`**: Send with command: `submit CTF{example_flag}`
- **`"json"`**: Send as JSON: `{"flag": "CTF{example_flag}"}`

### 🤖 **AI Integration (Optional)**

```go
// OpenAI API key for code improvement features
var OPENAI_API_KEY = "sk-your-openai-api-key-here"
// Leave empty to disable AI features
```

### 🔧 **Custom Flag Submission Scripts (Advanced)**

For edge cases where the built-in HTTP and netcat submission methods don't meet your CTF's requirements, you can create custom scripts that read flags from `flags.txt`.

**Simple Python Example:**

```python
#!/usr/bin/env python3
import requests
import time

def read_new_flags(filename="flags.txt", last_position=0):
    """Read only new flags since last check"""
    try:
        with open(filename, 'r') as f:
            f.seek(last_position)
            new_content = f.read()
            new_position = f.tell()
        
        new_flags = [line.strip() for line in new_content.splitlines() if line.strip()]
        return new_flags, new_position
    except FileNotFoundError:
        return [], 0

def submit_custom_flag(flag):
    """Your custom submission logic here"""
    response = requests.post("https://your-ctf.com/custom-api", 
                           json={"team": "your_team", "flag": flag},
                           headers={"Authorization": "Bearer your-token"})
    return response.status_code == 200

# Main loop
last_pos = 0
while True:
    new_flags, last_pos = read_new_flags(last_position=last_pos)
    for flag in new_flags:
        if submit_custom_flag(flag):
            print(f"✅ Submitted: {flag}")
        else:
            print(f"❌ Failed: {flag}")
    time.sleep(10)  # Check every 10 seconds
```

**Use Cases:**
- Complex authentication (OAuth, SAML, multi-step auth)
- Legacy systems (Telnet, SSH-based submission)  
- Custom protocols or proprietary APIs
- Integration with external tools (Slack, Discord bots)

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

## ⚙️ How A-D-AGENT Works

### **Automated Attack Cycle**

1. **Exploit Discovery**: Every 10 seconds (TickerInterval):
   - Scan `tmp/` directory for Python exploit files
   - Group exploits by service name (filename prefix)
   - Load target IPs from service configuration

2. **Concurrent Execution**: For each service:
   - Run all exploits against all target IPs simultaneously
   - 5-second timeout per exploit execution
   - Capture stdout/stderr from each execution

3. **Flag Detection**: Every 30 seconds (TickerInterval + 20s):
   - Apply FLAG_REGEX to all exploit outputs
   - Deduplicate flags to prevent resubmission
   - Log new flags to `flags.txt` for persistence

4. **Flag Submission**: Submit captured flags via configured method:
   - **HTTP**: Batch or individual submission with retry logic
   - **Netcat**: Individual TCP connections per flag
   - **Both**: Dual submission for maximum reliability

### **Example Attack Flow**

```
Service1_exploit1.py  →  Target: 10.10.1.10  →  Output: "Found CTF{abc123}"
Service1_exploit2.py  →  Target: 10.10.1.10  →  Output: "No response"
Service1_exploit1.py  →  Target: 10.10.2.10  →  Output: "Error 404"
Service2_database.py  →  Target: 192.168.1.1  →  Output: "CTF{xyz789}"

// Flag submission to CTF platform
HTTP POST → {"flags": ["CTF{abc123}", "CTF{xyz789}"]} → ✅ Success
```

## 🚀 Getting Started

### **Quick Start for CTF Competition**

1. **Clone and Build**:
   ```bash
   git clone https://github.com/MateiMartin/A-D-AGENT.git
   cd A-D-AGENT
   ./start.sh  # or start.bat on Windows
   ```

2. **Configure for Your CTF**:
   ```bash
   # Edit configuration for your environment
   nano config.go
   
   # Key settings to change:
   # - SERVICES: Target IP ranges and service definitions
   # - URL: Flag submission endpoint
   # - HEADERS: Authentication headers/cookies
   # - FLAG_REGEX: CTF flag format
   ```

3. **Access A-D-AGENT**:
   - Open http://localhost:1337 in your browser
   - Start writing exploits in the web interface
   - Monitor statistics and captured flags in real-time

### **Typical CTF Workflow**

1. **Reconnaissance**: Identify target services and vulnerabilities
2. **Exploit Development**: Create Python exploits in A-D-AGENT interface
3. **Testing**: Run exploits against specific targets to verify functionality
4. **Deployment**: Save exploits - they'll run automatically every 10 seconds
5. **Monitoring**: Watch statistics dashboard for flag capture and submission status

### **Flag Submission Strategy**

- **Continuous Operation**: Exploits run every 10 seconds automatically
- **Deduplication**: Never submit the same flag twice
- **Retry Logic**: Automatically retry failed submissions on temporary errors
- **Multiple Methods**: Choose HTTP, netcat, or both for maximum compatibility

## 🔧 Advanced Configuration

### **Custom Service Definitions**

```go
// Example: Multi-port service across many teams
var WebServices = Service{
    Name: "WebServices",
    IPs: append(
        helper.GenerateIPRange("10.10.%d.80", 1, 50),   // HTTP on teams 1-50
        helper.GenerateIPRange("10.10.%d.443", 1, 50)... // HTTPS on teams 1-50
    ),
}

// Example: Mixed infrastructure
var MixedTargets = Service{
    Name: "MixedTargets", 
    IPs: []string{
        "192.168.1.100",  // Legacy system
        "172.16.1.50",    // Docker container
        "10.0.0.200",     // Cloud instance
    },
}
```

### **Flag Format Examples**

```go
// Standard formats
const FLAG_REGEX = `CTF{[a-zA-Z0-9_]+}`           // CTF{flag_here}
const FLAG_REGEX = `flag{[^}]+}`                   // flag{anything}
const FLAG_REGEX = `[A-F0-9]{32}`                  // MD5 hash format
const FLAG_REGEX = `(?i)flag_[a-z0-9]{16}`        // Case insensitive

// Multiple formats (alternation)
const FLAG_REGEX = `(CTF{[^}]+}|FLAG{[^}]+}|[A-Z0-9]{32})`
```

### **Submission Method Configuration**

```go
// HTTP-only submission (most common)
var SUBMISSION_METHOD = "http"
var URL = "https://ctf.example.com/submit" 
var HEADERS = map[string]string{
    "Authorization": "Bearer your-token",
    "Content-Type": "application/json",
}

// Netcat-only submission (simple flag servers)
var SUBMISSION_METHOD = "netcat"
var NETCAT_HOST = "10.10.10.1"
var NETCAT_PORT = 9999
var NETCAT_FORMAT = "flag_newline"

// Dual submission (maximum reliability)
var SUBMISSION_METHOD = "both"  // Submit via HTTP AND netcat
```

## 🐳 Docker & Deployment

### **Container Features**
- **Multi-stage build**: Optimized for production deployment
- **Automatic restart**: Container automatically restarts on crashes
- **Volume persistence**: Flags and exploits persist across container restarts
- **Health checks**: Built-in health monitoring for container orchestration
- **Network access**: Full network access for VPN-based CTFs

### **Production Deployment**
```bash
# Production deployment with persistence
docker-compose up -d

# Monitor logs
docker logs -f ad-agent

# Update configuration and restart
nano config.go
docker-compose restart

# Backup flags and exploits
docker cp ad-agent:/app/flags.txt ./backup_flags.txt
docker cp ad-agent:/app/tmp ./backup_exploits
```

---

**A-D-AGENT**: The ultimate automated Attack & Defense tool for CTF competitions! 🎯

