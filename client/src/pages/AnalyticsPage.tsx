import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  RefreshCw,
  Printer,
  Calendar,
} from 'lucide-react';
import api from '../services/api';
import { Event } from '../types';
import { useToast } from '../context/ToastContext';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="text-[11px] font-bold text-slate-300 mb-1">{label}</div>
        <div className="text-xs font-mono font-extrabold text-brand-300">
          {payload[0].name}: {payload[0].value}
        </div>
      </div>
    );
  }
  return null;
};

export const AnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { success } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(id || '');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchAnalytics(selectedEventId);
    }
  }, [selectedEventId]);

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
      console.error(err);
    }
  };

  const fetchAnalytics = async (evtId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/events/${evtId}/analytics`);
      if (res.data.success) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (selectedEventId) {
      await fetchAnalytics(selectedEventId);
      success('Analytics refreshed from MongoDB');
    }
  };

  const summary = analyticsData?.summary;
  const charts = analyticsData?.charts;
  const event = analyticsData?.event;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header and Event Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-xs text-brand-400 font-extrabold uppercase tracking-wider mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>MongoDB Aggregation Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Event Intelligence & Attendance Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time capacity utilization, admission curves, and attendee demographic breakdown
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white transition-colors"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>

          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white transition-colors print:hidden"
            title="Print Analytics Report"
          >
            <Printer className="w-4 h-4" />
          </button>

          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-brand-500 shadow-sm"
          >
            {events.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading || !summary ? (
        <div className="py-24 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Aggregating MongoDB attendance telemetry...
        </div>
      ) : (
        <>
          {/* STATS METRIC TILES */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-8">
            <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-4 shadow-lg">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Total Capacity
              </div>
              <div className="text-2xl font-mono font-extrabold text-white mt-1">
                {summary.totalCapacity}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Max hall limit</div>
            </div>

            <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-4 shadow-lg">
              <div className="text-[10px] font-extrabold text-brand-400 uppercase tracking-wider">
                Registered
              </div>
              <div className="text-2xl font-mono font-extrabold text-brand-300 mt-1">
                {summary.totalRegistered}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Passes issued</div>
            </div>

            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-lg bg-emerald-950/20">
              <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                Checked In
              </div>
              <div className="text-2xl font-mono font-extrabold text-emerald-300 mt-1">
                {summary.totalCheckedIn}
              </div>
              <div className="text-[10px] text-emerald-500/80 mt-1">Admitted at gate</div>
            </div>

            <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-4 shadow-lg">
              <div className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                No-Show / Pending
              </div>
              <div className="text-2xl font-mono font-extrabold text-slate-300 mt-1">
                {summary.totalNotArrived}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Yet to arrive</div>
            </div>

            <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl p-4 shadow-lg">
              <div className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">
                Capacity Filled
              </div>
              <div className="text-2xl font-mono font-extrabold text-indigo-300 mt-1">
                {summary.capacityUtilization}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Utilization rate</div>
            </div>

            <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 shadow-lg bg-purple-950/20">
              <div className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">
                Turnout Rate
              </div>
              <div className="text-2xl font-mono font-extrabold text-purple-300 mt-1">
                {summary.attendanceRate}%
              </div>
              <div className="text-[10px] text-purple-400/80 mt-1">Gate conversion</div>
            </div>
          </div>

          {/* CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Department Distribution */}
            <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-6 shadow-xl">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                <span>Department Breakdown (Actual DB Aggregation)</span>
              </h3>

              {charts.departmentBreakdown.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                  No department telemetry recorded yet.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.departmentBreakdown}>
                      <XAxis dataKey="department" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Attendees" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Chart 2: College Distribution */}
            <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-6 shadow-xl">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span>Top Colleges Represented</span>
              </h3>

              {charts.collegeBreakdown.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                  No college data recorded.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.collegeBreakdown} layout="vertical">
                      <XAxis type="number" stroke="#64748b" fontSize={10} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="college"
                        stroke="#64748b"
                        fontSize={10}
                        width={130}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="Participants" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Chart 3: Year of Study Breakdown */}
            <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-6 shadow-xl">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-emerald-400" />
                <span>Attendee Academic Year Distribution</span>
              </h3>

              {charts.yearBreakdown.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                  No year data recorded.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.yearBreakdown}
                        dataKey="count"
                        nameKey="year"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry: any) => `${entry.year || ''}: ${entry.count || 0}`}
                      >
                        {charts.yearBreakdown.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Chart 4: Hourly Gate Check-In Velocity */}
            <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-6 shadow-xl">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Gate Check-In Hourly Velocity</span>
              </h3>

              {charts.checkInTimeline.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500 text-center px-4">
                  No gate admission timeline yet. Verify passes through the scanner to see real-time gate velocity.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.checkInTimeline}>
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Admissions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
