import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Calendar, CheckCircle2, Users, Sparkles, MapPin, Check } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Event } from '../types';

export const ExportPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      if (res.data.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (evt: Event) => {
    setExportingId(evt._id);
    showToast(`Generating attendance roster for "${evt.name}"...`, 'info');
    try {
      const response = await api.get(`/events/${evt._id}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${evt.name.replace(/[^a-zA-Z0-9]/g, '_')}_attendance.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`Exported CSV roster successfully!`, 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to export CSV. Please try again.', 'error');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1.5">
          <Download className="w-3.5 h-3.5" />
          <span>Audit & Compliance Reporting</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Export Attendance Rosters</h1>
        <p className="text-xs text-slate-400 mt-1">
          Download formatted CSV spreadsheets with verified entry gate timestamps, student details, and 6-char entry codes.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>Loading event rosters...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
          <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No Events Found</h3>
          <p className="text-xs text-slate-500 mt-1">Create an event to start generating attendance rosters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => {
            const pct = evt.registrationCount > 0 ? Math.round((evt.attendanceCount / evt.registrationCount) * 100) : 0;
            return (
              <div
                key={evt._id}
                className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 flex flex-col justify-between shadow-xl transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="font-mono text-brand-400 font-bold px-2 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/20 text-[11px]">
                      {evt.eventId}
                    </span>
                    <span className="flex items-center space-x-1 text-slate-400 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      <span>{evt.date}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-brand-300 transition-colors line-clamp-1">
                    {evt.name}
                  </h3>
                  <div className="flex items-center space-x-1 text-xs text-slate-400 mb-4 line-clamp-1">
                    <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                    <span>{evt.venue}</span>
                  </div>

                  {/* Attendance rate progress bar */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl mb-5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Turnout Progress</span>
                      <span className="font-bold text-emerald-400 font-mono">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-slate-500">Registered: </span>
                        <span className="font-bold text-white font-mono">{evt.registrationCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Checked In: </span>
                        <span className="font-bold text-emerald-400 font-mono">{evt.attendanceCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleExport(evt)}
                  disabled={exportingId === evt._id}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-brand-600 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-700/80 hover:border-brand-500 transition-all duration-200 shadow-sm disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:text-white transition-colors" />
                  <span>{exportingId === evt._id ? 'Generating CSV...' : 'Download CSV Roster'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
