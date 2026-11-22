import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutGrid, CalendarRange, FileWarning, Wrench, Paperclip, Layers, ShieldCheck, Network, Settings2, BookMarked, Menu, X, Download, FileJson, ArrowLeft } from 'lucide-react';
import { useStore } from '@/lib/store';
import { exportCsv, exportJson } from '@/lib/export';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutGrid, n: '00' },
  { href: '/audits', label: 'Audit programme', icon: CalendarRange, n: '01' },
  { href: '/findings', label: 'Findings register', icon: FileWarning, n: '02' },
  { href: '/corrective-actions', label: 'Corrective actions', icon: Wrench, n: '03' },
  { href: '/evidence', label: 'Evidence register', icon: Paperclip, n: '04' },
  { href: '/frameworks', label: 'Frameworks', icon: Layers, n: '05' },
  { href: '/knowledge-repo', label: 'Knowledge repo', icon: BookMarked, n: '5a' },
  { href: '/governance', label: 'Governance gate', icon: ShieldCheck, n: '06' },
  { href: '/architecture', label: 'Architecture', icon: Network, n: '07' },
  { href: '/settings', label: 'Settings', icon: Settings2, n: '08' },
];

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <path d="M16 2 L28 7 V16 C28 23 22.5 28 16 30 C9.5 28 4 23 4 16 V7 Z" fill="none" stroke="hsl(36 88% 52%)" strokeWidth="1.6" />
      <path d="M16 7 L23 10 V16 C23 20.5 20 23.5 16 25 C12 23.5 9 20.5 9 16 V10 Z" fill="hsl(36 88% 52% / .16)" stroke="hsl(36 88% 52% / .6)" strokeWidth="1" />
      <path d="M12.5 16 L15 18.5 L19.5 13" fill="none" stroke="hsl(40 40% 92%)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RoleSwitch() {
  const { role, setRole } = useStore();
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground lg:inline">Simulated role</span>
      <div className="relative flex rounded-[5px] border border-input bg-muted p-0.5" data-testid="role-switch">
        {(['Auditor', 'Auditee'] as Role[]).map((r) => (
          <button
            key={r}
            data-testid={`button-role-${r.toLowerCase()}`}
            onClick={() => setRole(r)}
            className={cn('relative z-10 rounded-[4px] px-3 py-1 text-[12px] font-semibold transition-colors', role === r ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            {r === 'Auditor' ? 'Lead auditor' : 'Auditee lead'}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);
  const { state } = useStore();
  const isActive = (h: string) => (h === '/' ? loc === '/' : loc.startsWith(h));

  const nav = (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          onClick={() => setOpen(false)}
          data-testid={`link-nav-${n.label.toLowerCase().replace(/\s/g, '-')}`}
          className={cn(
            'group relative flex items-center gap-3 rounded-[5px] px-2.5 py-2 text-[13px] transition-colors',
            isActive(n.href) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
          )}
        >
          {isActive(n.href) && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-sidebar-primary" />}
          <n.icon className="h-4 w-4 shrink-0 opacity-80" />
          <span className="flex-1">{n.label}</span>
          <span className="font-mono text-[10px] opacity-40 group-hover:opacity-70">{n.n}</span>
        </Link>
      ))}
    </nav>
  );

  const side = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 pb-5 pt-5">
        <Mark />
        <div>
          <div className="font-display text-[22px] leading-none tracking-wide text-[hsl(40_40%_94%)]">Kavach</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/55">Quality and assurance</div>
        </div>
      </div>
      <div className="mx-5 mb-4 rounded-[5px] border border-sidebar-border bg-sidebar-accent/40 px-3 py-2">
        <div className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/50">Tenant / unit</div>
        <div className="truncate text-[12.5px] font-medium text-sidebar-accent-foreground">{state.settings.orgName}</div>
        <div className="truncate text-[11.5px] text-sidebar-foreground/60">{state.settings.unitName} / {state.settings.programme}</div>
      </div>
      {nav}
      <div className="mt-auto space-y-2 p-4">
        <button data-testid="button-export-csv-side" onClick={() => exportCsv(state)} className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-[12px] text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Download className="h-3.5 w-3.5" /> Export findings CSV
        </button>
        <button data-testid="button-export-json-side" onClick={() => exportJson(state)} className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-[12px] text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <FileJson className="h-3.5 w-3.5" /> Full JSON dossier
        </button>
        <Link href="/" data-testid="link-return-landing" className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-[11.5px] text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Auditor 365 home
        </Link>
        <p className="px-2.5 pt-2 text-[10.5px] leading-snug text-sidebar-foreground/40">Prototype blueprint. Not a certified production system. No official endorsement.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh]">
      <div className="hatch h-1 w-full" />
      <aside className="fixed bottom-0 left-0 top-1 hidden w-[248px] lg:block">{side}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[hsl(228_42%_8%/.5)]" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 left-0 top-0 w-[260px]">{side}</div>
        </div>
      )}
      <div className="lg:pl-[248px]">
        <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--saffron)/.35)] bg-[hsl(var(--saffron)/.1)] px-4 py-1 text-center lg:px-8">
            <span data-testid="text-demo-notice" className="w-full font-mono text-[10.5px] uppercase tracking-[0.2em] text-[hsl(28_80%_28%)]">
              Demonstration &bull; sample data &bull; not for classified information
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 lg:px-8">
            <button className="lg:hidden" onClick={() => setOpen(!open)} data-testid="button-menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden text-[11.5px] text-muted-foreground md:block">
              Role switching is a simulation of perspective, <span className="font-semibold text-foreground">not authorisation</span>.
            </div>
            <RoleSwitch />
          </div>
        </div>
        <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
