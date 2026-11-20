import { expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import Governance from '@/pages/governance';
import { closureGates, SIGN_KEYS } from '@/lib/store';
import { fixture, ready, mount, click } from './helpers';

it('requires all four role-specific simulated signatures and updates the closure matrix on revocation', () => {
  const s = ready(fixture('Auditor'));
  for (const { key } of SIGN_KEYS) s.audits[0].signoffs[key] = null;
  const h = mount(s, <Governance />, '/governance');
  expect(screen.getByText(/Signatures here are simulated with non-cryptographic digests/)).toBeInTheDocument();
  expect(screen.getByTestId('status-governance')).toHaveTextContent('4 declaration(s) missing');
  expect(screen.getByTestId('button-sign-impAuditee')).toBeDisabled();
  click('button-sign-impAuditor'); click('button-sign-confAuditor');
  expect(screen.getByTestId('status-governance')).toHaveTextContent('2 declaration(s) missing');
  expect(screen.queryByText('Ready to close')).not.toBeInTheDocument();
  h.role('Auditee');
  expect(screen.queryByTestId('button-revoke-impAuditor')).not.toBeInTheDocument();
  click('button-sign-impAuditee'); click('button-sign-confAuditee');
  expect(screen.getByTestId('status-governance')).toHaveTextContent('Declaration gates satisfied');
  expect(screen.getByText('Ready to close')).toBeInTheDocument();
  expect(h.state.findings[0].closedAt).toBe('');
  for (const { key, role } of SIGN_KEYS) {
    expect(h.state.audits[0].signoffs[key]).toMatchObject({ by: role === 'Auditor' ? s.audits[0].lead : s.audits[0].auditeeRep });
    expect(h.state.audits[0].signoffs[key]?.digest).toBeTruthy();
  }
  click('button-revoke-confAuditee');
  expect(screen.queryByText('Ready to close')).not.toBeInTheDocument();
  expect(closureGates(h.state.findings[0], h.state.audits[0]).filter(g => !g.ok).map(g => g.id)).toEqual(['confAuditee']);
  expect(h.state.log.at(-1)?.action).toBe('Declaration revoked: confAuditee');
});

it('keeps declarations scoped to the selected audit', () => {
  const s = fixture('Auditor');
  s.audits.push({ ...structuredClone(s.audits[0]), id: 'SECOND-AUDIT' });
  const h = mount(s, <Governance />, '/governance');
  click('button-gov-audit-SECOND-AUDIT');
  click('button-sign-impAuditor');
  expect(h.state.audits[1].signoffs.impAuditor).not.toBeNull();
  expect(h.state.audits[0].signoffs.impAuditor).toBeNull();
});
