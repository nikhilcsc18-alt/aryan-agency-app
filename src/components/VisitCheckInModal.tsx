import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Clock, 
  Compass, 
  RefreshCw, 
  Navigation, 
  Store, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Retailer, Salesman, SalesmanVisit, VisitCheckInPayload } from '../types';
import { api, calculateHaversineDistanceMetres, formatINR } from '../lib/api';

interface VisitCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  retailer: Retailer;
  salesman?: Salesman | null;
  allowedRadiusMetres?: number;
  onCheckInSuccess: (visit: SalesmanVisit) => void;
}

export const VisitCheckInModal: React.FC<VisitCheckInModalProps> = ({
  isOpen,
  onClose,
  retailer,
  salesman,
  allowedRadiusMetres = 100,
  onCheckInSuccess
}) => {
  // GPS Coordinates State
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number; timestamp: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [distanceMetres, setDistanceMetres] = useState<number | null>(null);
  const [isMockLocation, setIsMockLocation] = useState(false);

  // Live Camera Capture State
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhotoBase64, setCapturedPhotoBase64] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Form & Submit State
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera on unmount or close
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchLiveLocation();
      startLiveCamera();
    } else {
      stopCamera();
      setCoords(null);
      setGpsError(null);
      setCapturedPhotoBase64(null);
      setNotes('');
      setSubmitError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Connect stream to video element when stream is ready
  useEffect(() => {
    if (cameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.warn('Video play error:', e));
    }
  }, [cameraActive, cameraStream]);

  // Request fresh device GPS
  const fetchLiveLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your device or browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const ts = position.timestamp || Date.now();
        const mockFlag = Boolean((position.coords as any).isMock || false);

        setCoords({ lat: latitude, lng: longitude, accuracy, timestamp: ts });
        setIsMockLocation(mockFlag);
        setGpsLoading(false);

        // Calculate distance if retailer has saved GPS
        if (retailer.lat !== undefined && retailer.lng !== undefined) {
          const dist = calculateHaversineDistanceMetres(
            latitude,
            longitude,
            Number(retailer.lat),
            Number(retailer.lng)
          );
          setDistanceMetres(dist);
        } else {
          setDistanceMetres(null);
        }
      },
      (err) => {
        setGpsLoading(false);
        let msg = 'Failed to acquire device GPS position.';
        if (err.code === 1) msg = 'Location access permission was denied. Please allow GPS access in browser/device settings.';
        else if (err.code === 2) msg = 'GPS satellite signal unavailable. Please ensure location services are turned ON.';
        else if (err.code === 3) msg = 'Location request timed out. Please step into open sky or check high accuracy mode.';
        setGpsError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Start live camera stream
  const startLiveCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        setCameraStream(stream);
        setCameraActive(true);
      } else {
        setCameraError('Camera stream not supported directly on this browser. Use direct camera snapshot.');
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Camera access unavailable. Click to capture via device camera.');
      setCameraActive(false);
    }
  };

  // Capture snapshot from live stream
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Watermark with timestamp and store name
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(10, canvas.height - 40, canvas.width - 20, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      const timeStr = new Date().toLocaleString('en-IN');
      const storeStr = `${retailer.storeName} · Aryan Agency Beat Check-In`;
      ctx.fillText(`${storeStr} · ${timeStr}`, 18, canvas.height - 20);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhotoBase64(dataUrl);
      stopCamera();
    }
  };

  // Retake photo
  const handleRetakePhoto = () => {
    setCapturedPhotoBase64(null);
    startLiveCamera();
  };

  // Fallback direct camera file capture (enforcing live capture, no gallery)
  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setCapturedPhotoBase64(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Distance validation
  const hasShopGps = retailer.lat !== undefined && retailer.lng !== undefined;
  const isOutOfRadius = hasShopGps && distanceMetres !== null && distanceMetres > allowedRadiusMetres;
  const isWithinRadius = hasShopGps && distanceMetres !== null && distanceMetres <= allowedRadiusMetres;

  // Submit Check-In
  const handleSubmitCheckIn = async () => {
    setSubmitError(null);

    if (!hasShopGps) {
      setSubmitError(`Shop GPS Location Missing: "${retailer.storeName}" does not have registered GPS coordinates yet. An authorized Admin must capture shop coordinates first.`);
      return;
    }

    if (!coords) {
      setSubmitError('Device GPS coordinates are required. Please click "Refresh GPS" to acquire a satellite fix.');
      return;
    }

    if (isMockLocation) {
      setSubmitError('Mock location app detected. Check-in must be completed using genuine device GPS satellite fix.');
      return;
    }

    if (coords.accuracy > 100) {
      setSubmitError(`GPS Accuracy is low (±${Math.round(coords.accuracy)}m). High-accuracy GPS (within ±100m) is mandatory for verified check-in.`);
      return;
    }

    if (isOutOfRadius) {
      setSubmitError(`Out of Allowed Radius: You are ${distanceMetres}m away from ${retailer.storeName} (Allowed: ${allowedRadiusMetres}m). You must check in directly from the shop counter.`);
      return;
    }

    if (!capturedPhotoBase64) {
      setSubmitError('Live store front photo is mandatory. Please capture a live photo of the store front.');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Upload photo to server storage
      const photoUploadRes = await api.uploadVisitPhoto(capturedPhotoBase64);
      const photoUrl = photoUploadRes.photoUrl || capturedPhotoBase64;

      // 2. Perform server check-in
      const payload: VisitCheckInPayload = {
        salesmanId: salesman?.id,
        retailerId: retailer.id,
        lat: coords.lat,
        lng: coords.lng,
        accuracy: coords.accuracy,
        timestamp: coords.timestamp,
        isMockLocation,
        photoUrl,
        allowedRadiusMetres,
        notes: notes.trim()
      };

      const result = await api.checkInVisit(payload);

      if (result.success && result.visit) {
        onCheckInSuccess(result.visit);
        onClose();
      } else {
        setSubmitError(result.message || 'Check-in failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Check-in exception:', err);
      setSubmitError(err?.message || 'Check-in failed due to network or validation error.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black tracking-tight truncate">Beat Visit Check-In</h3>
              <p className="text-xs text-blue-100 truncate">
                {retailer.storeName} • {retailer.beatName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Shop Details Card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Store className="w-4 h-4 text-blue-600" />
                <span>{retailer.storeName}</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {retailer.beatName}
              </span>
            </div>
            <p className="text-slate-600 text-[11px]">
              <span className="font-semibold text-slate-700">Proprietor:</span> {retailer.ownerName} • <span className="font-mono">{retailer.phone}</span>
            </p>
            <p className="text-slate-500 text-[11px] truncate">
              <span className="font-semibold text-slate-700">Address:</span> {retailer.address}
            </p>
            {hasShopGps ? (
              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-600 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Shop Pin: {Number(retailer.lat).toFixed(5)}, {Number(retailer.lng).toFixed(5)}</span>
                </span>
                <a
                  href={`https://www.google.com/maps?q=${retailer.lat},${retailer.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                >
                  <span>View Map</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="pt-1.5 border-t border-slate-200 p-2 rounded-lg bg-amber-50 text-amber-800 flex items-center space-x-1.5 text-[11px]">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Shop GPS Missing: Authorized Admin must capture location coordinates first.</span>
              </div>
            )}
          </div>

          {/* Section 1: Live GPS & Distance Verification */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>Device Satellite Location Fix</span>
              </label>
              <button
                type="button"
                onClick={fetchLiveLocation}
                disabled={gpsLoading}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>{gpsLoading ? 'Locating...' : 'Refresh GPS'}</span>
              </button>
            </div>

            {gpsError ? (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2 text-[11px]">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-snug">{gpsError}</p>
              </div>
            ) : coords ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px] p-2 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Your Coordinates</span>
                    <span className="font-mono font-bold text-slate-800">
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">GPS Accuracy</span>
                    <span className={`font-mono font-bold ${coords.accuracy <= 50 ? 'text-emerald-700' : coords.accuracy <= 100 ? 'text-amber-700' : 'text-rose-700'}`}>
                      ±{Math.round(coords.accuracy)}m ({coords.accuracy <= 100 ? 'High' : 'Low'})
                    </span>
                  </div>
                </div>

                {/* Distance Badge */}
                {hasShopGps && distanceMetres !== null && (
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-bold ${
                    isWithinRadius
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}>
                    <div className="flex items-center space-x-1.5">
                      {isWithinRadius ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>
                        Distance from Counter: <strong className="font-mono text-sm">{distanceMetres}m</strong>
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wide font-extrabold px-2 py-0.5 rounded-full bg-white/70">
                      {isWithinRadius ? `✓ Within ${allowedRadiusMetres}m` : `✕ Exceeds ${allowedRadiusMetres}m`}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 text-center text-slate-400 text-xs">
                Acquiring high-accuracy satellite location fix...
              </div>
            )}
          </div>

          {/* Section 2: Live Camera Capture (Mandatory Store Front Photo) */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Live Shop Visit Photo (Mandatory)</span>
              </label>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Camera Only · No Gallery
              </span>
            </div>

            {capturedPhotoBase64 ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-950 aspect-video flex items-center justify-center">
                  <img
                    src={capturedPhotoBase64}
                    alt="Captured store front"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 shadow-md">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Captured & Verified</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRetakePhoto}
                  className="w-full py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Retake Photo
                </button>
              </div>
            ) : cameraActive ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-950 aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-md flex items-center justify-between">
                    <span>Point at store front / shop counter</span>
                    <span className="font-mono">{new Date().toLocaleTimeString('en-IN')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Store Front Photo</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center space-y-2">
                  <Camera className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-slate-600 font-semibold text-xs">Direct Live Camera Capture</p>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Use your phone camera to take an instant photo of the shop counter or exterior.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                      else startLiveCamera();
                    }}
                    className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Open Camera</span>
                  </button>
                  {/* Native camera trigger enforcing capture=environment */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileCapture}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Visit Notes */}
          <div>
            <label className="font-bold text-slate-700 block mb-1 text-xs">
              Check-In Notes / Purpose (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Daily order booking, payment follow-up, stock audit"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Error Display */}
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-xs text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Check-In Rejected</span>
              </div>
              <p className="text-[11px] leading-snug pl-5">{submitError}</p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {salesman ? `Salesman: ${salesman.name}` : 'Sales Representative'}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting || !coords || !hasShopGps || isOutOfRadius || !capturedPhotoBase64}
              onClick={handleSubmitCheckIn}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Verifying & Saving...' : 'Confirm Check-In'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
