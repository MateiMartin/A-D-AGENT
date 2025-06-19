import { useRef } from 'react'
import Editor from '@monaco-editor/react'

function CodeEditor({ file, onContentChange }) {
  const editorRef = useRef(null)

  function handleEditorDidMount(editor) {
    editorRef.current = editor
  }
  
  // Add these handler functions for the buttons
  function handleRunCode() {
    // Implementation for running the code
    console.log("Running code for:", file.name);
    // Add your run code logic here
  }

  function handleAIRewrite() {
    // Implementation for AI rewriting the code
    console.log("AI rewriting code for:", file.name);
    // Add your AI rewrite logic here
  }

  return file ? (
    <>
      <div className="editor-header">
        <div className="tab active">
          {file.name}
        </div>
        <div className="editor-actions">
          <button 
            className="action-button run-button" 
            title="Run this code"
            onClick={handleRunCode} // Add onClick here
          >
            <span role="img" aria-label="Run">▶️</span> Run
          </button>
          <button 
            className="action-button ai-button" 
            title="Rewrite with AI"
            onClick={handleAIRewrite} // Add onClick here
          >
            <span role="img" aria-label="AI">🤖</span> AI Rewrite
          </button>
        </div>
      </div>
      <div className="editor-wrapper">
        <Editor
          height="100%"
          defaultLanguage="python"
          theme="vs-dark"
          value={file.content}
          onChange={onContentChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true
          }}
        />
      </div>
    </>
  ) : (
    <div className="empty-editor">
      <p>Select a file or create a new one to start editing</p>
    </div>
  )
}

export default CodeEditor
