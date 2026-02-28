import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock auth context
const mockLogin = vi.fn();
const mockHandleGoogleLoginWithToken = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    handleGoogleLoginWithToken: mockHandleGoogleLoginWithToken,
  }),
}));

// Mock google oauth
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: (opts) => () => opts.onSuccess({ access_token: 'fake-token' }),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock toast
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

import Login from '../../pages/Login';

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Sign In heading', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders Google login button', () => {
    renderLogin();
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty submit', async () => {
    renderLogin();
    const user = userEvent.setup();
    const submitBtn = screen.getByRole('button', { name: /^sign in$/i });
    await user.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates email domain', async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'test@gmail.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => {
      expect(screen.getByText(/only @apsit\.edu\.in emails/i)).toBeInTheDocument();
    });
  });

  it('calls login and navigates on valid submit', async () => {
    mockLogin.mockResolvedValue(true);
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'test@apsit.edu.in');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@apsit.edu.in',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('has link to register page', () => {
    renderLogin();
    expect(screen.getByText(/register here/i)).toBeInTheDocument();
  });
});
