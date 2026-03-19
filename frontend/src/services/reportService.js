import api from './api';

export const submitReport = (reportData) => api.post('/reports', reportData);
