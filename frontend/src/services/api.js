const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Universal request helper with unified error extraction
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    let data = null;

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred.';
      if (data && data.detail) {
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          // Pydantic validation error format
          errorMessage = data.detail.map((err) => `${err.loc.slice(1).join('.')}: ${err.msg}`).join(', ');
        }
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please ensure the FastAPI backend is running.`);
    }
    throw err;
  }
}

export const api = {
  // --------------------------------------------------------------------------
  // Employees API
  // --------------------------------------------------------------------------
  getEmployees: (active = null) => {
    let query = '';
    if (active !== null && active !== undefined) {
      query = `?active=${Boolean(active)}`;
    }
    return request(`/api/employees${query}`);
  },

  getEmployee: (employeeId) => request(`/api/employees/${employeeId}`),

  createEmployee: (payload) =>
    request('/api/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateEmployee: (employeeId, payload) =>
    request(`/api/employees/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deactivateEmployee: (employeeId) =>
    request(`/api/employees/${employeeId}`, {
      method: 'DELETE',
    }),

  // --------------------------------------------------------------------------
  // Tasks API
  // --------------------------------------------------------------------------
  getTasks: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'All') {
      params.append('status', filters.status);
    }
    if (filters.assignee && filters.assignee !== 'All') {
      params.append('assignee', filters.assignee);
    }
    if (filters.priority && filters.priority !== 'All') {
      params.append('priority', filters.priority);
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/tasks${queryString}`);
  },

  getPendingTasks: () => request('/api/tasks/pending'),

  getTask: (taskId) => request(`/api/tasks/${taskId}`),

  createTask: (payload) =>
    request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTask: (taskId, payload) =>
    request(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updateTaskStatus: (taskId, status) =>
    request(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteTask: (taskId) =>
    request(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    }),

  // --------------------------------------------------------------------------
  // Dashboard API
  // --------------------------------------------------------------------------
  getDashboardStats: () => request('/api/dashboard/stats'),
};
