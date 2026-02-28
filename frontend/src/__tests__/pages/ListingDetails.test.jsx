import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock services
vi.mock('../../services/listingService', () => ({
  getListingById: vi.fn(),
  deleteListing: vi.fn(),
}));

// Mock auth context
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Tester' },
    isAuthenticated: true,
  }),
}));

// Mock toast
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => '01 Jan 2025'),
}));

import ListingDetails from '../../pages/ListingDetails';
import { getListingById } from '../../services/listingService';

const sampleListing = {
  id: 10,
  title: 'Physics Textbook',
  description: 'Halliday & Resnick 11th ed.',
  price: 400,
  category: 'Books',
  condition: 'like_new',
  status: 'available',
  views: 42,
  location: 'APSIT Campus',
  image_1: 'https://example.com/img1.jpg',
  image_2: 'https://example.com/img2.jpg',
  image_3: null,
  created_at: '2025-01-01T12:00:00',
  owner: { id: 2, name: 'Seller', profile_picture: null },
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/listings/10']}>
      <Routes>
        <Route path="/listings/:id" element={<ListingDetails />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('ListingDetails page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    getListingById.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders listing details after fetch', async () => {
    getListingById.mockResolvedValue({ data: sampleListing });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Physics Textbook')).toBeInTheDocument();
      expect(screen.getByText('₹400')).toBeInTheDocument();
      expect(screen.getByText('Books')).toBeInTheDocument();
    });
  });

  it('renders seller info', async () => {
    getListingById.mockResolvedValue({ data: sampleListing });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Seller')).toBeInTheDocument();
    });
  });

  it('shows toast and redirects on fetch error', async () => {
    const { toast } = await import('react-toastify');
    getListingById.mockRejectedValue(new Error('Not found'));
    renderPage();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load listing');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('renders image thumbnails', async () => {
    getListingById.mockResolvedValue({ data: sampleListing });
    renderPage();
    await waitFor(() => {
      const thumbs = screen.getAllByRole('button');
      // at least 2 thumbnail buttons (image_1, image_2)
      expect(thumbs.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('does not show delete/edit buttons for non-owner', async () => {
    getListingById.mockResolvedValue({ data: sampleListing }); // owner.id=2, user.id=1
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Physics Textbook')).toBeInTheDocument();
    });
    // Non-owner should not see "Delete" in the page
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});
