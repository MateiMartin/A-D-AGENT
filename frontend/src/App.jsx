import { useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import './App.css'

function App() {
  const [files, setFiles] = useState([])
  const [activeFileId, setActiveFileId] = useState(1)
  const [newFileName, setNewFileName] = useState('')
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const editorRef = useRef(null)

  // Find the active file based on activeFileId
  const activeFile = files.find(file => file.id === activeFileId) || null

  // Handler for when the editor is mounted
  function handleEditorDidMount(editor) {
    editorRef.current = editor
  }

  // Save file content when it changes
  function handleEditorChange(value) {
    if (!activeFile) return
    
    const updatedFiles = files.map(file => 
      file.id === activeFileId ? { ...file, content: value } : file
    )
    setFiles(updatedFiles)
  }

  // Select a file to edit
  function selectFile(fileId) {
    setActiveFileId(fileId)
  }

  // Create a new file
  function createFile() {
    if (!newFileName) return
    
    const fileName = newFileName.endsWith('.py') ? newFileName : `${newFileName}.py`
    const newFile = {
      id: Date.now(),
      name: fileName,
      content: `import requests\nimport sys\n\nhost=sys.argv[1]\n\n# r=requests.get(f'http://{host}')\n\n# print(r.text) -> The output must contain the flag\n`
    }
    
    setFiles([...files, newFile])
    setActiveFileId(newFile.id)
    setNewFileName('')
    setIsCreatingFile(false)
  }

  // Delete a file
  function deleteFile(fileId, event) {
    event.stopPropagation()
    
    const updatedFiles = files.filter(file => file.id !== fileId)
    setFiles(updatedFiles)
    
    // If the deleted file was active, select another file
    if (fileId === activeFileId && updatedFiles.length > 0) {
      setActiveFileId(updatedFiles[0].id)
    } else if (updatedFiles.length === 0) {
      setActiveFileId(null)
    }
  }

  return (
    <div className="ide-container">
      {/* File Explorer */}
      <div className="explorer">
        <div className="explorer-header">
          <span>EXPLORER</span>
          <button 
            className="new-file-button"
            onClick={() => setIsCreatingFile(true)}
          >
            +
          </button>
        </div>

        {isCreatingFile && (
          <div className="new-file-form">
            <input
              type="text"
              placeholder="filename.py"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createFile()}
              autoFocus
            />
            <div className="form-buttons">
              <button onClick={createFile}>Create</button>
              <button onClick={() => setIsCreatingFile(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="file-list">
          {files.map(file => (
            <div 
              key={file.id}
              className={`file ${file.id === activeFileId ? 'active' : ''}`}
              onClick={() => selectFile(file.id)}
            >
              <span className="file-icon">📄</span>
              <span className="file-name">{file.name}</span>
              <button 
                className="delete-button"
                onClick={(e) => deleteFile(file.id, e)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="editor-container">
        {activeFile ? (
          <>
            <div className="editor-header">
              <div className="tab active">
                {activeFile.name}
              </div>
            </div>
            <div className="editor-wrapper">
              <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={activeFile.content}
                onChange={handleEditorChange}
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
        )}
      </div>
    </div>
  )
}

export default App
