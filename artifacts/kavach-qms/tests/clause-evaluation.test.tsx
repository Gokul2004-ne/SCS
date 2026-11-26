import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { fixture, mount, click, fill } from './helpers';
import Findings from '@/pages/findings';

describe('Sequential Clause Evaluation and Objective Evidence Box', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('displays accurate ISO clauses and enforces sequential unlocking when compliant', () => {
    const s = fixture('Auditor');
    // Ensure audit is initialized for fieldwork
    s.audits[0].geoTracking = {
      status: 'Active',
      facility: {
        name: 'Signals Test Laboratory (Demo Unit Alpha)',
        lat: 13.03582,
        lng: 77.59704,
        radiusMeters: 250,
        locationDesc: 'Security Control System Avionics & Radar Complex, Jalahalli, Bengaluru (Karnataka)',
      },
      startRecord: {
        photo: 'data:image/svg+xml;utf8,<svg></svg>',
        lat: 13.03582,
        lng: 77.59704,
        accuracy: 4.2,
        timestamp: '2026-02-16T08:30:00Z',
        auditor: 'Auditor A. Kulkarni',
        facilityName: 'Signals Test Laboratory (Demo Unit Alpha)',
        distanceMeters: 14,
        withinGeofence: true,
        digest: 'test-digest',
      },
      pings: [],
      clausesUnlocked: true,
    };

    mount(s, <Findings />, '/findings');

    // Open issue finding modal
    click('button-new-finding');

    // Initial framework is ISO/IEC 17025
    expect(screen.getByText('Framework Clauses & Conformance Evaluation')).toBeInTheDocument();
    expect(screen.getByText('Clause 4.1')).toBeInTheDocument();
    expect(screen.getByText('Impartiality')).toBeInTheDocument();

    // Clause 4.2 should initially be locked because 4.1 is not yet compliant
    const lockedIndicators = screen.getAllByText(/Locked/);
    expect(lockedIndicators.length).toBeGreaterThan(0);

    // Mark Clause 4.1 as Compliant
    const compliantButtons = screen.getAllByRole('button', { name: /Compliant/i });
    fireEvent.click(compliantButtons[0]);

    // Now Clause 4.1 should show compliant status
    expect(screen.getAllByText('Compliant').length).toBeGreaterThan(1);

    // Objective Evidence box should remain disabled/not active since no clause is non-compliant
    const evidenceInput = screen.getByTestId('input-new-evidence') as HTMLInputElement;
    expect(evidenceInput.disabled).toBe(true);
  });

  it('unlocks Objective Evidence & Description box when non-compliant and issues finding', () => {
    const s = fixture('Auditor');
    s.audits[0].geoTracking = {
      status: 'Active',
      facility: {
        name: 'Signals Test Laboratory (Demo Unit Alpha)',
        lat: 13.03582,
        lng: 77.59704,
        radiusMeters: 250,
        locationDesc: 'Security Control System Avionics & Radar Complex, Jalahalli, Bengaluru (Karnataka)',
      },
      startRecord: {
        photo: 'data:image/svg+xml;utf8,<svg></svg>',
        lat: 13.03582,
        lng: 77.59704,
        accuracy: 4.2,
        timestamp: '2026-02-16T08:30:00Z',
        auditor: 'Auditor A. Kulkarni',
        facilityName: 'Signals Test Laboratory (Demo Unit Alpha)',
        distanceMeters: 14,
        withinGeofence: true,
        digest: 'test-digest',
      },
      pings: [],
      clausesUnlocked: true,
    };

    const view = mount(s, <Findings />, '/findings');

    // Open modal
    click('button-new-finding');

    // Mark Clause 4.1 as Non-compliant
    const nonCompliantButtons = screen.getAllByRole('button', { name: /Non-compliant/i });
    fireEvent.click(nonCompliantButtons[0]);

    // Check that title input has appeared and is pre-filled
    const titleInput = screen.getByTestId('input-new-title') as HTMLInputElement;
    expect(titleInput.value).toContain('4.1 Impartiality non-conformance');

    // Evidence box should now be enabled
    const evidenceInput = screen.getByTestId('input-new-evidence') as HTMLInputElement;
    expect(evidenceInput.disabled).toBe(false);

    // Fill evidence
    fireEvent.change(evidenceInput, {
      target: { value: 'Commercial bias identified during contract review for prototype testing.' },
    });

    // Check button label changed to "Resend & Issue Finding"
    const submitBtn = screen.getByTestId('button-issue-finding');
    expect(submitBtn).toHaveTextContent(/Resend & Issue Finding/);

    // Click submit
    fireEvent.click(submitBtn);

    // Check that finding was created
    const created = view.state.findings.find((f) => f.clause === '4.1');
    expect(created).toBeDefined();
    expect(created?.title).toContain('4.1 Impartiality');
    expect(created?.evidence).toContain('Commercial bias identified');
  });

  it('switches framework and accurately displays ISO 9001 clauses', () => {
    const s = fixture('Auditor');
    s.audits[0].geoTracking = {
      status: 'Active',
      facility: {
        name: 'Signals Test Laboratory (Demo Unit Alpha)',
        lat: 13.03582,
        lng: 77.59704,
        radiusMeters: 250,
        locationDesc: 'Security Control System Avionics & Radar Complex, Jalahalli, Bengaluru (Karnataka)',
      },
      startRecord: {
        photo: 'data:image/svg+xml;utf8,<svg></svg>',
        lat: 13.03582,
        lng: 77.59704,
        accuracy: 4.2,
        timestamp: '2026-02-16T08:30:00Z',
        auditor: 'Auditor A. Kulkarni',
        facilityName: 'Signals Test Laboratory (Demo Unit Alpha)',
        distanceMeters: 14,
        withinGeofence: true,
        digest: 'test-digest',
      },
      pings: [],
      clausesUnlocked: true,
    };

    mount(s, <Findings />, '/findings');

    click('button-new-finding');

    // Change framework to ISO 9001
    fireEvent.change(screen.getByTestId('select-new-framework'), {
      target: { value: 'iso9001' },
    });

    // Expect ISO 9001 clauses
    expect(screen.getByText('Context of the Organization')).toBeInTheDocument();
    expect(screen.getByText('Clause 4.1')).toBeInTheDocument();
  });
});
