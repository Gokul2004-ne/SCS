import { ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { frameworkById } from '@/lib/knowledge/sources';
import type { Clause, Dependency } from '@/lib/knowledge/types';
import { DEP_STYLE, DepPill } from './bits';

export function RelationshipList({ deps, clauses, selectedId, onSelect, canEdit, onEdit, onDelete }: {
  deps: Dependency[]; clauses: Clause[]; selectedId: string | null; onSelect: (id: string) => void;
  canEdit: boolean; onEdit: (d: Dependency) => void; onDelete: (d: Dependency) => void;
}) {
  const byId = new Map(clauses.map((c) => [c.id, c]));
  const name = (id: string) => { const c = byId.get(id); return c ? `${c.number} ${c.title}` : id; };
  const fw = (id: string) => frameworkById(byId.get(id)?.frameworkId ?? '')?.code ?? '';
  const sorted = [...deps].sort((a, b) => {
    const as = selectedId && (a.sourceId === selectedId || a.targetId === selectedId) ? 0 : 1;
    const bs = selectedId && (b.sourceId === selectedId || b.targetId === selectedId) ? 0 : 1;
    return as - bs || b.createdAt.localeCompare(a.createdAt);
  });
  if (!deps.length) {
    return <div data-testid="empty-relationships" className="p-5 text-center text-[12px] text-muted-foreground">No relationships yet. The list mirrors the graph for keyboard and screen-reader use.</div>;
  }
  return (
    <ul className="divide-y divide-border" aria-label="Relationship list" data-testid="relationship-list">
      {sorted.map((d) => {
        const active = !!selectedId && (d.sourceId === selectedId || d.targetId === selectedId);
        return (
          <li key={d.id} data-testid={`row-dependency-${d.id}`} className={cn('px-3 py-2.5', active && 'bg-accent/45')}>
            <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
              <button type="button" className="max-w-[40%] truncate rounded font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onSelect(d.sourceId)} title={fw(d.sourceId)}>{name(d.sourceId)}</button>
              <ArrowRight className="h-3 w-3 shrink-0" style={{ color: DEP_STYLE[d.type].color }} aria-hidden />
              <DepPill type={d.type} />
              <ArrowRight className="h-3 w-3 shrink-0" style={{ color: DEP_STYLE[d.type].color }} aria-hidden />
              <button type="button" className="max-w-[40%] truncate rounded font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onSelect(d.targetId)} title={fw(d.targetId)}>{name(d.targetId)}</button>
            </div>
            <span className="sr-only">{name(d.sourceId)} {DEP_STYLE[d.type].verb} {name(d.targetId)}.</span>
            <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{d.rationale}</p>
            <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              <span>{d.createdBy} (simulated) &middot; {new Date(d.createdAt).toLocaleString()}</span>
              {d.illustrative && <span className="text-[hsl(28_80%_30%)]">illustrative, unverified</span>}
              {canEdit && (
                <span className="ml-auto flex gap-1">
                  <button type="button" data-testid={`button-edit-dependency-${d.id}`} onClick={() => onEdit(d)} aria-label="Edit relationship" className="rounded p-1 hover:bg-muted hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                  <button type="button" data-testid={`button-delete-dependency-${d.id}`} onClick={() => onDelete(d)} aria-label="Delete relationship" className="rounded p-1 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
