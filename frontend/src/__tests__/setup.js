/**
 * Vitest + React Testing Library setup
 * This file runs before every test file.
 */
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Automatic cleanup after each test
afterEach(() => {
  cleanup();
});

// --------------- Browser API mocks ---------------

// localStorage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// URL.createObjectURL / revokeObjectURL mock
URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake-url');
URL.revokeObjectURL = vi.fn();

// navigator.clipboard mock (configurable so userEvent can override it)
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
  },
  writable: true,
  configurable: true,
});

// IntersectionObserver mock
class IntersectionObserverMock {
  constructor(callback) { this.callback = callback; }
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = IntersectionObserverMock;

// import.meta.env defaults (Vite injects these)
// vitest already supports import.meta.env – set defaults here
if (!import.meta.env.VITE_API_URL) {
  import.meta.env.VITE_API_URL = 'http://localhost:8000/api';
}
if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  import.meta.env.VITE_GOOGLE_CLIENT_ID = 'test-google-client-id';
}
