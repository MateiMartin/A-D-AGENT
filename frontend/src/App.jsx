import { useEffect, useState } from 'react'
import Explorer from './components/Explorer'
import CodeEditor from './components/CodeEditor'
import './App.css'

function App() {  // Load initial state from localStorage or use defaults
  const [files, setFiles] = useState(() => {
    try {
      const savedFiles = localStorage.getItem('files');
      return savedFiles ? JSON.parse(savedFiles) : [];
    } catch (error) {
      console.error('Error loading files from localStorage:', error);
      return [];
    }
  })
  const [services, setServices] = useState(() => {
    try {
      const savedServices = localStorage.getItem('services');
      return savedServices ? JSON.parse(savedServices) : [];
    } catch (error) {
      console.error('Error loading services from localStorage:', error);
      return [];
    }
  })
  const [activeFileId, setActiveFileId] = useState(() => {
    return localStorage.getItem('activeFileId') || null;
  })
  const [newFileName, setNewFileName] = useState('')
  const [newServiceName, setNewServiceName] = useState(() => {
    return localStorage.getItem('newServiceName') || '';
  })
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  // Load services from backend
  useEffect(() => {
    // Define a function to load services
    const loadServices = async () => {
      try {
        const response = await fetch('http://localhost:3333/services');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Services loaded from API:', data);
        
        // Only update if we got valid data
        if (data && Array.isArray(data)) {
          setServices(data);
          
          // Set default service if needed
          const storedServiceName = localStorage.getItem('newServiceName');
          if (data.length > 0) {
            if (!storedServiceName || storedServiceName === '') {
              setNewServiceName(data[0]);
            } else if (data.includes(storedServiceName)) {
              // Make sure the stored service still exists
              setNewServiceName(storedServiceName);
            } else {
              // If stored service no longer exists, use first available
              setNewServiceName(data[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        // If we fail to load from API but have services in localStorage, we'll keep using those
        const savedServices = localStorage.getItem('services');
        if (savedServices && services.length === 0) {
          try {
            const parsedServices = JSON.parse(savedServices);
            console.log('Using cached services from localStorage:', parsedServices);
            setServices(parsedServices);
          } catch (parseError) {
            console.error('Error parsing services from localStorage:', parseError);
          }
        }
      }
    };
    
    // Call the function
    loadServices();
  }, []); // Empty dependency array so it only runs once on mount
  // Find the active file based on activeFileId
  const activeFile = files.find(file => file.id === activeFileId) || null
  // Save file content when it changes and update the backend
  async function handleEditorChange(value) {
    if (!activeFile) return
    
    const updatedFiles = files.map(file => 
      file.id === activeFileId ? { ...file, content: value } : file
    )
    setFiles(updatedFiles)

    // Send update to backend
    try {
      const currentFile = updatedFiles.find(file => file.id === activeFileId);
      
      if (currentFile) {
        const response = await fetch('http://localhost:3333/update-exploit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serviceName: currentFile.service,
            fileName: currentFile.name.replace(/\.py$/, ''), // Remove .py extension if present
            code: currentFile.content
          }),
        });

        const data = await response.json();
          if (!response.ok) {
          console.error('Error updating exploit on backend:', data.error || 'Unknown error');
        } else {
          console.log('Exploit updated successfully:', data.message);
          console.log('File saved to project root tmp directory');
        }
      }
    } catch (err) {
      console.error('Failed to update exploit on backend:', err);
    }
  }
  // Select a file to edit
  function selectFile(fileId) {
    setActiveFileId(fileId)
  }
  
  // Create a new file
  async function createFile() {
    if (!newFileName) return
    if (!newServiceName) {
      alert("You must select a service");
      return;
    }
    
    const fileName = newFileName.endsWith('.py') ? newFileName : `${newFileName}.py`
    
    // Check if a file with the same name already exists for the selected service
    const duplicateFile = files.find(file => 
      file.name.toLowerCase() === fileName.toLowerCase() && 
      file.service === newServiceName
    );
    
    if (duplicateFile) {
      alert(`A file named "${fileName}" already exists for service "${newServiceName}". Please choose a different name.`);
      return;
    }
    const newFile = {
      id: Date.now(),
      name: fileName,
      service: newServiceName,
      content: `import requests\nimport sys\n\nhost=sys.argv[1]\n\n# =============================================\n# ===== WRITE YOUR CODE BELOW THIS LINE =====\n# =============================================\n\n# Example code (you can modify or replace this):\n# r = requests.get(f'http://{host}')\n# print(r.text)  # The output should contain the flag\n`
    }
    
    // Save locally
    setFiles([...files, newFile])
    setActiveFileId(newFile.id)
    setNewFileName('')
    
    // Send to backend
    try {
      const response = await fetch('http://localhost:3333/update-exploit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceName: newFile.service,
          fileName: newFile.name.replace(/\.py$/, ''), // Remove .py extension if present
          code: newFile.content
        }),
      });

      const data = await response.json();
        if (!response.ok) {
        console.error('Error creating exploit on backend:', data.error || 'Unknown error');
      } else {
        console.log('Exploit created successfully:', data.message);
        console.log('File saved to project root tmp directory');
      }
    } catch (err) {
      console.error('Failed to create exploit on backend:', err);
    }
    
    // Don't reset service name - keep the previously selected service
    // Set default service if available
    if (services && services.length > 0 && !newServiceName) {
      setNewServiceName(services[0]);
    }    setIsCreatingFile(false)
  }
  
  // Delete a file  
  async function deleteFile(fileId, event) {
    event.stopPropagation()
    
    // Find the file to be deleted
    const fileToDelete = files.find(file => file.id === fileId);
    
    if (!fileToDelete) return;
    
    // Update local state first
    const updatedFiles = files.filter(file => file.id !== fileId)
    setFiles(updatedFiles)
    
    // If the deleted file was active, select another file
    if (fileId === activeFileId && updatedFiles.length > 0) {
      setActiveFileId(updatedFiles[0].id)
    } else if (updatedFiles.length === 0) {
      setActiveFileId(null)
    }
    
    // Notify the backend to delete the file
    try {
      const response = await fetch('http://localhost:3333/update-exploit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceName: fileToDelete.service,
          fileName: fileToDelete.name.replace(/\.py$/, ''), // Remove .py extension if present
          code: '' // Empty code signals deletion on the backend
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error deleting exploit on backend:', data.error || 'Unknown error');
      } else {
        console.log('Exploit deleted successfully:', data.message);
      }
    } catch (err) {
      console.error('Failed to delete exploit on backend:', err);
    }
  }
  
  // Save files to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('files', JSON.stringify(files));
    } catch (error) {
      console.error('Error saving files to localStorage:', error);
    }
  }, [files]);
  // Save activeFileId to localStorage whenever it changes
  useEffect(() => {
    try {
      if (activeFileId) {
        localStorage.setItem('activeFileId', activeFileId);
      } else {
        localStorage.removeItem('activeFileId');
      }
    } catch (error) {
      console.error('Error saving activeFileId to localStorage:', error);
    }
  }, [activeFileId]);
  // Save newServiceName to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('newServiceName', newServiceName);
    } catch (error) {
      console.error('Error saving newServiceName to localStorage:', error);
    }
  }, [newServiceName]);

  // Save services to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('services', JSON.stringify(services));
    } catch (error) {
      console.error('Error saving services to localStorage:', error);
    }
  }, [services]);

  return (
    <div className="ide-container">
      <Explorer 
        files={files}
        activeFileId={activeFileId}
        newFileName={newFileName}
        newServiceName={newServiceName}
        services={services}
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
