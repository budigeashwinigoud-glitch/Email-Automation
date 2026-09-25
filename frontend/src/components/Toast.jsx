import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isSuccess = toast.type === 'success';

  return (
    <div className={`toast ${isSuccess ? 'toast-success' : 'toast-error'}`}>
      {isSuccess ? (
        <CheckCircle2 size={18} color="var(--success)" style={{ marginTop: '2px', flexShrink: 0 }} />
      ) : (
        <AlertCircle size={18} color="var(--danger)" style={{ marginTop: '2px', flexShrink: 0 }} />
      )}
      <div className="toast-content">
        <div className="toast-title">{toast.title || (isSuccess ? 'Success' : 'Error')}</div>
        <div className="toast-message">{toast.message}</div>
      </div>
      <button className="btn-icon" onClick={onDismiss} style={{ padding: '2px', marginLeft: '8px' }}>
        <X size={14} />
      </button>
    </div>
  );
}
