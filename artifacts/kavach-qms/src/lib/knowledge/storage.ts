import { z } from 'zod';
import type { Repo } from './types';
import { seedClauses } from './sources';

/** Dedicated browser-local key. Deliberately separate from the audit workspace key. */
export const KR_KEY = 'kavach.knowledge-repo.v1';

const sourceSchema = z.object({
  file: z.string(),
  contentsPdfPage: z.number().int().positive().nullable(),
  bodyPdfPage: z.number().int().positive().nullable(),
  printedPage: z.string().nullable(),
});

const clauseSchema = z.object({
  id: z.string().min(1),
  frameworkId: z.string().min(1),
  number: z.string().trim().min(1),
  title: z.string().trim().min(1),
  kind: z.enum(['scope', 'reference', 'definitions', 'requirement', 'concept', 'conformance', 'process', 'informative']),
  parentId: z.string().nullable(),
  plainSummary: z.string().trim().min(1),
  coverage: z.enum(['body', 'partial', 'contents', 'none']),
  source: sourceSchema.nullable(),
  origin: z.enum(['source', 'user']),
  createdBy: z.enum(['Auditor', 'Auditee', 'Source extraction']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const depSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  type: z.enum(['Requires', 'Related', 'Conflicts']),
  rationale: z.string().trim().min(1),
  illustrative: z.boolean(),
  createdBy: z.enum(['Auditor', 'Auditee']),
  createdAt: z.string(),
});

export const repoSchema = z.object({ version: z.literal(1), clauses: z.array(clauseSchema), dependencies: z.array(depSchema) })
  .superRefine((r, ctx) => {
    const ids = new Set<string>();
    for (const c of r.clauses) { if (ids.has(c.id)) ctx.addIssue({ code: 'custom', message: `Duplicate clause id ${c.id}` }); ids.add(c.id); }
    const edges = new Set<string>();
    for (const d of r.dependencies) {
      if (!ids.has(d.sourceId) || !ids.has(d.targetId)) ctx.addIssue({ code: 'custom', message: `Dependency ${d.id} references a missing clause` });
      if (d.sourceId === d.targetId) ctx.addIssue({ code: 'custom', message: `Dependency ${d.id} is a self-link` });
      const k = `${d.sourceId}|${d.type}|${d.targetId}`;
      if (edges.has(k)) ctx.addIssue({ code: 'custom', message: `Duplicate dependency ${k}` });
      edges.add(k);
    }
  });

export function seedRepo(): Repo {
  return { version: 1, clauses: seedClauses(), dependencies: [] };
}

export type LoadResult = { ok: true; repo: Repo; fresh: boolean } | { ok: false; error: string; raw: string | null };

export function loadRepo(storage: Storage | undefined = globalThis.localStorage): LoadResult {
  let raw: string | null;
  try {
    if (!storage) return { ok: true, repo: seedRepo(), fresh: true };
    raw = storage.getItem(KR_KEY);
  } catch (e) {
    return { ok: false, error: `Browser storage is unavailable: ${(e as Error).message}`, raw: null };
  }
  if (!raw) return { ok: true, repo: seedRepo(), fresh: true };
  try {
    const parsed = repoSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { ok: false, error: `Stored repository failed validation: ${parsed.error.issues[0]?.message ?? 'unknown issue'}`, raw };
    return { ok: true, repo: parsed.data as Repo, fresh: false };
  } catch {
    return { ok: false, error: 'Stored repository is not valid JSON.', raw };
  }
}

export function saveRepo(repo: Repo, storage: Storage = localStorage): { ok: true } | { ok: false; error: string } {
  const parsed = repoSchema.safeParse(repo);
  if (!parsed.success) return { ok: false, error: `Refused to save invalid repository: ${parsed.error.issues[0]?.message}` };
  try {
    storage.setItem(KR_KEY, JSON.stringify(repo));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Could not write to browser storage (${(e as Error).name}). Changes are held in this tab only.` };
  }
}

export function exportRepoJson(repo: Repo) {
  const payload = {
    kind: 'kavach.knowledge-repository',
    exportedAt: new Date().toISOString(),
    notice: 'Browser-local demonstration export. Summaries are original paraphrases; not standard text. Mappings are unverified unless reviewed against licensed editions.',
    ...repo,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `knowledge-repository-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
