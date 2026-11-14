import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Determine if current route is an internal Organizer / Staff dashboard route
  const isDashboardRoute =
    location.pathname === '/dashboard' ||
    location.pathname === '/events/create' ||
    location.pathname === '/participants' ||
    location.pathname.includes('/manage') ||
    location.pathname.includes('/participants') ||
    location.pathname.includes('/analytics') ||
    location.pathname === '/waitlist' ||
    location.pathname === '/export' ||
    location.pathname === '/settings';

  const showSidebar = isAuthenticated && (user?.role === 'Organizer' || user?.role === 'Check-in Staff' || user?.role === 'Admin') && isDashboardRoute;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar />

      <div className="flex-1 flex w-full">
        {showSidebar && (
          <div className="hidden lg:block shrink-0">
            <Sidebar />
          </div>
        )}

        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-5rem)]">
          <Outlet />
        </main>
      </div>

      {/* Global Footer (shown on inner pages, hidden on landing page which has its own rich footer) */}
      {location.pathname !== '/' && (
        <footer className="bg-[#01040f] border-t border-white/[0.06] py-6 px-4 text-center text-xs text-slate-500 no-print">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-300">EventEase</span> — Enterprise Event Registration & Atomic Gate OS
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              MongoDB Atomic Concurrency • Sub-second QR Gate Scan
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
