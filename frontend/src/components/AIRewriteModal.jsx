import { useState, useEffect } from 'react';

function AIRewriteModal({ file, isOpen, onClose, onCodeUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [rewrittenCode, setRewrittenCode] = useState('');
  const [status, setStatus] = useState('');

  // Fetch API key when modal is opened
  useEffect(() => {
    if (isOpen) {
      fetchApiKey();
    }
  }, [isOpen]);

  const fetchApiKey = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/ai-api-key');
      
      if (!response.ok) {
        throw new Error(`API key not available (${response.status})`);
      }
      
      const data = await response.json();
      if (!data.apiKey) {
        throw new Error('API key is not set on the server');
      }
      
      setApiKey(data.apiKey);
    } catch (err) {
      setError(err.message || 'Failed to fetch API key');
      console.error('Error fetching API key:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewrite = async () => {
    if (!apiKey) {
      setError('API key is required to use AI rewriting');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setStatus('Requesting AI to rewrite your code...');
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },          body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a code improvement assistant that helps clean up and improve code. Make the code more readable, efficient, and well-commented without over-commenting. Maintain the original functionality and intent of the code."
            },
            {
              role: "user",
              content: `Please rewrite the following ${file.name} code to be cleaner, more readable, and properly commented (but not over-commented). The code should maintain the same functionality.\n\nCRITICAL REQUIREMENT: Do NOT modify these required header lines at the top of the file:\n\`\`\`python\nimport requests\nimport sys\n\nhost=sys.argv[1]\n\`\`\`\n\nYou MUST preserve these exact header lines. Only make changes BELOW the line that says "===== WRITE YOUR CODE BELOW THIS LINE =====". Your rewritten code should replace everything below this line while keeping everything above it untouched.\n\nDo not over complicate the code by adding try except blocks or a main function (if you think that the code is already easy to read just add comments and leave it like that).\n\nHere's the full code:\n\n\`\`\`python\n${file.content}\n\`\`\``
            }
          ],
          temperature: 0.7
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get AI response');
      }
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        // Extract code from the response - handle potential code block format
        let content = data.choices[0].message.content;
        
        // Extract code from markdown code blocks if present
        if (content.includes("```python")) {
          const codeBlockRegex = /```(?:python)?\n([\s\S]*?)```/;
          const match = content.match(codeBlockRegex);
          if (match && match[1]) {
            content = match[1];
          }
        } else if (content.includes("```")) {
          const codeBlockRegex = /```\n?([\s\S]*?)```/;
          const match = content.match(codeBlockRegex);
          if (match && match[1]) {
            content = match[1];
          }
        }
        
        setRewrittenCode(content);
        setStatus('Code successfully rewritten!');
      } else {
        throw new Error('No content in AI response');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while rewriting the code');
      console.error('Error during AI rewrite:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (rewrittenCode) {
      onCodeUpdate(rewrittenCode);
      onClose();
    }
  };

  const handleClose = () => {
    setRewrittenCode('');
    setError('');
    setStatus('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={handleClose}>×</button>
        <h2 className="modal-title">AI Rewrite: {file.name}</h2>
        
        {!rewrittenCode ? (
          <div className="modal-form">
            <div className="service-info">
              <strong>Service:</strong> {file.service || 'None'}
            </div>
            
            {error && <div className="error-message">{error}</div>}
              <p className="ai-description">
              AI will rewrite this code to be cleaner, more readable, and properly commented
              while preserving all functionality.
            </p>
            <div className="code-header-warning">
              <strong>Important:</strong> The AI will preserve the required header lines and only modify the code below 
              the "WRITE YOUR CODE BELOW THIS LINE" marker.
            </div>
            
            <button 
              className="ai-button modal-button" 
              onClick={handleRewrite}
              disabled={isLoading || !apiKey}
            >
              {isLoading ? (
                <span>
                  <span className="spinner"></span> {status || 'Processing...'}
                </span>
              ) : !apiKey ? 'API Key Not Available' : 'Rewrite with AI'}
            </button>
          </div>
        ) : (
          <div className="result-container">
            <div className="result-header">
              <div>
                <strong>Service:</strong> {file.service || 'None'} | 
                <strong> File:</strong> {file.name}
              </div>
            </div>
              <h3>AI Rewritten Code:</h3>
            <div className="code-header-warning">
              The header imports and setup lines are preserved exactly as required.
            </div>
            <pre className="code-output">{rewrittenCode}</pre>
            
            <div className="modal-actions">
              <button 
                className="action-button modal-button apply-button" 
                onClick={handleApply}
              >
                Apply Changes
              </button>
              <button 
                className="action-button modal-button secondary-button" 
                onClick={() => setRewrittenCode('')}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIRewriteModal;
