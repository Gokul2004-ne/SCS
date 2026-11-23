// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { seedState } from '../src/lib/seed';
import { buildAuditDossier, spreadsheetRows } from '../src/lib/audit-dossier';
import { generateAuditFile } from '../src/lib/audit-download';
import { demoVisibleState, demoMutationAllowed, demoRouteAllowed } from '../src/lib/demo-access';
import ExcelJS from 'exceljs';
import { writeFile, mkdir } from 'node:fs/promises';

describe('Per-audit dossiers', () => {
  it('includes all recorded rounds and excludes unrelated audits and logs', () => {
    const state = seedState();
    const a = state.audits[0];
    state.findings.find(f => f.auditId === a.id)!.p1History.push({ role: 'Auditor', round: 44, text: 'A unique historical round', at: '2026-11-23', kind: 'test' });
    state.log.push({ seq: 2, at: '2026-11-23', role: 'Auditor', action: 'A unique event', ref: a.id, prev: '', digest: 'reference' });
    const text = JSON.stringify(buildAuditDossier(state, a.id));
    expect(text).toContain('A unique historical round');
    expect(text).toContain('A unique event');
    expect(text).toContain('Digital signatures');
    expect(text).not.toContain(state.audits[1].title);
    expect(text).not.toContain('Workspace seeded');
    expect(() => buildAuditDossier(state, 'unknown')).toThrow();
  });
  it('splits very long Excel cells without losing text', () => {
    const value = 'a'.repeat(80000);
    expect(spreadsheetRows([['text', value]]).map(r => r[1]).join('')).toBe(value);
  });
  it('creates genuine PDF, XLSX and DOCX files', async () => {
    const state = seedState();
    const dossier = buildAuditDossier(state, state.audits[0].id);
    dossier.sections[0].rows.push(['Untrusted text', '=HYPERLINK("https://example.com")']);
    await mkdir('/tmp/auditor365-export-check', { recursive: true });
    for (const format of ['pdf', 'xlsx', 'docx'] as const) {
      const blob = await generateAuditFile(dossier, format);
      const bytes = Buffer.from(await blob.arrayBuffer());
      expect(bytes.byteLength).toBeGreaterThan(1000);
      expect(bytes.subarray(0, format === 'pdf' ? 4 : 2).toString()).toBe(format === 'pdf' ? '%PDF' : 'PK');
      await writeFile(`/tmp/auditor365-export-check/audit.${format}`, bytes);
      if (format === 'xlsx') {
        const book = new ExcelJS.Workbook();
        await book.xlsx.load(bytes);
        const sheet = book.getWorksheet('Export notes')!;
        expect(sheet.lastRow!.getCell(2).type).toBe(ExcelJS.ValueType.String);
        expect(sheet.lastRow!.getCell(2).value).toBe('=HYPERLINK("https://example.com")');
        expect(book.worksheets.length).toBe(dossier.sections.length);
      }
    }
  }, 60000);
});

describe('Explicitly simulated auditee perspective', () => {
  it('limits records and navigation to the assigned sample representative', () => {
    const state = seedState();
    state.role = 'Auditee';
    const scoped = demoVisibleState(state);
    expect(scoped.audits.length).toBeGreaterThan(0);
    expect(scoped.audits.length).toBeLessThan(state.audits.length);
    expect(scoped.audits.every(a => a.auditeeRep === state.settings.auditeeName)).toBe(true);
    expect(scoped.findings.every(f => scoped.audits.some(a => a.id === f.auditId))).toBe(true);
    expect(demoRouteAllowed('Auditee', '/knowledge-repo')).toBe(false);
    expect(demoRouteAllowed('Auditee', '/findings/a')).toBe(true);
    expect(demoRouteAllowed('Auditor', '/settings')).toBe(true);
    const excluded = state.audits.find(a => !scoped.audits.some(v => v.id === a.id))!;
    expect(() => buildAuditDossier(scoped, excluded.id)).toThrow();
  });
  it('permits only the own declaration and rejects other edits', () => {
    const before = seedState();
    before.role = 'Auditee';
    const after = structuredClone(before);
    const audit = after.audits.find(a => a.auditeeRep === before.settings.auditeeName)!;
    audit.signoffs.impAuditee = { by: before.settings.auditeeName, at: '2026-11-23', digest: 'demo' };
    expect(demoMutationAllowed(before, after, 'Declaration signed: impAuditee', audit.id)).toBe(true);
    audit.title = 'Changed';
    expect(demoMutationAllowed(before, after, 'Declaration signed: impAuditee', audit.id)).toBe(false);
    expect(demoMutationAllowed(before, after, 'Audit updated', audit.id)).toBe(false);
  });
});
