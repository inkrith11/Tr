import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPost = vi.fn();
const mockGet = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();
vi.mock('../../services/api', () => ({
  default: {
    post: (...args) => mockPost(...args),
    get: (...args) => mockGet(...args),
    put: (...args) => mockPut(...args),
    delete: (...args) => mockDelete(...args),
  },
}));

import {
  createListing,
  getListings,
  getListingById,
  getUserListings,
  deleteListing,
  updateListing,
  addFavorite,
  removeFavorite,
  getMyFavorites,
  getMyListings,
} from '../../services/listingService';

describe('listingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createListing posts FormData with multipart header', async () => {
    const fd = new FormData();
    mockPost.mockResolvedValue({ data: {} });
    await createListing(fd);
    expect(mockPost).toHaveBeenCalledWith('/listings', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });

  it('getListings passes query params', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await getListings({ category: 'Books', search: 'math' });
    expect(mockGet).toHaveBeenCalledWith('/listings', { params: { category: 'Books', search: 'math' } });
  });

  it('getListingById calls correct endpoint', async () => {
    mockGet.mockResolvedValue({ data: {} });
    await getListingById(42);
    expect(mockGet).toHaveBeenCalledWith('/listings/42');
  });

  it('getUserListings calls /users/:id/listings', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await getUserListings(7);
    expect(mockGet).toHaveBeenCalledWith('/users/7/listings');
  });

  it('deleteListing calls DELETE /listings/:id', async () => {
    mockDelete.mockResolvedValue({ data: {} });
    await deleteListing(10);
    expect(mockDelete).toHaveBeenCalledWith('/listings/10');
  });

  it('updateListing sends PUT with multipart header', async () => {
    const fd = new FormData();
    mockPut.mockResolvedValue({ data: {} });
    await updateListing(10, fd);
    expect(mockPut).toHaveBeenCalledWith('/listings/10', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });

  it('addFavorite calls POST /listings/:id/favorite', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await addFavorite(5);
    expect(mockPost).toHaveBeenCalledWith('/listings/5/favorite');
  });

  it('removeFavorite calls DELETE /listings/:id/favorite', async () => {
    mockDelete.mockResolvedValue({ data: {} });
    await removeFavorite(5);
    expect(mockDelete).toHaveBeenCalledWith('/listings/5/favorite');
  });

  it('getMyFavorites calls GET /listings/favorites/me', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await getMyFavorites();
    expect(mockGet).toHaveBeenCalledWith('/listings/favorites/me');
  });

  it('getMyListings calls GET /listings/user/me', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await getMyListings();
    expect(mockGet).toHaveBeenCalledWith('/listings/user/me');
  });
});
