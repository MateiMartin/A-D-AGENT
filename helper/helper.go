package helper

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

// GenerateIPRange generates an array of IP addresses with a customizable pattern
func GenerateIPRange(pattern string, start, end int) []string {
	ips := make([]string, 0, end-start+1)
	for i := start; i <= end; i++ {
		ip := fmt.Sprintf(pattern, i)
		ips = append(ips, ip)
	}
	return ips
}


func SendPostRequest(url string, headers map[string]string, jsonData map[string]interface{}) (int, []byte, error) {
    // 1) Marshal the dynamic JSON payload
    payload, err := json.Marshal(jsonData)
    if err != nil {
        return 0, nil, fmt.Errorf("json.Marshal: %w", err)
    }

    // 2) Build the request
    req, err := http.NewRequest("POST", url, bytes.NewReader(payload))
    if err != nil {
        return 0, nil, fmt.Errorf("http.NewRequest: %w", err)
    }

    // 3) Attach any headers (including Cookies)
    for k, v := range headers {
        req.Header.Set(k, v)
    }

    // 4) Send it
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return 0, nil, fmt.Errorf("client.Do: %w", err)
    }
    defer resp.Body.Close()

    // 5) Read the response
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return resp.StatusCode, nil, fmt.Errorf("io.ReadAll: %w", err)
    }

    return resp.StatusCode, body, nil
}