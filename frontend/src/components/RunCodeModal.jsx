import { useState, useEffect } from 'react';

function RunCodeModal({ file, isOpen, onClose }) {
  const [ipAddress, setIpAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // New state for tracking elapsed time
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  // Reset the timer when the modal closes
  useEffect(() => {
    if (!isOpen) {
      setElapsedTime(0);
    }
  }, [isOpen]);
  
  // Increase the elapsed time counter when loading
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 0.1);
      }, 100);
    } else {
      setElapsedTime(0);
    }
    
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async () => {
    if (!ipAddress.trim()) {
      setError('Please enter an IP address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setElapsedTime(0);
    
    // Set up a client-side timeout to display a message if the server takes too long
    // Reduced from 6s to 5.2s to be more responsive and closer to the 5s backend timeout
    const timeoutId = setTimeout(() => {
      // If we haven't received a response after 5.2 seconds, show a client-side timeout message
      console.log("Client-side timeout detection triggered");
      setIsLoading(false);
      setResult({
        output: "",
        error: "Timeout: Your script took too long to execute (>5 seconds)"
      });
      // Play a notification sound for timeout
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABMYXZjNTguMTMuMTAwAGRhdGFaAgAAAA0A/v///wAA/////gAAAAIAAQD+//////////7/AQADAAAAAgD//gAA/v8AAP7/AQD///3/AQACAP///v8CAP3/AgD//wEA/v8BAAAA/f8DAP//AAD//wIA/f8EAAAA/v8DAP7///8DAP//AAABAP3/AwD//wAA//8CAP3/BAAAAAAAAQD+/wEAAgD9/wMA//8AAP//AQD//wAA//8BAAAA//8AAP//AAACAP3/AwD//wEA/v8BAAEA/v8CAP7/AQACAP3/AwD+/wIA//8AAP//AQAAAP//AQD+/wEAAQD+/wIA/v8BAAEA/v8DAP3/AgD//wEA//8BAP//AAABAP7/AgD+/wIA//8AAP//AQD//wEA//8AAP//AQD//wEA//8BAAAA//8AAP//AAACAP7/AQD//wAAAQD+/wMA/f8CAAAA//8BAP7/AgD+/wIA//8AAAEA/v8CAAAA/v8CAAAA/v8CAAAA/v8CAAAA/v8CAP//AQD+/wEAAgD9/wMA/v8BAAAA//8BAAAA//8AAAAA//8BAAAA//8AAAAA//8BAAAA//8AAAAA//8BAAAA//8BAAAAAAAAAP//AQABAP7/AgD+/wIA//8AAAAA//8BAAAAAAAAAP//AQAAAP//AQAAAP//AAABAP//AAABAP7/AgD//wAAAQD+/wIA/v8BAAEA/v8BAAEA/v8BAAEA/v8BAAEA/v8BAAEA/v8BAAEA/v8BAAEA/v8BAAEA/v8BAAEA/f8DAP7/AQABAP7/AgD+/wEAAQD+/wIA/v8BAAEA/v8CAP7/AQABAP7/AgD+/wEA//8BAAEA/v8CAP3/AwD+/wEA//8CAP3/AwD+/wEAAQD8/wQA/v8BAAEA/v8BAAAAAAAAAP//AQD//wAAAAAAAAAAAAD//wEA//8AAAAAAAD//wEA//8AAAAAAAAAAP//AQD//wAAAAAAAP//AQD//wAAAAAAAP//AQD//wAAAAAAAP//AQD//wAA');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }, 5200); 
      try {
      // Create an AbortController to allow canceling the request if it takes too long
      const controller = new AbortController();
      const timeoutId2 = setTimeout(() => {
        controller.abort();
        console.log("Fetch request aborted due to timeout");
      }, 6000); // Reduced from 7s to 6s

      const response = await fetch('http://localhost:3333/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: file.content,
          ipAddress: ipAddress
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId2);
        // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      // Handle case where response might time out during json parsing
      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        if (jsonErr.name === 'AbortError' || jsonErr.message.includes('aborted')) {
          setIsLoading(false);
          setResult({
            output: "",
            error: "Timeout: Your script took too long to execute (>5 seconds)"
          });
          return;
        }
        throw jsonErr;
      }
      
      if (!response.ok) {
        // Check if it's a timeout error (HTTP 408)
        if (response.status === 408) {
          // Handle timeout case specially
          setIsLoading(false); // Set loading to false immediately for timeout cases
          setResult({
            output: "",  // Empty output since we don't want to display it
            error: "Timeout: Your script took too long to execute (>5 seconds)"
          });
          return;
        }
        // If it's another type of error response
        throw new Error(data.error || 'Failed to run code');
      }
      
      // Success - show the result
      setResult(data);
      
      // If the output contains "Error" or similar keywords, still show it as a result
      // because it might be a runtime error from the Python script, not an API error
      if (data.output && data.output.includes("Error")) {
        console.warn("Code execution returned with errors in output:", data.output);
      }    } catch (err) {
      // Network error or server error
      console.error('Error running code:', err);
      
      // Check if this might be due to a timeout that didn't get properly handled
      if (err.message && (
          err.message.includes("timeout") || 
          err.message.includes("Timeout") || 
          err.message.includes("took too long")
        )) {
        // Handle as timeout error
        setResult({
          output: "",
          error: "Timeout: Your script took too long to execute (>5 seconds)"
        });
      } else {
        // Handle as regular error
        setError(err.message || 'An error occurred while running the code');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">Run Code: {file.name}</h2>
          {!result ? (
          <div className="modal-form">            <div className="service-info">
              <strong>Service:</strong> {file.service || 'None'}
            </div>
            
            <div className="code-header-note">
              <strong>Note:</strong> The code will run with the required header imports and setup.
            </div>
            
            <div className="form-group">
              <label htmlFor="ipAddress">Target IP Address:</label>
              <input
                type="text"
                id="ipAddress"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="Enter IP address (e.g., 10.0.0.1)"
                disabled={isLoading}
                autoFocus
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            {/* New execution progress indicator */}
            {isLoading && (
              <div className="execution-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.min(elapsedTime / 5 * 100, 100)}%`,
                      backgroundColor: elapsedTime >= 4.5 ? '#ff6347' : elapsedTime >= 3 ? '#ffa500' : '#4caf50'
                    }}
                  ></div>
                </div>
                <div className="progress-time">
                  <span>{elapsedTime.toFixed(1)}s</span>
                  {elapsedTime >= 4 && 
                    <span className="timeout-approaching">Approaching timeout...</span>
                  }
                </div>
              </div>
            )}
            
            <button 
              className="run-button modal-button" 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <span>
                  <span className="spinner"></span> Running...
                </span>
              ) : (
                'Run Code'
              )}
            </button>
          </div>
        ) : (
          <div className="result-container">
            <div className="result-header">
              <div>
                <strong>Service:</strong> {file.service || 'None'} | 
                <strong> IP:</strong> {ipAddress}
              </div>
            </div>              {result.error && result.error.includes("Timeout") ? (
              <div className="timeout-warning">
                <h3>⚠️ Script Timeout</h3>
                <p>Your script exceeded the maximum execution time of 5 seconds.</p>
                <p className="timeout-suggestion">Try a different IP address or optimize your code to run faster.</p>
                <p className="timeout-suggestion">Consider breaking down complex operations or reducing network requests.</p>
              </div>
            ) : (
              <>
                <h3>Execution Output:</h3>
                <pre className="code-output">{result.output || '(No output)'}</pre>
                
                {result.error && !result.error.includes("Timeout") && (
                  <>
                    <h3>Errors:</h3>
                    <pre className="code-error">{result.error}</pre>
                  </>
                )}
              </>
            )}
            
            <div className="modal-actions">
              <button 
                className="action-button modal-button" 
                onClick={() => setResult(null)}
              >
                Run Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RunCodeModal;
