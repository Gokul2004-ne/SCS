import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Lifecycle, STEP_MS } from '@/components/public/lifecycle';
import Login from '@/pages/login';

describe('Lifecycle', () => {
  it('advances every interval, loops, pauses, and selects on click', () => {
    vi.useFakeTimers();
    render(<Lifecycle />);
    const label = () => screen.getByTestId('text-lifecycle-step').textContent;
    expect(label()).toContain('Plan');
    act(() => { vi.advanceTimersByTime(STEP_MS); });
    expect(label()).toContain('Notify');
    act(() => { vi.advanceTimersByTime(STEP_MS * 7); });
    expect(label()).toContain('Plan');
    fireEvent.click(screen.getByTestId('button-lifecycle-toggle'));
    act(() => { vi.advanceTimersByTime(STEP_MS * 3); });
    expect(label()).toContain('Plan');
    fireEvent.click(screen.getByTestId('lifecycle-node-capa'));
    expect(label()).toContain('8D CAPA');
  });
});

describe('Login', () => {
  it('selects a persona without enabling sign-in', () => {
    render(<Login />);
    const a = screen.getByTestId('button-persona-auditee');
    fireEvent.click(a);
    expect(a).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('text-persona-status').textContent).toContain('does not grant a role');
    expect(screen.getByTestId('button-secure-signin')).toBeDisabled();
    expect(screen.getByTestId('button-sso')).toBeDisabled();
  });
});
