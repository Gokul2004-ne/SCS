import type { Clause, Dependency, DepType, Repo } from './types';
import { DEP_TYPES } from './types';

export const MAX_DEPTH = 6;

export interface DepDraft { sourceId: string; targetId: string; type: DepType | ''; rationale: string }
export interface ClauseDraft { frameworkId: string; number: string; title: string; parentId: string; plainSummary: string }

const blank = (s: string) => !s || !s.trim();

export function validateDependency(d: DepDraft, repo: Repo, editingId?: string): Record<string, string> {
  const e: Record<string, string> = {};
  const ids = new Set(repo.clauses.map((c) => c.id));
  if (blank(d.sourceId) || !ids.has(d.sourceId)) e.sourceId = 'Choose an existing source clause.';
  if (blank(d.targetId) || !ids.has(d.targetId)) e.targetId = 'Choose an existing target clause.';
  if (!d.type || !DEP_TYPES.includes(d.type as DepType)) e.type = 'Choose a relationship type.';
  if (blank(d.rationale)) e.rationale = 'Rationale is required. Explain why this link exists.';
  else if (d.rationale.trim().length < 8) e.rationale = 'Rationale must be at least 8 characters.';
  if (!e.sourceId && !e.targetId && d.sourceId === d.targetId) e.targetId = 'A clause cannot link to itself.';
  if (!e.sourceId && !e.targetId && !e.type) {
    const dup = repo.dependencies.some((x) => x.id !== editingId && x.sourceId === d.sourceId && x.targetId === d.targetId && x.type === d.type);
    if (dup) e.targetId = 'This exact relationship already exists.';
  }
  return e;
}

export const clauseIdFor = (frameworkId: string, number: string) => `${frameworkId}:${number.trim()}`;

export function validateClause(d: ClauseDraft, repo: Repo, editingId?: string): Record<string, string> {
  const e: Record<string, string> = {};
  if (blank(d.frameworkId)) e.frameworkId = 'Choose a framework.';
  if (blank(d.number)) e.number = 'Clause number is required.';
  else if (!/^[A-Za-z0-9][A-Za-z0-9 .\-]*$/.test(d.number.trim())) e.number = 'Use letters, digits, dots, dashes or spaces.';
  if (blank(d.title)) e.title = 'Title is required.';
  if (blank(d.plainSummary)) e.plainSummary = 'A plain-English summary is required.';
  else if (d.plainSummary.trim().length < 12) e.plainSummary = 'Summary must be at least 12 characters.';
  if (!e.frameworkId && !e.number) {
    const id = clauseIdFor(d.frameworkId, d.number);
    if (id !== editingId && repo.clauses.some((c) => c.id === id)) e.number = 'A clause with this number already exists in this framework.';
  }
  if (d.parentId) {
    const p = repo.clauses.find((c) => c.id === d.parentId);
    if (!p) e.parentId = 'Parent not found.';
    else if (p.frameworkId !== d.frameworkId) e.parentId = 'Parent must be in the same framework.';
    else if (editingId && (p.id === editingId || ancestors(p.id, repo.clauses).includes(editingId))) e.parentId = 'Parent would create a loop in the clause tree.';
  }
  return e;
}

/** Ancestor chain, bounded so corrupt data cannot loop forever. */
export function ancestors(id: string, clauses: Clause[]): string[] {
  const byId = new Map(clauses.map((c) => [c.id, c]));
  const out: string[] = [];
  let cur = byId.get(id)?.parentId ?? null;
  while (cur && !out.includes(cur) && out.length < 50) { out.push(cur); cur = byId.get(cur)?.parentId ?? null; }
  return out;
}

export interface Neighbour { dep: Dependency; otherId: string; direction: 'out' | 'in' }

export function directNeighbours(id: string, deps: Dependency[]): Neighbour[] {
  const out: Neighbour[] = [];
  for (const d of deps) {
    if (d.sourceId === id) out.push({ dep: d, otherId: d.targetId, direction: 'out' });
    else if (d.targetId === id) out.push({ dep: d, otherId: d.sourceId, direction: 'in' });
  }
  return out;
}

/** Breadth-first outgoing reach with a visited set and depth bound; safe on cyclic graphs. */
export function reachable(id: string, deps: Dependency[], maxDepth = MAX_DEPTH): Map<string, number> {
  const seen = new Map<string, number>([[id, 0]]);
  let frontier = [id];
  for (let depth = 1; depth <= maxDepth && frontier.length; depth++) {
    const next: string[] = [];
    for (const n of frontier) for (const d of deps) {
      if (d.sourceId === n && !seen.has(d.targetId)) { seen.set(d.targetId, depth); next.push(d.targetId); }
    }
    frontier = next;
  }
  seen.delete(id);
  return seen;
}

/** Returns one directed cycle through `id` as a list of clause ids (first === last), or null. */
export function cycleThrough(id: string, deps: Dependency[], maxDepth = 25): string[] | null {
  const prev = new Map<string, string>();
  const visited = new Set<string>([id]);
  let frontier = [id];
  for (let depth = 0; depth < maxDepth && frontier.length; depth++) {
    const next: string[] = [];
    for (const n of frontier) for (const d of deps) {
      if (d.sourceId !== n) continue;
      if (d.targetId === id) {
        const path = [id];
        let cur: string | undefined = n;
        while (cur && cur !== id) { path.unshift(cur); cur = prev.get(cur); }
        path.unshift(id);
        return path;
      }
      if (!visited.has(d.targetId)) { visited.add(d.targetId); prev.set(d.targetId, n); next.push(d.targetId); }
    }
    frontier = next;
  }
  return null;
}

export function dependenciesTouching(clauseIds: string[], deps: Dependency[]) {
  const s = new Set(clauseIds);
  return deps.filter((d) => s.has(d.sourceId) || s.has(d.targetId));
}

export function descendants(id: string, clauses: Clause[]): string[] {
  const out: string[] = [];
  const stack = [id];
  while (stack.length && out.length < 500) {
    const cur = stack.pop()!;
    for (const c of clauses) if (c.parentId === cur && !out.includes(c.id)) { out.push(c.id); stack.push(c.id); }
  }
  return out;
}
