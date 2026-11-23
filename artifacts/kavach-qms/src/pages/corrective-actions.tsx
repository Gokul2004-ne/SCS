import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { Lock, Save, Send, Check, X, Ban } from 'lucide-react';
import { useStore, nowIso, totalIterations, friction } from '@/lib/store';
import { Btn, ClassPill, Empty, Field, FrictionPill, GuidanceNote, PageHead, Panel, Pill } from '@/components/kit';
import { Thread } from './finding-detail';
import { useToast } from '@/hooks/use-toast';
import type { Rca } from '@/lib/types';
import { cn } from '@/lib/utils';

const D2KEYS: [keyof Rca['d2'], string][] = [['what', 'What'], ['where', 'Where'], ['when', 'When'], ['who', 'Who'], ['why', 'Why'], ['how', 'How'], ['howMany', 'How many']];

function Step({ n, title, children, sub }: { n: string; title: string; sub: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 border-b border-border px-4 py-4 md:grid-cols-[150px_1fr]">
      <div>
        <div className="font-mono text-[22px] font-semibold leading-none text-[hsl(var(--saffron))]">{n}</div>
        <div className="mt-1 text-[12.5px] font-semibold text-primary">{title}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function CorrectiveActions() {
  const params = useParams<{ id?: string }>();
  const [, nav] = useLocation();
  const { state, role, mutate } = useStore();
  const { toast } = useToast();
  const list = state.findings.filter((f) => f.p1Status !== 'Withdrawn');
  const unlocked = list.filter((f) => f.p1Status === 'Accepted');
  const selId = params.id ?? unlocked.find((f) => !f.closedAt)?.id ?? unlocked[0]?.id;
  const f = state.findings.find((x) => x.id === selId);
  const [draft, setDraft] = useState<Rca | null>(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const initFor = useRef<string | null>(null);

  useEffect(() => {
    if (f && initFor.current !== f.id + f.rca.status + f.rca.p2Iterations) {
      initFor.current = f.id + f.rca.status + f.rca.p2Iterations;
      setDraft(structuredClone(f.rca));
      setErr('');
    }
  }, [f]);

  const locked = !f || f.p1Status !== 'Accepted';
  const editable = !!f && !locked && !f.closedAt && (role === 'Auditor' || f.rca.status !== 'Submitted');
  const set = (patch: Partial<Rca>) => draft && setDraft({ ...draft, ...patch });

  const missing = (r: Rca) => {
    const m: string[] = [];
    if (!r.d1.trim()) m.push('D1 team');
    if (D2KEYS.some(([k]) => !r.d2[k].trim())) m.push('D2 all 5W2H fields');
    if (!r.d3.trim()) m.push('D3 containment');
    if (r.whys.filter((w) => w.trim()).length < 3) m.push('D4 at least three whys');
    if (!r.rootCause.trim() || !r.escapePoint.trim()) m.push('D4 root cause and escape point');
    if (!r.d5.trim()) m.push('D5 permanent correction');
    if (!r.d6.trim()) m.push('D6 validation evidence');
    if (!r.d7.trim()) m.push('D7 systemic prevention');
    if (!r.d8.trim()) m.push('D8 lessons');
    return m;
  };

  const save = (submit: boolean) => {
    if (!f || !draft) return;
    if (submit) {
      const m = missing(draft);
      if (m.length) return setErr(`Incomplete: ${m.join(', ')}.`);
    }
    mutate(submit ? '8D submitted for review' : '8D draft saved', f.id, (d) => {
      const x = d.findings.find((y) => y.id === f.id)!;
      const keep = { p2Iterations: x.rca.p2Iterations, p2History: x.rca.p2History };
      x.rca = { ...draft, ...keep, status: submit ? 'Submitted' : x.rca.status };
      if (submit) {
        x.rca.p2Iterations += 1;
        x.rca.p2History.push({ role: 'Auditee', round: x.rca.p2Iterations, text: note.trim() || `Submitted 8D v${x.rca.p2Iterations}.`, at: nowIso(), kind: 'submit' });
      } else if (note.trim()) {
        x.rca.p2History.push({ role, round: x.rca.p2Iterations, text: note.trim(), at: nowIso(), kind: 'save' });
      }
    });
    setErr('');
    setNote('');
    toast({ title: submit ? '8D submitted to auditor' : role === 'Auditor' ? '8D changes saved' : 'Draft saved', description: f.id });
  };

  const dispose = (kind: 'accept' | 'reject' | 'na') => {
    if (!f) return;
    if (kind !== 'accept' && note.trim().length < 10) return setErr(kind === 'reject' ? 'Rejection reason required (10+ characters).' : 'NA justification required (10+ characters).');
    mutate(kind === 'accept' ? '8D accepted' : kind === 'reject' ? '8D rejected, returned for revision' : '8D marked not applicable', f.id, (d) => {
      const x = d.findings.find((y) => y.id === f.id)!;
      if (draft) {
        const keep = { p2Iterations: x.rca.p2Iterations, p2History: x.rca.p2History };
        x.rca = { ...draft, ...keep, status: x.rca.status };
      }
      x.rca.status = kind === 'accept' ? 'Accepted' : kind === 'reject' ? 'Rejected' : 'Not Applicable';
      if (kind === 'na') x.rca.naReason = note.trim();
      x.rca.p2History.push({ role: 'Auditor', round: x.rca.p2Iterations, text: note.trim() || 'Accepted.', at: nowIso(), kind: kind === 'na' ? 'not applicable' : kind });
    });
    setNote('');
    setErr('');
    toast({ title: kind === 'accept' ? '8D accepted' : kind === 'reject' ? '8D returned to auditee for revision' : '8D marked NA with justification' });
  };

  const guidance: string[] = [];
  if (draft && f && !locked) {
    if (draft.whys.filter((w) => w.trim()).length < 5) guidance.push('Fewer than five whys recorded. Stop only when a controllable systemic cause is reached.');
    if (draft.rootCause && /operator|human error|careless/i.test(draft.rootCause)) guidance.push('Root cause cites individual error. Consider why the system allowed the error (escape point).');
    if (draft.d6 && !/EV-\d+|cert|report|log|record/i.test(draft.d6)) guidance.push('D6 does not reference an evidence record. Link entries from the evidence register.');
    if (draft.d3 && !/quarantin|hold|recall|stop|re-?ran|block/i.test(draft.d3)) guidance.push('D3 may not describe containment of affected product or results.');
    if (!draft.d7) guidance.push('D7 empty: systemic prevention should address similar processes and sites.');
  }

  return (
    <div>
      <PageHead code="03 / 8D" title="Corrective actions" sub="Eight-discipline root cause analysis. Unlocks only after auditee acceptance. Auditee submits; auditor accepts, rejects with reason, or marks NA with reason." />
      <div className="grid gap-5 lg:grid-cols-[290px_1fr]">
        <Panel title="Findings" kicker="Select to open 8D">
          <ul className="max-h-[70dvh] divide-y divide-border overflow-y-auto">
            {list.map((x) => {
              const isLocked = x.p1Status !== 'Accepted';
              return (
                <li key={x.id}>
                  <button
                    data-testid={`button-select-rca-${x.id}`}
                    onClick={() => nav(`/corrective-actions/${x.id}`)}
                    className={cn('w-full px-4 py-2.5 text-left transition-colors hover:bg-accent/40', x.id === selId && 'bg-accent/60 shadow-[inset_3px_0_0_hsl(var(--saffron))]', isLocked && 'opacity-60')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11.5px] font-semibold text-primary">{x.id}</span>
                      {isLocked ? <Pill t="slate"><Lock className="h-2.5 w-2.5" /> Locked</Pill> : <Pill t={x.rca.status === 'Accepted' ? 'teal' : x.rca.status === 'Rejected' ? 'red' : x.rca.status === 'Submitted' ? 'amber' : x.rca.status === 'Not Applicable' ? 'slate' : 'indigo'}>{x.rca.status}</Pill>}
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-[12.5px]">{x.title}</div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        {!f ? (
          <Panel><Empty title="No finding selected" body="Pick a finding from the list." /></Panel>
        ) : locked ? (
          <Panel>
            <Empty title={`${f.id} RCA is locked`} body={`The auditee has not yet accepted this finding (phase-1 status: ${f.p1Status}). Root cause analysis opens after acceptance.`} action={<Link href={`/findings/${f.id}`} className="text-[12.5px] font-semibold text-primary hover:underline">Go to rebuttal workspace</Link>} />
          </Panel>
        ) : draft && (
          <div className="space-y-5">
            <Panel>
              <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                <Link href={`/findings/${f.id}`} className="font-mono text-[13px] font-semibold text-[hsl(var(--saffron))] hover:underline">{f.id}</Link>
                <span className="font-semibold text-primary">{f.title}</span>
                <ClassPill c={f.classification} />
                <span className="ml-auto flex items-center gap-2 text-[11.5px] text-muted-foreground">8D rounds <span className="font-mono text-foreground">{f.rca.p2Iterations}</span> / P1 rounds <span className="font-mono text-foreground">{f.p1Iterations}</span> <FrictionPill f={friction(f, state.settings)} n={totalIterations(f)} /></span>
              </div>
              <div className="border-t border-border bg-muted/40 px-4 py-2 text-[12px]">
                Status <span className="font-semibold">{f.rca.status}</span>
                {f.closedAt
                  ? ' / closed finding (read-only).'
                  : role === 'Auditor'
                  ? ' / you may edit content and record disposition as auditor.'
                  : editable
                  ? ' / you may edit as auditee.'
                  : f.rca.status === 'Submitted'
                  ? ' / awaiting auditor disposition.'
                  : ' / read-only.'}
              </div>
            </Panel>

            <Panel title="Eight disciplines" kicker="D1 - D8">
              <fieldset disabled={!editable} className="disabled:opacity-90">
                <Step n="D1" title="Team" sub="Cross-functional roles">
                  <input data-testid="input-d1" className="field" value={draft.d1} onChange={(e) => set({ d1: e.target.value })} />
                </Step>
                <Step n="D2" title="Problem" sub="5W2H">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {D2KEYS.map(([k, l]) => (
                      <Field key={k} label={l}><input data-testid={`input-d2-${k}`} className="field" value={draft.d2[k]} onChange={(e) => set({ d2: { ...draft.d2, [k]: e.target.value } })} /></Field>
                    ))}
                  </div>
                </Step>
                <Step n="D3" title="Containment" sub="Interim action">
                  <textarea data-testid="input-d3" rows={2} className="field" value={draft.d3} onChange={(e) => set({ d3: e.target.value })} />
                </Step>
                <Step n="D4" title="Root cause" sub="5-whys and escape point">
                  {draft.whys.map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-14 shrink-0 font-mono text-[11px] text-muted-foreground">Why {i + 1}</span>
                      <input data-testid={`input-why-${i}`} className="field" value={w} onChange={(e) => { const ws = [...draft.whys]; ws[i] = e.target.value; set({ whys: ws }); }} />
                    </div>
                  ))}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label="Root cause"><textarea data-testid="input-root" rows={2} className="field" value={draft.rootCause} onChange={(e) => set({ rootCause: e.target.value })} /></Field>
                    <Field label="Escape point"><textarea data-testid="input-escape" rows={2} className="field" value={draft.escapePoint} onChange={(e) => set({ escapePoint: e.target.value })} /></Field>
                  </div>
                </Step>
                <Step n="D5" title="Permanent correction" sub="Corrective action"><textarea data-testid="input-d5" rows={2} className="field" value={draft.d5} onChange={(e) => set({ d5: e.target.value })} /></Step>
                <Step n="D6" title="Validation" sub="Evidence it works"><textarea data-testid="input-d6" rows={2} className="field" value={draft.d6} onChange={(e) => set({ d6: e.target.value })} /></Step>
                <Step n="D7" title="Systemic prevention" sub="SOP, pipeline, sites"><textarea data-testid="input-d7" rows={2} className="field" value={draft.d7} onChange={(e) => set({ d7: e.target.value })} /></Step>
                <Step n="D8" title="Lessons" sub="Closure and recognition"><textarea data-testid="input-d8" rows={2} className="field" value={draft.d8} onChange={(e) => set({ d8: e.target.value })} /></Step>
              </fieldset>
            </Panel>

            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
              <Panel title="8D exchange history" kicker="Separate from phase-1 counter">
                <Thread items={f.rca.p2History} empty="No 8D submissions yet." />
                {!f.closedAt && (
                  <div className="space-y-3 border-t border-border bg-muted/30 p-4">
                    <Field label={role === 'Auditee' ? 'Submission / Draft note (optional)' : 'Auditor note / Disposition reason'} error={err}>
                      <textarea
                        data-testid="input-rca-note"
                        rows={2}
                        className="field"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={role === 'Auditee' ? 'Notes or explanation for this revision...' : 'Auditor reason, notes or guidance...'}
                      />
                    </Field>
                    <div className="flex flex-wrap items-center gap-2">
                      <Btn data-testid="button-save-draft" onClick={() => save(false)}>
                        <Save className="h-3.5 w-3.5" /> {role === 'Auditor' ? 'Save changes' : 'Save draft'}
                      </Btn>
                      {role === 'Auditee' && (
                        <Btn data-testid="button-submit-rca" variant="primary" onClick={() => save(true)}>
                          <Send className="h-3.5 w-3.5" /> Submit 8D (+1 round)
                        </Btn>
                      )}
                      {role === 'Auditor' && (
                        <>
                          <span className="mx-1 h-5 w-px bg-border" />
                          <Btn
                            data-testid="button-accept-rca"
                            variant="primary"
                            disabled={f.rca.status !== 'Submitted'}
                            onClick={() => dispose('accept')}
                          >
                            <Check className="h-3.5 w-3.5" /> Accept 8D
                          </Btn>
                          <Btn
                            data-testid="button-reject-rca"
                            variant="danger"
                            disabled={f.rca.status !== 'Submitted'}
                            onClick={() => dispose('reject')}
                          >
                            <X className="h-3.5 w-3.5" /> Reject to revision
                          </Btn>
                          <Btn data-testid="button-na-rca" onClick={() => dispose('na')}>
                            <Ban className="h-3.5 w-3.5" /> Mark NA
                          </Btn>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Panel>
              <div className="space-y-3">
                <GuidanceNote items={guidance} />
                {f.rca.status === 'Not Applicable' && <div className="rounded-md border border-border bg-card p-3 text-[12.5px]"><div className="font-semibold">NA justification</div>{f.rca.naReason}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
