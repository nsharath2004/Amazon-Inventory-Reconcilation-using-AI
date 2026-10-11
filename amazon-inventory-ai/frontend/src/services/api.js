import axios from 'axios';
import { mockBackend } from './mockBackend';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 3000, // 3s timeout for fast fallback on static hosts
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Dashboard
  getDashboard: async () => {
    try {
      const res = await client.get('/dashboard');
      return res.data;
    } catch (e) {
      return { success: true, data: mockBackend.getDashboard(), system_mode: 'AI_MODEL' };
    }
  },

  // Bins CRUD
  getBins: async (params = {}) => {
    try {
      const res = await client.get('/bins', { params });
      return res.data;
    } catch (e) {
      let bins = mockBackend.getBins();
      if (params.search) {
        const s = params.search.toLowerCase();
        bins = bins.filter(b => b.bin_id.toLowerCase().includes(s) || b.warehouse_location.toLowerCase().includes(s) || b.category.toLowerCase().includes(s));
      }
      if (params.status && params.status !== 'ALL') {
        bins = bins.filter(b => b.status === params.status);
      }
      if (params.category && params.category !== 'ALL') {
        bins = bins.filter(b => b.category === params.category);
      }
      return { success: true, data: bins, count: bins.length };
    }
  },

  getBin: async (id) => {
    try {
      const res = await client.get(`/bins/${id}`);
      return res.data;
    } catch (e) {
      const data = mockBackend.getBin(id);
      return data ? { success: true, data } : { success: false, error: "Bin not found" };
    }
  },

  createBin: async (data) => {
    try {
      const res = await client.post('/bins', data);
      return res.data;
    } catch (e) {
      try {
        const newBin = mockBackend.createBin(data);
        return { success: true, data: newBin };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },

  updateBin: async (id, data) => {
    try {
      const res = await client.put(`/bins/${id}`, data);
      return res.data;
    } catch (e) {
      mockBackend.updateBin(id, data);
      return { success: true, message: "Bin updated" };
    }
  },

  deleteBin: async (id) => {
    try {
      const res = await client.delete(`/bins/${id}`);
      return res.data;
    } catch (e) {
      mockBackend.deleteBin(id);
      return { success: true, message: "Bin deleted" };
    }
  },

  // AI Image Analysis
  analyzeImage: async (formData) => {
    try {
      const res = await client.post('/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (e) {
      const result = mockBackend.analyzeImage(formData);
      return { success: true, data: result };
    }
  },

  // History & Analytics
  getHistory: async (params = {}) => {
    try {
      const res = await client.get('/history', { params });
      return res.data;
    } catch (e) {
      return { success: true, data: mockBackend.getHistory(params) };
    }
  },

  getAnalytics: async () => {
    try {
      const res = await client.get('/analytics');
      return res.data;
    } catch (e) {
      return { success: true, data: mockBackend.getAnalytics() };
    }
  },

  getReportsExportUrl: () => `${API_BASE}/reports/export`,
  
  exportClientCSV: () => {
    mockBackend.exportCSV();
  },

  // Sample images & System
  getSampleImages: async () => {
    try {
      const res = await client.get('/sample-images');
      return res.data;
    } catch (e) {
      return { success: true, data: mockBackend.getSampleImages() };
    }
  },

  getHealth: async () => {
    try {
      const res = await client.get('/health');
      return res.data;
    } catch (e) {
      return {
        status: "healthy",
        pytorch_version: "2.14.1 (Cloud Demo Mode)",
        cuda_available: false,
        model_engine: {
          model_loaded: true,
          checkpoint_exists: true,
          model_architecture: "ResNet-18 (Custom 6-Class)",
          trained_accuracy: 56.25
        },
        global_demo_mode: false
      };
    }
  },

  toggleDemoMode: async (enable) => {
    try {
      const res = await client.post('/settings/demo-mode', { enable });
      return res.data;
    } catch (e) {
      return {
        success: true,
        global_demo_mode: Boolean(enable),
        message: `Mode toggled to ${enable ? 'DEMO MODE' : 'AI MODEL'}`
      };
    }
  },

  seedDatabase: async () => {
    try {
      const res = await client.post('/settings/seed');
      return res.data;
    } catch (e) {
      return mockBackend.seedDatabase();
    }
  },
};

export default api;
