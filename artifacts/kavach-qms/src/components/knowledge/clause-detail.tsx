import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import { Btn, Pill } from '@/components/kit';
import { frameworkById, KIND_LABEL } from '@/lib/knowledge/sources';
import { cycleThrough, directNeighbours, reachable } from '@/lib/knowledge/graph';
import type { Clause, Dependency } from '@/lib/knowledge/types';
import { CoveragePill, DepPill, Hint } from './bits';

export function ClauseDetail({ clause, clauses, deps, canEdit, onSelect, onEdit, onDelete, onAddDep }: {
  clause: Clause; clauses: Clause[]; deps: Dependency[]; canEdit: boolean;
  onSelect: (id: string) => void; onEdit: () => void; onDelete: () => void; onAddDep: () => void;
}) {
  const fw = frameworkById(clause.frameworkId);
  const byId = new Map(clauses.map((c) => [c.id, c]));
  const parent = clause.parentId ? byId.get(clause.parentId) : undefined;
  const nb = directNeighbours(clause.id, deps);
  const reach = reachable(clause.id, deps);
  const cycle = cycleThrough(clause.id, deps);
  const label = (id: string) => byId.get(id)?.number ?? id;
  const isDefinitional = clause.kind === 'definitions' || clause.kind === 'informative' || clause.kind === 'reference' || clause.kind === 'scope';

  return (
    <div data-testid="panel-clause-detail" className="p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <CoveragePill c={clause.coverage} testId="text-coverage" />
        <Pill t={clause.kind === 'requirement' ? 'indigo' : 'slate'}>{KIND_LABEL[clause.kind]}</Pill>
        {clause.origin === 'user' && <Pill t="amber">User-added</Pill>}
      </div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{fw?.code} &middot; {fw?.edition}</div>
      <h2 className="font-display mt-0.5 text-[22px] leading-tight text-primary"><span data-testid="text-clause-number" className="font-mono text-[18px]">{clause.number}</span> <span data-testid="text-clause-title">{clause.title}</span></h2>
      <div className="mt-1 text-[12px] text-muted-foreground">
        Parent: {parent ? <button type="button" className="font-semibold text-primary hover:underline" onClick={() => onSelect(parent.id)}>{parent.number} {parent.title}</button> : <span>top level</span>}
      </div>

      {isDefinitional && (
        <div className="mt-3 rounded-[5px] border border-border bg-muted/60 px-3 py-2 text-[11.5px] text-muted-foreground">
          This is a {KIND_LABEL[clause.kind].toLowerCase()} entry, not an assessable requirement. Do not raise findings against it directly.
        </div>
      )}

      <div className="mt-3">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Plain-English summary <Hint>An original paraphrase written for this prototype. It is not the standard text and is not a substitute for reading the licensed edition.</Hint></div>
        <p data-testid="text-clause-summary" className="mt-1 text-[13px] leading-relaxed">{clause.plainSummary}</p>
      </div>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-[5px] border border-border bg-background/60 p-3 text-[11.5px]">
        <dt className="text-muted-foreground">Source file</dt>
        <dd data-testid="text-source-file" className="break-all font-mono text-[11px]">{clause.source?.file ?? 'No source linked'}</dd>
        <dt className="text-muted-foreground">Contents entry</dt>
        <dd>{clause.source?.contentsPdfPage ? `PDF page ${clause.source.contentsPdfPage}` : '-'}{clause.source?.printedPage ? ` (printed page ${clause.source.printedPage})` : ''}</dd>
        <dt className="text-muted-foreground">Body text</dt>
        <dd data-testid="text-body-availability">
          {clause.coverage === 'body' && `Available from PDF page ${clause.source?.bodyPdfPage}`}
          {clause.coverage === 'partial' && `Starts on PDF page ${clause.source?.bodyPdfPage}; preview truncated`}
          {clause.coverage === 'contents' && 'Not available - contents heading only'}
          {clause.coverage === 'none' && 'Not available - user entry'}
        </dd>
        <dt className="text-muted-foreground">Recorded by</dt>
        <dd>{clause.createdBy}{clause.origin === 'user' ? ' (simulated role)' : ''}, {new Date(clause.createdAt).toLocaleDateString()}</dd>
      </dl>

      {canEdit && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn data-testid="button-add-dependency-from" variant="primary" onClick={onAddDep}><Plus className="h-3.5 w-3.5" /> Add dependency</Btn>
          <Btn data-testid="button-edit-clause" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /> Edit</Btn>
          <Btn data-testid="button-delete-clause" variant="ghost" onClick={onDelete} className="hover:!text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</Btn>
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Direct neighbours ({nb.length}) <Hint>Outgoing arrows: this clause depends on or points to the other. Incoming arrows: the other clause points here.</Hint>
        </div>
        {nb.length === 0 ? <p className="mt-1 text-[12px] text-muted-foreground">No relationships recorded for this clause.</p> : (
          <ul className="mt-1.5 space-y-1" data-testid="list-neighbours">
            {nb.map((n) => (
              <li key={n.dep.id} className="flex items-center gap-1.5 text-[12px]">
                {n.direction === 'out' ? <ArrowUpRight className="h-3.5 w-3.5 text-primary" aria-label="outgoing" /> : <ArrowDownLeft className="h-3.5 w-3.5 text-[hsl(var(--saffron))]" aria-label="incoming" />}
                <DepPill type={n.dep.type} />
                <span className="text-muted-foreground">{n.direction === 'out' ? 'to' : 'from'}</span>
                <button type="button" onClick={() => onSelect(n.otherId)} className="truncate font-semibold text-primary hover:underline">{frameworkById(byId.get(n.otherId)?.frameworkId ?? '')?.code} {label(n.otherId)} {byId.get(n.otherId)?.title}</button>
              </li>
            ))}
          </ul>
        )}
        {reach.size > nb.filter((n) => n.direction === 'out').length && (
          <p className="mt-2 text-[11.5px] text-muted-foreground">Transitively reaches {reach.size} clause(s) within 6 steps.</p>
        )}
        {cycle && (
          <div data-testid="text-cycle" className="mt-2 flex items-start gap-2 rounded-[5px] border border-[hsl(36_88%_50%/.4)] bg-[hsl(36_88%_50%/.1)] px-3 py-2 text-[11.5px] text-[hsl(28_80%_28%)]">
            <Repeat className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Part of a dependency cycle: <span className="font-mono">{cycle.map(label).join(' -> ')}</span>. Cycles are allowed; traversal is bounded so the view never recurses indefinitely.</span>
          </div>
        )}
      </div>
    </div>
  );
}
