import { useRef, useState } from 'react';
import { Download, FileJson, Upload, RotateCcw } from 'lucide-react';
import { useStore } from '@/lib/store';
import { exportCsv, exportJson } from '@/lib/export';
import { Btn, Field, Modal, PageHead, Panel } from '@/components/kit';
import { useToast } from '@/hooks/use-toast';
import type { Settings, State } from '@/lib/types';
import { seedState } from '@/lib/seed';

export default function SettingsPage() {
  const { state, mutate, reset, importState } = useStore();
  const { toast } = useToast();
  const [s, setS] = useState<Settings>(state.settings);
  const [tried, setTried] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const errs: Partial<Record<keyof Settings, string>> = {
    orgName: s.orgName.trim().length < 3 ? 'Required' : '',
    unitName: !s.unitName.trim() ? 'Required' : '',
    programme: !s.programme.trim() ? 'Required' : '',
    highThreshold: s.highThreshold < 2 || s.highThreshold > 20 ? 'Between 2 and 20' : '',
    moderateThreshold: s.moderateThreshold < 1 || s.moderateThreshold >= s.highThreshold ? 'Must be below high threshold' : '',
    retentionYears: s.retentionYears < 1 || s.retentionYears > 99 ? '1 to 99 years' : '',
    findingPrefix: !/^[A-Z]{2,6}$/.test(s.findingPrefix) ? '2-6 uppercase letters' : '',
    impartialityText: s.impartialityText.trim().length < 30 ? 'Min 30 characters' : '',
    confidentialityText: s.confidentialityText.trim().length < 30 ? 'Min 30 characters' : '',
  };
  const valid = Object.values(errs).every((e) => !e);
  const e = (k: keyof Settings) => (tried ? errs[k] : '');

  const save = () => {
    setTried(true);
    if (!valid) return;
    mutate('Settings updated', 'SETTINGS', (d) => { d.settings = { ...s, highThreshold: Number(s.highThreshold), moderateThreshold: Number(s.moderateThreshold), retentionYears: Number(s.retentionYears) }; });
    toast({ title: 'Settings saved', description: 'Stored locally in this browser.' });
  };

  const onImport = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as State & { notice?: string };
      if (parsed.version !== 1 || !Array.isArray(parsed.findings)) throw new Error('bad');
      const { notice: _n, ...rest } = parsed;
      void _n;
      importState(rest as State);
      setS(rest.settings);
      toast({ title: 'Dossier imported' });
    } catch {
      toast({ title: 'Import failed', description: 'Not a Kavach v1 dossier.' });
    }
  };

  const txt = (k: keyof Settings, label: string, hint?: string) => (
    <Field label={label} error={e(k)} hint={hint}><input data-testid={`input-setting-${k}`} className="field" value={String(s[k])} onChange={(ev) => setS({ ...s, [k]: ev.target.value })} /></Field>
  );
  const num = (k: keyof Settings, label: string, hint?: string) => (
    <Field label={label} error={e(k)} hint={hint}><input data-testid={`input-setting-${k}`} type="number" className="field font-mono" value={Number(s[k])} onChange={(ev) => setS({ ...s, [k]: Number(ev.target.value) })} /></Field>
  );

  return (
    <div>
      <PageHead code="08 / Settings" title="Organisation and templates" sub="Tenant identity, friction thresholds, retention and declaration templates. Persisted in localStorage only."
        actions={<Btn data-testid="button-save-settings" variant="primary" onClick={save}>Save settings</Btn>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Organisation" kicker="Tenant / unit / programme">
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {txt('orgName', 'Organisation')}
            {txt('unitName', 'Unit')}
            {txt('programme', 'Programme')}
            {txt('findingPrefix', 'Finding ID prefix')}
            {txt('auditorName', 'Default lead auditor')}
            {txt('auditeeName', 'Default auditee representative')}
          </div>
        </Panel>
        <Panel title="Workflow parameters" kicker="Configurable defaults">
          <div className="grid gap-3 p-4 md:grid-cols-3">
            {num('highThreshold', 'High friction at', 'total P1 + 8D rounds')}
            {num('moderateThreshold', 'Moderate at', 'below high')}
            {num('retentionYears', 'Retention (years)', 'policy label only')}
          </div>
          <p className="border-t border-border px-4 py-3 text-[12px] text-muted-foreground">The source workbench used inconsistent thresholds (3 in one view, implied higher elsewhere). Kavach defaults to high at 4 or more and moderate at 3, and escalation is enabled only at high friction.</p>
        </Panel>
        <Panel title="Declaration templates" kicker="Shown on the governance page" className="lg:col-span-2">
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <Field label="Impartiality text" error={e('impartialityText')}><textarea data-testid="input-setting-imp" rows={4} className="field" value={s.impartialityText} onChange={(ev) => setS({ ...s, impartialityText: ev.target.value })} /></Field>
            <Field label="Confidentiality text" error={e('confidentialityText')}><textarea data-testid="input-setting-conf" rows={4} className="field" value={s.confidentialityText} onChange={(ev) => setS({ ...s, confidentialityText: ev.target.value })} /></Field>
            <Field label="Report footer" className="md:col-span-2"><input data-testid="input-setting-footer" className="field" value={s.reportFooter} onChange={(ev) => setS({ ...s, reportFooter: ev.target.value })} /></Field>
          </div>
        </Panel>
        <Panel title="Data" kicker="Exports are real browser downloads" className="lg:col-span-2">
          <div className="flex flex-wrap gap-2 p-4">
            <Btn data-testid="button-settings-csv" onClick={() => exportCsv(state)}><Download className="h-3.5 w-3.5" /> Export findings CSV</Btn>
            <Btn data-testid="button-settings-json" onClick={() => exportJson(state)}><FileJson className="h-3.5 w-3.5" /> Export JSON dossier</Btn>
            <Btn data-testid="button-import" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5" /> Import dossier</Btn>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(ev) => { const f = ev.target.files?.[0]; if (f) onImport(f); ev.target.value = ''; }} />
            <Btn data-testid="button-reset" variant="danger" className="ml-auto" onClick={() => setResetOpen(true)}><RotateCcw className="h-3.5 w-3.5" /> Reset to sample data</Btn>
          </div>
          <p className="border-t border-border px-4 py-2 text-[11.5px] text-muted-foreground">{state.log.length} events in local log. Local storage is not secure storage; clearing browser data removes all records.</p>
        </Panel>
      </div>
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset workspace?" desc="Replaces all local records with the adapted sample data set.">
        <div className="flex justify-end gap-2"><Btn onClick={() => setResetOpen(false)}>Cancel</Btn><Btn data-testid="button-confirm-reset" variant="danger" onClick={() => { reset(); setS(seedState().settings); setResetOpen(false); toast({ title: 'Workspace reset to sample data' }); }}>Reset</Btn></div>
      </Modal>
    </div>
  );
}
