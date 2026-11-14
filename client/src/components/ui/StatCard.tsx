import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  icon: LucideIcon;
  color?: 'blue' | 'purple' | 'cyan' | 'magenta' | 'emerald' | 'amber';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  trend,
  trendDirection = 'up',
  icon: Icon,
  color = 'purple',
  className = '',
}) => {
  const colorSchemes = {
    blue: {
      iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      glow: 'hover:border-blue-500/40 hover:shadow-glow-blue',
      badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    },
    purple: {
      iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      glow: 'hover:border-purple-500/40 hover:shadow-glow-purple',
      badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    },
    cyan: {
      iconBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      glow: 'hover:border-cyan-500/40 hover:shadow-glow-cyan',
      badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    },
    magenta: {
      iconBg: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400',
      glow: 'hover:border-fuchsia-500/40 hover:shadow-glow-magenta',
      badge: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      glow: 'hover:border-emerald-500/40 hover:shadow-glow-emerald',
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    },
    amber: {
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      glow: 'hover:border-amber-500/40 hover:shadow-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    },
  };

  const scheme = colorSchemes[color];

  return (
    <div
      className={`p-6 rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 shadow-xl transition-all duration-300 ${scheme.glow} ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              trendDirection === 'up'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
            }`}
          >
            {trendDirection === 'up' ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-rose-400" />
            )}
            <span>{trend}</span>
          </span>
        )}
      </div>

      <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono mb-1">
        {value}
      </div>

      <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
        <span>{label}</span>
        {subValue && <span className="text-[11px] text-slate-500">{subValue}</span>}
      </div>
    </div>
  );
};
