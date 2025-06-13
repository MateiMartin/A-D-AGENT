package config

import (
	"A-D-Agent/helper.go"  
)

// SERVICE_1 represents a range of generated IP addresses
var SERVICE_1 = helper.GenerateIPRange("10.10.%d.10", 1, 5) // This will create: ["10.10.1.10", "10.10.2.10", "10.10.3.10", "10.10.4.10", "10.10.5.10"]

// SERVICE_ARRAY contains all service IP ranges
var SERVICE_ARRAY = [][]string{
	SERVICE_1,
}

