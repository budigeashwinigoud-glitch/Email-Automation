import React from 'react';
import { RefreshCw, Users, AlertCircle } from 'lucide-react';
import { getAvatarColor, getInitials } from '../utils/colors';

export default function RoundRobinTracker({ employees = [], lastAssignedId = null, onNavigateToEmployees }) {
  const activeEmployees = employees.filter((e) => e.active);

  if (activeEmployees.length === 0) {
    return (
      <div className="rr-tracker-banner" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
        <div className="rr-tracker-info">
          <div className="rr-icon-box" style={{ background: '#f1f5f9', color: '#64748b', borderColor: '#cbd5e1' }}>
            <Users size={20} />
          </div>
          <div>
            <div className="rr-title">Round-Robin Allotment Ready</div>
            <div className="rr-desc">
              No employees registered yet. Add team members in the <strong>Employees</strong> section to begin task allotment.
            </div>
          </div>
        </div>
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
          <RefreshCw size={20} />
        </div>
        <div>
          <div className="rr-title">Live Round-Robin Allotment Engine</div>
          <div className="rr-desc">
            {activeEmployees.length} active employee{activeEmployees.length > 1 ? 's' : ''} in deterministic rotation. Next auto-assigned task goes to{' '}
            <strong style={{ color: 'var(--primary)' }}>{nextEmployee?.name || 'N/A'}</strong>.
          </div>
        </div>
      </div>

      <div className="rr-queue">
        {activeEmployees.map((emp, idx) => {
          const isNext = nextEmployee && nextEmployee.id === emp.id;
          const colors = getAvatarColor(emp.name, emp.id);

          return (
            <React.Fragment key={emp.id}>
              <div
                className={`rr-node ${isNext ? 'next-in-line' : ''}`}
                title={`ID #${emp.id}: ${emp.name} (${emp.email})`}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: colors.bg,
                    color: colors.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {getInitials(emp.name)}
                </div>
                <span>{emp.name}</span>
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
