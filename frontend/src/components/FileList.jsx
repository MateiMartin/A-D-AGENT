function FileItem({ file, isActive, onSelect, onDelete }) {
  return (
    <div 
      className={`file ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(file.id)}
    >
      <span className="file-icon">📄</span>
      <div className="file-info">
        <span className="file-name">{file.name}</span>
        {file.service && (
          <span className="file-service">{file.service}</span>
        )}
      </div>
      <button 
        className="delete-button"
        onClick={(e) => onDelete(file.id, e)}
      >
        ×
      </button>
    </div>
  )
}

function FileList({ files, activeFileId, onSelectFile, onDeleteFile }) {
  return (
    <div className="file-list">
      {files.map(file => (
        <FileItem 
          key={file.id}
          file={file} 
          isActive={file.id === activeFileId}
          onSelect={onSelectFile}
          onDelete={onDeleteFile}
        />
      ))}
    </div>
  )
}

export default FileList
