import api from './api';

export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const googleLogin = (token) => api.post(`/auth/google-login?token=${token}`);
export const getMe = () => api.get('/auth/me');
