import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPost = vi.fn();
const mockGet = vi.fn();
const mockPut = vi.fn();
vi.mock('../../services/api', () => ({
  default: {
    post: (...args) => mockPost(...args),
    get: (...args) => mockGet(...args),
    put: (...args) => mockPut(...args),
  },
}));

import {
  sendMessage,
  getConversations,
  getConversationMessages,
  getUnreadCount,
  markAsRead,
} from '../../services/messageService';

describe('messageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sendMessage posts to /messages', async () => {
    const data = { receiver_id: 2, listing_id: 5, content: 'Hello' };
    mockPost.mockResolvedValue({ data: {} });
    await sendMessage(data);
    expect(mockPost).toHaveBeenCalledWith('/messages', data);
  });

  it('getConversations calls GET /messages/conversations', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await getConversations();
    expect(mockGet).toHaveBeenCalledWith('/messages/conversations');
  });

  it('getConversationMessages calls correct endpoint with both params', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await getConversationMessages(3, 7);
    expect(mockGet).toHaveBeenCalledWith('/messages/conversation/3/7');
  });

  it('getUnreadCount calls GET /messages/unread/count', async () => {
    mockGet.mockResolvedValue({ data: { count: 5 } });
    await getUnreadCount();
    expect(mockGet).toHaveBeenCalledWith('/messages/unread/count');
  });

  it('markAsRead calls PUT /messages/:id/read', async () => {
    mockPut.mockResolvedValue({ data: {} });
    await markAsRead(99);
    expect(mockPut).toHaveBeenCalledWith('/messages/99/read');
  });
});
