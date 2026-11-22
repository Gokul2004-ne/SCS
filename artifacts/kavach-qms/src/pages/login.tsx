import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, FileSignature, Lock, KeyRound, FlaskConical } from 'lucide-react';
import '@/components/public/public.css';
import { Mark365, usePageMeta } from '@/components/public/shared';

type Persona = 'auditor' | 'auditee';

const PERSONAS: { id: Persona; title: string; icon: typeof Check; lines: string[] }[] = [
  { id: 'auditor', title: 'I am an Auditor', icon: ClipboardCheck, lines: ['Plan audits and sample clauses', 'Log findings with objective evidence', 'Verify 8D CAPA and close'] },
  { id: 'auditee', title: 'I am an Auditee', icon: FileSignature, lines: ['View progress on what is assigned to you', 'Sign your own declarations', 'Finding responses not enabled yet'] },
];

export default function Login() {
  usePageMeta('Sign in — Auditor 365', 'Choose your intended Auditor 365 workspace. Secure sign-in is awaiting account integration.');
  const [persona, setPersona] = useState<Persona | null>(null);

  return (
    <div className="a365" data-testid="page-login">
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

      <main className="relative z-[2] mx-auto max-w-[920px] px-5 pb-20 pt-4 sm:px-10">
        <div className="kicker rv d1">Workspace entry</div>
        <h1 className="serif rv d2 mt-4 text-[clamp(34px,5vw,58px)] leading-[1.02]">Login to your Workspace</h1>
        <p className="rv d3 mt-4 max-w-[600px] text-[15px] leading-relaxed text-[#9AA6BC]">
          Tell us which side of the audit you are on. This only sets your intended workspace — your actual permissions will come from the role assigned to your account.
        </p>

        <div role="radiogroup" aria-label="Choose your persona" className="rv d3 mt-10 grid gap-4 md:grid-cols-2">
          {PERSONAS.map((p) => {
            const on = persona === p.id;
            return (
              <button
                key={p.id} type="button" role="radio" aria-checked={on} className="persona"
                onClick={() => setPersona(p.id)} data-testid={`button-persona-${p.id}`}
              >
                <span className="tick" aria-hidden>{on && <Check className="h-3.5 w-3.5" />}</span>
                <p.icon className="h-6 w-6 text-[#F59E0B]" aria-hidden />
                <div className="serif mt-5 text-[26px]">{p.title}</div>
                <ul className="mt-4 space-y-2 text-[13.5px] text-[#9AA6BC]">
                  {p.lines.map((l) => <li key={l} className="flex gap-2"><span className="mt-[9px] h-px w-3 shrink-0 bg-[#F59E0B]/60" />{l}</li>)}
                </ul>
              </button>
            );
          })}
        </div>

        <section className="rv d4 mt-8 rounded-[10px] border border-[rgba(226,232,240,.12)] bg-[rgba(22,33,58,.65)] p-6 sm:p-8" aria-labelledby="signin-h">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" aria-hidden />
            <div>
              <h2 id="signin-h" className="text-[15px] font-semibold">Secure sign-in is awaiting account integration</h2>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[#9AA6BC]" data-testid="text-persona-status">
                {persona
                  ? `Intended workspace: ${persona === 'auditor' ? 'Auditor' : 'Auditee'}. This choice does not grant a role or sign you in.`
                  : 'Choose a persona above. No credentials are collected on this page.'}
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
      </main>
    </div>
  );
}
