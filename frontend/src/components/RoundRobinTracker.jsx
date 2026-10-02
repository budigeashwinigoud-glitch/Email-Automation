import React from 'react';
import { RefreshCw, Users, Sparkles, ArrowRight, UserCheck } from 'lucide-react';
import { getAvatarColor, getInitials } from '../utils/colors';

export default function RoundRobinTracker({ employees = [], lastAssignedId = null, onNavigateToEmployees }) {
  const activeEmployees = employees.filter((e) => e.active);

  if (activeEmployees.length === 0) {
    return (
      <div className="rr-tracker-banner empty-rr">
        <div className="rr-tracker-info">
          <div className="rr-icon-box empty">
            <Users size={20} />
          </div>
          <div>
            <div className="rr-title">Deterministic Round-Robin Allotment</div>
            <div className="rr-desc">
              No active team members registered yet. Add employees in the directory to enable automated cyclic task distribution.
            </div>
          </div>
        </div>
        {onNavigateToEmployees && (
          <button className="btn btn-secondary btn-sm" onClick={onNavigateToEmployees}>
            <span>Go to Employees</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>
    );
  }

  // Determine who is next in line
  let nextEmployee = null;
  if (!lastAssignedId) {
    nextEmployee = activeEmployees[0];
  } else {
    const activeIds = activeEmployees.map((e) => e.id);
    if (activeIds.includes(lastAssignedId)) {
      const idx = activeIds.indexOf(lastAssignedId);
      const nextIdx = (idx + 1) % activeIds.length;
      nextEmployee = activeEmployees[nextIdx];
    } else {
      const subsequent = activeEmployees.filter((e) => e.id > lastAssignedId);
      nextEmployee = subsequent.length > 0 ? subsequent[0] : activeEmployees[0];
    }
  }

  return (
    <div className="rr-tracker-banner">
      <div className="rr-tracker-info">
        <div className="rr-icon-box">
          <Sparkles size={18} />
        </div>
        <div>
          <div className="rr-title-row">
            <span className="rr-title">Automated Round-Robin Rotation</span>
            <span className="rr-status-pill">
              <UserCheck size={12} />
              <span>{activeEmployees.length} Eligible Staff</span>
            </span>
          </div>
          <div className="rr-desc">
            Next auto-allotted task will be assigned to{' '}
            <strong className="rr-highlight-name">
              {nextEmployee ? `${nextEmployee.name} (${nextEmployee.email})` : 'Next Staff'}
            </strong>.
          </div>
        </div>
      </div>

      <div className="rr-queue custom-scrollbar">
        {activeEmployees.map((emp, idx) => {
          const isNext = nextEmployee && nextEmployee.id === emp.id;
          const colors = getAvatarColor(emp.name, emp.id);

          return (
            <React.Fragment key={emp.id}>
              <div
                className={`rr-node ${isNext ? 'next-in-line' : ''}`}
                title={`#${emp.id}: ${emp.name} — ${emp.email}${emp.department ? ` [${emp.department}]` : ''}`}
              >
                <div
                  className="rr-node-avatar"
                  style={{
                    background: colors.bg,
                    color: colors.text,
                    border: `1.5px solid ${isNext ? 'var(--primary)' : colors.border}`,
                  }}
                >
                  {getInitials(emp.name)}
                </div>
                <div className="rr-node-meta">
                  <span className="rr-node-name">{emp.name}</span>
                  {emp.department && <span className="rr-node-dept">{emp.department}</span>}
                </div>
                {isNext && <span className="rr-next-badge">Next</span>}
              </div>
              {idx < activeEmployees.length - 1 && <span className="rr-arrow">→</span>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
