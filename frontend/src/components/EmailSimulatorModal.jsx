import React, { useState, useEffect } from 'react';
import { X, Send, Mail, CheckCircle2, Sparkles, Terminal, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function EmailSimulatorModal({ isOpen, onClose, onDispatched, showToast }) {
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dispatchingId, setDispatchingId] = useState(null);
  const [batchDispatching, setBatchDispatching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPendingTasks();
    }
  }, [isOpen]);

  const loadPendingTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getPendingTasks();
      setPendingTasks(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending tasks from API');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchSingle = async (taskId) => {
    setDispatchingId(taskId);
    try {
      await api.updateTaskStatus(taskId, 'sent');
      showToast('success', 'Email Dispatched', `Task #${taskId} delivery status updated to 'sent'.`);
      await loadPendingTasks();
      onDispatched();
    } catch (err) {
      showToast('error', 'Dispatch Error', err.message);
    } finally {
      setDispatchingId(null);
    }
  };

  const handleBatchDispatch = async () => {
    if (pendingTasks.length === 0) return;
    setBatchDispatching(true);
    try {
      let count = 0;
      for (const t of pendingTasks) {
        await api.updateTaskStatus(t.id, 'sent');
        count++;
      }
      showToast('success', 'Batch Delivery Complete', `${count} pending tasks marked as dispatched ('sent').`);
      await loadPendingTasks();
      onDispatched();
    } catch (err) {
      showToast('error', 'Batch Dispatch Error', err.message);
    } finally {
      setBatchDispatching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={18} />
            </div>
            <div>
              <h2 className="modal-title">Email Automation Microservice Simulator</h2>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Consuming <code>GET /api/tasks/pending</code> & <code>PATCH /api/tasks/&#123;id&#125;/status</code>
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: '18px',
            }}
          >
            <strong>Teammate Integration Note:</strong> This interactive inspector simulates how the future email scheduler service interacts with our backend: it polls pending tasks via the REST endpoint and notifies the backend upon email delivery.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              Tasks In Delivery Queue ({pendingTasks.length})
            </span>

            {pendingTasks.length > 0 && (
              <button
                className="btn btn-indigo btn-sm"
                onClick={handleBatchDispatch}
                disabled={batchDispatching}
              >
                <Send size={13} />
                <span>{batchDispatching ? 'Dispatching All...' : 'Dispatch All Emails'}</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-state" style={{ padding: '32px' }}>
              <div className="spinner"></div>
              <span>Fetching pending tasks from backend...</span>
            </div>
          ) : pendingTasks.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border)',
              }}
            >
              <CheckCircle2 size={36} color="var(--done-dot)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                Queue is empty!
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                All tasks have already been dispatched or completed. Create a new task to queue it for email delivery.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
              {pendingTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span className="badge badge-pending" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        Pending
                      </span>
                      <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>#{t.id} {t.title}</strong>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      Recipient: <strong>{t.assigned_to?.name}</strong> ({t.assigned_to?.email}) • Priority: {t.priority}
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDispatchSingle(t.id)}
                    disabled={dispatchingId === t.id}
                  >
                    <Send size={12} color="var(--primary)" />
                    <span>{dispatchingId === t.id ? 'Sending...' : 'Send Email'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendingTasks.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                API Response Sample: <code>GET /api/tasks/pending</code>
              </div>
              <div className="simulator-code-box">
                {JSON.stringify([pendingTasks[0]], null, 2)}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
