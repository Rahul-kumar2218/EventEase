import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  ShieldCheck,
  Zap,
  Users,
  BarChart3,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Ticket,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  Check,
  XCircle,
  Activity,
  Layers,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import { Event } from '../types';
import { HeroDashboardPreview } from '../components/HeroDashboardPreview';

export const LandingPage: React.FC = () => {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [simState, setSimState] = useState<'idle' | 'success' | 'duplicate'>('idle');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events?limit=4');
        if (res.data.success && res.data.events.length > 0) {
          setFeaturedEvents(res.data.events);
        } else {
          setFeaturedEvents([
            {
              _id: 'evt-1',
              eventId: 'EVT-7701',
              name: 'TechFest 2026',
              description: 'Annual technology symposium featuring AI keynotes, engineering showcases, and hackathons.',
              date: '2026-10-18',
              startTime: '09:00 AM',
              endTime: '06:00 PM',
              venue: 'Ahmedabad Convention Center',
              capacity: 500,
              registrationCount: 320,
              attendanceCount: 218,
              status: 'upcoming',
              organizerId: 'org-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              _id: 'evt-2',
              eventId: 'EVT-7702',
              name: 'Cultural Night',
              description: 'Campus festival with live music, dramatic performances, and culinary experiences.',
              date: '2026-10-22',
              startTime: '06:00 PM',
              endTime: '11:00 PM',
              venue: 'Main Auditorium, North Campus',
              capacity: 300,
              registrationCount: 180,
              attendanceCount: 0,
              status: 'upcoming',
              organizerId: 'org-2',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              _id: 'evt-3',
              eventId: 'EVT-7703',
              name: 'Startup Summit',
              description: 'Investor matchmaking, founder keynotes, and early-stage startup pitch battles.',
              date: '2026-11-05',
              startTime: '10:00 AM',
              endTime: '05:00 PM',
              venue: 'Tech Innovation Hub, Block B',
              capacity: 500,
              registrationCount: 450,
              attendanceCount: 0,
              status: 'upcoming',
              organizerId: 'org-3',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              _id: 'evt-4',
              eventId: 'EVT-7704',
              name: 'Music Carnival',
              description: 'Open air riverside music evening with indie artists, DJ stages, and laser projection.',
              date: '2026-11-12',
              startTime: '05:00 PM',
              endTime: '10:30 PM',
              venue: 'Riverfront Promenade, West Gate',
              capacity: 400,
              registrationCount: 280,
              attendanceCount: 0,
              status: 'upcoming',
              organizerId: 'org-4',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load events for landing page', err);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="relative overflow-hidden bg-[#020617] text-slate-100 min-h-screen">
      {/* Subtle Ambient Glows and Minimal Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-32 right-1/4 w-[450px] h-[450px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Breathable, 56-72px Heading, Left/Right Split)           */}
      {/* ========================================================================= */}
      <section className="pt-16 sm:pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1320px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Marketing Narrative */}
          <div className="lg:col-span-6 text-left">
            <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-extrabold tracking-tight text-white leading-[1.08] mb-6">
              Plan smarter.<br />
              Run better events.<br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                Delight every attendee.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl mb-9">
              One powerful platform for event creation, registration, QR tickets, real-time analytics and instant check-ins.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to="/events/create"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm sm:text-base transition-colors shadow-lg shadow-blue-600/20 group"
              >
                <span>Create Your Event</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/events"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-sm sm:text-base border border-white/[0.08] transition-colors"
              >
                <span>Explore Events</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Clean Dashboard Preview (~600px, -1.5deg rotation, 3 floating cards + digital pass) */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <HeroDashboardPreview />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CLEAN STATISTICS STRIP (Thin Separators, Minimal Stripe/Linear style)  */}
      {/* ========================================================================= */}
      <section className="border-y border-white/[0.06] bg-slate-950/40 py-10">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/[0.06] text-center">
            <div className="pt-4 md:pt-0 md:px-6">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">10K+</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Events Hosted</div>
            </div>

            <div className="pt-4 md:pt-0 md:px-6">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">5M+</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Attendees</div>
            </div>

            <div className="pt-4 md:pt-0 md:px-6">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">500+</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Organizations</div>
            </div>

            <div className="pt-4 md:pt-0 md:px-6">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">99%</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. VISUAL STORYTELLING: "Everything your event needs."                      */}
      {/* ========================================================================= */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1320px] mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything your event needs.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
            From initial publishing to the final attendance audit, every step is automated and verified.
          </p>
        </div>

        {/* Feature 1 & 2: Event Management & Smart Registration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Event Management</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Create events in under two minutes. Define strict capacity thresholds, venue halls, multi-track schedules, and custom pricing rules.
            </p>

            {/* Visual Mockup */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.04] space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-300 pb-2 border-b border-white/[0.06]">
                <span className="text-white font-bold">TechFest 2026</span>
                <span className="text-emerald-400 text-[11px] font-bold">● PUBLISHED</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div>Venue: Main Auditorium</div>
                <div>Capacity: 500 Seats</div>
                <div>Status: Registration Open</div>
                <div>Waitlist Buffer: Enabled</div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6">
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Smart Registration & Capacity Lock</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Automatic backend capacity checks protect against overbooking. Once maximum capacity is reached, attendees seamlessly transition to the automated waitlist.
            </p>

            {/* Visual Mockup */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.04] space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Live Registration Counter</span>
                <span className="font-mono text-white font-bold">320 / 500 (64%)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 w-[64%]" />
              </div>
              <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-1.5 pt-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Backend concurrency atomic limit active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3 & 4: QR Ticketing & Instant Check-in */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Encrypted QR Passports</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Every participant receives an encrypted digital pass with a cryptographic QR token and a 6-character backup code for effortless manual entry.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.04] flex items-center space-x-4">
              <div className="w-14 h-14 bg-white rounded-xl p-1 shrink-0 flex items-center justify-center">
                <QRCodeSVG value="EVT-DEMO-SAMPLE" size={48} level="M" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Aditya Sen</div>
                <div className="text-[11px] font-mono text-cyan-300">CODE: AK4WU4</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Token: sha256 encrypted verification</div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">High-Speed Gate Scanning</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Camera-based optical scan takes under 300ms. Gate personnel receive instant acoustic chimes and visual prompts for smooth admissions.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.04] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>SCAN SPEED: 0.28s</span>
              </div>
              <span className="text-slate-400">Throughput: ~1,200/hr</span>
            </div>
          </div>
        </div>

        {/* Feature 5 & 6: Real-time Analytics & Attendee Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Real-Time Analytics</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Real-time attendance rates, hourly gate flow curves, no-show counts, and branch distributions backed directly by MongoDB.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.04] text-xs font-mono text-slate-300">
              <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                <span>Attendance Turnout</span>
                <span className="text-emerald-400 font-bold">68.1% (218 / 320)</span>
              </div>
              <div className="flex justify-between pt-2">
                <span>Peak Inflow</span>
                <span className="text-cyan-300">09:30 AM — 10:15 AM</span>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 mb-6">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Attendee Management & CSV Export</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Search attendees by name, department, or entry code. One click exports the entire verified attendance roster with check-in timestamps to CSV.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.04] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Attendance_Roster_2026.csv</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[11px]">Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DEDICATED QR CHECK-IN SHOWCASE ("One scan. Instant verification.")       */}
      {/* ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1320px] mx-auto border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>High-Speed Gate Terminal</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            One scan.<br />Instant verification.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-4 leading-relaxed">
            Watch how EventEase prevents duplicate pass-sharing and admits valid attendees in sub-second time.
          </p>
        </div>

        {/* Side-by-Side Visual Showcase of Scanner and Results */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Scanner Simulation Box */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] text-center relative overflow-hidden">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Live Gate Scanner Simulator
            </div>

            {/* Camera targeting viewport */}
            <div className="w-56 h-56 mx-auto rounded-2xl border-2 border-dashed border-blue-500/50 flex flex-col items-center justify-center relative bg-slate-950/80 mb-6">
              <div className="w-24 h-24 bg-white rounded-xl p-1.5 flex items-center justify-center">
                <QRCodeSVG value="EVT-SAMPLE-VERIFICATION" size={84} level="M" />
              </div>
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-blue-400" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-blue-400" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-blue-400" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-blue-400" />
            </div>

            {/* Simulator Controls */}
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setSimState('success')}
                className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all"
              >
                Simulate Valid QR
              </button>
              <button
                onClick={() => setSimState('duplicate')}
                className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all"
              >
                Simulate Duplicate Scan
              </button>
            </div>
          </div>

          {/* Outcome Visual Cards */}
          <div className="space-y-4">
            {/* Outcome 1: Check-in Successful */}
            <div
              className={`p-5 rounded-2xl border transition-all duration-300 ${
                simState === 'success'
                  ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                  : 'bg-slate-900/40 border-white/[0.06] opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-sm font-bold text-emerald-300">✓ Check-in Successful</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1 pl-8 font-mono">
                <div><span className="text-slate-500">Attendee:</span> Rahul Kumar</div>
                <div><span className="text-slate-500">Event:</span> TechFest 2026</div>
                <div><span className="text-slate-500">Time:</span> 10:42 AM • Gate 1</div>
              </div>
            </div>

            {/* Outcome 2: Already Checked In (Duplicate Rejection) */}
            <div
              className={`p-5 rounded-2xl border transition-all duration-300 ${
                simState === 'duplicate'
                  ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/30'
                  : 'bg-slate-900/40 border-white/[0.06] opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-sm font-bold text-rose-300">✕ Already Checked In</span>
              </div>
              <div className="text-xs text-rose-200/90 pl-8 leading-relaxed">
                This participant has already checked in at 10:42 AM. Duplicate check-in rejected by atomic database lock.
              </div>
            </div>

            <div className="pt-2 text-center md:text-left">
              <Link
                to="/check-in"
                className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                <span>Open Full Check-In Terminal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FEATURED EVENTS SECTION (Exact User Layout Specification)               */}
      {/* ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1320px] mx-auto border-t border-white/[0.06]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Featured Events
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Browse public conferences and workshops accepting digital registrations.
            </p>
          </div>

          <Link
            to="/events"
            className="mt-4 md:mt-0 text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <span>View all events</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Event Cards matching the requested wireframe structure */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredEvents.map((evt) => {
            const regCount = evt.registrationCount || 0;
            const cap = evt.capacity || 100;
            const pct = Math.min(Math.round((regCount / cap) * 100), 100);

            return (
              <div
                key={evt._id}
                className="rounded-3xl bg-slate-900/60 border border-white/[0.06] hover:border-white/[0.15] overflow-hidden flex flex-col justify-between transition-all duration-200 group"
              >
                <div>
                  {/* Event Background Image Simulation Container */}
                  <div className="h-44 bg-gradient-to-br from-blue-900/30 via-slate-900 to-slate-950 p-4 relative flex flex-col justify-between">
                    {/* Live indicator badge */}
                    <div className="flex items-center justify-between z-10">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>LIVE</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">{evt.eventId}</span>
                    </div>

                    {/* Gradient overlay fade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Information Panel */}
                  <div className="p-5">
                    <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                      {new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1 mb-2">
                      {evt.name}
                    </h3>

                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-4 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{evt.venue}</span>
                    </div>

                    {/* Registration Count progress */}
                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/[0.04] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center space-x-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>registered</span>
                        </span>
                        <span className="font-mono text-white font-bold">{regCount}/{cap}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    to={`/events/${evt._id}/register`}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <span>Register Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. HOW EVENTEASE WORKS (CREATE ↓ REGISTER ↓ PASS ↓ CHECK-IN ↓ ANALYZE)     */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1320px] mx-auto border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            The EventEase Flow
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Five automated steps from organizer setup to post-event reporting.
          </p>
        </div>

        {/* 5-Step Process Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {[
            {
              step: '01',
              title: 'CREATE',
              desc: 'Define title, schedule, hall, and attendee capacity.',
            },
            {
              step: '02',
              title: 'REGISTER',
              desc: 'Attendees sign up with automatic capacity protection.',
            },
            {
              step: '03',
              title: 'GET QR PASS',
              desc: 'Unique QR token and 6-char backup code generated.',
            },
            {
              step: '04',
              title: 'CHECK-IN',
              desc: 'Camera scan admits attendees and rejects duplicates.',
            },
            {
              step: '05',
              title: 'ANALYZE',
              desc: 'Live attendance stats and 1-click CSV roster download.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/40 border border-white/[0.06] flex flex-col justify-between"
            >
              <div>
                <div className="font-mono text-xs font-extrabold text-blue-400 mb-2">{item.step}</div>
                <div className="text-sm font-extrabold text-white tracking-wider mb-1.5">{item.title}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. BOTTOM CTA & CLEAN VERCEL-STYLE FOOTER                                 */}
      {/* ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1320px] mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Plan smarter events today.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-8">
            Join modern organizers replacing spreadsheets with digital tickets and instant gate check-ins.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/events/create"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-md shadow-blue-600/20"
            >
              Create Your Event →
            </Link>
            <Link
              to="/events"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-sm border border-white/[0.08] transition-colors"
            >
              Explore Events
            </Link>
          </div>
        </div>

        {/* Minimal Clean Footer */}
        <footer className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">EventEase</span>
            <span>• Enterprise Event Registration & Check-In Platform</span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>All Systems Operational</span>
            </div>
            <span>© 2026 EventEase Inc.</span>
          </div>
        </footer>
      </section>
    </div>
  );
};
