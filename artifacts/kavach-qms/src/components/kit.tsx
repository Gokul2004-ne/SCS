import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Classification } from '@/lib/types';
import type { Friction, Stage } from '@/lib/store';

export function PageHead({ code, title, sub, actions }: { code: string; title: string; sub: string; actions?: ReactNode }) {
  return (
    <div className="rise mb-6 flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[hsl(var(--saffron))]">{code}</div>
        <h1 className="font-display mt-1 text-[30px] leading-tight text-primary md:text-[34px]">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-[13.5px] text-muted-foreground">{sub}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

type BtnVariant = 'primary' | 'ghost' | 'outline' | 'danger' | 'saffron';
export function Btn({ variant = 'outline', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary',
    saffron: 'bg-[hsl(var(--saffron))] text-[hsl(228_42%_10%)] border-[hsl(var(--saffron))] hover:brightness-105',
    outline: 'bg-card text-foreground border-input hover:border-primary/50 hover:bg-accent/40',
    ghost: 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted',
    danger: 'bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90',
  };
  return (
    <button
      {...p}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-[5px] border px-3 py-1.5 text-[12.5px] font-semibold transition-all active:translate-y-px disabled:pointer-events-none disabled:opacity-45',
        v[variant],
        className,
      )}
    />
  );
}

export function Panel({ title, kicker, children, right, className }: { title?: string; kicker?: string; children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <section className={cn('rise-2 rounded-md border border-card-border bg-card shadow-xs', className)}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div>
            {kicker && <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">{kicker}</div>}
            {title && <h2 className="text-[13.5px] font-semibold text-primary">{title}</h2>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

const tone: Record<string, string> = {
  red: 'bg-[hsl(8_70%_46%/.1)] text-[hsl(8_70%_38%)] border-[hsl(8_70%_46%/.3)]',
  amber: 'bg-[hsl(36_88%_50%/.14)] text-[hsl(28_80%_30%)] border-[hsl(36_88%_50%/.35)]',
  indigo: 'bg-[hsl(228_55%_24%/.08)] text-[hsl(228_55%_28%)] border-[hsl(228_55%_24%/.22)]',
  teal: 'bg-[hsl(170_48%_28%/.1)] text-[hsl(170_48%_24%)] border-[hsl(170_48%_28%/.3)]',
  plum: 'bg-[hsl(290_30%_40%/.1)] text-[hsl(290_30%_32%)] border-[hsl(290_30%_40%/.28)]',
  slate: 'bg-muted text-muted-foreground border-border',
};

export function Pill({ t = 'slate', children, className }: { t?: keyof typeof tone | string; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-[3px] border px-1.5 py-[1px] text-[11px] font-semibold', tone[t] ?? tone.slate, className)}>{children}</span>;
}

export function ClassPill({ c }: { c: Classification }) {
  const t = c === 'Major NC' ? 'red' : c === 'Minor NC' ? 'amber' : c === 'Observation' ? 'indigo' : 'slate';
  return <Pill t={t}>{c}</Pill>;
}

export function StagePill({ s }: { s: Stage }) {
  const map: Record<Stage, string> = {
    'Phase 1': 'indigo', 'In rebuttal': 'plum', RCA: 'amber', 'RCA review': 'amber', 'RCA revision': 'red',
    Verification: 'teal', 'Closure gate': 'teal', Closed: 'teal', Withdrawn: 'slate',
  };
  return (
    <Pill t={map[s]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s}
    </Pill>
  );
}

export function FrictionPill({ f, n }: { f: Friction; n: number }) {
  return <Pill t={f === 'High' ? 'red' : f === 'Moderate' ? 'amber' : 'slate'}>{f} / {n}</Pill>;
}

export function Field({ label, error, children, hint, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
      {error && <span className="mt-1 block text-[11px] font-medium text-destructive">{error}</span>}
    </label>
  );
}

export function Modal({ open, onClose, title, desc, children, wide }: { open: boolean; onClose: () => void; title: string; desc?: string; children: ReactNode; wide?: boolean }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn('max-h-[90dvh] overflow-y-auto bg-card', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">{title}</DialogTitle>
          {desc && <DialogDescription className="text-[12.5px]">{desc}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function Stat({ label, value, note, t }: { label: string; value: ReactNode; note?: string; t?: 'red' | 'teal' | 'amber' }) {
  const c = t === 'red' ? 'text-[hsl(var(--vermilion))]' : t === 'teal' ? 'text-[hsl(var(--teal))]' : t === 'amber' ? 'text-[hsl(28_80%_36%)]' : 'text-primary';
  return (
    <div className="border-r border-border px-4 py-3 last:border-r-0">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
      <div className={cn('mt-1 font-mono text-[26px] font-semibold leading-none', c)}>{value}</div>
      {note && <div className="mt-1.5 text-[11px] text-muted-foreground">{note}</div>}
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rule-dotted m-4 flex flex-col items-center rounded-md border border-dashed border-border px-6 py-10 text-center">
      <div className="font-display text-lg text-primary">{title}</div>
      <p className="mt-1 max-w-sm text-[12.5px] text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function GuidanceNote({ items }: { items: string[] }) {
  return (
    <div className="rounded-md border border-[hsl(var(--saffron)/.4)] bg-[hsl(var(--saffron)/.07)] p-3">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[hsl(28_80%_32%)]">Illustrative rule-based guidance / human approval mandatory</div>
      {items.length === 0 ? (
        <p className="mt-1.5 text-[12px] text-muted-foreground">No rule triggered. Reviewer judgement still required.</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {items.map((i) => (
            <li key={i} className="flex gap-2 text-[12px] text-foreground/85">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--saffron))]" />
              {i}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const fmt = (iso: string) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-');
export const fmtDate = (iso: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
