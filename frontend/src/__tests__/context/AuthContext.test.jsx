import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock authService
const mockGetMe = vi.fn();
const mockApiLogin = vi.fn();
const mockApiRegister = vi.fn();
const mockApiGoogleLogin = vi.fn();
const mockApiGoogleLoginWithToken = vi.fn();

vi.mock('../../services/authService', () => ({
  login: (...args) => mockApiLogin(...args),
  register: (...args) => mockApiRegister(...args),
  googleLogin: (...args) => mockApiGoogleLogin(...args),
  googleLoginWithToken: (...args) => mockApiGoogleLoginWithToken(...args),
  getMe: (...args) => mockGetMe(...args),
}));

// Mock toast
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { AuthProvider, useAuth } from '../../context/AuthContext';

// Small test component to access the context
const TestConsumer = () => {
  const { user, isAuthenticated, login, logout, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="username">{user?.name ?? 'none'}</span>
      <button onClick={() => login({ email: 'a@apsit.edu.in', password: 'pass1234' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const renderContext = () =>
  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('starts with no user when no token in localStorage', async () => {
    mockGetMe.mockRejectedValue(new Error('no token'));
    renderContext();
    // loading starts true, then becomes false
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('username').textContent).toBe('none');
  });

  it('restores user from localStorage on mount', async () => {
    localStorage.setItem('token', 'fake-jwt');
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Alice' }));
    mockGetMe.mockResolvedValue({ data: { id: 1, name: 'Alice' } });

    renderContext();
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('username').textContent).toBe('Alice');
  });

  it('login sets user and token', async () => {
    mockGetMe.mockRejectedValue(new Error('no token'));
    mockApiLogin.mockResolvedValue({
      data: {
        token: 'new-jwt',
        user: { id: 2, name: 'Bob' },
      },
    });

    renderContext();
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('username').textContent).toBe('Bob');
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });
    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'new-jwt');
  });

  it('logout clears user', async () => {
    localStorage.setItem('token', 'fake-jwt');
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Alice' }));
    mockGetMe.mockResolvedValue({ data: { id: 1, name: 'Alice' } });

    renderContext();
    await waitFor(() => {
      expect(screen.getByTestId('username').textContent).toBe('Alice');
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
      expect(screen.getByTestId('username').textContent).toBe('none');
    });
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
  });

  it('logs out when getMe fails (expired session)', async () => {
    localStorage.setItem('token', 'expired-jwt');
    mockGetMe.mockRejectedValue(new Error('401'));

    renderContext();
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });
});
