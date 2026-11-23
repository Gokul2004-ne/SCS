import { Link } from 'wouter';
import { ArrowRight, Download, FileJson } from 'lucide-react';
import { useStore, closureGates, friction, stageOf, totalIterations, type Stage } from '@/lib/store';
import { exportCsv, exportJson } from '@/lib/export';
import { Btn, PageHead, Panel, Pill, Stat, StagePill, fmt } from '@/components/kit';

const STAGES: Stage[] = ['Phase 1', 'In rebuttal', 'RCA', 'RCA review', 'RCA revision', 'Verification', 'Closure gate', 'Closed', 'Withdrawn'];

export default function Overview() {
  const { state, role } = useStore();
  const { findings, audits, settings } = state;
  const auditOf = (id: string) => audits.find((a) => a.id === id);
  const avg = (n: number) => (findings.length ? (n / findings.length).toFixed(1) : '0.0');
  const p1 = findings.reduce((s, f) => s + f.p1Iterations, 0);
  const p2 = findings.reduce((s, f) => s + f.rca.p2Iterations, 0);
  const high = findings.filter((f) => friction(f, settings) === 'High').length;
  const mod = findings.filter((f) => friction(f, settings) === 'Moderate').length;
  const closed = findings.filter((f) => f.closedAt).length;

  type Item = { id: string; text: string; href: string };
  const queue: Item[] = [];
  findings.forEach((f) => {
    if (f.closedAt || f.p1Status === 'Withdrawn') return;
    const last = f.p1History[f.p1History.length - 1];
    if (role === 'Auditee') {
      if (f.p1Status === 'Issued' || (f.p1Status === 'In Rebuttal' && last?.role === 'Auditor')) queue.push({ id: f.id, text: 'Accept or challenge finding', href: `/findings/${f.id}` });
      if (f.p1Status === 'Accepted' && (f.rca.status === 'Draft' || f.rca.status === 'Rejected')) queue.push({ id: f.id, text: f.rca.status === 'Rejected' ? 'Revise rejected 8D' : 'Complete and submit 8D', href: `/corrective-actions/${f.id}` });
    } else {
      if (f.p1Status === 'In Rebuttal' && last?.role === 'Auditee') queue.push({ id: f.id, text: 'Respond to auditee challenge', href: `/findings/${f.id}` });
      if (f.rca.status === 'Submitted') queue.push({ id: f.id, text: 'Disposition submitted 8D', href: `/corrective-actions/${f.id}` });
      if ((f.rca.status === 'Accepted' || f.rca.status === 'Not Applicable') && !f.effectiveness.verified) queue.push({ id: f.id, text: 'Verify effectiveness', href: `/findings/${f.id}` });
      if (closureGates(f, auditOf(f.auditId)).every((g) => g.ok)) queue.push({ id: f.id, text: 'All gates met: close explicitly', href: `/findings/${f.id}` });
    }
  });
  audits.forEach((a) => {
    if (role === 'Auditor' && (a.status === 'Planned' || a.geoTracking?.status === 'Not Initialized')) {
      queue.push({ id: a.id, text: 'Initialize on-site GPS & photo tracking to unlock fieldwork', href: '/audits' });
    }
    const keys = role === 'Auditor' ? (['impAuditor', 'confAuditor'] as const) : (['impAuditee', 'confAuditee'] as const);
    const miss = keys.filter((k) => !a.signoffs[k]).length;
    if (miss && a.status !== 'Planned') queue.push({ id: a.id, text: `${miss} ${role.toLowerCase()} declaration(s) unsigned`, href: '/governance' });
  });

  return (
    <div>
      <PageHead code={`${settings.orgName} / ${settings.programme}`} title="Assurance overview" sub="Audit programme state, rebuttal friction and closure readiness across units. All records are adapted sample data for demonstration."
        actions={<><Btn data-testid="button-overview-csv" onClick={() => exportCsv(state)}><Download className="h-3.5 w-3.5" /> Findings CSV</Btn><Btn data-testid="button-overview-json" variant="primary" onClick={() => exportJson(state)}><FileJson className="h-3.5 w-3.5" /> JSON dossier</Btn></>} />

      <Panel className="mb-5">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="Findings" value={findings.length} note={`${audits.length} audits`} />
          <Stat label="Avg phase-1 rounds" value={avg(p1)} note="auditee challenges" />
          <Stat label="Avg 8D rounds" value={avg(p2)} note="RCA submissions" />
          <Stat label="High friction" value={high} note={`total >= ${settings.highThreshold}`} t="red" />
          <Stat label="Moderate" value={mod} note={`total >= ${settings.moderateThreshold}`} t="amber" />
          <Stat label="Closed" value={closed} note="explicit closure only" t="teal" />
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Panel title="Lifecycle position" kicker="Findings by stage">
            <div className="grid grid-cols-3 md:grid-cols-5 xl:grid-cols-9">
              {STAGES.map((s, i) => {
                const n = findings.filter((f) => stageOf(f, auditOf(f.auditId)) === s).length;
                return (
                  <Link key={s} href="/findings" className="group border-b border-r border-border px-3 py-3 transition-colors hover:bg-accent/40" data-testid={`link-stage-${i}`}>
                    <div className="font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, '0')}</div>
                    <div className="font-mono text-[22px] font-semibold text-primary">{n}</div>
                    <div className="text-[11px] leading-tight text-muted-foreground group-hover:text-foreground">{s}</div>
                  </Link>
                );
              })}
            </div>
          </Panel>

          <Panel title="Findings at a glance" right={<Link href="/findings" className="text-[12px] font-semibold text-primary hover:underline">Open register</Link>}>
            <div className="overflow-x-auto">
              <table className="kv-table w-full">
                <thead><tr><th>ID</th><th>Title</th><th>Audit</th><th>P1 / 8D</th><th>Gates</th><th>Stage</th></tr></thead>
                <tbody>
                  {findings.map((f) => {
                    const g = closureGates(f, auditOf(f.auditId));
                    return (
                      <tr key={f.id}>
                        <td><Link href={`/findings/${f.id}`} className="font-mono text-[12px] font-semibold text-primary hover:underline">{f.id}</Link></td>
                        <td className="font-medium">{f.title}</td>
                        <td className="font-mono text-[11.5px]">{f.auditId}</td>
                        <td className="font-mono text-[12px]">{f.p1Iterations} / {f.rca.p2Iterations} <span className="text-muted-foreground">= {totalIterations(f)}</span></td>
                        <td>
                          <div className="flex gap-[3px]">{g.map((x) => <span key={x.id} title={x.label} className={x.ok ? 'h-2.5 w-2.5 rounded-[2px] bg-[hsl(var(--teal))]' : 'h-2.5 w-2.5 rounded-[2px] border border-[hsl(var(--vermilion)/.5)]'} />)}</div>
                        </td>
                        <td><StagePill s={stageOf(f, auditOf(f.auditId))} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Workflow" kicker="How a finding moves" right={<Link href="/architecture" className="text-[12px] font-semibold text-primary hover:underline">Full guide</Link>}>
            <ol className="grid gap-px bg-border md:grid-cols-4">
              {[
                ['Issue', 'Auditor raises objective finding with clause and evidence.'],
                ['Rebut', 'Auditee accepts or challenges; auditor maintains, reclassifies or withdraws with reason.'],
                ['8D RCA', 'Unlocked on acceptance. Auditee submits D1-D8; auditor accepts, rejects or marks NA.'],
                ['Close', 'Effectiveness verified and four declarations signed, then explicit closure.'],
              ].map(([t, b], i) => (
                <li key={t} className="bg-card p-4">
                  <div className="font-mono text-[11px] text-[hsl(var(--saffron))]">STEP {i + 1}</div>
                  <div className="font-display text-[17px] text-primary">{t}</div>
                  <p className="mt-1 text-[12px] text-muted-foreground">{b}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title={`Queue for ${role === 'Auditor' ? 'lead auditor' : 'auditee lead'}`} kicker="Simulated role">
            {queue.length === 0 ? <p className="p-4 text-[12.5px] text-muted-foreground">Nothing waiting on this role.</p> : (
              <ul className="divide-y divide-border">
                {queue.map((q, i) => (
                  <li key={q.id + i}>
                    <Link href={q.href} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40" data-testid={`link-queue-${i}`}>
                      <span className="font-mono text-[11.5px] font-semibold text-primary">{q.id}</span>
                      <span className="flex-1 text-[12.5px]">{q.text}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Event log" kicker="Append-only, hash-chained (simulated)">
            <ul className="divide-y divide-border">
              {[...state.log].reverse().slice(0, 9).map((e) => (
                <li key={e.seq} className="px-4 py-2">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><span className="font-mono">#{e.seq}</span><Pill t={e.role === 'Auditor' ? 'indigo' : 'amber'}>{e.role}</Pill><span className="ml-auto">{fmt(e.at)}</span></div>
                  <div className="text-[12.5px]"><span className="font-mono text-[11.5px] text-primary">{e.ref}</span> {e.action}</div>
                  <div className="font-mono text-[10px] text-muted-foreground/70">{e.prev.slice(0, 8)} &rarr; {e.digest}</div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
