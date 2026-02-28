import api from './api';

export const getMyProfile = () => api.get('/users/me');
export const getUserProfile = (id) => api.get(`/users/${id}`);
export const updateProfile = (data) => {
  return api.put('/users/me', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getUserListings = (userId) => api.get(`/users/${userId}/listings`);
export const getUserReviews = (userId) => api.get(`/users/${userId}/reviews`);
