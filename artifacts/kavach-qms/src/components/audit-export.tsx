import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { buildAuditDossier } from '@/lib/audit-dossier';
import { generateAuditFile, saveAuditFile, type AuditFormat } from '@/lib/audit-download';
import { Btn } from '@/components/kit';
import { useToast } from '@/hooks/use-toast';

export function AuditExport({ auditId }: { auditId: string }) {
  const { state } = useStore();
  const { toast } = useToast();
  const [busy, setBusy] = useState<AuditFormat | null>(null);
  const [error, setError] = useState('');
  const download = async (format: AuditFormat) => {
    if (busy) return;
    setBusy(format);
    setError('');
    try {
      const dossier = buildAuditDossier(state, auditId);
      const blob = await generateAuditFile(dossier, format);
      saveAuditFile(blob, dossier, format);
      toast({ title: `${auditId} ${format.toUpperCase()} prepared`, description: 'Includes all recorded audit data. Check your browser downloads.' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not export this audit. Please try again.');
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-1.5" aria-label={`Export ${auditId}`}>
        {(['pdf', 'xlsx', 'docx'] as const).map(format => (
          <Btn key={format} disabled={busy !== null} onClick={() => void download(format)} data-testid={`export-${auditId}-${format}`}>
            {busy === format ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {format === 'xlsx' ? 'Excel' : format === 'docx' ? 'Word' : 'PDF'}
          </Btn>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">Complete recorded dossier • simulated signatures</p>
      {error && <p role="alert" className="mt-1 max-w-xs text-xs text-destructive">{error}</p>}
    </div>
  );
}
