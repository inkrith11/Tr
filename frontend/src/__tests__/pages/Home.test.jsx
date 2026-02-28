import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock listingService
vi.mock('../../services/listingService', () => ({
  getListings: vi.fn(),
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

import { getListings } from '../../services/listingService';
import Home from '../../pages/Home';

const sampleListings = [
  {
    id: 1,
    title: 'Textbook',
    price: 300,
    category: 'Books',
    condition: 'good',
    image_1: null,
    owner: { id: 1, name: 'User1', profile_picture: null },
  },
  {
    id: 2,
    title: 'Calculator',
    price: 800,
    category: 'Electronics',
    condition: 'new',
    image_1: null,
    owner: { id: 2, name: 'User2', profile_picture: null },
  },
];

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe('Home page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    getListings.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = renderHome();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders listings after fetch', async () => {
    getListings.mockResolvedValue({ data: sampleListings });
    renderHome();
    await waitFor(() => {
      expect(screen.getByText('Textbook')).toBeInTheDocument();
      expect(screen.getByText('Calculator')).toBeInTheDocument();
    });
  });

  it('shows toast on fetch error', async () => {
    const { toast } = await import('react-toastify');
    getListings.mockRejectedValue(new Error('Network error'));
    renderHome();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load listings. Please try again.');
    });
  });

  it('renders search and filter UI', async () => {
    getListings.mockResolvedValue({ data: [] });
    renderHome();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search listings/i)).toBeInTheDocument();
      expect(screen.getByText('All Categories')).toBeInTheDocument();
    });
  });
});
