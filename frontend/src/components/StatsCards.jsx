import React from 'react';
import { Layers, Clock, Send, CheckCircle2, Users, ArrowUpRight } from 'lucide-react';

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
      badge: 'All',
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
      badge: total_tasks > 0 ? `${Math.round((pending_tasks / total_tasks) * 100)}%` : '0%',
    },
    {
      id: 'sent',
      filterVal: 'sent',
      label: 'Dispatched (Sent)',
      value: sent_tasks,
      icon: <Send size={20} />,
      classModifier: 'card-sent',
      iconClass: 'stat-icon-sent',
      subtext: 'Delivered to inbox',
      badge: total_tasks > 0 ? `${Math.round((sent_tasks / total_tasks) * 100)}%` : '0%',
    },
    {
      id: 'done',
      filterVal: 'done',
      label: 'Completed Tasks',
      value: completed_tasks,
      icon: <CheckCircle2 size={20} />,
      classModifier: 'card-done',
      iconClass: 'stat-icon-completed',
      subtext: 'Successfully finished',
      badge: total_tasks > 0 ? `${Math.round((completed_tasks / total_tasks) * 100)}%` : '0%',
    },
    {
      id: 'employees',
      filterVal: null,
      label: 'Active Staff',
      value: active_employees,
      icon: <Users size={20} />,
      classModifier: 'card-employees',
      iconClass: 'stat-icon-employees',
      subtext: 'In rotation pool',
      badge: 'Active',
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
            className={`stat-card ${card.classModifier} ${isSelected ? 'selected-filter-card' : ''}`}
            onClick={() => isClickable && onSelectStatusFilter(card.filterVal)}
            style={{
              cursor: isClickable ? 'pointer' : 'default',
            }}
            title={isClickable ? `Filter tasks by ${card.label}` : undefined}
          >
            <div className="stat-header">
              <span className="stat-label">{card.label}</span>
              <div className="stat-header-right">
                <span className="stat-trend-chip">{card.badge}</span>
                <div className={`stat-icon-wrapper ${card.iconClass}`}>
                  {card.icon}
                </div>
              </div>
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-subtext">{card.subtext}</div>
            {isSelected && (
              <div className="stat-active-indicator">
                <span>Active Filter</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
