import React from 'react';
import { Clock, Send, CheckCircle2, Calendar, Edit2, Trash2, Eye, ArrowRight } from 'lucide-react';
import { getAvatarColor, getInitials } from '../utils/colors';

export default function KanbanBoard({
  tasks = [],
  onViewTask,
  onEditTask,
  onDeleteTask,
  onQuickStatusChange,
}) {
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const sentTasks = tasks.filter((t) => t.status === 'sent');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  const columns = [
    {
      id: 'pending',
      title: 'Pending Delivery',
      subtitle: 'Awaiting email automation dispatch',
      tasks: pendingTasks,
      icon: <Clock size={16} color="#d97706" />,
      badgeClass: 'badge-pending',
      nextAction: {
        targetStatus: 'sent',
        label: 'Dispatch Email',
        icon: <Send size={12} />,
      },
    },
    {
      id: 'sent',
      title: 'Sent / In Progress',
      subtitle: 'Email dispatched, employee notified',
      tasks: sentTasks,
      icon: <Send size={16} color="#2563eb" />,
      badgeClass: 'badge-sent',
      nextAction: {
        targetStatus: 'done',
        label: 'Mark Done',
        icon: <CheckCircle2 size={12} />,
      },
    },
    {
      id: 'done',
      title: 'Completed',
      subtitle: 'Task successfully finished',
      tasks: doneTasks,
      icon: <CheckCircle2 size={16} color="#16a34a" />,
      badgeClass: 'badge-done',
      nextAction: null,
    },
  ];

  return (
    <div className="kanban-board">
      {columns.map((col) => (
        <div key={col.id} className="kanban-column">
          <div className="kanban-col-header">
            <div>
              <div className="kanban-col-title">
                {col.icon}
                <span>{col.title}</span>
                <span className="count-chip">{col.tasks.length}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {col.subtitle}
              </div>
            </div>
          </div>

          <div className="kanban-cards-wrapper">
            {col.tasks.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--text-light)',
                  fontSize: '12.5px',
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                No tasks in this stage
              </div>
            ) : (
              col.tasks.map((task) => {
                const colors = getAvatarColor(task.assigned_to?.name, task.assigned_to?.id);
                const priorityClass = `badge-priority-${task.priority.toLowerCase()}`;

                return (
                  <div key={task.id} className="kanban-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span className={`badge ${priorityClass}`}>
                          <span className="badge-dot"></span>
                          {task.priority}
                        </span>
                        {(task.department || task.assigned_to?.department) && (
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              color: '#3b82f6',
                              background: '#eff6ff',
                              border: '1px solid #dbeafe',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {task.department || task.assigned_to?.department}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        #{task.id}
                      </span>
                    </div>

                    <div
                      className="kanban-card-title"
                      onClick={() => onViewTask(task)}
                      style={{ cursor: 'pointer' }}
                    >
                      {task.title}
                    </div>

                    <div className="kanban-card-desc">{task.description}</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <Calendar size={13} />
                      <span>Due {task.due_date}</span>
                    </div>

                    <div className="kanban-card-footer">
                      <div className="user-badge" title={task.assigned_to?.email}>
                        <div
                          className="user-avatar"
                          style={{
                            background: colors.bg,
                            color: colors.text,
                            borderColor: colors.border,
                            width: '24px',
                            height: '24px',
                            fontSize: '10px',
                          }}
                        >
                          {getInitials(task.assigned_to?.name)}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>
                          {task.assigned_to?.name || 'Unassigned'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {col.nextAction && (
                          <button
                            className="kanban-quick-advance"
                            onClick={() => onQuickStatusChange(task.id, col.nextAction.targetStatus)}
                            title={`Advance task to ${col.nextAction.targetStatus}`}
                          >
                            {col.nextAction.icon}
                            <span>{col.nextAction.label}</span>
                          </button>
                        )}
                        <button
                          className="btn-icon"
                          onClick={() => onEditTask(task)}
                          title="Edit Task"
                          style={{ padding: '4px' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => onDeleteTask(task)}
                          title="Delete Task"
                          style={{ padding: '4px', color: 'var(--high-dot)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
