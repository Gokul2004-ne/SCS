import { useMemo, useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Plus, Search, Download, AlertTriangle, MapPin, Check, X, Lock,
  Paperclip, Mic, Send, FileText, Image as ImageIcon, CheckCircle2,
  AlertCircle, ShieldCheck
} from 'lucide-react';
import { useStore, friction, stageOf, totalIterations, nowIso, type Stage } from '@/lib/store';
import { exportCsv } from '@/lib/export';
import { Btn, ClassPill, Empty, Field, FrictionPill, Modal, PageHead, Panel, StagePill, fmtDate } from '@/components/kit';
import { emptyRca } from '@/lib/seed';
import { useToast } from '@/hooks/use-toast';
import type { Classification } from '@/lib/types';
import { ensureAuditGeoTracking } from '@/lib/geo';
import { getClausesForFramework, type FrameworkClause } from '@/lib/framework-clauses';
import { cn } from '@/lib/utils';

const STAGES: Stage[] = ['Phase 1', 'In rebuttal', 'RCA', 'RCA review', 'RCA revision', 'Verification', 'Closure gate', 'Closed', 'Withdrawn'];

interface AttachedFile {
  name: string;
  size: string;
  type: 'PDF' | 'IMAGE' | 'DOC';
}

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
  const [form, setForm] = useState({
    auditId: state.audits[0]?.id ?? '',
    frameworkId: 'iso17025',
    clause: '',
    title: '',
    classification: 'Minor NC' as Classification,
    evidence: '',
  });
  const [tried, setTried] = useState(false);

  // Clause evaluation state
  const [clauseStatuses, setClauseStatuses] = useState<Record<string, 'compliant' | 'non-compliant'>>({});
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const activeClauses = useMemo(() => getClausesForFramework(form.frameworkId), [form.frameworkId]);

  // Sequential gating: Clause 0 is unlocked. Clause i is unlocked only if all previous clauses (0 to i-1) are marked compliant.
  const isClauseUnlocked = (idx: number): boolean => {
    if (idx === 0) return true;
    for (let i = 0; i < idx; i++) {
      if (clauseStatuses[activeClauses[i].number] !== 'compliant') {
        return false;
      }
    }
    return true;
  };

  const activeNonCompliantClause = activeClauses.find((c) => clauseStatuses[c.number] === 'non-compliant');
  const hasNonCompliant = !!activeNonCompliantClause;

  const effectiveEvidence = form.evidence.trim() + (attachedFiles.length > 0 ? ` [Attached evidence: ${attachedFiles.map((f) => f.name).join(', ')}]` : '');

  const errs = {
    clause: !form.clause.trim() ? 'Please evaluate and flag a non-compliant clause' : '',
    title: form.title.trim().length < 4 ? 'Short title, min 4 characters' : form.title.length > 70 ? 'Keep title under 70 characters' : '',
    evidence: effectiveEvidence.length < 15 ? 'Objective evidence or attached file required (min 15 characters)' : '',
  };
  const valid = !errs.clause && !errs.title && !errs.evidence;

  const selAudit = state.audits.find((a) => a.id === form.auditId);
  const selTracking = selAudit ? ensureAuditGeoTracking(selAudit) : null;
  const clausesLocked = selTracking ? selTracking.status === 'Not Initialized' : false;

  const handleFrameworkChange = (fwId: string) => {
    setForm((prev) => ({ ...prev, frameworkId: fwId, clause: '', title: '' }));
    setClauseStatuses({});
    setAttachedFiles([]);
    if (isRecording && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsRecording(false);
    }
  };

  const handleMarkCompliant = (clause: FrameworkClause) => {
    setClauseStatuses((prev) => {
      const next = { ...prev, [clause.number]: 'compliant' as const };
      return next;
    });
    if (form.clause === clause.number) {
      setForm((prev) => ({ ...prev, clause: '', title: '' }));
    }
    toast({
      title: `Clause ${clause.number} Compliant`,
      description: `Marked compliant. Next clause in sequence unlocked.`,
    });
  };

  const handleMarkNonCompliant = (clause: FrameworkClause) => {
    setClauseStatuses((prev) => ({
      ...prev,
      [clause.number]: 'non-compliant' as const,
    }));
    setForm((prev) => ({
      ...prev,
      clause: clause.number,
      title: `${clause.number} ${clause.title} non-conformance`,
    }));
    toast({
      title: `Clause ${clause.number} Non-Compliant`,
      description: 'Non-conformance recorded. Objective Evidence & Description box is now unlocked.',
      variant: 'destructive',
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles: AttachedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeKb = (file.size / 1024).toFixed(1) + ' KB';
      let fileType: 'PDF' | 'IMAGE' | 'DOC' = 'DOC';
      if (file.type.includes('pdf') || /\.pdf$/i.test(file.name)) fileType = 'PDF';
      else if (file.type.includes('image') || /\.(png|jpe?g|webp|gif)$/i.test(file.name)) fileType = 'IMAGE';
      newFiles.push({ name: file.name, size: sizeKb, type: fileType });
    }
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    toast({
      title: `${newFiles.length} file(s) attached`,
      description: newFiles.map((f) => f.name).join(', '),
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachedFile = (idx: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleSpeechRecognition = () => {
    if (!hasNonCompliant) return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      toast({
        title: 'Speech Recognition Unavailable',
        description: 'Web Speech API is not supported in this browser. Please type directly into the description box.',
      });
      return;
    }
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsRecording(false);
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        toast({ title: 'Microphone Active', description: 'Listening live... speak your objective evidence description.' });
      };

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          setForm((prev) => ({
            ...prev,
            evidence: prev.evidence ? `${prev.evidence.trim()} ${finalTranscript.trim()}` : finalTranscript.trim(),
          }));
        }
      };

      rec.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('Speech recognition exception:', err);
      setIsRecording(false);
    }
  };

  const create = () => {
    setTried(true);
    if (!valid) return;
    if (clausesLocked) {
      toast({
        title: 'Audit fieldwork locked',
        description: `Audit ${form.auditId} requires GPS geo-tracking & photo initialization before clauses can be audited.`,
      });
      return;
    }
    const nums = state.findings.map((f) => parseInt(f.id.split('-')[1] ?? '0', 10)).filter((n) => !isNaN(n));
    const id = `${state.settings.findingPrefix}-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`;
    const finalEvidence = effectiveEvidence;

    mutate('Finding issued', id, (d) => {
      d.findings.unshift({
        id, auditId: form.auditId, frameworkId: form.frameworkId, clause: form.clause.trim(), title: form.title.trim(), classification: form.classification,
        evidence: finalEvidence, raisedAt: nowIso(), p1Status: 'Issued', p1Iterations: 0,
        p1History: [{ role: 'Auditor', round: 0, text: `Finding issued against ${form.clause} (${form.frameworkId}). ${finalEvidence}`, at: nowIso(), kind: 'issued' }],
        rca: emptyRca(), effectiveness: { verified: false, note: '', at: '' }, closedAt: '', escalation: { active: false, reason: '', at: '' },
      });
    });

    if (isRecording && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsRecording(false);
    }
    setOpen(false);
    setTried(false);
    setForm({ ...form, clause: '', title: '', evidence: '' });
    setAttachedFiles([]);
    setClauseStatuses({});
    toast({ title: `${id} issued`, description: 'Finding registered and forwarded to auditee unit.' });
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

      <Modal open={open} onClose={() => setOpen(false)} title="Issue objective finding" desc="Phase 1. The auditee will accept or challenge. Evaluate clauses sequentially to record compliance or issue non-conformance." wide>
        {clausesLocked && (
          <div className="mb-4 flex items-start gap-2.5 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-[12px] text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Audit {form.auditId} Fieldwork Not Initialized</div>
              <div>
                In accordance with Security Control System QMS protocol, clause inspection and findings are locked until the Lead Auditor completes on-site GPS geo-tracking & photograph initialization.
              </div>
              <div className="mt-2">
                <Link href="/audits" className="inline-flex items-center gap-1 font-semibold underline hover:opacity-80">
                  <MapPin className="h-3.5 w-3.5" /> Go to Audit Programme to Initialize GPS Track →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Audit & Framework selection */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Audit">
            <select data-testid="select-new-audit" className="field" value={form.auditId} onChange={(e) => setForm({ ...form, auditId: e.target.value })}>
              {state.audits.map((a) => <option key={a.id} value={a.id}>{a.id} {a.title}</option>)}
            </select>
          </Field>
          <Field label="Framework Standard">
            <select data-testid="select-new-framework" className="field font-medium" value={form.frameworkId} onChange={(e) => handleFrameworkChange(e.target.value)}>
              {applicable.map((f) => <option key={f.id} value={f.id}>{f.code} — {f.name}</option>)}
            </select>
          </Field>
        </div>

        {/* Hidden or read-only input for backward compatibility with test suites */}
        <input type="hidden" data-testid="input-new-clause" value={form.clause} onChange={(e) => setForm({ ...form, clause: e.target.value })} />

        {/* Clause Evaluation & Sequential Gating section */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Framework Clauses &amp; Conformance Evaluation</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Sequential Gating: Mark Compliant to unlock subsequent clauses.
            </div>
          </div>

          <div className="max-h-[290px] overflow-y-auto space-y-2 rounded-lg border border-border bg-muted/20 p-2.5">
            {activeClauses.map((c, idx) => {
              const unlocked = isClauseUnlocked(idx);
              const status = clauseStatuses[c.number];
              const isCompliant = status === 'compliant';
              const isNonCompliant = status === 'non-compliant';

              return (
                <div
                  key={c.number}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border p-3 transition-all',
                    unlocked
                      ? isCompliant
                        ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20'
                        : isNonCompliant
                        ? 'border-red-500/60 bg-red-500/8 dark:bg-red-950/30 ring-1 ring-red-500/30'
                        : 'border-border bg-card shadow-2xs hover:border-primary/40'
                      : 'border-border/40 bg-muted/30 opacity-55'
                  )}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded font-mono text-[11.5px] font-semibold px-2 py-0.5 border',
                        isCompliant
                          ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : isNonCompliant
                          ? 'border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300'
                          : unlocked
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border bg-muted text-muted-foreground'
                      )}>
                        Clause {c.number}
                      </span>
                      <span className="font-medium text-[13px] text-foreground">{c.title}</span>
                      {!unlocked && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-normal">
                          <Lock className="h-3 w-3" /> Locked (requires prior clause compliance)
                        </span>
                      )}
                      {isCompliant && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Compliant
                        </span>
                      )}
                      {isNonCompliant && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-semibold">
                          <AlertCircle className="h-3.5 w-3.5" /> Non-compliant (Flagged)
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11.5px] text-muted-foreground leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  {/* Actions for this clause */}
                  <div className="flex items-center gap-1.5 shrink-0 sm:self-center">
                    {unlocked ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMarkCompliant(c)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium transition-all cursor-pointer border',
                            isCompliant
                              ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs font-semibold'
                              : 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10'
                          )}
                          title="Mark this clause compliant to unlock next clause"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Compliant
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkNonCompliant(c)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium transition-all cursor-pointer border',
                            isNonCompliant
                              ? 'border-red-600 bg-red-600 text-white shadow-2xs font-semibold'
                              : 'border-red-500/40 text-red-700 dark:text-red-300 hover:bg-red-500/10'
                          )}
                          title="Flag non-compliance to unlock Objective Evidence & Description box"
                        >
                          <X className="h-3.5 w-3.5" />
                          Non-compliant
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 rounded border border-border bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                        <Lock className="h-3 w-3" /> Locked
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Short title and Classification (Enabled when non-compliance is flagged) */}
        {hasNonCompliant && (
          <div className="grid gap-3 sm:grid-cols-[1fr_180px] mt-4">
            <Field label="Finding Short Title" error={tried ? errs.title : ''}>
              <input
                data-testid="input-new-title"
                className="field"
                placeholder="e.g. Clause 4.1 Impartiality non-conformance"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Classification">
              <select
                data-testid="select-new-class"
                className="field"
                value={form.classification}
                onChange={(e) => setForm({ ...form, classification: e.target.value as Classification })}
              >
                {['Major NC', 'Minor NC', 'Observation'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        )}

        {/* Objective Evidence & Description - WhatsApp style box */}
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-semibold text-foreground flex items-center gap-2">
              <span>Objective Evidence &amp; Description</span>
              {hasNonCompliant && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 px-2 py-0.5 text-[10.5px] font-medium border border-red-200 dark:border-red-800">
                  Clause {form.clause} Non-compliant
                </span>
              )}
            </label>
            <span className="text-[11px] text-muted-foreground">
              {hasNonCompliant ? 'Attach files (PDF, Image, DOC) and type or dictate via microphone' : 'Unlocks when a clause is Non-compliant'}
            </span>
          </div>

          {/* Attached files preview tags shown ABOVE the box */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-md bg-muted/30 border border-border">
              {attachedFiles.map((f, i) => (
                <div key={i} className="inline-flex items-center gap-1.5 rounded bg-card border border-border px-2.5 py-1 text-[11.5px] shadow-2xs">
                  {f.type === 'PDF' ? (
                    <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  ) : f.type === 'IMAGE' ? (
                    <ImageIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  )}
                  <span className="font-medium max-w-[200px] truncate" title={f.name}>{f.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">({f.size})</span>
                  <button
                    type="button"
                    onClick={() => removeAttachedFile(i)}
                    className="ml-1 text-muted-foreground hover:text-red-500 transition-colors p-0.5 rounded cursor-pointer"
                    title="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* WhatsApp-style Input Container (No emoji symbol!) */}
          <div className={cn(
            "relative flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm transition-all",
            hasNonCompliant
              ? "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
              : "border-border/50 bg-muted/20 opacity-60 cursor-not-allowed"
          )}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={!hasNonCompliant}
            />

            {/* Paperclip button */}
            <button
              type="button"
              onClick={() => hasNonCompliant && fileInputRef.current?.click()}
              disabled={!hasNonCompliant}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                hasNonCompliant
                  ? "text-muted-foreground hover:text-primary hover:bg-muted/60 cursor-pointer"
                  : "text-muted-foreground/40 cursor-not-allowed"
              )}
              title="Attach file (PDF, Image, DOC)"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            {/* Live Text Input (No emoji button, as requested!) */}
            <input
              data-testid="input-new-evidence"
              type="text"
              className={cn(
                "flex-1 bg-transparent border-0 text-[13px] px-2 py-1 focus:outline-none placeholder:text-muted-foreground text-foreground",
                !hasNonCompliant && "cursor-not-allowed"
              )}
              placeholder={
                !hasNonCompliant
                  ? "Objective Evidence & Description box enables when a clause is Non-compliant..."
                  : isRecording
                  ? "🎙️ Listening live... speak your evidence description now..."
                  : "Type objective evidence statement or use microphone..."
              }
              value={form.evidence}
              onChange={(e) => setForm({ ...form, evidence: e.target.value })}
              disabled={!hasNonCompliant}
            />

            {/* Microphone speech-to-text button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              disabled={!hasNonCompliant}
              className={cn(
                "p-1.5 rounded-full transition-all",
                !hasNonCompliant
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : isRecording
                  ? "bg-red-500 text-white animate-pulse shadow-sm cursor-pointer"
                  : "text-muted-foreground hover:text-primary hover:bg-muted/60 cursor-pointer"
              )}
              title={isRecording ? "Click to stop recording" : "Speak via live microphone speech-to-text"}
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
          {tried && errs.evidence && (
            <div className="text-[11.5px] text-red-600 font-medium px-2">{errs.evidence}</div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border mt-5">
          <Btn onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn
            data-testid="button-issue-finding"
            variant={hasNonCompliant ? "primary" : "outline"}
            disabled={clausesLocked || (!hasNonCompliant && tried)}
            title={clausesLocked ? 'Complete on-site GPS initialization first' : ''}
            onClick={create}
            className="gap-1.5 font-medium"
          >
            {hasNonCompliant ? (
              <>
                <Send className="h-3.5 w-3.5" /> Resend &amp; Issue Finding
              </>
            ) : (
              <>Issue finding</>
            )}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
