import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StatsCards from '../components/StatsCards';
import RoundRobinTracker from '../components/RoundRobinTracker';
import TaskTable from '../components/TaskTable';
import KanbanBoard from '../components/KanbanBoard';
import CreateTaskModal from '../components/CreateTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import TaskDetailsModal from '../components/TaskDetailsModal';
import ConfirmModal from '../components/ConfirmModal';
import { api } from '../services/api';
import { Plus, Filter, RotateCcw, Search, LayoutGrid, List, X } from 'lucide-react';

export default function Dashboard({
  isCreateTaskOpen,
  setIsCreateTaskOpen,
  showToast,
  refreshTrigger,
}) {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & View Mode
  const [statusFilter, setStatusFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Send Email State
  const [taskToSendEmail, setTaskToSendEmail] = useState(null);
  const [isSendEmailConfirmOpen, setIsSendEmailConfirmOpen] = useState(false);
  const [sendingTaskIds, setSendingTaskIds] = useState([]);
  const [failedTaskIds, setFailedTaskIds] = useState([]);

  const loadDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [statsData, tasksData, employeesData] = await Promise.all([
        api.getDashboardStats(),
        api.getTasks({
          status: statusFilter,
          assignee: assigneeFilter,
          priority: priorityFilter,
          department: departmentFilter,
        }),
        api.getEmployees(),
      ]);

      setStats(statsData);
      setTasks(tasksData);
      setEmployees(employeesData);
    } catch (err) {
      showToast('error', 'Error Loading Dashboard', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter, assigneeFilter, priorityFilter, departmentFilter, showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, refreshTrigger]);

  // Client-side search query filtering
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase().trim();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.assigned_to && t.assigned_to.name.toLowerCase().includes(q)) ||
        (t.assigned_to && t.assigned_to.email.toLowerCase().includes(q))
    );
  }, [tasks, searchQuery]);

  const handleTaskCreated = (newTask, wasEmailed = false, emailError = null) => {
    // 1. Optimistic instant addition to tasks state (0ms lag!)
    setTasks((prev) => {
      if (prev.some((t) => t.id === newTask.id)) {
        return prev.map((t) => (t.id === newTask.id ? newTask : t));
      }
      return [newTask, ...prev];
    });

    const isSent = newTask.status === 'sent' || wasEmailed;

    // 2. Optimistic instant increment of stats counters
    setStats((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        total_tasks: (prev.total_tasks || 0) + 1,
        pending_tasks: isSent ? (prev.pending_tasks || 0) : (prev.pending_tasks || 0) + 1,
        sent_tasks: isSent ? (prev.sent_tasks || 0) + 1 : (prev.sent_tasks || 0),
      };
    });

    // 3. User toast notification
    const assigneeName = newTask.assigned_to?.name || 'staff member';
    const assigneeEmail = newTask.assigned_to?.email || '';

    if (isSent) {
      showToast(
        'success',
        'Task Allotted & Email Sent!',
        `Successfully assigned to ${assigneeName} and dispatched to ${assigneeEmail}.`
      );
    } else if (emailError) {
      showToast(
        'warning',
        'Task Allotted (Email Pending)',
        `Assigned to ${assigneeName} as pending. Note: ${emailError}`
      );
    } else {
      showToast(
        'success',
        'Task Saved & Allotted',
        `Assigned to ${assigneeName} (${assigneeEmail}) in pending queue.`
      );
    }

    // 4. Silent background sync without unmounting table or showing loading spinners
    loadDashboardData(true);
  };

  const handleTaskUpdated = (updatedTask) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    showToast('success', 'Task Updated', `Task #${updatedTask.id} changes were saved.`);
    loadDashboardData(true);
    if (selectedTask && selectedTask.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleQuickStatusChange = async (taskId, newStatus) => {
    // Optimistic status advance (instant badge transition)
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    showToast(
      'success',
      'Status Advanced',
      `Task #${taskId} is now '${newStatus}'.`
    );

    try {
      await api.updateTaskStatus(taskId, newStatus);
      loadDashboardData(true);
    } catch (err) {
      showToast('error', 'Status Update Failed', err.message);
      loadDashboardData(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    const target = taskToDelete;
    setIsDeleteOpen(false);
    setTaskToDelete(null);

    // Optimistic removal for zero-latency UI
    setTasks((prev) => prev.filter((t) => t.id !== target.id));
    setStats((prev) => {
      if (!prev) return prev;
      const decPending = target.status === 'pending' ? 1 : 0;
      const decSent = target.status === 'sent' ? 1 : 0;
      const decDone = target.status === 'done' ? 1 : 0;
      return {
        ...prev,
        total_tasks: Math.max(0, (prev.total_tasks || 0) - 1),
        pending_tasks: Math.max(0, (prev.pending_tasks || 0) - decPending),
        sent_tasks: Math.max(0, (prev.sent_tasks || 0) - decSent),
        completed_tasks: Math.max(0, (prev.completed_tasks || 0) - decDone),
      };
    });

    try {
      await api.deleteTask(target.id);
      showToast('success', 'Task Deleted', `Task #${target.id} was permanently removed.`);
      loadDashboardData(true);
    } catch (err) {
      showToast('error', 'Deletion Failed', err.message);
      loadDashboardData();
    }
  };

  const handleInitiateSendEmail = (task) => {
    setTaskToSendEmail(task);
    setIsSendEmailConfirmOpen(true);
  };

  const handleConfirmSendEmail = async () => {
    if (!taskToSendEmail) return;
    const target = taskToSendEmail;
    const assigneeName = target.assigned_to?.name || 'the assigned employee';
    setIsSendEmailConfirmOpen(false);
    setTaskToSendEmail(null);

    // Disable button and show [ Sending... ]
    setSendingTaskIds((prev) => [...prev, target.id]);
    setFailedTaskIds((prev) => prev.filter((id) => id !== target.id));

    try {
      // Send task email via backend email service (DO NOT optimistically mark as Sent)
      const updatedTask = await api.sendTaskEmail(target.id);

      // Only after successful email delivery confirmation from backend:
      // 1. Update task in local state with new status ('sent') and 'sent_at'
      setTasks((prev) =>
        prev.map((t) => (t.id === target.id ? updatedTask : t))
      );

      // 2. Update dashboard status counters: decrement pending, increment sent
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pending_tasks: Math.max(0, (prev.pending_tasks || 0) - 1),
          sent_tasks: (prev.sent_tasks || 0) + 1,
        };
      });

      // 3. Display success toast
      showToast(
        'success',
        'Email Sent',
        `Task email sent successfully to ${assigneeName}.`
      );

      // 4. Background refresh
      loadDashboardData(true);
    } catch (err) {
      // If email sending fails:
      // Keep task pending, mark as failed for retry button, display error toast
      setFailedTaskIds((prev) => [...prev, target.id]);
      showToast(
        'error',
        'Email Sending Failed',
        err.message || 'Email could not be sent. Please try again.'
      );
    } finally {
      setSendingTaskIds((prev) => prev.filter((id) => id !== target.id));
    }
  };

  const resetFilters = () => {
    setStatusFilter('All');
    setAssigneeFilter('All');
    setPriorityFilter('All');
    setDepartmentFilter('All');
    setSearchQuery('');
  };

  const activeEmployees = employees.filter((e) => e.active);

  // Only offer department labels present in employee or task records.
  const availableDepartments = useMemo(() => {
    const set = new Set();
    employees.forEach((e) => {
      if (e.department && e.department.trim()) set.add(e.department.trim());
    });
    tasks.forEach((t) => {
      if (t.department && t.department.trim()) set.add(t.department.trim());
    });
    return Array.from(set).sort((first, second) => first.localeCompare(second));
  }, [employees, tasks]);

  useEffect(() => {
    if (departmentFilter !== 'All' && !availableDepartments.includes(departmentFilter)) {
      setDepartmentFilter('All');
    }
  }, [departmentFilter, availableDepartments]);

  // Determine last assigned employee ID from the latest task
  const lastAssignedId = tasks.length > 0 && tasks[0].assigned_to ? tasks[0].assigned_to.id : null;

  return (
    <div className="content-area">
      {/* Metric Cards */}
      <StatsCards
        stats={stats}
        onSelectStatusFilter={(val) => setStatusFilter(val)}
        currentStatusFilter={statusFilter}
      />

      {/* Round-Robin Allotment Live Tracker Widget */}
      <RoundRobinTracker employees={employees} lastAssignedId={lastAssignedId} />

      {/* Task Operations Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2 className="card-title">Task Inventory</h2>
            <span className="count-chip">{filteredTasks.length} tasks</span>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar">
            {/* Live Search Input */}
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by title, description, or assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Department Filter */}
            {availableDepartments.length > 0 && (
              <select
                className="filter-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="All">All Departments</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}

            {/* Status Pills */}
            <div className="filter-pills">
              {['All', 'pending', 'sent', 'done'].map((st) => (
                <button
                  key={st}
                  className={`filter-pill ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === 'All' ? 'All' : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>

            {/* Assignee Filter */}
            <select
              className="filter-select"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="All">All Staff</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              className="filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            {/* View Mode Toggle */}
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <List size={16} />
              </button>
              <button
                className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                onClick={() => setViewMode('kanban')}
                title="Kanban Board View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {/* Reset Filters */}
            {(statusFilter !== 'All' || assigneeFilter !== 'All' || priorityFilter !== 'All' || departmentFilter !== 'All' || searchQuery) && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={resetFilters}
                title="Reset all filters to default"
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic View: Table vs Kanban */}
        {viewMode === 'table' ? (
          <TaskTable
            tasks={filteredTasks}
            hasAnyTasks={(stats?.total_tasks || 0) > 0}
            loading={loading}
            onViewTask={(task) => {
              setSelectedTask(task);
              setIsDetailsOpen(true);
            }}
            onEditTask={(task) => {
              setSelectedTask(task);
              setIsEditOpen(true);
            }}
            onDeleteTask={(task) => {
              setTaskToDelete(task);
              setIsDeleteOpen(true);
            }}
            onQuickStatusChange={handleQuickStatusChange}
            onSendEmail={handleInitiateSendEmail}
            sendingTaskIds={sendingTaskIds}
            failedTaskIds={failedTaskIds}
          />
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            onViewTask={(task) => {
              setSelectedTask(task);
              setIsDetailsOpen(true);
            }}
            onEditTask={(task) => {
              setSelectedTask(task);
              setIsEditOpen(true);
            }}
            onDeleteTask={(task) => {
              setTaskToDelete(task);
              setIsDeleteOpen(true);
            }}
            onQuickStatusChange={handleQuickStatusChange}
            onSendEmail={handleInitiateSendEmail}
            sendingTaskIds={sendingTaskIds}
            failedTaskIds={failedTaskIds}
          />
        )}
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onSuccess={handleTaskCreated}
        employees={employees}
      />

      <TaskDetailsModal
        isOpen={isDetailsOpen}
        task={selectedTask}
        onClose={() => setIsDetailsOpen(false)}
        onStatusUpdated={handleTaskUpdated}
        onOpenEdit={(task) => {
          setSelectedTask(task);
          setIsEditOpen(true);
        }}
        onSendEmail={handleInitiateSendEmail}
      />

      <EditTaskModal
        isOpen={isEditOpen}
        task={selectedTask}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleTaskUpdated}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Delete Task"
        message={
          taskToDelete
            ? `Are you sure you want to delete task #${taskToDelete.id} ("${taskToDelete.title}")? This action cannot be undone.`
            : ''
        }
        confirmText="Delete Task"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteOpen(false);
          setTaskToDelete(null);
        }}
        isDanger={true}
      />

      {/* Send Email Confirmation Modal */}
      <ConfirmModal
        isOpen={isSendEmailConfirmOpen}
        title="Send Task Email"
        message={
          taskToSendEmail
            ? `Send this task to ${taskToSendEmail.assigned_to?.name || 'the assigned employee'} by email?`
            : ''
        }
        confirmText="Send Email"
        onConfirm={handleConfirmSendEmail}
        onCancel={() => {
          setIsSendEmailConfirmOpen(false);
          setTaskToSendEmail(null);
        }}
        isDanger={false}
      />
    </div>
  );
}

