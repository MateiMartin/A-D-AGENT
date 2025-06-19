function NewFileForm({ fileName, serviceName, services = [], files = [], onFileNameChange, onServiceNameChange, onCreate, onCancel }) {
  // Check if the current file name and service combination already exists
  const isDuplicate = () => {
    if (!fileName || !serviceName) return false;
    
    const normalizedFileName = fileName.endsWith('.py') ? fileName : `${fileName}.py`;
    
    return files.some(file => 
      file.name.toLowerCase() === normalizedFileName.toLowerCase() && 
      file.service === serviceName
    );
  };

  const duplicate = isDuplicate();

  return (
    <div className="new-file-form">
      <input
        type="text"
        placeholder="File name (e.g., script.py)"
        value={fileName}
        onChange={(e) => onFileNameChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !duplicate && onCreate()}
        className={duplicate ? 'duplicate-error' : ''}
        autoFocus
      />
      {duplicate && (
        <div className="error-message">
          File name already exists for this service
        </div>
      )}{services && services.length > 0 ? (
        <select
          value={serviceName}
          onChange={(e) => onServiceNameChange(e.target.value)}
          className="service-select"
          required
        >
          {services.map(service => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          placeholder="Service Name (required)"
          value={serviceName}
          onChange={(e) => onServiceNameChange(e.target.value)}
          required
        />
      )}      <div className="form-buttons">
        <button 
          onClick={onCreate}
          disabled={duplicate}
          className={duplicate ? 'button-disabled' : ''}
          title={duplicate ? 'File name already exists for this service' : 'Create file'}
        >
          Create
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

export default NewFileForm
