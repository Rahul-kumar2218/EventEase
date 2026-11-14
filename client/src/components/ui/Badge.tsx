import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'purple' | 'blue' | 'magenta' | 'emerald' | 'amber' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-300 shadow-sm shadow-cyan-950/30',
    purple: 'bg-purple-500/10 border-purple-500/25 text-purple-300 shadow-sm shadow-purple-950/30',
    blue: 'bg-blue-500/10 border-blue-500/25 text-blue-300 shadow-sm shadow-blue-950/30',
    magenta: 'bg-fuchsia-500/10 border-fuchsia-500/25 text-fuchsia-300 shadow-sm shadow-fuchsia-950/30',
    emerald: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 shadow-sm shadow-emerald-950/30',
    amber: 'bg-amber-500/10 border-amber-500/25 text-amber-300 shadow-sm shadow-amber-950/30',
    rose: 'bg-rose-500/10 border-rose-500/25 text-rose-300 shadow-sm shadow-rose-950/30',
    slate: 'bg-slate-800/60 border-slate-700/60 text-slate-300',
  };

  const dotColors = {
    cyan: 'bg-cyan-400',
    purple: 'bg-purple-400',
    blue: 'bg-blue-400',
    magenta: 'bg-fuchsia-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    slate: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold',
    md: 'px-3 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full border backdrop-blur-md transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`} />}
      <span>{children}</span>
    </span>
  );
};
