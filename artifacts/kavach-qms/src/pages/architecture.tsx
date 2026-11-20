import { useState } from 'react';
import { Download } from 'lucide-react';
import { useStore } from '@/lib/store';
import { exportJson } from '@/lib/export';
import { Btn, PageHead, Panel, Pill } from '@/components/kit';
import { cn } from '@/lib/utils';

const SECTIONS = [
  ['status', 'Status'], ['logical', 'Logical architecture'], ['security', 'Security'], ['deploy', 'Deployment modes'],
  ['integration', 'Integrations'], ['ai', 'AI governance'], ['scale', 'Scale'], ['roadmap', 'Roadmap'], ['workflow', 'Workflow guide'],
] as const;

const LAYERS: [string, string, string[]][] = [
  ['Experience', 'Role-aware web client', ['Auditor, auditee, quality manager, assessor read-only views', 'Offline-tolerant forms for field audits', 'Accessible, low-bandwidth rendering']],
  ['Identity and policy', 'Who may see and do what', ['SSO via SAML / OIDC to organisational IdP', 'MFA, smart-card or token for signing roles', 'RBAC for duties plus ABAC on clearance, unit, programme and need-to-know', 'Policy decision point evaluated on every request']],
  ['Workflow engine', 'Policy-driven state machine', ['Finding, rebuttal, 8D and closure states defined as versioned policy', 'Gates configurable per tenant (signatures, verification, thresholds)', 'No automatic closure transition exists in any policy', 'Escalation rules and SLA timers']],
  ['Records and evidence', 'Integrity and provenance', ['PostgreSQL for metadata, full-text search and job queue', 'Object store with immutable versions, SHA-256 digest and retention lock', 'Append-only, hash-chained event log anchored periodically', 'Evidence reuse by reference to exact version']],
  ['Integration adapters', 'Bounded connectors', ['LIMS: asset calibration status, test records', 'ALM / VCS: trace matrices, reviews, build provenance', 'ERP / maintenance: assets, suppliers, training records', 'Export: report packs for assessors']],
];

const SECURITY: [string, string][] = [
  ['Tenant isolation', 'Tenant, unit and programme scoping on every row and object key; row-level security in PostgreSQL; separate encryption keys per tenant.'],
  ['Encryption', 'TLS 1.2+ in transit; AES-256 at rest; keys in KMS or HSM with rotation and dual control; customer-held keys for enclave mode.'],
  ['PKI sign-off', 'Declarations and closures signed with organisational PKI certificates; signature covers record digest and timestamp; verification on export.'],
  ['Tamper evidence', 'Each event stores prior digest; periodic anchors written to WORM storage; integrity check job reports breaks.'],
  ['Retention', 'Configurable retention per record class; legal hold; disposal recorded as an event, never silent deletion.'],
  ['Monitoring', 'Security event forwarding to SOC; privileged access recording; anomaly alerts on bulk export.'],
];

const MODES: [string, string, string, string][] = [
  ['Private cloud / VPC', 'Managed services in an approved government or sovereign cloud region; private endpoints only.', 'Fast to stand up; managed patching, backup and scaling.', 'Requires cloud empanelment and data-classification approval; dependency on provider controls.'],
  ['On-premises', 'Containers on organisation-owned hardware in a controlled data centre.', 'Full physical control; integrates with existing IdP and LIMS directly.', 'Organisation owns patching, HA, backup and capacity; longer lead time.'],
  ['Disconnected enclave', 'Air-gapped deployment with signed offline update bundles and local AI models.', 'Suitable for the highest sensitivity; no external dependencies at runtime.', 'Manual update and evidence transfer procedures; limited integrations; higher operating cost.'],
];

const AI: string[] = [
  'Optional and off by default. Prototype contains only rule-based guidance; no model calls of any kind.',
  'Local models only in sensitive modes; retrieval restricted to an approved source register (procedures, standards licences held, past closed findings).',
  'Clearance and need-to-know filtering applied before retrieval, not after generation.',
  'Every suggestion carries citations to source documents and versions; unsupported output is suppressed.',
  'Model, version, prompt template and retrieved sources logged with each suggestion.',
  'Suggestions are drafts. A named human accepts, edits or discards; AI cannot change status, classify, accept RCA or close findings.',
  'ISO/IEC 42001 alignment: AI system inventory, risk and impact assessment, data quality controls, performance and drift monitoring, incident handling.',
];

const ROADMAP: [string, string, string[]][] = [
  ['Pilot', 'Single unit, one laboratory', ['Validate workflow with real auditors and auditees', 'Confirm clause mappings against licensed editions', 'Define record classes and retention', 'Threat model and data classification decision']],
  ['Validation and hardening', 'Multi-programme', ['Implement IdP, MFA, ABAC and PKI signing', 'Object store, event-log anchoring, backup and recovery tests', 'Independent security assessment and penetration test', 'Usability and accessibility testing']],
  ['Accreditation and procurement review', 'Regional roll-out', ['Evidence pack for NABL assessors on records and impartiality controls', 'Security accreditation for the chosen deployment mode', 'Procurement, licensing and support model', 'Operating procedures and training']],
];

const FLOW: [string, string, string, string][] = [
  ['1', 'Plan audit', 'Auditor', 'Audit programme: unit, scope, frameworks, window, lead and auditee rep.'],
  ['2', 'Issue finding', 'Auditor', 'Findings register: short title, clause, classification and objective evidence.'],
  ['3', 'Respond', 'Auditee', 'Rebuttal workspace: accept, or challenge with argument (+1 phase-1 round).'],
  ['4', 'Adjudicate', 'Auditor', 'Maintain, reclassify or withdraw. Reasons are mandatory for reclassify and withdraw.'],
  ['5', 'Escalate if needed', 'Either', `Available when total iterations reach the high-friction threshold.`],
  ['6', 'Complete 8D', 'Auditee', 'Corrective actions: D1 team to D8 lessons. Submit increments the 8D counter.'],
  ['7', 'Disposition 8D', 'Auditor', 'Accept, reject with reason (returns to revision) or mark NA with reason.'],
  ['8', 'Link evidence', 'Either', 'Evidence register: version, digest and provenance; reuse by reference.'],
  ['9', 'Verify effectiveness', 'Auditor', 'Record objective verification on the finding.'],
  ['10', 'Sign declarations', 'Both', 'Governance: impartiality and confidentiality, auditor and auditee.'],
  ['11', 'Close', 'Auditor', 'Explicit closure once all seven gates pass. Then export the dossier.'],
];

const PENDING = ['Authentication, SSO, MFA and real authorisation', 'Server-side workflow enforcement and persistence', 'Secure evidence storage, upload scanning and classification marking', 'Cryptographic hashing, PKI signatures and log anchoring', 'Integration adapters', 'Security accreditation, penetration testing and audit of the platform', 'Validation of all clause mappings against licensed standards', 'Backup, disaster recovery and operational support'];

export default function Architecture() {
  const { state } = useStore();
  const [active, setActive] = useState<string>('status');
  const go = (id: string) => { setActive(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <div>
      <PageHead code="07 / Blueprint" title="Solution architecture" sub="A reusable implementation blueprint for a production QMS / IMS assurance platform. Nothing on this page is implemented in the prototype beyond the workflow behaviour you can exercise."
        actions={<Btn data-testid="button-arch-export" onClick={() => exportJson(state)}><Download className="h-3.5 w-3.5" /> Export dossier</Btn>} />
      <div className="grid gap-6 lg:grid-cols-[190px_1fr]">
        <nav className="hidden lg:block">
          <ul className="sticky top-28 space-y-0.5 border-l border-border">
            {SECTIONS.map(([id, l]) => (
              <li key={id}><button data-testid={`button-arch-${id}`} onClick={() => go(id)} className={cn('-ml-px w-full border-l-2 px-3 py-1.5 text-left text-[12.5px] transition-colors', active === id ? 'border-[hsl(var(--saffron))] font-semibold text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>{l}</button></li>
            ))}
          </ul>
        </nav>
        <div className="space-y-6">
          <section id="status" className="scroll-mt-28 rounded-md border border-[hsl(var(--vermilion)/.35)] bg-[hsl(var(--vermilion)/.04)] p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--vermilion))]">Disclosure</div>
            <h2 className="font-display mt-1 text-[22px] text-primary">Prototype status: production work pending</h2>
            <p className="mt-1 text-[13px]">Kavach is a front-end demonstration using browser local storage. It is not certified, accredited or endorsed, and must not hold classified information. The following remain to be built and assured:</p>
            <ul className="mt-3 grid gap-1.5 md:grid-cols-2">
              {PENDING.map((p) => <li key={p} className="flex gap-2 text-[12.5px]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 border border-[hsl(var(--vermilion))]" />{p}</li>)}
            </ul>
          </section>

          <Panel title="Logical architecture" kicker="Layers" className="scroll-mt-28">
            <div id="logical" className="scroll-mt-28 divide-y divide-border">
              {LAYERS.map(([n, s, items], i) => (
                <div key={n} className="grid gap-3 px-5 py-4 md:grid-cols-[200px_1fr]">
                  <div><div className="font-mono text-[10.5px] text-[hsl(var(--saffron))]">L{i + 1}</div><div className="font-semibold text-primary">{n}</div><div className="text-[11.5px] text-muted-foreground">{s}</div></div>
                  <ul className="grid gap-1 sm:grid-cols-2">{items.map((x) => <li key={x} className="text-[12.5px] before:mr-2 before:text-[hsl(var(--saffron))] before:content-['/']">{x}</li>)}</ul>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Security controls" kicker="Design intent">
            <div id="security" className="grid scroll-mt-28 gap-px bg-border md:grid-cols-2">
              {SECURITY.map(([t, b]) => <div key={t} className="bg-card p-4"><div className="text-[13px] font-semibold text-primary">{t}</div><p className="mt-1 text-[12.5px] text-muted-foreground">{b}</p></div>)}
            </div>
          </Panel>

          <Panel title="Deployment modes" kicker="Trade-offs, none implemented">
            <div id="deploy" className="scroll-mt-28 overflow-x-auto">
              <table className="kv-table w-full"><thead><tr><th>Mode</th><th>Shape</th><th>Strengths</th><th>Costs and constraints</th></tr></thead>
                <tbody>{MODES.map(([m, a, b, c]) => <tr key={m}><td className="font-semibold text-primary">{m}</td><td>{a}</td><td>{b}</td><td>{c}</td></tr>)}</tbody></table>
            </div>
          </Panel>

          <Panel title="Integration adapter layer" kicker="Read-mostly, idempotent, audited">
            <div id="integration" className="grid scroll-mt-28 gap-4 p-5 md:grid-cols-3">
              {[['LIMS', 'Calibration status, asset registry, test records. Enables the AUD-001 style interlock.'], ['ALM / VCS / CI', 'Trace matrices, review approvals, coverage and build provenance (AUD-004 to AUD-007).'], ['ERP / HR', 'Assets, suppliers, competence and training records for auditor and personnel qualification.']].map(([t, b]) => (
                <div key={t} className="rounded-md border border-border p-3"><Pill t="indigo">{t}</Pill><p className="mt-2 text-[12.5px]">{b}</p></div>
              ))}
              <p className="text-[12px] text-muted-foreground md:col-span-3">Adapters run in a separate zone, pull through allow-listed endpoints, write through the workflow API only, and record source system, record ID and retrieval digest as provenance.</p>
            </div>
          </Panel>

          <Panel title="AI assistance and ISO/IEC 42001 governance" kicker="Optional / human approval mandatory">
            <ul id="ai" className="scroll-mt-28 divide-y divide-border">{AI.map((a, i) => <li key={i} className="flex gap-3 px-5 py-2.5 text-[12.5px]"><span className="font-mono text-[11px] text-[hsl(var(--saffron))]">{String(i + 1).padStart(2, '0')}</span>{a}</li>)}</ul>
          </Panel>

          <Panel title="Scaling path" kicker="Configurable frameworks, domains and retention">
            <div id="scale" className="grid scroll-mt-28 gap-px bg-border md:grid-cols-3">
              {[['Pilot', 'One unit, one laboratory, two to three frameworks, tens of findings per cycle.'], ['Multi-unit', 'Several units under one tenant; shared controls reused; unit-level isolation; regional quality board.'], ['Regional organisation', 'Many tenants and programmes; federated identity; per-tenant keys and retention; cross-unit lessons register.']].map(([t, b], i) => (
                <div key={t} className="bg-card p-4"><div className="font-mono text-[10.5px] text-muted-foreground">STAGE {i + 1}</div><div className="font-display text-[18px] text-primary">{t}</div><p className="mt-1 text-[12.5px] text-muted-foreground">{b}</p></div>
              ))}
            </div>
          </Panel>

          <Panel title="Roadmap" kicker="Indicative">
            <div id="roadmap" className="grid scroll-mt-28 md:grid-cols-3">
              {ROADMAP.map(([t, s, items], i) => (
                <div key={t} className="relative border-border p-5 md:border-r md:last:border-r-0">
                  <div className="absolute left-0 right-0 top-0 h-1" style={{ background: `hsl(36 88% ${70 - i * 14}%)` }} />
                  <div className="font-mono text-[10.5px] text-muted-foreground">PHASE {i + 1}</div>
                  <div className="font-display text-[18px] text-primary">{t}</div>
                  <div className="text-[11.5px] text-muted-foreground">{s}</div>
                  <ul className="mt-3 space-y-1">{items.map((x) => <li key={x} className="text-[12.5px]">{x}</li>)}</ul>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="End-to-end workflow guide" kicker="Try it in this prototype">
            <div id="workflow" className="scroll-mt-28 overflow-x-auto">
              <table className="kv-table w-full"><thead><tr><th>#</th><th>Step</th><th>Role</th><th>Where and how</th></tr></thead>
                <tbody>{FLOW.map(([n, t, r, b]) => <tr key={n}><td className="font-mono text-[hsl(var(--saffron))]">{n}</td><td className="font-semibold">{t}</td><td><Pill t={r === 'Auditor' ? 'indigo' : r === 'Auditee' ? 'amber' : 'slate'}>{r}</Pill></td><td>{b}</td></tr>)}</tbody></table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
