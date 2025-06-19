import { useState } from 'react'
import Explorer from './components/Explorer'
import CodeEditor from './components/CodeEditor'
import './App.css'

function App() {
  const [files, setFiles] = useState([])
  const [activeFileId, setActiveFileId] = useState(null)
  const [newFileName, setNewFileName] = useState('')
  const [newServiceName, setNewServiceName] = useState('')
  const [isCreatingFile, setIsCreatingFile] = useState(false)

  // Find the active file based on activeFileId
  const activeFile = files.find(file => file.id === activeFileId) || null

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
      service: newServiceName,
      content: `import requests\nimport sys\n\nhost=sys.argv[1]\n\n# r=requests.get(f'http://{host}')\n\n# print(r.text) -> The output must contain the flag\n`
    }
    
    setFiles([...files, newFile])
    setActiveFileId(newFile.id)
    setNewFileName('')
    setNewServiceName('')
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
      <Explorer 
        files={files}
        activeFileId={activeFileId}
        newFileName={newFileName}
        newServiceName={newServiceName}
        isCreatingFile={isCreatingFile}
        onSelectFile={selectFile}
        onDeleteFile={deleteFile}
        onFileNameChange={setNewFileName}
        onServiceNameChange={setNewServiceName}
        onCreateFile={createFile}
        onToggleCreateFile={setIsCreatingFile}
      />
      
      <div className="editor-container">
        <CodeEditor 
          file={activeFile}
          onContentChange={handleEditorChange}
        />
      </div>
    </div>
  )
}

export default App
