import api from './api';

export const getUserProfile = (id) => api.get(`/users/profile/${id}`);
export const updateProfile = (data) => api.put('/users/profile/update', data);
export const addToFavorites = (listingId) => api.post('/users/favorites', { listing_id: listingId });
export const removeFromFavorites = (listingId) => api.delete(`/users/favorites/${listingId}`);
export const getFavorites = () => api.get('/users/favorites');
