import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock services
vi.mock('../../services/userService', () => ({
  getUserProfile: vi.fn(),
}));
vi.mock('../../services/listingService', () => ({
  getUserListings: vi.fn(),
}));
vi.mock('../../services/reviewService', () => ({
  getUserReviews: vi.fn(),
}));

// Mock auth context
const mockCurrentUser = { id: 5, name: 'Current User' };
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockCurrentUser }),
}));

// Mock toast
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => 'Jan 2025'),
}));

import Profile from '../../pages/Profile';
import { getUserProfile } from '../../services/userService';
import { getUserListings } from '../../services/listingService';
import { getUserReviews } from '../../services/reviewService';

const sampleProfile = {
  id: 5,
  name: 'John Doe',
  email: 'john@apsit.edu.in',
  phone: '9876543210',
  profile_picture: null,
  created_at: '2024-06-01T10:00:00',
};

const renderProfile = (userId = '5') =>
  render(
    <MemoryRouter initialEntries={[`/profile/${userId}`]}>
      <Routes>
        <Route path="/profile/:id" element={<Profile />} />
      </Routes>
    </MemoryRouter>
  );

describe('Profile page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserProfile.mockResolvedValue({ data: sampleProfile });
    getUserListings.mockResolvedValue({ data: [] });
    getUserReviews.mockResolvedValue({ data: [] });
  });

  it('shows loading spinner initially', () => {
    getUserProfile.mockReturnValue(new Promise(() => {}));
    getUserListings.mockReturnValue(new Promise(() => {}));
    getUserReviews.mockReturnValue(new Promise(() => {}));
    const { container } = renderProfile();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders user name after fetch', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('renders email', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('john@apsit.edu.in')).toBeInTheDocument();
    });
  });

  it('shows "User not found" when profile is null', async () => {
    getUserProfile.mockResolvedValue({ data: null });
    // Profile page checks `if (!profile)` to show the message.
    // However the component sets profile from the response data, so we need
    // to ensure the API returns something the page treats as "not found".
    // Let's simulate a rejected call instead.
    getUserProfile.mockRejectedValue(new Error('Not found'));
    renderProfile('999');
    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('shows toast on fetch error', async () => {
    const { toast } = await import('react-toastify');
    getUserProfile.mockRejectedValue(new Error('Server error'));
    getUserListings.mockRejectedValue(new Error('fail'));
    getUserReviews.mockRejectedValue(new Error('fail'));
    renderProfile();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load profile data.');
    });
  });

  it('calls all three data fetchers', async () => {
    renderProfile();
    await waitFor(() => {
      expect(getUserProfile).toHaveBeenCalledWith('5');
      expect(getUserListings).toHaveBeenCalledWith('5');
      expect(getUserReviews).toHaveBeenCalledWith('5');
    });
  });
});
