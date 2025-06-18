package ad_agent

import (
	"ad_agent/helper"
	"time"
)

// Service represents a group of IPs that belong to a logical service.
type Service struct {
	Name string
	IPs  []string
}


// Flag Regex
const FLAG_REGEX = `CTF{[a-zA-Z0-9_]+}`


// TickerInterval is the time between exploit runs, in seconds
var TickerInterval = 10 * time.Second
// Service1 represents a range of generated IP addresses
// The name shoud not have any spaces
var Service1 = Service{
	Name: "Service1",
	IPs:  helper.GenerateIPRange("10.10.%d.10", 1, 5), // First parameter is the base IP (%d is what it will be replaced), second is the lower range and third is the upper range
}

var Service2 = Service{
	Name: "Service2",
	IPs:  helper.GenerateIPRange("127.0.0.%d", 1, 5),
}
// SERVICES contains all service IP ranges with names
var SERVICES = []Service{
	Service1,
	Service2,
}


// These will be excluded from the attack surface
var MYSERVICES_IPS = []string{
	"10.10.10",
	"10.10.11",
}


/// SEND FALGS TO THE CHECKER
var URL = "https://api.cyber-edu.co/v1/domain/rocsc25-ad/challenge/submit-ad-attempt"
var HEADERS = map[string]string{
        "Accept":       "application/json",
        "Content-Type": "application/json",
        // replace with your real session cookie
        "Cookie":       "cyberedu_session=<your_session_cookie>;",
    }

var FLAG_KEY string = "flags"


// To do: Requests to send flag via http with attributes
// Create the rest api server to handle runnig scripts and send the attack to multiple hosts (multi threading).
// The script must include host=sys.arg[1]  


// The frontend will have 2 pages: 
// 1. A vscode like editor, each created file is associated with a service, and the user can write code in it. 
// 2. A statistics dashboard that shows the status of each service, including the number of successful attacks, failed attacks, and the last attack time. 


// PORT is the port on which the server will run
var PORT = "3333" // or any other port you prefer

// Python command or alias

var PYTHON_COMMAND = "python3" // or "python" depending on your system


