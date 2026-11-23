export type Role = 'Auditor' | 'Auditee';
export type Classification = 'Major NC' | 'Minor NC' | 'Observation' | 'Not Applicable';
export type P1Status = 'Issued' | 'In Rebuttal' | 'Accepted' | 'Withdrawn';
export type RcaStatus = 'Locked' | 'Draft' | 'Submitted' | 'Rejected' | 'Accepted' | 'Not Applicable';
export type AuditStatus = 'Planned' | 'Fieldwork' | 'Reporting' | 'Follow-up' | 'Closed';

export interface Msg {
  role: Role;
  round: number;
  text: string;
  at: string;
  kind: string;
}

export interface Rca {
  status: RcaStatus;
  d1: string;
  d2: { what: string; where: string; when: string; who: string; why: string; how: string; howMany: string };
  d3: string;
  whys: string[];
  rootCause: string;
  escapePoint: string;
  d5: string;
  d6: string;
  d7: string;
  d8: string;
  p2Iterations: number;
  p2History: Msg[];
  naReason: string;
}

export interface Finding {
  id: string;
  auditId: string;
  frameworkId: string;
  clause: string;
  title: string;
  classification: Classification;
  evidence: string;
  raisedAt: string;
  p1Status: P1Status;
  p1Iterations: number;
  p1History: Msg[];
  rca: Rca;
  effectiveness: { verified: boolean; note: string; at: string };
  closedAt: string;
  escalation: { active: boolean; reason: string; at: string };
}

export interface Signoff {
  by: string;
  at: string;
  digest: string;
}

export type SignKey = 'impAuditor' | 'impAuditee' | 'confAuditor' | 'confAuditee';

export interface GeoRecord {
  photo: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
  auditor: string;
  facilityName: string;
  distanceMeters: number;
  withinGeofence: boolean;
  digest: string;
}

export interface GeoPing {
  lat: number;
  lng: number;
  timestamp: string;
  withinGeofence: boolean;
  distanceMeters: number;
  note?: string;
}

export interface AuditGeoTracking {
  status: 'Not Initialized' | 'Active' | 'Completed' | 'Geofence Breached';
  facility: {
    name: string;
    lat: number;
    lng: number;
    radiusMeters: number;
    locationDesc?: string;
  };
  startRecord?: GeoRecord;
  endRecord?: GeoRecord;
  pings: GeoPing[];
  clausesUnlocked: boolean;
}

export interface Audit {
  id: string;
  title: string;
  scope: string;
  unit: string;
  frameworkIds: string[];
  start: string;
  end: string;
  lead: string;
  auditeeRep: string;
  status: AuditStatus;
  signoffs: Record<SignKey, Signoff | null>;
  geoTracking?: AuditGeoTracking;
}

export interface Evidence {
  id: string;
  title: string;
  findingId: string;
  type: string;
  version: string;
  uri: string;
  digest: string;
  provenance: string;
  submittedBy: Role;
  at: string;
  supersedes: string;
  reusedIn: string[];
}

export interface Control {
  id: string;
  title: string;
  clause: string;
  custom: boolean;
}

export interface Framework {
  id: string;
  code: string;
  name: string;
  kind: string;
  scheme: string;
  applicable: boolean;
  note: string;
  controls: Control[];
  custom: boolean;
}

export interface SharedControl {
  id: string;
  title: string;
  owner: string;
  mappings: { frameworkId: string; clause: string }[];
}

export interface Settings {
  orgName: string;
  unitName: string;
  programme: string;
  auditorName: string;
  auditeeName: string;
  highThreshold: number;
  moderateThreshold: number;
  retentionYears: number;
  findingPrefix: string;
  impartialityText: string;
  confidentialityText: string;
  reportFooter: string;
}

export interface LogEvent {
  seq: number;
  at: string;
  role: Role;
  action: string;
  ref: string;
  prev: string;
  digest: string;
}

export interface State {
  version: number;
  role: Role;
  audits: Audit[];
  findings: Finding[];
  evidence: Evidence[];
  frameworks: Framework[];
  shared: SharedControl[];
  settings: Settings;
  log: LogEvent[];
}
