import { expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import CorrectiveActions from '@/pages/corrective-actions';
import { fixture, mount, click, fill } from './helpers';

const route = '/corrective-actions/:id';
it.each(['Issued', 'In Rebuttal', 'Withdrawn'] as const)('locks direct RCA access for %s findings', status => {
  const s = fixture(); s.findings[0].p1Status = status;
  mount(s, <CorrectiveActions />, route);
  expect(screen.getByText(`${s.findings[0].id} RCA is locked`)).toBeInTheDocument();
  expect(screen.queryByTestId('button-submit-rca')).not.toBeInTheDocument();
  expect(screen.queryByTestId('button-na-rca')).not.toBeInTheDocument();
  if (status === 'Withdrawn') expect(screen.queryByTestId(`button-select-rca-${s.findings[0].id}`)).not.toBeInTheDocument();
});

it('validates a complete 8D, preserves drafts, and tracks rejection/revision separately from phase 1', () => {
  const s = fixture(), f = s.findings[0];
  f.p1Status = 'Accepted'; f.p1Iterations = 2; f.rca.status = 'Draft';
  const h = mount(s, <CorrectiveActions />, route);
  click('button-submit-rca');
  expect(screen.getByText(/Incomplete: D1 team/)).toBeInTheDocument();
  expect(h.state.log).toHaveLength(0);
  fill('input-d1', 'Quality and engineering team');
  click('button-save-draft');
  expect(h.state.findings[0].rca).toMatchObject({ d1: 'Quality and engineering team', status: 'Draft', p2Iterations: 0 });
  for (const key of Object.keys(f.rca.d2)) fill(`input-d2-${key}`, `Documented ${key}`);
  for (const id of ['d3', 'root', 'escape', 'd5', 'd6', 'd7', 'd8']) fill(`input-${id}`, 'Documented correction and objective record EV-0001');
  for (let i = 0; i < 3; i++) fill(`input-why-${i}`, `Systemic cause ${i}`);
  click('button-submit-rca');
  expect(h.state.findings[0].rca).toMatchObject({ status: 'Submitted', p2Iterations: 1 });
  expect(screen.getByTestId('input-d1')).toBeDisabled();
  expect(screen.queryByTestId('button-accept-rca')).not.toBeInTheDocument();
  h.role('Auditor');
  expect(screen.getByTestId('input-d1')).toBeDisabled();
  expect(screen.queryByTestId('button-save-draft')).not.toBeInTheDocument();
  click('button-reject-rca');
  expect(h.state.findings[0].rca.status).toBe('Submitted');
  expect(screen.getByText(/Rejection reason required/)).toBeInTheDocument();
  fill('input-rca-note', 'Validation evidence needs an independent sample.');
  click('button-reject-rca');
  expect(h.state.findings[0].rca).toMatchObject({ status: 'Rejected', p2Iterations: 1 });
  expect(screen.getByTestId('button-accept-rca')).toBeDisabled();
  h.role('Auditee');
  expect(screen.getByTestId('input-d1')).toBeEnabled();
  fill('input-d6', 'Independent validation report EV-0002');
  click('button-save-draft');
  expect(h.state.findings[0].rca.p2Iterations).toBe(1);
  click('button-submit-rca');
  h.role('Auditor');
  click('button-accept-rca');
  const result = h.state.findings[0];
  expect(result).toMatchObject({ p1Iterations: 2, closedAt: '', effectiveness: { verified: false }, rca: { status: 'Accepted', p2Iterations: 2 } });
  expect(result.rca.p2History.map(m => [m.kind, m.round, m.role])).toEqual([
    ['submit', 1, 'Auditee'], ['reject', 1, 'Auditor'], ['submit', 2, 'Auditee'], ['accept', 2, 'Auditor'],
  ]);
});

it('allows only auditor disposition and requires a justified NA without adding submission rounds', () => {
  const s = fixture('Auditor');
  s.findings[0].p1Status = 'Accepted'; s.findings[0].rca.status = 'Draft';
  const h = mount(s, <CorrectiveActions />, route);
  expect(screen.getByTestId('button-accept-rca')).toBeDisabled();
  expect(screen.getByTestId('button-reject-rca')).toBeDisabled();
  for (const invalid of ['', '   ', 'too short']) {
    fill('input-rca-note', invalid); click('button-na-rca');
    expect(h.state.findings[0].rca.status).toBe('Draft');
  }
  fill('input-rca-note', '  Observation does not require corrective action.  ');
  click('button-na-rca');
  expect(h.state.findings[0].rca).toMatchObject({ status: 'Not Applicable', naReason: 'Observation does not require corrective action.', p2Iterations: 0 });
  expect(h.state.findings[0].closedAt).toBe('');
  expect(screen.getByText('NA justification')).toBeInTheDocument();
});

it('makes closed RCA read-only for both simulated roles', () => {
  const s = fixture(); s.findings[0].p1Status = 'Accepted';
  s.findings[0].rca.status = 'Accepted'; s.findings[0].closedAt = '2026-11-20T10:00:00Z';
  const h = mount(s, <CorrectiveActions />, route);
  expect(screen.getByTestId('input-d1')).toBeDisabled();
  expect(screen.queryByTestId('button-submit-rca')).not.toBeInTheDocument();
  h.role('Auditor');
  expect(screen.queryByTestId('button-na-rca')).not.toBeInTheDocument();
});
