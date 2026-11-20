import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Plus, GitBranch, Share2, Search, ShieldAlert } from 'lucide-react';
import { useStore, nowIso } from '@/lib/store';
import { digest } from '@/lib/digest';
import { Btn, Empty, Field, Modal, PageHead, Panel, Pill, fmt } from '@/components/kit';
import { useToast } from '@/hooks/use-toast';
import type { Evidence } from '@/lib/types';

const TYPES = ['Test record', 'Certificate', 'Analysis', 'Sampling record', 'Trace matrix', 'Tool report', 'Log', 'Procedure', 'Other'];

export default function EvidencePage() {
  const { state, role, mutate } = useStore();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'new' | 'version' | null>(null);
  const [base, setBase] = useState<Evidence | null>(null);
  const [form, setForm] = useState({ title: '', findingId: '', type: TYPES[0], version: 'v1', uri: '', provenance: '' });
  const [tried, setTried] = useState(false);
  const [reuse, setReuse] = useState<Evidence | null>(null);
  const [reuseTarget, setReuseTarget] = useState('');

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return state.evidence.filter((e) => !s || [e.id, e.title, e.findingId, e.uri, e.type].some((v) => v.toLowerCase().includes(s)));
  }, [state.evidence, q]);

  const errs = {
    title: form.title.trim().length < 4 ? 'Title required' : '',
    findingId: !form.findingId ? 'Link to a finding' : '',
    version: !/^v\d+$/.test(form.version) ? 'Use v1, v2...' : '',
    uri: !/^[a-z][a-z0-9+.-]*:\/\/\S+$/i.test(form.uri.trim()) ? 'Repository reference like dms://path or https://...' : '',
    provenance: form.provenance.trim().length < 10 ? 'Who produced it, from which system (10+ characters)' : '',
  };
  const valid = Object.values(errs).every((e) => !e);

  const openNew = () => { setForm({ title: '', findingId: state.findings[0]?.id ?? '', type: TYPES[0], version: 'v1', uri: '', provenance: '' }); setBase(null); setMode('new'); setTried(false); };
  const openVersion = (e: Evidence) => {
    const n = parseInt(e.version.slice(1), 10) + 1;
    setForm({ title: e.title, findingId: e.findingId, type: e.type, version: `v${n}`, uri: e.uri, provenance: '' });
    setBase(e); setMode('version'); setTried(false);
  };

  const save = () => {
    setTried(true);
    if (!valid) return;
    const id = `EV-${String(state.evidence.length + 1).padStart(4, '0')}`;
    const at = nowIso();
    mutate(mode === 'version' ? `Evidence new version of ${base?.id}` : 'Evidence reference submitted', id, (d) => {
      d.evidence.push({ id, ...form, uri: form.uri.trim(), submittedBy: d.role, at, supersedes: base ? `${base.id} ${base.version}` : '', reusedIn: [], digest: digest(id + form.title + form.version + form.uri + at) });
    });
    toast({ title: `${id} registered`, description: 'Metadata and link only; no file was uploaded.' });
    setMode(null);
  };

  const doReuse = () => {
    if (!reuse || !reuseTarget) return;
    mutate(`Evidence ${reuse.id} ${reuse.version} reused`, reuseTarget, (d) => {
      const e = d.evidence.find((x) => x.id === reuse.id)!;
      if (!e.reusedIn.includes(reuseTarget)) e.reusedIn.push(reuseTarget);
    });
    toast({ title: `${reuse.id} ${reuse.version} linked to ${reuseTarget}`, description: 'Original version, digest and provenance preserved.' });
    setReuse(null); setReuseTarget('');
  };

  const superseded = new Set(state.evidence.map((e) => e.supersedes.split(' ')[0]).filter(Boolean));

  return (
    <div>
      <PageHead code="04 / Evidence" title="Evidence register" sub="Metadata and repository references for objective evidence. Versions are append-only; reuse links the exact version without copying."
        actions={<Btn data-testid="button-new-evidence" variant="primary" onClick={openNew}><Plus className="h-3.5 w-3.5" /> Submit evidence reference</Btn>} />
      <div className="mb-4 flex items-start gap-3 rounded-md border border-[hsl(var(--vermilion)/.35)] bg-[hsl(var(--vermilion)/.05)] px-4 py-3 text-[12.5px]">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--vermilion))]" />
        <p>This prototype stores <span className="font-semibold">references only</span>. No file upload, secure storage, malware scanning or classification marking is implemented. Digests shown are simulated, not cryptographic. Do not enter classified locations or content.</p>
      </div>
      <Panel>
        <div className="border-b border-border p-3">
          <div className="relative max-w-md"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><input data-testid="input-search-evidence" className="field !pl-8" placeholder="Search evidence" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        {rows.length === 0 ? <Empty title="No evidence references" body="Submit a repository reference linked to a finding." /> : (
          <div className="overflow-x-auto">
            <table className="kv-table w-full">
              <thead><tr><th>ID</th><th>Title / reference</th><th>Finding</th><th>Type</th><th>Version</th><th>Digest (sim.)</th><th>Provenance</th><th>Submitted</th><th></th></tr></thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} data-testid={`row-evidence-${e.id}`} className={superseded.has(e.id) ? 'opacity-60' : ''}>
                    <td className="font-mono text-[12px] font-semibold text-primary">{e.id}</td>
                    <td className="max-w-[280px]"><div className="font-medium">{e.title}</div><div className="truncate font-mono text-[11px] text-muted-foreground">{e.uri}</div></td>
                    <td className="text-[12px]"><Link href={`/findings/${e.findingId}`} className="font-mono text-primary hover:underline">{e.findingId}</Link>{e.reusedIn.length > 0 && <div className="text-[11px] text-muted-foreground">reused: {e.reusedIn.join(', ')}</div>}</td>
                    <td className="whitespace-nowrap text-[12px]">{e.type}</td>
                    <td><Pill t="indigo">{e.version}</Pill>{e.supersedes && <div className="mt-1 text-[10.5px] text-muted-foreground">supersedes {e.supersedes}</div>}{superseded.has(e.id) && <div className="mt-1 text-[10.5px] text-muted-foreground">superseded</div>}</td>
                    <td className="font-mono text-[11px]">{e.digest}</td>
                    <td className="max-w-[220px] text-[12px] text-muted-foreground">{e.provenance}</td>
                    <td className="whitespace-nowrap text-[11.5px]">{e.submittedBy}<div className="text-muted-foreground">{fmt(e.at)}</div></td>
                    <td className="whitespace-nowrap">
                      <Btn data-testid={`button-version-${e.id}`} variant="ghost" onClick={() => openVersion(e)} title="New version"><GitBranch className="h-3.5 w-3.5" /></Btn>
                      <Btn data-testid={`button-reuse-${e.id}`} variant="ghost" onClick={() => { setReuse(e); setReuseTarget(''); }} title="Reuse in another finding"><Share2 className="h-3.5 w-3.5" /></Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Submitting as simulated role: {role}. Retention policy: {state.settings.retentionYears} years (configurable in Settings; not enforced in prototype).</div>
      </Panel>

      <Modal open={!!mode} onClose={() => setMode(null)} title={mode === 'version' ? `New version of ${base?.id}` : 'Submit evidence reference'} desc="Metadata and link submission. Prior versions remain unchanged." wide>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Title" error={tried ? errs.title : ''} className="md:col-span-2"><input data-testid="input-ev-title" className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Finding" error={tried ? errs.findingId : ''}><select data-testid="select-ev-finding" className="field" value={form.findingId} disabled={mode === 'version'} onChange={(e) => setForm({ ...form, findingId: e.target.value })}>{state.findings.map((f) => <option key={f.id} value={f.id}>{f.id} {f.title}</option>)}</select></Field>
          <Field label="Type"><select data-testid="select-ev-type" className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Version" error={tried ? errs.version : ''}><input data-testid="input-ev-version" className="field" value={form.version} readOnly={mode === 'version'} onChange={(e) => setForm({ ...form, version: e.target.value })} /></Field>
          <Field label="Repository reference" error={tried ? errs.uri : ''}><input data-testid="input-ev-uri" className="field font-mono" placeholder="dms://unit/records/file.pdf" value={form.uri} onChange={(e) => setForm({ ...form, uri: e.target.value })} /></Field>
          <Field label="Provenance" error={tried ? errs.provenance : ''} className="md:col-span-2"><textarea data-testid="input-ev-provenance" rows={2} className="field" value={form.provenance} onChange={(e) => setForm({ ...form, provenance: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2"><Btn onClick={() => setMode(null)}>Cancel</Btn><Btn data-testid="button-save-evidence" variant="primary" onClick={save}>Register</Btn></div>
      </Modal>
      <Modal open={!!reuse} onClose={() => setReuse(null)} title={`Reuse ${reuse?.id} ${reuse?.version}`} desc="Links this exact version to another finding. Digest and provenance are preserved, not copied.">
        <Field label="Target finding"><select data-testid="select-reuse-target" className="field" value={reuseTarget} onChange={(e) => setReuseTarget(e.target.value)}><option value="">Select</option>{state.findings.filter((f) => f.id !== reuse?.findingId && !reuse?.reusedIn.includes(f.id)).map((f) => <option key={f.id} value={f.id}>{f.id} {f.title}</option>)}</select></Field>
        <div className="flex justify-end gap-2"><Btn onClick={() => setReuse(null)}>Cancel</Btn><Btn data-testid="button-confirm-reuse" variant="primary" disabled={!reuseTarget} onClick={doReuse}>Link version</Btn></div>
      </Modal>
    </div>
  );
}
