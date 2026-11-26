import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import Audits from '@/pages/audits';
import Findings from '@/pages/findings';
import { fixture, mount, click } from './helpers';
import {
  haversineDistance,
  isWithinGeofence,
  createGeoDigest,
  getFacilityForUnit,
  ensureAuditGeoTracking,
} from '@/lib/geo';

describe('GPS Geo-tracking and on-site photo verification', () => {
  it('correctly calculates haversine distance and geofence boundary', () => {
    const facility = getFacilityForUnit('Signals Test Laboratory (Demo Unit Alpha)');
    expect(facility.lat).toBeCloseTo(13.0358, 3);
    expect(facility.lng).toBeCloseTo(77.597, 3);
    expect(facility.radiusMeters).toBe(250);

    // Exact center
    const atCenter = isWithinGeofence(facility.lat, facility.lng, facility.lat, facility.lng, facility.radiusMeters);
    expect(atCenter.within).toBe(true);
    expect(atCenter.distanceMeters).toBe(0);

    // 15 meters away
    const near = isWithinGeofence(facility.lat + 0.0001, facility.lng + 0.00008, facility.lat, facility.lng, facility.radiusMeters);
    expect(near.within).toBe(true);
    expect(near.distanceMeters).toBeLessThan(facility.radiusMeters);

    // 600 meters away (breach)
    const far = isWithinGeofence(facility.lat + 0.005, facility.lng + 0.005, facility.lat, facility.lng, facility.radiusMeters);
    expect(far.within).toBe(false);
    expect(far.distanceMeters).toBeGreaterThan(facility.radiusMeters);
  });

  it('generates deterministic tamper-evident digests for geotag records', () => {
    const d1 = createGeoDigest('AP-26-03', 'Auditor A. Kulkarni', '2026-06-08T09:00:00Z', 13.03582, 77.59704, 'photo-base64-snippet');
    const d2 = createGeoDigest('AP-26-03', 'Auditor A. Kulkarni', '2026-06-08T09:00:00Z', 13.03582, 77.59704, 'photo-base64-snippet');
    const dDiff = createGeoDigest('AP-26-03', 'Auditor A. Kulkarni', '2026-06-08T09:00:00Z', 13.04000, 77.59704, 'photo-base64-snippet');

    expect(d1).toBeTruthy();
    expect(d1).toBe(d2);
    expect(d1).not.toBe(dDiff);
  });

  it('displays GPS tracking indicators and triggers initialization on planned audits', () => {
    const s = fixture('Auditor');
    // AP-26-03 is Planned in seed
    const plannedAudit = {
      id: 'AP-26-03',
      title: 'AI-assisted test analytics readiness review',
      scope: 'Pilot governance of local model',
      unit: 'Signals Test Laboratory (Demo Unit Alpha)',
      frameworkIds: ['iso17025'],
      start: '2026-06-08',
      end: '2026-06-10',
      lead: 'Auditor A. Kulkarni (sample)',
      auditeeRep: 'Data Lead P. Iyer (sample)',
      status: 'Planned' as const,
      signoffs: { impAuditor: null, impAuditee: null, confAuditor: null, confAuditee: null },
      geoTracking: {
        status: 'Not Initialized' as const,
        facility: getFacilityForUnit('Signals Test Laboratory (Demo Unit Alpha)'),
        pings: [],
        clausesUnlocked: false,
      },
    };
    s.audits.push(plannedAudit);

    const h = mount(s, <Audits />, '/audits');

    // Should display GPS Tracking Pending badge
    expect(screen.getByTestId('badge-gps-pending-AP-26-03')).toBeInTheDocument();

    // Click "Initialize GPS & Photo" button
    click('button-init-gps-AP-26-03');

    // GeoTracking modal opens
    expect(screen.getByText(/Initialize GPS Geo-Tracking \/\/ AP-26-03/)).toBeInTheDocument();
    expect(screen.getAllByText('Signals Test Laboratory (Demo Unit Alpha)').length).toBeGreaterThan(1);
    expect(screen.getByText(/Within Premises/)).toBeInTheDocument();

    // Click "Authorized ID Badge" to load sample photo
    fireEvent.click(screen.getByText(/Authorized ID Badge/));

    // Confirm geotag
    click('button-confirm-geotag-init');

    // Status should advance to Fieldwork and active tracking
    const updated = h.state.audits.find(a => a.id === 'AP-26-03')!;
    expect(updated.status).toBe('Fieldwork');
    expect(updated.geoTracking?.status).toBe('Active');
    expect(updated.geoTracking?.clausesUnlocked).toBe(true);
    expect(updated.geoTracking?.startRecord).toBeDefined();
    expect(updated.geoTracking?.startRecord?.withinGeofence).toBe(true);
  });

  it('prevents audit from advancing from Planned to Fieldwork without GPS initialization', () => {
    const s = fixture('Auditor');
    const plannedAudit = {
      id: 'AP-26-99',
      title: 'Avionics radar calibration audit',
      scope: 'Radar sensor bench calibration',
      unit: 'Signals Test Laboratory (Demo Unit Alpha)',
      frameworkIds: ['iso17025'],
      start: '2026-07-01',
      end: '2026-07-05',
      lead: 'Auditor A. Kulkarni (sample)',
      auditeeRep: 'Lab Manager S. Bhide (sample)',
      status: 'Planned' as const,
      signoffs: { impAuditor: null, impAuditee: null, confAuditor: null, confAuditee: null },
      geoTracking: {
        status: 'Not Initialized' as const,
        facility: getFacilityForUnit('Signals Test Laboratory (Demo Unit Alpha)'),
        pings: [],
        clausesUnlocked: false,
      },
    };
    s.audits.push(plannedAudit);

    const h = mount(s, <Audits />, '/audits');

    // Click "Move to Fieldwork"
    click('button-advance-AP-26-99');

    // Should intercept and open the GPS modal
    expect(screen.getByText(/Initialize GPS Geo-Tracking \/\/ AP-26-99/)).toBeInTheDocument();
    // Audit status in state is still Planned until confirmed
    expect(h.state.audits.find(a => a.id === 'AP-26-99')?.status).toBe('Planned');
  });

  it('locks clause findings when an audit has not completed GPS initialization', () => {
    const s = fixture('Auditor');
    const uninitAudit = {
      id: 'AP-26-88',
      title: 'Uninitialized Security Control System telemetry audit',
      scope: 'Telemetry review',
      unit: 'Signals Test Laboratory (Demo Unit Alpha)',
      frameworkIds: ['iso17025'],
      start: '2026-08-01',
      end: '2026-08-05',
      lead: 'Auditor A. Kulkarni (sample)',
      auditeeRep: 'Lab Manager S. Bhide (sample)',
      status: 'Planned' as const,
      signoffs: { impAuditor: null, impAuditee: null, confAuditor: null, confAuditee: null },
      geoTracking: {
        status: 'Not Initialized' as const,
        facility: getFacilityForUnit('Signals Test Laboratory (Demo Unit Alpha)'),
        pings: [],
        clausesUnlocked: false,
      },
    };
    s.audits = [uninitAudit];

    mount(s, <Findings />, '/findings');

    // Click Issue finding
    click('button-new-finding');

    // Should show warning banner that fieldwork is locked
    expect(screen.getByText(/Audit AP-26-88 Fieldwork Not Initialized/)).toBeInTheDocument();
    expect(screen.getByTestId('button-issue-finding')).toBeDisabled();
  });
});
