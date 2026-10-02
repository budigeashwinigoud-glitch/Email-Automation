import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, User, AlertCircle, Building2, Send, Save, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function CreateTaskModal({ isOpen, onClose, onSuccess, employees = [] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deptSelect, setDeptSelect] = useState('');
  const [customDept, setCustomDept] = useState('');
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignmentMode, setAssignmentMode] = useState('');
  const [manualAssignee, setManualAssignee] = useState('');
  
  // Loading states for both buttons
  const [submittingAction, setSubmittingAction] = useState(null); // 'save' | 'send' | null
  const [error, setError] = useState('');

  const activeEmployees = useMemo(() => employees.filter((e) => e.active), [employees]);

  // Compute final effective department
  const effectiveDepartment = deptSelect === 'Other' ? customDept.trim() : deptSelect.trim();

  // Only offer departments that currently have active employees to assign.
  const allDepartmentsList = useMemo(() => {
    const set = new Set();
    activeEmployees.forEach((emp) => {
      if (emp.department && emp.department.trim()) {
        set.add(emp.department.trim());
      }
    });
    return Array.from(set).sort((first, second) => first.localeCompare(second));
  }, [activeEmployees]);

  // Filter employees for manual selection based on chosen department
  const filteredEmployeesForManual = useMemo(() => {
    if (!effectiveDepartment) return activeEmployees;
    const d = effectiveDepartment.toLowerCase();
    return activeEmployees.filter(
      (e) => e.department && e.department.toLowerCase() === d
    );
  }, [activeEmployees, effectiveDepartment]);

  const manualTeamLeaders = filteredEmployeesForManual.filter((employee) => employee.is_team_leader);
  const manualEmployees = filteredEmployeesForManual.filter((employee) => !employee.is_team_leader);

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
      setSubmittingAction(null);
    }
  }, [isOpen]);

  const validateForm = () => {
    if (!title.trim()) {
      setError('Task title is required.');
      return false;
    }
    if (!description.trim()) {
      setError('Task description and instructions are required.');
      return false;
    }
    if (deptSelect === 'Other' && !customDept.trim()) {
      setError('Please specify the custom department name or choose an existing department.');
      return false;
    }
    if (!priority) {
      setError('Please select a priority level (Low, Medium, or High).');
      return false;
    }
    if (!dueDate) {
      setError('Please select a due date.');
      return false;
    }
    if (!assignmentMode) {
      setError('Please select an assignment strategy: Auto Round-Robin or Manual Selection.');
      return false;
    }
    if (assignmentMode === 'manual' && !manualAssignee) {
      setError('Please select an employee for manual assignment.');
      return false;
    }
    return true;
  };

  const handleAllot = async (shouldSendEmail = false) => {
    setError('');
    if (!validateForm()) return;

    setSubmittingAction(shouldSendEmail ? 'send' : 'save');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        department: effectiveDepartment || null,
        priority,
        due_date: dueDate,
        assignee: assignmentMode === 'auto' ? 'auto' : parseInt(manualAssignee, 10),
      };

      // 1. Create and allot task in database
      const createdTask = await api.createTask(payload);

      // 2. If user chose "Allot & Send Email Now", attempt immediate dispatch
      if (shouldSendEmail) {
        try {
          const sentTask = await api.sendTaskEmail(createdTask.id);
          onClose();
          onSuccess(sentTask, true);
        } catch (sendErr) {
          // If email fails (e.g. SMTP credentials not set), task remains pending
          onClose();
          onSuccess(createdTask, false, sendErr.message);
        }
      } else {
        // Normal save as pending
        onClose();
        onSuccess(createdTask, false);
      }
    } catch (err) {
      setError(err.message || 'Failed to create and allot task.');
    } finally {
      setSubmittingAction(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-badge-chip">
              <Sparkles size={13} />
              <span>Task Intake Engine</span>
            </div>
            <h2 className="modal-title">Create & Allot Task</h2>
            <div className="modal-subtitle">
              Assign task via departmental round-robin and choose to save as pending or dispatch email immediately
            </div>
          </div>
          <button className="btn-icon modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form with Flex Layout for Smooth Scrolling */}
        <div className="modal-form">
          <div className="modal-body custom-scrollbar">
            {error && (
              <div className="alert alert-danger" style={{ animation: 'shake 0.3s ease' }}>
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {activeEmployees.length === 0 && (
              <div className="alert alert-warning">
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>No active employees registered yet. Please add staff in the Employee Directory before creating tasks.</span>
              </div>
            )}

            {/* Department Selection */}
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label">
                  Target Department
                </label>
                <span className="form-optional-tag">Optional / Auto-Filter</span>
              </div>
              <div className="input-with-icon-wrapper">
                <Building2 size={16} className="input-lead-icon" />
                <select
                  className="form-select form-input-with-icon"
                  value={deptSelect}
                  onChange={(e) => {
                    setDeptSelect(e.target.value);
                    setManualAssignee('');
                  }}
                >
                  <option value="">-- All Departments / Organization Wide --</option>
                  {allDepartmentsList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value="Other">✨ Other (Create New Department...)</option>
                </select>
              </div>

              {deptSelect === 'Other' && (
                <div style={{ marginTop: '10px', animation: 'fadeIn 0.2s ease' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type new department name (e.g. Mobile Apps, DevOps, Finance)..."
                    value={customDept}
                    onChange={(e) => {
                      setCustomDept(e.target.value);
                      setManualAssignee('');
                    }}
                    autoFocus
                    required
                  />
                </div>
              )}
              <div className="form-help">
                Selecting a department isolates the round-robin rotation pool strictly to staff in that department.
              </div>
            </div>

            {/* Assignment Method Switcher */}
            <div className="form-group">
              <label className="form-label">
                Assignment Strategy <span className="required">*</span>
              </label>
              <div className="assignment-cards-grid">
                <div
                  className={`assignment-card ${assignmentMode === 'auto' ? 'selected' : ''}`}
                  onClick={() => {
                    setAssignmentMode('auto');
                    setError('');
                  }}
                >
                  <div className="assignment-card-icon auto-icon">
                    <Sparkles size={18} />
                  </div>
                  <div className="assignment-card-content">
                    <div className="assignment-card-title">Auto Round-Robin</div>
                    <div className="assignment-card-desc">
                      Cyclically assigns to the next active employee in sequence.
                    </div>
                  </div>
                  <div className="assignment-card-radio">
                    <div className="radio-inner" />
                  </div>
                </div>

                <div
                  className={`assignment-card ${assignmentMode === 'manual' ? 'selected' : ''}`}
                  onClick={() => {
                    setAssignmentMode('manual');
                    setError('');
                  }}
                >
                  <div className="assignment-card-icon manual-icon">
                    <User size={18} />
                  </div>
                  <div className="assignment-card-content">
                    <div className="assignment-card-title">Manual Selection</div>
                    <div className="assignment-card-desc">
                      Assign directly to a specific team member of your choice.
                    </div>
                  </div>
                  <div className="assignment-card-radio">
                    <div className="radio-inner" />
                  </div>
                </div>
              </div>

              {assignmentMode === 'auto' && (
                <div className="strategy-info-banner auto-banner">
                  <Sparkles size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Cyclic Rotation Active:</strong> The task will be assigned to the next eligible employee{' '}
                    {effectiveDepartment ? <span>in <strong>"{effectiveDepartment}"</strong></span> : 'in the company rotation'}.
                  </div>
                </div>
              )}

              {assignmentMode === 'manual' && (
                <div className="manual-assignee-box">
                  <div className="form-label-row">
                    <label className="form-label">
                      Select Assignee {effectiveDepartment ? `(${effectiveDepartment})` : ''} <span className="required">*</span>
                    </label>
                    <span className="count-chip">{filteredEmployeesForManual.length} Available</span>
                  </div>

                  {filteredEmployeesForManual.length === 0 ? (
                    <div className="alert alert-danger" style={{ margin: '6px 0 0 0' }}>
                      No active staff found in <strong>"{effectiveDepartment || 'General'}"</strong>. Please register an employee or change department.
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={manualAssignee}
                      onChange={(e) => setManualAssignee(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Employee Assignee --</option>
                      {manualTeamLeaders.length > 0 && (
                        <optgroup label="Team Leaders">
                          {manualTeamLeaders.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} — {emp.email}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {manualEmployees.length > 0 && (
                        <optgroup label="Employees">
                          {manualEmployees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} — {emp.email}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Task Title */}
            <div className="form-group">
              <label className="form-label">
                Task Title <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Build WhatsApp Automation Webhook, Update UI Components"
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
                placeholder="Provide clear instructions, deliverables, requirements, and reference links for the assignee..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Priority & Due Date in a 2-Column Row */}
            <div className="form-row-2col">
              {/* Priority */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Priority Level <span className="required">*</span>
                </label>
                <div className="priority-tiles">
                  {[
                    { key: 'Low', label: 'Low', color: 'var(--low-dot)' },
                    { key: 'Medium', label: 'Medium', color: 'var(--medium-dot)' },
                    { key: 'High', label: 'High', color: 'var(--high-dot)' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      className={`priority-tile ${priority === item.key ? `selected-${item.key}` : ''}`}
                      onClick={() => {
                        setPriority(item.key);
                        setError('');
                      }}
                    >
                      <span className="badge-dot" style={{ background: item.color }}></span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Due Date <span className="required">*</span>
                </label>
                <div className="input-with-icon-wrapper">
                  <Calendar size={16} className="input-lead-icon" />
                  <input
                    type="date"
                    className="form-input form-input-with-icon"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Dispatch Action Explanation Banner */}
            <div className="dispatch-action-guide">
              <div className="guide-header">
                <Clock size={15} color="var(--primary)" />
                <span>Next Step Action Choices:</span>
              </div>
              <div className="guide-options">
                <div className="guide-option-item">
                  <Save size={13} color="var(--text-secondary)" />
                  <span><strong>Save & Allot:</strong> Queues task as <code>pending</code> without sending email.</span>
                </div>
                <div className="guide-option-item">
                  <Send size={13} color="var(--primary)" />
                  <span><strong>Allot & Send Email:</strong> Allots task and immediately delivers email to assignee inbox.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer with Both Clear Save and Send Actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submittingAction !== null}
            >
              Cancel
            </button>

            {/* Action 1: Save & Allot as Pending */}
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => handleAllot(false)}
              disabled={submittingAction !== null || activeEmployees.length === 0}
              title="Assign task and store in queue as Pending"
            >
              {submittingAction === 'save' ? (
                <>
                  <span className="spinner spinner-sm"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save & Allot (Pending)</span>
                </>
              )}
            </button>

            {/* Action 2: Allot & Send Email Immediately */}
            <button
              type="button"
              className="btn btn-gradient-primary"
              onClick={() => handleAllot(true)}
              disabled={submittingAction !== null || activeEmployees.length === 0}
              title="Assign task and immediately send email notification to employee"
            >
              {submittingAction === 'send' ? (
                <>
                  <span className="spinner spinner-sm"></span>
                  <span>Sending Email...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Allot & Send Email Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
