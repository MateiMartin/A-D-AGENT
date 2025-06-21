import React from 'react';

function ConfirmationModal({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content confirmation-modal">
        <h2 className="modal-title">Confirm Action</h2>
        <p className="confirmation-message">{message}</p>
        
        <div className="modal-actions">
          <button 
            className="action-button modal-button delete-button-confirm" 
            onClick={onConfirm}
          >
            Delete
          </button>
          <button 
            className="action-button modal-button cancel-button" 
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
