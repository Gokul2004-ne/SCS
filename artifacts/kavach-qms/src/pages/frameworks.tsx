import { useState } from 'react';
import { Plus, Link2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Btn, Field, Modal, PageHead, Panel, Pill } from '@/components/kit';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Frameworks() {
  const { state, mutate } = useStore();
  const { toast } = useToast();
  const [sel, setSel] = useState(state.frameworks[0]?.id ?? '');
  const [ctl, setCtl] = useState({ clause: '', title: '' });
  const [ctlErr, setCtlErr] = useState('');
  const [fwOpen, setFwOpen] = useState(false);
  const [fwForm, setFwForm] = useState({ code: '', name: '', kind: 'Certification', scheme: '' });
  const [fwTried, setFwTried] = useState(false);
  const [scOpen, setScOpen] = useState(false);
  const [sc, setSc] = useState({ title: '', owner: '', maps: {} as Record<string, string> });
  const [scErr, setScErr] = useState('');

  const f = state.frameworks.find((x) => x.id === sel);
  const findingsFor = (id: string) => state.findings.filter((x) => x.frameworkId === id).length;

  const addControl = () => {
    if (!f) return;
    if (!ctl.clause.trim() || ctl.title.trim().length < 4) return setCtlErr('Clause and title (4+ characters) required');
    mutate('Custom control added', f.id, (d) => {
      const x = d.frameworks.find((y) => y.id === f.id)!;
      x.controls.push({ id: `${f.id}-u${Date.now()}`, clause: ctl.clause.trim(), title: ctl.title.trim(), custom: true });
    });
    setCtl({ clause: '', title: '' }); setCtlErr('');
  };
  const removeControl = (cid: string) => f && mutate('Custom control removed', f.id, (d) => {
    const x = d.frameworks.find((y) => y.id === f.id)!;
    x.controls = x.controls.filter((c) => c.id !== cid);
  });

  const fwErrs = { code: !fwForm.code.trim() ? 'Code required' : '', name: fwForm.name.trim().length < 5 ? 'Name required' : '', scheme: fwForm.scheme.trim().length < 5 ? 'Describe scheme / basis' : '' };
  const addFw = () => {
    setFwTried(true);
    if (Object.values(fwErrs).some(Boolean)) return;
    const id = 'custom-' + fwForm.code.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (state.frameworks.some((x) => x.id === id)) { toast({ title: 'Framework code already exists' }); return; }
    mutate('Additional framework configured', id, (d) => {
      d.frameworks.push({ id, ...fwForm, applicable: true, note: 'Organisation-configured framework.', controls: [], custom: true });
    });
    setSel(id); setFwOpen(false); setFwForm({ code: '', name: '', kind: 'Certification', scheme: '' }); setFwTried(false);
  };

  const addShared = () => {
    const maps = Object.entries(sc.maps).filter(([, c]) => c.trim());
    if (sc.title.trim().length < 5 || !sc.owner.trim() || maps.length < 2) return setScErr('Title, owner and at least two framework mappings required.');
    const id = `SC-${String(state.shared.length + 1).padStart(2, '0')}`;
    mutate('Shared control defined', id, (d) => {
      d.shared.push({ id, title: sc.title.trim(), owner: sc.owner.trim(), mappings: maps.map(([frameworkId, clause]) => ({ frameworkId, clause: clause.trim() })) });
    });
    setScOpen(false); setSc({ title: '', owner: '', maps: {} }); setScErr('');
  };

  return (
    <div>
      <PageHead code="05 / Frameworks" title="Frameworks and shared controls" sub="Applicability per tenant, clause controls and cross-framework mappings. No compliance scores are computed or asserted. Every clause reference needs validation against licensed standard editions."
        actions={<Btn data-testid="button-add-framework" variant="primary" onClick={() => setFwOpen(true)}><Plus className="h-3.5 w-3.5" /> Additional framework</Btn>} />

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {[
          ['Laboratory accreditation', 'ISO/IEC 17025 via NABL. Assessors evaluate technical competence for a defined scope of tests or calibrations. It is accreditation, not certification.'],
          ['Management system certification', 'ISO 9001 and ISO/IEC 42001 are certified by certification bodies, which are themselves assessed against ISO/IEC 17021-1.'],
          ['Conformity body requirements', 'ISO/IEC 17065 (product certification) and 17020 (inspection) govern the bodies that certify or inspect. Apply only if the unit operates such a function.'],
        ].map(([t, b]) => (
          <div key={t} className="rounded-md border border-border bg-card p-3.5">
            <div className="text-[12.5px] font-semibold text-primary">{t}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{b}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Panel title="Catalogue" kicker={`${state.frameworks.filter((x) => x.applicable).length} applicable of ${state.frameworks.length}`}>
          <ul className="divide-y divide-border">
            {state.frameworks.map((x) => (
              <li key={x.id} className={cn('flex items-center gap-3 px-4 py-2.5 transition-colors', sel === x.id ? 'bg-accent/60 shadow-[inset_3px_0_0_hsl(var(--saffron))]' : 'hover:bg-accent/30')}>
                <button className="min-w-0 flex-1 text-left" onClick={() => setSel(x.id)} data-testid={`button-select-fw-${x.id}`}>
                  <div className="text-[13px] font-semibold text-primary">{x.code}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{x.kind}</div>
                </button>
                <Switch data-testid={`switch-applicable-${x.id}`} checked={x.applicable} onCheckedChange={(v) => mutate(`Applicability set to ${v ? 'applicable' : 'not applicable'}`, x.id, (d) => { d.frameworks.find((y) => y.id === x.id)!.applicable = v; })} />
              </li>
            ))}
          </ul>
        </Panel>

        {f && (
          <div className="space-y-5">
            <Panel>
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill t={f.applicable ? 'teal' : 'slate'}>{f.applicable ? 'Applicable' : 'Not applicable'}</Pill>
                  <Pill t="indigo">{f.kind}</Pill>
                  {f.custom && <Pill t="amber">Configured</Pill>}
                  <span className="text-[11.5px] text-muted-foreground">{findingsFor(f.id)} finding(s) mapped</span>
                </div>
                <h2 className="font-display mt-2 text-[24px] text-primary">{f.code}</h2>
                <p className="text-[13px]">{f.name}</p>
                <p className="mt-2 text-[12px] text-muted-foreground"><span className="font-semibold text-foreground">Scheme:</span> {f.scheme}</p>
                <Field label="Applicability note" className="mt-3">
                  <textarea data-testid="input-fw-note" rows={2} className="field" defaultValue={f.note} key={f.id} onBlur={(e) => e.target.value !== f.note && mutate('Applicability note updated', f.id, (d) => { d.frameworks.find((y) => y.id === f.id)!.note = e.target.value; })} />
                </Field>
              </div>
            </Panel>
            <Panel title="Controls" kicker="Sample clause headings; validate against licensed edition">
              <table className="kv-table w-full">
                <thead><tr><th>Clause</th><th>Control</th><th>Source</th><th></th></tr></thead>
                <tbody>
                  {f.controls.map((c) => (
                    <tr key={c.id}><td className="font-mono text-[12px]">{c.clause}</td><td>{c.title}</td><td>{c.custom ? <Pill t="amber">Custom</Pill> : <Pill>Sample</Pill>}</td>
                      <td>{c.custom && <Btn variant="ghost" onClick={() => removeControl(c.id)} data-testid={`button-remove-control-${c.id}`}>Remove</Btn>}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-wrap items-start gap-2 border-t border-border p-3">
                <input data-testid="input-control-clause" className="field !w-28" placeholder="Clause" value={ctl.clause} onChange={(e) => setCtl({ ...ctl, clause: e.target.value })} />
                <input data-testid="input-control-title" className="field min-w-[200px] !w-auto flex-1" placeholder="Control title" value={ctl.title} onChange={(e) => setCtl({ ...ctl, title: e.target.value })} />
                <Btn data-testid="button-add-control" variant="primary" onClick={addControl}><Plus className="h-3.5 w-3.5" /> Add control</Btn>
                {ctlErr && <div className="w-full text-[11px] text-destructive">{ctlErr}</div>}
              </div>
            </Panel>
          </div>
        )}
      </div>

      <Panel className="mt-5" title="Shared controls" kicker="One implementation, many frameworks" right={<Btn data-testid="button-add-shared" onClick={() => setScOpen(true)}><Link2 className="h-3.5 w-3.5" /> Define shared control</Btn>}>
        <div className="overflow-x-auto">
          <table className="kv-table w-full">
            <thead><tr><th>ID</th><th>Control</th><th>Owner</th><th>Mappings</th></tr></thead>
            <tbody>
              {state.shared.map((s) => (
                <tr key={s.id}><td className="font-mono text-[12px] font-semibold text-primary">{s.id}</td><td className="font-medium">{s.title}</td><td className="text-[12px]">{s.owner}</td>
                  <td><div className="flex flex-wrap gap-1">{s.mappings.map((m) => <Pill key={m.frameworkId + m.clause} t="indigo">{state.frameworks.find((x) => x.id === m.frameworkId)?.code} {m.clause}</Pill>)}</div></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal open={fwOpen} onClose={() => setFwOpen(false)} title="Configure additional framework" desc="For example a defence quality standard, contract-specific requirement, or an ISO/IEC 330xx assessment model.">
        <div className="grid gap-3">
          <Field label="Code" error={fwTried ? fwErrs.code : ''}><input data-testid="input-fw-code" className="field" value={fwForm.code} onChange={(e) => setFwForm({ ...fwForm, code: e.target.value })} placeholder="e.g. ISO/IEC 33020" /></Field>
          <Field label="Name" error={fwTried ? fwErrs.name : ''}><input data-testid="input-fw-name" className="field" value={fwForm.name} onChange={(e) => setFwForm({ ...fwForm, name: e.target.value })} /></Field>
          <Field label="Kind"><select data-testid="select-fw-kind" className="field" value={fwForm.kind} onChange={(e) => setFwForm({ ...fwForm, kind: e.target.value })}>{['Certification', 'Accreditation (NABL)', 'Inspection body (NABCB)', 'Process assessment', 'Contractual', 'Internal policy'].map((k) => <option key={k}>{k}</option>)}</select></Field>
          <Field label="Scheme / basis" error={fwTried ? fwErrs.scheme : ''}><input data-testid="input-fw-scheme" className="field" value={fwForm.scheme} onChange={(e) => setFwForm({ ...fwForm, scheme: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2"><Btn onClick={() => setFwOpen(false)}>Cancel</Btn><Btn data-testid="button-save-framework" variant="primary" onClick={addFw}>Add framework</Btn></div>
      </Modal>
      <Modal open={scOpen} onClose={() => setScOpen(false)} title="Define shared control" desc="Map one organisational control to clauses in two or more frameworks." wide>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Control title"><input data-testid="input-sc-title" className="field" value={sc.title} onChange={(e) => setSc({ ...sc, title: e.target.value })} /></Field>
          <Field label="Owner"><input data-testid="input-sc-owner" className="field" value={sc.owner} onChange={(e) => setSc({ ...sc, owner: e.target.value })} /></Field>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {state.frameworks.map((x) => (
            <div key={x.id} className="flex items-center gap-2"><span className="w-36 truncate text-[12px] font-medium">{x.code}</span><input data-testid={`input-sc-map-${x.id}`} className="field" placeholder="clause" value={sc.maps[x.id] ?? ''} onChange={(e) => setSc({ ...sc, maps: { ...sc.maps, [x.id]: e.target.value } })} /></div>
          ))}
        </div>
        {scErr && <div className="text-[11px] text-destructive">{scErr}</div>}
        <div className="flex justify-end gap-2"><Btn onClick={() => setScOpen(false)}>Cancel</Btn><Btn data-testid="button-save-shared" variant="primary" onClick={addShared}>Save</Btn></div>
      </Modal>
    </div>
  );
}
