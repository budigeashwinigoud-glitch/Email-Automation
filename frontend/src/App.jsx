import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmailSimulatorModal from './components/EmailSimulatorModal';
import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('tasks'); // 'tasks' or 'employees'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [isEmailSimulatorOpen, setIsEmailSimulatorOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // App metrics for sidebar badges
  const [stats, setStats] = useState(null);

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    loadGlobalStats();
  }, [refreshTrigger]);

  const loadGlobalStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch {
      // Ignored here as Dashboard will catch and report
    }
  };

  const showToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 450);
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onOpenEmailSimulator={() => setIsEmailSimulatorOpen(true)}
        pendingCount={stats?.pending_tasks || 0}
        employeeCount={stats?.active_employees || 0}
      />

      <div className="main-wrapper">
        <Header
          currentTab={currentTab}
          onOpenCreateTask={() => setIsCreateTaskOpen(true)}
          onOpenCreateEmployee={() => setIsCreateEmployeeOpen(true)}
          onOpenEmailSimulator={() => setIsEmailSimulatorOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main>
          {currentTab === 'tasks' ? (
            <Dashboard
              isCreateTaskOpen={isCreateTaskOpen}
              setIsCreateTaskOpen={setIsCreateTaskOpen}
              isEmailSimulatorOpen={isEmailSimulatorOpen}
              setIsEmailSimulatorOpen={setIsEmailSimulatorOpen}
              showToast={showToast}
              refreshTrigger={refreshTrigger}
            />
          ) : (
            <Employees
              isCreateOpen={isCreateEmployeeOpen}
              setIsCreateOpen={setIsCreateEmployeeOpen}
              showToast={showToast}
              refreshTrigger={refreshTrigger}
            />
          )}
        </main>
      </div>

      <EmailSimulatorModal
        isOpen={isEmailSimulatorOpen}
        onClose={() => setIsEmailSimulatorOpen(false)}
        onDispatched={handleRefresh}
        showToast={showToast}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
