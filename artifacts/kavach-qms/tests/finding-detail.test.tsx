import { expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import FindingDetail from '@/pages/finding-detail';
import { SIGN_KEYS } from '@/lib/store';
import { fixture, ready, mount, click, fill } from './helpers';

it('requires auditee acceptance before opening RCA and counts challenges, not auditor responses', () => {
  const h = mount(fixture(), <FindingDetail />);
  expect(screen.queryByTestId('link-open-rca')).not.toBeInTheDocument();
  expect(screen.queryByTestId('button-withdraw')).not.toBeInTheDocument();
  click('button-challenge');
  expect(h.state.log).toHaveLength(0);
  fill('input-rebuttal', 'Counter-evidence requires another review.');
  click('button-challenge');
  expect(h.state.findings[0].p1Iterations).toBe(1);
  h.role('Auditor');
  expect(screen.queryByTestId('button-accept-finding')).not.toBeInTheDocument();
  click('button-maintain');
  expect(h.state.log).toHaveLength(1);
  fill('input-rebuttal', 'Objective evidence supports the finding.');
  click('button-maintain');
  fill('input-rebuttal', 'Reclassification supported by evidence.');
  click('button-reclassify');
  expect(h.state.findings[0].classification).toBe('Observation');
  expect(h.state.findings[0].p1Status).toBe('In Rebuttal');
  expect(h.state.findings[0].p1Iterations).toBe(1);
  h.role('Auditee');
  fill('input-rebuttal', 'Further counter-evidence for review.');
  click('button-challenge');
  click('button-accept-finding');
  expect(h.state.findings[0]).toMatchObject({ p1Status: 'Accepted', p1Iterations: 2, rca: { status: 'Draft', p2Iterations: 0 } });
  expect(screen.getByTestId('link-open-rca')).toBeInTheDocument();
});

it('counts first-time acceptance as one phase-1 round', () => {
  const h = mount(fixture(), <FindingDetail />);
  click('button-accept-finding');
  expect(h.state.findings[0].p1Iterations).toBe(1);
});

it('requires a withdrawal reason and never treats withdrawal as closure', () => {
  const h = mount(fixture('Auditor'), <FindingDetail />);
  click('button-withdraw');
  expect(h.state.log).toHaveLength(0);
  fill('input-rebuttal', 'Duplicate finding already covered elsewhere.');
  click('button-withdraw');
  expect(h.state.findings[0]).toMatchObject({ p1Status: 'Withdrawn', closedAt: '', rca: { status: 'Locked' } });
  expect(h.state.findings[0].p1History.at(-1)?.kind).toBe('withdraw');
  expect(screen.queryByTestId('button-accept-finding')).not.toBeInTheDocument();
  expect(screen.queryByTestId('link-open-rca')).not.toBeInTheDocument();
});

it.each(SIGN_KEYS)('disables closure without $key', ({ key }) => {
  const s = ready(); s.audits[0].signoffs[key] = null;
  mount(s, <FindingDetail />);
  expect(screen.getByTestId('button-close-finding')).toBeDisabled();
});

it.each(['acceptance', 'RCA disposition', 'NA justification'] as const)('disables closure without %s', missing => {
  const s = ready(), f = s.findings[0];
  if (missing === 'acceptance') f.p1Status = 'Issued';
  else if (missing === 'RCA disposition') f.rca.status = 'Submitted';
  else { f.rca.status = 'Not Applicable'; f.rca.naReason = '   '; }
  mount(s, <FindingDetail />);
  expect(screen.getByTestId('button-close-finding')).toBeDisabled();
});

it('requires objective verification and explicit auditor confirmation after all gates pass', () => {
  const s = ready(); s.findings[0].effectiveness.verified = false;
  const h = mount(s, <FindingDetail />);
  expect(screen.getByTestId('button-close-finding')).toBeDisabled();
  click('button-verify');
  expect(h.state.log).toHaveLength(0);
  fill('input-effectiveness', 'Re-sampled ten records; all compliant.');
  click('button-verify');
  expect(h.state.findings[0].effectiveness.verified).toBe(true);
  expect(h.state.findings[0].closedAt).toBe('');
  h.role('Auditee');
  expect(screen.getByTestId('button-close-finding')).toBeDisabled();
  h.role('Auditor');
  click('button-close-finding');
  expect(h.state.findings[0].closedAt).toBe('');
  click('button-confirm-close');
  expect(h.state.findings[0].closedAt).not.toBe('');
  expect(h.state.log.at(-1)?.action).toBe('Finding closed (explicit action)');
});

it('does not offer verification to the auditee', () => {
  const s = ready(fixture()); s.findings[0].effectiveness.verified = false;
  mount(s, <FindingDetail />);
  expect(screen.queryByTestId('button-verify')).not.toBeInTheDocument();
  expect(screen.getByText('Awaiting auditor verification.')).toBeInTheDocument();
});
