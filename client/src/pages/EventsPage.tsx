import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Plus,
  ChevronRight,
  Filter,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { Event } from '../types';
import { useAuth } from '../context/AuthContext';

export const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let url = '/events';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      const res = await api.get(url);
      if (res.data.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.name.toLowerCase().includes(term) ||
      e.venue.toLowerCase().includes(term) ||
      e.eventId.toLowerCase().includes(term) ||
      e.description.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header with Title and Create Event Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-xs text-brand-400 font-extrabold uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Campus Event Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Events Directory</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Discover upcoming college conferences, hackathons, symposiums, and cultural fests
          </p>
        </div>

        {user?.role === 'Organizer' && (
          <Link
            to="/events/create"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </Link>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by event title, campus venue, or EVT code..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/[0.08] rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-white/[0.08] rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-brand-500 shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-slate-900/60 border border-white/[0.06] rounded-3xl p-6 h-80 animate-pulse flex flex-col justify-between"
            >
              <div>
                <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-slate-800 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-800 rounded w-full mb-6"></div>
              </div>
              <div className="h-10 bg-slate-800 rounded-xl w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 border border-white/[0.08] rounded-3xl p-8">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Events Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No events match your search query. Try different terms or clear filters.'
              : 'There are currently no events registered in the system.'}
          </p>
          {user?.role === 'Organizer' && (
            <Link
              to="/events/create"
              className="mt-5 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Event</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const isFull = evt.registrationCount >= evt.capacity;
            const percentFilled = Math.min(
              100,
              Math.round((evt.registrationCount / evt.capacity) * 100)
            );

            return (
              <div
                key={evt._id}
                className="bg-slate-900/90 border border-white/[0.08] hover:border-brand-500/40 rounded-3xl p-6 flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-brand-600/10 group"
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-mono text-brand-400 font-bold bg-brand-500/10 px-2.5 py-0.5 rounded-lg border border-brand-500/20 text-[11px]">
                      {evt.eventId}
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
                      {isFull ? 'EVENT FULL' : 'SEATS OPEN'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                    {evt.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed font-normal">
                    {evt.description}
                  </p>

                  {/* Metadata */}
                  <div className="mt-4 pt-3.5 border-t border-white/[0.06] space-y-2 text-xs text-slate-300">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <span>{evt.date} • {evt.startTime} - {evt.endTime}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">{evt.venue}</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-4 pt-3.5 border-t border-white/[0.06]">
                    <div className="flex justify-between text-xs mb-1.5 font-bold">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Users className="w-3 h-3 text-indigo-400" />
                        <span>Capacity: {evt.registrationCount} / {evt.capacity}</span>
                      </span>
                      <span className={isFull ? 'text-rose-400' : 'text-slate-300'}>
                        {percentFilled}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isFull
                            ? 'bg-rose-500'
                            : percentFilled > 80
                            ? 'bg-amber-500'
                            : 'bg-gradient-to-r from-brand-500 to-indigo-500'
                        }`}
                        style={{ width: `${percentFilled}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2">
                  <Link
                    to={`/events/${evt._id}`}
                    className="text-xs font-bold text-slate-300 hover:text-white flex items-center space-x-1 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center space-x-2">
                    {user?.role === 'Organizer' && (
                      <Link
                        to={`/events/${evt._id}/manage`}
                        className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                      >
                        Manage
                      </Link>
                    )}

                    <Link
                      to={`/events/${evt._id}/register`}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 ${
                        isFull
                          ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
                          : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-brand-600/25'
                      }`}
                    >
                      {isFull ? 'Join Waitlist' : 'Register Now'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
