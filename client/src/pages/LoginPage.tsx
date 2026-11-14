import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogIn, Lock, Mail, Sparkles, AlertCircle, Eye, EyeOff, Shield, QrCode, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLoginAs } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      success(`Signed in as ${user.name}`);
      if (user.role === 'Check-in Staff') {
        navigate('/check-in');
      } else if (user.role === 'Organizer') {
        navigate('/dashboard');
      } else {
        navigate(from === '/dashboard' ? '/events' : from);
      }
    } catch (err: any) {
      setError(err.customMessage || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async (role: 'Organizer' | 'Check-in Staff' | 'Participant') => {
    setError(null);
    setLoading(true);
    try {
      await quickLoginAs(role);
      success(`Logged in as Demo ${role}`);
      if (role === 'Organizer') navigate('/dashboard');
      else if (role === 'Check-in Staff') navigate('/check-in');
      else navigate('/events');
    } catch (err: any) {
      setError(err.customMessage || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-grid-pattern">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle top gradient */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500"></div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-white">Sign In to EventEase</h2>
            <p className="text-xs text-slate-400 mt-2">
              Access the organizer dashboard or check-in verification terminal
            </p>
          </div>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mb-6 p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/40">
            <div className="flex items-center space-x-1.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>One-Click Evaluator Roles</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('Organizer')}
                className="py-2 px-2 text-xs font-bold rounded-xl bg-brand-600/30 hover:bg-brand-600/50 text-brand-200 border border-brand-500/30 transition-all text-center flex items-center justify-center space-x-1"
              >
                <Shield className="w-3 h-3 text-brand-400" />
                <span>Organizer</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('Check-in Staff')}
                className="py-2 px-2 text-xs font-bold rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 transition-all text-center flex items-center justify-center space-x-1"
              >
                <QrCode className="w-3 h-3 text-indigo-400" />
                <span>Staff</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('Participant')}
                className="py-2 px-2 text-xs font-bold rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 transition-all text-center flex items-center justify-center space-x-1"
              >
                <UserCheck className="w-3 h-3 text-purple-400" />
                <span>User</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="organizer@eventease.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-white absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Signing in...</span>
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-bold">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
