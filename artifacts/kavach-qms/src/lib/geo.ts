import { digest } from './digest';
import type { GeoRecord, AuditGeoTracking, GeoPing, Audit } from './types';

export interface FacilityInfo {
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  locationDesc: string;
}

export const FACILITIES: Record<string, FacilityInfo> = {
  'Signals Test Laboratory (Demo Unit Alpha)': {
    name: 'Signals Test Laboratory (Demo Unit Alpha)',
    lat: 13.03582,
    lng: 77.59704,
    radiusMeters: 250,
    locationDesc: 'Security Control System Avionics & Radar Complex, Jalahalli, Bengaluru (Karnataka)',
  },
  'Software Engineering Cell (Demo Unit Bravo)': {
    name: 'Software Engineering Cell (Demo Unit Bravo)',
    lat: 17.44351,
    lng: 78.37724,
    radiusMeters: 300,
    locationDesc: 'Security Control System Embedded Systems Centre, Kanchanbagh, Hyderabad (Telangana)',
  },
  'Default Security Control System Facility': {
    name: 'Integrated Quality & Metrology Wing',
    lat: 28.61394,
    lng: 77.20902,
    radiusMeters: 250,
    locationDesc: 'Security Control System Research Headquarters, Central Complex, New Delhi',
  },
};

export function getFacilityForUnit(unit: string): FacilityInfo {
  if (FACILITIES[unit]) return FACILITIES[unit];
  const found = Object.values(FACILITIES).find((f) => unit.toLowerCase().includes(f.name.toLowerCase()));
  if (found) return found;
  return {
    name: unit || 'Security Control System Testing Facility',
    lat: 13.03582,
    lng: 77.59704,
    radiusMeters: 250,
    locationDesc: `${unit} - Authorized Testing Premise`,
  };
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function isWithinGeofence(
  currentLat: number,
  currentLng: number,
  facilityLat: number,
  facilityLng: number,
  radiusMeters: number,
): { within: boolean; distanceMeters: number } {
  const distanceMeters = haversineDistance(currentLat, currentLng, facilityLat, facilityLng);
  return { within: distanceMeters <= radiusMeters, distanceMeters };
}

export function createGeoDigest(
  auditId: string,
  auditor: string,
  timestamp: string,
  lat: number,
  lng: number,
  photoHashOrSnippet: string,
): string {
  const payload = `${auditId}::${auditor}::${timestamp}::${lat.toFixed(6)},${lng.toFixed(6)}::${photoHashOrSnippet.slice(0, 32)}`;
  return digest(payload);
}

/**
 * Generates an auditor verification portrait badge with Security Control System metadata watermark
 */
export function generateSampleAuditorPhoto(
  auditorName: string,
  auditId: string,
  lat: number,
  lng: number,
  timestamp: string,
): string {
  const dateFormatted = timestamp.replace('T', ' ').slice(0, 19);
  const cleanId = auditId.replace(/[^a-zA-Z0-9-]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="360" viewBox="0 0 520 360">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0b1329"/>
        <stop offset="50%" stop-color="#0f1f42"/>
        <stop offset="100%" stop-color="#070d1e"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#f59e0b"/>
        <stop offset="50%" stop-color="#fbbf24"/>
        <stop offset="100%" stop-color="#d97706"/>
      </linearGradient>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" stroke-width="0.6" opacity="0.6"/>
      </pattern>
    </defs>

    <!-- Card Background -->
    <rect width="520" height="360" rx="10" fill="url(#bg)"/>
    <rect width="520" height="360" rx="10" fill="url(#grid)"/>
    <rect x="2" y="2" width="516" height="356" rx="9" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.85"/>

    <!-- Header Tricolor Bar -->
    <rect x="2" y="2" width="516" height="4" rx="2" fill="#ff9933"/>
    <rect x="2" y="6" width="516" height="4" fill="#ffffff" opacity="0.9"/>
    <rect x="2" y="10" width="516" height="4" fill="#138808"/>

    <!-- Header Section -->
    <rect x="2" y="14" width="516" height="46" fill="#0c1733" opacity="0.95"/>
    <line x1="2" y1="60" x2="518" y2="60" stroke="#f59e0b" stroke-width="1" opacity="0.6"/>

    <!-- Security Control System Crest / Shield Graphic -->
    <g transform="translate(16, 20)">
      <polygon points="16,4 30,10 30,22 16,32 2,22 2,10" fill="#f59e0b" opacity="0.2"/>
      <polygon points="16,6 28,11 28,21 16,29 4,21 4,11" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
      <circle cx="16" cy="18" r="6" fill="#f59e0b"/>
      <text x="16" y="21" fill="#0b1329" font-family="sans-serif" font-size="8" font-weight="900" text-anchor="middle">QA</text>
    </g>

    <text x="56" y="33" fill="#f59e0b" font-family="monospace" font-size="9.5" font-weight="bold" letter-spacing="1.2">SECURITY CONTROL SYSTEM // GOVT. OF INDIA</text>
    <text x="56" y="49" fill="#f8fafc" font-family="'IBM Plex Sans', sans-serif" font-size="12" font-weight="700" letter-spacing="0.4">SECURITY CONTROL SYSTEM QUALITY ASSURANCE</text>
    <rect x="420" y="24" width="84" height="22" rx="3" fill="#10b981" opacity="0.18"/>
    <rect x="420" y="24" width="84" height="22" rx="3" fill="none" stroke="#10b981" stroke-width="1"/>
    <text x="462" y="39" fill="#10b981" font-family="monospace" font-size="9" font-weight="bold" text-anchor="middle">DGPS LOCKED</text>

    <!-- Photo Container (Left) -->
    <g transform="translate(24, 76)">
      <rect width="136" height="174" rx="6" fill="#070e20" stroke="#334155" stroke-width="1"/>
      <rect x="4" y="4" width="128" height="142" rx="4" fill="#0f172a"/>
      
      <!-- Professional Auditor Portrait Illustration -->
      <circle cx="68" cy="52" r="28" fill="#38bdf8" opacity="0.15"/>
      <!-- Head and Hair -->
      <circle cx="68" cy="50" r="22" fill="#cbd5e1"/>
      <path d="M 46 48 C 46 32, 90 32, 90 48 C 84 35, 52 35, 46 48 Z" fill="#1e293b"/>
      <!-- Body & Formal Blazer / Tie -->
      <path d="M 30 146 C 30 100, 106 100, 106 146 Z" fill="#1e293b"/>
      <!-- Shirt Collar -->
      <polygon points="68,96 56,80 80,80" fill="#f8fafc"/>
      <!-- Tie -->
      <polygon points="68,90 64,136 68,144 72,136" fill="#f59e0b"/>
      <!-- Lanyard -->
      <path d="M 44 86 L 62 144" stroke="#f59e0b" stroke-width="2.5" fill="none"/>
      <path d="M 92 86 L 74 144" stroke="#f59e0b" stroke-width="2.5" fill="none"/>

      <!-- Biometric scan overlay -->
      <circle cx="68" cy="52" r="34" fill="none" stroke="#38bdf8" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.7"/>
      <line x1="20" y1="52" x2="116" y2="52" stroke="#38bdf8" stroke-width="0.6" opacity="0.5"/>

      <!-- Photo Badge Footer -->
      <rect x="4" y="150" width="128" height="20" rx="3" fill="#10b981" opacity="0.2"/>
      <text x="68" y="164" fill="#10b981" font-family="monospace" font-size="8.5" font-weight="bold" text-anchor="middle">✓ VERIFIED ON-SITE</text>
    </g>

    <!-- Credentials Section (Right) -->
    <g transform="translate(180, 78)">
      <text x="0" y="16" fill="#94a3b8" font-family="monospace" font-size="9" font-weight="bold">AUTHORIZED LEAD AUDITOR</text>
      <text x="0" y="38" fill="#ffffff" font-family="'IBM Plex Sans', sans-serif" font-size="17" font-weight="700">${auditorName}</text>
      <text x="0" y="56" fill="#38bdf8" font-family="monospace" font-size="9.5" font-weight="bold">DESIGNATION: SECURITY CONTROL SYSTEM QMS ASSESSOR</text>

      <line x1="0" y1="68" x2="316" y2="68" stroke="#1e293b" stroke-width="1"/>

      <text x="0" y="86" fill="#94a3b8" font-family="monospace" font-size="9">SECURITY CLEARANCE:</text>
      <text x="130" y="86" fill="#fbbf24" font-family="monospace" font-size="10" font-weight="bold">SECRET // LEVEL-3</text>

      <text x="0" y="104" fill="#94a3b8" font-family="monospace" font-size="9">CREDENTIAL ID:</text>
      <text x="130" y="104" fill="#f8fafc" font-family="monospace" font-size="10" font-weight="bold">SCS-IND-2026-${cleanId || '01'}</text>

      <text x="0" y="122" fill="#94a3b8" font-family="monospace" font-size="9">AUDIT REFERENCE:</text>
      <text x="130" y="122" fill="#f8fafc" font-family="monospace" font-size="10" font-weight="bold">${auditId}</text>

      <text x="0" y="140" fill="#94a3b8" font-family="monospace" font-size="9">STANDARD FRAMEWORK:</text>
      <text x="130" y="140" fill="#10b981" font-family="monospace" font-size="10" font-weight="bold">ISO/IEC 17025 &amp; NABL</text>

      <!-- Security Microchip Graphic -->
      <g transform="translate(245, 90)">
        <rect width="40" height="30" rx="4" fill="#d97706" opacity="0.3"/>
        <rect width="40" height="30" rx="4" fill="none" stroke="#fbbf24" stroke-width="1"/>
        <line x1="12" y1="0" x2="12" y2="30" stroke="#fbbf24" stroke-width="1"/>
        <line x1="28" y1="0" x2="28" y2="30" stroke="#fbbf24" stroke-width="1"/>
        <line x1="0" y1="15" x2="40" y2="15" stroke="#fbbf24" stroke-width="1"/>
        <circle cx="20" cy="15" r="4" fill="#fbbf24"/>
      </g>
    </g>

    <!-- Bottom Telemetry Watermark Box -->
    <rect x="16" y="262" width="488" height="84" rx="6" fill="#070d1e" stroke="#f59e0b" stroke-width="1.2"/>
    <rect x="16" y="262" width="488" height="20" rx="5" fill="#f59e0b" opacity="0.12"/>
    
    <text x="28" y="276" fill="#f59e0b" font-family="monospace" font-size="8.5" font-weight="bold" letter-spacing="0.3">SECURITY CONTROL SYSTEM QMS GEO-VERIFICATION // ${auditId}</text>
    <text x="492" y="276" fill="#10b981" font-family="monospace" font-size="9" font-weight="bold" text-anchor="end">TAMPER-EVIDENT RECORD</text>

    <text x="28" y="298" fill="#f8fafc" font-family="monospace" font-size="10.5">LAT/LONG: <tspan fill="#38bdf8" font-weight="bold">${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E</tspan>  (±3.2m DGPS Accuracy)</text>
    <text x="28" y="316" fill="#f8fafc" font-family="monospace" font-size="10.5">TIMESTAMP: <tspan fill="#fbbf24" font-weight="bold">${dateFormatted} IST</tspan>  |  BEARING: <tspan fill="#f8fafc">042° NE</tspan></text>
    <text x="28" y="334" fill="#94a3b8" font-family="monospace" font-size="9.5">ATTESTATION: <tspan fill="#10b981" font-weight="bold">PREMISES VERIFIED ON-SITE [IN-GEOFENCE]</tspan></text>

    <!-- Security Hologram Seal (Right side) -->
    <g transform="translate(420, 286)">
      <circle cx="28" cy="24" r="20" fill="none" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="2,2"/>
      <circle cx="28" cy="24" r="16" fill="#f59e0b" opacity="0.15"/>
      <text x="28" y="22" fill="#f59e0b" font-family="monospace" font-size="7" font-weight="bold" text-anchor="middle">SCS</text>
      <text x="28" y="31" fill="#f59e0b" font-family="monospace" font-size="6.5" font-weight="bold" text-anchor="middle">INDIA</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function ensureAuditGeoTracking(audit: Audit): AuditGeoTracking {
  if (audit.geoTracking) return audit.geoTracking;
  const facility = getFacilityForUnit(audit.unit);
  const isStarted = audit.status !== 'Planned';
  if (isStarted) {
    const at = `${audit.start}T09:00:00Z`;
    const photo = generateSampleAuditorPhoto(audit.lead, audit.id, facility.lat, facility.lng, at);
    return {
      status: audit.status === 'Closed' ? 'Completed' : 'Active',
      facility,
      startRecord: {
        photo,
        lat: facility.lat,
        lng: facility.lng,
        accuracy: 4.2,
        timestamp: at,
        auditor: audit.lead,
        facilityName: facility.name,
        distanceMeters: 14,
        withinGeofence: true,
        digest: createGeoDigest(audit.id, audit.lead, at, facility.lat, facility.lng, 'sample-init'),
      },
      pings: [
        { lat: facility.lat, lng: facility.lng, timestamp: at, withinGeofence: true, distanceMeters: 14, note: 'Initial on-site geo-verification' },
      ],
      clausesUnlocked: true,
    };
  }
  return {
    status: 'Not Initialized',
    facility,
    pings: [],
    clausesUnlocked: false,
  };
}
