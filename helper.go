package helper

import "fmt"

// GenerateIPRange generates an array of IP addresses with a customizable pattern
func GenerateIPRange(pattern string, start, end int) []string {
	ips := make([]string, 0, end-start+1)
	for i := start; i <= end; i++ {
		ip := fmt.Sprintf(pattern, i)
		ips = append(ips, ip)
	}
	return ips
}