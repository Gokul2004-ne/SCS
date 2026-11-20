import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { State, Role, Finding, Audit, Settings } from './types';
import { seedState } from './seed';
import { digest } from './digest';

const KEY = 'kavach.workspace.v1';

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s.version === 1) return s;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return seedState();
}

interface Ctx {
  state: State;
  role: Role;
  setRole: (r: Role) => void;
  mutate: (action: string, ref: string, fn: (draft: State) => void) => void;
  reset: () => void;
  importState: (s: State) => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const mutate = useCallback((action: string, ref: string, fn: (d: State) => void) => {
    setState((prev) => {
      const d: State = structuredClone(prev);
      fn(d);
      const last = d.log[d.log.length - 1];
      const at = new Date().toISOString();
      const prevDigest = last ? last.digest : '0'.repeat(16);
      d.log.push({
        seq: (last?.seq ?? 0) + 1,
        at,
        role: d.role,
        action,
        ref,
        prev: prevDigest,
        digest: digest(prevDigest + at + d.role + action + ref),
      });
      return d;
    });
  }, []);

  const setRole = useCallback((r: Role) => {
    setState((p) => ({ ...p, role: r }));
  }, []);

  const reset = useCallback(() => setState(seedState()), []);
  const importState = useCallback((s: State) => setState(s), []);

  return (
    <StoreCtx.Provider value={{ state, role: state.role, setRole, mutate, reset, importState }}>
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}

export const nowIso = () => new Date().toISOString();

export function totalIterations(f: Finding) {
  return f.p1Iterations + f.rca.p2Iterations;
}

export type Friction = 'High' | 'Moderate' | 'Low';
export function friction(f: Finding, s: Settings): Friction {
  const t = totalIterations(f);
  if (t >= s.highThreshold) return 'High';
  if (t >= s.moderateThreshold) return 'Moderate';
  return 'Low';
}

export const SIGN_KEYS = [
  { key: 'impAuditor', label: 'Impartiality', role: 'Auditor' },
  { key: 'impAuditee', label: 'Impartiality', role: 'Auditee' },
  { key: 'confAuditor', label: 'Confidentiality', role: 'Auditor' },
  { key: 'confAuditee', label: 'Confidentiality', role: 'Auditee' },
] as const;

export interface Gate {
  id: string;
  label: string;
  ok: boolean;
  hint: string;
}

export function closureGates(f: Finding, audit: Audit | undefined): Gate[] {
  const rcaOk = f.rca.status === 'Accepted' || (f.rca.status === 'Not Applicable' && f.rca.naReason.trim().length > 0);
  const g: Gate[] = [
    { id: 'p1', label: 'Finding accepted by auditee', ok: f.p1Status === 'Accepted', hint: 'Auditee must accept the (possibly reclassified) finding.' },
    { id: 'rca', label: 'RCA accepted or justified NA', ok: rcaOk, hint: 'Auditor accepts the 8D, or marks NA with a recorded reason.' },
    { id: 'eff', label: 'Effectiveness verified', ok: f.effectiveness.verified, hint: 'Auditor records objective verification that the correction works.' },
  ];
  SIGN_KEYS.forEach((k) => {
    g.push({ id: k.key, label: `${k.role} ${k.label.toLowerCase()} declaration`, ok: !!audit?.signoffs[k.key], hint: `Signed by the ${k.role.toLowerCase()} on the Governance page for ${audit?.id ?? 'the audit'}.` });
  });
  return g;
}

export type Stage = 'Phase 1' | 'In rebuttal' | 'RCA' | 'RCA review' | 'RCA revision' | 'Verification' | 'Closure gate' | 'Closed' | 'Withdrawn';

export function stageOf(f: Finding, audit: Audit | undefined): Stage {
  if (f.p1Status === 'Withdrawn') return 'Withdrawn';
  if (f.closedAt) return 'Closed';
  if (f.p1Status === 'Issued') return 'Phase 1';
  if (f.p1Status === 'In Rebuttal') return 'In rebuttal';
  if (f.rca.status === 'Submitted') return 'RCA review';
  if (f.rca.status === 'Rejected') return 'RCA revision';
  if (f.rca.status === 'Draft' || f.rca.status === 'Locked') return 'RCA';
  if (!f.effectiveness.verified) return 'Verification';
  void audit;
  return 'Closure gate';
}
