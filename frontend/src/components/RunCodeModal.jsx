import { useState } from 'react';

function RunCodeModal({ file, isOpen, onClose }) {
  const [ipAddress, setIpAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const handleSubmit = async () => {
    if (!ipAddress.trim()) {
      setError('Please enter an IP address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:3333/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: file.content,
          ipAddress: ipAddress
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // If the server returned an error response
        throw new Error(data.error || 'Failed to run code');
      }
      
      // Success - show the result
      setResult(data);
      
      // If the output contains "Error" or similar keywords, still show it as a result
      // because it might be a runtime error from the Python script, not an API error
      if (data.output && data.output.includes("Error")) {
        console.warn("Code execution returned with errors in output:", data.output);
      }
    } catch (err) {
      // Network error or server error
      setError(err.message || 'An error occurred while running the code');
      console.error('Error running code:', err);
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
            </div>
            
            <h3>Execution Output:</h3>
            <pre className="code-output">{result.output || '(No output)'}</pre>
            
            {result.error && (
              <>
                <h3>Errors:</h3>
                <pre className="code-error">{result.error}</pre>
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
