import React from 'react';
import { Menu, Plus, RefreshCw, UserPlus, CheckCircle2 } from 'lucide-react';

export default function Header({
  currentTab,
  onOpenCreateTask,
  onOpenCreateEmployee,
  onRefresh,
  isRefreshing,
  onToggleSidebar,
}) {
  return (
    <header className="top-header">
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={onToggleSidebar} aria-label="Toggle navigation menu">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="page-title">
            {currentTab === 'tasks' ? 'Task Operations' : 'Employee Directory'}
          </h1>
          <div className="page-subtitle">
            {currentTab === 'tasks'
              ? 'Automated task allotment, round-robin team rotation, and email dispatch queue'
              : 'Manage team members, department assignments, and rotation eligibility'}
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="api-status-badge" title="Backend Server & Database Active">
          <span className="pulse-dot"></span>
          <span>System Online</span>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Sync latest records from database"
        >
          <RefreshCw size={13} className={isRefreshing ? 'spinner' : ''} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
        </button>

        {currentTab === 'tasks' ? (
          <button className="btn btn-gradient-primary" onClick={onOpenCreateTask} title="Create and allot a new task">
            <Plus size={16} />
            <span>Create Task</span>
          </button>
        ) : (
          <button className="btn btn-gradient-primary" onClick={onOpenCreateEmployee} title="Register a new employee">
            <UserPlus size={16} />
            <span>Add Employee</span>
          </button>
        )}
      </div>
    </header>
  );
}
