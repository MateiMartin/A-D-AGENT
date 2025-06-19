function NewFileForm({ fileName, serviceName, onFileNameChange, onServiceNameChange, onCreate, onCancel }) {
  return (
    <div className="new-file-form">
      <input
        type="text"
        placeholder="File name (e.g., script.py)"
        value={fileName}
        onChange={(e) => onFileNameChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onCreate()}
        autoFocus
      />
      <input
        type="text"
        placeholder="Service Name"
        value={serviceName}
        onChange={(e) => onServiceNameChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onCreate()}
      />
      <div className="form-buttons">
        <button onClick={onCreate}>Create</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

export default NewFileForm
