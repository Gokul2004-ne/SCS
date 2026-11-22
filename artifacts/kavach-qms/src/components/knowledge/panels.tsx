import { Link } from 'wouter';
import { Lock, UploadCloud, ShieldAlert, HardDrive } from 'lucide-react';
import { Btn, Pill } from '@/components/kit';
import { FRAMEWORKS } from '@/lib/knowledge/sources';
import type { Clause } from '@/lib/knowledge/types';
import { Hint } from './bits';

export function UploadPanel() {
  return (
    <div className="p-4" data-testid="panel-upload">
      <div aria-disabled="true" className="flex flex-col items-center gap-2 rounded-md border-2 border-dashed border-input bg-[repeating-linear-gradient(135deg,hsl(var(--muted)/.5)_0_8px,transparent_8px_16px)] px-4 py-6 text-center">
        <UploadCloud className="h-7 w-7 text-muted-foreground" />
        <div className="text-[12.5px] font-semibold">Drop a standard PDF here</div>
        <p className="max-w-[260px] text-[11.5px] text-muted-foreground">Protected upload and server extraction await account integration.</p>
        <Btn data-testid="button-upload-pdf" disabled aria-describedby="upload-reason"><Lock className="h-3.5 w-3.5" /> Upload PDF</Btn>
      </div>
      <p id="upload-reason" className="mt-2 text-[11px] leading-snug text-muted-foreground">
        Disabled by design. This demonstrator does not read, store or publish PDF bytes in the browser. Licensed standards must stay behind authenticated, access-controlled storage.
      </p>
    </div>
  );
}

export function SourceCoverage({ clauses }: { clauses: Clause[] }) {
  return (
    <ul className="divide-y divide-border" data-testid="list-source-coverage">
      {FRAMEWORKS.map((f) => {
        const cs = clauses.filter((c) => c.frameworkId === f.id);
        const body = cs.filter((c) => c.coverage === 'body' || c.coverage === 'partial').length;
        const contents = cs.filter((c) => c.coverage === 'contents').length;
        return (
          <li key={f.id} className="px-4 py-2.5" data-testid={`row-source-${f.id}`}>
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-semibold text-primary">{f.code}</span>
              {f.docStatus === 'substantive' && <Pill t="teal">Substantive</Pill>}
              {f.docStatus === 'preview' && <Pill t="amber">Preview only</Pill>}
              {f.docStatus === 'missing' && <Pill t="slate">Source document required</Pill>}
              <Hint>{f.fileNote}</Hint>
            </div>
            {f.file ? (
              <>
                <div className="mt-0.5 break-all font-mono text-[10.5px] text-muted-foreground">{f.file} &middot; {f.pdfPages} pp &middot; {f.edition}</div>
                {cs.length > 0 && (
                  <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-muted" aria-label={`${body} with body text, ${contents} contents only`}>
                    <span className="bg-[hsl(var(--teal))]" style={{ width: `${(body / cs.length) * 100}%` }} />
                    <span className="bg-[hsl(290_30%_45%)]" style={{ width: `${(contents / cs.length) * 100}%` }} />
                  </div>
                )}
                <div className="mt-1 text-[10.5px] text-muted-foreground">{cs.length} headings &middot; {body} with body/partial text &middot; {contents} contents only</div>
              </>
            ) : <div className="mt-0.5 text-[11px] text-muted-foreground">{cs.length ? `${cs.length} user-added clause(s); no source document.` : 'No clauses. Nothing is invented without a source.'}</div>}
          </li>
        );
      })}
    </ul>
  );
}

export function AccessRestricted() {
  return (
    <div data-testid="state-access-restricted" className="rise mx-auto mt-8 max-w-xl rounded-md border border-card-border bg-card p-8 text-center shadow-xs">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted"><ShieldAlert className="h-6 w-6 text-primary" /></div>
      <div className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.2em] text-[hsl(var(--saffron))]">Simulated role: Auditee lead</div>
      <h2 className="font-display mt-1 text-[24px] text-primary">Repository not available in this view</h2>
      <p className="mt-2 text-[13px] text-muted-foreground">
        In the current product scope the auditee sees assigned progress and their own declarations only. The knowledge repository is an auditor working tool.
      </p>
      <p className="mt-3 rounded-[5px] border border-dashed border-border px-3 py-2 text-[11.5px] text-muted-foreground">
        This is a UI restriction for demonstration. It is <span className="font-semibold text-foreground">not a security control</span>; real role-based access will be enforced server-side after account integration. Switch the simulated role in the header to view it as an auditor.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Link href="/dashboard" data-testid="link-restricted-overview" className="inline-flex items-center rounded-[5px] border border-input bg-card px-3 py-1.5 text-[12.5px] font-semibold hover:bg-accent/40">Go to overview</Link>
        <Link href="/governance" data-testid="link-restricted-governance" className="inline-flex items-center rounded-[5px] border border-primary bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground">My declarations</Link>
      </div>
    </div>
  );
}

export function StorageBanner({ savedAt, saveError }: { savedAt: string | null; saveError: string | null }) {
  return (
    <div data-testid="text-storage-status" className={saveError ? 'flex items-start gap-2 rounded-[5px] border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive' : 'flex items-start gap-2 rounded-[5px] border border-border bg-card px-3 py-2 text-[11.5px] text-muted-foreground'} role={saveError ? 'alert' : 'status'}>
      <HardDrive className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {saveError ?? (
        <span>Browser-local demonstration storage (<span className="font-mono">kavach.knowledge-repo.v1</span>). Not shared, not on a server, not backed up. {savedAt ? `Last saved ${new Date(savedAt).toLocaleTimeString()}.` : 'No changes saved this session.'} Export JSON to keep your mappings.</span>
      )}
    </div>
  );
}
