import api from './api';

export const submitReview = (data) => api.post('/reviews', data);
export const getListingReviews = (listingId) => api.get(`/reviews/listing/${listingId}`);
export const getUserReviews = (userId) => api.get(`/users/${userId}/reviews`);
export const getMyReviews = () => api.get('/reviews/my-reviews');
export const getGivenReviews = () => api.get('/reviews/given');
export const deleteReview = (reviewId) => api.delete(`/reviews/${reviewId}`);
