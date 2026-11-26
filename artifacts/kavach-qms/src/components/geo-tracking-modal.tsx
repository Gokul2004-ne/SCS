import { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Crosshair,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  Upload,
  Eye,
  Check,
  Maximize2,
  Edit3,
  Sliders,
  Layers,
  Compass,
  Plus,
  RotateCcw,
  Copy,
  Sparkles,
  Navigation,
} from 'lucide-react';
import { Btn, Modal, Pill } from '@/components/kit';
import { useToast } from '@/hooks/use-toast';
import type { Audit, GeoRecord, GeoPing } from '@/lib/types';
import {
  getFacilityForUnit,
  haversineDistance,
  isWithinGeofence,
  createGeoDigest,
  generateSampleAuditorPhoto,
  ensureAuditGeoTracking,
} from '@/lib/geo';
import { nowIso } from '@/lib/store';
import { cn } from '@/lib/utils';

interface GeoTrackingModalProps {
  open: boolean;
  onClose: () => void;
  audit: Audit;
  mode: 'start' | 'view' | 'close';
  onSuccess?: (auditId: string, record: GeoRecord, nextStatus?: 'Fieldwork' | 'Closed') => void;
}

export function GeoTrackingModal({ open, onClose, audit, mode, onSuccess }: GeoTrackingModalProps) {
  const { toast } = useToast();
  const facility = getFacilityForUnit(audit.unit);

  // Geolocation state
  const [lat, setLat] = useState<number>(facility.lat + 0.0001);
  const [lng, setLng] = useState<number>(facility.lng + 0.00008);
  const [accuracy, setAccuracy] = useState<number>(3.5);
  const [simMode, setSimMode] = useState<'facility' | 'bench' | 'gate' | 'outside' | 'live' | 'manual'>('facility');
  const [acquiringGps, setAcquiringGps] = useState(false);
  const [showCoordinateCalibrator, setShowCoordinateCalibrator] = useState(false);

  // Map / Radar visual mode
  const [visualMode, setVisualMode] = useState<'radar' | 'campus'>('radar');

  // Photo states & studio
  const [photo, setPhoto] = useState<string>('');
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [photoSourceTab, setPhotoSourceTab] = useState<'badge' | 'webcam' | 'upload'>('badge');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'normal' | 'enhanced' | 'night' | 'mono'>('normal');
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);
  const [photoDirty, setPhotoDirty] = useState<boolean>(false);

  // Local ping history
  const [localPings, setLocalPings] = useState<GeoPing[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Calculations
  const { within, distanceMeters } = isWithinGeofence(lat, lng, facility.lat, facility.lng, facility.radiusMeters);
  const existingTracking = ensureAuditGeoTracking(audit);

  // Bearing from facility center
  const bearingDegrees = Math.round(
    ((Math.atan2(lng - facility.lng, lat - facility.lat) * 180) / Math.PI + 360) % 360,
  );
  const bearingCardinal =
    bearingDegrees >= 337.5 || bearingDegrees < 22.5
      ? 'N'
      : bearingDegrees < 67.5
      ? 'NE'
      : bearingDegrees < 112.5
      ? 'E'
      : bearingDegrees < 157.5
      ? 'SE'
      : bearingDegrees < 202.5
      ? 'S'
      : bearingDegrees < 247.5
      ? 'SW'
      : bearingDegrees < 292.5
      ? 'W'
      : 'NW';

  // Initialize or reset when modal opens
  useEffect(() => {
    if (!open) {
      stopCamera();
      setIsEditingPhoto(false);
      return;
    }

    if (existingTracking.startRecord) {
      setPhoto(existingTracking.startRecord.photo);
      setLat(existingTracking.startRecord.lat);
      setLng(existingTracking.startRecord.lng);
      setAccuracy(existingTracking.startRecord.accuracy);
      setLocalPings(existingTracking.pings || []);
      setIsEditingPhoto(false);
    } else {
      const defaultLat = facility.lat + 0.0001;
      const defaultLng = facility.lng + 0.00008;
      setLat(defaultLat);
      setLng(defaultLng);
      setAccuracy(3.5);
      setSimMode('facility');
      const sample = generateSampleAuditorPhoto(audit.lead, audit.id, defaultLat, defaultLng, nowIso());
      setPhoto(sample);
      setIsEditingPhoto(true);
      setLocalPings([]);
    }
    setPhotoDirty(false);
  }, [open, mode, audit.id]);

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not supported in this environment');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access fallback:', err);
      setCameraError('Webcam unavailable. Use "Authorized ID Badge" or upload a photo.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 520;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply adjustments & filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) ${
      filterMode === 'night'
        ? 'hue-rotate(90deg) saturate(180%)'
        : filterMode === 'mono'
        ? 'grayscale(100%)'
        : filterMode === 'enhanced'
        ? 'contrast(125%) saturate(120%)'
        : 'none'
    }`;

    // Draw video frame
    ctx.drawImage(videoRef.current, 0, 0, 520, 360);
    ctx.filter = 'none';

    if (includeWatermark) {
      // Overlay professional Security Control System watermark
      ctx.fillStyle = 'rgba(11, 19, 41, 0.9)';
      ctx.fillRect(0, 275, 520, 85);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 275, 520, 85);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9.5px monospace';
      ctx.fillText(`SECURITY CONTROL SYSTEM QMS GEO-VERIFICATION // ${audit.id}`, 16, 296);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 10.5px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`PREMISES: ${within ? 'VERIFIED ON-SITE' : 'BREACH'}`, 504, 296);

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.font = '10px monospace';
      ctx.fillText(`AUDITOR: ${audit.lead}`, 16, 314);
      ctx.fillText(`GEO: ${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E (±${accuracy}m DGPS)`, 16, 332);
      ctx.fillText(`TIME: ${new Date().toLocaleString('en-IN')} IST`, 16, 350);

      const d = createGeoDigest(audit.id, audit.lead, nowIso(), lat, lng, 'cam').slice(0, 16);
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'right';
      ctx.fillText(`DIGEST: ${d}...`, 504, 332);
      ctx.fillText(`GEOFENCE: ${distanceMeters}m TO CENTER`, 504, 350);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setPhoto(dataUrl);
    setPhotoDirty(true);
    stopCamera();
    toast({ title: 'Auditor snapshot captured with GPS watermark' });
  };

  const useSamplePhoto = () => {
    stopCamera();
    const p = generateSampleAuditorPhoto(audit.lead, audit.id, lat, lng, nowIso());
    setPhoto(p);
    setPhotoDirty(true);
    toast({ title: 'Authorized Security Control System Auditor Credential Badge generated' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 520;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) ${
            filterMode === 'night'
              ? 'hue-rotate(90deg) saturate(180%)'
              : filterMode === 'mono'
              ? 'grayscale(100%)'
              : 'none'
          }`;
          ctx.drawImage(img, 0, 0, 520, 360);
          ctx.filter = 'none';

          if (includeWatermark) {
            ctx.fillStyle = 'rgba(11, 19, 41, 0.9)';
            ctx.fillRect(0, 275, 520, 85);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(0, 275, 520, 85);

            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 9.5px monospace';
            ctx.fillText(`SECURITY CONTROL SYSTEM QMS GEO-VERIFICATION // ${audit.id}`, 16, 296);

            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 10.5px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`PREMISES: ${within ? 'VERIFIED ON-SITE' : 'BREACH'}`, 504, 296);

            ctx.fillStyle = '#f8fafc';
            ctx.textAlign = 'left';
            ctx.font = '10px monospace';
            ctx.fillText(`AUDITOR: ${audit.lead}`, 16, 314);
            ctx.fillText(`GEO: ${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E (±${accuracy}m DGPS)`, 16, 332);
            ctx.fillText(`TIME: ${new Date().toLocaleString('en-IN')} IST`, 16, 350);
          }

          const result = canvas.toDataURL('image/jpeg', 0.95);
          setPhoto(result);
          setPhotoDirty(true);
          stopCamera();
          toast({ title: 'Auditor verification photo loaded and formatted' });
        };
        img.src = ev.target.result;
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const acquireLiveGps = () => {
    if (!navigator.geolocation) {
      toast({ title: 'GPS unavailable', description: 'Geolocation API not supported by browser.' });
      return;
    }
    setAcquiringGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAccuracy(Math.round(pos.coords.accuracy || 3.5));
        setSimMode('live');
        setAcquiringGps(false);
        setPhotoDirty(true);
        toast({
          title: 'Live GPS Location Acquired',
          description: `${pos.coords.latitude.toFixed(6)}°N, ${pos.coords.longitude.toFixed(6)}°E (±${Math.round(
            pos.coords.accuracy || 3.5,
          )}m)`,
        });
      },
      (err) => {
        setAcquiringGps(false);
        toast({ title: 'Live GPS Notice', description: err.message || 'Permission denied. Using facility simulation.' });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const selectPreset = (type: 'facility' | 'bench' | 'gate' | 'outside') => {
    setSimMode(type);
    setPhotoDirty(true);
    if (type === 'facility') {
      setLat(facility.lat + 0.0001);
      setLng(facility.lng + 0.00008);
      setAccuracy(3.5);
      toast({ title: 'Position: Inside Main Testing Facility (14m)' });
    } else if (type === 'bench') {
      setLat(facility.lat + 0.00003);
      setLng(facility.lng + 0.00002);
      setAccuracy(2.0);
      toast({ title: 'Position: At Hardware-in-the-Loop Bench 2 (4m)' });
    } else if (type === 'gate') {
      setLat(facility.lat + 0.00032);
      setLng(facility.lng + 0.00025);
      setAccuracy(4.0);
      toast({ title: 'Position: Facility Main Security Gate (45m)' });
    } else {
      setLat(facility.lat + 0.0038);
      setLng(facility.lng + 0.0032);
      setAccuracy(6.0);
      toast({ title: 'Position: Outside Perimeter Breach (480m)', description: 'Simulating geofence boundary alert.' });
    }
  };

  const adjustCoord = (dLat: number, dLng: number) => {
    setLat((l) => parseFloat((l + dLat).toFixed(6)));
    setLng((l) => parseFloat((l + dLng).toFixed(6)));
    setSimMode('manual');
    setPhotoDirty(true);
  };

  const logCurrentPing = () => {
    const newPing: GeoPing = {
      lat,
      lng,
      timestamp: nowIso(),
      withinGeofence: within,
      distanceMeters,
      note: `Waypoint at ${bearingDegrees}° ${bearingCardinal} (${distanceMeters}m from center)`,
    };
    setLocalPings((prev) => [newPing, ...prev]);
    toast({
      title: 'GPS Checkpoint Logged',
      description: `${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E - ${distanceMeters}m (${within ? 'In-Premises' : 'Breach'})`,
    });
  };

  const handleApplyEditedPhoto = () => {
    setIsEditingPhoto(false);
    toast({ title: 'Photo updated and applied' });
  };

  const handleSaveInViewMode = () => {
    if (!photo) return;
    const ts = nowIso();
    const digest = createGeoDigest(audit.id, audit.lead, ts, lat, lng, photo);
    const record: GeoRecord = {
      photo,
      lat,
      lng,
      accuracy,
      timestamp: ts,
      auditor: audit.lead,
      facilityName: facility.name,
      distanceMeters,
      withinGeofence: within,
      digest,
    };
    onSuccess?.(audit.id, record);
    setPhotoDirty(false);
    setIsEditingPhoto(false);
    toast({ title: 'Auditor verification photo & telemetry saved to audit record' });
  };

  const handleConfirm = () => {
    if (!photo) {
      toast({ title: 'Photo required', description: 'Auditor photograph is required to initialize GPS geo-tracking.' });
      return;
    }

    if (!within) {
      toast({
        title: 'Geofence verification failed',
        description: `Auditor is ${distanceMeters}m from ${facility.name} (Max radius: ${facility.radiusMeters}m). Auditor must be on-site within premises.`,
      });
      return;
    }

    const ts = nowIso();
    const digest = createGeoDigest(audit.id, audit.lead, ts, lat, lng, photo);
    const record: GeoRecord = {
      photo,
      lat,
      lng,
      accuracy,
      timestamp: ts,
      auditor: audit.lead,
      facilityName: facility.name,
      distanceMeters,
      withinGeofence: within,
      digest,
    };

    if (mode === 'start') {
      onSuccess?.(audit.id, record, 'Fieldwork');
      toast({
        title: `GPS Geo-tracking initialized for ${audit.id}`,
        description: `Auditor presence verified on-site at ${facility.name}. Clauses & fieldwork unlocked.`,
      });
    } else if (mode === 'close') {
      onSuccess?.(audit.id, record, 'Closed');
      toast({
        title: `Audit ${audit.id} closed with on-site GPS verification`,
        description: `Final presence check verified inside ${facility.name}. Audit closed.`,
      });
    }

    onClose();
  };

  const currentDigest = photo ? createGeoDigest(audit.id, audit.lead, nowIso(), lat, lng, photo) : '';

  return (
    <Modal
      open={open}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title={
        mode === 'start'
          ? `Initialize GPS Geo-Tracking // ${audit.id}`
          : mode === 'close'
          ? `Audit Closure Presence Check // ${audit.id}`
          : `Live GPS Geo-Tracking & Radar // ${audit.id}`
      }
      desc={
        mode === 'start'
          ? 'Mandatory Security Control System on-site auditor verification: Capture auditor photograph and verify presence within laboratory premises to unlock fieldwork and clauses.'
          : mode === 'close'
          ? 'Mandatory closure gate: Auditor must be physically present inside the laboratory premises to officially close this audit.'
          : 'Live monitoring of on-site auditor presence, geofence status, and audit breadcrumbs.'
      }
      wide
    >
      <div className="space-y-4">
        {/* Top Header Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3.5 shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--saffron))]">
              <MapPin className="h-3.5 w-3.5" /> Target Laboratory / Unit
            </div>
            <div className="text-[14.5px] font-semibold text-primary">{facility.name}</div>
            <div className="text-[11.5px] text-muted-foreground">{facility.locationDesc}</div>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end font-mono">
            <div className="text-[11px] text-muted-foreground">Authorized Lead Auditor</div>
            <div className="text-[13px] font-bold text-foreground">{audit.lead}</div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 border border-border text-muted-foreground">
                Radius: <strong className="text-foreground">{facility.radiusMeters}m</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold">
                DGPS RTK-Fixed
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Core: Left Photo Studio, Right Tactical Radar & Telemetry */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Left Column: Auditor Photograph & Studio */}
          <div className="flex flex-col rounded-lg border border-border bg-card p-4 shadow-2xs">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-[hsl(var(--saffron))]" />
                <span className="text-[13px] font-semibold text-foreground">Auditor On-Site Photograph</span>
              </div>
              <div className="flex items-center gap-2">
                {photo && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <Check className="h-3 w-3" /> Photo Verified
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPhoto(!isEditingPhoto);
                    if (cameraActive) stopCamera();
                  }}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold border transition-all cursor-pointer',
                    isEditingPhoto
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted/60 text-foreground hover:bg-muted'
                  )}
                  title="Toggle Photo Studio to edit, retake, or replace photo"
                >
                  <Edit3 className="h-3 w-3" />
                  {isEditingPhoto ? 'Close Studio' : 'Edit / Retake Photo'}
                </button>
              </div>
            </div>

            {/* Photo Display / Viewport */}
            <div className="relative flex min-h-[250px] flex-1 items-center justify-center overflow-hidden rounded-md border border-border bg-slate-950 p-1">
              {cameraActive ? (
                <div className="relative h-full w-full flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain rounded" />
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="h-40 w-40 rounded-full border-2 border-dashed border-[hsl(var(--saffron))] opacity-75 animate-pulse" />
                    <span className="mt-2 rounded bg-black/75 px-2 py-0.5 text-[10px] font-mono text-amber-400">
                      Align face within frame
                    </span>
                  </div>
                </div>
              ) : photo ? (
                <div className="relative h-full w-full flex items-center justify-center">
                  <img
                    src={photo}
                    alt="Auditor verification"
                    className="max-h-[245px] w-full object-contain rounded shadow-inner"
                    style={{
                      filter: `brightness(${brightness}%) contrast(${contrast}%) ${
                        filterMode === 'night'
                          ? 'hue-rotate(90deg) saturate(180%)'
                          : filterMode === 'mono'
                          ? 'grayscale(100%)'
                          : filterMode === 'enhanced'
                          ? 'contrast(125%) saturate(120%)'
                          : 'none'
                      }`,
                    }}
                  />
                  {photoDirty && (
                    <div className="absolute top-2 left-2 rounded bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 text-[9.5px] font-mono shadow">
                      UNSAVED EDITS
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-[hsl(var(--saffron))]">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div className="text-[13px] font-semibold text-foreground">No Photograph Captured</div>
                  <p className="max-w-xs text-[11.5px] text-muted-foreground">
                    Take a live snapshot with your webcam, generate an authorized Security Control System credential badge, or upload an image.
                  </p>
                  {cameraError && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-500">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {cameraError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SHA Digest & Telemetry Info strip under photo */}
            {photo && !isEditingPhoto && (
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono rounded bg-muted/40 border border-border p-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>SHA-256 Digest:</span>
                  <span className="font-semibold text-foreground">{currentDigest.slice(0, 16)}...</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(currentDigest);
                    toast({ title: 'Digest copied to clipboard' });
                  }}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                  title="Copy full cryptographic digest"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Photo Studio / Editing Controls Panel */}
            {isEditingPhoto && (
              <div className="mt-3 space-y-2.5 rounded-md border border-border bg-muted/20 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-bold text-foreground flex items-center gap-1">
                    <Sliders className="h-3.5 w-3.5 text-primary" />
                    Photo Studio &amp; Capture Options
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Real-time processing</span>
                </div>

                {/* Source Selection Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {cameraActive ? (
                    <>
                      <button
                        type="button"
                        onClick={captureCameraPhoto}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded bg-primary text-primary-foreground px-3 py-1.5 text-[12px] font-bold shadow-sm hover:brightness-105"
                      >
                        <Camera className="h-3.5 w-3.5" /> Capture Snapshot
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="rounded border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted"
                      >
                        Cancel Cam
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="inline-flex items-center gap-1 rounded border border-border bg-card px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-accent cursor-pointer"
                      >
                        <Camera className="h-3.5 w-3.5 text-primary" /> Webcam Live
                      </button>
                      <button
                        type="button"
                        onClick={useSamplePhoto}
                        className="inline-flex items-center gap-1 rounded border border-border bg-card px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-accent cursor-pointer"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> Authorized ID Badge
                      </button>
                      <label className="inline-flex items-center gap-1 rounded border border-border bg-card px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-accent cursor-pointer">
                        <Upload className="h-3.5 w-3.5 text-emerald-500" /> Upload Photo
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </>
                  )}
                </div>

                {/* Filter and Adjustment sliders */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60 text-[11px]">
                  <div>
                    <label className="text-muted-foreground block mb-0.5">Filter Style:</label>
                    <select
                      className="field !py-0.5 !text-[11px]"
                      value={filterMode}
                      onChange={(e) => {
                        setFilterMode(e.target.value as any);
                        setPhotoDirty(true);
                      }}
                    >
                      <option value="normal">Standard Natural</option>
                      <option value="enhanced">Enhanced Contrast</option>
                      <option value="night">Night Cam / Tactical</option>
                      <option value="mono">Security Monochrome</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between text-muted-foreground mb-0.5">
                      <span>Brightness:</span>
                      <span className="font-mono">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="75"
                      max="135"
                      value={brightness}
                      onChange={(e) => {
                        setBrightness(Number(e.target.value));
                        setPhotoDirty(true);
                      }}
                      className="w-full accent-primary h-1.5 bg-muted rounded"
                    />
                  </div>
                </div>

                {/* Apply/Save button */}
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingPhoto(false)}
                    className="rounded border border-border px-2.5 py-1 text-[11.5px] text-muted-foreground hover:text-foreground"
                  >
                    Done
                  </button>
                  {mode === 'view' && photoDirty && (
                    <button
                      type="button"
                      onClick={handleSaveInViewMode}
                      className="rounded bg-primary text-primary-foreground font-semibold px-3 py-1 text-[11.5px] shadow-sm hover:brightness-105"
                    >
                      Save to Audit Record
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Tactical Radar & Campus GIS Map */}
          <div className="flex flex-col rounded-lg border border-border bg-card p-4 shadow-2xs">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-[hsl(var(--saffron))] animate-pulse" />
                <span className="text-[13px] font-semibold text-foreground">GPS Geolocation Telemetry</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Visual View Switcher */}
                <div className="flex items-center rounded border border-border bg-muted/60 p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setVisualMode('radar')}
                    className={cn(
                      'rounded px-2 py-0.5 transition-colors cursor-pointer',
                      visualMode === 'radar' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Tactical Radar
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisualMode('campus')}
                    className={cn(
                      'rounded px-2 py-0.5 transition-colors cursor-pointer',
                      visualMode === 'campus' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Campus GIS Map
                  </button>
                </div>
                {within ? (
                  <Pill t="teal">
                    <CheckCircle2 className="h-3 w-3" /> Within Premises ({distanceMeters}m)
                  </Pill>
                ) : (
                  <Pill t="red">
                    <XCircle className="h-3 w-3" /> Geofence Breach ({distanceMeters}m)
                  </Pill>
                )}
              </div>
            </div>

            {/* Radar / GIS Map Viewport */}
            <div className="relative flex h-[215px] items-center justify-center overflow-hidden rounded-md border border-border bg-slate-950 p-1 select-none">
              {visualMode === 'radar' ? (
                /* High-Precision Tactical Radar HUD */
                <svg viewBox="0 0 320 210" className="h-full w-full">
                  <defs>
                    <pattern id="radar-mesh" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#172554" strokeWidth="0.5" opacity="0.4" />
                    </pattern>
                    <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#0f172a" />
                      <stop offset="85%" stopColor="#020617" />
                      <stop offset="100%" stopColor="#000000" />
                    </radialGradient>
                  </defs>

                  <rect width="320" height="210" fill="url(#radar-glow)" />
                  <rect width="320" height="210" fill="url(#radar-mesh)" />

                  {/* Cardinal Axis crosshairs centered at (160, 105) */}
                  <line x1="160" y1="5" x2="160" y2="205" stroke="#334155" strokeWidth="0.8" strokeDasharray="3,3" />
                  <line x1="10" y1="105" x2="310" y2="105" stroke="#334155" strokeWidth="0.8" strokeDasharray="3,3" />

                  {/* Cardinal Compass Labels */}
                  <text x="160" y="14" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">N 000°</text>
                  <text x="312" y="108" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">E 090°</text>
                  <text x="160" y="202" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">S 180°</text>
                  <text x="8" y="108" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">W 270°</text>

                  {/* Range Rings with Distance Labels (Radius scale: 250m = 80px) */}
                  <circle cx="160" cy="105" r="20" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                  <text x="162" y="87" fill="#64748b" fontSize="7" fontFamily="monospace">60m</text>

                  <circle cx="160" cy="105" r="45" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                  <text x="162" y="62" fill="#64748b" fontSize="7" fontFamily="monospace">140m</text>

                  {/* Geofence Perimeter (250m) */}
                  <circle
                    cx="160"
                    cy="105"
                    r="80"
                    fill={within ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.08)'}
                    stroke={within ? '#10b981' : '#ef4444'}
                    strokeWidth="1.5"
                    strokeDasharray={within ? 'none' : '4,2'}
                  />
                  <text x="162" y="28" fill={within ? '#10b981' : '#ef4444'} fontSize="7" fontFamily="monospace" fontWeight="bold">
                    PERIMETER 250M
                  </text>

                  {/* Facility Lab Testing Bays & Layout */}
                  <g opacity="0.9">
                    {/* Main Building */}
                    <rect x="130" y="85" width="60" height="40" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.2" />
                    <text x="160" y="102" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      MAIN LAB
                    </text>
                    <text x="160" y="112" fill="#94a3b8" fontSize="6" fontFamily="monospace" textAnchor="middle">
                      HIL BENCH 1-3
                    </text>

                    {/* RF Chamber Annex */}
                    <rect x="200" y="90" width="35" height="30" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2,2" />
                    <text x="217" y="108" fill="#38bdf8" fontSize="6" fontFamily="monospace" textAnchor="middle">
                      RF BAY
                    </text>

                    {/* Security Entrance */}
                    <rect x="145" y="132" width="30" height="12" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
                    <text x="160" y="141" fill="#94a3b8" fontSize="6" fontFamily="monospace" textAnchor="middle">
                      GATE 1
                    </text>
                  </g>

                  {/* Auditor live position pin & vector */}
                  {(() => {
                    const scale = 80 / facility.radiusMeters;
                    const dx = ((lng - facility.lng) / 0.003) * 65;
                    const dy = -((lat - facility.lat) / 0.003) * 65;
                    const cx = Math.max(25, Math.min(295, 160 + dx));
                    const cy = Math.max(25, Math.min(185, 105 + dy));

                    return (
                      <g>
                        {/* Target acquisition line */}
                        <line
                          x1="160"
                          y1="105"
                          x2={cx}
                          y2={cy}
                          stroke={within ? '#10b981' : '#ef4444'}
                          strokeWidth="1.2"
                          strokeDasharray="2,2"
                        />

                        {/* Auditor pulse wave */}
                        <circle cx={cx} cy={cy} r="6" fill={within ? '#10b981' : '#ef4444'} />
                        <circle cx={cx} cy={cy} r="14" fill="none" stroke={within ? '#10b981' : '#ef4444'} strokeWidth="1" opacity="0.6">
                          <animate attributeName="r" from="6" to="20" dur="1.8s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.9" to="0" dur="1.8s" repeatCount="indefinite" />
                        </circle>

                        {/* Auditor label badge */}
                        <rect x={cx - 36} y={cy - 20} width="72" height="14" rx="2" fill="rgba(15, 23, 42, 0.9)" stroke={within ? '#10b981' : '#ef4444'} strokeWidth="0.8" />
                        <text x={cx} y={cy - 10} fill="#ffffff" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                          AUDITOR ({distanceMeters}m)
                        </text>
                      </g>
                    );
                  })()}

                  {/* Sweep arm line */}
                  <line x1="160" y1="105" x2="235" y2="35" stroke="#10b981" strokeWidth="1" opacity="0.4" />
                </svg>
              ) : (
                /* Campus GIS Architectural Map */
                <svg viewBox="0 0 320 210" className="h-full w-full">
                  <rect width="320" height="210" fill="#091224" />
                  {/* Grid lines */}
                  <line x1="0" y1="50" x2="320" y2="50" stroke="#1e293b" strokeWidth="0.6" />
                  <line x1="0" y1="100" x2="320" y2="100" stroke="#1e293b" strokeWidth="0.6" />
                  <line x1="0" y1="150" x2="320" y2="150" stroke="#1e293b" strokeWidth="0.6" />
                  <line x1="80" y1="0" x2="80" y2="210" stroke="#1e293b" strokeWidth="0.6" />
                  <line x1="160" y1="0" x2="160" y2="210" stroke="#1e293b" strokeWidth="0.6" />
                  <line x1="240" y1="0" x2="240" y2="210" stroke="#1e293b" strokeWidth="0.6" />

                  {/* Campus Roads / Pathways */}
                  <path d="M 0 105 Q 120 105 160 105 T 320 105" fill="none" stroke="#1e293b" strokeWidth="16" />
                  <path d="M 160 0 L 160 210" fill="none" stroke="#1e293b" strokeWidth="12" />

                  {/* Geofence Perimeter Safe Zone */}
                  <circle cx="160" cy="105" r="82" fill="rgba(16, 185, 129, 0.08)" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,3" />

                  {/* Campus Buildings */}
                  {/* Building 1: Metrology Center */}
                  <rect x="70" y="65" width="55" height="30" rx="3" fill="#132247" stroke="#38bdf8" strokeWidth="1" />
                  <text x="97" y="83" fill="#38bdf8" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">METROLOGY</text>

                  {/* Building 2: Main Signals Lab */}
                  <rect x="135" y="70" width="75" height="48" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="172" y="94" fill="#fbbf24" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">SIGNALS LAB</text>
                  <text x="172" y="105" fill="#94a3b8" fontSize="6.5" fontFamily="monospace" textAnchor="middle">TEST BENCHES 1-3</text>

                  {/* Building 3: RF Anechoic Chamber */}
                  <rect x="220" y="65" width="50" height="35" rx="3" fill="#132247" stroke="#38bdf8" strokeWidth="1" />
                  <text x="245" y="85" fill="#38bdf8" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">RF ANECHOIC</text>

                  {/* Security Post & Gate */}
                  <rect x="145" y="170" width="30" height="15" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                  <text x="160" y="180" fill="#94a3b8" fontSize="6" fontFamily="monospace" textAnchor="middle">CHECKPOINT</text>

                  {/* Waypoint Breadcrumb trail */}
                  {localPings.slice(0, 4).map((p, idx) => {
                    const px = 160 + ((p.lng - facility.lng) / 0.003) * 65;
                    const py = 105 - ((p.lat - facility.lat) / 0.003) * 65;
                    return (
                      <circle key={idx} cx={px} cy={py} r="3" fill="#38bdf8" opacity="0.6" />
                    );
                  })}

                  {/* Live Auditor Location */}
                  {(() => {
                    const cx = Math.max(25, Math.min(295, 160 + ((lng - facility.lng) / 0.003) * 65));
                    const cy = Math.max(25, Math.min(185, 105 - ((lat - facility.lat) / 0.003) * 65));
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r="6" fill={within ? '#10b981' : '#ef4444'} />
                        <circle cx={cx} cy={cy} r="12" fill="none" stroke={within ? '#10b981' : '#ef4444'} strokeWidth="1" opacity="0.6" />
                        <rect x={cx - 32} y={cy - 18} width="64" height="12" rx="2" fill="#0f172a" stroke={within ? '#10b981' : '#ef4444'} strokeWidth="0.8" />
                        <text x={cx} y={cy - 9} fill="#f8fafc" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          AUDITOR ({distanceMeters}m)
                        </text>
                      </g>
                    );
                  })()}
                </svg>
              )}
            </div>

            {/* Coordinates & Telemetry Cards */}
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11.5px]">
              <div className="rounded border border-border bg-muted/40 p-2">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-mono">
                  <span>Current Coordinates</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">14 SATS</span>
                </div>
                <div className="font-mono font-bold text-foreground">
                  {lat.toFixed(6)}°N, {lng.toFixed(6)}°E
                </div>
              </div>
              <div className="rounded border border-border bg-muted/40 p-2">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-mono">
                  <span>Distance &amp; Bearing</span>
                  <span className="text-foreground font-semibold">±{accuracy}m</span>
                </div>
                <div className="font-mono font-bold text-foreground">
                  {distanceMeters}m to center ({bearingDegrees}° {bearingCardinal})
                </div>
              </div>
            </div>

            {/* Location Presets & Device GPS Controls */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60">
              <span className="text-[11px] text-muted-foreground font-medium">Preset Test:</span>
              <button
                type="button"
                onClick={() => selectPreset('facility')}
                className={cn(
                  'rounded px-2 py-0.5 text-[11px] font-semibold border transition-colors cursor-pointer',
                  simMode === 'facility'
                    ? 'border-emerald-600 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'border-border text-muted-foreground hover:bg-accent'
                )}
              >
                Inside Lab (14m)
              </button>
              <button
                type="button"
                onClick={() => selectPreset('bench')}
                className={cn(
                  'rounded px-2 py-0.5 text-[11px] font-semibold border transition-colors cursor-pointer',
                  simMode === 'bench'
                    ? 'border-emerald-600 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'border-border text-muted-foreground hover:bg-accent'
                )}
              >
                At Bench 2 (4m)
              </button>
              <button
                type="button"
                onClick={() => selectPreset('gate')}
                className={cn(
                  'rounded px-2 py-0.5 text-[11px] font-semibold border transition-colors cursor-pointer',
                  simMode === 'gate'
                    ? 'border-emerald-600 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'border-border text-muted-foreground hover:bg-accent'
                )}
              >
                Security Gate (45m)
              </button>
              <button
                type="button"
                onClick={() => selectPreset('outside')}
                className={cn(
                  'rounded px-2 py-0.5 text-[11px] font-semibold border transition-colors cursor-pointer',
                  simMode === 'outside'
                    ? 'border-red-600 bg-red-500/15 text-red-700 dark:text-red-300'
                    : 'border-border text-muted-foreground hover:bg-accent'
                )}
              >
                Outside Breach (480m)
              </button>
              <button
                type="button"
                onClick={acquireLiveGps}
                disabled={acquiringGps}
                className={cn(
                  'rounded px-2 py-0.5 text-[11px] font-semibold border transition-colors flex items-center gap-1 cursor-pointer',
                  simMode === 'live'
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground hover:bg-accent'
                )}
              >
                <Crosshair className="h-3 w-3" /> {acquiringGps ? 'Acquiring...' : 'Real Device GPS'}
              </button>
            </div>

            {/* Fine Calibration Stepper Toggle */}
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => setShowCoordinateCalibrator(!showCoordinateCalibrator)}
                className="text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <Compass className="h-3 w-3" />
                {showCoordinateCalibrator ? 'Hide Manual Calibrator' : 'Fine-Tune Coordinates (Steppers)'}
              </button>
              <button
                type="button"
                onClick={logCurrentPing}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono font-medium cursor-pointer"
                title="Log current position as an audit breadcrumb"
              >
                <Plus className="h-3 w-3" /> Log Checkpoint Ping
              </button>
            </div>

            {showCoordinateCalibrator && (
              <div className="mt-2 rounded bg-muted/30 border border-border p-2 text-[11px] font-mono space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Latitude Stepper (±11m):</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustCoord(-0.0001, 0)}
                      className="px-2 py-0.5 rounded border border-border bg-card hover:bg-muted font-bold"
                    >
                      -
                    </button>
                    <span className="w-20 text-center font-bold">{lat.toFixed(6)}°</span>
                    <button
                      type="button"
                      onClick={() => adjustCoord(0.0001, 0)}
                      className="px-2 py-0.5 rounded border border-border bg-card hover:bg-muted font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Longitude Stepper (±11m):</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustCoord(0, -0.0001)}
                      className="px-2 py-0.5 rounded border border-border bg-card hover:bg-muted font-bold"
                    >
                      -
                    </button>
                    <span className="w-20 text-center font-bold">{lng.toFixed(6)}°</span>
                    <button
                      type="button"
                      onClick={() => adjustCoord(0, 0.0001)}
                      className="px-2 py-0.5 rounded border border-border bg-card hover:bg-muted font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Continuous On-Premises Presence Breadcrumb Trail */}
        {localPings.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[hsl(var(--saffron))]" />
                Continuous On-Premises Presence Log
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {localPings.length} geo-verification checkpoint(s)
              </span>
            </div>
            <div className="max-h-24 overflow-y-auto divide-y divide-border/60 text-[11px]">
              {localPings.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 font-mono">
                  <span className="text-muted-foreground">
                    #{idx + 1} {new Date(p.timestamp).toLocaleTimeString('en-IN')}
                  </span>
                  <span>
                    {p.lat.toFixed(5)}°N, {p.lng.toFixed(5)}°E
                  </span>
                  <span className={cn('font-semibold', p.withinGeofence ? 'text-[hsl(var(--teal))]' : 'text-destructive')}>
                    {p.withinGeofence ? `In-Premises (${p.distanceMeters}m)` : `BREACH (${p.distanceMeters}m)`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Geofence Status Warning / Success Notice */}
        {!within ? (
          <div className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-[12px] text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Geofence Out-of-Bounds Alert</div>
              <div>
                Auditor is currently {distanceMeters}m from laboratory center (boundary limit: {facility.radiusMeters}m).{' '}
                {mode === 'close'
                  ? 'Auditor must be verified physically inside the laboratory to officially close the audit.'
                  : 'Auditor must be verified physically inside the laboratory to initialize fieldwork and unlock clauses.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-[12px] text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="font-semibold">Facility Geofence Attestation Satisfied.</span> Continuous GPS tracking will
              monitor auditor presence throughout the audit duration.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <Btn onClick={onClose}>{mode === 'view' ? 'Close Window' : 'Cancel'}</Btn>
          {mode === 'view' && photoDirty && (
            <Btn variant="primary" onClick={handleSaveInViewMode}>
              <Check className="h-3.5 w-3.5" /> Save Updated Telemetry
            </Btn>
          )}
          {mode === 'start' && (
            <Btn
              variant="primary"
              disabled={!photo || !within}
              onClick={handleConfirm}
              data-testid="button-confirm-geotag-init"
              title={!photo ? 'Capture photo first' : !within ? 'Auditor must be within premises' : ''}
            >
              <Check className="h-3.5 w-3.5" /> Confirm Geotag &amp; Unlock Fieldwork
            </Btn>
          )}
          {mode === 'close' && (
            <Btn
              variant="primary"
              disabled={!photo || !within}
              onClick={handleConfirm}
              data-testid="button-confirm-geotag-close"
              title={!photo ? 'Capture photo first' : !within ? 'Auditor must be within premises' : ''}
            >
              <Check className="h-3.5 w-3.5" /> Verify Presence &amp; Close Audit
            </Btn>
          )}
        </div>
      </div>
    </Modal>
  );
}
