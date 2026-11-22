import { Link } from 'wouter';
import { ArrowRight, FileSearch, Scale, Wrench, ClipboardCheck, BookOpen, Cpu } from 'lucide-react';
import '@/components/public/public.css';
import { Lifecycle } from '@/components/public/lifecycle';
import { Mark365, Reveal, usePageMeta } from '@/components/public/shared';

const STANDARDS = [
  { code: 'ISO/IEC 17025', area: 'Testing and calibration laboratories', note: 'Competence, impartiality and consistent operation of labs, the backbone of NABL accreditation.' },
  { code: 'ISO/IEC 12207', area: 'Software life cycle processes', note: 'A common frame for acquiring, developing, operating and maintaining software systems.' },
  { code: 'ISO/IEC 15504 / 330xx', area: 'Process assessment', note: 'Capability levels and assessment models for judging how mature a process really is.' },
];

const TWIN = [
  { icon: FileSearch, t: 'Reads alongside you', d: 'Intended to cross-reference evidence against clauses and flag what looks missing, so you start from a shortlist rather than a stack.' },
  { icon: BookOpen, t: 'Drafts, never decides', d: 'Proposed wording for notifications and finding statements. Every word is reviewed and owned by a named auditor.' },
  { icon: Wrench, t: 'Keeps 8D honest', d: 'Prompts for containment, root cause and verification so corrective actions address causes, not symptoms.' },
  { icon: Scale, t: 'Shows its working', d: 'Suggestions are meant to cite the clause and record they came from. Nothing is accepted silently.' },
];

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
          <nav className="flex items-center gap-2 sm:gap-5 text-[13px]">
            <a href="#lifecycle" className="hidden text-[#9AA6BC] hover:text-[#EEF0F4] sm:inline" data-testid="link-anchor-lifecycle">Lifecycle</a>
            <a href="#standards" className="hidden text-[#9AA6BC] hover:text-[#EEF0F4] sm:inline" data-testid="link-anchor-standards">Standards</a>
            <Link href="/login" className="btn-ghost !py-2 !px-4" data-testid="link-nav-login">Login</Link>
          </nav>
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
              <Link href="/login" className="btn-amber" data-testid="link-cta-login">Login to your Workspace <ArrowRight className="h-4 w-4" /></Link>
              <a href="#lifecycle" className="btn-ghost" data-testid="link-cta-lifecycle">See the lifecycle</a>
            </div>
            <p className="rv d5 mt-8 max-w-[480px] border-l-2 border-[#F59E0B]/50 pl-3 text-[12px] leading-relaxed text-[#7C88A0]">
              AI assistance described here is intended functionality. It does not make audit decisions. No official endorsement by any standards or accreditation body is implied.
            </p>
          </div>
          <div id="lifecycle" className="rv d4 scroll-mt-10">
            <Lifecycle />
          </div>
        </div>
      </section>

      <section className="paper relative">
        <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-10">
          <Reveal>
            <div className="kicker !text-[#B45309]">The AI twin</div>
            <h2 className="serif mt-4 max-w-[760px] text-[clamp(30px,4vw,52px)] leading-[1.05]">A second pair of eyes that knows the clauses. Not a second signature.</h2>
          </Reveal>
          <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {TWIN.map((x, i) => (
              <Reveal key={x.t}>
                <div className="card-line flex gap-5 pt-6">
                  <span className="mono text-[12px] text-[#B45309]">0{i + 1}</span>
                  <div>
                    <div className="flex items-center gap-2"><x.icon className="h-4 w-4 text-[#B45309]" /><h3 className="text-[18px] font-semibold">{x.t}</h3></div>
                    <p className="mute mt-2 text-[14.5px] leading-relaxed">{x.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="standards" className="relative overflow-hidden">
        <div className="grid-bg" />
        <div className="relative mx-auto max-w-[1200px] px-5 py-24 sm:px-10">
          <Reveal><div className="kicker">Frameworks in scope</div>
            <h2 className="serif mt-4 text-[clamp(30px,4vw,52px)] leading-[1.05]">Three standards. One audit trail.</h2></Reveal>
          <div className="mt-12 divide-y divide-[rgba(226,232,240,.12)] border-y border-[rgba(226,232,240,.12)]">
            {STANDARDS.map((s) => (
              <Reveal key={s.code}>
                <div className="grid gap-3 py-8 md:grid-cols-[280px_1fr_1.4fr] md:items-baseline">
                  <div className="serif text-[28px] text-[#F59E0B]">{s.code}</div>
                  <div className="text-[15px] font-medium">{s.area}</div>
                  <p className="text-[14px] leading-relaxed text-[#9AA6BC]">{s.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="paper">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-24 sm:px-10 md:grid-cols-2">
          <Reveal>
            <div className="kicker !text-[#B45309]">Two sides of the table</div>
            <h2 className="serif mt-4 text-[clamp(28px,3.6vw,46px)] leading-[1.05]">Built for the auditor and the audited.</h2>
            <p className="mute mt-5 text-[15px] leading-relaxed">Each persona opens a workspace shaped to its job. Access itself will be governed by secure accounts and assigned roles, not by which tile you click.</p>
          </Reveal>
          <Reveal>
            <div className="space-y-6">
              <div className="card-line pt-5"><div className="flex items-center gap-2 font-semibold"><ClipboardCheck className="h-4 w-4 text-[#B45309]" /> Auditor</div><p className="mute mt-1.5 text-[14px]">Plans, evidence review, finding log, 8D CAPA verification and closure.</p></div>
              <div className="card-line pt-5"><div className="flex items-center gap-2 font-semibold"><Cpu className="h-4 w-4 text-[#B45309]" /> Auditee</div><p className="mute mt-1.5 text-[14px]">Views assigned progress and signs their own declarations. Responding to findings is part of the wider process and is not enabled here yet.</p></div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="halo !top-0 !right-auto !left-[-300px]" />
        <div className="relative mx-auto max-w-[1000px] px-5 py-28 text-center sm:px-10">
          <Reveal>
            <h2 className="serif text-[clamp(32px,5vw,64px)] leading-[1.02]">Start from Plan. <span className="text-[#F59E0B]">Finish at Closure.</span></h2>
            <div className="mt-10 flex justify-center"><Link href="/login" className="btn-amber" data-testid="link-cta-login-footer">Login to your Workspace <ArrowRight className="h-4 w-4" /></Link></div>
          </Reveal>
        </div>
        <footer className="relative border-t border-[rgba(226,232,240,.12)] px-5 py-6 text-center text-[11.5px] text-[#7C88A0] sm:px-10">
          Auditor 365 on Kavach · Prototype. Not a certified production system. No official endorsement. Do not enter classified information.
        </footer>
      </section>
    </div>
  );
}
