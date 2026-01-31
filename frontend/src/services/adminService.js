import api from './api';

// Admin token management (separate from regular user auth)
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_USER_KEY = 'admin_user';

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);
export const setAdminToken = (token) => localStorage.setItem(ADMIN_TOKEN_KEY, token);
export const removeAdminToken = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
};

export const getAdminUser = () => {
  const user = localStorage.getItem(ADMIN_USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setAdminUser = (user) => localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));

// Create admin API instance with separate auth header
const adminApi = {
  async request(method, endpoint, data = null) {
    const token = getAdminToken();
    const config = {
      method,
      url: `/admin${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    if (data) {
      config.data = data;
    }
    const response = await api(config);
    return response.data;
  },
  get: (endpoint) => adminApi.request('get', endpoint),
  post: (endpoint, data) => adminApi.request('post', endpoint, data),
  put: (endpoint, data) => adminApi.request('put', endpoint, data),
  delete: (endpoint) => adminApi.request('delete', endpoint),
};

// ============ AUTH ============
export const adminLogin = async (email, password) => {
  const response = await api.post('/admin/login', { email, password });
  if (response.data.access_token) {
    setAdminToken(response.data.access_token);
    setAdminUser(response.data.user);
  }
  return response.data;
};

export const adminLogout = () => {
  removeAdminToken();
  window.location.href = '/admin/login';
};

export const verifyAdmin = async () => {
  return adminApi.get('/verify');
};

// ============ DASHBOARD ============
export const getDashboardStats = async () => {
  return adminApi.get('/dashboard/stats');
};

export const getRecentActivity = async (limit = 20) => {
  return adminApi.get(`/dashboard/activity?limit=${limit}`);
};

// ============ USERS ============
export const getUsers = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.role) queryParams.append('role', params.role);
  if (params.status) queryParams.append('status', params.status);
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  
  const query = queryParams.toString();
  return adminApi.get(`/users${query ? `?${query}` : ''}`);
};

export const getUserDetail = async (userId) => {
  return adminApi.get(`/users/${userId}`);
};

export const banUser = async (userId, data) => {
  return adminApi.put(`/users/${userId}/ban`, data);
};

export const unbanUser = async (userId) => {
  return adminApi.put(`/users/${userId}/unban`, {});
};

export const deleteUser = async (userId) => {
  return adminApi.delete(`/users/${userId}`);
};

export const changeUserRole = async (userId, role) => {
  return adminApi.put(`/users/${userId}/role`, { role });
};

// ============ LISTINGS ============
export const getListings = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.status) queryParams.append('status', params.status);
  if (params.category) queryParams.append('category', params.category);
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  
  const query = queryParams.toString();
  return adminApi.get(`/listings${query ? `?${query}` : ''}`);
};

export const hideListing = async (listingId, reason) => {
  return adminApi.put(`/listings/${listingId}/hide`, { reason });
};

export const showListing = async (listingId) => {
  return adminApi.put(`/listings/${listingId}/show`);
};

export const deleteListing = async (listingId) => {
  return adminApi.delete(`/listings/${listingId}`);
};

export const toggleFeatureListing = async (listingId) => {
  return adminApi.put(`/listings/${listingId}/feature`);
};

// ============ REPORTS ============
export const getReports = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.report_type) queryParams.append('report_type', params.report_type);
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  
  const query = queryParams.toString();
  return adminApi.get(`/reports${query ? `?${query}` : ''}`);
};

export const getReportDetail = async (reportId) => {
  return adminApi.get(`/reports/${reportId}`);
};

export const reviewReport = async (reportId, data) => {
  return adminApi.put(`/reports/${reportId}/review`, data);
};

// ============ ANALYTICS ============
export const getUserAnalytics = async () => {
  return adminApi.get('/analytics/users');
};

export const getListingAnalytics = async () => {
  return adminApi.get('/analytics/listings');
};

// ============ CATEGORIES ============
export const getCategories = async () => {
  return adminApi.get('/categories');
};

export const createCategory = async (data) => {
  return adminApi.post('/categories', data);
};

export const deleteCategory = async (categoryId) => {
  return adminApi.delete(`/categories/${categoryId}`);
};

// ============ ACTIVITY LOG ============
export const getActivityLog = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.admin_id) queryParams.append('admin_id', params.admin_id);
  if (params.action) queryParams.append('action', params.action);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  
  const query = queryParams.toString();
  return adminApi.get(`/activity-log${query ? `?${query}` : ''}`);
};

export default adminApi;
