import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { PREDEFINED_DEPARTMENTS } from '../constants/departments';

export default function EditTaskModal({ isOpen, task, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState('');
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      if (!task.department) {
        setDepartment('');
        setCustomDepartment('');
      } else if (PREDEFINED_DEPARTMENTS.includes(task.department)) {
        setDepartment(task.department);
        setCustomDepartment('');
      } else {
        setDepartment('Other');
        setCustomDepartment(task.department);
      }
      setPriority(task.priority || '');
      setDueDate(task.due_date || '');
      setAssignee(task.assigned_to ? task.assigned_to.id : '');
      setStatus(task.status || '');
      setError('');
      loadEmployees();
    }
  }, [isOpen, task]);

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees(true);
      setActiveEmployees(data);
    } catch (err) {
      setError('Failed to load employee list: ' + err.message);
    }
  };

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
    if (!dueDate) {
      setError('Due date is required.');
      return;
    }

    const effectiveDept =
      department === 'Other' ? customDepartment.trim() : department.trim();

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        department: effectiveDept || null,
        priority,
        due_date: dueDate,
        assignee: parseInt(assignee, 10),
        status,
      };

      const updatedTask = await api.updateTask(task.id, payload);
      onSuccess(updatedTask);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update task.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Task #{task.id}</h2>
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

            <div className="form-group">
              <label className="form-label">
                Task Title <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Description <span className="required">*</span>
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  if (e.target.value !== 'Other') {
                    setCustomDepartment('');
                  }
                }}
              >
                <option value="">-- General / No Department --</option>
                {PREDEFINED_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="Other">Other (Custom Department)</option>
              </select>

              {department === 'Other' && (
                <div style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter custom department name..."
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assigned Employee</label>
                <select
                  className="form-select"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  required
                >
                  {/* Keep current assignee even if inactive */}
                  {task.assigned_to && !activeEmployees.some((e) => e.id === task.assigned_to.id) && (
                    <option value={task.assigned_to.id}>
                      {task.assigned_to.name} (Current - Inactive)
                    </option>
                  )}
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
