import { describe, expect, it } from 'vitest';
import { seedRepo, loadRepo, saveRepo, KR_KEY } from '@/lib/knowledge/storage';
import { validateDependency, validateClause, cycleThrough, reachable, directNeighbours } from '@/lib/knowledge/graph';
import { FRAMEWORKS, seedClauses } from '@/lib/knowledge/sources';
import type { Dependency, Repo } from '@/lib/knowledge/types';

const dep = (id: string, s: string, t: string, type: Dependency['type'] = 'Requires'): Dependency =>
  ({ id, sourceId: s, targetId: t, type, rationale: 'Test rationale', illustrative: false, createdBy: 'Auditor', createdAt: '2025-02-01T00:00:00Z' });
const A = 'iso17025:4.1', B = 'iso17025:4.2', C = 'iso17025:5';

describe('dependency validation', () => {
  const repo: Repo = { ...seedRepo(), dependencies: [dep('d1', A, B)] };
  it('requires non-whitespace rationale and type', () => {
    const e = validateDependency({ sourceId: A, targetId: C, type: '', rationale: '    ' }, repo);
    expect(e.rationale).toBeTruthy(); expect(e.type).toBeTruthy();
  });
  it('rejects self links and duplicate edges', () => {
    expect(validateDependency({ sourceId: A, targetId: A, type: 'Related', rationale: 'Long enough reason' }, repo).targetId).toMatch(/itself/);
    expect(validateDependency({ sourceId: A, targetId: B, type: 'Requires', rationale: 'Long enough reason' }, repo).targetId).toMatch(/already exists/);
    expect(validateDependency({ sourceId: A, targetId: B, type: 'Related', rationale: 'Long enough reason' }, repo)).toEqual({});
  });
  it('allows multi-node cycles', () => {
    const r: Repo = { ...repo, dependencies: [dep('d1', A, B), dep('d2', B, C)] };
    expect(validateDependency({ sourceId: C, targetId: A, type: 'Requires', rationale: 'Closes the loop' }, r)).toEqual({});
  });
  it('rejects whitespace and duplicate clause ids', () => {
    const e = validateClause({ frameworkId: 'iso17025', number: ' 4.1 ', title: '  ', parentId: '', plainSummary: ' ' }, repo);
    expect(e.number).toMatch(/already exists/); expect(e.title).toBeTruthy(); expect(e.plainSummary).toBeTruthy();
  });
});

describe('cycle-safe traversal', () => {
  const deps = [dep('d1', A, B), dep('d2', B, C), dep('d3', C, A)];
  it('terminates and reports the cycle', () => {
    expect(cycleThrough(A, deps)).toEqual([A, B, C, A]);
    expect([...reachable(A, deps).keys()].sort()).toEqual([B, C].sort());
    expect(directNeighbours(B, deps).map((n) => n.direction).sort()).toEqual(['in', 'out']);
  });
  it('returns null when acyclic', () => { expect(cycleThrough(A, [dep('d1', A, B)])).toBeNull(); });
});

describe('persistence', () => {
  it('round-trips through the dedicated key and leaves the audit store alone', () => {
    const r = { ...seedRepo(), dependencies: [dep('d1', A, B)] };
    expect(saveRepo(r).ok).toBe(true);
    expect(localStorage.getItem('kavach.workspace.v1')).toBeNull();
    const l = loadRepo();
    expect(l.ok && l.repo.dependencies[0].id).toBe('d1');
  });
  it('reports invalid stored data instead of overwriting it', () => {
    localStorage.setItem(KR_KEY, JSON.stringify({ version: 1, clauses: [], dependencies: [dep('x', A, B)] }));
    const l = loadRepo();
    expect(l.ok).toBe(false);
    expect(localStorage.getItem(KR_KEY)).toContain('"x"');
  });
  it('refuses to save self links', () => {
    expect(saveRepo({ ...seedRepo(), dependencies: [dep('s', A, A)] }).ok).toBe(false);
  });
});

describe('source catalogue', () => {
  const cs = seedClauses();
  it('has unique ids and only seeds clauses for supplied PDFs', () => {
    expect(new Set(cs.map((c) => c.id)).size).toBe(cs.length);
    for (const f of FRAMEWORKS.filter((x) => !x.file)) expect(cs.some((c) => c.frameworkId === f.id)).toBe(false);
  });
  it('labels preview-only headings as contents and cites pages within each file', () => {
    expect(cs.find((c) => c.id === 'iso15504-1:4.2.2')?.coverage).toBe('contents');
    expect(cs.find((c) => c.id === 'iso12207:6.4.9')?.coverage).toBe('contents');
    expect(cs.find((c) => c.id === 'iso12207:3.1')?.coverage).toBe('partial');
    expect(cs.find((c) => c.id === 'iso17025:7.8.6')?.source?.bodyPdfPage).toBe(23);
    for (const c of cs) {
      const f = FRAMEWORKS.find((x) => x.id === c.frameworkId)!;
      if (c.source?.bodyPdfPage) expect(c.source.bodyPdfPage).toBeLessThanOrEqual(f.pdfPages!);
    }
  });
});
