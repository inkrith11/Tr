import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock auth context
const mockRegister = vi.fn();
const mockHandleGoogleLoginWithToken = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
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

import Register from '../../pages/Register';

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

describe('Register page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Create Account heading', () => {
    renderRegister();
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders name, email, password, and confirm password fields', () => {
    renderRegister();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/apsit email/i) || screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    renderRegister();
    const user = userEvent.setup();
    const submitBtn = screen.getByRole('button', { name: /create account/i });
    await user.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('validates password minimum length', async () => {
    renderRegister();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/apsit email/i), 'john@apsit.edu.in');
    await user.type(screen.getByLabelText(/^password$/i), 'abc');
    await user.type(screen.getByLabelText(/confirm password/i), 'abc');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('validates password match', async () => {
    renderRegister();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/apsit email/i), 'john@apsit.edu.in');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('calls register and navigates on valid submit', async () => {
    mockRegister.mockResolvedValue(true);
    renderRegister();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/apsit email/i), 'john@apsit.edu.in');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('renders Google sign-up button', () => {
    renderRegister();
    expect(screen.getByText(/sign up with google/i)).toBeInTheDocument();
  });
});
