import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StatsCards from '../components/StatsCards';
import RoundRobinTracker from '../components/RoundRobinTracker';
import TaskTable from '../components/TaskTable';
import KanbanBoard from '../components/KanbanBoard';
import CreateTaskModal from '../components/CreateTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import TaskDetailsModal from '../components/TaskDetailsModal';
import EmailSimulatorModal from '../components/EmailSimulatorModal';
import ConfirmModal from '../components/ConfirmModal';
import { api } from '../services/api';
import { Plus, Filter, RotateCcw, Search, LayoutGrid, List, Mail } from 'lucide-react';

export default function Dashboard({
  isCreateTaskOpen,
  setIsCreateTaskOpen,
  isEmailSimulatorOpen,
  setIsEmailSimulatorOpen,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, tasksData, employeesData] = await Promise.all([
        api.getDashboardStats(),
        api.getTasks({
          status: statusFilter,
          assignee: assigneeFilter,
          priority: priorityFilter,
        }),
        api.getEmployees(),
      ]);

      setStats(statsData);
      setTasks(tasksData);
      setEmployees(employeesData);
    } catch (err) {
      showToast('error', 'Error Loading Dashboard', err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, assigneeFilter, priorityFilter, showToast]);

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

  const handleTaskCreated = (newTask) => {
    showToast(
      'success',
      'Task Successfully Allotted',
      `Assigned to ${newTask.assigned_to?.name || 'staff'} (${newTask.assigned_to?.email || ''}) with status 'pending'.`
    );
    loadDashboardData();
  };

  const handleTaskUpdated = (updatedTask) => {
    showToast('success', 'Task Updated', `Task #${updatedTask.id} changes were saved.`);
    loadDashboardData();
    if (selectedTask && selectedTask.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      const updated = await api.updateTaskStatus(taskId, newStatus);
      showToast(
        'success',
        'Status Advanced',
        `Task #${taskId} is now '${newStatus}'.`
      );
      loadDashboardData();
    } catch (err) {
      showToast('error', 'Status Update Failed', err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      await api.deleteTask(taskToDelete.id);
      showToast('success', 'Task Deleted', `Task #${taskToDelete.id} was permanently removed.`);
      setIsDeleteOpen(false);
      setTaskToDelete(null);
      loadDashboardData();
    } catch (err) {
      showToast('error', 'Deletion Failed', err.message);
    }
  };

  const resetFilters = () => {
    setStatusFilter('All');
    setAssigneeFilter('All');
    setPriorityFilter('All');
    setSearchQuery('');
  };

  const activeEmployees = employees.filter((e) => e.active);

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
                placeholder="Search tasks or assignees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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
            {(statusFilter !== 'All' || assigneeFilter !== 'All' || priorityFilter !== 'All' || searchQuery) && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={resetFilters}
                title="Reset all filters"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}

            <button className="btn btn-primary btn-sm" onClick={() => setIsCreateTaskOpen(true)}>
              <Plus size={14} />
              <span>Allot Task</span>
            </button>
          </div>
        </div>

        {/* Dynamic View: Table vs Kanban */}
        {viewMode === 'table' ? (
          <TaskTable
            tasks={filteredTasks}
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
      />

      <EditTaskModal
        isOpen={isEditOpen}
        task={selectedTask}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleTaskUpdated}
      />

      <EmailSimulatorModal
        isOpen={isEmailSimulatorOpen}
        onClose={() => setIsEmailSimulatorOpen(false)}
        onDispatched={loadDashboardData}
        showToast={showToast}
      />

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
    </div>
  );
}
