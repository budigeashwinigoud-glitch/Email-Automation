import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { api } from './services/api';

const isPrivacyPath = () => {
  if (typeof window !== 'undefined') {
    const p = window.location.pathname.toLowerCase();
    return p === '/privacy' || p === '/privacy/' || p.startsWith('/privacy');
  }
  return false;
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(() => (isPrivacyPath() ? 'privacy' : 'app'));
  const [currentTab, setCurrentTab] = useState('tasks'); // 'tasks' or 'employees'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // App metrics for sidebar badges
  const [stats, setStats] = useState(null);
  const [isSystemOnline, setIsSystemOnline] = useState(true);

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  // Listen to browser forward/back popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(isPrivacyPath() ? 'privacy' : 'app');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    // Only fetch operational dashboard stats when in application view
    if (currentRoute === 'app') {
      loadGlobalStats();
    }
  }, [refreshTrigger, currentRoute]);

  const loadGlobalStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      setIsSystemOnline(true);
    } catch {
      setIsSystemOnline(false);
    }
  };

  const navigateTo = (route, tab = 'tasks') => {
    if (route === 'privacy') {
      window.history.pushState({}, '', '/privacy');
      setCurrentRoute('privacy');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.history.pushState({}, '', '/');
      setCurrentRoute('app');
      if (tab) setCurrentTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      showToast('success', 'Data Synchronized', 'Dashboard and staff records updated.');
    }, 450);
  };

  // If viewing Privacy Policy, render public standalone page without requiring authentication or backend API calls
  if (currentRoute === 'privacy') {
    return (
      <div className="app-container privacy-view">
        <PrivacyPolicy onBack={() => navigateTo('app', 'tasks')} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        pendingCount={stats?.pending_tasks || 0}
        employeeCount={stats?.active_employees || 0}
        onOpenPrivacy={() => navigateTo('privacy')}
      />

      <div className="main-wrapper">
        <Header
          currentTab={currentTab}
          onOpenCreateTask={() => setIsCreateTaskOpen(true)}
          onOpenCreateEmployee={() => setIsCreateEmployeeOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSystemOnline={isSystemOnline}
        />

        <main>
          {currentTab === 'tasks' ? (
            <Dashboard
              isCreateTaskOpen={isCreateTaskOpen}
              setIsCreateTaskOpen={setIsCreateTaskOpen}
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

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
