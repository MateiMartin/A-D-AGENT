package main

import (
	"context"
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
	FileName   string `json:"fileName"`
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
	// Validate file name
	if request.FileName == "" {
		c.JSON(http.StatusBadRequest, ServiceExploitResponse{Error: "File name is required"})
		return
	}

	// Create or update the exploit file
	filename := fmt.Sprintf("exploit_%s_%s.py", request.ServiceName, request.FileName)
	scriptPath := filepath.Join(tmpDir, filename)
	if err := ioutil.WriteFile(scriptPath, []byte(request.Code), 0644); err != nil {
		c.JSON(http.StatusInternalServerError, ServiceExploitResponse{Error: "Failed to write exploit file"})
		return
	}

	c.JSON(http.StatusOK, ServiceExploitResponse{
		Message: fmt.Sprintf("Successfully updated exploit %s for service: %s", request.FileName, request.ServiceName),
	})
}

func startPeriodicScans() {
	go func() {
		for {
			fmt.Println("\n=== Starting new exploit run ===")
			tmpDir := filepath.Join("tmp")
			if err := os.MkdirAll(tmpDir, 0755); err != nil {
				fmt.Printf("Error creating tmp directory: %v\n", err)
				time.Sleep(ad_agent.TickerInterval)
				continue
			}			
			var exploits []ExploitResult
			for _, service := range ad_agent.SERVICES {
				// Find all exploit files for this service
				files, err := filepath.Glob(filepath.Join(tmpDir, fmt.Sprintf("exploit_%s_*.py", service.Name)))
				if err != nil {
					fmt.Printf("Error finding exploit files for service %s: %v\n", service.Name, err)
					continue
				}
				
				if len(files) == 0 {
					fmt.Printf("No exploit files found for service %s\n", service.Name)
					continue
				}

				// Run each exploit file against all IPs
				for _, scriptPath := range files {
					exploitName := filepath.Base(scriptPath)
					fmt.Printf("\n=== Running %s ===\n", exploitName)
					
					for _, ip := range service.IPs {
					// Create a context with timeout
					ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
					cmdStr := fmt.Sprintf("%s %s %s", ad_agent.PYTHON_COMMAND, scriptPath, ip)
					fmt.Printf("\nExecuting: %s\n", cmdStr)
					
					cmd := exec.CommandContext(ctx, ad_agent.PYTHON_COMMAND, scriptPath, ip)
					output, err := cmd.CombinedOutput()
					
					if ctx.Err() == context.DeadlineExceeded {
						fmt.Printf("Script timed out after 5 seconds\n")
						fmt.Println("----------------------------------------")
						cancel()
						exploits = append(exploits, ExploitResult{
							ServiceName: service.Name,
							IP:         ip,
							Output:     "Script execution timed out",
							Error:      fmt.Errorf("timeout after 5 seconds"),
						})
						continue
					}
					cancel() // Clean up the context

					if err != nil {
						fmt.Printf("Error: %v\n", err)
					}
					fmt.Println("----------------------------------------")
					
					exploits = append(exploits, ExploitResult{
						ServiceName: service.Name,
						IP:         ip,
						Output:     string(output),
						Error:      err,					})
					}
				}
			}

			// Filter excluded IPs and process flags
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

// getAIAPIKey returns the OpenAI API key for the frontend to use
// Returns a JSON object with the API key or an error if not set
func getAIAPIKey(c *gin.Context) {
	apiKey := ad_agent.OPENAI_API_KEY
	if apiKey == "" {
		c.JSON(500, gin.H{"error": "AI API key is not set"})
		return
	}
	c.JSON(200, gin.H{"apiKey": apiKey})
}

func main() {
	router := gin.Default()

	// Enable CORS
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// Regular endpoints
	router.GET("/services", getServices)
	router.GET("/ai-api-key", getAIAPIKey)
	router.POST("/run-code", runCode)
	router.POST("/update-exploit", updateServiceExploits)

	// Start periodic scanning in background
	startPeriodicScans()

	router.Run("localhost:3333")
}