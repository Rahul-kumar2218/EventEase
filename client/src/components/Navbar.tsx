import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  Search,
  ArrowRight,
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  ShieldCheck,
  Ticket,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isOrganizer, isStaff, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    success('Logged out successfully');
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isCurrent = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <header className="sticky top-0 z-40 bg-[#020617]/90 dark:bg-[#020617]/90 backdrop-blur-xl border-b border-white/[0.08] transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-violet-500 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-[#020617] rounded-[10px] flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-br from-blue-400 to-violet-400" />
              </div>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-blue-200 transition-colors">
              EventEase
            </span>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Home
            </Link>

            <Link
              to="/events"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isCurrent('/events') ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Events
            </Link>

            <Link
              to="/check-in"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isCurrent('/check-in') ? 'text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Gate Check-in
            </Link>

            {isAuthenticated && (
              <Link
                to="/my-registrations"
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isCurrent('/my-registrations')
                    ? 'text-brand-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>My Passes</span>
              </Link>
            )}

            {isAuthenticated && (isOrganizer || isStaff) && (
              <Link
                to="/dashboard"
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent('/dashboard')
                    ? 'text-blue-400 font-bold'
                    : 'text-blue-400/80 hover:text-blue-300'
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Navigation & Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-brand-400" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3 pl-3 border-l border-white/[0.08]">
                <Link
                  to={isOrganizer ? '/dashboard' : '/my-registrations'}
                  className="flex items-center space-x-2 text-xs font-medium text-slate-300 hover:text-white"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white leading-tight">{user?.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono leading-tight">{user?.role}</div>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-900"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/my-ticket"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  Find Pass
                </Link>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-900 text-slate-300"
            >
              {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-brand-400" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#020617] border-b border-white/[0.08] px-4 py-6 space-y-3 animate-in fade-in">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-white hover:bg-slate-900"
          >
            Home
          </Link>
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-white hover:bg-slate-900"
          >
            Events Directory
          </Link>
          <Link
            to="/check-in"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-cyan-300 hover:bg-slate-900"
          >
            Gate Check-In
          </Link>

          {isAuthenticated && (
            <Link
              to="/my-registrations"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-brand-300 hover:bg-slate-900"
            >
              My Event Passes
            </Link>
          )}

          {isAuthenticated && (isOrganizer || isStaff) && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-blue-400 hover:bg-slate-900"
            >
              Dashboard
            </Link>
          )}

          <div className="pt-4 border-t border-white/[0.08]">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 px-3">
                  Signed in as <span className="text-white font-bold">{user?.name}</span> ({user?.role})
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-rose-400 font-bold text-xs hover:bg-slate-900 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-center rounded-xl bg-slate-900 text-slate-200 text-xs font-bold"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-center rounded-xl bg-brand-600 text-white text-xs font-bold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
