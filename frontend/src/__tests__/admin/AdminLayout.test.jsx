import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLayout from '../../pages/admin/AdminLayout';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  };
});

vi.mock('../../services/adminService', () => ({
  getAdminToken: vi.fn(),
  getAdminUser: vi.fn(),
  adminLogout: vi.fn(),
}));

import { getAdminToken, getAdminUser } from '../../services/adminService';

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it('redirects to login when no token', () => {
    getAdminToken.mockReturnValue(null);
    getAdminUser.mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminLayout />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
  });

  it('renders sidebar when admin is authenticated', async () => {
    getAdminToken.mockReturnValue('mock-token');
    getAdminUser.mockReturnValue({ name: 'Test Admin', role: 'admin', email: 'admin@apsit.edu.in' });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminLayout />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/TradeHub Admin/)).toBeInTheDocument();
    });
  });

  it('renders all navigation menu items', async () => {
    getAdminToken.mockReturnValue('mock-token');
    getAdminUser.mockReturnValue({ name: 'Test Admin', role: 'admin', email: 'admin@apsit.edu.in' });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminLayout />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Listings')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
  });

  it('shows admin user name', async () => {
    getAdminToken.mockReturnValue('mock-token');
    getAdminUser.mockReturnValue({ name: 'Test Admin', role: 'admin', email: 'admin@apsit.edu.in' });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminLayout />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Admin')).toBeInTheDocument();
    });
  });

  it('renders back to site link', async () => {
    getAdminToken.mockReturnValue('mock-token');
    getAdminUser.mockReturnValue({ name: 'Test Admin', role: 'admin', email: 'admin@apsit.edu.in' });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminLayout />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('← Back to Site')).toBeInTheDocument();
    });
  });

  it('renders logout button', async () => {
    getAdminToken.mockReturnValue('mock-token');
    getAdminUser.mockReturnValue({ name: 'Test Admin', role: 'admin', email: 'admin@apsit.edu.in' });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminLayout />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTitle('Logout')).toBeInTheDocument();
    });
  });
});
