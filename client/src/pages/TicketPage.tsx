import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { DigitalPass } from '../components/DigitalPass';
import api from '../services/api';
import { Participant, Event } from '../types';
import { Sparkles, ArrowLeft, AlertCircle, Search, ShieldCheck } from 'lucide-react';

export const TicketPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    // If arriving directly from successful registration, fire celebratory confetti
    if ((location.state as any)?.isNewRegistration) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4'],
        });
      } catch (e) {
        // ignore confetti errors in non-standard environments
      }
    }
  }, [location.state]);

  const fetchTicket = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/participants/${id}`);
      if (res.data.success) {
        setParticipant(res.data.participant);
        setEvent(res.data.event);
      }
    } catch (err: any) {
      setError(err.customMessage || 'Ticket pass not found. Check the participant ID.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-xs font-semibold">Generating verified cryptographic boarding pass...</p>
      </div>
    );
  }

  if (error || !participant || !event) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Ticket Not Found</h2>
        <p className="text-xs text-slate-400 mt-2">{error || 'Unable to locate this ticket pass.'}</p>
        <div className="mt-6 flex justify-center space-x-3">
          <Link
            to="/my-ticket"
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md"
          >
            Search by Entry Code
          </Link>
          <Link
            to="/events"
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
          >
            Explore Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Back and Status banner */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          to={`/events/${(event as any)?._id || ''}`}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Event</span>
        </Link>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Active Digital Pass</span>
        </div>
      </div>

      {/* Digital Pass Card */}
      <DigitalPass participant={participant} event={event} showActions={true} />

      {/* Staff Check-in prompt */}
      <div className="mt-8 text-center text-xs text-slate-400 print:hidden bg-slate-900/60 border border-white/[0.08] rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-center space-x-1.5 text-brand-300 font-semibold mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>At Venue Entrance Gate</span>
        </div>
        <div className="text-slate-300 font-medium">
          Show this QR code to the gate staff or quote entry code{' '}
          <span className="font-mono text-brand-300 font-extrabold tracking-widest bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">{participant.entryCode}</span>.
        </div>
      </div>
    </div>
  );
};
