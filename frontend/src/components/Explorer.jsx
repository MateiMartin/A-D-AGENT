import FileList from './FileList'
import NewFileForm from './NewFileForm'

function Explorer({ 
  files, 
  activeFileId, 
  newFileName,
  newServiceName,
  isCreatingFile, 
  onSelectFile, 
  onDeleteFile,
  onFileNameChange,
  onServiceNameChange,
  onCreateFile, 
  onToggleCreateFile 
}) {
  return (
    <div className="explorer">
      <div className="explorer-header">
        <span>EXPLORER</span>
        <button 
          className="new-file-button"
          onClick={() => onToggleCreateFile(true)}
        >
          +
        </button>
      </div>

      {isCreatingFile && (
        <NewFileForm 
          fileName={newFileName}
          serviceName={newServiceName}
          onFileNameChange={onFileNameChange}
          onServiceNameChange={onServiceNameChange}
          onCreate={onCreateFile}
          onCancel={() => onToggleCreateFile(false)}
        />
      )}

      <FileList 
        files={files}
        activeFileId={activeFileId}
        onSelectFile={onSelectFile}
        onDeleteFile={onDeleteFile}
      />
    </div>
  )
}

export default Explorer
