import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { Event } from '../types';
import { useToast } from '../context/ToastContext';

export const RegisterParticipantPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('3rd Year');

  // Error and Status States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingTicketId, setExistingTicketId] = useState<string | null>(null);

  // Waitlist State
  const [waitlistSuccess, setWaitlistSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    if (!id) return;
    setLoadingEvent(true);
    try {
      const res = await api.get(`/events/${id}`);
      if (res.data.success) {
        setEvent(res.data.event);
      }
    } catch (err: any) {
      setErrorMessage(err.customMessage || 'Failed to load event details.');
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setExistingTicketId(null);
    setSubmitting(true);

    try {
      const res = await api.post(`/events/${id}/register`, {
        name,
        email,
        phone,
        college,
        department,
        year,
      });

      if (res.data.success) {
        success('Registration successful! Pass generated.');
        const participantId = res.data.participant.participantId;
        navigate(`/ticket/${participantId}`, {
          state: { isNewRegistration: true },
        });
      }
    } catch (err: any) {
      const data = err.data || {};
      const status = data.status || '';
      const message = err.customMessage || 'Registration failed.';

      setErrorMessage(message);
      toastError(message);

      if (data.existingParticipant?.participantId) {
        setExistingTicketId(data.existingParticipant.participantId);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!name || !email || !phone || !college || !department || !year) {
      setErrorMessage('Please fill out all fields to join the waitlist.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/events/${id}/waitlist`, {
        name,
        email,
        phone,
        college,
        department,
        year,
      });
      if (res.data.success) {
        setWaitlistSuccess(res.data.message);
        success('Successfully added to waitlist!');
        setErrorMessage(null);
      }
    } catch (err: any) {
      const msg = err.customMessage || 'Failed to join waitlist.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-xs font-semibold">Loading registration form...</p>
      </div>
    );
  }

  const isFull = event ? event.registrationCount >= event.capacity : false;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Top Accent Gradient */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500"></div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono text-brand-400 font-bold bg-brand-500/10 px-2.5 py-0.5 rounded-lg border border-brand-500/20 text-[11px]">
              {event?.eventId}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                isFull
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  isFull ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'
                }`}
              ></span>
              {isFull ? 'EVENT FULL' : `${(event?.capacity || 0) - (event?.registrationCount || 0)} Seats Available`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Register for {event?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Enter your details below to generate your official digital gate pass with secure QR token.
          </p>
        </div>

        {/* Capacity Warning Alert if Full */}
        {isFull && !waitlistSuccess && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-rose-300 uppercase tracking-wide">
                EVENT FULL
              </div>
              <div className="text-xs text-rose-300/90 mt-1 leading-relaxed">
                Registration capacity has been reached ({event?.capacity} / {event?.capacity}). No additional instant passes can be issued.
                Submit your information below to join the priority waitlist.
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-bold text-rose-300 uppercase">Registration Notice</div>
              <div className="text-xs text-rose-200 mt-1 leading-relaxed">{errorMessage}</div>
              {existingTicketId && (
                <Link
                  to={`/ticket/${existingTicketId}`}
                  className="mt-2.5 inline-flex items-center space-x-1 text-xs text-brand-300 hover:text-white font-bold underline"
                >
                  <span>View your existing pass (#{existingTicketId})</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Waitlist Success Message */}
        {waitlistSuccess && (
          <div className="mb-6 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-emerald-300">Waitlist Request Confirmed</div>
              <div className="text-xs text-emerald-200 mt-1 leading-relaxed">{waitlistSuccess}</div>
              <Link
                to="/events"
                className="mt-3.5 inline-block px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors"
              >
                Explore other events
              </Link>
            </div>
          </div>
        )}

        {/* Registration Form */}
        {!waitlistSuccess && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
            </div>

            {/* Email & Phone in 2 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* College Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                College / Institution <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
            </div>

            {/* Department and Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Department / Branch <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science & Eng"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Year of Study <span className="text-rose-400">*</span>
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate / Masters">Postgraduate / Masters</option>
                  <option value="Faculty / Other">Faculty / Other</option>
                </select>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Your privacy is protected. QR codes contain opaque cryptographic tokens, never raw personal data.
              </span>
            </div>

            {/* Submit Action */}
            <div className="pt-4">
              {isFull ? (
                <button
                  type="button"
                  onClick={handleJoinWaitlist}
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.98]"
                >
                  <Clock className="w-4 h-4" />
                  <span>{submitting ? 'Submitting to Waitlist...' : 'Join Waitlist for This Event'}</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.98]"
                >
                  {submitting ? (
                    <span className="flex items-center space-x-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Generating Pass...</span>
                    </span>
                  ) : (
                    <>
                      <span>Complete Registration & Generate Pass</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
