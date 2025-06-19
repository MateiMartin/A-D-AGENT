import { useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import RunCodeModal from './RunCodeModal'
import AIRewriteModal from './AIRewriteModal'

function CodeEditor({ file, onContentChange }) {
  const editorRef = useRef(null)
  const [isRunModalOpen, setIsRunModalOpen] = useState(false)
  const [isAIRewriteModalOpen, setIsAIRewriteModalOpen] = useState(false)

  function handleEditorDidMount(editor) {
    editorRef.current = editor
  }
  
  function handleRunCode() {
    if (file) {
      setIsRunModalOpen(true)
    }
  }

  function handleAIRewrite() {
    if (file) {
      setIsAIRewriteModalOpen(true)
    }
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
            onClick={handleRunCode}
          >
            <span role="img" aria-label="Run">▶️</span> Run
          </button>
          <button 
            className="action-button ai-button" 
            title="Rewrite with AI"
            onClick={handleAIRewrite}
          >
            <span role="img" aria-label="AI">🤖</span> AI Rewrite
          </button>
        </div>
      </div>
        <RunCodeModal 
        file={file}
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
      />
      
      <AIRewriteModal
        file={file}
        isOpen={isAIRewriteModalOpen}
        onClose={() => setIsAIRewriteModalOpen(false)}
        onCodeUpdate={onContentChange}
      />
      
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
