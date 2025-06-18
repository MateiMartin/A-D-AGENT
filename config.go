package ad_agent

import "ad_agent/helper"

// Service represents a group of IPs that belong to a logical service.
type Service struct {
	Name string
	IPs  []string
}

// Service1 represents a range of generated IP addresses
var Service1 = Service{
	Name: "Service 1",
	IPs:  helper.GenerateIPRange("10.10.%d.10", 1, 5), // First parameter is the base IP (%d is what it will be replaced), second is the lower range and third is the upper range
}

var Service2 = Service{
	Name: "Service 2",
	IPs:  helper.GenerateIPRange("10.10.%d.10", 1, 5),
}
// SERVICES contains all service IP ranges with names
var SERVICES = []Service{
	Service1,
	Service2,
}


// These will be excluded from the attack surface
var MyServicesIPs = []string{
	"10.10.10",
	"10.10.11",
}


// To do: Requests to send flag via http with attributes
// Create the rest api server to handle runnig scripts and send the attack to multiple hosts (multi threading).
// The script must include host=sys.arg[1]  


// The frontend will have 2 pages: 
// 1. A vscode like editor, each created file is associated with a service, and the user can write code in it. 
// 2. A statistics dashboard that shows the status of each service, including the number of successful attacks, failed attacks, and the last attack time. 