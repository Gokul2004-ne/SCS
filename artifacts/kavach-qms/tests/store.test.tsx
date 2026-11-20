import { describe, expect, it } from 'vitest';
import { act } from '@testing-library/react';
import { closureGates, SIGN_KEYS, stageOf, friction, totalIterations } from '@/lib/store';
import { digest } from '@/lib/digest';
import { fixture, ready, mount, KEY } from './helpers';

describe('closure policy helpers', () => {
  it.each(['p1', 'rca', 'eff', ...SIGN_KEYS.map(k => k.key)])('blocks closure when %s is missing', id => {
    const s = ready(), f = s.findings[0], a = s.audits[0];
    if (id === 'p1') f.p1Status = 'Issued';
    else if (id === 'rca') f.rca.status = 'Submitted';
    else if (id === 'eff') f.effectiveness.verified = false;
    else a.signoffs[id as keyof typeof a.signoffs] = null;
    expect(closureGates(f, a).filter(g => !g.ok).map(g => g.id)).toEqual([id]);
  });
  it('requires a nonblank NA reason and treats absent audits as four missing signatures', () => {
    const s = ready(), f = s.findings[0];
    f.rca.status = 'Not Applicable';
    f.rca.naReason = ' \n ';
    expect(closureGates(f, s.audits[0])[1].ok).toBe(false);
    f.rca.naReason = 'Correction not applicable with documented rationale.';
    expect(closureGates(f, s.audits[0]).every(g => g.ok)).toBe(true);
    expect(closureGates(f, undefined).filter(g => !g.ok)).toHaveLength(4);
  });
  it.each([
    ['Issued', 'Locked', false, '', 'Phase 1'],
    ['In Rebuttal', 'Locked', false, '', 'In rebuttal'],
    ['Accepted', 'Draft', false, '', 'RCA'],
    ['Accepted', 'Locked', false, '', 'RCA'],
    ['Accepted', 'Submitted', false, '', 'RCA review'],
    ['Accepted', 'Rejected', false, '', 'RCA revision'],
    ['Accepted', 'Accepted', false, '', 'Verification'],
    ['Accepted', 'Not Applicable', true, '', 'Closure gate'],
    ['Accepted', 'Accepted', true, '2026-11-20', 'Closed'],
    ['Withdrawn', 'Locked', false, '', 'Withdrawn'],
  ] as const)('maps %s / %s to its stage', (p1, rca, verified, closed, expected) => {
    const s = fixture(), f = s.findings[0];
    f.p1Status = p1; f.rca.status = rca; f.effectiveness.verified = verified; f.closedAt = closed;
    expect(stageOf(f, s.audits[0])).toBe(expected);
  });
  it('keeps rounds separate and uses inclusive configured friction thresholds', () => {
    const s = fixture(), f = s.findings[0];
    s.settings.moderateThreshold = 3; s.settings.highThreshold = 5;
    f.p1Iterations = 2;
    expect(friction(f, s.settings)).toBe('Low');
    f.rca.p2Iterations = 1;
    expect(friction(f, s.settings)).toBe('Moderate');
    f.rca.p2Iterations = 3;
    expect(totalIterations(f)).toBe(5);
    expect(friction(f, s.settings)).toBe('High');
  });
});

describe('local prototype store (not an authorization boundary)', () => {
  it('persists mutations, chains log events, and allows simulated role switching', () => {
    const h = mount(fixture(), null), before = h.state;
    act(() => h.store.mutate('first', 'test', d => { d.findings[0].title = 'Changed title'; }));
    expect(before.findings[0].title).not.toBe('Changed title');
    h.role('Auditor');
    act(() => h.store.mutate('second', 'test', () => {}));
    expect(h.state.log.map(x => x.role)).toEqual(['Auditee', 'Auditor']);
    const [first, second] = h.state.log;
    expect(second.seq).toBe(first.seq + 1);
    expect(second.prev).toBe(first.digest);
    expect(second.digest).toBe(digest(second.prev + second.at + second.role + second.action + second.ref));
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(h.state);
    const saved = structuredClone(h.state);
    h.unmount();
    const restored = mount(saved, null);
    expect(restored.state).toEqual(saved);
    act(() => restored.store.importState(fixture('Auditee')));
    expect(restored.state.role).toBe('Auditee');
    act(() => restored.store.reset());
    expect(restored.state.findings.length).toBeGreaterThan(1);
  });
});
