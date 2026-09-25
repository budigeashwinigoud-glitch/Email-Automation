import React from 'react';
import { Layers, Clock, Send, CheckCircle2, Users } from 'lucide-react';

export default function StatsCards({ stats, onSelectStatusFilter, currentStatusFilter }) {
  const {
    total_tasks = 0,
    pending_tasks = 0,
    sent_tasks = 0,
    completed_tasks = 0,
    active_employees = 0,
  } = stats || {};

  const cards = [
    {
      id: 'total',
      filterVal: 'All',
      label: 'Total Tasks',
      value: total_tasks,
      icon: <Layers size={20} />,
      classModifier: 'card-total',
      iconClass: 'stat-icon-total',
      subtext: 'Across all lifecycle stages',
    },
    {
      id: 'pending',
      filterVal: 'pending',
      label: 'Pending Allotment',
      value: pending_tasks,
      icon: <Clock size={20} />,
      classModifier: 'card-pending',
      iconClass: 'stat-icon-pending',
      subtext: 'Awaiting email dispatch',
    },
    {
      id: 'sent',
      filterVal: 'sent',
      label: 'Dispatched (Sent)',
      value: sent_tasks,
      icon: <Send size={20} />,
      classModifier: 'card-sent',
      iconClass: 'stat-icon-sent',
      subtext: 'In employee inbox',
    },
    {
      id: 'done',
      filterVal: 'done',
      label: 'Completed Tasks',
      value: completed_tasks,
      icon: <CheckCircle2 size={20} />,
      classModifier: 'card-done',
      iconClass: 'stat-icon-completed',
      subtext: 'Marked as finished',
    },
    {
      id: 'employees',
      filterVal: null,
      label: 'Active Employees',
      value: active_employees,
      icon: <Users size={20} />,
      classModifier: 'card-employees',
      iconClass: 'stat-icon-employees',
      subtext: 'In round-robin rotation',
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card) => {
        const isClickable = card.filterVal !== null && onSelectStatusFilter;
        const isSelected = isClickable && currentStatusFilter === card.filterVal;

        return (
          <div
            key={card.id}
            className={`stat-card ${card.classModifier}`}
            onClick={() => isClickable && onSelectStatusFilter(card.filterVal)}
            style={{
              cursor: isClickable ? 'pointer' : 'default',
              borderColor: isSelected ? 'var(--primary)' : undefined,
              boxShadow: isSelected ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : undefined,
            }}
            title={isClickable ? `Click to filter by ${card.label}` : undefined}
          >
            <div className="stat-header">
              <span className="stat-label">{card.label}</span>
              <div className={`stat-icon-wrapper ${card.iconClass}`}>
                {card.icon}
              </div>
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-subtext">{card.subtext}</div>
          </div>
        );
      })}
    </div>
  );
}
