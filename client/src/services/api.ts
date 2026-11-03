import axios from 'axios';
import {
  IUser,
  IDashboardSummary,
  ICongestionDistribution,
  ITrafficTrendPoint,
  IRoadSegment,
  ITrafficIncident,
  IRouteRecommendationResponse,
  ISystemHealth,
} from '@shared/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('urbanflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Clear token on authorization failure
      localStorage.removeItem('urbanflow_token');
      localStorage.removeItem('urbanflow_user');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post<{ success: boolean; token: string; user: IUser }>('/auth/login', credentials);
    return res.data;
  },
  register: async (userData: { name: string; email: string; password: string; role?: string }) => {
    const res = await api.post<{ success: boolean; token: string; user: IUser }>('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<{ success: boolean; user: IUser }>('/auth/me');
    return res.data.user;
  },
  updatePreferences: async (preferences: Partial<IUser['preferences']>) => {
    const res = await api.patch<{ success: boolean; preferences: IUser['preferences'] }>('/auth/preferences', preferences);
    return res.data.preferences;
  },
};

export const dashboardApi = {
  getSummary: async (area?: string) => {
    const res = await api.get<{ success: boolean; data: IDashboardSummary }>('/dashboard/summary', {
      params: { area: area !== 'all' ? area : undefined },
    });
    return res.data.data;
  },
  getCongestionDistribution: async (area?: string) => {
    const res = await api.get<{ success: boolean; data: ICongestionDistribution[] }>('/dashboard/congestion-distribution', {
      params: { area: area !== 'all' ? area : undefined },
    });
    return res.data.data;
  },
  getTrafficTrends: async (area?: string) => {
    const res = await api.get<{ success: boolean; data: ITrafficTrendPoint[] }>('/dashboard/traffic-trends', {
      params: { area: area !== 'all' ? area : undefined },
    });
    return res.data.data;
  },
  getTopCongested: async (limit: number = 6) => {
    const res = await api.get<{ success: boolean; data: IRoadSegment[] }>('/dashboard/top-congested-roads', {
      params: { limit },
    });
    return res.data.data;
  },
  getRecentEvents: async () => {
    const res = await api.get<{ success: boolean; data: ITrafficIncident[] }>('/dashboard/recent-events');
    return res.data.data;
  },
};

export const roadApi = {
  getRoads: async (params?: { page?: number; limit?: number; search?: string; area?: string; category?: string; sortBy?: string; order?: 'asc' | 'desc' }) => {
    const res = await api.get<{
      success: boolean;
      data: IRoadSegment[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
      filters: { availableAreas: string[] };
    }>('/roads', { params });
    return res.data;
  },
  getRoadById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: { road: IRoadSegment; history: any[] } }>(`/roads/${id}`);
    return res.data.data;
  },
  createRoad: async (roadData: any) => {
    const res = await api.post<{ success: boolean; data: IRoadSegment }>('/roads', roadData);
    return res.data.data;
  },
  updateRoad: async (id: string, updates: any) => {
    const res = await api.patch<{ success: boolean; data: IRoadSegment }>(`/roads/${id}`, updates);
    return res.data.data;
  },
  deleteRoad: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/roads/${id}`);
    return res.data;
  },
};

export const trafficApi = {
  getCurrent: async (area?: string) => {
    const res = await api.get<{ success: boolean; data: IRoadSegment[]; timestamp: string }>('/traffic/current', {
      params: { area: area !== 'all' ? area : undefined },
    });
    return res.data.data;
  },
  getHeatmap: async () => {
    const res = await api.get<{ success: boolean; data: { lat: number; lng: number; intensity: number }[] }>('/traffic/heatmap');
    return res.data.data;
  },
  triggerSimulation: async () => {
    const res = await api.post<{ success: boolean; message: string; data: any }>('/traffic/simulate');
    return res.data;
  },
};

export const routeApi = {
  recommendRoute: async (data: {
    origin: string;
    destination: string;
    preference?: 'fastest' | 'least_congested' | 'shortest';
    originCoords?: [number, number];
    destinationCoords?: [number, number];
  }) => {
    const res = await api.post<{ success: boolean; data: IRouteRecommendationResponse }>('/routes/recommend', data);
    return res.data.data;
  },
  getHistory: async () => {
    const res = await api.get<{ success: boolean; data: any[] }>('/routes/history');
    return res.data.data;
  },
};

export const incidentApi = {
  getIncidents: async (params?: { page?: number; limit?: number; type?: string; severity?: string; status?: string; search?: string }) => {
    const res = await api.get<{
      success: boolean;
      data: ITrafficIncident[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>('/incidents', { params });
    return res.data;
  },
  createIncident: async (incidentData: any) => {
    const res = await api.post<{ success: boolean; data: ITrafficIncident }>('/incidents', incidentData);
    return res.data.data;
  },
  updateIncident: async (id: string, updates: any) => {
    const res = await api.patch<{ success: boolean; data: ITrafficIncident }>(`/incidents/${id}`, updates);
    return res.data.data;
  },
  deleteIncident: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/incidents/${id}`);
    return res.data;
  },
};

export const analyticsApi = {
  getOverview: async (area?: string) => {
    const res = await api.get<{ success: boolean; data: any }>('/analytics/overview', {
      params: { area: area !== 'all' ? area : undefined },
    });
    return res.data.data;
  },
  getPeakHours: async () => {
    const res = await api.get<{ success: boolean; data: any }>('/analytics/peak-hours');
    return res.data.data;
  },
  getRoadComparison: async (limit: number = 10) => {
    const res = await api.get<{ success: boolean; data: any[] }>('/analytics/road-comparison', {
      params: { limit },
    });
    return res.data.data;
  },
  getExportUrl: (area?: string) => {
    return `/api/analytics/export${area && area !== 'all' ? `?area=${encodeURIComponent(area)}` : ''}`;
  },
};

export const adminApi = {
  getUsers: async (page: number = 1, limit: number = 20) => {
    const res = await api.get<{ success: boolean; data: IUser[]; pagination: any }>('/admin/users', {
      params: { page, limit },
    });
    return res.data;
  },
  updateUserRole: async (userId: string, role: 'admin' | 'user') => {
    const res = await api.patch<{ success: boolean; message: string; data: IUser }>(`/admin/users/${userId}/role`, { role });
    return res.data;
  },
  getSystemHealth: async () => {
    const res = await api.get<{ success: boolean; data: ISystemHealth }>('/admin/health');
    return res.data.data;
  },
  getAuditLogs: async () => {
    const res = await api.get<{ success: boolean; data: any[] }>('/admin/audit-logs');
    return res.data.data;
  },
};

export default api;
