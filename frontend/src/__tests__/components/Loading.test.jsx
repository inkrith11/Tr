import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '../../components/Loading';

describe('Loading component', () => {
  it('renders a spinner', () => {
    const { container } = render(<Loading />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('has minimum height for layout stability', () => {
    const { container } = render(<Loading />);
    const wrapper = container.firstChild;
    expect(wrapper.className).toContain('min-h-');
  });
});
