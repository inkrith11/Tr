import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageUpload from '../../components/ImageUpload';

describe('ImageUpload component', () => {
  const defaultProps = () => ({
    images: { image_1: null, image_2: null, image_3: null },
    setImages: vi.fn(),
    previews: { image_1: null, image_2: null, image_3: null },
    setPreviews: vi.fn(),
  });

  it('renders three upload slots', () => {
    render(<ImageUpload {...defaultProps()} />);
    expect(screen.getByText('1. Front View (Main)')).toBeInTheDocument();
    expect(screen.getByText('2. Side/Detail View')).toBeInTheDocument();
    expect(screen.getByText('3. Back/Alternate View')).toBeInTheDocument();
  });

  it('renders legend about authenticity images', () => {
    render(<ImageUpload {...defaultProps()} />);
    expect(screen.getByText(/Authenticity Images/i)).toBeInTheDocument();
  });

  it('shows preview when preview URL is set', () => {
    const props = defaultProps();
    props.previews.image_1 = 'blob:http://localhost/fake';
    props.images.image_1 = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
    render(<ImageUpload {...props} />);
    const previews = screen.getAllByAltText('Preview');
    expect(previews.length).toBeGreaterThanOrEqual(1);
  });

  it('shows remove buttons for uploaded images', () => {
    const props = defaultProps();
    props.previews.image_1 = 'blob:http://localhost/fake';
    props.images.image_1 = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
    render(<ImageUpload {...props} />);
    // The remove button (X icon) should exist
    const removeButtons = screen.getAllByRole('button');
    expect(removeButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows file size info', () => {
    render(<ImageUpload {...defaultProps()} />);
    const hints = screen.getAllByText(/up to 5MB/i);
    expect(hints.length).toBe(3); // One per empty slot
  });
});
