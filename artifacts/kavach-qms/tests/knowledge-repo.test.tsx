import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import Page from '@/pages/knowledge-repo';
import { TooltipProvider } from '@/components/ui/tooltip';
import { seedState } from '@/lib/seed';
import { KR_KEY } from '@/lib/knowledge/storage';
import { mount, click, fill } from './helpers';

vi.mock('@/components/knowledge/dependency-graph', () => ({ DependencyGraph: () => <div data-testid="graph-stub" /> }));

const KnowledgeRepo = () => <TooltipProvider><Page /></TooltipProvider>;
const withRole = (role: 'Auditor' | 'Auditee') => { const s = structuredClone(seedState()); s.role = role; return s; };

describe('Knowledge repository page', () => {
  it('shows an access-restricted state to the simulated auditee without changing role', () => {
    const h = mount(withRole('Auditee'), <KnowledgeRepo />, '/knowledge-repo');
    expect(screen.getByTestId('state-access-restricted')).toHaveTextContent(/not a security control/i);
    expect(screen.queryByTestId('button-add-dependency')).toBeNull();
    expect(h.state.role).toBe('Auditee');
  });

  it('shows coverage labels and source citation for a clause', () => {
    mount(withRole('Auditor'), <KnowledgeRepo />, '/knowledge-repo');
    click('button-clause-iso15504-1:4.3');
    expect(screen.getByTestId('text-body-availability')).toHaveTextContent(/contents heading only/i);
    expect(screen.getByTestId('text-source-file')).toHaveTextContent('ISO-IEC-15504-1-2004_1795364715753.pdf');
    click('button-clause-iso17025:7.10');
    expect(screen.getByTestId('text-body-availability')).toHaveTextContent('PDF page 24');
    expect(screen.getByTestId('button-upload-pdf')).toBeDisabled();
  });

  it('creates a dependency with rationale and persists it across reload', () => {
    const s = withRole('Auditor');
    const h = mount(s, <KnowledgeRepo />, '/knowledge-repo');
    click('button-clause-iso17025:8.7');
    click('button-add-dependency-from');
    click('radio-dep-type-requires');
    fireEvent.change(screen.getByTestId('select-dep-target'), { target: { value: 'iso17025:7.10' } });
    fill('input-dep-rationale', '   ');
    click('button-save-dependency');
    expect(screen.getByText(/Rationale is required/)).toBeInTheDocument();
    fill('input-dep-rationale', 'Corrective action follows nonconforming work.');
    click('button-save-dependency');
    const stored = JSON.parse(localStorage.getItem(KR_KEY)!);
    expect(stored.dependencies).toHaveLength(1);
    expect(stored.dependencies[0]).toMatchObject({ sourceId: 'iso17025:8.7', targetId: 'iso17025:7.10', type: 'Requires', createdBy: 'Auditor' });
    h.unmount();
    mount(s, <KnowledgeRepo />, '/knowledge-repo');
    expect(screen.getByTestId('relationship-list')).toHaveTextContent('Corrective action follows nonconforming work.');
  });
});
