import React from 'react';
import { AlertTriangle, Mail, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  onConfirm,
  onCancel,
  isDanger = true,
  icon = null,
}) {
  if (!isOpen) return null;

  const renderIcon = () => {
    if (icon) return icon;
    if (isDanger) {
      return <AlertTriangle size={18} color="var(--high-dot)" />;
    }
    return <Mail size={18} color="var(--primary)" />;
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderIcon()}
            <h3 className="modal-title">{title}</h3>
          </div>
          <button className="btn-icon" onClick={onCancel} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
