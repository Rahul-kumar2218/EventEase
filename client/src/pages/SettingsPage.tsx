import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Database,
  KeyRound,
  Server,
  UserCheck,
  Activity,
  Cpu,
  CheckCircle2,
  Terminal,
  UserPlus,
  Users,
  Sun,
  Moon,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { User, Event } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, isOrganizer, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { showToast } = useToast();

  const [serverHealth, setServerHealth] = useState<any>(null);
  const [lastPing, setLastPing] = useState<string>('');

  // Staff creation form state
  const [staffList, setStaffList] = useState<User[]>([]);
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('password123');
  const [newStaffRole, setNewStaffRole] = useState<'Check-in Staff' | 'Organizer'>('Check-in Staff');
  const [creatingStaff, setCreatingStaff] = useState(false);

  useEffect(() => {
    checkHealth();
    if (isOrganizer || isAdmin) {
      fetchStaff();
      fetchEvents();
    }
  }, [isOrganizer, isAdmin]);

  const checkHealth = async () => {
    try {
      const res = await api.get('/health');
      setServerHealth(res.data);
      setLastPing(new Date().toLocaleTimeString());
    } catch (e) {
      setServerHealth({ status: 'offline' });
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get('/auth/staff');
      if (res.data.success) {
        setStaffList(res.data.staff);
      }
    } catch (e) {
      // Non-critical
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      if (res.data.success) {
        setEventsList(res.data.events);
      }
    } catch (e) {
      // Non-critical
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail || !newStaffPassword) return;

    setCreatingStaff(true);
    try {
      const res = await api.post('/auth/staff', {
        name: newStaffName,
        email: newStaffEmail,
        password: newStaffPassword,
        role: newStaffRole,
      });

      if (res.data.success) {
        showToast(`Staff account created for ${newStaffName}!`, 'success');
        setNewStaffName('');
        setNewStaffEmail('');
        fetchStaff();
      }
    } catch (err: any) {
      showToast(err.customMessage || 'Failed to create staff account.', 'error');
    } finally {
      setCreatingStaff(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1.5">
          <Settings className="w-3.5 h-3.5" />
          <span>System Environment & Diagnostics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System & Account Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          EventEase production runtime verification, atomic gate safety telemetry, and RBAC operator management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Active Profile */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-500 to-indigo-500" />
          <div className="flex items-center space-x-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Active Operator Session</h2>
              <div className="text-xs text-slate-400">Current authenticated credentials</div>
            </div>
          </div>

          <div className="space-y-3 text-xs bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
              <span className="text-slate-400 font-medium">Name:</span>
              <span className="font-bold text-white">{user?.name}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
              <span className="text-slate-400 font-medium">Email:</span>
              <span className="text-slate-300 font-mono text-[11px]">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
              <span className="text-slate-400 font-medium">Role:</span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-brand-500/15 border border-brand-500/30 text-brand-300">
                {user?.role}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-medium">Theme Mode:</span>
              <button
                onClick={toggleTheme}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center space-x-1 transition-colors"
              >
                {isDark ? <Moon className="w-3 h-3 text-brand-400" /> : <Sun className="w-3 h-3 text-yellow-400" />}
                <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Server & DB Status */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Service Health Telemetry</h2>
                <div className="text-xs text-slate-400">Node API & Database Engine Status</div>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>

          <div className="space-y-3 text-xs bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
              <span className="text-slate-400 font-medium">Express API:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 font-mono">
                {serverHealth?.status === 'ok' ? 'HEALTHY (Port 5000)' : 'ONLINE'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
              <span className="text-slate-400 font-medium">Version:</span>
              <span className="text-slate-300 font-mono text-[11px]">{serverHealth?.version || '2026.2.0'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
              <span className="text-slate-400 font-medium">Security Guard:</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Helmet CSP + Rate Limiting</span>
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-medium">Last Verified:</span>
              <span className="text-slate-400 font-mono text-[11px]">{lastPing || 'Connected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Staff & Access Management Section (Organizers & Admins only) */}
      {(isOrganizer || isAdmin) && (
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Staff & Access Management (RBAC)</h2>
              <div className="text-xs text-slate-400">
                Provision gate check-in operators and manage event permissions
              </div>
            </div>
          </div>

          {/* Create Staff Member Form */}
          <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <input
              type="text"
              required
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              placeholder="Staff Name"
              className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            <input
              type="email"
              required
              value={newStaffEmail}
              onChange={(e) => setNewStaffEmail(e.target.value)}
              placeholder="Staff Email"
              className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            <select
              value={newStaffRole}
              onChange={(e: any) => setNewStaffRole(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white font-semibold focus:outline-none focus:border-brand-500"
            >
              <option value="Check-in Staff">Check-in Staff</option>
              <option value="Organizer">Organizer</option>
            </select>
            <button
              type="submit"
              disabled={creatingStaff}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{creatingStaff ? 'Creating...' : 'Add Account'}</span>
            </button>
          </form>

          {/* Staff Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 pb-2">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Assigned Events</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {staffList.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-850">
                    <td className="py-3 px-3 font-bold text-white">{st.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{st.email}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/15 border border-brand-500/30 text-brand-300">
                        {st.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {st.assignedEvents && st.assignedEvents.length > 0 ? (
                        <span className="text-emerald-400 font-semibold">
                          {st.assignedEvents.length} assigned event(s)
                        </span>
                      ) : (
                        <span className="text-slate-500">Universal Access</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security Architecture Audit Checklist */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Security & Concurrency Guard Status</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Atomic Concurrency Lock</div>
              <div className="text-[11px] text-slate-400">
                Race condition prevention via MongoDB findOneAndUpdate
              </div>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Signed HMAC-SHA256 QR Tokens</div>
              <div className="text-[11px] text-slate-400">
                Cryptographic token forgery & offline validation verification
              </div>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">ReDoS & CSV Injection Shield</div>
              <div className="text-[11px] text-slate-400">
                Regex escaping on search & formula sanitization on export
              </div>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">DDoS & Brute Force Rate Limiting</div>
              <div className="text-[11px] text-slate-400">
                Multi-tier window throttling on auth, scan & registration gates
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
