import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  QrCode,
  BarChart3,
  Settings,
  TrendingUp,
  Ticket,
  CheckCircle2,
  DollarSign,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Search,
  Bell,
  Clock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const HeroDashboardPreview: React.FC = () => {
  return (
    <div className="relative w-full max-w-[620px] mx-auto select-none">
      {/* Ambient background soft glow */}
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-600/15 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-violet-600/15 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* 3 FLOATING CARDS (Restrained, subtle floating animation)                  */}
      {/* ========================================================================= */}

      {/* Floating Card 1: Tickets Sold */}
      <div className="hidden sm:flex absolute -top-5 -left-6 z-30 items-center space-x-3 px-4 py-3 rounded-2xl bg-[#080C19]/90 backdrop-blur-xl border border-white/[0.1] shadow-2xl animate-float-slow">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Ticket className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Tickets Sold</div>
          <div className="flex items-center space-x-2">
            <span className="text-base font-extrabold text-white font-mono">1,240</span>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-400">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +18%
            </span>
          </div>
        </div>
      </div>

      {/* Floating Card 2: Live Attendees */}
      <div className="hidden sm:flex absolute -top-6 -right-4 z-30 items-center space-x-3 px-4 py-3 rounded-2xl bg-[#080C19]/90 backdrop-blur-xl border border-white/[0.1] shadow-2xl animate-float-reverse">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Live Attendees</div>
          <div className="flex items-center space-x-2">
            <span className="text-base font-extrabold text-white font-mono">856</span>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-400">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +24%
            </span>
          </div>
        </div>
      </div>

      {/* Floating Card 3: Capacity */}
      <div className="hidden sm:flex absolute -bottom-5 -left-4 z-30 items-center space-x-3 px-4 py-3 rounded-2xl bg-[#080C19]/90 backdrop-blur-xl border border-white/[0.1] shadow-2xl animate-float-reverse">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Capacity</div>
          <div className="flex items-center space-x-2">
            <span className="text-base font-extrabold text-white font-mono">92%</span>
            <span className="inline-flex items-center text-[10px] font-bold text-cyan-400">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              +7%
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UNIQUE EVENTEASE VISUAL: Floating Digital Pass / Ticket                   */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-col absolute -bottom-8 -right-6 z-30 w-52 p-4 rounded-2xl bg-[#070b16]/95 backdrop-blur-2xl border border-blue-500/30 shadow-glow-blue animate-float-slow">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-2.5">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">EVENTEASE</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 font-bold">
            PASS
          </span>
        </div>

        <div className="text-xs font-bold text-white mb-0.5">TECHFEST 2026</div>
        <div className="text-[11px] text-slate-300 font-medium">Rahul Kumar</div>
        <div className="text-[9px] font-mono text-slate-400 mb-2.5">PASS #EVT-48291</div>

        <div className="w-full p-2 rounded-xl bg-white flex items-center justify-center mb-2.5 shadow-inner">
          <QRCodeSVG
            value="EVT-48291-RAHUL-KUMAR-VERIFIED"
            size={76}
            level="M"
            bgColor="#ffffff"
            fgColor="#020617"
          />
        </div>

        <div className="inline-flex items-center justify-center space-x-1.5 py-1 px-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>✓ VERIFIED</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN DASHBOARD CARD (550-650px wide, rotated -1.5deg)                      */}
      {/* ========================================================================= */}
      <div className="transform -rotate-1 lg:-rotate-[1.5deg] hover:rotate-0 transition-transform duration-500 rounded-[24px] bg-[#050816]/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl overflow-hidden relative">
        {/* Subtle top gradient accent */}
        <div className="h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        {/* Dashboard Topbar */}
        <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-500/70" />
              <span className="w-2 h-2 rounded-full bg-amber-500/70" />
              <span className="w-2 h-2 rounded-full bg-emerald-500/70" />
            </div>
            <span className="text-slate-600 text-xs font-mono">/</span>
            <span className="text-xs font-semibold text-white">Good evening, Rahul 👋</span>
          </div>

          <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-cyan-300 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Organizer</span>
          </div>
        </div>

        {/* Dashboard Inner Body */}
        <div className="flex">
          {/* Dashboard Mini Sidebar */}
          <div className="w-12 sm:w-36 border-r border-white/[0.06] p-2 bg-slate-950/40 shrink-0 flex flex-col justify-between">
            <div className="space-y-0.5">
              {[
                { label: 'Dashboard', icon: LayoutDashboard, active: true },
                { label: 'Events', icon: Calendar },
                { label: 'Attendees', icon: Users },
                { label: 'QR Gate', icon: QrCode },
                { label: 'Analytics', icon: BarChart3 },
                { label: 'Settings', icon: Settings },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      item.active
                        ? 'bg-blue-600/20 text-cyan-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline text-[11px] truncate">{item.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="hidden sm:block p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[9px] text-slate-500 font-mono">
              v2.4 Live
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="flex-1 p-3.5 sm:p-4 space-y-3 min-w-0 bg-[#030712]/50">
            {/* 4 Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-white/[0.04]">
                <div className="text-[9px] text-slate-400 uppercase font-semibold">Total Events</div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">12</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-white/[0.04]">
                <div className="text-[9px] text-slate-400 uppercase font-semibold">Total Attendees</div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">3,842</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-white/[0.04]">
                <div className="text-[9px] text-slate-400 uppercase font-semibold">Revenue</div>
                <div className="text-lg font-bold text-violet-300 font-mono mt-0.5">₹4.8L</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-white/[0.04]">
                <div className="text-[9px] text-slate-400 uppercase font-semibold">Occupancy</div>
                <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">87%</div>
              </div>
            </div>

            {/* Registration Chart Area */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-white/[0.04]">
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="font-semibold text-slate-300">Registration Trend</span>
                <span className="text-[10px] text-slate-500 font-mono">Past 7 Days</span>
              </div>

              <div className="h-20 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 350 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="dashboardAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,65 Q 40,55 90,45 T 180,30 T 270,18 T 350,10 L 350,80 L 0,80 Z"
                    fill="url(#dashboardAreaGrad)"
                  />
                  <path
                    d="M 0,65 Q 40,55 90,45 T 180,30 T 270,18 T 350,10"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="180" cy="30" r="3" fill="#60a5fa" />
                  <circle cx="350" cy="10" r="3.5" fill="#a78bfa" />
                </svg>
              </div>
            </div>

            {/* Upcoming Events Mini Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                <span>Upcoming Events</span>
                <span className="text-slate-500">Capacity</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/50 border border-white/[0.04] flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-semibold text-white">TechFest 2026</span>
                  <span className="text-[10px] text-slate-500 ml-1.5">• Oct 18</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[64%]" />
                  </div>
                  <span className="font-mono text-[10px] text-slate-300 font-bold">320/500</span>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/50 border border-white/[0.04] flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-semibold text-white">Cultural Night</span>
                  <span className="text-[10px] text-slate-500 ml-1.5">• Oct 22</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 w-[60%]" />
                  </div>
                  <span className="font-mono text-[10px] text-slate-300 font-bold">180/300</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
