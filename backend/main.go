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
	}	// Create a temporary directory at project root for the script
	tmpDir := filepath.Join(projectRootPath, "tmp")
	if err := os.MkdirAll(tmpDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, CodeResponse{Error: "Failed to create temporary directory at project root"})
		return
	}	// Create temporary Python script file in project root tmp directory
	scriptPath := filepath.Join(tmpDir, "manul_run_script.py")
	if err := ioutil.WriteFile(scriptPath, []byte(request.Code), 0644); err != nil {
		c.JSON(http.StatusInternalServerError, CodeResponse{Error: "Failed to write script file"})
		return
	}	// Execute the Python script with the IP address parameter and a 5-second timeout
	// This prevents long-running scripts from blocking the server indefinitely
	// The same timeout is used for both manual execution and periodic scanning
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel() // Ensure the cancel function is called to release resources
	
	cmd := exec.CommandContext(ctx, ad_agent.PYTHON_COMMAND, scriptPath, request.IpAddress)
	output, err := cmd.CombinedOutput()
	if ctx.Err() == context.DeadlineExceeded {
		fmt.Println("Manual script execution timed out after 5 seconds")
		
		// Kill the process if it's still running to prevent resource leaks
		if cmd.Process != nil {
			cmd.Process.Kill()
		}
		
		// Return a timeout response immediately
		c.JSON(http.StatusRequestTimeout, CodeResponse{
			Output: "",  // Empty output since we don't want to display it
			Error:  "Timeout: Script execution took longer than 5 seconds",
		})
		return
	} else if err != nil {
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
	}	// Create tmp directory at project root if it doesn't exist
	tmpDir := filepath.Join(projectRootPath, "tmp")
	if err := os.MkdirAll(tmpDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, ServiceExploitResponse{Error: "Failed to create temporary directory at project root"})
		return
	}
	// Validate file name
	if request.FileName == "" {
		c.JSON(http.StatusBadRequest, ServiceExploitResponse{Error: "File name is required"})
		return
	}	// Create, update, or delete the exploit file in project root tmp directory
	filename := fmt.Sprintf("exploit_%s_%s.py", request.ServiceName, request.FileName)
	scriptPath := filepath.Join(tmpDir, filename)
	
	if request.Code == "" {
		// Empty code means delete the file
		if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
			// File doesn't exist, nothing to delete
			c.JSON(http.StatusOK, ServiceExploitResponse{
				Message: fmt.Sprintf("Exploit %s for service: %s was already deleted", request.FileName, request.ServiceName),
			})
			return
		}
		
		// Delete the file
		if err := os.Remove(scriptPath); err != nil {
			c.JSON(http.StatusInternalServerError, ServiceExploitResponse{Error: fmt.Sprintf("Failed to delete exploit file: %v", err)})
			return
		}
		
		c.JSON(http.StatusOK, ServiceExploitResponse{
			Message: fmt.Sprintf("Successfully deleted exploit %s for service: %s", request.FileName, request.ServiceName),
		})
		return
	}
	
	// Create or update the file
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
		for {			fmt.Println("\n=== Starting new exploit run ===")
			tmpDir := filepath.Join(projectRootPath, "tmp")
			if err := os.MkdirAll(tmpDir, 0755); err != nil {
				fmt.Printf("Error creating tmp directory at project root: %v\n", err)
				time.Sleep(ad_agent.TickerInterval)
				continue
			}
			var exploits []ExploitResult
			for _, service := range ad_agent.SERVICES {				// Find all exploit files for this service in project root tmp directory
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

// getProjectRootPath returns the absolute path to the project root
// It handles different working directory scenarios
func getProjectRootPath() string {
	// If we've already calculated the path, return it
	if projectRootPath != "" {
		return projectRootPath
	}
	// Get current working directory
	currentDir, err := os.Getwd()
	if err != nil {
		fmt.Printf("Error getting current directory: %v\n", err)
		return ".." // Fallback to relative path
	}

	// Check if we're already at the project root
	if filepath.Base(currentDir) == "A-D-AGENT" {
		return currentDir
	}

	// If we're in the backend folder, go up one level
	if filepath.Base(currentDir) == "backend" && filepath.Base(filepath.Dir(currentDir)) == "A-D-AGENT" {
		return filepath.Dir(currentDir)
	}

	// Default to going up one level from backend
	return filepath.Join(currentDir, "..")
}

// projectRootPath stores the absolute path to the project root
// This is used to ensure exploit files are stored in the root tmp directory regardless of where the server is run from
var projectRootPath string

func main() {
	// Set up the project root path for tmp directory
	projectRootPath = getProjectRootPath()
	fmt.Printf("Project root path: %s\n", projectRootPath)
	
	// Ensure the tmp directory exists at project root
	tmpDir := filepath.Join(projectRootPath, "tmp")
	if err := os.MkdirAll(tmpDir, 0755); err != nil {
		fmt.Printf("Error creating tmp directory at project root: %v\n", err)
	}
	
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