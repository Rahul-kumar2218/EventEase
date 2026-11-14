import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Search, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import api from '../services/api';

export const MyTicketSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await api.get(`/participants/${encodeURIComponent(query.trim())}`);
      if (res.data.success && res.data.participant) {
        navigate(`/ticket/${res.data.participant.participantId}`);
      } else {
        setError('No pass found matching that code or ID.');
      }
    } catch (err: any) {
      setError(err.customMessage || 'Ticket not found. Please double-check your entry code or ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-4 animate-pulse">
          <Ticket className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center space-x-1.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-300 bg-purple-950/40 px-3 py-1 rounded-full border border-purple-800/40 mb-2">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>Pass Retrieval Terminal</span>
        </div>

        <h1 className="text-2xl font-extrabold text-white">Find Your Gate Pass</h1>
        <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
          Enter your 6-character Entry Code (e.g. <span className="font-mono text-brand-300 font-bold">A7K9P2</span>) or your Participant ID to retrieve your digital ticket.
        </p>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              placeholder="e.g. A7K9P2 or PAR-..."
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-center font-mono text-lg font-extrabold text-white uppercase tracking-widest placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Searching Ticket...</span>
              </span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Locate My Digital Pass</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
