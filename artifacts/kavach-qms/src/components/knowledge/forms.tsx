import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Btn, Field, Modal } from '@/components/kit';
import { FRAMEWORKS, frameworkById } from '@/lib/knowledge/sources';
import { DEP_TYPES, type Clause, type Dependency, type DepType } from '@/lib/knowledge/types';
import type { ClauseDraft, DepDraft } from '@/lib/knowledge/graph';
import type { Result } from '@/lib/knowledge/use-repo';
import { DEP_STYLE } from './bits';

const optLabel = (c: Clause) => `${frameworkById(c.frameworkId)?.code ?? c.frameworkId}  ${c.number}  ${c.title}`;

export function ClauseForm({ open, onClose, clauses, editing, defaultFramework, onSave }: {
  open: boolean; onClose: () => void; clauses: Clause[]; editing: Clause | null; defaultFramework: string;
  onSave: (d: ClauseDraft, editingId?: string) => Result;
}) {
  const empty: ClauseDraft = { frameworkId: defaultFramework, number: '', title: '', parentId: '', plainSummary: '' };
  const [d, setD] = useState<ClauseDraft>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setD(editing ? { frameworkId: editing.frameworkId, number: editing.number, title: editing.title, parentId: editing.parentId ?? '', plainSummary: editing.plainSummary } : { ...empty, frameworkId: defaultFramework });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, defaultFramework]);
  const parents = clauses.filter((c) => c.frameworkId === d.frameworkId && c.id !== editing?.id);
  const submit = () => {
    const r = onSave(d, editing?.id);
    if (r.ok) onClose(); else setErrors(r.errors);
  };
  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit clause ${editing.number}` : 'Add clause'} desc="Stored in this browser only. Write an original plain-English summary; do not paste standard text.">
      <div className="grid gap-3">
        <Field label="Framework" error={errors.frameworkId}>
          <select data-testid="select-clause-framework" className="field" value={d.frameworkId} disabled={!!editing} onChange={(e) => setD({ ...d, frameworkId: e.target.value, parentId: '' })}>
            {FRAMEWORKS.map((f) => <option key={f.id} value={f.id}>{f.code}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-[120px_1fr] gap-3">
          <Field label="Clause no." error={errors.number}><input data-testid="input-clause-number" aria-invalid={!!errors.number} className="field font-mono" value={d.number} onChange={(e) => setD({ ...d, number: e.target.value })} placeholder="e.g. 7.4" /></Field>
          <Field label="Title" error={errors.title}><input data-testid="input-clause-title" aria-invalid={!!errors.title} className="field" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
        </div>
        <Field label="Parent clause (optional)" error={errors.parentId}>
          <select data-testid="select-clause-parent" className="field" value={d.parentId} onChange={(e) => setD({ ...d, parentId: e.target.value })}>
            <option value="">Top level</option>
            {parents.map((c) => <option key={c.id} value={c.id}>{c.number} {c.title}</option>)}
          </select>
        </Field>
        <Field label="Plain-English summary" error={errors.plainSummary}>
          <textarea data-testid="input-clause-summary" aria-invalid={!!errors.plainSummary} rows={3} className="field" value={d.plainSummary} onChange={(e) => setD({ ...d, plainSummary: e.target.value })} placeholder="What an auditor checks, in your own words." />
        </Field>
        {errors.role && <p className="text-[11.5px] text-destructive">{errors.role}</p>}
      </div>
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Cancel</Btn><Btn data-testid="button-save-clause" variant="primary" onClick={submit}>{editing ? 'Save changes' : 'Add clause'}</Btn></div>
    </Modal>
  );
}

export function DependencyForm({ open, onClose, clauses, editing, presetSource, onSave }: {
  open: boolean; onClose: () => void; clauses: Clause[]; editing: Dependency | null; presetSource: string | null;
  onSave: (d: DepDraft, editingId?: string) => Result;
}) {
  const [d, setD] = useState<DepDraft>({ sourceId: '', targetId: '', type: '', rationale: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tq, setTq] = useState('');
  useEffect(() => {
    if (!open) return;
    setErrors({}); setTq('');
    setD(editing ? { sourceId: editing.sourceId, targetId: editing.targetId, type: editing.type, rationale: editing.rationale } : { sourceId: presetSource ?? '', targetId: '', type: '', rationale: '' });
  }, [open, editing, presetSource]);
  const sorted = useMemo(() => [...clauses].sort((a, b) => optLabel(a).localeCompare(optLabel(b), undefined, { numeric: true })), [clauses]);
  const targets = sorted.filter((c) => c.id !== d.sourceId && (!tq.trim() || optLabel(c).toLowerCase().includes(tq.trim().toLowerCase())));
  const src = clauses.find((c) => c.id === d.sourceId);
  const tgt = clauses.find((c) => c.id === d.targetId);
  const submit = () => {
    const r = onSave(d, editing?.id);
    if (r.ok) onClose(); else setErrors(r.errors);
  };
  return (
    <Modal open={open} onClose={onClose} wide title={editing ? 'Edit dependency' : 'Add dependency'} desc="Read as: Source [relationship] Target. Mappings you create are your professional judgement and remain unverified until reviewed against licensed editions.">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="1. Source clause" error={errors.sourceId}>
          <select data-testid="select-dep-source" aria-invalid={!!errors.sourceId} className="field" value={d.sourceId} onChange={(e) => setD({ ...d, sourceId: e.target.value })}>
            <option value="">Choose source</option>
            {sorted.map((c) => <option key={c.id} value={c.id}>{optLabel(c)}</option>)}
          </select>
        </Field>
        <Field label="2. Relationship" error={errors.type}>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Relationship type">
            {DEP_TYPES.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={d.type === t} data-testid={`radio-dep-type-${t.toLowerCase()}`} onClick={() => setD({ ...d, type: t as DepType })} title={DEP_STYLE[t].explain}
                className="flex-1 rounded-[5px] border px-2 py-1.5 text-[12px] font-semibold transition-colors"
                style={d.type === t ? { background: DEP_STYLE[t].color, borderColor: DEP_STYLE[t].color, color: 'hsl(42 50% 96%)' } : { borderColor: 'hsl(var(--input))', color: DEP_STYLE[t].color }}>
                {t}
              </button>
            ))}
          </div>
          {d.type && <span className="mt-1 block text-[11px] text-muted-foreground">{DEP_STYLE[d.type as DepType].explain}</span>}
        </Field>
      </div>
      <Field label="3. Target clause" error={errors.targetId}>
        <input data-testid="input-dep-target-search" className="field mb-1.5" placeholder="Filter targets" value={tq} onChange={(e) => setTq(e.target.value)} />
        <select data-testid="select-dep-target" aria-invalid={!!errors.targetId} className="field" size={6} value={d.targetId} onChange={(e) => setD({ ...d, targetId: e.target.value })}>
          {targets.map((c) => <option key={c.id} value={c.id}>{optLabel(c)}</option>)}
        </select>
      </Field>
      <Field label="4. Rationale" error={errors.rationale}>
        <textarea data-testid="input-dep-rationale" aria-invalid={!!errors.rationale} rows={2} className="field" value={d.rationale} onChange={(e) => setD({ ...d, rationale: e.target.value })} placeholder="Why does this relationship hold? Required." />
      </Field>
      <div data-testid="text-dep-preview" className="flex flex-wrap items-center gap-2 rounded-[5px] border border-dashed border-border bg-background/60 px-3 py-2 text-[12px]">
        <span className="font-semibold text-primary">{src ? `${src.number} ${src.title}` : 'Source'}</span>
        <ArrowRight className="h-3.5 w-3.5" />
        <span className="font-mono text-[11px] font-semibold">{d.type || 'relationship'}</span>
        <ArrowRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-primary">{tgt ? `${tgt.number} ${tgt.title}` : 'Target'}</span>
      </div>
      {errors.role && <p className="text-[11.5px] text-destructive">{errors.role}</p>}
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Cancel</Btn><Btn data-testid="button-save-dependency" variant="primary" onClick={submit}>{editing ? 'Save changes' : 'Create dependency'}</Btn></div>
    </Modal>
  );
}
