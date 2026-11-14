import React, { useState, useEffect } from 'react';
import { Clock, Users, Building, Mail, Phone, Calendar, Search, ArrowRight, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import api from '../services/api';
import { Event } from '../types';

export const WaitlistPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchWaitlist(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      if (res.data.success && res.data.events.length > 0) {
        setEvents(res.data.events);
        setSelectedEventId(res.data.events[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitlist = async (evtId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/events/${evtId}/waitlist`);
      if (res.data.success) {
        setWaitlist(res.data.waitlist);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedEvent = events.find((e) => e._id === selectedEventId);

  const filteredWaitlist = waitlist.filter((w) => {
    const q = searchTerm.toLowerCase();
    return (
      w.name?.toLowerCase().includes(q) ||
      w.email?.toLowerCase().includes(q) ||
      w.college?.toLowerCase().includes(q) ||
      w.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Capacity Overflow Queue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Event Waitlist</h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered students queued automatically when event capacity reaches 100% threshold
          </p>
        </div>

        {events.length > 0 && (
          <div className="flex items-center space-x-2 self-start md:self-auto">
            <span className="text-xs text-slate-400">Event:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-brand-500 shadow-sm transition-colors"
            >
              {events.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name} ({e.registrationCount}/{e.capacity})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Selected event summary pill card */}
      {selectedEvent && (
        <div className="mb-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">{selectedEvent.name}</div>
              <div className="text-slate-400 font-mono text-[11px]">
                Capacity: {selectedEvent.capacity} | Registered: {selectedEvent.registrationCount} | Waitlisted: {waitlist.length}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search waitlisted..."
                className="pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors w-48 sm:w-64"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table container */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span>Loading waitlist queue...</span>
          </div>
        ) : filteredWaitlist.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500 mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-300">Waitlist Queue Is Empty</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? 'No waitlisted participants match your search criteria.'
                : 'There are currently no participants on the overflow waitlist for this event.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-mono">Queue Position</th>
                  <th className="py-3.5 px-4">Participant Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">College & Dept</th>
                  <th className="py-3.5 px-4">Year</th>
                  <th className="py-3.5 px-4 font-mono">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredWaitlist.map((w, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white group-hover:text-brand-300 transition-colors">
                      {w.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{w.email}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">{w.phone}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="font-medium text-slate-200">{w.college}</span>
                      <span className="text-slate-500 ml-1">({w.department})</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold">
                        {w.year}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(w.addedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
