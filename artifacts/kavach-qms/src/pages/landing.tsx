import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import '@/components/public/public.css';
import { Lifecycle } from '@/components/public/lifecycle';
import { Mark365, usePageMeta } from '@/components/public/shared';

export default function Landing() {
  usePageMeta(
    'Auditor 365 — Your AI-Powered Compliance Co-Pilot',
    'Auditor 365 helps defence and NABL quality teams plan, evidence, log findings and close 8D corrective actions across ISO 17025, ISO 12207 and ISO 15504 / 330xx.',
  );

  return (
    <div className="a365" data-testid="page-landing">
      <div className="hatch-bar" />
      <section className="relative min-h-[calc(100dvh-4px)] overflow-hidden">
        <div className="grid-bg" /><div className="halo" />
        <header className="nav">
          <Link href="/" className="brand" data-testid="link-brand">
            <Mark365 />
            <div>
              <div className="serif text-[21px] leading-none">Auditor 365</div>
              <div className="mono mt-1 text-[9.5px] uppercase tracking-[0.22em] text-[#9AA6BC]">AI Twin · Kavach QA</div>
            </div>
          </Link>
        </header>

        <div className="relative z-[2] mx-auto grid max-w-[1320px] items-center gap-10 px-5 pb-16 pt-6 sm:px-10 lg:grid-cols-[1.05fr_1fr] lg:pt-10">
          <div>
            <div className="kicker rv d1">Defence &amp; NABL quality assurance</div>
            <h1 className="serif rv d2 mt-5 text-[clamp(40px,6.2vw,84px)] leading-[0.98] tracking-[-0.02em]" data-testid="text-headline">
              Auditor 365 — Your <em className="text-[#F59E0B] not-italic">AI-Powered</em> Compliance Co-Pilot
            </h1>
            <p className="mono rv d3 mt-6 text-[13px] tracking-[0.14em] text-[#C7CFDD] sm:text-[15px]" data-testid="text-subheadline">
              ISO 17025 · ISO 12207 · ISO 15504 / 330xx
            </p>
            <p className="rv d3 mt-6 max-w-[520px] text-[16px] leading-relaxed text-[#9AA6BC]">
              One disciplined path from audit plan to closure. An AI twin that prepares the groundwork and leaves every judgement with the people accountable for it.
            </p>
            <div className="rv d4 mt-9 flex flex-wrap gap-3">
              <Link href="/login/auditor" className="btn-amber" data-testid="link-cta-login-auditor">Auditor login <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/login/auditee" className="btn-ghost" data-testid="link-cta-login-auditee">Auditee login <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <p className="rv d5 mt-8 max-w-[480px] border-l-2 border-[#F59E0B]/50 pl-3 text-[12px] leading-relaxed text-[#7C88A0]">
              AI assistance described here is intended functionality. It does not make audit decisions. No official endorsement by any standards or accreditation body is implied.
            </p>
          </div>
          <div className="rv d4" data-testid="section-lifecycle">
            <Lifecycle />
          </div>
        </div>
      </section>
    </div>
  );
}
