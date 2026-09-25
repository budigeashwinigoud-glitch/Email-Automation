import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, User, AlertCircle, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { PREDEFINED_DEPARTMENTS } from '../constants/departments';

export default function CreateTaskModal({ isOpen, onClose, onSuccess, employees = [] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deptSelect, setDeptSelect] = useState(''); // Selected from dropdown (or empty)
  const [customDept, setCustomDept] = useState(''); // Typed when 'Other' selected
  const [priority, setPriority] = useState(''); // No default value
  const [dueDate, setDueDate] = useState(''); // No default value
  const [assignmentMode, setAssignmentMode] = useState(''); // No default value: user must explicitly choose 'auto' or 'manual'
  const [manualAssignee, setManualAssignee] = useState(''); // No default value
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeEmployees = useMemo(() => employees.filter((e) => e.active), [employees]);

  // Compute final effective department
  const effectiveDepartment = deptSelect === 'Other' ? customDept.trim() : deptSelect.trim();

  // Combine predefined departments with any custom ones already in employees
  const allDepartmentsList = useMemo(() => {
    const set = new Set(PREDEFINED_DEPARTMENTS);
    employees.forEach((emp) => {
      if (emp.department && emp.department.trim()) {
        set.add(emp.department.trim());
      }
    });
    return Array.from(set);
  }, [employees]);

  // Filter employees for manual selection based on chosen department
  const filteredEmployeesForManual = useMemo(() => {
    if (!effectiveDepartment) return activeEmployees;
    const d = effectiveDepartment.toLowerCase();
    return activeEmployees.filter(
      (e) => e.department && e.department.toLowerCase() === d
    );
  }, [activeEmployees, effectiveDepartment]);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setDeptSelect('');
      setCustomDept('');
      setPriority('');
      setDueDate('');
      setAssignmentMode('');
      setManualAssignee('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Task description is required.');
      return;
    }
    if (deptSelect === 'Other' && !customDept.trim()) {
      setError('Please specify the custom department name or choose an existing department.');
      return;
    }
    if (!priority) {
      setError('Please select a priority level (Low, Medium, or High).');
      return;
    }
    if (!dueDate) {
      setError('Please select a due date.');
      return;
    }
    if (!assignmentMode) {
      setError('Please select an assignment strategy: Auto Round-Robin or Manual.');
      return;
    }
    if (assignmentMode === 'manual' && !manualAssignee) {
      setError('Please select an employee for manual assignment.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        department: effectiveDepartment || null,
        priority,
        due_date: dueDate,
        assignee: assignmentMode === 'auto' ? 'auto' : parseInt(manualAssignee, 10),
      };

      const createdTask = await api.createTask(payload);

      // Instant UI response: close modal and push task to parent state
      onClose();
      onSuccess(createdTask);

      // Reset form fields
      setTitle('');
      setDescription('');
      setDeptSelect('');
      setCustomDept('');
      setPriority('');
      setDueDate('');
      setAssignmentMode('');
      setManualAssignee('');
    } catch (err) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Create & Allot Task</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Intake new task into the automated email dispatch pipeline
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {activeEmployees.length === 0 && (
              <div className="alert alert-danger" style={{ background: '#fffbeb', borderColor: '#fef3c7', color: '#b45309' }}>
                <AlertCircle size={16} />
                <span>No active employees registered yet. Please add an employee first before creating tasks.</span>
              </div>
            )}

            {/* Department Selection */}
            <div className="form-group">
              <label className="form-label">
                Department
              </label>
              <select
                className="form-select"
                value={deptSelect}
                onChange={(e) => {
                  setDeptSelect(e.target.value);
                  setManualAssignee(''); // Reset assignee so user selects from filtered list
                }}
              >
                <option value="">-- All Departments / General --</option>
                {allDepartmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="Other">Other (Create New Department)</option>
              </select>
              <div className="form-help">
                Tasks are allotted based on department. Selecting a department filters employees and targets departmental round-robin rotation.
              </div>

              {deptSelect === 'Other' && (
                <div style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter new department name..."
                    value={customDept}
                    onChange={(e) => {
                      setCustomDept(e.target.value);
                      setManualAssignee('');
                    }}
                    required
                  />
                </div>
              )}
            </div>

            {/* Assignment Method Segmented Switcher (No default value - user must explicitly pick) */}
            <div className="form-group">
              <label className="form-label">
                Assignment Strategy <span className="required">*</span>
              </label>
              <div className="assignment-tabs">
                <button
                  type="button"
                  className={`assignment-tab ${assignmentMode === 'auto' ? 'active' : ''}`}
                  onClick={() => {
                    setAssignmentMode('auto');
                    setError('');
                  }}
                >
                  <Sparkles size={14} />
                  <span>Auto Round-Robin</span>
                </button>
                <button
                  type="button"
                  className={`assignment-tab ${assignmentMode === 'manual' ? 'active' : ''}`}
                  onClick={() => {
                    setAssignmentMode('manual');
                    setError('');
                  }}
                >
                  <User size={14} />
                  <span>Manual Selection</span>
                </button>
              </div>

              {!assignmentMode && (
                <div className="form-help" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Please choose an assignment method above.
                </div>
              )}

              {assignmentMode === 'auto' && (
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12.5px',
                    color: '#1e40af',
                  }}
                >
                  <Sparkles size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Deterministic Cyclic Assignment:</strong> The task will be allotted to the next active employee in{' '}
                    {effectiveDepartment ? <strong>department "{effectiveDepartment}"</strong> : 'rotation'} and stored with status <code>pending</code>.
                  </div>
                </div>
              )}

              {assignmentMode === 'manual' && (
                <div>
                  <label className="form-label" style={{ marginTop: '10px' }}>
                    Select Employee {effectiveDepartment ? `in ${effectiveDepartment}` : ''} <span className="required">*</span>
                  </label>

                  {filteredEmployeesForManual.length === 0 ? (
                    <div
                      style={{
                        padding: '10px 12px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12.5px',
                        color: '#991b1b',
                      }}
                    >
                      No active employees found in department <strong>"{effectiveDepartment}"</strong>. Please register an employee in this department or select another department.
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={manualAssignee}
                      onChange={(e) => setManualAssignee(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Employee ({filteredEmployeesForManual.length} available) --</option>
                      {filteredEmployeesForManual.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} — {emp.email} {emp.department ? `[${emp.department}]` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="form-help">
                    Manual allotment assigns directly and preserves the round-robin pointer.
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">
                Task Title <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                Task Description & Instructions <span className="required">*</span>
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Enter task description, requirements, and deliverables"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Priority Selector (Visual Tiles - No default selected) */}
            <div className="form-group">
              <label className="form-label">
                Priority Level <span className="required">*</span>
              </label>
              <div className="priority-tiles">
                {['Low', 'Medium', 'High'].map((p) => (
                  <div
                    key={p}
                    className={`priority-tile ${priority === p ? `selected-${p}` : ''}`}
                    onClick={() => {
                      setPriority(p);
                      setError('');
                    }}
                  >
                    <span
                      className="badge-dot"
                      style={{
                        background:
                          p === 'High'
                            ? 'var(--high-dot)'
                            : p === 'Medium'
                            ? 'var(--medium-dot)'
                            : 'var(--low-dot)',
                        width: '8px',
                        height: '8px',
                      }}
                    ></span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
              {!priority && (
                <div className="form-help" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Please select a priority level.
                </div>
              )}
            </div>

            {/* Due Date (No default value) */}
            <div className="form-group">
              <label className="form-label">
                Due Date <span className="required">*</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || activeEmployees.length === 0}>
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                  <span>Allotting Task...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Allot & Queue Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
