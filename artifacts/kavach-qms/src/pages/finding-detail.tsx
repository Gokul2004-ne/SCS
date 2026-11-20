import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Check, X, Lock, AlertTriangle, MessageSquare, RotateCcw, ShieldCheck, Pencil, Paperclip } from 'lucide-react';
import { useStore, closureGates, friction, stageOf, totalIterations, nowIso } from '@/lib/store';
import { Btn, ClassPill, Field, FrictionPill, GuidanceNote, Modal, Panel, Pill, StagePill, fmt } from '@/components/kit';
import { useToast } from '@/hooks/use-toast';
import type { Classification, Msg } from '@/lib/types';
import { cn } from '@/lib/utils';
import NotFound from './not-found';

const CLASSES: Classification[] = ['Major NC', 'Minor NC', 'Observation', 'Not Applicable'];

export function Thread({ items, empty }: { items: Msg[]; empty: string }) {
  if (!items.length) return <p className="p-4 text-[12.5px] text-muted-foreground">{empty}</p>;
  return (
    <ol className="relative space-y-3 p-4 before:absolute before:bottom-4 before:left-[27px] before:top-4 before:w-px before:bg-border">
      {items.map((m, i) => (
        <li key={i} className="relative flex gap-3" data-testid={`thread-item-${i}`}>
          <span className={cn('z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9.5px] font-bold', m.role === 'Auditor' ? 'border-primary bg-primary text-primary-foreground' : 'border-[hsl(var(--saffron))] bg-[hsl(var(--saffron))] text-[hsl(228_42%_10%)]')}>
            {m.role === 'Auditor' ? 'AR' : 'AE'}
          </span>
          <div className="min-w-0 flex-1 rounded-[5px] border border-border bg-background/60 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{m.role}</span>
              <Pill t={m.kind === 'reject' || m.kind === 'withdraw' ? 'red' : m.kind === 'accept' || m.kind === 'verify' ? 'teal' : m.kind === 'challenge' || m.kind === 'escalate' ? 'plum' : 'slate'}>{m.kind}</Pill>
              {m.round > 0 && <span className="font-mono">round {m.round}</span>}
              <span className="ml-auto font-mono">{fmt(m.at)}</span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed">{m.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function FindingDetail() {
  const { id } = useParams<{ id: string }>();
  const { state, role, mutate } = useStore();
  const { toast } = useToast();
  const f = state.findings.find((x) => x.id === id);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [newClass, setNewClass] = useState<Classification>('Observation');
  const [effNote, setEffNote] = useState('');
  const [escOpen, setEscOpen] = useState(false);
  const [escReason, setEscReason] = useState('');
  const [closeOpen, setCloseOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState({ title: '', clause: '', evidence: '' });

  if (!f) return <NotFound />;
  const audit = state.audits.find((a) => a.id === f.auditId);
  const fw = state.frameworks.find((x) => x.id === f.frameworkId);
  const gates = closureGates(f, audit);
  const allOk = gates.every((g) => g.ok);
  const stage = stageOf(f, audit);
  const fr = friction(f, state.settings);
  const phase1Open = f.p1Status === 'Issued' || f.p1Status === 'In Rebuttal';
  const evid = state.evidence.filter((e) => e.findingId === f.id || e.reusedIn.includes(f.id));

  const need = (min = 10) => {
    if (text.trim().length < min) {
      setErr(`Enter at least ${min} characters of justification.`);
      return false;
    }
    setErr('');
    return true;
  };
  const done = (title: string) => {
    setText('');
    toast({ title, description: `${f.id} updated and logged.` });
  };

  const challenge = () => {
    if (!need()) return;
    mutate('Auditee challenged finding', f.id, (d) => {
      const x = d.findings.find((y) => y.id === f.id)!;
      x.p1Iterations += 1;
      x.p1Status = 'In Rebuttal';
      x.p1History.push({ role: 'Auditee', round: x.p1Iterations, text: text.trim(), at: nowIso(), kind: 'challenge' });
    });
    done('Challenge recorded (+1 phase-1 round)');
  };
  const accept = () => {
    mutate('Auditee accepted finding', f.id, (d) => {
      const x = d.findings.find((y) => y.id === f.id)!;
      if (x.p1Iterations === 0) x.p1Iterations = 1;
      x.p1Status = 'Accepted';
      if (x.rca.status === 'Locked') x.rca.status = 'Draft';
      x.p1History.push({ role: 'Auditee', round: x.p1Iterations, text: text.trim() || `${x.classification} accepted.`, at: nowIso(), kind: 'accept' });
    });
    done('Finding accepted. RCA unlocked.');
  };
  const maintain = () => {
    if (!need()) return;
    mutate('Auditor maintained finding', f.id, (d) => {
      const x = d.findings.find((y) => y.id === f.id)!;
      x.p1History.push({ role: 'Auditor', round: x.p1Iterations, text: text.trim(), at: nowIso(), kind: 'maintain' });
    });
    done('Response recorded');
  };
  const reclassify = () => {
    if (newClass === f.classification) return setErr('Choose a different classification.');
    if (!need()) return;
    mutate(`Auditor reclassified ${f.classification} to ${newClass}`, f.id, (d) => {
      const x = d.findings.find((y) => y.id === f.id)!;
      x.p1History.push({ role: 'Auditor', round: x.p1Iterations, text: `Reclassified ${x.classification} to ${newClass}. Reason: ${text.trim()}`, at: nowIso(), kind: 'reclassify' });
      x.classification = newClass;
    });
    done('Finding reclassified');
  };
  const withdraw = () => {
    if (!need()) return;
    mutate('Auditor withdrew finding', f.id, (d) => {
      const x = d.findings.find((y) => y.id === f.id)!;
      x.p1Status = 'Withdrawn';
      x.p1History.push({ role: 'Auditor', round: x.p1Iterations, text: `Withdrawn. Reason: ${text.trim()}`, at: nowIso(), kind: 'withdraw' });
    });
    done('Finding withdrawn with reason');
  };
  const verify = () => {
    if (effNote.trim().length < 10) return setErr('Record the objective verification performed (10+ characters).');
    mutate('Effectiveness verified', f.id, (d) => {
      const x = d.findings.find((y) => y.id === f.id)!;
      x.effectiveness = { verified: true, note: effNote.trim(), at: nowIso() };
    });
    setEffNote('');
    setErr('');
    toast({ title: 'Effectiveness verification recorded' });
  };
  const escalate = () => {
    if (escReason.trim().length < 10) return;
    mutate('Finding escalated', f.id, (d) => {
      const x = d.findings.find((y) => y.id === f.id)!;
      x.escalation = { active: true, reason: escReason.trim(), at: nowIso() };
    });
    setEscOpen(false);
    setEscReason('');
    toast({ title: 'Escalated to programme quality board (simulated)' });
  };
  const deEscalate = () =>
    mutate('Escalation resolved', f.id, (d) => {
      const x = d.findings.find((y) => y.id === f.id)!;
      x.escalation = { ...x.escalation, active: false };
    });
  const closeFinding = () => {
    mutate('Finding closed (explicit action)', f.id, (d) => {
      const x = d.findings.find((y) => y.id === f.id)!;
      x.closedAt = nowIso();
    });
    setCloseOpen(false);
    toast({ title: `${f.id} closed`, description: 'All seven gates satisfied.' });
  };
  const saveEdit = () => {
    if (edit.title.trim().length < 4 || edit.evidence.trim().length < 20 || !edit.clause.trim()) return;
    mutate('Finding details edited', f.id, (d) => {
      const x = d.findings.find((y) => y.id === f.id)!;
      x.title = edit.title.trim();
      x.clause = edit.clause.trim();
      x.evidence = edit.evidence.trim();
    });
    setEditOpen(false);
  };

  const guidance: string[] = [];
  if (!/\d/.test(f.evidence)) guidance.push('Evidence statement contains no identifiers (serials, run numbers, dates). Objective findings normally cite traceable references.');
  if (f.evidence.length < 120) guidance.push('Evidence statement is brief; consider stating requirement, observation and gap explicitly.');
  if (evid.length === 0) guidance.push('No evidence register entries are linked to this finding.');
  if (fr === 'High' && !f.escalation.active) guidance.push(`Total iterations ${totalIterations(f)} meet the high-friction threshold (>= ${state.settings.highThreshold}). Consider escalation.`);
  if (f.classification === 'Major NC' && f.p1Status === 'In Rebuttal') guidance.push('Major classification under challenge: confirm grading criteria in the audit plan before reclassifying.');

  return (
    <div>
      <Link href="/findings" className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-primary" data-testid="link-back-findings">
        <ArrowLeft className="h-3.5 w-3.5" /> Findings register
      </Link>
      <div className="rise mb-5 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] font-semibold text-[hsl(var(--saffron))]" data-testid="text-finding-id">{f.id}</span>
            <ClassPill c={f.classification} />
            <StagePill s={stage} />
            <FrictionPill f={fr} n={totalIterations(f)} />
            {f.escalation.active && <Pill t="red"><AlertTriangle className="h-3 w-3" /> Escalated</Pill>}
            <Pill t="slate">Adapted sample</Pill>
          </div>
          <h1 className="font-display mt-2 text-[28px] leading-tight text-primary" data-testid="text-finding-title">{f.title}</h1>
          <div className="mt-1 text-[12.5px] text-muted-foreground">
            {fw?.code} clause <span className="font-mono text-foreground">{f.clause}</span> / {audit?.id} {audit?.title} / raised {fmt(f.raisedAt)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {role === 'Auditor' && phase1Open && (
            <Btn data-testid="button-edit-finding" onClick={() => { setEdit({ title: f.title, clause: f.clause, evidence: f.evidence }); setEditOpen(true); }}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Btn>
          )}
          {f.escalation.active ? (
            <Btn data-testid="button-deescalate" onClick={deEscalate}>Resolve escalation</Btn>
          ) : (
            <Btn data-testid="button-escalate" disabled={fr !== 'High' || !!f.closedAt} title={fr !== 'High' ? `Available at >= ${state.settings.highThreshold} total iterations` : ''} onClick={() => setEscOpen(true)}>
              <AlertTriangle className="h-3.5 w-3.5" /> Escalate
            </Btn>
          )}
          {f.p1Status === 'Accepted' && (
            <Link href={`/corrective-actions/${f.id}`} className="inline-flex items-center gap-1.5 rounded-[5px] border border-primary bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground" data-testid="link-open-rca">
              Open 8D RCA
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Panel title="Objective evidence" kicker="Auditor statement">
            <p className="px-4 py-3 text-[13.5px] leading-relaxed">{f.evidence}</p>
            {evid.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2.5">
                {evid.map((e) => (
                  <Link key={e.id} href="/evidence" className="inline-flex items-center gap-1 rounded-[4px] border border-border bg-muted px-2 py-0.5 font-mono text-[11px] hover:border-primary" data-testid={`link-evidence-${e.id}`}>
                    <Paperclip className="h-3 w-3" /> {e.id} {e.version}
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Phase-1 rebuttal exchange" kicker={`${f.p1Iterations} auditee round(s) / status ${f.p1Status}`}>
            <Thread items={f.p1History} empty="No exchanges yet." />
            {phase1Open ? (
              <div className="space-y-3 border-t border-border bg-muted/30 p-4">
                <Field label={role === 'Auditee' ? 'Auditee argument or counter-evidence' : 'Auditor response or reason'} error={err}>
                  <textarea data-testid="input-rebuttal" rows={3} className="field" value={text} aria-invalid={!!err} onChange={(e) => setText(e.target.value)} placeholder={role === 'Auditee' ? 'Technical justification, clause interpretation, objective evidence references...' : 'Reasoning for maintaining, reclassifying or withdrawing...'} />
                </Field>
                {role === 'Auditee' ? (
                  <div className="flex flex-wrap gap-2">
                    <Btn data-testid="button-challenge" variant="outline" onClick={challenge}><MessageSquare className="h-3.5 w-3.5" /> Submit challenge (+1 round)</Btn>
                    <Btn data-testid="button-accept-finding" variant="primary" onClick={accept}><Check className="h-3.5 w-3.5" /> Accept {f.classification}</Btn>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Btn data-testid="button-maintain" variant="primary" onClick={maintain}>Maintain / respond</Btn>
                    <span className="mx-1 h-5 w-px bg-border" />
                    <select data-testid="select-reclassify" className="field !w-auto !py-1.5" value={newClass} onChange={(e) => setNewClass(e.target.value as Classification)}>
                      {CLASSES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <Btn data-testid="button-reclassify" onClick={reclassify}><RotateCcw className="h-3.5 w-3.5" /> Reclassify</Btn>
                    <Btn data-testid="button-withdraw" variant="danger" onClick={withdraw}><X className="h-3.5 w-3.5" /> Withdraw</Btn>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {role === 'Auditee' ? 'Only the auditee can accept or challenge. Switch role to respond as auditor.' : 'Reclassify and withdraw require a recorded reason. Auditee acceptance is required before RCA unlocks.'}
                </p>
              </div>
            ) : (
              <div className="border-t border-border px-4 py-2.5 text-[12px] text-muted-foreground">Phase 1 concluded: {f.p1Status}.</div>
            )}
          </Panel>

          {f.p1Status === 'Accepted' && (
            <Panel title="8D RCA summary" kicker={`${f.rca.p2Iterations} 8D round(s) / ${f.rca.status}`} right={<Link href={`/corrective-actions/${f.id}`} className="text-[12px] font-semibold text-primary hover:underline">Open workspace</Link>}>
              <div className="grid gap-x-6 gap-y-2 px-4 py-3 text-[12.5px] md:grid-cols-2">
                <div><span className="text-muted-foreground">Root cause:</span> {f.rca.rootCause || '-'}</div>
                <div><span className="text-muted-foreground">Escape point:</span> {f.rca.escapePoint || '-'}</div>
                <div><span className="text-muted-foreground">Permanent correction:</span> {f.rca.d5 || '-'}</div>
                <div><span className="text-muted-foreground">Systemic prevention:</span> {f.rca.d7 || '-'}</div>
                {f.rca.status === 'Not Applicable' && <div className="md:col-span-2"><span className="text-muted-foreground">NA justification:</span> {f.rca.naReason}</div>}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-5">
          <Panel title="Closure gate" kicker="Proposed organisational controls">
            <ul className="divide-y divide-border">
              {gates.map((g) => (
                <li key={g.id} className="flex gap-3 px-4 py-2.5" data-testid={`gate-${g.id}`}>
                  <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border', g.ok ? 'border-[hsl(var(--teal))] bg-[hsl(var(--teal))] text-white' : 'border-dashed border-[hsl(var(--vermilion)/.6)] text-[hsl(var(--vermilion))]')}>
                    {g.ok ? <Check className="h-3 w-3" /> : <Lock className="h-2.5 w-2.5" />}
                  </span>
                  <div>
                    <div className={cn('text-[12.5px] font-medium', !g.ok && 'text-foreground/80')}>{g.label}</div>
                    {!g.ok && <div className="text-[11px] text-muted-foreground">{g.hint}</div>}
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-4">
              {f.closedAt ? (
                <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[hsl(var(--teal))]"><ShieldCheck className="h-4 w-4" /> Closed {fmt(f.closedAt)}</div>
              ) : f.p1Status === 'Withdrawn' ? (
                <div className="text-[12.5px] text-muted-foreground">Withdrawn by auditor; no closure required.</div>
              ) : (
                <>
                  <Btn data-testid="button-close-finding" variant="primary" className="w-full" disabled={!allOk || role !== 'Auditor'} onClick={() => setCloseOpen(true)}>
                    <ShieldCheck className="h-3.5 w-3.5" /> Close finding
                  </Btn>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {!allOk ? `${gates.filter((g) => !g.ok).length} gate(s) outstanding. ` : ''}
                    {role !== 'Auditor' ? 'Closure is an explicit auditor action. ' : ''}No automatic closure.
                  </p>
                  {gates.some((g) => g.id.startsWith('imp') || g.id.startsWith('conf')) && !gates.filter((g) => g.id.startsWith('imp') || g.id.startsWith('conf')).every((g) => g.ok) && (
                    <Link href="/governance" className="mt-2 inline-block text-[12px] font-semibold text-primary hover:underline">Go to declarations</Link>
                  )}
                </>
              )}
            </div>
          </Panel>

          {(f.rca.status === 'Accepted' || f.rca.status === 'Not Applicable') && !f.closedAt && (
            <Panel title="Effectiveness verification" kicker="Auditor">
              {f.effectiveness.verified ? (
                <div className="px-4 py-3 text-[12.5px]"><Pill t="teal">Verified {fmt(f.effectiveness.at)}</Pill><p className="mt-2">{f.effectiveness.note}</p></div>
              ) : role === 'Auditor' ? (
                <div className="space-y-2 p-4">
                  <Field label="Objective verification performed" error={err}>
                    <textarea data-testid="input-effectiveness" rows={3} className="field" value={effNote} onChange={(e) => setEffNote(e.target.value)} placeholder="e.g. Re-sampled 10 records after correction; all compliant." />
                  </Field>
                  <Btn data-testid="button-verify" variant="primary" onClick={verify}>Record verification</Btn>
                </div>
              ) : (
                <p className="px-4 py-3 text-[12.5px] text-muted-foreground">Awaiting auditor verification.</p>
              )}
            </Panel>
          )}
          {f.effectiveness.verified && f.closedAt && (
            <Panel title="Effectiveness verification"><p className="px-4 py-3 text-[12.5px]">{f.effectiveness.note}</p></Panel>
          )}

          {f.escalation.active && (
            <div className="rounded-md border border-[hsl(var(--vermilion)/.4)] bg-[hsl(var(--vermilion)/.06)] p-3 text-[12.5px]">
              <div className="font-semibold text-[hsl(var(--vermilion))]">Escalated {fmt(f.escalation.at)}</div>
              <p className="mt-1">{f.escalation.reason}</p>
            </div>
          )}
          <GuidanceNote items={guidance} />
        </div>
      </div>

      <Modal open={escOpen} onClose={() => setEscOpen(false)} title={`Escalate ${f.id}`} desc={`High friction: ${totalIterations(f)} total iterations (threshold ${state.settings.highThreshold}). Escalation routes to a simulated quality board.`}>
        <Field label="Escalation reason" error={escReason.trim().length > 0 && escReason.trim().length < 10 ? 'At least 10 characters' : undefined}>
          <textarea data-testid="input-escalation" rows={3} className="field" value={escReason} onChange={(e) => setEscReason(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2"><Btn onClick={() => setEscOpen(false)}>Cancel</Btn><Btn data-testid="button-confirm-escalate" variant="danger" disabled={escReason.trim().length < 10} onClick={escalate}>Escalate</Btn></div>
      </Modal>
      <Modal open={closeOpen} onClose={() => setCloseOpen(false)} title={`Close ${f.id}?`} desc="This records an explicit closure in the append-only log. All seven gates are satisfied.">
        <div className="flex justify-end gap-2"><Btn onClick={() => setCloseOpen(false)}>Cancel</Btn><Btn data-testid="button-confirm-close" variant="primary" onClick={closeFinding}>Confirm closure</Btn></div>
      </Modal>
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit ${f.id}`} wide>
        <div className="grid gap-3 md:grid-cols-[1fr_160px]">
          <Field label="Short title" error={edit.title.trim().length < 4 ? 'Min 4 characters' : undefined}><input className="field" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} data-testid="input-edit-title" /></Field>
          <Field label="Clause" error={!edit.clause.trim() ? 'Required' : undefined}><input className="field" value={edit.clause} onChange={(e) => setEdit({ ...edit, clause: e.target.value })} data-testid="input-edit-clause" /></Field>
        </div>
        <Field label="Objective evidence" error={edit.evidence.trim().length < 20 ? 'Min 20 characters' : undefined}><textarea rows={5} className="field" value={edit.evidence} onChange={(e) => setEdit({ ...edit, evidence: e.target.value })} data-testid="input-edit-evidence" /></Field>
        <div className="flex justify-end gap-2"><Btn onClick={() => setEditOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={saveEdit} data-testid="button-save-edit">Save</Btn></div>
      </Modal>
    </div>
  );
}
