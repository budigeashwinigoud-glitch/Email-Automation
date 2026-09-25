import React, { useState } from 'react';
import { X, Calendar, User, Mail, Clock, Send, CheckCircle2, AlertCircle, Edit2 } from 'lucide-react';
import { api } from '../services/api';
import { getAvatarColor, getInitials } from '../utils/colors';

export default function TaskDetailsModal({ isOpen, task, onClose, onStatusUpdated, onOpenEdit }) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !task) return null;

  const colors = getAvatarColor(task.assigned_to?.name, task.assigned_to?.id);

  const handleQuickStatusChange = async (newStatus) => {
    setUpdating(true);
    setError('');
    try {
      const updated = await api.updateTaskStatus(task.id, newStatus);
      onStatusUpdated(updated);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  // Determine active step index: pending = 0, sent = 1, done = 2
  const stepIndex = task.status === 'done' ? 2 : task.status === 'sent' ? 1 : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="count-chip" style={{ fontSize: '12px' }}>
              #{task.id}
            </span>
            <h2 className="modal-title">{task.title}</h2>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
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

          {/* 3-Step Lifecycle Progress Tracker */}
          <div className="lifecycle-tracker">
            <div className="lifecycle-line"></div>

            {/* Step 1: Pending */}
            <div className="lifecycle-step">
              <div className={`step-indicator ${stepIndex >= 0 ? (stepIndex > 0 ? 'completed' : 'active') : ''}`}>
                {stepIndex > 0 ? <CheckCircle2 size={16} /> : '1'}
              </div>
              <div className={`step-label ${stepIndex === 0 ? 'active' : ''}`}>Pending</div>
              <div style={{ fontSize: '10px', color: 'var(--text-light)' }}>Awaiting Email</div>
            </div>

            {/* Step 2: Sent */}
            <div className="lifecycle-step">
              <div className={`step-indicator ${stepIndex >= 1 ? (stepIndex > 1 ? 'completed' : 'active') : ''}`}>
                {stepIndex > 1 ? <CheckCircle2 size={16} /> : '2'}
              </div>
              <div className={`step-label ${stepIndex === 1 ? 'active' : ''}`}>Sent</div>
              <div style={{ fontSize: '10px', color: 'var(--text-light)' }}>Email Dispatched</div>
            </div>

            {/* Step 3: Done */}
            <div className="lifecycle-step">
              <div className={`step-indicator ${stepIndex === 2 ? 'completed' : ''}`}>
                {stepIndex === 2 ? <CheckCircle2 size={16} /> : '3'}
              </div>
              <div className={`step-label ${stepIndex === 2 ? 'active' : ''}`}>Done</div>
              <div style={{ fontSize: '10px', color: 'var(--text-light)' }}>Finished</div>
            </div>
          </div>

          {/* Description Card */}
          <div style={{ marginBottom: '22px' }}>
            <label className="form-label">Task Description</label>
            <div
              style={{
                background: '#f8fafc',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13.5px',
                color: 'var(--text-main)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                border: '1px solid var(--border)',
              }}
            >
              {task.description}
            </div>
          </div>

          {/* Key Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              background: '#ffffff',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              marginBottom: '20px',
            }}
          >
            <div>
              <label className="form-label" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                ASSIGNED EMPLOYEE
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  className="user-avatar"
                  style={{
                    background: colors.bg,
                    color: colors.text,
                    borderColor: colors.border,
                  }}
                >
                  {getInitials(task.assigned_to?.name)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px' }}>
                    {task.assigned_to?.name || 'Unassigned'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {task.assigned_to?.email}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                PRIORITY & DUE DATE
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>
                  <span className="badge-dot"></span>
                  {task.priority} Priority
                </span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Due {task.due_date}
                </span>
                {(task.department || task.assigned_to?.department) && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#3b82f6',
                      background: '#eff6ff',
                      border: '1px solid #dbeafe',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {task.department || task.assigned_to?.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              background: '#f8fafc',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11.5px',
            }}
          >
            <div>
              <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>CREATED AT</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                {formatDate(task.created_at)}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>SENT AT</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                {task.sent_at ? formatDate(task.sent_at) : 'Awaiting Email'}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>COMPLETED AT</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                {task.completed_at ? formatDate(task.completed_at) : 'In Progress'}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          {/* Quick status actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {task.status === 'pending' && (
              <button
                className="btn btn-indigo btn-sm"
                onClick={() => handleQuickStatusChange('sent')}
                disabled={updating}
                title="Simulate future email service dispatching this task"
              >
                <Send size={13} />
                <span>Simulate Email Dispatch</span>
              </button>
            )}
            {task.status === 'sent' && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleQuickStatusChange('done')}
                disabled={updating}
                title="Mark this task as finished"
                style={{ background: '#10b981' }}
              >
                <CheckCircle2 size={13} />
                <span>Mark as Done</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                onClose();
                onOpenEdit(task);
              }}
            >
              <Edit2 size={14} />
              <span>Edit</span>
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
