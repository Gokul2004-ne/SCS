import type { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Pill } from '@/components/kit';
import { COVERAGE_LABEL } from '@/lib/knowledge/sources';
import type { Coverage, DepType } from '@/lib/knowledge/types';

export function Hint({ children, label = 'Explain' }: { children: ReactNode; label?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={label} className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[280px] text-[12px] leading-snug">{children}</TooltipContent>
    </Tooltip>
  );
}

export function CoveragePill({ c, testId }: { c: Coverage; testId?: string }) {
  const m = COVERAGE_LABEL[c];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} data-testid={testId} className="cursor-help rounded-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Pill t={m.tone}>{m.label}</Pill>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[280px] text-[12px] leading-snug">{m.explain}</TooltipContent>
    </Tooltip>
  );
}

export const DEP_STYLE: Record<DepType, { color: string; tone: string; verb: string; explain: string }> = {
  Requires: { color: 'hsl(228 55% 30%)', tone: 'indigo', verb: 'requires', explain: 'The source clause cannot be satisfied without the target clause being in place.' },
  Related: { color: 'hsl(170 48% 30%)', tone: 'teal', verb: 'is related to', explain: 'Evidence or practice for one clause is usually relevant when auditing the other. No ordering implied.' },
  Conflicts: { color: 'hsl(8 70% 44%)', tone: 'red', verb: 'conflicts with', explain: 'Meeting one clause as interpreted may create tension with the other; requires auditor judgement.' },
};

export function DepPill({ type }: { type: DepType }) {
  return <Pill t={DEP_STYLE[type].tone}>{type}</Pill>;
}
