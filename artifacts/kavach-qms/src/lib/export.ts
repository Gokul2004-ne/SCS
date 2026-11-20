import type { State } from './types';
import { friction, stageOf, totalIterations } from './store';

function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

const esc = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const stamp = () => new Date().toISOString().slice(0, 10);

export function exportCsv(state: State) {
  const head = ['Finding ID', 'Audit', 'Framework', 'Clause', 'Title', 'Classification', 'Phase-1 status', 'Phase-1 rounds', 'RCA status', '8D rounds', 'Total iterations', 'Friction', 'Escalated', 'Effectiveness verified', 'Stage', 'Closed at'];
  const rows = state.findings.map((f) => {
    const a = state.audits.find((x) => x.id === f.auditId);
    const fw = state.frameworks.find((x) => x.id === f.frameworkId);
    return [f.id, f.auditId, fw?.code, f.clause, f.title, f.classification, f.p1Status, f.p1Iterations, f.rca.status, f.rca.p2Iterations, totalIterations(f), friction(f, state.settings), f.escalation.active ? 'Yes' : 'No', f.effectiveness.verified ? 'Yes' : 'No', stageOf(f, a), f.closedAt];
  });
  const csv = ['# ' + state.settings.reportFooter, head.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  download(`kavach-findings-${stamp()}.csv`, csv, 'text/csv;charset=utf-8');
}

export function exportJson(state: State) {
  const dossier = {
    notice: 'DEMONSTRATION - SAMPLE DATA - NOT FOR CLASSIFIED INFORMATION. Digests are simulated, not cryptographic. Clause mappings require licensed standard/edition validation.',
    generatedAt: new Date().toISOString(),
    frictionDefinition: { high: `total iterations >= ${state.settings.highThreshold}`, moderate: `total iterations >= ${state.settings.moderateThreshold}` },
    ...state,
  };
  download(`kavach-dossier-${stamp()}.json`, JSON.stringify(dossier, null, 2), 'application/json');
}
