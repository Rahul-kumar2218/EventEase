import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glow' | 'accent' | 'interactive';
  className?: string;
  glowColor?: 'blue' | 'purple' | 'cyan' | 'magenta' | 'emerald';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  className = '',
  glowColor = 'purple',
  ...props
}) => {
  const glowClasses = {
    blue: 'hover:border-blue-500/40 hover:shadow-glow-blue',
    purple: 'hover:border-purple-500/40 hover:shadow-glow-purple',
    cyan: 'hover:border-cyan-500/40 hover:shadow-glow-cyan',
    magenta: 'hover:border-fuchsia-500/40 hover:shadow-glow-magenta',
    emerald: 'hover:border-emerald-500/40 hover:shadow-glow-emerald',
  };

  const variantClasses = {
    default: 'bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 shadow-xl',
    glow: `bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-glow-card transition-all duration-300 ${glowClasses[glowColor]}`,
    accent: 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-2xl border border-slate-700/60 shadow-2xl',
    interactive: `bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 transition-all duration-300 hover:-translate-y-1.5 hover:bg-slate-850/80 cursor-pointer ${glowClasses[glowColor]}`,
  };

  return (
    <div
      className={`rounded-3xl relative overflow-hidden ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
