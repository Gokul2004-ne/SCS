import type { AuditDossier } from './audit-dossier';
import { spreadsheetRows } from './audit-dossier';

export type AuditFormat = 'pdf' | 'xlsx' | 'docx';

export async function generateAuditFile(dossier: AuditDossier, format: AuditFormat): Promise<Blob> {
  if (format === 'xlsx') {
    const { default: ExcelJS } = await import('exceljs');
    const book = new ExcelJS.Workbook();
    book.creator = 'Auditor 365';
    book.created = new Date(dossier.generatedAt);
    for (const section of dossier.sections) {
      const sheet = book.addWorksheet(section.title.slice(0, 31));
      sheet.columns = [{ header: 'Field / record path', key: 'field', width: 48 }, { header: 'Recorded value', key: 'value', width: 110 }];
      for (const [field, value] of spreadsheetRows(section.rows)) {
        // Explicit strings, never ExcelJS formula objects or hyperlinks.
        sheet.addRow({ field, value });
      }
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF14233D' } };
      sheet.eachRow(row => { row.alignment = { vertical: 'top', wrapText: true }; });
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
    }
    const bytes = await book.xlsx.writeBuffer();
    return new Blob([new Uint8Array(bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  if (format === 'docx') {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    const children = [
      new Paragraph({ text: `Auditor 365 | ${dossier.id}`, heading: HeadingLevel.TITLE }),
      new Paragraph(dossier.title),
      ...dossier.sections.flatMap(section => [
        new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }),
        ...section.rows.flatMap(([label, value]) => [
          new Paragraph({ children: [new TextRun({ text: label, bold: true })], keepNext: true }),
          ...value.split(/\r?\n/).map(text => new Paragraph({ text, spacing: { after: 100 } })),
        ]),
      ]),
    ];
    return Packer.toBlob(new Document({ creator: 'Auditor 365', title: dossier.title, sections: [{ children }] }));
  }
  if (format !== 'pdf') throw new Error('Unsupported export format.');
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts'),
  ]);
  pdfMake.addVirtualFileSystem(fonts);
  const file = pdfMake.createPdf({
    info: { title: `${dossier.id} — ${dossier.title}`, author: 'Auditor 365' },
    pageSize: 'A4', pageMargins: [40, 45, 40, 45],
    defaultStyle: { font: 'Roboto', fontSize: 9 },
    content: [
      { text: `Auditor 365 | ${dossier.id}`, fontSize: 20, bold: true, color: '#14233D' },
      { text: dossier.title, margin: [0, 6, 0, 14] },
      ...dossier.sections.flatMap(section => [
        { text: section.title, fontSize: 14, bold: true, margin: [0, 16, 0, 8] as [number, number, number, number] },
        ...section.rows.flatMap(([label, value]) => [
          { text: label, bold: true, margin: [0, 7, 0, 2] as [number, number, number, number] },
          { text: value },
        ]),
      ]),
    ],
    footer: (page: number, pages: number) => ({ text: `${dossier.id} • Demonstration • ${page} / ${pages}`, alignment: 'center', fontSize: 8 }),
  });
  return file.getBlob();
}

export function saveAuditFile(blob: Blob, dossier: AuditDossier, format: AuditFormat) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Auditor365-${dossier.id.replace(/[^a-z0-9_-]/gi, '_')}-${dossier.generatedAt.slice(0, 10)}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
