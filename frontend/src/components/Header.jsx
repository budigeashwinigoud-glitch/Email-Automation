import React from 'react';
import { Menu, Plus, RefreshCw, UserPlus, Mail, ShieldCheck } from 'lucide-react';

export default function Header({
  currentTab,
  onOpenCreateTask,
  onOpenCreateEmployee,
  onOpenEmailSimulator,
  onRefresh,
  isRefreshing,
  onToggleSidebar,
}) {
  return (
    <header className="top-header">
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="page-title">
            {currentTab === 'tasks' ? 'Task Operations' : 'Employee Directory'}
          </h1>
          <div className="page-subtitle">
            {currentTab === 'tasks'
              ? 'Automated task allotment, round-robin rotation, and email dispatch queue'
              : 'Manage staff records, active allocations, and rotation eligibility'}
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="api-status-badge" title="FastAPI Backend Online with SQLite">
          <span className="pulse-dot"></span>
          <span>API Online</span>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Data from Server"
        >
          <RefreshCw size={13} className={isRefreshing ? 'spinner' : ''} />
          <span>Sync</span>
        </button>

        {currentTab === 'tasks' ? (
          <>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenEmailSimulator}
              title="Inspect pending email dispatch queue"
            >
              <Mail size={14} color="var(--primary)" />
              <span>Email Dispatcher</span>
            </button>

            <button className="btn btn-primary" onClick={onOpenCreateTask}>
              <Plus size={16} />
              <span>Create Task</span>
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onOpenCreateEmployee}>
            <UserPlus size={16} />
            <span>Add Employee</span>
          </button>
        )}
      </div>
    </header>
  );
}
