import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Add a request interceptor to inject the token
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

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // Token expired or invalid – clear auth state and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on login page (avoid redirect loops)
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/login';
        }
      }

      if (status === 429) {
        // Rate limited
        const detail = error.response.data?.detail || 'Too many requests. Please slow down.';
        error.message = detail;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
