import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  QrCode,
  BarChart3,
  Clock,
  Download,
  Settings,
  LogOut,
  PlusCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  selectedEventId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedEventId }) => {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
    {
      name: 'Events',
      icon: Calendar,
      path: '/events',
    },
    {
      name: 'Participants',
      icon: Users,
      path: selectedEventId ? `/events/${selectedEventId}/participants` : '/participants',
    },
    {
      name: 'Gate Check-In',
      icon: QrCode,
      path: '/check-in',
      badge: 'Fast',
    },
    {
      name: 'Analytics',
      icon: BarChart3,
      path: selectedEventId ? `/events/${selectedEventId}/analytics` : '/analytics',
    },
    {
      name: 'Waitlist',
      icon: Clock,
      path: '/waitlist',
    },
    {
      name: 'Export Data',
      icon: Download,
      path: '/export',
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/settings',
    },
  ];

  return (
    <aside className="w-64 bg-[#020617] border-r border-white/[0.08] flex flex-col h-[calc(100vh-4rem)] sticky top-16 sm:top-20 select-none z-20">
      {/* Role / Operator Badge Card */}
      <div className="p-3 mx-3 my-3 rounded-2xl bg-slate-900/90 border border-white/[0.08] shadow-lg shadow-black/20">
        <div className="flex items-center space-x-2 text-[10px] font-extrabold text-cyan-300 uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{user?.role || 'Operator'}</span>
        </div>
        <div className="text-xs font-bold text-white truncate">{user?.name}</div>
        <div className="text-[11px] text-slate-400 truncate font-mono">{user?.email}</div>
      </div>

      {/* Quick Action: New Event button */}
      {(user?.role === 'Organizer' || user?.role === 'Admin') && (
        <div className="px-3 mb-2">
          <NavLink
            to="/events/create"
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-blue-500/30 text-cyan-300 hover:text-white hover:bg-blue-600 hover:border-blue-500 text-xs font-bold transition-all group shadow-sm hover:shadow-glow-blue"
          >
            <span className="flex items-center space-x-2">
              <PlusCircle className="w-3.5 h-3.5 text-cyan-400 group-hover:text-white" />
              <span>Create Event</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </NavLink>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path + '/'));

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-glow-cta'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-300'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-white/[0.08]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
