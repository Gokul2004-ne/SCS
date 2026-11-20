import { act, render, fireEvent, screen } from '@testing-library/react';
import { Route, Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { StoreProvider, useStore, SIGN_KEYS } from '@/lib/store';
import { seedState, emptyRca } from '@/lib/seed';
import type { State, Role } from '@/lib/types';
import type { ReactNode } from 'react';

export const KEY = 'kavach.workspace.v1';
export function fixture(role: Role = 'Auditee') {
  const s = structuredClone(seedState());
  s.role = role;
  s.findings = [s.findings[0]];
  s.audits = [s.audits.find(a => a.id === s.findings[0].auditId)!];
  const f = s.findings[0];
  Object.assign(f, { p1Status: 'Issued', p1Iterations: 0, p1History: [], closedAt: '' });
  f.rca = emptyRca();
  f.effectiveness = { verified: false, note: '', at: '' };
  for (const { key } of SIGN_KEYS) s.audits[0].signoffs[key] = null;
  s.log = [];
  return s;
}
export function ready(s = fixture('Auditor')) {
  const f = s.findings[0];
  f.p1Status = 'Accepted';
  f.rca.status = 'Accepted';
  f.effectiveness = { verified: true, note: 'Sample records verified.', at: '2026-11-20T10:00:00Z' };
  for (const { key } of SIGN_KEYS) s.audits[0].signoffs[key] = { by: key, at: '2026-11-20T09:00:00Z', digest: 'simulated' };
  return s;
}
export function mount(s: State, page: ReactNode, route = '/findings/:id') {
  localStorage.setItem(KEY, JSON.stringify(s));
  let ctx!: ReturnType<typeof useStore>;
  function Probe() { ctx = useStore(); return null; }
  const location = memoryLocation({ path: route.replace(':id', s.findings[0].id) });
  const view = render(<StoreProvider><Probe /><Router hook={location.hook}><Route path={route}>{page}</Route></Router></StoreProvider>);
  return { ...view, get state() { return ctx.state; }, get store() { return ctx; },
    role: (r: Role) => act(() => ctx.setRole(r)) };
}
export const click = (id: string) => fireEvent.click(screen.getByTestId(id));
export const fill = (id: string, value: string) => fireEvent.change(screen.getByTestId(id), { target: { value } });
