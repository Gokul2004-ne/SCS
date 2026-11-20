import { useState } from 'react';
import { Link } from 'wouter';
import { Plus, Pencil, ChevronRight, Trash2 } from 'lucide-react';
import { useStore, stageOf } from '@/lib/store';
import { Btn, Empty, Field, Modal, PageHead, Panel, Pill, fmtDate } from '@/components/kit';
import { useToast } from '@/hooks/use-toast';
import type { Audit, AuditStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const LIFECYCLE: AuditStatus[] = ['Planned', 'Fieldwork', 'Reporting', 'Follow-up', 'Closed'];
const blank = { id: '', title: '', scope: '', unit: '', frameworkIds: [] as string[], start: '', end: '', lead: '', auditeeRep: '', status: 'Planned' as AuditStatus };

export default function Audits() {
  const { state, role, mutate } = useStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(blank);
  const [tried, setTried] = useState(false);
  const [del, setDel] = useState<string | null>(null);

  const errs: Record<string, string> = {
    title: form.title.trim().length < 5 ? 'Title min 5 characters' : '',
    scope: form.scope.trim().length < 15 ? 'Describe scope (15+ characters)' : '',
    unit: !form.unit.trim() ? 'Unit required' : '',
    frameworkIds: form.frameworkIds.length === 0 ? 'Select at least one framework' : '',
    start: !form.start ? 'Start date required' : '',
    end: !form.end ? 'End date required' : form.start && form.end < form.start ? 'End before start' : '',
    lead: !form.lead.trim() ? 'Lead auditor required' : '',
    auditeeRep: !form.auditeeRep.trim() ? 'Auditee representative required' : '',
  };
  const valid = Object.values(errs).every((e) => !e);

  const openNew = () => { setForm({ ...blank, unit: state.settings.unitName, lead: state.settings.auditorName, auditeeRep: state.settings.auditeeName }); setEditing(null); setTried(false); setOpen(true); };
  const openEdit = (a: Audit) => { setForm({ ...a }); setEditing(a.id); setTried(false); setOpen(true); };

  const save = () => {
    setTried(true);
    if (!valid) return;
    if (editing) {
      mutate('Audit updated', editing, (d) => {
        const a = d.audits.find((x) => x.id === editing)!;
        Object.assign(a, { ...form, id: editing, signoffs: a.signoffs });
      });
      toast({ title: `${editing} updated` });
    } else {
      const yr = (form.start || '2026').slice(2, 4);
      const n = state.audits.length + 1;
      const id = `AP-${yr}-${String(n).padStart(2, '0')}`;
      mutate('Audit created', id, (d) => {
        d.audits.push({ ...form, id, signoffs: { impAuditor: null, impAuditee: null, confAuditor: null, confAuditee: null } });
      });
      toast({ title: `${id} added to programme` });
    }
    setOpen(false);
  };

  const advance = (a: Audit, dir: 1 | -1) => {
    const i = LIFECYCLE.indexOf(a.status) + dir;
    if (i < 0 || i >= LIFECYCLE.length) return;
    const next = LIFECYCLE[i];
    if (next === 'Closed') {
      const open = state.findings.filter((f) => f.auditId === a.id && !f.closedAt && f.p1Status !== 'Withdrawn');
      if (open.length) {
        toast({ title: 'Audit cannot close', description: `${open.length} finding(s) remain open: ${open.map((f) => f.id).join(', ')}` });
        return;
      }
    }
    mutate(`Audit status ${a.status} to ${next}`, a.id, (d) => { d.audits.find((x) => x.id === a.id)!.status = next; });
  };

  const remove = () => {
    if (!del) return;
    mutate('Audit deleted', del, (d) => { d.audits = d.audits.filter((a) => a.id !== del); });
    setDel(null);
  };

  return (
    <div>
      <PageHead code="01 / Programme" title="Audit programme" sub="Scheduled audits by unit and framework, with lifecycle from planning to closure. An audit can only close once every finding is closed or withdrawn."
        actions={<Btn data-testid="button-new-audit" variant="primary" disabled={role !== 'Auditor'} title={role !== 'Auditor' ? 'Switch to auditor' : ''} onClick={openNew}><Plus className="h-3.5 w-3.5" /> Plan audit</Btn>} />

      <div className="mb-5 flex overflow-x-auto rounded-md border border-border bg-card">
        {LIFECYCLE.map((s, i) => (
          <div key={s} className="flex min-w-[140px] flex-1 items-center gap-2 border-r border-border px-4 py-2.5 last:border-r-0">
            <span className="font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-[12.5px] font-semibold text-primary">{s}</span>
            <span className="ml-auto font-mono text-[15px] font-semibold">{state.audits.filter((a) => a.status === s).length}</span>
          </div>
        ))}
      </div>

      {state.audits.length === 0 ? <Panel><Empty title="No audits planned" body="Plan the first audit for this unit." action={<Btn onClick={openNew}>Plan audit</Btn>} /></Panel> : (
        <div className="space-y-4">
          {state.audits.map((a) => {
            const fs = state.findings.filter((f) => f.auditId === a.id);
            const signed = Object.values(a.signoffs).filter(Boolean).length;
            const idx = LIFECYCLE.indexOf(a.status);
            return (
              <Panel key={a.id} className="overflow-hidden">
                <div className="grid gap-4 p-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[12.5px] font-semibold text-[hsl(var(--saffron))]" data-testid={`text-audit-${a.id}`}>{a.id}</span>
                      <Pill t={a.status === 'Closed' ? 'teal' : a.status === 'Planned' ? 'slate' : 'indigo'}>{a.status}</Pill>
                      {a.frameworkIds.map((id) => <Pill key={id} t="slate">{state.frameworks.find((f) => f.id === id)?.code ?? id}</Pill>)}
                    </div>
                    <h3 className="font-display mt-1.5 text-[20px] text-primary">{a.title}</h3>
                    <p className="mt-1 max-w-3xl text-[12.5px] text-muted-foreground">{a.scope}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] md:grid-cols-4">
                      <div><dt className="text-muted-foreground">Unit</dt><dd className="font-medium">{a.unit}</dd></div>
                      <div><dt className="text-muted-foreground">Window</dt><dd className="font-mono">{fmtDate(a.start)} - {fmtDate(a.end)}</dd></div>
                      <div><dt className="text-muted-foreground">Lead auditor</dt><dd className="font-medium">{a.lead}</dd></div>
                      <div><dt className="text-muted-foreground">Auditee rep</dt><dd className="font-medium">{a.auditeeRep}</dd></div>
                    </dl>
                  </div>
                  <div className="flex flex-col items-start gap-2 lg:items-end">
                    <div className="flex gap-1.5">
                      <Btn data-testid={`button-edit-audit-${a.id}`} disabled={role !== 'Auditor'} onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /> Edit</Btn>
                      <Btn data-testid={`button-delete-audit-${a.id}`} variant="ghost" disabled={role !== 'Auditor' || fs.length > 0} title={fs.length ? 'Audits with findings cannot be deleted' : ''} onClick={() => setDel(a.id)}><Trash2 className="h-3.5 w-3.5" /></Btn>
                    </div>
                    <div className="flex gap-1.5">
                      <Btn data-testid={`button-regress-${a.id}`} disabled={role !== 'Auditor' || idx === 0} onClick={() => advance(a, -1)}>Back</Btn>
                      <Btn data-testid={`button-advance-${a.id}`} variant="primary" disabled={role !== 'Auditor' || idx === LIFECYCLE.length - 1} onClick={() => advance(a, 1)}>
                        {idx < LIFECYCLE.length - 1 ? `Move to ${LIFECYCLE[idx + 1]}` : 'Closed'} <ChevronRight className="h-3.5 w-3.5" />
                      </Btn>
                    </div>
                  </div>
                </div>
                <div className="flex">
                  {LIFECYCLE.map((s, i) => <div key={s} className={cn('h-1 flex-1 transition-colors', i <= idx ? 'bg-[hsl(var(--saffron))]' : 'bg-muted')} />)}
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border bg-muted/30 px-4 py-2 text-[12px]">
                  <span>Findings <span className="font-mono font-semibold">{fs.length}</span></span>
                  <span>Closed <span className="font-mono font-semibold">{fs.filter((f) => f.closedAt).length}</span></span>
                  <span>Declarations <span className="font-mono font-semibold">{signed}/4</span></span>
                  <span className="flex flex-wrap gap-1.5">{fs.map((f) => <Link key={f.id} href={`/findings/${f.id}`} className="font-mono text-[11px] text-primary hover:underline" title={stageOf(f, a)}>{f.id}</Link>)}</span>
                  <Link href="/governance" className="ml-auto font-semibold text-primary hover:underline">Governance</Link>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing}` : 'Plan audit'} wide>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Title" error={tried ? errs.title : ''} className="md:col-span-2"><input data-testid="input-audit-title" className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Scope" error={tried ? errs.scope : ''} className="md:col-span-2"><textarea data-testid="input-audit-scope" rows={2} className="field" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} /></Field>
          <Field label="Unit" error={tried ? errs.unit : ''}><input data-testid="input-audit-unit" className="field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
          <Field label="Status"><select data-testid="select-audit-status" className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AuditStatus })}>{LIFECYCLE.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Start" error={tried ? errs.start : ''}><input data-testid="input-audit-start" type="date" className="field" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></Field>
          <Field label="End" error={tried ? errs.end : ''}><input data-testid="input-audit-end" type="date" className="field" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></Field>
          <Field label="Lead auditor" error={tried ? errs.lead : ''}><input data-testid="input-audit-lead" className="field" value={form.lead} onChange={(e) => setForm({ ...form, lead: e.target.value })} /></Field>
          <Field label="Auditee representative" error={tried ? errs.auditeeRep : ''}><input data-testid="input-audit-rep" className="field" value={form.auditeeRep} onChange={(e) => setForm({ ...form, auditeeRep: e.target.value })} /></Field>
        </div>
        <Field label="Frameworks in scope" error={tried ? errs.frameworkIds : ''}>
          <div className="flex flex-wrap gap-1.5">
            {state.frameworks.map((f) => {
              const on = form.frameworkIds.includes(f.id);
              return (
                <button type="button" key={f.id} data-testid={`toggle-fw-${f.id}`} onClick={() => setForm({ ...form, frameworkIds: on ? form.frameworkIds.filter((x) => x !== f.id) : [...form.frameworkIds, f.id] })}
                  className={cn('rounded-[4px] border px-2 py-1 text-[11.5px] font-medium transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card hover:border-primary/50')}>
                  {f.code}
                </button>
              );
            })}
          </div>
        </Field>
        <div className="flex justify-end gap-2"><Btn onClick={() => setOpen(false)}>Cancel</Btn><Btn data-testid="button-save-audit" variant="primary" onClick={save}>Save audit</Btn></div>
      </Modal>
      <Modal open={!!del} onClose={() => setDel(null)} title={`Delete ${del}?`} desc="Removes the planned audit. The deletion is recorded in the event log.">
        <div className="flex justify-end gap-2"><Btn onClick={() => setDel(null)}>Cancel</Btn><Btn data-testid="button-confirm-delete-audit" variant="danger" onClick={remove}>Delete</Btn></div>
      </Modal>
    </div>
  );
}
