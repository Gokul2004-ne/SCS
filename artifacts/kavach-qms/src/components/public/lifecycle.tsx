import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';

export const STEPS = [
  { id: 'plan', label: 'Plan', desc: 'Scope, criteria and clause sampling are drafted against ISO 17025, ISO 12207 or ISO 15504 / 330xx. AI can suggest a sampling plan; the lead auditor decides.' },
  { id: 'notify', label: 'Notify', desc: 'The auditee unit receives the schedule, team and document request. Drafts can be AI-prepared and are always reviewed before issue.' },
  { id: 'evidence', label: 'Evidence Gather', desc: 'Records, calibration certificates and process artefacts are collected and linked to clauses, with gaps highlighted for the auditor.' },
  { id: 'finding', label: 'Finding Log', desc: 'Observations and nonconformities are recorded with clause reference, objective evidence and severity, written by the auditor.' },
  { id: 'rebuttal', label: 'Auditee Rebuttal', desc: 'In the overall process the auditee may respond to a finding. Shown here for context; auditee submissions are not enabled in this workspace.' },
  { id: 'capa', label: '8D CAPA', desc: 'Containment, root cause and corrective action follow the eight-discipline method, so fixes address causes rather than symptoms.' },
  { id: 'review', label: 'Review', desc: 'The auditor verifies the effectiveness of corrective actions against the evidence provided before anything is accepted.' },
  { id: 'closure', label: 'Closure', desc: 'Findings are closed with a traceable record and the cycle feeds the next audit plan.' },
] as const;

export const STEP_MS = 2500;

function usePrefersReducedMotion() {
  const [r, setR] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!m) return;
    const on = () => setR(m.matches);
    m.addEventListener?.('change', on);
    return () => m.removeEventListener?.('change', on);
  }, []);
  return r;
}

const C = 250, R = 195;
const pos = (i: number) => {
  const a = (i / STEPS.length) * Math.PI * 2 - Math.PI / 2;
  return { x: C + R * Math.cos(a), y: C + R * Math.sin(a), a };
};

export function Lifecycle() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(!reduced);

  useEffect(() => { if (reduced) setPlaying(false); }, [reduced]);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(t);
  }, [playing]);

  const select = (i: number) => { setActive(i); setPlaying(false); };
  const circ = 2 * Math.PI * R;
  const frac = (active + 1) / STEPS.length;
  const step = STEPS[active];

  return (
    <div className="relative" data-testid="lifecycle">
      <div className="relative mx-auto aspect-[640/500] w-full max-w-[620px]">
        <svg viewBox="-45 0 640 500" className="h-full w-full" role="group" aria-label="Eight-step audit lifecycle">
          <defs>
            <linearGradient id="a365arc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F59E0B" stopOpacity=".25" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <g className="lc-sweep" aria-hidden>
            <circle cx={C} cy={C} r={220} fill="none" stroke="rgba(226,232,240,.1)" strokeDasharray="2 10" />
            <path d={`M ${C} ${C - 220} A 220 220 0 0 1 ${C + 220} ${C}`} fill="none" stroke="rgba(245,158,11,.35)" strokeWidth="1" />
          </g>
          <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(226,232,240,.12)" strokeWidth="2" aria-hidden />
          <circle
            className="lc-arc" cx={C} cy={C} r={R} fill="none" stroke="url(#a365arc)" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)} transform={`rotate(-90 ${C} ${C})`} aria-hidden
          />
          {[0, 1, 2, 3].map((k) => (
            <line key={k} x1={C} y1={C - 134} x2={C} y2={C - 122} stroke="rgba(226,232,240,.25)" transform={`rotate(${k * 90} ${C} ${C})`} aria-hidden />
          ))}
          <text x={C} y={C - 48} textAnchor="middle" className="mono" fontSize="11" letterSpacing="3" fill="#F59E0B" aria-hidden>
            STEP {String(active + 1).padStart(2, '0')} / 08
          </text>
          <text key={step.id} x={C} y={C + 4} textAnchor="middle" className="serif lc-detail" fontSize={step.label.length > 12 ? 28 : 36} fill="#EEF0F4" aria-hidden>
            {step.label}
          </text>
          <text x={C} y={C + 38} textAnchor="middle" fontSize="11" fill="#9AA6BC" letterSpacing="1.5" aria-hidden>
            {active === STEPS.length - 1 ? 'LOOPS TO PLAN' : `NEXT · ${STEPS[active + 1].label.toUpperCase()}`}
          </text>
          {STEPS.map((s, i) => {
            const p = pos(i);
            const on = i === active, done = i < active;
            const lx = C + (R + 38) * Math.cos(p.a), ly = C + (R + 38) * Math.sin(p.a);
            return (
              <g
                key={s.id} className="lc-node" role="button" tabIndex={0}
                aria-label={`Step ${i + 1}: ${s.label}`} aria-pressed={on} data-testid={`lifecycle-node-${s.id}`}
                onClick={() => select(i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i); } }}
              >
                {on && <circle className="lc-pulse" cx={p.x} cy={p.y} r={14} fill="none" stroke="#F59E0B" strokeWidth="1.5" />}
                <circle className="ring" cx={p.x} cy={p.y} r={on ? 17 : 12} fill={on ? '#F59E0B' : done ? '#1E2B47' : '#0F172A'} stroke={on || done ? '#F59E0B' : 'rgba(226,232,240,.35)'} strokeWidth="1.5" />
                <text x={p.x} y={p.y + 4} textAnchor="middle" className="mono" fontSize="10.5" fontWeight="600" fill={on ? '#0F172A' : done ? '#F59E0B' : '#9AA6BC'}>{i + 1}</text>
                <text x={lx} y={ly + 4} textAnchor={Math.abs(lx - C) < 20 ? 'middle' : lx > C ? 'start' : 'end'} fontSize="12.5" fontWeight={on ? 600 : 400} fill={on ? '#EEF0F4' : '#9AA6BC'} className="hidden sm:inline">{s.label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-start gap-4 rounded-lg border border-[rgba(226,232,240,.12)] bg-[rgba(22,33,58,.7)] p-4 backdrop-blur">
        <button
          type="button" onClick={() => setPlaying((p) => !p)} data-testid="button-lifecycle-toggle"
          aria-label={playing ? 'Pause lifecycle animation' : 'Play lifecycle animation'}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#F59E0B]/60 text-[#F59E0B] transition hover:bg-[#F59E0B] hover:text-[#0F172A]"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1" aria-live="polite" aria-atomic>
          <div className="kicker" data-testid="text-lifecycle-step">{String(active + 1).padStart(2, '0')} · {step.label}</div>
          <p key={step.id} className="lc-detail mt-1.5 text-[13.5px] leading-relaxed text-[#C7CFDD]" data-testid="text-lifecycle-desc">{step.desc}</p>
        </div>
      </div>
      <ol className="sr-only">
        {STEPS.map((s, i) => <li key={s.id}>Step {i + 1}, {s.label}: {s.desc}</li>)}
      </ol>
    </div>
  );
}
