import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import '@/components/public/public.css';
import { Lifecycle } from '@/components/public/lifecycle';
import { usePageMeta } from '@/components/public/shared';

export default function Landing() {
  usePageMeta(
    'Integrated Audit & Compliance Assurance — Kavach QA',
    'Helps Security Control System and NABL quality teams plan, evidence, log findings and close 8D corrective actions across ISO 17025, ISO 12207 and ISO 15504 / 330xx.',
  );

  return (
    <div className="a365" data-testid="page-landing">
      <div className="hatch-bar" />
      <section className="relative flex min-h-[calc(100dvh-4px)] items-center overflow-hidden">
        <div className="grid-bg" /><div className="halo" />

        <div className="relative z-[2] mx-auto grid w-full max-w-[1320px] items-center gap-8 px-5 py-10 sm:px-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="kicker rv d1">Security Control System &amp; NABL quality assurance</div>
            <h1 className="serif rv d2 mt-4 text-[clamp(30px,3.8vw,52px)] leading-[1.06] tracking-[-0.02em]" data-testid="text-headline">
              Integrated Audit &amp; <em className="text-[#F59E0B] not-italic">Compliance</em> Assurance
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
