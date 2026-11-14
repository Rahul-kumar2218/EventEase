import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'glass' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  glow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  glow = true,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'relative inline-flex items-center justify-center font-bold tracking-tight rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden';

  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs space-x-1.5',
    md: 'px-5 py-2.5 text-xs sm:text-sm space-x-2',
    lg: 'px-7 py-3.5 text-sm sm:text-base space-x-2.5',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-glow-cta hover:scale-[1.02] active:scale-[0.98]',
    secondary:
      'bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 hover:border-brand-500/60 shadow-lg hover:scale-[1.01]',
    glass:
      'bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.12] hover:border-white/[0.25] backdrop-blur-xl shadow-lg hover:scale-[1.01]',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 shadow-sm',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {/* Animated subtle shine on primary */}
      {variant === 'primary' && (
        <span className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />
      )}

      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />}
        </>
      )}
    </button>
  );
};
