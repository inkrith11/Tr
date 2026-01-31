import api from './api';

// Need multipart/form-data for images
export const createListing = (listingData) => {
  return api.post('/listings/', listingData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getListings = (params) => api.get('/listings/', { params });
export const getListingById = (id) => api.get(`/listings/${id}`);
export const getUserListings = (userId) => api.get(`/users/profile/listings/${userId}`);
export const deleteListing = (id) => api.delete(`/listings/${id}`);
export const updateListing = (id, data) => api.put(`/listings/${id}`, data);
export const markAsSold = (id) => api.patch(`/listings/${id}/sold`);
