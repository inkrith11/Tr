import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import Navbar from '../../components/Navbar';

const renderNavbar = () =>
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );

describe('Navbar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders brand name', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, logout: vi.fn() });
    renderNavbar();
    expect(screen.getByText('APSIT TradeHub')).toBeInTheDocument();
  });

  it('shows Login and Sign Up links when not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, logout: vi.fn() });
    renderNavbar();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('shows Sell link when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test', profile_picture: null },
      isAuthenticated: true,
      logout: vi.fn(),
    });
    renderNavbar();
    expect(screen.getByText('Sell')).toBeInTheDocument();
  });

  it('does not show Login/Register when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test', profile_picture: null },
      isAuthenticated: true,
      logout: vi.fn(),
    });
    renderNavbar();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
  });

  it('always shows Browse link', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, logout: vi.fn() });
    renderNavbar();
    expect(screen.getByText('Browse')).toBeInTheDocument();
  });
});
