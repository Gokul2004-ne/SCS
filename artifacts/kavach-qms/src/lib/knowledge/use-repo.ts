import { useCallback, useRef, useState } from 'react';
import type { Clause, Dependency, Repo, SimRole } from './types';
import { loadRepo, saveRepo, seedRepo, KR_KEY } from './storage';
import { clauseIdFor, validateClause, validateDependency, type ClauseDraft, type DepDraft } from './graph';
import { KIND_LABEL } from './sources';

export type Result = { ok: true; id?: string } | { ok: false; errors: Record<string, string> };

export function useKnowledgeRepo(role: SimRole) {
  const initial = useRef(loadRepo());
  const [repo, setRepo] = useState<Repo>(initial.current.ok ? initial.current.repo : seedRepo());
  const [loadError, setLoadError] = useState<string | null>(initial.current.ok ? null : initial.current.error);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const repoRef = useRef(repo);
  repoRef.current = repo;

  const commit = useCallback((next: Repo) => {
    setRepo(next);
    const r = saveRepo(next);
    if (r.ok) { setSaveError(null); setSavedAt(new Date().toISOString()); } else setSaveError(r.error);
  }, []);

  const guard = (): Result | null => (role !== 'Auditor' ? { ok: false, errors: { role: 'Only the simulated Auditor role can change the repository.' } } : null);

  const upsertClause = useCallback((d: ClauseDraft, editingId?: string): Result => {
    const g = guard(); if (g) return g;
    const cur = repoRef.current;
    const errors = validateClause(d, cur, editingId);
    if (Object.keys(errors).length) return { ok: false, errors };
    const now = new Date().toISOString();
    const id = clauseIdFor(d.frameworkId, d.number);
    if (editingId) {
      const old = cur.clauses.find((c) => c.id === editingId);
      if (!old) return { ok: false, errors: { number: 'Clause no longer exists.' } };
      const updated: Clause = { ...old, id, number: d.number.trim(), title: d.title.trim(), plainSummary: d.plainSummary.trim(), parentId: d.parentId || null, updatedAt: now };
      commit({
        ...cur,
        clauses: cur.clauses.map((c) => (c.id === editingId ? updated : c.parentId === editingId ? { ...c, parentId: id } : c)),
        dependencies: cur.dependencies.map((x) => ({ ...x, sourceId: x.sourceId === editingId ? id : x.sourceId, targetId: x.targetId === editingId ? id : x.targetId })),
      });
      return { ok: true, id };
    }
    const c: Clause = {
      id, frameworkId: d.frameworkId, number: d.number.trim(), title: d.title.trim(), kind: 'requirement', parentId: d.parentId || null,
      plainSummary: d.plainSummary.trim(), coverage: 'none', source: null, origin: 'user', createdBy: role, createdAt: now, updatedAt: now,
    };
    commit({ ...cur, clauses: [...cur.clauses, c] });
    return { ok: true, id };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, commit]);

  /** Deletes only when no dependencies or child clauses reference it. No silent cascade. */
  const deleteClause = useCallback((id: string, alsoDeleteDeps: boolean): Result => {
    const g = guard(); if (g) return g;
    const cur = repoRef.current;
    if (cur.clauses.some((c) => c.parentId === id)) return { ok: false, errors: { delete: 'Delete or re-parent child clauses first.' } };
    const touching = cur.dependencies.filter((d) => d.sourceId === id || d.targetId === id);
    if (touching.length && !alsoDeleteDeps) return { ok: false, errors: { delete: `${touching.length} dependency link(s) reference this clause. Confirm their removal explicitly.` } };
    commit({ ...cur, clauses: cur.clauses.filter((c) => c.id !== id), dependencies: cur.dependencies.filter((d) => d.sourceId !== id && d.targetId !== id) });
    return { ok: true };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, commit]);

  const upsertDependency = useCallback((d: DepDraft, editingId?: string): Result => {
    const g = guard(); if (g) return g;
    const cur = repoRef.current;
    const errors = validateDependency(d, cur, editingId);
    if (Object.keys(errors).length) return { ok: false, errors };
    if (editingId) {
      commit({ ...cur, dependencies: cur.dependencies.map((x) => (x.id === editingId ? { ...x, sourceId: d.sourceId, targetId: d.targetId, type: d.type as Dependency['type'], rationale: d.rationale.trim() } : x)) });
      return { ok: true, id: editingId };
    }
    const dep: Dependency = {
      id: `dep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      sourceId: d.sourceId, targetId: d.targetId, type: d.type as Dependency['type'], rationale: d.rationale.trim(),
      illustrative: false, createdBy: role, createdAt: new Date().toISOString(),
    };
    commit({ ...cur, dependencies: [...cur.dependencies, dep] });
    return { ok: true, id: dep.id };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, commit]);

  const deleteDependency = useCallback((id: string): Result => {
    const g = guard(); if (g) return g;
    const cur = repoRef.current;
    commit({ ...cur, dependencies: cur.dependencies.filter((d) => d.id !== id) });
    return { ok: true };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, commit]);

  /** Recovery from a failed load: explicitly discards the stored value. */
  const resetToSeed = useCallback(() => {
    try { localStorage.removeItem(KR_KEY); } catch { /* storage unavailable */ }
    setLoadError(null);
    commit(seedRepo());
  }, [commit]);

  return { repo, loadError, saveError, savedAt, upsertClause, deleteClause, upsertDependency, deleteDependency, resetToSeed };
}

export type KnowledgeRepoApi = ReturnType<typeof useKnowledgeRepo>;
export const kindLabel = (c: Clause) => KIND_LABEL[c.kind];
