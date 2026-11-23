import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, ClipboardCheck, FileSignature, Lock, KeyRound, FlaskConical } from 'lucide-react';
import '@/components/public/public.css';
import { Mark365, usePageMeta } from '@/components/public/shared';

export type Persona = 'auditor' | 'auditee';

const PERSONAS: Record<Persona, { label: string; kicker: string; title: string; lede: string; icon: typeof Lock; lines: string[] }> = {
  auditor: {
    label: 'Auditor', kicker: 'Auditor entry', title: 'Auditor login', icon: ClipboardCheck,
    lede: 'For accountable auditors who plan audits, review evidence, log findings and verify 8D corrective actions through to closure.',
    lines: ['Plan audits and sample clauses', 'Log findings with objective evidence', 'Verify 8D CAPA and close'],
  },
  auditee: {
    label: 'Auditee', kicker: 'Auditee entry', title: 'Auditee login', icon: FileSignature,
    lede: 'For auditees who track the audits assigned to them and sign their own declarations.',
    lines: ['View progress on audits assigned to you', 'Sign your own declarations', 'Finding responses not enabled yet'],
  },
};

function Frame({ children, testId }: { children: ReactNode; testId: string }) {
  return (
    <div className="a365" data-testid={testId}>
      <div className="hatch-bar" />
      <div className="grid-bg" /><div className="halo" />
      <header className="nav">
        <Link href="/" className="brand" data-testid="link-back-landing">
          <Mark365 size={30} />
          <span className="serif text-[19px]">Auditor 365</span>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-[13px] text-[#9AA6BC] hover:text-[#EEF0F4]" data-testid="link-back-home">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
      </header>
      <main className="relative z-[2] mx-auto max-w-[920px] px-5 pb-20 pt-4 sm:px-10">{children}</main>
    </div>
  );
}

export default function Login({ persona }: { persona?: Persona }) {
  if (!persona) return <Chooser />;
  return <PersonaLogin persona={persona} />;
}

function Chooser() {
  usePageMeta('Sign in — Auditor 365', 'Choose the Auditor or Auditee entry for Auditor 365.');
  return (
    <Frame testId="page-login">
      <div className="kicker rv d1">Workspace entry</div>
      <h1 className="serif rv d2 mt-4 text-[clamp(34px,5vw,58px)] leading-[1.02]">Choose your entry</h1>
      <div className="rv d3 mt-10 grid gap-4 md:grid-cols-2">
        {(Object.keys(PERSONAS) as Persona[]).map((id) => {
          const p = PERSONAS[id];
          return (
            <Link key={id} href={`/login/${id}`} className="persona block" data-testid={`link-choose-${id}`}>
              <p.icon className="h-6 w-6 text-[#F59E0B]" aria-hidden />
              <div className="serif mt-5 flex items-center gap-2 text-[26px]">{p.title} <ArrowRight className="h-5 w-5" /></div>
            </Link>
          );
        })}
      </div>
    </Frame>
  );
}

function PersonaLogin({ persona }: { persona: Persona }) {
  const p = PERSONAS[persona];
  const other: Persona = persona === 'auditor' ? 'auditee' : 'auditor';
  usePageMeta(`${p.title} — Auditor 365`, `${p.title} for Auditor 365. Secure sign-in is awaiting account integration.`);
  return (
    <Frame testId={`page-login-${persona}`}>
      <div className="kicker rv d1">{p.kicker}</div>
      <h1 className="serif rv d2 mt-4 flex items-center gap-4 text-[clamp(34px,5vw,58px)] leading-[1.02]" data-testid="text-login-title">
        <p.icon className="h-9 w-9 shrink-0 text-[#F59E0B]" aria-hidden /> {p.title}
      </h1>
      <p className="rv d3 mt-4 max-w-[600px] text-[15px] leading-relaxed text-[#9AA6BC]">{p.lede}</p>
      <ul className="rv d3 mt-6 space-y-2 text-[13.5px] text-[#C7CFDD]" data-testid={`list-persona-${persona}`}>
        {p.lines.map((l) => <li key={l} className="flex gap-2"><span className="mt-[9px] h-px w-3 shrink-0 bg-[#F59E0B]/60" />{l}</li>)}
      </ul>

      <section className="rv d4 mt-8 rounded-[10px] border border-[rgba(226,232,240,.12)] bg-[rgba(22,33,58,.65)] p-6 sm:p-8" aria-labelledby="signin-h">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" aria-hidden />
          <div>
            <h2 id="signin-h" className="text-[15px] font-semibold">Secure sign-in is awaiting account integration</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#9AA6BC]" data-testid="text-persona-status">
              {`${p.label} entry. Opening this page does not grant a role or sign you in. Permissions will come from the role assigned to your account.`}
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" disabled aria-disabled className="btn-disabled" data-testid="button-secure-signin">
            <Lock className="h-4 w-4" /> Secure sign-in — integration pending
          </button>
          <button type="button" disabled aria-disabled className="btn-disabled" data-testid="button-sso">
            <KeyRound className="h-4 w-4" /> Login with SSO — coming soon
          </button>
        </div>
      </section>

      <section className="rv d5 mt-6 flex flex-col gap-4 rounded-[10px] border border-dashed border-[#F59E0B]/40 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" aria-hidden />
          <div>
            <div className="kicker !text-[10px]">Demonstration only</div>
            <p className="mt-1 max-w-[480px] text-[13.5px] leading-relaxed text-[#C7CFDD]">
              Explore the demonstration workspace with sample data stored locally in this browser. It is not secure, not production, and no sign-in takes place.
            </p>
          </div>
        </div>
        <Link href="/dashboard" className="btn-ghost shrink-0" data-testid="link-demo-workspace">
          Open demonstration workspace <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <p className="mt-6 text-[13px] text-[#7C88A0]">
        Not an {p.label.toLowerCase()}?{' '}
        <Link href={`/login/${other}`} className="text-[#F59E0B] hover:underline" data-testid={`link-switch-${other}`}>{PERSONAS[other].title}</Link>
      </p>
    </Frame>
  );
}
