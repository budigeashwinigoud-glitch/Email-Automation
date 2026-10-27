import React from 'react';
import { CheckSquare, Users, Layers, ExternalLink, Sparkles, Shield } from 'lucide-react';

export default function Sidebar({
  currentTab,
  setCurrentTab,
  isOpen,
  setIsOpen,
  pendingCount = 0,
  employeeCount = 0,
  onOpenPrivacy,
}) {
  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Layers size={20} />
          </div>
          <div>
            <div className="sidebar-title">Belvo Platform</div>
            <div className="sidebar-subtitle">Task Allotment Engine</div>
          </div>
          <span className="sidebar-badge">v1.2</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          <button
            className={`nav-item ${currentTab === 'tasks' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('tasks');
              setIsOpen(false);
            }}
          >
            <CheckSquare size={18} />
            <span>Task Dashboard</span>
            {pendingCount > 0 && (
              <span className="nav-item-badge" title={`${pendingCount} pending task(s)`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            className={`nav-item ${currentTab === 'employees' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('employees');
              setIsOpen(false);
            }}
          >
            <Users size={18} />
            <span>Employee Directory</span>
            {employeeCount > 0 && (
              <span className="nav-item-badge" title={`${employeeCount} employee(s)`}>
                {employeeCount}
              </span>
            )}
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0' }}>API Engine</div>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>Swagger Documentation</div>
            </div>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              title="Open Interactive FastAPI Documentation"
              style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '6px' }}
            >
              <ExternalLink size={15} />
            </a>
          </div>

          <div style={{ width: '100%', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <a
              href="/privacy"
              onClick={(e) => {
                if (onOpenPrivacy) {
                  e.preventDefault();
                  setIsOpen(false);
                  onOpenPrivacy();
                }
              }}
              className="sidebar-privacy-btn"
              title="View Public Privacy Policy"
            >
              <Shield size={14} color="#60a5fa" />
              <span>Privacy Policy</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 35,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
