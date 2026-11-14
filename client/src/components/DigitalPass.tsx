import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  MapPin,
  Clock,
  Copy,
  Check,
  Printer,
  Maximize2,
  X,
  Sparkles,
  ShieldCheck,
  Building,
  GraduationCap,
  Share2,
  ExternalLink,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Participant, Event } from '../types';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

interface DigitalPassProps {
  participant: Participant;
  event: Event;
  showActions?: boolean;
  onCancelled?: () => void;
}

export const DigitalPass: React.FC<DigitalPassProps> = ({
  participant: initialParticipant,
  event,
  showActions = true,
  onCancelled,
}) => {
  const { success, error: toastError } = useToast();
  const [participant, setParticipant] = useState<Participant>(initialParticipant);
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(participant.entryCode);
    setCopied(true);
    success(`Entry Code ${participant.entryCode} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSharePass = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    success('Pass link copied to clipboard!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancelRegistration = async () => {
    setCancelling(true);
    try {
      const res = await api.post(`/participants/${participant.participantId}/cancel`, {
        reason: 'Cancelled by attendee',
      });
      if (res.data.success) {
        success('Registration cancelled. Your reserved seat has been released.');
        setParticipant((prev) => ({ ...prev, status: 'cancelled' }));
        setCancelModalOpen(false);
        if (onCancelled) onCancelled();
      }
    } catch (err: any) {
      toastError(err.customMessage || 'Failed to cancel registration.');
    } finally {
      setCancelling(false);
    }
  };

  const isCancelled = participant.status === 'cancelled';
  const isRevoked = participant.status === 'revoked';
  const isAttended = participant.checkedIn;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Ticket Pass Card */}
      <div
        id="printable-ticket"
        className={`relative bg-gradient-to-b from-slate-900 via-[#0A101D] to-slate-950 border rounded-3xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:m-0 ${
          isCancelled || isRevoked
            ? 'border-rose-900/40 shadow-rose-950/20'
            : isAttended
            ? 'border-emerald-500/30 shadow-emerald-950/30'
            : 'border-white/[0.12] shadow-indigo-950/40'
        }`}
      >
        {/* Holographic Header Bar */}
        <div
          className={`p-5 text-white text-center relative overflow-hidden ${
            isCancelled || isRevoked
              ? 'bg-rose-900/80'
              : isAttended
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
              : 'bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600'
          }`}
        >
          <div className="absolute inset-0 bg-white/10 opacity-40 transform -skew-x-12 translate-x-1/2 pointer-events-none"></div>

          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-1.5">
            <span className="flex items-center space-x-1.5 text-brand-100">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Official Event Pass</span>
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider backdrop-blur-md border ${
                isCancelled
                  ? 'bg-rose-500/30 border-rose-400 text-rose-200'
                  : isRevoked
                  ? 'bg-red-500/40 border-red-300 text-red-100'
                  : isAttended
                  ? 'bg-emerald-500/25 border-emerald-400/40 text-emerald-200'
                  : 'bg-white/20 border-white/30 text-white'
              }`}
            >
              {isCancelled
                ? 'PASS CANCELLED'
                : isRevoked
                ? 'PASS REVOKED'
                : isAttended
                ? 'CHECKED IN'
                : 'VALID ENTRY'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
            {event?.name || 'Event Registration'}
          </h2>
          <div className="text-xs text-brand-200 font-mono mt-1 font-semibold">
            PASS #{participant.participantId} • {participant.ticketTier || 'Standard Entry'}
          </div>
        </div>

        {/* Cancellation Notice if Cancelled */}
        {(isCancelled || isRevoked) && (
          <div className="bg-rose-950/70 border-b border-rose-800/40 px-4 py-2.5 text-center text-xs text-rose-300 flex items-center justify-center space-x-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>
              {isRevoked
                ? 'This ticket pass was revoked by the organizer. Entry at gates is barred.'
                : 'This registration has been cancelled. Seat returned to pool.'}
            </span>
          </div>
        )}

        {/* Participant & Event Body */}
        <div className="p-6 space-y-5">
          {/* Participant Primary Info */}
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              Participant Name
            </div>
            <div className="text-2xl font-extrabold text-white mt-0.5 tracking-tight">
              {participant.name}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                <Building className="w-3.5 h-3.5 mr-1 text-brand-400" />
                {participant.college}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                <GraduationCap className="w-3.5 h-3.5 mr-1 text-purple-400" />
                {participant.department} • {participant.year}
              </span>
            </div>
          </div>

          {/* Event Schedule & Venue */}
          <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-white/[0.08]">
            <div>
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-brand-400" />
                <span>Date & Time</span>
              </div>
              <div className="text-xs font-bold text-slate-100 mt-1">{event?.date}</div>
              <div className="text-[11px] text-slate-400 font-medium">
                {event?.startTime} - {event?.endTime}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-rose-400" />
                <span>Venue</span>
              </div>
              <div className="text-xs font-bold text-slate-100 mt-1 line-clamp-2">
                {event?.venue}
              </div>
            </div>
          </div>

          {/* Perforated Notch Divider */}
          <div className="relative py-2 -mx-6 flex items-center justify-between select-none">
            <div className="w-6 h-6 rounded-full bg-[#080C14] -ml-3 border-r border-white/[0.08]"></div>
            <div className="flex-1 border-b-2 border-dashed border-slate-800 mx-2"></div>
            <div className="w-6 h-6 rounded-full bg-[#080C14] -mr-3 border-l border-white/[0.08]"></div>
          </div>

          {/* QR Code and Entry Code Section */}
          <div className="flex flex-col items-center justify-center p-5 bg-slate-950/80 rounded-2xl border border-white/[0.06] shadow-inner">
            {/* The QR Code */}
            <div
              onClick={() => !isCancelled && !isRevoked && setQrModalOpen(true)}
              className={`p-3.5 bg-white rounded-2xl shadow-xl transition-transform duration-200 group relative ${
                isCancelled || isRevoked
                  ? 'opacity-40 grayscale cursor-not-allowed'
                  : 'cursor-pointer hover:scale-105 active:scale-100'
              }`}
              title={
                isCancelled || isRevoked
                  ? 'Pass inactive'
                  : 'Click to expand QR Code for high-speed scanning'
              }
            >
              <QRCodeSVG
                value={participant.qrToken}
                size={160}
                level="H"
                includeMargin={false}
              />
              {!isCancelled && !isRevoked && (
                <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                  <span className="p-1.5 rounded-lg bg-black/70 text-white text-[10px] font-bold backdrop-blur-sm">
                    Zoom
                  </span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 mt-3 flex items-center space-x-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isCancelled || isRevoked
                  ? 'Pass deactivated'
                  : 'Cryptographically signed gate token'}
              </span>
            </div>

            {/* Manual Entry Code Box */}
            <div className="w-full mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between px-2">
              <div>
                <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                  Backup Entry Code
                </div>
                <div className="text-2xl font-mono font-extrabold tracking-widest text-brand-300">
                  {participant.entryCode}
                </div>
              </div>

              <button
                onClick={handleCopyCode}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors flex items-center space-x-1 text-xs font-semibold"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info & cancellation option */}
        <div className="bg-slate-950 px-6 py-3 border-t border-white/[0.06] text-center text-[10px] text-slate-500 flex items-center justify-between">
          <span>Registered: {new Date(participant.registeredAt).toLocaleDateString()}</span>
          {!isAttended && !isCancelled && !isRevoked && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="text-rose-400 hover:text-rose-300 font-semibold underline"
            >
              Cancel pass
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons for download, print, share */}
      {showActions && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center space-x-2 shadow-md border border-white/[0.08]"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print or Save PDF</span>
          </button>

          <button
            onClick={handleSharePass}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center space-x-2 shadow-md border border-white/[0.08]"
          >
            <Share2 className="w-4 h-4 text-slate-400" />
            <span>Share Ticket Link</span>
          </button>
        </div>
      )}

      {/* Expanded QR Modal */}
      {qrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-white/[0.15] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-xs uppercase font-extrabold text-brand-400 tracking-wider mb-2">
              Gate Inspection Mode
            </div>
            <h3 className="text-lg font-bold text-white mb-6">
              {participant.name}
            </h3>

            <div className="p-4 bg-white rounded-3xl inline-block shadow-2xl">
              <QRCodeSVG
                value={participant.qrToken}
                size={240}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="mt-6 font-mono text-xl font-extrabold tracking-widest text-brand-300">
              {participant.entryCode}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Present this enlarged QR code directly to the gate scanner terminal.
            </p>
          </div>
        </div>
      )}

      {/* Cancel Pass Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-left">
            <h3 className="text-lg font-extrabold text-white">Release Ticket Seat?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Cancelling your registration will immediately forfeit your seat and reassign it to a student on the waitlist. This action is permanent.
            </p>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Keep Pass
              </button>
              <button
                onClick={handleCancelRegistration}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center space-x-1"
              >
                {cancelling ? <span>Cancelling...</span> : <span>Confirm Cancel</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
