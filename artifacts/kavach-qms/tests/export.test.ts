import { expect, it, vi } from 'vitest';
import { exportCsv, exportJson } from '@/lib/export';
import { fixture, ready } from './helpers';

function captureDownload() {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(new Date('2026-11-20T12:00:00Z'));
  const create = vi.fn((_blob: Blob) => 'blob:test');
  const revoke = vi.fn();
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = create;
    static revokeObjectURL = revoke;
  });
  let name = '';
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { name = this.download; });
  return { create, revoke, name: () => name, text: () => new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(create.mock.calls[0][0] as Blob);
  }) };
}

it('exports CSV rounds, gate stages and escaped multiline evidence titles', async () => {
  const download = captureDownload(), s = ready(), f = s.findings[0];
  f.title = 'Calibration, "sample"\nreview'; f.p1Iterations = 2; f.rca.p2Iterations = 3;
  s.settings.highThreshold = 5; f.escalation.active = true;
  const closed = structuredClone(f);
  closed.id = 'CLOSED'; closed.closedAt = '2026-11-19T10:00:00Z';
  const withdrawn = structuredClone(f);
  withdrawn.id = 'WITHDRAWN'; withdrawn.p1Status = 'Withdrawn';
  s.findings.push(closed, withdrawn);
  exportCsv(s);
  const csv = await download.text();
  expect(download.name()).toBe('kavach-findings-2026-11-20.csv');
  expect(csv).toContain('"Calibration, ""sample""\nreview"');
  expect(csv).toContain(',Accepted,2,Accepted,3,5,High,Yes,Yes,Closure gate,');
  expect(csv).toContain(',Closed,2026-11-19T10:00:00Z');
  expect(csv).toContain(',Withdrawn,');
  expect(csv).toContain('Phase-1 rounds,RCA status,8D rounds,Total iterations');
  expect(document.querySelector('a[download]')).toBeNull();
  vi.advanceTimersByTime(500);
  expect(download.revoke).toHaveBeenCalledWith('blob:test');
});

it('exports a complete JSON dossier including histories, signatures and simulation warnings', async () => {
  const download = captureDownload(), s = ready(fixture());
  s.findings[0].p1History.push({ role: 'Auditee', round: 1, text: 'Accepted', at: '2026-11-20', kind: 'accept' });
  exportJson(s);
  const dossier = JSON.parse(await download.text());
  expect(download.name()).toBe('kavach-dossier-2026-11-20.json');
  expect(dossier).toMatchObject(s);
  expect(dossier.notice).toContain('Digests are simulated, not cryptographic');
  expect(dossier.generatedAt).toBe('2026-11-20T12:00:00.000Z');
  expect(dossier.frictionDefinition.high).toBe(`total iterations >= ${s.settings.highThreshold}`);
});
