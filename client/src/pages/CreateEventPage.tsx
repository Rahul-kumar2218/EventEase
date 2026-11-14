import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Plus,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Bot,
  Layers,
  Tag,
  Link as LinkIcon,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology & Engineering');
  const [tagsInput, setTagsInput] = useState('Hackathon, AI, Engineering');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [venue, setVenue] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [capacity, setCapacity] = useState('100');

  // AI Assistant Modal state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'Technology & Engineering',
    'Cultural & Arts',
    'Business & Entrepreneurship',
    'Science & Innovation',
    'Gaming & Esports',
    'Academic & Symposium',
    'Sports & Fitness',
  ];

  const handleGenerateAiDescription = async () => {
    if (!name.trim()) {
      showToast('Please enter an event title first so the AI can craft a description.', 'error');
      return;
    }

    setAiGenerating(true);
    try {
      const res = await api.post('/ai/generate-description', {
        title: name,
        category,
        venue,
      });

      if (res.data.success && res.data.description) {
        setDescription(res.data.description);
        showToast('AI-crafted event overview generated!', 'success');
      } else if (res.data.requiresApiKey) {
        setDescription(
          `Join us for ${name}, the premier ${category} gathering hosted at ${venue || 'our campus auditorium'}. Engage in keynote sessions, collaborative hackathons, and high-impact networking with industry leaders.`
        );
        showToast('AI template applied (Set GEMINI_API_KEY in server/.env for live model generation).', 'info');
      }
    } catch (err: any) {
      showToast('Failed to contact AI service.', 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !description.trim() || !date || !startTime || !endTime || !venue.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    const numCapacity = parseInt(capacity, 10);
    if (isNaN(numCapacity) || numCapacity <= 0) {
      setError('Capacity must be a positive number greater than 0.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      const res = await api.post('/events', {
        name,
        description,
        category,
        tags,
        date,
        startTime,
        endTime,
        venue,
        locationUrl,
        capacity: numCapacity,
      });

      if (res.data.success) {
        showToast(`Event "${res.data.event.name}" published successfully!`, 'success');
        navigate(`/events/${res.data.event._id}`);
      }
    } catch (err: any) {
      const msg = err.customMessage || 'Failed to create event. Please verify all details.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500" />

        <div className="mb-8">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Event Management Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create New Event
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Configure event schedule, campus venue, capacity thresholds, tags, and gate check-in parameters.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TechFest 2026: AI & Robotics Innovation Summit"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-sm"
            />
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-brand-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="AI, Hackathon, Robotics"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Description & AI Assistant */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Event Description *
              </label>
              <button
                type="button"
                onClick={handleGenerateAiDescription}
                disabled={aiGenerating}
                className="px-3 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[11px] font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>{aiGenerating ? 'Generating...' : 'AI Auto-Craft Description'}</span>
              </button>
            </div>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe event agenda, keynote speakers, workshops, and attendee expectations..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-sm leading-relaxed"
            />
          </div>

          {/* Date, Start Time, End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Start Time *
              </label>
              <input
                type="text"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="09:00 AM"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                End Time *
              </label>
              <input
                type="text"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="05:00 PM"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Venue & Location URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Campus Venue / Hall *
              </label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Main Auditorium, Block C"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Campus Map URL (optional)
              </label>
              <input
                type="url"
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Hall Seating Capacity *
            </label>
            <input
              type="number"
              required
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-brand-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Once registration hits this limit, subsequent applicants are automatically redirected to the Priority Waitlist.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Publishing Event...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Event & Open Registration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
