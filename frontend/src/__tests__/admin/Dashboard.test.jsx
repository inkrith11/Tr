import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../pages/admin/Dashboard';

const mockStats = {
  total_users: 150,
  total_listings: 320,
  active_listings: 200,
  total_messages: 500,
  pending_reports: 5,
  banned_users: 3,
  new_users_today: 12,
  total_trades: 89,
};

const mockActivity = [
  {
    id: 1,
    action: 'ban_user',
    description: 'Banned user for spam',
    admin_name: 'Admin One',
    created_at: new Date().toISOString(),
  },
];

vi.mock('../../services/adminService', () => ({
  getDashboardStats: vi.fn(),
  getRecentActivity: vi.fn(),
}));

import { getDashboardStats, getRecentActivity } from '../../services/adminService';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    getDashboardStats.mockReturnValue(new Promise(() => {}));
    getRecentActivity.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders welcome banner after loading', async () => {
    getDashboardStats.mockResolvedValue(mockStats);
    getRecentActivity.mockResolvedValue(mockActivity);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('renders stat cards with correct values', async () => {
    getDashboardStats.mockResolvedValue(mockStats);
    getRecentActivity.mockResolvedValue(mockActivity);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Total Listings')).toBeInTheDocument();
      expect(screen.getByText('320')).toBeInTheDocument();
      expect(screen.getByText('Pending Reports')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('renders quick action links', async () => {
    getDashboardStats.mockResolvedValue(mockStats);
    getRecentActivity.mockResolvedValue(mockActivity);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Users')).toBeInTheDocument();
      expect(screen.getByText('Manage Listings')).toBeInTheDocument();
      expect(screen.getByText('Review Reports')).toBeInTheDocument();
      expect(screen.getByText('View Analytics')).toBeInTheDocument();
    });
  });

  it('renders recent activity items', async () => {
    getDashboardStats.mockResolvedValue(mockStats);
    getRecentActivity.mockResolvedValue(mockActivity);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin One')).toBeInTheDocument();
      expect(screen.getByText('Banned user for spam')).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    getDashboardStats.mockRejectedValue(new Error('Network error'));
    getRecentActivity.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    });
  });
});
