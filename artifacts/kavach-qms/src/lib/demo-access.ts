import type { State } from './types';

// Demonstration perspective only. Names in local storage are NOT identities.
export const AUDITEE_PAGES = ['/dashboard', '/audits', '/findings', '/governance'];
export function demoRouteAllowed(role: State['role'], path: string) {
  return role === 'Auditor' || AUDITEE_PAGES.some(p => path === p || (p === '/findings' && path.startsWith('/findings/')));
}
export function demoVisibleState(state: State): State {
  if (state.role === 'Auditor') return state;
  const audits = state.audits.filter(a => a.auditeeRep === state.settings.auditeeName);
  const auditIds = new Set(audits.map(a => a.id));
  const findings = state.findings.filter(f => auditIds.has(f.auditId));
  const findingIds = new Set(findings.map(f => f.id));
  const evidence = state.evidence.filter(e => findingIds.has(e.findingId))
    .map(e => ({ ...e, reusedIn: e.reusedIn.filter(id => findingIds.has(id)) }));
  const refs = new Set([...auditIds, ...findingIds, ...evidence.map(e => e.id)]);
  const frameworkIds = new Set(audits.flatMap(a => a.frameworkIds));
  return { ...state, audits, findings, evidence, frameworks: state.frameworks.filter(f => frameworkIds.has(f.id)),
    shared: [], log: state.log.filter(e => refs.has(e.ref)) };
}

export function demoMutationAllowed(before: State, after: State, action: string, ref: string): boolean {
  if (before.role === 'Auditor') {
    // Auditors may not sign or alter another persona's declarations.
    return before.audits.every(a => {
      const next = after.audits.find(n => n.id === a.id);
      return !next || (JSON.stringify(a.signoffs.impAuditee) === JSON.stringify(next.signoffs.impAuditee)
        && JSON.stringify(a.signoffs.confAuditee) === JSON.stringify(next.signoffs.confAuditee));
    });
  }
  const key = action === 'Declaration signed: impAuditee' ? 'impAuditee' : action === 'Declaration signed: confAuditee' ? 'confAuditee' : null;
  if (!key) return false;
  const audit = before.audits.find(a => a.id === ref && a.auditeeRep === before.settings.auditeeName);
  const next = after.audits.find(a => a.id === ref);
  if (!audit || !next || next.signoffs[key]?.by !== before.settings.auditeeName) return false;
  const comparison = structuredClone(after);
  comparison.audits.find(a => a.id === ref)!.signoffs[key] = audit.signoffs[key];
  return JSON.stringify(before) === JSON.stringify(comparison);
}
