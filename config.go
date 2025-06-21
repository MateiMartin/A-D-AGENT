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


var NUMBER_OF_FLAGS_TO_SEND_AT_ONCE = 5
// if > 5 will send the flags in chunks of 5 (or less if there are less than 5 flags to send) in a json array
// if = 1 will send the flags one by one not in a json array

/// SEND FALGS TO THE CHECKER
var URL = "https://api.cyber-edu.co/v1/domain/rocsc25-ad/challenge/submit-ad-attempt"
var HEADERS = map[string]string{
        "Accept":       "application/json",
        "Content-Type": "application/json",
        // replace with your real session cookie
        "Cookie":       "cyberedu_session=<your_session_cookie>;",
    }

var FLAG_KEY string = "flags"

//OpenAI api key
var OPENAI_API_KEY = "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"

// Python command or alias
var PYTHON_COMMAND = "python" // or "python3" depending on your system



