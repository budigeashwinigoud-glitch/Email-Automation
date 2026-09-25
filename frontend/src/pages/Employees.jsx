import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, UserPlus, Edit2, UserX, AlertCircle, X, CheckCircle2, Search, List, LayoutGrid, Plus, Sparkles } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { api } from '../services/api';
import { getAvatarColor, getInitials } from '../utils/colors';

export default function Employees({ isCreateOpen, setIsCreateOpen, showToast, refreshTrigger, onAllotTaskToEmployee }) {
  const [employees, setEmployees] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Deactivate Modal State
  const [deactivatingEmployee, setDeactivatingEmployee] = useState(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

  // Add Employee Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit Employee Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      let filterParam = null;
      if (activeFilter === 'active') filterParam = true;
      if (activeFilter === 'inactive') filterParam = false;

      const [empsData, statsData] = await Promise.all([
        api.getEmployees(filterParam),
        api.getDashboardStats(),
      ]);

      setEmployees(empsData);
      setDashboardStats(statsData);
    } catch (err) {
      showToast('error', 'Failed to Load Employees', err.message);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // Client search
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase().trim();
    return employees.filter(
      (e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  // Employee workload mapping
  const employeeTaskStats = useMemo(() => {
    const map = {};
    if (dashboardStats && dashboardStats.employee_stats) {
      for (const s of dashboardStats.employee_stats) {
        map[s.employee_id] = s;
      }
    }
    return map;
  }, [dashboardStats]);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!newName.trim() || !newEmail.trim()) {
      setAddError('Both name and email are required.');
      return;
    }

    setSubmittingAdd(true);
    try {
      const created = await api.createEmployee({
        name: newName.trim(),
        email: newEmail.trim(),
      });
      showToast('success', 'Employee Registered', `${created.name} (${created.email}) added to round-robin rotation.`);
      setNewName('');
      setNewEmail('');
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      setAddError(err.message || 'Failed to create employee.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditEmail(emp.email);
    setEditActive(emp.active);
    setEditError('');
    setIsEditOpen(true);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!editName.trim() || !editEmail.trim()) {
      setEditError('Both name and email are required.');
      return;
    }

    setSubmittingEdit(true);
    try {
      const updated = await api.updateEmployee(editingEmployee.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        active: editActive,
      });
      showToast('success', 'Employee Updated', `${updated.name}'s details were updated.`);
      setIsEditOpen(false);
      setEditingEmployee(null);
      loadData();
    } catch (err) {
      setEditError(err.message || 'Failed to update employee.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingEmployee) return;
    try {
      await api.deactivateEmployee(deactivatingEmployee.id);
      showToast(
        'success',
        'Employee Deactivated',
        `${deactivatingEmployee.name} is now inactive and will be bypassed in future task allotments.`
      );
      setIsDeactivateOpen(false);
      setDeactivatingEmployee(null);
      loadData();
    } catch (err) {
      showToast('error', 'Deactivation Failed', err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="content-area">
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2 className="card-title">Staff & Rotation Directory</h2>
            <span className="count-chip">{filteredEmployees.length} members</span>
          </div>

          <div className="filter-bar">
            {/* Search Input */}
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search staff by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Active Status Filter */}
            <div className="filter-pills">
              <button
                className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All ({employees.length})
              </button>
              <button
                className={`filter-pill ${activeFilter === 'active' ? 'active' : ''}`}
                onClick={() => setActiveFilter('active')}
              >
                Active
              </button>
              <button
                className={`filter-pill ${activeFilter === 'inactive' ? 'active' : ''}`}
                onClick={() => setActiveFilter('inactive')}
              >
                Inactive
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid Cards View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <List size={16} />
              </button>
            </div>

            <button className="btn btn-primary btn-sm" onClick={() => setIsCreateOpen(true)}>
              <UserPlus size={14} />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Loading staff directory...</span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Users size={30} />
            </div>
            <div className="empty-state-title">No employees found</div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              No employee matches your search criteria. Add a new employee to get started.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid Cards View */
          <div className="employee-grid">
            {filteredEmployees.map((emp) => {
              const colors = getAvatarColor(emp.name, emp.id);
              const stats = employeeTaskStats[emp.id] || { pending: 0, sent: 0, done: 0 };
              const totalTasks = stats.pending + stats.sent + stats.done;

              return (
                <div key={emp.id} className="employee-card">
                  <div className="employee-card-header">
                    <div
                      className="employee-card-avatar"
                      style={{
                        background: colors.bg,
                        color: colors.text,
                        borderColor: colors.border,
                      }}
                    >
                      {getInitials(emp.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="employee-card-name" title={emp.name}>
                          {emp.name}
                        </div>
                        <span className={`badge badge-${emp.active ? 'active' : 'inactive'}`} style={{ fontSize: '10.5px' }}>
                          <span className="badge-dot"></span>
                          {emp.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="employee-card-email" title={emp.email}>
                        {emp.email}
                      </div>
                    </div>
                  </div>

                  {/* Workload Breakdown */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Workload</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{totalTasks} Total Tasks</span>
                    </div>

                    <div className="employee-workload-bar">
                      <div
                        className="workload-segment-done"
                        style={{ width: totalTasks > 0 ? `${(stats.done / totalTasks) * 100}%` : '0%' }}
                        title={`${stats.done} Completed`}
                      />
                      <div
                        className="workload-segment-sent"
                        style={{ width: totalTasks > 0 ? `${(stats.sent / totalTasks) * 100}%` : '0%' }}
                        title={`${stats.sent} In Progress`}
                      />
                      <div
                        className="workload-segment-pending"
                        style={{ width: totalTasks > 0 ? `${(stats.pending / totalTasks) * 100}%` : '0%' }}
                        title={`${stats.pending} Pending`}
                      />
                    </div>
                  </div>

                  <div className="employee-stats-row">
                    <div>
                      <div className="employee-stat-box-val" style={{ color: 'var(--pending-text)' }}>
                        {stats.pending}
                      </div>
                      <div className="employee-stat-box-lbl">Pending</div>
                    </div>
                    <div>
                      <div className="employee-stat-box-val" style={{ color: 'var(--sent-text)' }}>
                        {stats.sent}
                      </div>
                      <div className="employee-stat-box-lbl">Sent</div>
                    </div>
                    <div>
                      <div className="employee-stat-box-val" style={{ color: 'var(--done-text)' }}>
                        {stats.done}
                      </div>
                      <div className="employee-stat-box-lbl">Done</div>
                    </div>
                  </div>

                  <div className="employee-card-actions">
                    <div style={{ fontSize: '11.5px', color: 'var(--text-light)' }}>
                      Joined {formatDate(emp.created_at)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleOpenEdit(emp)}
                        title="Edit Details"
                      >
                        <Edit2 size={14} />
                      </button>
                      {emp.active && (
                        <button
                          className="btn-icon"
                          onClick={() => {
                            setDeactivatingEmployee(emp);
                            setIsDeactivateOpen(true);
                          }}
                          title="Deactivate from Rotation"
                          style={{ color: 'var(--high-dot)' }}
                        >
                          <UserX size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Pending</th>
                  <th>Sent</th>
                  <th>Done</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => {
                  const colors = getAvatarColor(emp.name, emp.id);
                  const stats = employeeTaskStats[emp.id] || { pending: 0, sent: 0, done: 0 };

                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="user-badge">
                          <div
                            className="user-avatar"
                            style={{
                              background: colors.bg,
                              color: colors.text,
                              borderColor: colors.border,
                            }}
                          >
                            {getInitials(emp.name)}
                          </div>
                          <div style={{ fontWeight: 700 }}>{emp.name}</div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{emp.email}</td>
                      <td>
                        <span className={`badge badge-${emp.active ? 'active' : 'inactive'}`}>
                          <span className="badge-dot"></span>
                          {emp.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--pending-text)' }}>{stats.pending}</td>
                      <td style={{ fontWeight: 600, color: 'var(--sent-text)' }}>{stats.sent}</td>
                      <td style={{ fontWeight: 600, color: 'var(--done-text)' }}>{stats.done}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {formatDate(emp.created_at)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end', display: 'flex', gap: '4px' }}>
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenEdit(emp)}
                            title="Edit Employee"
                          >
                            <Edit2 size={15} />
                          </button>
                          {emp.active && (
                            <button
                              className="btn-icon"
                              onClick={() => {
                                setDeactivatingEmployee(emp);
                                setIsDeactivateOpen(true);
                              }}
                              title="Deactivate Employee"
                              style={{ color: 'var(--high-dot)' }}
                            >
                              <UserX size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Register New Employee</h2>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Add a team member into the automatic task allotment sequence
                </div>
              </div>
              <button className="btn-icon" onClick={() => setIsCreateOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateEmployee}>
              <div className="modal-body">
                {addError && (
                  <div className="alert alert-danger">
                    <AlertCircle size={16} />
                    <span>{addError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Maria Gonzalez"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. maria.gonzalez@belvo.internal"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                  <div className="form-help">
                    New employees are active by default and automatically enter future round-robin assignments.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={submittingAdd}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingAdd}>
                  {submittingAdd ? 'Registering...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditOpen && editingEmployee && (
        <div className="modal-backdrop" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Employee #{editingEmployee.id}</h2>
              <button className="btn-icon" onClick={() => setIsEditOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateEmployee}>
              <div className="modal-body">
                {editError && (
                  <div className="alert alert-danger">
                    <AlertCircle size={16} />
                    <span>{editError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rotation Status</label>
                  <select
                    className="form-select"
                    value={editActive ? 'true' : 'false'}
                    onChange={(e) => setEditActive(e.target.value === 'true')}
                  >
                    <option value="true">Active (Eligible for round-robin tasks)</option>
                    <option value="false">Inactive (Bypassed in round-robin)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditOpen(false)}
                  disabled={submittingEdit}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingEdit}>
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeactivateOpen}
        title="Deactivate Employee"
        message={
          deactivatingEmployee
            ? `Deactivating ${deactivatingEmployee.name} (${deactivatingEmployee.email}) will immediately remove them from future round-robin task allotments. All historical task records remain preserved.`
            : ''
        }
        confirmText="Deactivate Employee"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => {
          setIsDeactivateOpen(false);
          setDeactivatingEmployee(null);
        }}
        isDanger={true}
      />
    </div>
  );
}
