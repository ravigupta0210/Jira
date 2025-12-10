import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if user was already logged in (has token)
    // Don't redirect for login/register attempts
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') ||
                           error.config?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      const token = localStorage.getItem('token');
      if (token) {
        // Only clear and redirect if user was previously authenticated
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  getUsers: () => api.get('/auth/users'),
};

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  getColumns: (id) => api.get(`/projects/${id}/columns`),
  updateColumns: (id, columns) => api.put(`/projects/${id}/columns`, { columns }),
};

// Tickets API
export const ticketsAPI = {
  getAll: (params) => api.get('/tickets', { params }),
  getOne: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
  move: (id, data) => api.put(`/tickets/${id}/move`, data),
  getKanban: (projectId) => api.get(`/tickets/kanban/${projectId}`),
  addComment: (id, data) => api.post(`/tickets/${id}/comments`, data),
  updateComment: (id, commentId, data) => api.put(`/tickets/${id}/comments/${commentId}`, data),
  deleteComment: (id, commentId) => api.delete(`/tickets/${id}/comments/${commentId}`),
};

// Meetings API
export const meetingsAPI = {
  getAll: (params) => api.get('/meetings', { params }),
  getOne: (id) => api.get(`/meetings/${id}`),
  create: (data) => api.post('/meetings', data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
  respond: (id, status) => api.post(`/meetings/${id}/respond`, { status }),
  addParticipants: (id, participants) => api.post(`/meetings/${id}/participants`, { participants }),
  getUpcoming: () => api.get('/meetings/upcoming'),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications'),
};

// Dashboard API
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
  getActivity: (params) => api.get('/dashboard/activity', { params }),
};

export default api;
