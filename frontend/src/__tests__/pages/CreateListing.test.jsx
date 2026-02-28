import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock services
vi.mock('../../services/listingService', () => ({
  createListing: vi.fn(),
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

import CreateListing from '../../pages/CreateListing';
import { createListing } from '../../services/listingService';

const renderPage = () =>
  render(
    <MemoryRouter>
      <CreateListing />
    </MemoryRouter>
  );

describe('CreateListing page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Create New Listing')).toBeInTheDocument();
  });

  it('renders title, description, category, condition, price fields', () => {
    renderPage();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/condition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
  });

  it('renders image upload section', () => {
    renderPage();
    expect(screen.getByText(/Authenticity Images/i)).toBeInTheDocument();
  });

  it('shows warning when images are not uploaded', () => {
    renderPage();
    // The submit button is disabled until all 3 images are uploaded
    const submitBtn = screen.getByRole('button', { name: /publish listing/i });
    expect(submitBtn).toBeDisabled();
    // A helper message should tell the user to upload images
    expect(screen.getByText(/please upload all 3 required images/i)).toBeInTheDocument();
  });

  it('keeps Publish button disabled until all images are set', async () => {
    renderPage();
    const submitBtn = screen.getByRole('button', { name: /publish listing/i });
    // Initially disabled because no images
    expect(submitBtn).toBeDisabled();
    // The cancel button should still be enabled
    expect(screen.getByRole('button', { name: /cancel/i })).not.toBeDisabled();
  });
});
