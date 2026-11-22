import { useMemo, useState } from 'react';
import { AlertTriangle, FileJson, Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Btn, Modal, PageHead, Panel } from '@/components/kit';
import { useToast } from '@/hooks/use-toast';
import { useKnowledgeRepo } from '@/lib/knowledge/use-repo';
import { exportRepoJson } from '@/lib/knowledge/storage';
import { descendants } from '@/lib/knowledge/graph';
import { F17025 } from '@/lib/knowledge/sources';
import type { Dependency } from '@/lib/knowledge/types';
import { ClauseTree } from '@/components/knowledge/clause-tree';
import { ClauseDetail } from '@/components/knowledge/clause-detail';
import { DependencyGraph } from '@/components/knowledge/dependency-graph';
import { RelationshipList } from '@/components/knowledge/relationship-list';
import { ClauseForm, DependencyForm } from '@/components/knowledge/forms';
import { AccessRestricted, SourceCoverage, StorageBanner, UploadPanel } from '@/components/knowledge/panels';
import { DEP_STYLE, Hint } from '@/components/knowledge/bits';

export default function KnowledgeRepo() {
  const { role } = useStore();
  if (role !== 'Auditor') {
    return (
      <div>
        <PageHead code="5a / Knowledge repository" title="Clause knowledge repository" sub="Framework clauses, plain-English summaries and directed dependencies." />
        <AccessRestricted />
      </div>
    );
  }
  return <Workspace />;
}

function Workspace() {
  const api = useKnowledgeRepo('Auditor');
  const { repo, loadError, saveError, savedAt } = api;
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(repo.clauses[0]?.id ?? null);
  const [clauseForm, setClauseForm] = useState<{ open: boolean; editing: boolean }>({ open: false, editing: false });
  const [depForm, setDepForm] = useState<{ open: boolean; editing: Dependency | null; preset: string | null }>({ open: false, editing: null, preset: null });
  const [confirmClause, setConfirmClause] = useState(false);
  const [ackDeps, setAckDeps] = useState(false);
  const [confirmDep, setConfirmDep] = useState<Dependency | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const selected = repo.clauses.find((c) => c.id === selectedId) ?? null;
  const depCount = useMemo(() => {
    const m = new Map<string, number>();
    repo.dependencies.forEach((d) => { m.set(d.sourceId, (m.get(d.sourceId) ?? 0) + 1); m.set(d.targetId, (m.get(d.targetId) ?? 0) + 1); });
    return m;
  }, [repo.dependencies]);
  const affected = selected ? repo.dependencies.filter((d) => d.sourceId === selected.id || d.targetId === selected.id) : [];
  const kids = selected ? descendants(selected.id, repo.clauses) : [];
  const byId = new Map(repo.clauses.map((c) => [c.id, c]));
  const nm = (id: string) => { const c = byId.get(id); return c ? `${c.number} ${c.title}` : id; };

  if (loadError) {
    return (
      <div>
        <PageHead code="5a / Knowledge repository" title="Clause knowledge repository" sub="Framework clauses, plain-English summaries and directed dependencies." />
        <div data-testid="state-load-error" role="alert" className="mx-auto max-w-xl rounded-md border border-destructive/40 bg-card p-6">
          <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /><h2 className="text-[15px] font-semibold">Stored repository could not be loaded</h2></div>
          <p className="mt-2 text-[12.5px] text-muted-foreground">{loadError}</p>
          <p className="mt-2 text-[12px] text-muted-foreground">Nothing has been overwritten. Editing is paused so the stored value is preserved until you decide. Resetting discards browser-local mappings and restores the extracted source catalogue.</p>
          <div className="mt-4 flex gap-2">
            <Btn data-testid="button-retry-load" onClick={() => window.location.reload()}>Retry</Btn>
            <Btn data-testid="button-reset-repo" variant="danger" onClick={() => setConfirmReset(true)}>Reset to source catalogue</Btn>
          </div>
        </div>
        <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Discard stored repository?" desc="This permanently removes the unreadable browser-local repository value.">
          <div className="flex justify-end gap-2"><Btn onClick={() => setConfirmReset(false)}>Cancel</Btn><Btn data-testid="button-confirm-reset" variant="danger" onClick={() => { api.resetToSeed(); setConfirmReset(false); }}>Discard and reset</Btn></div>
        </Modal>
      </div>
    );
  }

  const doDeleteClause = () => {
    if (!selected) return;
    const r = api.deleteClause(selected.id, ackDeps);
    if (!r.ok) { toast({ title: 'Not deleted', description: Object.values(r.errors)[0] }); return; }
    toast({ title: `Clause ${selected.number} deleted`, description: affected.length ? `${affected.length} dependency link(s) removed with explicit confirmation.` : undefined });
    setConfirmClause(false); setAckDeps(false); setSelectedId(null);
  };

  return (
    <div>
      <PageHead code="5a / Knowledge repository" title="Clause knowledge repository"
        sub="Source-cited clause headings with original plain-English summaries, and the directed dependencies you map between them. Summaries paraphrase; they never replace the licensed text."
        actions={<>
          <Btn data-testid="button-export-repo" onClick={() => exportRepoJson(repo)}><FileJson className="h-3.5 w-3.5" /> Export JSON</Btn>
          <Btn data-testid="button-add-clause" onClick={() => setClauseForm({ open: true, editing: false })}><Plus className="h-3.5 w-3.5" /> Add clause</Btn>
          <Btn data-testid="button-add-dependency" variant="primary" onClick={() => setDepForm({ open: true, editing: null, preset: selectedId })}><Plus className="h-3.5 w-3.5" /> Add dependency</Btn>
        </>} />

      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
        <StorageBanner savedAt={savedAt} saveError={saveError} />
        <div className="flex items-center gap-2 rounded-[5px] border border-border bg-card px-3 py-2 text-[11.5px] text-muted-foreground">
          <span className="font-mono text-primary">{repo.clauses.length}</span> clauses
          <span className="font-mono text-primary">{repo.dependencies.length}</span> links
          <Hint>Edits are attributed to the simulated role shown in the header. Simulated roles are not authentication or authorisation.</Hint>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Panel title="Frameworks and clauses" kicker="Source catalogue" className="flex h-[620px] flex-col overflow-hidden">
          <div className="min-h-0 flex-1"><ClauseTree clauses={repo.clauses} selectedId={selectedId} onSelect={setSelectedId} depCount={depCount} /></div>
        </Panel>

        <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <Panel title="Dependency graph" kicker="Directed &middot; drag, scroll to zoom" className="flex h-[620px] min-w-0 flex-col overflow-hidden"
            right={<div className="hidden items-center gap-3 text-[10.5px] sm:flex">{(['Requires', 'Related', 'Conflicts'] as const).map((t) => (
              <span key={t} className="flex items-center gap-1" style={{ color: DEP_STYLE[t].color }}><span className="inline-block h-0.5 w-4" style={{ background: DEP_STYLE[t].color }} />{t}</span>))}</div>}>
            <div className="min-h-0 flex-1" data-testid="graph-canvas">
              <DependencyGraph clauses={repo.clauses} deps={repo.dependencies} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
          </Panel>
          <Panel title={selected ? 'Clause detail' : 'No clause selected'} kicker="Selection" className="h-[620px] overflow-y-auto">
            {selected ? (
              <ClauseDetail clause={selected} clauses={repo.clauses} deps={repo.dependencies} canEdit
                onSelect={setSelectedId}
                onEdit={() => setClauseForm({ open: true, editing: true })}
                onDelete={() => { setAckDeps(false); setConfirmClause(true); }}
                onAddDep={() => setDepForm({ open: true, editing: null, preset: selected.id })} />
            ) : (
              <div data-testid="empty-selection" className="p-8 text-center text-[12.5px] text-muted-foreground">Pick a clause in the tree or click a node in the graph to see its source citation, summary and neighbours.</div>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px_320px]">
        <Panel title="Relationships" kicker="Keyboard-accessible list of every arrow" className="max-h-[440px] overflow-y-auto">
          <RelationshipList deps={repo.dependencies} clauses={repo.clauses} selectedId={selectedId} onSelect={setSelectedId} canEdit
            onEdit={(d) => setDepForm({ open: true, editing: d, preset: null })} onDelete={setConfirmDep} />
        </Panel>
        <Panel title="Source coverage" kicker="What the supplied PDFs actually contain" className="max-h-[440px] overflow-y-auto">
          <SourceCoverage clauses={repo.clauses} />
        </Panel>
        <Panel title="Add source document" kicker="Awaiting account integration">
          <UploadPanel />
        </Panel>
      </div>

      <ClauseForm open={clauseForm.open} onClose={() => setClauseForm({ open: false, editing: false })} clauses={repo.clauses}
        editing={clauseForm.editing ? selected : null} defaultFramework={selected?.frameworkId ?? F17025}
        onSave={(d, id) => { const r = api.upsertClause(d, id); if (r.ok && r.id) { setSelectedId(r.id); toast({ title: id ? 'Clause updated' : 'Clause added' }); } return r; }} />
      <DependencyForm open={depForm.open} onClose={() => setDepForm({ open: false, editing: null, preset: null })} clauses={repo.clauses}
        editing={depForm.editing} presetSource={depForm.preset}
        onSave={(d, id) => { const r = api.upsertDependency(d, id); if (r.ok) { setSelectedId(d.sourceId); toast({ title: id ? 'Dependency updated' : 'Dependency created' }); } return r; }} />

      <Modal open={confirmClause && !!selected} onClose={() => setConfirmClause(false)} title={`Delete clause ${selected?.number ?? ''}?`} desc="Deletion is browser-local and cannot be undone except by re-adding the clause or re-importing an export.">
        {kids.length > 0 ? (
          <div data-testid="text-delete-blocked" className="rounded-[5px] border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
            This clause has {kids.length} child clause(s). Delete or re-parent them first; child clauses are never removed silently.
          </div>
        ) : affected.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[12.5px]">The following {affected.length} dependency link(s) reference this clause:</p>
            <ul data-testid="list-delete-affected" className="max-h-40 space-y-1 overflow-y-auto rounded-[5px] border border-border p-2 text-[11.5px]">
              {affected.map((d) => <li key={d.id}>{nm(d.sourceId)} <span className="font-semibold">{d.type}</span> {nm(d.targetId)}</li>)}
            </ul>
            <label className="flex items-center gap-2 text-[12px]">
              <input data-testid="checkbox-ack-deps" type="checkbox" checked={ackDeps} onChange={(e) => setAckDeps(e.target.checked)} />
              Also delete these {affected.length} link(s)
            </label>
          </div>
        ) : <p className="text-[12.5px] text-muted-foreground">No dependencies reference this clause.</p>}
        <div className="flex justify-end gap-2">
          <Btn onClick={() => setConfirmClause(false)}>Cancel</Btn>
          <Btn data-testid="button-confirm-delete-clause" variant="danger" disabled={kids.length > 0 || (affected.length > 0 && !ackDeps)} onClick={doDeleteClause}><Trash2 className="h-3.5 w-3.5" /> Delete clause</Btn>
        </div>
      </Modal>

      <Modal open={!!confirmDep} onClose={() => setConfirmDep(null)} title="Delete dependency?" desc={confirmDep ? `${nm(confirmDep.sourceId)} ${confirmDep.type} ${nm(confirmDep.targetId)}` : ''}>
        <div className="flex justify-end gap-2">
          <Btn onClick={() => setConfirmDep(null)}>Cancel</Btn>
          <Btn data-testid="button-confirm-delete-dependency" variant="danger" onClick={() => { if (confirmDep) api.deleteDependency(confirmDep.id); setConfirmDep(null); toast({ title: 'Dependency deleted' }); }}>Delete</Btn>
        </div>
      </Modal>
    </div>
  );
}
