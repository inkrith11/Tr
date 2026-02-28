import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api module
const mockPost = vi.fn();
const mockGet = vi.fn();
vi.mock('../../services/api', () => ({
  default: {
    post: (...args) => mockPost(...args),
    get: (...args) => mockGet(...args),
  },
}));

import { login, register, googleLogin, googleLoginWithToken, getMe } from '../../services/authService';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login calls POST /auth/login with credentials', async () => {
    const creds = { email: 'a@apsit.edu.in', password: 'pass1234' };
    mockPost.mockResolvedValue({ data: { token: 'jwt', user: {} } });
    await login(creds);
    expect(mockPost).toHaveBeenCalledWith('/auth/login', creds);
  });

  it('register calls POST /auth/register with user data', async () => {
    const data = { name: 'John', email: 'john@apsit.edu.in', password: 'pass1234' };
    mockPost.mockResolvedValue({ data: {} });
    await register(data);
    expect(mockPost).toHaveBeenCalledWith('/auth/register', data);
  });

  it('googleLogin calls POST /auth/google with token in body', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await googleLogin('google-id-token');
    expect(mockPost).toHaveBeenCalledWith('/auth/google', { token: 'google-id-token' });
  });

  it('googleLoginWithToken calls POST /auth/google-token with access_token', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await googleLoginWithToken('access-tok');
    expect(mockPost).toHaveBeenCalledWith('/auth/google-token', { access_token: 'access-tok' });
  });

  it('getMe calls GET /auth/me', async () => {
    mockGet.mockResolvedValue({ data: { id: 1 } });
    await getMe();
    expect(mockGet).toHaveBeenCalledWith('/auth/me');
  });
});
