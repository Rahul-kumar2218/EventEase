import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  QrCode,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  KeyRound,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  ArrowRight,
  ShieldCheck,
  Check,
  Wifi,
  WifiOff,
  CloudUpload,
  Activity,
  Users,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { Event, CheckInResult, Participant, CrowdTelemetry } from '../types';
import { QrScannerComponent } from '../components/QrScannerComponent';
import { useToast } from '../context/ToastContext';

// Web Audio API feedback sounds
const playFeedbackSound = (type: 'success' | 'duplicate' | 'error', soundEnabled: boolean) => {
  if (!soundEnabled || typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'success') {
      // Pleasant high double beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else {
      // Warning buzzer low tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    // Ignore audio errors
  }
};

export const CheckInPage: React.FC = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get('eventId');

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(preselectedEventId || '');
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [sampleParticipants, setSampleParticipants] = useState<Participant[]>([]);

  // Manual entry code state
  const [entryCode, setEntryCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Result state
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInResult[]>([]);

  // Offline Mode & Synchronization State
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [offlineRoster, setOfflineRoster] = useState<Participant[]>([]);
  const [syncingOffline, setSyncingOffline] = useState(false);
  const [syncModalResult, setSyncModalResult] = useState<any | null>(null);

  // Crowd Telemetry
  const [crowdTelemetry, setCrowdTelemetry] = useState<CrowdTelemetry | null>(null);

  // Fetch list of events for the selector
  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventDetails(selectedEventId);
      fetchSampleParticipants(selectedEventId);
      fetchCrowdTelemetry(selectedEventId);
      loadOfflineQueue(selectedEventId);
    }
  }, [selectedEventId]);

  const loadOfflineQueue = (evtId: string) => {
    try {
      const savedQueue = localStorage.getItem(`eventease_offline_queue_${evtId}`);
      if (savedQueue) {
        setOfflineQueue(JSON.parse(savedQueue));
      } else {
        setOfflineQueue([]);
      }

      const savedRoster = localStorage.getItem(`eventease_offline_roster_${evtId}`);
      if (savedRoster) {
        setOfflineRoster(JSON.parse(savedRoster));
      }
    } catch (e) {
      console.warn('Failed to load local offline queue', e);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      if (res.data.success && res.data.events.length > 0) {
        setEvents(res.data.events);
        if (!selectedEventId) {
          setSelectedEventId(res.data.events[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchEventDetails = async (evtId: string) => {
    try {
      const res = await api.get(`/events/${evtId}`);
      if (res.data.success) {
        setActiveEvent(res.data.event);
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
    }
  };

  const fetchSampleParticipants = async (evtId: string) => {
    try {
      const res = await api.get(`/events/${evtId}/participants?limit=5`);
      if (res.data.success) {
        setSampleParticipants(res.data.participants);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCrowdTelemetry = async (evtId: string) => {
    try {
      const res = await api.get(`/events/${evtId}/crowd`);
      if (res.data.success) {
        setCrowdTelemetry(res.data.telemetry);
      }
    } catch (e) {
      // Crowd telemetry optional
    }
  };

  // Download entire event roster for offline capability
  const downloadOfflineRoster = async () => {
    if (!selectedEventId) return;
    try {
      toast('Downloading participant roster for offline gate operation...', 'info');
      const res = await api.get(`/events/${selectedEventId}/participants?limit=500`);
      if (res.data.success) {
        const roster = res.data.participants;
        setOfflineRoster(roster);
        localStorage.setItem(`eventease_offline_roster_${selectedEventId}`, JSON.stringify(roster));
        toast(`Offline roster cached (${roster.length} participants). Ready for offline scanning!`, 'success');
      }
    } catch (err) {
      toast('Failed to download offline roster. Check connection.', 'error');
    }
  };

  // Perform check-in via API or Offline Local Cache
  const executeCheckIn = async (payload: { qrToken?: string; entryCode?: string }) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const now = new Date();

    // IF OFFLINE MODE IS ENABLED
    if (isOfflineMode) {
      const codeOrToken = payload.entryCode || payload.qrToken;
      const cached = offlineRoster.find(
        (p) =>
          p.entryCode.toUpperCase() === payload.entryCode?.toUpperCase() ||
          p.qrToken === payload.qrToken
      );

      if (!cached) {
        const failureResult: CheckInResult = {
          success: false,
          status: 'INVALID_ENTRY',
          message: 'Invalid QR code or entry code (Not found in offline roster)',
        };
        setLastResult(failureResult);
        playFeedbackSound('error', soundEnabled);
        setIsProcessing(false);
        return;
      }

      // Check if already checked in locally or previously
      if (cached.checkedIn) {
        const duplicateResult: CheckInResult = {
          success: false,
          status: 'ALREADY_CHECKED_IN',
          message: 'Participant has already checked in',
          checkInTime: cached.checkInTime || now.toISOString(),
          participant: {
            name: cached.name,
            participantId: cached.participantId,
            college: cached.college,
            entryCode: cached.entryCode,
          },
        };
        setLastResult(duplicateResult);
        playFeedbackSound('duplicate', soundEnabled);
        setIsProcessing(false);
        return;
      }

      // Perform local offline check-in
      cached.checkedIn = true;
      cached.checkInTime = now.toISOString();

      const newOfflineItem = {
        participantId: cached.participantId,
        entryCode: cached.entryCode,
        qrToken: cached.qrToken,
        timestamp: now.toISOString(),
        gate: 'Offline Gate Terminal',
      };

      const updatedQueue = [...offlineQueue, newOfflineItem];
      setOfflineQueue(updatedQueue);
      localStorage.setItem(`eventease_offline_queue_${selectedEventId}`, JSON.stringify(updatedQueue));
      localStorage.setItem(`eventease_offline_roster_${selectedEventId}`, JSON.stringify(offlineRoster));

      const successResult: CheckInResult = {
        success: true,
        status: 'CHECKED_IN',
        message: 'Check-in successful (Queued Offline)',
        participant: {
          name: cached.name,
          participantId: cached.participantId,
          college: cached.college,
          department: cached.department,
          entryCode: cached.entryCode,
        },
        checkInTime: now.toISOString(),
      };

      setLastResult(successResult);
      playFeedbackSound('success', soundEnabled);
      setRecentCheckIns((prev) => [successResult, ...prev.slice(0, 9)]);
      setEntryCode('');
      setIsProcessing(false);
      return;
    }

    // ONLINE SERVER-SIDE EXECUTION
    try {
      const body: any = { ...payload };
      if (selectedEventId) {
        body.eventId = selectedEventId;
      }

      const res = await api.post('/checkin', body);
      const result: CheckInResult = res.data;

      setLastResult(result);
      playFeedbackSound('success', soundEnabled);

      // Add to recent stream
      setRecentCheckIns((prev) => [result, ...prev.slice(0, 9)]);

      // Refresh event attendance stats and crowd telemetry
      if (selectedEventId) {
        fetchEventDetails(selectedEventId);
        fetchSampleParticipants(selectedEventId);
        fetchCrowdTelemetry(selectedEventId);
      }

      // Clear manual entry input
      setEntryCode('');
    } catch (err: any) {
      const data = err.data || {};
      const status = data.status || 'INVALID_ENTRY';
      const message = err.customMessage || data.message || 'Check-in failed.';

      const failureResult: CheckInResult = {
        success: false,
        status,
        message,
        checkInTime: data.checkInTime,
        participant: data.participant,
      };

      setLastResult(failureResult);

      if (status === 'ALREADY_CHECKED_IN') {
        playFeedbackSound('duplicate', soundEnabled);
      } else {
        playFeedbackSound('error', soundEnabled);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Sync offline queue to backend server
  const handleSyncOffline = async () => {
    if (offlineQueue.length === 0 || !selectedEventId) return;
    setSyncingOffline(true);

    try {
      const res = await api.post('/checkin/offline-sync', {
        items: offlineQueue,
        eventId: selectedEventId,
      });

      if (res.data.success) {
        setSyncModalResult(res.data);
        setOfflineQueue([]);
        localStorage.removeItem(`eventease_offline_queue_${selectedEventId}`);
        toast(`Synced ${res.data.summary.syncedCount} check-in records!`, 'success');
        fetchEventDetails(selectedEventId);
        fetchCrowdTelemetry(selectedEventId);
      }
    } catch (err: any) {
      toast('Failed to sync offline records. Ensure backend is reachable.', 'error');
    } finally {
      setSyncingOffline(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryCode.trim()) return;
    executeCheckIn({ entryCode: entryCode.trim().toUpperCase() });
  };

  const handleQrScan = (scannedText: string) => {
    let token = scannedText.trim();
    if (token.includes('/ticket/')) {
      token = token.split('/ticket/')[1].split('?')[0];
    }
    executeCheckIn({ qrToken: token });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Title and Event Selector Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-brand-400 mb-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isOfflineMode ? 'bg-amber-400 animate-bounce' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span>{isOfflineMode ? 'OFFLINE OPERATION MODE' : 'Live Gate Access Control OS'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-2">
            <span className="bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
              EVENTEASE CHECK-IN
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Dedicated High-Speed Gate Entry & Optical Pass Verification Terminal
          </p>
        </div>

        {/* Controls: Offline toggle, Audio Toggle, and Event Selector */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Offline Mode Switch */}
          <button
            onClick={() => {
              if (!isOfflineMode && offlineRoster.length === 0) {
                downloadOfflineRoster();
              }
              setIsOfflineMode(!isOfflineMode);
              toast(
                !isOfflineMode
                  ? 'Switched to Offline Gate Mode. Scans verified locally.'
                  : 'Returned to Online Live Mode.',
                'info'
              );
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center space-x-1.5 transition-all ${
              isOfflineMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-glow-amber'
                : 'bg-slate-900 text-slate-300 border-white/[0.08] hover:bg-slate-800'
            }`}
          >
            {isOfflineMode ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
            <span>{isOfflineMode ? 'Offline Mode Active' : 'Go Offline'}</span>
          </button>

          {/* Sync Offline Queue Button if pending */}
          {offlineQueue.length > 0 && (
            <button
              onClick={handleSyncOffline}
              disabled={syncingOffline}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-blue-600/30 animate-pulse"
            >
              <CloudUpload className="w-4 h-4" />
              <span>Sync ({offlineQueue.length})</span>
            </button>
          )}

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              toast(soundEnabled ? 'Acoustic cues muted' : 'Acoustic cues enabled', 'info');
            }}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute Audio Cues' : 'Enable Audio Cues'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="flex-1 md:w-64 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-brand-500 shadow-sm"
          >
            {events.map((evt) => (
              <option key={evt._id} value={evt._id}>
                {evt.name} ({evt.attendanceCount}/{evt.registrationCount})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Crowd Velocity & Capacity Alert Banner */}
      {crowdTelemetry && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all ${
            crowdTelemetry.alertLevel === 'CRITICAL'
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : crowdTelemetry.alertLevel === 'WARNING'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : 'bg-slate-900/60 border-white/[0.08] text-slate-300'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                crowdTelemetry.alertLevel === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-400'
                  : crowdTelemetry.alertLevel === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-brand-500/10 text-brand-400'
              }`}
            >
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider flex items-center space-x-2">
                <span>Gate Velocity:</span>
                <span className="font-mono text-white text-sm">
                  {crowdTelemetry.velocityPerMinute} scans/min
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/10">
                  {crowdTelemetry.alertLevel} CAPACITY
                </span>
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                {crowdTelemetry.occupancyRate}% hall capacity occupied ({crowdTelemetry.currentAttendance} / {crowdTelemetry.capacity}). Available seats: {crowdTelemetry.availableSeats}.
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={downloadOfflineRoster}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-white/[0.06] transition-colors"
            >
              Cache Roster Locally
            </button>
          </div>
        </div>
      )}

      {/* Live Counter Badges for Selected Event */}
      {activeEvent && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-slate-900/80 border border-white/[0.08] rounded-2xl p-4 shadow-lg">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Hall Capacity</div>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-white mt-1">
              {activeEvent.capacity}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Seating Threshold</div>
          </div>

          <div className="bg-slate-900/80 border border-white/[0.08] rounded-2xl p-4 shadow-lg">
            <div className="text-[10px] uppercase font-bold text-brand-400">Registered Passes</div>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-brand-300 mt-1">
              {activeEvent.registrationCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Issued Passes</div>
          </div>

          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 shadow-lg bg-emerald-950/20">
            <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center space-x-1">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Admitted at Gate</span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-300 mt-1">
              {activeEvent.attendanceCount}
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">
              {activeEvent.registrationCount > 0
                ? `${Math.round((activeEvent.attendanceCount / activeEvent.registrationCount) * 100)}% Turnout`
                : '0% Turnout'}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/[0.08] rounded-2xl p-4 shadow-lg">
            <div className="text-[10px] uppercase font-bold text-amber-400">Awaiting Arrival</div>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-slate-300 mt-1">
              {Math.max(0, activeEvent.registrationCount - activeEvent.attendanceCount)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Not Checked In</div>
          </div>
        </div>
      )}

      {/* QUICK DEMO SIMULATOR BUTTONS */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 via-slate-900 to-indigo-950/30 border border-purple-800/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-purple-300 font-semibold">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <span>Quick Simulator for Evaluators:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {sampleParticipants.length > 0 && (
            <button
              onClick={() => {
                const p = sampleParticipants.find((x) => !x.checkedIn) || sampleParticipants[0];
                setEntryCode(p.entryCode);
                executeCheckIn({ entryCode: p.entryCode });
              }}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-brand-600/30 hover:bg-brand-600 text-brand-200 hover:text-white border border-brand-500/40 text-xs font-bold transition-all"
            >
              Test Valid Code ({sampleParticipants[0]?.entryCode || 'DEMO'})
            </button>
          )}

          <button
            onClick={() => executeCheckIn({ entryCode: 'INVALID999' })}
            disabled={isProcessing}
            className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/30 text-xs font-bold transition-all"
          >
            Test Invalid Code
          </button>
        </div>
      </div>

      {/* MAIN CHECK-IN INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT COLUMN: [ QR SCANNER ] & MANUAL CODE ENTRY */}
        <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-6 shadow-2xl flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <QrCode className="w-4 h-4 text-brand-400" />
              <span>Camera QR Scanner</span>
            </span>
            <span className="text-[10px] font-mono bg-brand-500/10 text-brand-300 border border-brand-500/20 px-2 py-0.5 rounded-full font-bold">
              Sub-second Engine
            </span>
          </div>

          {/* QR Scanner Component */}
          <QrScannerComponent onScanSuccess={handleQrScan} isScanning={isProcessing} />

          {/* OR DIVIDER */}
          <div className="w-full my-6 flex items-center justify-center">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="px-4 text-xs font-extrabold uppercase tracking-widest text-slate-500">
              OR
            </span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          {/* MANUAL ENTRY CODE FORM */}
          <div className="w-full">
            <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
              Enter Entry Code
            </label>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={10}
                  value={entryCode}
                  onChange={(e) => setEntryCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A7K9P2"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-center font-mono text-xl font-extrabold tracking-widest text-white uppercase placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !entryCode.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Verifying Entry...</span>
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>VERIFY ENTRY</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH-CONTRAST VERIFICATION RESULTS & AUDIT STREAM */}
        <div className="space-y-6">
          {/* RESULT STATUS DISPLAY */}
          {lastResult ? (
            <div
              className={`rounded-3xl p-6 border shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200 ${
                lastResult.status === 'CHECKED_IN'
                  ? 'bg-gradient-to-b from-emerald-950/90 via-slate-900 to-slate-950 border-emerald-500/60 shadow-glow-emerald'
                  : lastResult.status === 'ALREADY_CHECKED_IN'
                  ? 'bg-gradient-to-b from-rose-950/90 via-slate-900 to-slate-950 border-rose-500/70 shadow-glow-rose'
                  : 'bg-gradient-to-b from-rose-950/90 via-slate-900 to-slate-950 border-rose-500/60 shadow-glow-rose'
              }`}
            >
              <div className="flex items-center space-x-3 mb-4">
                {lastResult.status === 'CHECKED_IN' ? (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                ) : lastResult.status === 'ALREADY_CHECKED_IN' ? (
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 animate-pulse">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <XCircle className="w-7 h-7" />
                  </div>
                )}

                <div>
                  <div
                    className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                      lastResult.status === 'CHECKED_IN'
                        ? 'text-emerald-300'
                        : lastResult.status === 'ALREADY_CHECKED_IN'
                        ? 'text-rose-300'
                        : 'text-rose-400'
                    }`}
                  >
                    {lastResult.status === 'CHECKED_IN'
                      ? 'SUCCESSFUL CHECK-IN'
                      : lastResult.status === 'ALREADY_CHECKED_IN'
                      ? 'DUPLICATE CHECK-IN REJECTED'
                      : 'ENTRY REJECTED'}
                  </div>
                  <div className="text-xs text-slate-300 font-medium">{lastResult.message}</div>
                </div>
              </div>

              {/* Duplicate Check-in Original Timestamp Warning */}
              {lastResult.status === 'ALREADY_CHECKED_IN' && lastResult.checkInTime && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-900/30 border border-rose-700/50 flex items-center space-x-2.5 text-xs text-rose-200">
                  <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <span className="font-bold">Original Check-in Timestamp: </span>
                    <span className="font-mono">
                      {new Date(lastResult.checkInTime).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Participant Details Card */}
              {lastResult.participant && (
                <div className="space-y-2 text-xs bg-slate-950/80 p-4 rounded-2xl border border-white/[0.08]">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <span className="text-slate-400 font-semibold">Full Name:</span>
                    <span className="font-extrabold text-white">{lastResult.participant.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <span className="text-slate-400 font-semibold">Participant ID:</span>
                    <span className="font-mono font-bold text-brand-300">
                      {lastResult.participant.participantId}
                    </span>
                  </div>
                  {lastResult.participant.college && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-800">
                      <span className="text-slate-400 font-semibold">College:</span>
                      <span className="text-slate-200">{lastResult.participant.college}</span>
                    </div>
                  )}
                  {lastResult.participant.entryCode && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400 font-semibold">Entry Code:</span>
                      <span className="font-mono font-extrabold text-brand-300 tracking-wider">
                        {lastResult.participant.entryCode}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl p-8 border border-white/[0.08] bg-slate-900/40 text-center text-slate-500">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <div className="text-sm font-bold text-slate-400">Terminal Ready</div>
              <div className="text-xs mt-1 text-slate-500">
                Scan attendee QR code or input 6-character entry code to process check-in.
              </div>
            </div>
          )}

          {/* RECENT CHECK-INS STREAM */}
          <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-brand-400" />
                <span>Recent Gate Activity</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {recentCheckIns.length} recorded
              </span>
            </div>

            {recentCheckIns.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">
                No scans recorded in this session yet.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {recentCheckIns.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-950 border border-white/[0.04] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          item.status === 'CHECKED_IN' ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      <div>
                        <div className="font-bold text-white truncate max-w-[160px]">
                          {item.participant?.name || 'Attendee'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.participant?.participantId || item.participant?.entryCode}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          item.status === 'CHECKED_IN'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {item.status}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString() : 'Just now'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offline Sync Summary Modal */}
      {syncModalResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/[0.12] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-extrabold text-white">Offline Synchronization Report</h3>
            <p className="text-xs text-slate-400 mt-1">
              Offline gate records synchronized with server database.
            </p>

            <div className="my-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Records Processed:</span>
                <span className="font-bold text-white font-mono">
                  {syncModalResult.summary?.totalReceived}
                </span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Successful Admissions:</span>
                <span className="font-bold font-mono">
                  {syncModalResult.summary?.syncedCount}
                </span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>Duplicates / Conflicts Flagged:</span>
                <span className="font-bold font-mono">
                  {syncModalResult.summary?.duplicateCount}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSyncModalResult(null)}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors"
            >
              Done & Return to Terminal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
