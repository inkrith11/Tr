import api from './api';

export const sendMessage = (data) => api.post('/messages', data);
export const getConversations = () => api.get('/messages/conversations');
export const getConversationMessages = (otherUserId, listingId) =>
  api.get(`/messages/conversation/${otherUserId}/${listingId}`);
export const getUnreadCount = () => api.get('/messages/unread/count');
export const markAsRead = (messageId) => api.put(`/messages/${messageId}/read`);
