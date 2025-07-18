package ad_agent

import (
	"ad_agent/helper"
	"time"
)

// ================================================================================
// A-D-AGENT CONFIGURATION FILE
// ================================================================================
// This file contains all configuration settings for A-D-AGENT.
// Modify these settings to customize the tool for your specific CTF environment.
// 
// IMPORTANT: After making changes, rebuild the Docker container:
//   ./start.sh (Linux/WSL) or start.bat (Windows)
//
// For detailed configuration examples, see README.md
// ================================================================================

// ================================================================================
// SERVICE DEFINITIONS
// ================================================================================
// Define your target services and their IP addresses here.
// Each service represents a logical group of targets (e.g., web servers, databases).

// Service represents a group of IP addresses that belong to a logical service
// in your CTF environment (e.g., WebService, DatabaseService, SSHService)
type Service struct {
	Name string   // Service name - MUST NOT contain spaces (used in filenames)
	IPs  []string // List of target IP addresses for this service
}

// ================================================================================
// FLAG DETECTION CONFIGURATION
// ================================================================================

// FLAG_REGEX defines the regular expression pattern used to detect flags in exploit output.
// 
// EXAMPLES for different CTF flag formats:
//   Standard CTF format:     `CTF{[a-zA-Z0-9_]+}`
//   Custom format:           `flag{[a-zA-Z0-9_]+}`
//   MD5-like flags:          `[A-F0-9]{32}`
//   Multiple formats:        `(CTF{[^}]+}|flag{[^}]+}|[A-Z0-9]{32})`
//   Case insensitive:        `(?i)ctf{[a-zA-Z0-9_]+}`
//
// IMPORTANT: Make sure this matches your CTF's actual flag format!
const FLAG_REGEX = `CTF{[a-zA-Z0-9_]+}`

// ================================================================================
// TIMING CONFIGURATION
// ================================================================================

// TickerInterval defines how often A-D-AGENT will run all exploits against all targets.
// 
// CONSIDERATIONS:
//   - Too frequent (< 5s): May overwhelm targets or trigger rate limiting
//   - Too infrequent (> 60s): May miss flag rotation windows
//   - Recommended: 10-30 seconds for most CTFs
//
// EXAMPLES:
//   Fast scanning:     5 * time.Second   (every 5 seconds)
//   Normal scanning:   10 * time.Second  (every 10 seconds) 
//   Slow scanning:     30 * time.Second  (every 30 seconds)
var TickerInterval = 10 * time.Second

// ================================================================================
// TARGET SERVICE DEFINITIONS
// ================================================================================
// Configure your specific target services here.
// You can define as many services as needed for your CTF environment.

// Service1: Example web service targets
// CUSTOMIZE: Change name, IP ranges, and patterns to match your CTF
var Service1 = Service{
	Name: "Service1", // IMPORTANT: No spaces allowed in service names
	
	// OPTION 1: Generate IP range automatically
	// This creates IPs like: 10.10.1.10, 10.10.2.10, 10.10.3.10, 10.10.4.10, 10.10.5.10
	IPs: helper.GenerateIPRange("10.10.%d.10", 1, 5),
	
	// OPTION 2: Manually specify IP addresses (uncomment to use)
	// IPs: []string{"10.10.1.10", "10.10.2.10", "10.10.3.10"},
	
	// OPTION 3: Mixed approach (uncomment to use)
	// IPs: append(
	//     helper.GenerateIPRange("10.10.%d.10", 1, 50),  // Generated range
	//     []string{"192.168.1.100", "172.16.1.50"}...    // Additional specific IPs
	// ),
}

// Service2: Example database service targets
var Service2 = Service{
	Name: "Service2",
	
	// Different IP pattern - customize for your environment
	IPs: helper.GenerateIPRange("127.0.0.%d", 1, 5),
}

// SERVICES array contains all target services that A-D-AGENT will attack.
// ADD YOUR SERVICES HERE:
//
// Example for a typical CTF with 3 services across 50 teams:
//
//   var WebService = Service{
//       Name: "WebService",
//       IPs:  helper.GenerateIPRange("10.10.%d.80", 1, 50),    // Port 80 on teams 1-50
//   }
//   
//   var DatabaseService = Service{
//       Name: "DatabaseService", 
//       IPs:  helper.GenerateIPRange("10.10.%d.3306", 1, 50),  // Port 3306 on teams 1-50
//   }
//   
//   var SSHService = Service{
//       Name: "SSHService",
//       IPs:  helper.GenerateIPRange("10.10.%d.22", 1, 50),    // Port 22 on teams 1-50
//   }
//
//   var SERVICES = []Service{WebService, DatabaseService, SSHService}
//
var SERVICES = []Service{
	Service1,
	Service2,
	// Add more services here as needed
}

// ================================================================================
// TEAM PROTECTION CONFIGURATION
// ================================================================================

// MYSERVICES_IPS contains IP addresses that should be EXCLUDED from attacks.
// These are typically your own team's service IPs that you don't want to attack.
//
// IMPORTANT: Add your team's IPs here to avoid attacking yourself!
//
// EXAMPLES:
//   Single team IPs:           []string{"10.10.25.80", "10.10.25.3306", "10.10.25.22"}
//   Multiple backup IPs:       []string{"10.10.25.80", "10.10.26.80", "10.10.27.80"}
//   Development/staging IPs:   []string{"192.168.1.100", "127.0.0.1", "localhost"}
//
var MYSERVICES_IPS = []string{
	"10.10.10",  // Example: Your team's first service
	"10.10.11",  // Example: Your team's second service
	// Add your actual team IPs here
}

// ================================================================================
// FLAG SUBMISSION CONFIGURATION
// ================================================================================

// NUMBER_OF_FLAGS_TO_SEND_AT_ONCE controls how flags are submitted to the checker.
//
// VALUES:
//   1:    Send flags individually (one HTTP request per flag)
//         JSON format: {"flags": "CTF{single_flag}"}
//
//   >1:   Send flags in batches (multiple flags per HTTP request)  
//         JSON format: {"flags": ["CTF{flag1}", "CTF{flag2}", "CTF{flag3}"]}
//         If you have 7 flags and set this to 5, it will send:
//         - First request: 5 flags
//         - Second request: 2 flags
//
// CONSIDERATIONS:
//   - Batch submission (>1) is usually faster and more efficient
//   - Some CTF platforms only accept individual submissions (use 1)
//   - Higher numbers reduce HTTP overhead but may hit rate limits
//   - Recommended: 5-10 for most CTF platforms
//
var NUMBER_OF_FLAGS_TO_SEND_AT_ONCE = 5

// ================================================================================
// CHECKER ENDPOINT CONFIGURATION
// ================================================================================

// URL is the endpoint where captured flags will be submitted.
// This should be provided by your CTF organizers.
//
// EXAMPLES:
//   "http://10.10.10.1:8080/api/submit"           // Local CTF infrastructure  
//   "https://ctf.example.com/submit"              // External CTF platform
//   "https://scoreboard.ctf.com/api/flags"        // Custom scoreboard API
//
// IMPORTANT: Make sure this URL is correct and accessible from your container!
var URL = "http://localhost:8000/"

// HEADERS contains HTTP headers sent with each flag submission request.
// This is where you configure authentication, API keys, session cookies, etc.
//
// COMMON EXAMPLES:
//
//   API Key Authentication:
//     "Authorization": "Bearer your-api-key-here"
//     "X-API-Key": "your-api-key"
//
//   Session Cookie Authentication:
//     "Cookie": "session_id=abc123; csrf_token=def456"
//     "Cookie": "cyberedu_session=<your_session_cookie>"
//
//   Custom Headers:
//     "X-Team-ID": "team-123"
//     "X-Team-Token": "your-team-specific-token"
//     "User-Agent": "A-D-AGENT/1.0"
//
//   Basic Authentication:
//     "Authorization": "Basic " + base64("username:password")
//
// IMPORTANT: Configure these headers according to your CTF platform's requirements!
var HEADERS = map[string]string{
	"Accept":       "application/json",
	"Content-Type": "application/json",
	
	// UNCOMMENT and modify the authentication method your CTF uses:
	
	// Option 1: API Key
	// "Authorization": "Bearer your-api-key-here",
	
	// Option 2: Session Cookie
	// "Cookie": "cyberedu_session=<your_session_cookie>;",
	
	// Option 3: Custom Team Authentication
	// "X-Team-ID": "your-team-id",
	// "X-Team-Token": "your-team-token",
	
	// Option 4: Basic Authentication
	// "Authorization": "Basic " + base64("username:password"),
}

// FLAG_KEY specifies the JSON key name used when submitting flags.
//
// EXAMPLES:
//   "flags":     {"flags": ["CTF{flag1}", "CTF{flag2}"]}           (most common)
//   "flag":      {"flag": "CTF{single_flag}"}                     (single submission)
//   "data":      {"data": ["CTF{flag1}", "CTF{flag2}"]}           (some platforms)
//   "tokens":    {"tokens": ["CTF{flag1}", "CTF{flag2}"]}         (custom naming)
//
// IMPORTANT: This must match what your CTF platform expects!
var FLAG_KEY string = "flags"

// ================================================================================
// RETRY LOGIC CONFIGURATION  
// ================================================================================

// ERROR_MESSAGES defines response messages that should trigger a retry instead of
// removing the flag from the submission queue.
//
// When the CTF checker responds with one of these messages, A-D-AGENT will:
//   - Keep the flag in the queue
//   - Retry submission in the next cycle
//   - NOT mark the flag as successfully submitted
//
// COMMON RETRY SCENARIOS:
//   - Temporary server issues: "Internal server error", "Service unavailable"
//   - Rate limiting: "Rate limit exceeded", "Too many requests"  
//   - Database issues: "Database connection failed", "Timeout"
//   - Maintenance: "System maintenance", "Service temporarily unavailable"
//
// EXAMPLES for different CTF platforms:
//
//   Generic errors:
//     "Internal server error", "Service unavailable", "Timeout"
//
//   Rate limiting:
//     "Rate limit exceeded", "Too many requests", "Please slow down"
//
//   Specific CTF platforms:
//     "Flag submission temporarily disabled"  
//     "Scoring system under maintenance"
//     "Database synchronization in progress"
//
// IMPORTANT: Do NOT include permanent errors here (like "Invalid flag", "Already submitted")
// as they will cause infinite retry loops!
//
var ERROR_MESSAGES = []string{
	"Flag not found",        // Example: Flag expired or doesn't exist
	"Invalid flag format",   // Example: Flag doesn't match expected pattern  
	"Flag already submitted", // Example: Duplicate submission
	
	// ADD YOUR CTF-SPECIFIC RETRY CONDITIONS HERE:
	// "Service temporarily unavailable",
	// "Rate limit exceeded", 
	// "Internal server error",
	// "Database connection failed",
}

// ================================================================================
// AI INTEGRATION CONFIGURATION (OPTIONAL)
// ================================================================================

// OPENAI_API_KEY enables AI-powered code improvement features in the web interface.
//
// FEATURES when configured:
//   - "AI Rewrite" button in code editor
//   - Automatic code cleanup and optimization
//   - Comment generation and code improvement suggestions
//   - Maintains original functionality while improving readability
//
// SETUP:
//   1. Get an API key from: https://platform.openai.com/api-keys
//   2. Replace the key below with your actual key
//   3. Or set to empty string "" to disable AI features
//
// COST CONSIDERATIONS:
//   - Uses GPT-4 model for best code quality
//   - Typical cost: $0.01-0.05 per code rewrite
//   - Only charges when you actively use the "AI Rewrite" feature
//
// SECURITY NOTE:
//   - Your exploit code is sent to OpenAI for processing
//   - Consider this when working with sensitive/proprietary exploits
//   - Set to "" if you prefer not to use external AI services
//
var OPENAI_API_KEY = "sk-proj-api-key-example" // Replace with your actual OpenAI API key

// ================================================================================
// SYSTEM CONFIGURATION
// ================================================================================

// PYTHON_COMMAND specifies the Python interpreter command used to execute exploits.
//
// COMMON VALUES:
//   "python":   Default Python installation (usually Python 2.7 or 3.x)
//   "python3":  Explicitly use Python 3.x
//   "python2":  Explicitly use Python 2.7 (rarely needed)
//   "/usr/bin/python3": Full path to specific Python installation
//
// CONTAINER NOTE:
//   Inside the Docker container, this is automatically set to "python" which
//   points to Python 3.11. You typically don't need to change this unless
//   you're running A-D-AGENT outside of Docker.
//
// TROUBLESHOOTING:
//   If exploits fail with "command not found", verify Python is installed:
//     docker exec -it ad-agent python --version
//
var PYTHON_COMMAND = "python" // or "python3" depending on your system

// ================================================================================
// CONFIGURATION VALIDATION
// ================================================================================
// The settings above will be automatically validated when A-D-AGENT starts.
// Check the container logs for any configuration errors:
//   docker logs ad-agent
//
// COMMON CONFIGURATION MISTAKES:
//   1. Service names with spaces (use underscores instead)
//   2. Invalid regex patterns in FLAG_REGEX
//   3. Incorrect URL format (missing http:// or https://)
//   4. Wrong FLAG_KEY name for your CTF platform
//   5. Including your own IPs in SERVICES but not in MYSERVICES_IPS
//
// TESTING YOUR CONFIGURATION:
//   1. Start A-D-AGENT: ./start.sh
//   2. Check http://localhost:1337 loads correctly
//   3. Create a test exploit that prints a test flag
//   4. Verify the flag appears in statistics and flags.txt
//   5. Monitor container logs for any errors
// ================================================================================