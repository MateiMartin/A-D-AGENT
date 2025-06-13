package config

import "A-D-Agent/helper"

// Service represents a group of IPs that belong to a logical service.
type Service struct {
	Name string
	IPs  []string
}

// Service1 represents a range of generated IP addresses
var Service1 = Service{
	Name: "Service 1",
	IPs:  helper.GenerateIPRange("10.10.%d.10", 1, 5),
}

// SERVICES contains all service IP ranges with names
var SERVICES = []Service{
	Service1,
}
