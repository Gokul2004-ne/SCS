import { useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Plus, Search, Download, AlertTriangle } from 'lucide-react';
import { useStore, friction, stageOf, totalIterations, nowIso, type Stage } from '@/lib/store';
import { exportCsv } from '@/lib/export';
import { Btn, ClassPill, Empty, Field, FrictionPill, Modal, PageHead, Panel, StagePill, fmtDate } from '@/components/kit';
import { emptyRca } from '@/lib/seed';
import { useToast } from '@/hooks/use-toast';
import type { Classification } from '@/lib/types';

const STAGES: Stage[] = ['Phase 1', 'In rebuttal', 'RCA', 'RCA review', 'RCA revision', 'Verification', 'Closure gate', 'Closed', 'Withdrawn'];

export default function Findings() {
  const { state, role, mutate } = useStore();
  const { toast } = useToast();
  const [, nav] = useLocation();
  const [q, setQ] = useState('');
  const [fwF, setFwF] = useState('ALL');
  const [clsF, setClsF] = useState('ALL');
  const [stF, setStF] = useState('ALL');
  const [auF, setAuF] = useState('ALL');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ auditId: state.audits[0]?.id ?? '', frameworkId: 'iso17025', clause: '', title: '', classification: 'Minor NC' as Classification, evidence: '' });
  const [tried, setTried] = useState(false);

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return state.findings.filter((f) => {
      const a = state.audits.find((x) => x.id === f.auditId);
      if (fwF !== 'ALL' && f.frameworkId !== fwF) return false;
      if (clsF !== 'ALL' && f.classification !== clsF) return false;
      if (auF !== 'ALL' && f.auditId !== auF) return false;
      if (stF !== 'ALL' && stageOf(f, a) !== stF) return false;
      return !s || [f.id, f.title, f.clause, f.evidence].some((v) => v.toLowerCase().includes(s));
    });
  }, [state, q, fwF, clsF, stF, auF]);

  const errs = {
    clause: !form.clause.trim() ? 'Clause reference required' : '',
    title: form.title.trim().length < 4 ? 'Short title, min 4 characters' : form.title.length > 70 ? 'Keep title under 70 characters' : '',
    evidence: form.evidence.trim().length < 40 ? 'Objective evidence must be at least 40 characters' : '',
  };
  const valid = !errs.clause && !errs.title && !errs.evidence;

  const create = () => {
    setTried(true);
    if (!valid) return;
    const nums = state.findings.map((f) => parseInt(f.id.split('-')[1] ?? '0', 10)).filter((n) => !isNaN(n));
    const id = `${state.settings.findingPrefix}-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`;
    mutate('Finding issued', id, (d) => {
      d.findings.unshift({
        id, auditId: form.auditId, frameworkId: form.frameworkId, clause: form.clause.trim(), title: form.title.trim(), classification: form.classification,
        evidence: form.evidence.trim(), raisedAt: nowIso(), p1Status: 'Issued', p1Iterations: 0,
        p1History: [{ role: 'Auditor', round: 0, text: 'Finding issued.', at: nowIso(), kind: 'issued' }],
        rca: emptyRca(), effectiveness: { verified: false, note: '', at: '' }, closedAt: '', escalation: { active: false, reason: '', at: '' },
      });
    });
    setOpen(false);
    setTried(false);
    setForm({ ...form, clause: '', title: '', evidence: '' });
    toast({ title: `${id} issued`, description: 'Awaiting auditee response.' });
    nav(`/findings/${id}`);
  };

  const applicable = state.frameworks.filter((f) => f.applicable);

  return (
    <div>
      <PageHead
        code="02 / Register"
        title="Findings register"
        sub={`Objective findings with phase-1 rebuttal and 8D counters kept separate. Friction: high at >= ${state.settings.highThreshold}, moderate at >= ${state.settings.moderateThreshold} total iterations.`}
        actions={
          <>
            <Btn data-testid="button-export-csv" onClick={() => exportCsv(state)}><Download className="h-3.5 w-3.5" /> CSV</Btn>
            <Btn data-testid="button-new-finding" variant="primary" disabled={role !== 'Auditor'} title={role !== 'Auditor' ? 'Switch to auditor to issue findings' : ''} onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Issue finding</Btn>
          </>
        }
      />
      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input data-testid="input-search" className="field !pl-8" placeholder="Search ID, title, clause, evidence" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select data-testid="filter-audit" className="field !w-auto" value={auF} onChange={(e) => setAuF(e.target.value)}><option value="ALL">All audits</option>{state.audits.map((a) => <option key={a.id} value={a.id}>{a.id}</option>)}</select>
          <select data-testid="filter-framework" className="field !w-auto" value={fwF} onChange={(e) => setFwF(e.target.value)}><option value="ALL">All frameworks</option>{state.frameworks.map((f) => <option key={f.id} value={f.id}>{f.code}</option>)}</select>
          <select data-testid="filter-class" className="field !w-auto" value={clsF} onChange={(e) => setClsF(e.target.value)}><option value="ALL">All classes</option>{['Major NC', 'Minor NC', 'Observation', 'Not Applicable'].map((c) => <option key={c}>{c}</option>)}</select>
          <select data-testid="filter-stage" className="field !w-auto" value={stF} onChange={(e) => setStF(e.target.value)}><option value="ALL">All stages</option>{STAGES.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        {rows.length === 0 ? (
          <Empty title="No findings match" body="Adjust the filters or search terms." action={<Btn onClick={() => { setQ(''); setFwF('ALL'); setClsF('ALL'); setStF('ALL'); setAuF('ALL'); }}>Clear filters</Btn>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="kv-table w-full">
              <thead><tr><th>ID</th><th>Finding</th><th>Framework / clause</th><th>Class</th><th>P1</th><th>8D</th><th>Friction</th><th>Stage</th><th>Raised</th></tr></thead>
              <tbody>
                {rows.map((f) => {
                  const a = state.audits.find((x) => x.id === f.auditId);
                  const fw = state.frameworks.find((x) => x.id === f.frameworkId);
                  return (
                    <tr key={f.id} className="cursor-pointer" onClick={() => nav(`/findings/${f.id}`)} data-testid={`row-finding-${f.id}`}>
                      <td className="font-mono text-[12px] font-semibold text-primary">{f.id}</td>
                      <td className="max-w-[380px]">
                        <div className="flex items-center gap-1.5 font-medium">{f.escalation.active && <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--vermilion))]" />}<Link href={`/findings/${f.id}`} className="hover:underline">{f.title}</Link></div>
                        <div className="line-clamp-1 text-[11.5px] text-muted-foreground">{f.evidence}</div>
                      </td>
                      <td className="whitespace-nowrap text-[12px]">{fw?.code}<div className="font-mono text-[11px] text-muted-foreground">{f.clause}</div></td>
                      <td><ClassPill c={f.classification} /></td>
                      <td className="font-mono">{f.p1Iterations}</td>
                      <td className="font-mono">{f.rca.p2Iterations}</td>
                      <td><FrictionPill f={friction(f, state.settings)} n={totalIterations(f)} /></td>
                      <td><StagePill s={stageOf(f, a)} /></td>
                      <td className="whitespace-nowrap text-[12px] text-muted-foreground">{fmtDate(f.raisedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">{rows.length} of {state.findings.length} findings / sample clause mappings require licensed standard and edition validation.</div>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title="Issue objective finding" desc="Phase 1. The auditee will accept or challenge. Use a short title; put detail in the evidence statement." wide>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Audit"><select data-testid="select-new-audit" className="field" value={form.auditId} onChange={(e) => setForm({ ...form, auditId: e.target.value })}>{state.audits.map((a) => <option key={a.id} value={a.id}>{a.id} {a.title}</option>)}</select></Field>
          <Field label="Framework"><select data-testid="select-new-framework" className="field" value={form.frameworkId} onChange={(e) => setForm({ ...form, frameworkId: e.target.value })}>{applicable.map((f) => <option key={f.id} value={f.id}>{f.code}</option>)}</select></Field>
          <Field label="Clause" error={tried ? errs.clause : ''}><input data-testid="input-new-clause" className="field" placeholder="e.g. 6.4.5" value={form.clause} onChange={(e) => setForm({ ...form, clause: e.target.value })} /></Field>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <Field label="Short title" error={tried ? errs.title : ''}><input data-testid="input-new-title" className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Classification"><select data-testid="select-new-class" className="field" value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value as Classification })}>{['Major NC', 'Minor NC', 'Observation'].map((c) => <option key={c}>{c}</option>)}</select></Field>
        </div>
        <Field label="Objective evidence" error={tried ? errs.evidence : ''} hint="Requirement, what was observed, records sampled, and the gap.">
          <textarea data-testid="input-new-evidence" rows={5} className="field" value={form.evidence} onChange={(e) => setForm({ ...form, evidence: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2"><Btn onClick={() => setOpen(false)}>Cancel</Btn><Btn data-testid="button-issue-finding" variant="primary" onClick={create}>Issue finding</Btn></div>
      </Modal>
    </div>
  );
}
