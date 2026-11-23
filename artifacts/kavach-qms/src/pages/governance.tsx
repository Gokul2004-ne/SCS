import { useState } from 'react';
import { Link } from 'wouter';
import { Check, Lock, PenLine, Undo2, Info } from 'lucide-react';
import { useStore, SIGN_KEYS, closureGates, nowIso, stageOf } from '@/lib/store';
import { digest } from '@/lib/digest';
import { Btn, PageHead, Panel, Pill, StagePill, fmt } from '@/components/kit';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Governance() {
  const { state, role, mutate } = useStore();
  const { toast } = useToast();
  const [auditId, setAuditId] = useState(state.audits[0]?.id ?? '');
  const audit = state.audits.find((a) => a.id === auditId);
  const fs = state.findings.filter((f) => f.auditId === auditId);
  const signedCount = audit ? Object.values(audit.signoffs).filter(Boolean).length : 0;

  const sign = (key: (typeof SIGN_KEYS)[number]['key'], who: string) => {
    if (!audit) return;
    const at = nowIso();
    mutate(`Declaration signed: ${key}`, audit.id, (d) => {
      d.audits.find((a) => a.id === audit.id)!.signoffs[key] = { by: who, at, digest: digest(audit.id + key + who + at) };
    });
    toast({ title: 'Declaration signed (simulated)', description: 'Production would use PKI-backed digital signatures.' });
  };
  const revoke = (key: (typeof SIGN_KEYS)[number]['key']) => {
    if (!audit) return;
    mutate(`Declaration revoked: ${key}`, audit.id, (d) => { d.audits.find((a) => a.id === audit.id)!.signoffs[key] = null; });
  };

  return (
    <div>
      <PageHead code="06 / Governance" title="Declarations and closure gate" sub="Four declarations per audit: impartiality and confidentiality, each signed by auditor and auditee. You can sign only as the currently simulated role." />
      <div className="mb-5 flex items-start gap-3 rounded-md border border-border bg-card px-4 py-3 text-[12.5px]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>These four signatures are <span className="font-semibold">proposed organisational controls</span> derived from the source workbench, informed by impartiality and confidentiality themes in ISO/IEC 17025 clause 4. They are not universal ISO-mandated signatures. Signatures here are simulated with non-cryptographic digests.</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {state.audits.map((a) => {
          const n = Object.values(a.signoffs).filter(Boolean).length;
          return (
            <button key={a.id} data-testid={`button-gov-audit-${a.id}`} onClick={() => setAuditId(a.id)} className={cn('rounded-md border px-3 py-2 text-left transition-all', auditId === a.id ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border bg-card hover:border-primary/40')}>
              <div className="font-mono text-[11.5px] font-semibold">{a.id}</div>
              <div className="text-[11.5px] opacity-80">{n}/4 declarations</div>
            </button>
          );
        })}
      </div>

      {audit && (
        <>
          <div className={cn('rise mb-5 flex items-center gap-3 rounded-md border px-4 py-3', signedCount === 4 ? 'border-[hsl(var(--teal)/.4)] bg-[hsl(var(--teal)/.07)]' : 'border-[hsl(var(--vermilion)/.35)] bg-[hsl(var(--vermilion)/.05)]')} data-testid="status-governance">
            {signedCount === 4 ? <Check className="h-5 w-5 text-[hsl(var(--teal))]" /> : <Lock className="h-5 w-5 text-[hsl(var(--vermilion))]" />}
            <div className="text-[13px]">
              <span className="font-semibold">{signedCount === 4 ? 'Declaration gates satisfied' : `${4 - signedCount} declaration(s) missing`}</span> for {audit.id}. Findings still require acceptance, RCA disposition, effectiveness verification and an explicit closure action.
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {(['Impartiality', 'Confidentiality'] as const).map((kind) => (
              <Panel key={kind} title={`${kind} declaration`} kicker={kind === 'Impartiality' ? 'Proposed control / informed by 17025 4.1' : 'Proposed control / informed by 17025 4.2'}>
                <blockquote className="font-display border-b border-border px-5 py-4 text-[15px] italic leading-relaxed text-foreground/85">
                  "{kind === 'Impartiality' ? state.settings.impartialityText : state.settings.confidentialityText}"
                </blockquote>
                <div className="grid sm:grid-cols-2">
                  {SIGN_KEYS.filter((k) => k.label === kind).map((k) => {
                    const s = audit.signoffs[k.key];
                    const who = k.role === 'Auditor' ? audit.lead : audit.auditeeRep;
                    const mine = role === k.role;
                    return (
                      <div key={k.key} className="border-border p-4 sm:border-r sm:last:border-r-0" data-testid={`sign-${k.key}`}>
                        <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{k.role}</div>
                        <div className="text-[12.5px] font-medium">{who}</div>
                        {s ? (
                          <div className="mt-2 space-y-1">
                            <Pill t="teal"><Check className="h-3 w-3" /> Signed</Pill>
                            <div className="text-[11px] text-muted-foreground">{fmt(s.at)}</div>
                            <div className="font-mono text-[10.5px] text-muted-foreground">sim:{s.digest}</div>
                            {mine && role === 'Auditor' && <Btn variant="ghost" className="!px-1.5" onClick={() => revoke(k.key)} data-testid={`button-revoke-${k.key}`}><Undo2 className="h-3 w-3" /> Revoke</Btn>}
                          </div>
                        ) : (
                          <div className="mt-2">
                            <Btn data-testid={`button-sign-${k.key}`} variant={mine ? 'primary' : 'outline'} disabled={!mine} onClick={() => sign(k.key, who)}><PenLine className="h-3.5 w-3.5" /> Sign as {k.role.toLowerCase()}</Btn>
                            {!mine && <div className="mt-1.5 text-[11px] text-muted-foreground">Switch simulated role to {k.role.toLowerCase()} to sign.</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Panel>
            ))}
          </div>

          <Panel className="mt-5" title="Closure gate matrix" kicker={`${audit.id} findings`}>
            {fs.length === 0 ? <p className="p-4 text-[12.5px] text-muted-foreground">No findings for this audit.</p> : (
              <div className="overflow-x-auto">
                <table className="kv-table w-full">
                  <thead><tr><th>Finding</th><th>Stage</th>{['Accepted', 'RCA', 'Effective', 'Imp AR', 'Imp AE', 'Conf AR', 'Conf AE'].map((h) => <th key={h} className="text-center">{h}</th>)}<th></th></tr></thead>
                  <tbody>
                    {fs.map((f) => {
                      const g = closureGates(f, audit);
                      return (
                        <tr key={f.id}>
                          <td><Link href={`/findings/${f.id}`} className="font-mono text-[12px] font-semibold text-primary hover:underline">{f.id}</Link><div className="text-[11.5px] text-muted-foreground">{f.title}</div></td>
                          <td><StagePill s={stageOf(f, audit)} /></td>
                          {g.map((x) => (
                            <td key={x.id} className="text-center">
                              <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-full', x.ok ? 'bg-[hsl(var(--teal))] text-white' : 'border border-dashed border-[hsl(var(--vermilion)/.6)] text-[hsl(var(--vermilion))]')} title={x.label}>
                                {x.ok ? <Check className="h-3 w-3" /> : <Lock className="h-2.5 w-2.5" />}
                              </span>
                            </td>
                          ))}
                          <td className="text-[12px]">{f.closedAt ? <Pill t="teal">Closed</Pill> : f.p1Status === 'Withdrawn' ? <Pill>Withdrawn</Pill> : g.every((x) => x.ok) ? <Link href={`/findings/${f.id}`} className="font-semibold text-primary hover:underline">Ready to close</Link> : <span className="text-muted-foreground">{g.filter((x) => !x.ok).length} missing</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
