import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Calendar,
  Plus,
  QrCode,
  Download,
  TrendingUp,
  Percent,
  Layers,
  ChevronRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import api from '../services/api';
import { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalCapacity: 0,
    totalRegistered: 0,
    totalCheckedIn: 0,
    totalNotArrived: 0,
    totalRemainingSeats: 0,
    overallAttendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events');
      if (res.data.success) {
        const evts: Event[] = res.data.events;
        setEvents(evts);
        calculateAggregateStats(evts);
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchDashboardData();
    success('Dashboard telemetry updated from MongoDB');
  };

  const calculateAggregateStats = (evts: Event[]) => {
    let capacity = 0;
    let registered = 0;
    let checkedIn = 0;

    evts.forEach((e) => {
      capacity += e.capacity || 0;
      registered += e.registrationCount || 0;
      checkedIn += e.attendanceCount || 0;
    });

    const notArrived = Math.max(0, registered - checkedIn);
    const remaining = Math.max(0, capacity - registered);
    const rate = registered > 0 ? Math.round((checkedIn / registered) * 100) : 0;

    setStats({
      totalCapacity: capacity,
      totalRegistered: registered,
      totalCheckedIn: checkedIn,
      totalNotArrived: notArrived,
      totalRemainingSeats: remaining,
      overallAttendanceRate: rate,
    });
  };

  const filteredEvents = events.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.eventId.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner with Welcome and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-xs text-brand-400 font-extrabold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Organizer Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Organizer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time event capacity, digital check-in metrics, and attendee tracking
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-sm"
            title="Refresh database counts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>

          <Link
            to="/events/create"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-600/25 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </Link>

          <Link
            to="/check-in"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 border border-purple-800/60 font-bold text-xs transition-colors shadow-sm"
          >
            <QrCode className="w-4 h-4 text-purple-400" />
            <span>Open Check-In</span>
          </Link>
        </div>
      </div>

      {/* CORE STATS GRID - EXACT VALUES FROM MONGODB */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-8">
        {/* Total Capacity */}
        <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">
            <span>Capacity</span>
            <Layers className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-white">
            {stats.totalCapacity}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Total seats allocated</div>
        </div>

        {/* Registered */}
        <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-[10px] text-brand-400 mb-1 font-bold uppercase tracking-wider">
            <span>Registered</span>
            <Users className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-brand-300">
            {stats.totalRegistered}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Issued passes</div>
        </div>

        {/* Checked In */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-lg bg-emerald-950/15">
          <div className="flex items-center justify-between text-[10px] text-emerald-400 mb-1 font-bold uppercase tracking-wider">
            <span>Checked In</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-emerald-300">
            {stats.totalCheckedIn}
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-1">Admitted at gate</div>
        </div>

        {/* Not Checked In */}
        <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-[10px] text-amber-400 mb-1 font-bold uppercase tracking-wider">
            <span>Not Arrived</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-slate-300">
            {stats.totalNotArrived}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Awaiting arrival</div>
        </div>

        {/* Remaining Seats */}
        <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">
            <span>Remaining</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-white">
            {stats.totalRemainingSeats}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Available seats</div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 shadow-lg bg-purple-950/15">
          <div className="flex items-center justify-between text-[10px] text-purple-400 mb-1 font-bold uppercase tracking-wider">
            <span>Turnout</span>
            <Percent className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-purple-300">
            {stats.overallAttendanceRate}%
          </div>
          <div className="text-[10px] text-purple-400/80 mt-1">Gate turnout rate</div>
        </div>
      </div>

      {/* EVENT MANAGEMENT TABLE */}
      <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-white">Managed Events</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live registration status and quick check-in management
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick table filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter events..."
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-44"
              />
            </div>

            <Link
              to="/events/create"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Event</span>
            </Link>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-slate-800/80">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Events Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'No events match your search query.'
                : 'Click "Create Event" above to launch your first event.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event Code & Name</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Capacity Meter</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredEvents.map((evt) => {
                  const isFull = evt.registrationCount >= evt.capacity;
                  const percentFilled = Math.min(
                    100,
                    Math.round((evt.registrationCount / evt.capacity) * 100)
                  );

                  return (
                    <tr key={evt._id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 px-4">
                        <div className="font-mono text-[11px] text-brand-400 font-bold">
                          {evt.eventId}
                        </div>
                        <div className="font-bold text-sm text-white line-clamp-1 group-hover:text-brand-300 transition-colors">
                          {evt.name}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{evt.venue}</div>
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        <div className="font-medium text-slate-200">{evt.date}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{evt.startTime}</div>
                      </td>

                      <td className="py-4 px-4 min-w-[140px]">
                        <div className="flex justify-between text-[11px] font-bold mb-1">
                          <span className="text-slate-300">
                            {evt.registrationCount} / {evt.capacity}
                          </span>
                          <span className={isFull ? 'text-rose-400' : 'text-slate-400'}>
                            {percentFilled}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFull ? 'bg-rose-500' : 'bg-gradient-to-r from-brand-500 to-indigo-500'
                            }`}
                            style={{ width: `${percentFilled}%` }}
                          ></div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-emerald-400">
                          {evt.attendanceCount} Checked In
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {Math.max(0, evt.registrationCount - evt.attendanceCount)} Pending Gate
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                          {isFull ? 'FULL' : 'ACTIVE'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right space-x-1.5">
                        <Link
                          to={`/check-in?eventId=${evt._id}`}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/30 text-xs font-bold transition-all shadow-sm"
                          title="Open Gate Scanner for this event"
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1" />
                          <span>Scan</span>
                        </Link>

                        <Link
                          to={`/events/${evt._id}/participants`}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 mr-1" />
                          <span>Roster</span>
                        </Link>

                        <Link
                          to={`/events/${evt._id}/analytics`}
                          className="inline-flex items-center px-2 py-1.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/40 transition-colors"
                          title="View Analytics"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
