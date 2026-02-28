import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLogin from '../../pages/admin/AdminLogin';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../services/adminService', () => ({
  setAdminToken: vi.fn(),
  setAdminUser: vi.fn(),
  getAdminToken: vi.fn(() => null),
}));

vi.mock('../../services/api', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

describe('AdminLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Admin Portal heading', () => {
    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
  });

  it('renders APSIT TradeHub Administration subtitle', () => {
    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );
    expect(screen.getByText('APSIT TradeHub Administration')).toBeInTheDocument();
  });

  it('renders Google sign-in button', () => {
    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('shows admin-only access warning', () => {
    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );
    expect(screen.getByText(/Only users with/)).toBeInTheDocument();
  });

  it('renders back to TradeHub link', () => {
    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );
    expect(screen.getByText('← Back to TradeHub')).toBeInTheDocument();
  });
});
