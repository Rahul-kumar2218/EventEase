import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  QrCode,
  X,
  FileSpreadsheet,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import api from '../services/api';
import { Participant, Event } from '../types';
import { useToast } from '../context/ToastContext';

export const ParticipantsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { success, error } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(id || '');
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters and Pagination
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all'); // all | checkedIn | notArrived | cancelled
  const [sortBy, setSortBy] = useState('registeredAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [checkedInCount, setCheckedInCount] = useState(0);

  // Revocation modal state
  const [revokingParticipant, setRevokingParticipant] = useState<Participant | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchParticipants();
    }
  }, [selectedEventId, search, status, sortBy, order, page]);

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

  const fetchParticipants = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await api.get(`/events/${selectedEventId}/participants`, {
        params: {
          search,
          status,
          sortBy,
          order,
          page,
          limit: 15,
        },
      });

      if (res.data.success) {
        setParticipants(res.data.participants);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.total);
        setCheckedInCount(res.data.checkedInCount);
      }

      // Also get event details
      const evtRes = await api.get(`/events/${selectedEventId}`);
      if (evtRes.data.success) {
        setCurrentEvent(evtRes.data.event);
      }
    } catch (err) {
      console.error('Error fetching participants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
    setPage(1);
  };

  const handleExportCsv = async () => {
    if (!selectedEventId) return;
    setExporting(true);
    try {
      const response = await api.get(`/events/${selectedEventId}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `${currentEvent?.name || 'event'}_participants.csv`.replace(
        /[^a-zA-Z0-9_.-]/g,
        '_'
      );
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('Participant attendance roster exported to CSV!');
    } catch (err) {
      console.error('Export failed:', err);
      error('Failed to export CSV roster.');
    } finally {
      setExporting(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokingParticipant) return;
    setRevoking(true);
    try {
      const res = await api.post(`/participants/${revokingParticipant.participantId}/revoke`);
      if (res.data.success) {
        success(`Pass #${revokingParticipant.participantId} revoked.`);
        setRevokingParticipant(null);
        fetchParticipants();
      }
    } catch (err: any) {
      error(err.customMessage || 'Failed to revoke ticket.');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-brand-400 font-extrabold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Attendee Verification Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Participants Roster
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {currentEvent?.name} •{' '}
            <span className="text-emerald-400 font-bold">{checkedInCount}</span> of{' '}
            <span className="text-white font-bold">{totalCount}</span> Checked In (
            {totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0}% Turnout)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Select Event dropdown */}
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-brand-500 shadow-sm"
          >
            {events.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name}
              </option>
            ))}
          </select>

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-white/[0.08] rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 shadow-lg">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search attendee name, email, college, entry code, or PAR ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Registrations</option>
              <option value="checkedIn">Admitted (Checked In)</option>
              <option value="notArrived">Not Arrived</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-slate-900 border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-white/[0.06]">
              <tr>
                <th
                  onClick={() => handleSort('participantId')}
                  className="py-4 px-5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Participant ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-4 px-5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Name & Contact</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-4 px-5">Academic Department</th>
                <th className="py-4 px-5 text-center">Entry Code</th>
                <th
                  onClick={() => handleSort('checkedIn')}
                  className="py-4 px-5 cursor-pointer hover:text-white transition-colors text-center"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Gate Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <span>Loading attendee records...</span>
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    No participants found matching the selected filter.
                  </td>
                </tr>
              ) : (
                participants.map((p) => {
                  const isAttended = p.checkedIn;
                  const isCancelled = p.status === 'cancelled';
                  const isRevoked = p.status === 'revoked';

                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-850/50 transition-colors group"
                    >
                      <td className="py-3.5 px-5">
                        <span className="font-mono text-brand-300 font-bold bg-brand-500/10 px-2 py-0.5 rounded text-[11px] border border-brand-500/20">
                          {p.participantId}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {p.ticketTier || 'Standard'}
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="font-extrabold text-white text-xs">{p.name}</div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">{p.email}</div>
                        <div className="text-slate-500 text-[10px]">{p.phone}</div>
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="text-slate-300 font-medium">{p.department}</div>
                        <div className="text-slate-400 text-[11px]">{p.college} • {p.year}</div>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <span className="font-mono text-base font-extrabold text-brand-300 tracking-wider">
                          {p.entryCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isCancelled
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : isRevoked
                              ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                              : isAttended
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isCancelled
                            ? 'Cancelled'
                            : isRevoked
                            ? 'Revoked'
                            : isAttended
                            ? 'Checked In'
                            : 'Not Arrived'}
                        </span>
                        {isAttended && p.checkInTime && (
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {new Date(p.checkInTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right space-x-2">
                        <Link
                          to={`/ticket/${p.participantId}`}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors"
                          title="Open Boarding Pass"
                        >
                          <QrCode className="w-3 h-3 text-brand-400" />
                          <span>Pass</span>
                        </Link>

                        {!isCancelled && !isRevoked && (
                          <button
                            onClick={() => setRevokingParticipant(p)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-[11px] font-semibold transition-colors"
                            title="Revoke Ticket Pass"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Revoke</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-950/70 border-t border-white/[0.04] flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing Page <span className="text-white font-bold">{page}</span> of{' '}
            <span className="text-white font-bold">{totalPages}</span> ({totalCount} total attendees)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Revoke Pass Confirmation Modal */}
      {revokingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <Ban className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-extrabold text-white">Revoke Attendee Pass?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to revoke pass #{revokingParticipant.participantId} for{' '}
              <span className="font-bold text-white">{revokingParticipant.name}</span>? They will be permanently barred from gate admission.
            </p>

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => setRevokingParticipant(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={revoking}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center space-x-1"
              >
                {revoking ? <span>Revoking...</span> : <span>Confirm Revocation</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
