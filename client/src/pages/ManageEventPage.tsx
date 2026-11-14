import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Save,
  Trash2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  QrCode,
  BarChart3,
  Sparkles,
  UserCheck,
  ShieldAlert,
  Tag,
  Link as LinkIcon,
  Bot,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Event, User } from '../types';

export const ManageEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('upcoming');
  const [cancellationReason, setCancellationReason] = useState('');

  // Staff Assignment State
  const [availableStaff, setAvailableStaff] = useState<User[]>([]);
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>([]);
  const [savingStaff, setSavingStaff] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchEvent();
    fetchStaffList();
  }, [id]);

  const fetchEvent = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/events/${id}`);
      if (res.data.success) {
        const evt: Event = res.data.event;
        setEvent(evt);
        setName(evt.name);
        setDescription(evt.description);
        setCategory(evt.category || 'Technology & Engineering');
        setTagsInput(evt.tags?.join(', ') || '');
        setDate(evt.date);
        setStartTime(evt.startTime);
        setEndTime(evt.endTime);
        setVenue(evt.venue);
        setLocationUrl(evt.locationUrl || '');
        setCapacity(String(evt.capacity));
        setStatus(evt.status);
        setCancellationReason(evt.cancellationReason || '');
        setAssignedStaffIds(evt.assignedStaff?.map((s: any) => s._id || s) || []);
      }
    } catch (err: any) {
      const msg = err.customMessage || 'Failed to load event for editing.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await api.get('/auth/staff');
      if (res.data.success) {
        setAvailableStaff(res.data.staff);
      }
    } catch (e) {
      // Non-critical
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await api.put(`/events/${id}`, {
        name,
        description,
        category,
        tags,
        date,
        startTime,
        endTime,
        venue,
        locationUrl,
        capacity: parseInt(capacity, 10),
        status,
        cancellationReason: status === 'cancelled' ? cancellationReason : undefined,
      });

      if (res.data.success) {
        setSuccess('Event details updated successfully.');
        setEvent(res.data.event);
        showToast('Event settings saved successfully.', 'success');
      }
    } catch (err: any) {
      const msg = err.customMessage || 'Failed to update event.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStaffAssignments = async () => {
    if (!id) return;
    setSavingStaff(true);
    try {
      const res = await api.put(`/events/${id}/staff`, {
        staffIds: assignedStaffIds,
      });
      if (res.data.success) {
        showToast('Check-in staff permissions updated!', 'success');
      }
    } catch (err: any) {
      showToast(err.customMessage || 'Failed to update staff assignments.', 'error');
    } finally {
      setSavingStaff(false);
    }
  };

  const toggleStaffMember = (staffId: string) => {
    setAssignedStaffIds((prev) =>
      prev.includes(staffId) ? prev.filter((s) => s !== staffId) : [...prev, staffId]
    );
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.delete(`/events/${id}`);
      if (res.data.success) {
        showToast('Event and associated registrations deleted.', 'info');
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.customMessage || 'Failed to delete event.';
      showToast(msg, 'error');
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-xs font-semibold">Loading event management telemetry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to={`/events/${id}`}
        className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Event Page</span>
      </Link>

      <div className="space-y-8">
        {/* Main Event Edit Form */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-brand-400 uppercase tracking-wider mb-1">
                <span>Manage Event:</span>
                <span className="font-mono">{event?.eventId}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Event Settings & Operations
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                to={`/events/${id}/analytics`}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5 text-brand-400" />
                <span>Analytics</span>
              </Link>
              <Link
                to={`/events/${id}/participants`}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Attendees ({event?.registrationCount})</span>
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Event Title
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-brand-500 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Event Date
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
                  Start Time
                </label>
                <input
                  type="text"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  End Time
                </label>
                <input
                  type="text"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Campus Venue / Hall
                </label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Location URL (Google Maps)
                </label>
                <input
                  type="url"
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Total Capacity Limit
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Operational Status
                </label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing (Live Gate)</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {status === 'cancelled' && (
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-2">
                <label className="block text-xs font-bold text-rose-300 uppercase tracking-wider">
                  Cancellation Reason (displayed to participants):
                </label>
                <input
                  type="text"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Inclement weather, rescheduled to next semester"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-rose-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-rose-400"
                />
              </div>
            )}

            <div className="pt-4 flex items-center justify-between gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Changes...' : 'Save Event Settings'}</span>
              </button>

              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="px-4 py-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Event</span>
              </button>
            </div>
          </form>
        </div>

        {/* Staff Assignment Section (RBAC) */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-brand-400" />
                <span>Assign Check-in Staff to this Event</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Only assigned staff members will be authorized to scan and admit attendees at the gate for this event.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveStaffAssignments}
              disabled={savingStaff}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {savingStaff ? 'Saving...' : 'Save Staff Assignments'}
            </button>
          </div>

          {availableStaff.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">
              No staff member accounts registered yet. Create staff accounts in Settings.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {availableStaff.map((staff) => {
                const isSelected = assignedStaffIds.includes(staff.id);
                return (
                  <div
                    key={staff.id}
                    onClick={() => toggleStaffMember(staff.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${isSelected
                        ? 'bg-brand-500/15 border-brand-500/40 text-white shadow-sm'
                        : 'bg-slate-950/60 border-white/[0.06] text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{staff.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{staff.email}</div>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs ${isSelected
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : 'border-slate-700'
                        }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-left">
            <h3 className="text-xl font-extrabold text-white">Permanently Delete Event?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This will erase <span className="font-bold text-white">{event?.name}</span>, all {event?.registrationCount} registered participant records, and check-in audit history. This action cannot be undone.
            </p>
            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center space-x-1"
              >
                {deleting ? <span>Deleting...</span> : <span>Confirm Delete</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
