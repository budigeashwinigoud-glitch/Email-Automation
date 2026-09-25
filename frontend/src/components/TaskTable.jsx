import React from 'react';
import { Eye, Edit2, Trash2, Calendar, Layers, Send, CheckCircle2 } from 'lucide-react';
import { getAvatarColor, getInitials } from '../utils/colors';

export default function TaskTable({
  tasks,
  loading,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onQuickStatusChange,
}) {
  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>Syncing task inventory...</span>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Layers size={28} />
        </div>
        <div className="empty-state-title">No matching tasks found</div>
        <p style={{ fontSize: '13px', maxWidth: '380px', margin: '0 auto', color: 'var(--text-muted)' }}>
          No tasks match your selected filter criteria. Try changing filters, searching for another keyword, or create a new task.
        </p>
      </div>
    );
  }

  const formatCreatedDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID & Task</th>
            <th>Assigned To</th>
            <th>Priority</th>
            <th>Due Date</th>
            <th>Status & Lifecycle</th>
            <th>Created</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const colors = getAvatarColor(task.assigned_to?.name, task.assigned_to?.id);
            const priorityClass = `badge-priority-${task.priority.toLowerCase()}`;
            const statusClass = `badge-${task.status.toLowerCase()}`;

            return (
              <tr key={task.id}>
                {/* Task Title & Description */}
                <td style={{ minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-light)' }}>
                      #{task.id}
                    </span>
                    <div
                      className="table-task-title"
                      onClick={() => onViewTask(task)}
                      style={{ cursor: 'pointer' }}
                    >
                      {task.title}
                    </div>
                  </div>
                  <div className="table-task-desc">{task.description}</div>
                </td>

                {/* Assigned To */}
                <td>
                  <div className="user-badge" title={task.assigned_to?.email}>
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
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>
                        {task.assigned_to?.name || 'Unassigned'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {task.assigned_to?.email || '—'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Priority */}
                <td>
                  <span className={`badge ${priorityClass}`}>
                    <span className="badge-dot"></span>
                    {task.priority}
                  </span>
                </td>

                {/* Due Date */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <Calendar size={13} color="var(--text-muted)" />
                    <span>{task.due_date}</span>
                  </div>
                </td>

                {/* Status & Quick Advance */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${statusClass}`}>
                      <span className="badge-dot"></span>
                      {task.status === 'pending' ? 'Pending Email' : task.status === 'sent' ? 'Dispatched' : 'Completed'}
                    </span>

                    {/* Quick status button */}
                    {task.status === 'pending' && onQuickStatusChange && (
                      <button
                        className="btn-icon"
                        onClick={() => onQuickStatusChange(task.id, 'sent')}
                        title="Simulate future Email Automation: mark as Sent"
                        style={{ color: 'var(--primary)', padding: '3px' }}
                      >
                        <Send size={13} />
                      </button>
                    )}
                    {task.status === 'sent' && onQuickStatusChange && (
                      <button
                        className="btn-icon"
                        onClick={() => onQuickStatusChange(task.id, 'done')}
                        title="Mark Task as Completed"
                        style={{ color: 'var(--done-dot)', padding: '3px' }}
                      >
                        <CheckCircle2 size={13} />
                      </button>
                    )}
                  </div>
                </td>

                {/* Created Date */}
                <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '12px' }}>
                  {formatCreatedDate(task.created_at)}
                </td>

                {/* Actions */}
                <td style={{ textAlign: 'right' }}>
                  <div className="table-actions" style={{ justifyContent: 'flex-end', display: 'flex', gap: '4px' }}>
                    <button
                      className="btn-icon"
                      onClick={() => onViewTask(task)}
                      title="View Details"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => onEditTask(task)}
                      title="Edit Task"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => onDeleteTask(task)}
                      title="Delete Task"
                      style={{ color: 'var(--high-dot)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
