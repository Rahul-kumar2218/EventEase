import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  AlertCircle,
  XCircle,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import api from '../services/api';
import { Participant, Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const MyRegistrationsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedForCancel, setSelectedForCancel] = useState<Participant | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/my-registrations');
      return;
    }
    fetchRegistrations();
  }, [isAuthenticated]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/participants/me');
      if (res.data.success) {
        setRegistrations(res.data.registrations);
      }
    } catch (err: any) {
      console.error('Failed to load my registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCancelModal = (p: Participant) => {
    setSelectedForCancel(p);
    setCancelReason('');
    setModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedForCancel) return;
    setCancellingId(selectedForCancel.participantId);

    try {
      const res = await api.post(`/participants/${selectedForCancel.participantId}/cancel`, {
        reason: cancelReason || 'Cancelled by attendee from portal',
      });

      if (res.data.success) {
        success('Registration cancelled. Your seat has been released.');
        setModalOpen(false);
        fetchRegistrations();
      }
    } catch (err: any) {
      toastError(err.customMessage || 'Failed to cancel registration.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-xs text-brand-400 font-extrabold uppercase tracking-wider mb-1.5">
            <Ticket className="w-4 h-4 text-brand-400" />
            <span>Participant Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Event Passes & Registrations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access your secure QR digital gate passes, monitor entry status, and manage seat reservations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchRegistrations}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            to="/events"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all flex items-center space-x-1.5"
          >
            <span>Explore Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-slate-400 font-semibold">Retrieving your verified passes...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/60 border border-white/[0.08] rounded-3xl p-8 max-w-xl mx-auto shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mx-auto mb-4">
            <Ticket className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">No Active Registrations Found</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            You haven't registered for any campus events under{' '}
            <span className="font-mono text-brand-300 font-semibold">{user?.email}</span> yet.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <Link
              to="/events"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Browse Upcoming Events
            </Link>
            <Link
              to="/my-ticket"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Lookup Pass by Code
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registrations.map((p) => {
            const evt = p.eventId as Event;
            const isAttended = p.checkedIn;
            const isCancelled = p.status === 'cancelled';
            const isRevoked = p.status === 'revoked';

            return (
              <div
                key={p._id}
                className={`bg-slate-900/90 backdrop-blur-xl border rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-200 ${
                  isCancelled || isRevoked
                    ? 'border-rose-900/30 opacity-75'
                    : isAttended
                    ? 'border-emerald-500/30 shadow-emerald-950/20'
                    : 'border-white/[0.08] hover:border-slate-700'
                }`}
              >
                {/* Accent top gradient */}
                <div
                  className={`absolute top-0 inset-x-0 h-1.5 ${
                    isCancelled || isRevoked
                      ? 'bg-rose-500'
                      : isAttended
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-brand-500 to-indigo-500'
                  }`}
                />

                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-mono text-brand-300 font-bold px-2.5 py-0.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-[11px]">
                      {p.participantId}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isCancelled
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : isRevoked
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : isAttended
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {isCancelled
                        ? 'CANCELLED'
                        : isRevoked
                        ? 'REVOKED'
                        : isAttended
                        ? 'CHECKED IN'
                        : 'VALID PASS'}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-white mb-2 leading-snug line-clamp-2">
                    {evt?.name || 'Registered Event'}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-400 mb-5">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{evt?.date || 'Date TBD'}</span>
                      {evt?.startTime && <span>• {evt.startTime}</span>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{evt?.venue || 'Campus Venue'}</span>
                    </div>
                  </div>

                  {/* 6-char Entry Code Highlight */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/[0.06] mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Gate Entry Code
                      </div>
                      <div className="font-mono text-base font-extrabold text-white tracking-widest mt-0.5">
                        {p.entryCode}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Tier
                      </div>
                      <div className="text-xs font-semibold text-brand-300">
                        {p.ticketTier || 'Standard'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <Link
                    to={`/ticket/${p.participantId}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-brand-600/20 hover:bg-brand-600 text-brand-200 hover:text-white border border-brand-500/30 text-xs font-bold transition-all text-center flex items-center justify-center space-x-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR Pass</span>
                  </Link>

                  {!isAttended && !isCancelled && !isRevoked && (
                    <button
                      type="button"
                      onClick={() => openCancelModal(p)}
                      title="Cancel seat reservation"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-white/[0.06] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {modalOpen && selectedForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-extrabold text-white">Cancel Registration?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to cancel your pass for{' '}
              <span className="text-white font-bold">
                {(selectedForCancel.eventId as Event)?.name || 'this event'}
              </span>
              ? Your seat will be immediately released to the priority waitlist. This action cannot be reversed.
            </p>

            <div className="mt-4">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Reason for cancellation (optional):
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict, academic exam"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Keep Reservation
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancellingId === selectedForCancel.participantId}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-rose-600/30"
              >
                {cancellingId === selectedForCancel.participantId ? (
                  <span>Releasing Seat...</span>
                ) : (
                  <span>Yes, Cancel Pass</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

