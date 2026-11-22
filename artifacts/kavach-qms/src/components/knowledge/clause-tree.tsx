import { useMemo, useState } from 'react';
import { ChevronRight, Search, FileText, FileX2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FRAMEWORKS } from '@/lib/knowledge/sources';
import type { Clause, Coverage } from '@/lib/knowledge/types';
import { Hint } from './bits';

type CovFilter = Coverage | 'all';

export function ClauseTree({ clauses, selectedId, onSelect, depCount }: {
  clauses: Clause[]; selectedId: string | null; onSelect: (id: string) => void; depCount: Map<string, number>;
}) {
  const [q, setQ] = useState('');
  const [cov, setCov] = useState<CovFilter>('all');
  const [linkedOnly, setLinkedOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const query = q.trim().toLowerCase();
  const matches = useMemo(() => {
    const m = new Set<string>();
    for (const c of clauses) {
      if (cov !== 'all' && c.coverage !== cov) continue;
      if (linkedOnly && !depCount.get(c.id)) continue;
      if (query && !`${c.number} ${c.title} ${c.plainSummary}`.toLowerCase().includes(query)) continue;
      m.add(c.id);
    }
    return m;
  }, [clauses, cov, linkedOnly, query, depCount]);
  const filtering = !!query || cov !== 'all' || linkedOnly;

  const childrenOf = useMemo(() => {
    const map = new Map<string | null, Clause[]>();
    for (const c of clauses) {
      const k = c.parentId && clauses.some((x) => x.id === c.parentId) ? c.parentId : `root:${c.frameworkId}`;
      map.set(k, [...(map.get(k) ?? []), c]);
    }
    return map;
  }, [clauses]);

  const visible = (c: Clause, depth = 0): boolean => matches.has(c.id) || (depth < 12 && (childrenOf.get(c.id) ?? []).some((x) => visible(x, depth + 1)));

  const renderNode = (c: Clause, depth: number) => {
    if (filtering && !visible(c)) return null;
    const kids = childrenOf.get(c.id) ?? [];
    const open = filtering || !collapsed[c.id];
    const n = depCount.get(c.id) ?? 0;
    return (
      <li key={c.id} role="treeitem" aria-expanded={kids.length ? open : undefined} aria-selected={selectedId === c.id}>
        <div className={cn('group flex items-center gap-1 rounded-[4px] pr-2 transition-colors', selectedId === c.id ? 'bg-accent shadow-[inset_3px_0_0_hsl(var(--saffron))]' : 'hover:bg-accent/40', filtering && !matches.has(c.id) && 'opacity-55')} style={{ paddingLeft: 4 + depth * 14 }}>
          {kids.length ? (
            <button type="button" aria-label={open ? 'Collapse' : 'Expand'} onClick={() => setCollapsed((s) => ({ ...s, [c.id]: open }))} className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground">
              <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-90')} />
            </button>
          ) : <span className="w-5 shrink-0" />}
          <button type="button" data-testid={`button-clause-${c.id}`} onClick={() => onSelect(c.id)} className="flex min-w-0 flex-1 items-baseline gap-2 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            <span className="shrink-0 font-mono text-[11px] font-semibold text-primary">{c.number}</span>
            <span className="truncate text-[12.5px]">{c.title}</span>
          </button>
          {c.coverage === 'contents' && <span title="Contents heading only" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(290_30%_45%)]" />}
          {c.origin === 'user' && <span title="User-added" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--saffron))]" />}
          {n > 0 && <span className="shrink-0 rounded-[3px] bg-primary/10 px-1 font-mono text-[10px] text-primary" title={`${n} dependency link(s)`}>{n}</span>}
        </div>
        {kids.length > 0 && open && <ul role="group">{kids.map((k) => renderNode(k, depth + 1))}</ul>}
      </li>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-border p-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input data-testid="input-clause-search" type="search" className="field !pl-8" placeholder="Search number, title or summary" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clauses" />
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'body', 'partial', 'contents', 'none'] as CovFilter[]).map((k) => (
            <button key={k} type="button" data-testid={`filter-coverage-${k}`} onClick={() => setCov(k)} aria-pressed={cov === k}
              className={cn('rounded-[4px] border px-2 py-0.5 text-[11px] font-semibold transition-colors', cov === k ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card text-muted-foreground hover:text-foreground')}>
              {k === 'all' ? 'All' : k === 'body' ? 'Body' : k === 'partial' ? 'Partial' : k === 'contents' ? 'Contents only' : 'User'}
            </button>
          ))}
          <Hint>Body: requirement text present in the supplied PDF. Partial: preview stops mid-clause. Contents only: heading listed, no text. User: added here without a source page.</Hint>
        </div>
        <label className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
          <input data-testid="checkbox-linked-only" type="checkbox" checked={linkedOnly} onChange={(e) => setLinkedOnly(e.target.checked)} className="accent-[hsl(var(--saffron))]" />
          Only clauses with dependency links
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2" data-testid="clause-tree">
        {FRAMEWORKS.map((f) => {
          const roots = childrenOf.get(`root:${f.id}`) ?? [];
          const shown = filtering ? roots.filter((r) => visible(r)) : roots;
          if (filtering && !shown.length) return null;
          const fwOpen = filtering || !collapsed[`fw:${f.id}`];
          return (
            <section key={f.id} className="mb-1.5">
              <button type="button" data-testid={`button-framework-${f.id}`} onClick={() => setCollapsed((s) => ({ ...s, [`fw:${f.id}`]: fwOpen }))} aria-expanded={fwOpen}
                className="flex w-full items-center gap-2 rounded-[4px] px-1.5 py-1.5 text-left hover:bg-muted">
                <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', fwOpen && 'rotate-90')} />
                {f.file ? <FileText className="h-3.5 w-3.5 text-[hsl(var(--saffron))]" /> : <FileX2 className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="flex-1 text-[12.5px] font-semibold text-primary">{f.code}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{roots.length ? clauses.filter((c) => c.frameworkId === f.id).length : '0'}</span>
              </button>
              {fwOpen && (
                shown.length ? <ul role="tree" aria-label={f.code}>{shown.map((r) => renderNode(r, 1))}</ul> : (
                  <div data-testid={`empty-framework-${f.id}`} className="ml-7 mr-2 mt-1 rounded-[4px] border border-dashed border-border px-2.5 py-2 text-[11.5px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Source document required.</span> No clauses are listed until a licensed source is supplied.
                  </div>
                )
              )}
            </section>
          );
        })}
        {filtering && matches.size === 0 && (
          <div data-testid="empty-search" className="m-3 rounded-md border border-dashed border-border p-4 text-center text-[12px] text-muted-foreground">
            No clauses match these filters.
            <button type="button" className="ml-1 font-semibold text-primary underline-offset-2 hover:underline" onClick={() => { setQ(''); setCov('all'); setLinkedOnly(false); }}>Clear filters</button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 border-t border-border px-3 py-2 text-[10.5px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(290_30%_45%)]" />contents only</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--saffron))]" />user-added</span>
        <span className="flex items-center gap-1"><span className="rounded-[3px] bg-primary/10 px-1 font-mono text-primary">n</span>links</span>
      </div>
    </div>
  );
}
