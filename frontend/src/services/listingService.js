import api from './api';

// Need multipart/form-data for images
export const createListing = (listingData) => {
  return api.post('/listings', listingData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getListings = (params) => api.get('/listings', { params });
export const getListingById = (id) => api.get(`/listings/${id}`);
export const getUserListings = (userId) => api.get(`/users/${userId}/listings`);
export const deleteListing = (id) => api.delete(`/listings/${id}`);
export const updateListing = (id, data) => {
  return api.put(`/listings/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const markAsSold = (id) => api.put(`/listings/${id}`, { status: 'sold' });
export const addFavorite = (listingId) => api.post(`/listings/${listingId}/favorite`);
export const removeFavorite = (listingId) => api.delete(`/listings/${listingId}/favorite`);
export const getMyFavorites = () => api.get('/listings/favorites/me');
export const getMyListings = () => api.get('/listings/user/me');
