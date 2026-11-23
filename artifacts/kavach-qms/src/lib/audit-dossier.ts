import type { State } from './types';

export interface DossierSection { title: string; rows: [string, string][] }
export interface AuditDossier { id: string; title: string; generatedAt: string; sections: DossierSection[] }

/** Lossless leaf projection: preserves empty values, rounds, nested fields and arrays. */
export function recordRows(value: unknown, path = ''): [string, string][] {
  if (value === null || value === undefined) return [[path, 'Not recorded']];
  if (Array.isArray(value)) return value.length ? value.flatMap((v, i) => recordRows(v, `${path}[${i + 1}]`)) : [[path, 'None recorded']];
  if (typeof value === 'object') return Object.entries(value).flatMap(([key, v]) => recordRows(v, path ? `${path}.${key}` : key));
  return [[path, String(value) || 'Not recorded']];
}

/**
 * Uses the caller's authorised state, never reloads the whole workspace.
 * Current app is a local demo; server authorisation must precede this projection
 * when protected accounts are merged.
 */
export function buildAuditDossier(state: State, auditId: string): AuditDossier {
  const audit = state.audits.find(a => a.id === auditId);
  if (!audit) throw new Error('Audit is unavailable in this workspace.');
  const findings = state.findings.filter(f => f.auditId === audit.id);
  const findingIds = new Set(findings.map(f => f.id));
  const evidence = state.evidence.filter(e => findingIds.has(e.findingId));
  const refs = new Set([audit.id, ...findingIds, ...evidence.map(e => e.id)]);
  const generatedAt = new Date().toISOString();
  return {
    id: audit.id, title: audit.title, generatedAt,
    sections: [
      { title: 'Export notes', rows: [
        ['Generated at', generatedAt],
        ['Workspace', 'DEMONSTRATION — browser-local sample records. Not for classified information.'],
        ['Completeness', 'Includes all currently recorded fields for this audit. Unrecorded or overwritten revisions cannot be reconstructed. Global events without an audit reference are excluded.'],
        ['Digital signatures', 'Declaration signer, signed date and digest are included as recorded. Existing digests are simulated, non-cryptographic references, NOT certificate-backed digital signatures. Signed version is not recorded in this demo.'],
        ['Evidence', 'Metadata and references only; evidence files are not embedded.'],
      ] },
      { title: 'Audit', rows: recordRows(audit) },
      { title: 'Frameworks', rows: recordRows(state.frameworks.filter(f => audit.frameworkIds.includes(f.id))) },
      { title: 'Findings and all rounds', rows: recordRows(findings) },
      { title: 'Evidence references', rows: recordRows(evidence.map(e => ({ ...e, reusedIn: e.reusedIn.filter(id => findingIds.has(id)) }))) },
      { title: 'Audit event log', rows: recordRows(state.log.filter(e => refs.has(e.ref))) },
      { title: 'Declaration wording', rows: [
        ['Impartiality', state.settings.impartialityText],
        ['Confidentiality', state.settings.confidentialityText],
        ['Report footer', state.settings.reportFooter],
      ] },
    ],
  };
}

/** XLSX cells have a hard 32,767-character limit; continuation rows avoid loss. */
export function spreadsheetRows(rows: [string, string][]): [string, string][] {
  return rows.flatMap(([key, value]) => {
    const result: [string, string][] = [];
    for (let i = 0; i < value.length || i === 0; i += 30000) {
      result.push([i ? `${key} (continued ${i / 30000 + 1})` : key, value.slice(i, i + 30000)]);
    }
    return result;
  });
}
