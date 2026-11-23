import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Lifecycle, STEP_MS } from '@/components/public/lifecycle';
import Login from '@/pages/login';
import Landing from '@/pages/landing';

afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

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

describe('Landing', () => {
  it('renders only the hero with lifecycle and no common login or anchors', () => {
    const { container } = render(<Landing />);
    const page = screen.getByTestId('page-landing');
    expect(page.querySelectorAll('section')).toHaveLength(1);
    expect(screen.getByTestId('section-lifecycle')).toBeInTheDocument();
    expect(screen.getByTestId('text-lifecycle-step')).toBeInTheDocument();
    expect(container.querySelector('footer')).toBeNull();
    expect(container.querySelector('nav')).toBeNull();
    expect(container.querySelectorAll('a[href^="#"]')).toHaveLength(0);
    expect(container.querySelectorAll('a[href="/login"]')).toHaveLength(0);
    expect(screen.queryByTestId('link-nav-login')).toBeNull();
    expect(screen.queryByText('Three standards. One audit trail.')).toBeNull();
  });

  it('offers distinct Auditor and Auditee login destinations', () => {
    render(<Landing />);
    expect(screen.getByTestId('link-cta-login-auditor')).toHaveAttribute('href', '/login/auditor');
    expect(screen.getByTestId('link-cta-login-auditee')).toHaveAttribute('href', '/login/auditee');
  });
});

describe('Login', () => {
  it('chooser links to each persona entry', () => {
    render(<Login />);
    expect(screen.getByTestId('link-choose-auditor')).toHaveAttribute('href', '/login/auditor');
    expect(screen.getByTestId('link-choose-auditee')).toHaveAttribute('href', '/login/auditee');
  });

  it.each(['auditor', 'auditee'] as const)('%s entry is distinct, keeps sign-in pending and grants no role', (persona) => {
    const before = JSON.stringify({ ...localStorage });
    render(<Login persona={persona} />);
    expect(screen.getByTestId(`page-login-${persona}`)).toBeInTheDocument();
    expect(screen.getByTestId('text-login-title').textContent).toContain(persona === 'auditor' ? 'Auditor login' : 'Auditee login');
    expect(screen.getByTestId('text-persona-status').textContent).toContain('does not grant a role');
    expect(screen.getByTestId('button-secure-signin')).toBeDisabled();
    expect(screen.getByTestId('button-sso')).toBeDisabled();
    expect(document.querySelector('input')).toBeNull();
    expect(screen.getByTestId('link-demo-workspace')).toHaveAttribute('href', '/dashboard');
    fireEvent.click(screen.getByTestId('button-secure-signin'));
    expect(JSON.stringify({ ...localStorage })).toBe(before);
  });
});
