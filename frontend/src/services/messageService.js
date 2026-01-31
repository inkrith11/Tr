import api from './api';

export const sendMessage = (data) => api.post('/messages/', data);
export const getConversations = () => api.get('/messages/conversations');
export const getConversationMessages = (userId) => api.get(`/messages/conversation/${userId}`);
export const getUnreadCount = () => api.get('/messages/unread-count');
export const markAsRead = (messageId) => api.patch(`/messages/${messageId}/read`);
