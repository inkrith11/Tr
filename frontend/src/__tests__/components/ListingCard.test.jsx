import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ListingCard from '../../components/ListingCard';

const baseListing = {
  id: 1,
  title: 'Engineering Textbook',
  price: 450,
  category: 'Books',
  condition: 'good',
  image_1: 'https://example.com/img.jpg',
  owner: { id: 5, name: 'Alice', profile_picture: null },
};

const renderCard = (props = {}) =>
  render(
    <MemoryRouter>
      <ListingCard listing={baseListing} {...props} />
    </MemoryRouter>
  );

describe('ListingCard component', () => {
  it('renders listing title', () => {
    renderCard();
    expect(screen.getByText('Engineering Textbook')).toBeInTheDocument();
  });

  it('renders price with rupee symbol', () => {
    renderCard();
    expect(screen.getByText('₹450')).toBeInTheDocument();
  });

  it('renders category', () => {
    renderCard();
    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  it('renders condition badge', () => {
    renderCard();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('renders owner name', () => {
    renderCard();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('links to listing detail page', () => {
    renderCard();
    const links = screen.getAllByRole('link');
    const detailLink = links.find((l) => l.getAttribute('href') === '/listings/1');
    expect(detailLink).toBeDefined();
  });

  it('renders placeholder image when image_1 is absent', () => {
    const listing = { ...baseListing, image_1: null };
    render(
      <MemoryRouter>
        <ListingCard listing={listing} />
      </MemoryRouter>
    );
    const img = screen.getByAltText('Engineering Textbook');
    expect(img.src).toContain('placeholder');
  });

  it('renders favorite button when onFavoriteToggle provided', () => {
    const onFavoriteToggle = vi.fn();
    renderCard({ onFavoriteToggle, isFavorited: false });
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
  });

  it('does not render favorite button when onFavoriteToggle not provided', () => {
    renderCard();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onFavoriteToggle with listing id on click', async () => {
    const onFavoriteToggle = vi.fn();
    renderCard({ onFavoriteToggle, isFavorited: false });
    const btn = screen.getByRole('button');
    btn.click();
    expect(onFavoriteToggle).toHaveBeenCalledWith(1);
  });
});
