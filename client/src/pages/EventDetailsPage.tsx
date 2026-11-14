import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  QrCode,
  BarChart3,
  AlertCircle,
  Share2,
  Users,
  Sparkles,
  Bot,
  Send,
  ExternalLink,
  Layers,
  Tag,
} from 'lucide-react';
import api from '../services/api';
import { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<Event[]>([]);

  // AI Q&A Assistant State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiAsking, setAiAsking] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/events/${id}`);
      if (res.data.success) {
        setEvent(res.data.event);
        fetchRecommendations(res.data.event.category, res.data.event._id);
      }
    } catch (err: any) {
      setError(err.customMessage || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (category?: string, currentEventId?: string) => {
    try {
      const res = await api.get('/ai/recommendations', {
        params: { category, currentEventId },
      });
      if (res.data.success) {
        setRecommendations(res.data.recommendations || []);
      }
    } catch (e) {
      // Non-critical
    }
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || !event) return;

    setAiAsking(true);
    setAiAnswer(null);

    try {
      const res = await api.post('/ai/ask-event', {
        eventId: event._id,
        question: aiQuestion.trim(),
      });

      if (res.data.success) {
        setAiAnswer(res.data.answer);
      } else if (res.data.requiresApiKey) {
        setAiAnswer(
          `AI Assistant is in preview mode (Set GEMINI_API_KEY in server/.env for live model response). Quick facts: ${event.name} will take place at ${event.venue} on ${event.date} from ${event.startTime} to ${event.endTime}.`
        );
      }
    } catch (err) {
      setAiAnswer('Unable to retrieve an answer at this moment. Please check the event description or venue desk.');
    } finally {
      setAiAsking(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    success('Event link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-xs font-semibold">Loading event telemetry...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Event Not Found</h2>
        <p className="text-xs text-slate-400 mt-2">{error || 'This event may have been removed.'}</p>
        <Link
          to="/events"
          className="mt-6 inline-flex px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold"
        >
          Back to Events Directory
        </Link>
      </div>
    );
  }

  const isCancelled = event.status === 'cancelled';
  const isFull = event.registrationCount >= event.capacity;
  const remaining = Math.max(0, event.capacity - event.registrationCount);
  const percentFilled = Math.min(
    100,
    Math.round((event.registrationCount / event.capacity) * 100)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Cancellation Notice */}
      {isCancelled && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 flex items-center space-x-3 text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <div className="font-bold text-sm">This event has been cancelled</div>
            <div className="text-xs text-rose-300/80 mt-0.5">
              {event.cancellationReason || 'The organizer has cancelled this session. Existing passes are invalidated.'}
            </div>
          </div>
        </div>
      )}

      {/* Event Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-brand-950/40 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              {event.eventId}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isCancelled
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : isFull
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-2 ${
                  isCancelled
                    ? 'bg-rose-400'
                    : isFull
                    ? 'bg-rose-400'
                    : 'bg-emerald-400 animate-pulse'
                }`}
              />
              {isCancelled ? 'CANCELLED' : isFull ? 'EVENT FULL' : `${remaining} Seats Available`}
            </span>
          </div>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5 text-xs font-semibold"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          {event.name}
        </h1>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/30">
            {event.category || 'General Conference'}
          </span>
          {event.tags &&
            event.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-white/[0.06]"
              >
                #{tag}
              </span>
            ))}
        </div>

        {/* Schedule & Venue Quick Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/[0.08] text-xs">
          <div className="flex items-center space-x-3 text-slate-300">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">{event.date}</div>
              <div className="text-slate-400 text-[11px]">
                {event.startTime} - {event.endTime}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-slate-300">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">{event.venue}</div>
              {event.locationUrl && (
                <a
                  href={event.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:underline text-[11px] flex items-center space-x-1"
                >
                  <span>Open Campus Map</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Description on Left, Action Box & AI Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description & Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Event Overview</span>
            </h2>
            <div className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          </div>

          {/* AI EVENT ASSISTANT CARD */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ask EventEase AI Assistant</h3>
                <div className="text-[11px] text-slate-400">
                  Instant answers grounded in real event facts & venue rules
                </div>
              </div>
            </div>

            <form onSubmit={handleAskAI} className="mt-4 flex gap-2">
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask about venue rules, timings, parking, dress code..."
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={aiAsking || !aiQuestion.trim()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5"
              >
                {aiAsking ? (
                  <span>Thinking...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask</span>
                  </>
                )}
              </button>
            </form>

            {aiAnswer && (
              <div className="mt-4 p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 leading-relaxed animate-in fade-in">
                <div className="font-bold text-purple-300 mb-1 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Response:</span>
                </div>
                {aiAnswer}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Capacity Status, Registration CTA & Recommendations */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">Registration Status</h3>

            {/* Capacity Progress Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Reserved Seats</span>
                <span className="font-mono font-bold text-white">
                  {event.registrationCount} / {event.capacity}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFull ? 'bg-rose-500' : 'bg-gradient-to-r from-brand-500 to-emerald-400'
                  }`}
                  style={{ width: `${percentFilled}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 text-right">
                {percentFilled}% Capacity Filled
              </div>
            </div>

            {/* Register CTA Button */}
            {!isCancelled ? (
              <Link
                to={`/events/${event._id}/register`}
                className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xl ${
                  isFull
                    ? 'bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 shadow-amber-900/20'
                    : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-brand-600/30'
                }`}
              >
                <span>{isFull ? 'Join Priority Waitlist' : 'Reserve Gate Ticket Pass'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="w-full py-3 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold text-center">
                Registrations Closed (Event Cancelled)
              </div>
            )}

            {/* Organizer Manage Link if authorized */}
            {user?.role === 'Organizer' && (
              <div className="mt-4 pt-4 border-t border-white/[0.08] flex justify-between text-xs">
                <Link
                  to={`/events/${event._id}/manage`}
                  className="text-brand-400 hover:underline font-semibold"
                >
                  Edit Event Settings
                </Link>
                <Link
                  to={`/events/${event._id}/participants`}
                  className="text-slate-400 hover:text-white font-semibold"
                >
                  View Attendees
                </Link>
              </div>
            )}
          </div>

          {/* Similar Recommended Events */}
          {recommendations.length > 0 && (
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 shadow-xl">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-brand-400 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommended for You</span>
              </div>
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec) => (
                  <Link
                    key={rec._id}
                    to={`/events/${rec._id}`}
                    className="block p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-white/[0.04] transition-colors group"
                  >
                    <div className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                      {rec.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>{rec.date}</span>
                      <span className="font-mono text-brand-400">{rec.eventId}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
