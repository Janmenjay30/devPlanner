import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devplanner_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('devplanner_token');
      localStorage.removeItem('devplanner_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
};

// Tasks
export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  toggleSubtask: (taskId, subtaskId) => api.patch(`/tasks/${taskId}/subtask/${subtaskId}`),
  delete: (id) => api.delete(`/tasks/${id}`),
  deleteAllCompleted: () => api.delete('/tasks/completed/all'),
  bulkUpdate: (taskIds, update) => api.patch('/tasks/bulk/update', { taskIds, update })
};

// Planner
export const plannerAPI = {
  getDailyPlan: (date) => api.get(`/planner/daily/${date}`),
  updateDailyPlan: (date, data) => api.put(`/planner/daily/${date}`, data),
  getDailyPlans: (startDate, endDate) => api.get('/planner/daily', { params: { startDate, endDate } }),
  getWeeklyPlan: (weekStart) => api.get(`/planner/weekly/${weekStart}`),
  updateWeeklyPlan: (weekStart, data) => api.put(`/planner/weekly/${weekStart}`, data),
  getWeeklyPlans: (limit) => api.get('/planner/weekly', { params: { limit } })
};

// Stats
export const statsAPI = {
  getDashboard: () => api.get('/stats/dashboard'),
  getProductivity: (days) => api.get('/stats/productivity', { params: { days } })
};

// Notifications
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  subscribe: (subscription) => api.post('/notifications/subscribe', { subscription }),
  cleanup: () => api.delete('/notifications/cleanup')
};

// AI Assistant
export const aiAPI = {
  chat: (message, history = []) => api.post('/ai/chat', { message, history })
};

// Habits
export const habitAPI = {
  getAll: () => api.get('/habits'),
  create: (data) => api.post('/habits', data),
  toggle: (id, date) => api.post(`/habits/${id}/toggle`, { date }),
  update: (id, data) => api.put(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`),
  getStats: () => api.get('/habits/stats/overview')
};

export default api;
