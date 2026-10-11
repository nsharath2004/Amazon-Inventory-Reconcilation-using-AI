import axios from 'axios';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Dashboard
  getDashboard: () => client.get('/dashboard').then(r => r.data),

  // Bins CRUD
  getBins: (params = {}) => client.get('/bins', { params }).then(r => r.data),
  getBin: (id) => client.get(`/bins/${id}`).then(r => r.data),
  createBin: (data) => client.post('/bins', data).then(r => r.data),
  updateBin: (id, data) => client.put(`/bins/${id}`, data).then(r => r.data),
  deleteBin: (id) => client.delete(`/bins/${id}`).then(r => r.data),

  // AI Image Analysis
  analyzeImage: (formData) => client.post('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),

  // History & Analytics
  getHistory: (params = {}) => client.get('/history', { params }).then(r => r.data),
  getAnalytics: () => client.get('/analytics').then(r => r.data),
  getReportsExportUrl: () => `${API_BASE}/reports/export`,

  // Sample images & System
  getSampleImages: () => client.get('/sample-images').then(r => r.data),
  getHealth: () => client.get('/health').then(r => r.data),
  toggleDemoMode: (enable) => client.post('/settings/demo-mode', { enable }).then(r => r.data),
  seedDatabase: () => client.post('/settings/seed').then(r => r.data),
};

export default api;
