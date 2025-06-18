package main

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"time"

	"ad_agent"
)

type CodeRequest struct {
	Code      string `json:"code"`
	IpAddress string `json:"ipAddress"`
}

type CodeResponse struct {
	Output string `json:"output"`
	Error  string `json:"error,omitempty"`
}

type ServiceExploitRequest struct {
	ServiceName string `json:"serviceName"`
	Code       string `json:"code"`
}

type ServiceExploitResponse struct {
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

type ExploitResult struct {
	ServiceName string
	IP         string
	Output     string
	Error      error
}

var foundFlags []string // All the found flags will be stored here

func getServices(c *gin.Context) {
	var names []string
	for _, service := range ad_agent.SERVICES {
		names = append(names, service.Name)
	}

	c.IndentedJSON(http.StatusOK, names)
}

func runCode(c *gin.Context) {
	var request CodeRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, CodeResponse{Error: "Invalid request format"})
		return
	}

	// Create a temporary directory for the script
	tmpDir := filepath.Join("tmp")
	if err := os.MkdirAll(tmpDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, CodeResponse{Error: "Failed to create temporary directory"})
		return
	}

	// Create temporary Python script file
	scriptPath := filepath.Join(tmpDir, "manul_run_script.py")
	if err := ioutil.WriteFile(scriptPath, []byte(request.Code), 0644); err != nil {
		c.JSON(http.StatusInternalServerError, CodeResponse{Error: "Failed to write script file"})
		return
	}

	// Execute the Python script with the IP address parameter
	cmd := exec.Command(ad_agent.PYTHON_COMMAND, scriptPath, request.IpAddress)
	output, err := cmd.CombinedOutput()

	if err != nil {
		c.JSON(http.StatusInternalServerError, CodeResponse{
			Output: string(output),
			Error:  fmt.Sprintf("Script execution failed: %v", err),
		})
		return
	}

	// Return the execution result
	c.JSON(http.StatusOK, CodeResponse{
		Output: string(output),
	})
}

func updateServiceExploits(c *gin.Context) {
	var request ServiceExploitRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, ServiceExploitResponse{Error: "Invalid request format"})
		return
	}

	// Validate service name exists
	serviceExists := false
	for _, service := range ad_agent.SERVICES {
		if service.Name == request.ServiceName {
			serviceExists = true
			break
		}
	}

	if !serviceExists {
		c.JSON(http.StatusBadRequest, ServiceExploitResponse{Error: "Service not found"})
		return
	}

	// Create tmp directory if it doesn't exist
	tmpDir := filepath.Join("tmp")
	if err := os.MkdirAll(tmpDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, ServiceExploitResponse{Error: "Failed to create temporary directory"})
		return
	}

	// Create or update the exploit file
	filename := fmt.Sprintf("exploit_%s.py", request.ServiceName)
	scriptPath := filepath.Join(tmpDir, filename)
	if err := ioutil.WriteFile(scriptPath, []byte(request.Code), 0644); err != nil {
		c.JSON(http.StatusInternalServerError, ServiceExploitResponse{Error: "Failed to write exploit file"})
		return
	}

	c.JSON(http.StatusOK, ServiceExploitResponse{
		Message: fmt.Sprintf("Successfully updated exploit for service: %s", request.ServiceName),
	})
}

func startPeriodicScans() {
	go func() {
		for {
			fmt.Println("\n=== Starting new exploit run ===")
					// Run the exploits
			tmpDir := filepath.Join("tmp")
			if err := os.MkdirAll(tmpDir, 0755); err != nil {
				fmt.Printf("Error creating tmp directory: %v\n", err)
				time.Sleep(ad_agent.TickerInterval)
				continue
			}

			var exploits []ExploitResult
			for _, service := range ad_agent.SERVICES {
				scriptPath := filepath.Join(tmpDir, fmt.Sprintf("exploit_%s.py", service.Name))
				if _, err := os.Stat(scriptPath); err != nil {
					continue // Skip if exploit doesn't exist
				}				
				for _, ip := range service.IPs {
					cmd := exec.Command(ad_agent.PYTHON_COMMAND, scriptPath, ip)
					cmdStr := fmt.Sprintf("%s %s %s", ad_agent.PYTHON_COMMAND, scriptPath, ip)
					fmt.Printf("\nExecuting: %s\n", cmdStr)
					
					output, err := cmd.CombinedOutput()
					// fmt.Printf("Response:\n%s\n", string(output)) // Response from the script
					if err != nil {
						fmt.Printf("Error: %v\n", err)
					}
					fmt.Println("----------------------------------------")
					
					exploits = append(exploits, ExploitResult{
						ServiceName: service.Name,
						IP:         ip,
						Output:     string(output),
						Error:      err,
					})
				}
			}

			// Filter excluded IPs
			for _, result := range exploits {
				excluded := false
				for _, excludedIP := range ad_agent.MYSERVICES_IPS {
					if result.IP == excludedIP {
						excluded = true
						break
					}
				}
				
				if !excluded && result.Error == nil {
					// Check for flags
					flagRegex := regexp.MustCompile(ad_agent.FLAG_REGEX)
					if flags := flagRegex.FindAllString(result.Output, -1); len(flags) > 0 {
						fmt.Printf("Found flags from %s on IP %s: %v\n", result.ServiceName, result.IP, flags)
						foundFlags = append(foundFlags, flags...)
					}
				}
			}

			fmt.Printf("\nAll found flags so far: %v\n", foundFlags)
			fmt.Println("=== Completed exploit run ===\n")

			time.Sleep(ad_agent.TickerInterval)
		}
	}()
}

func main() {
	router := gin.Default()

	// Regular endpoints
	router.GET("/services", getServices)
	router.POST("/run-code", runCode)
	router.POST("/update-exploit", updateServiceExploits)

	// Start periodic scanning in background
	startPeriodicScans()

	router.Run("localhost:"+ad_agent.PORT) // Use the PORT defined in ad_agent package
}