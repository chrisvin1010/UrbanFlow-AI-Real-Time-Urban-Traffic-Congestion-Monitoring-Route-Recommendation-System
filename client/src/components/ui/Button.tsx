import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-navy-900 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-semibold shadow-glow-cyan focus:ring-cyan-400',
    secondary: 'bg-navy-750 hover:bg-navy-700 text-slate-100 border border-navy-700 hover:border-slate-600 focus:ring-slate-400',
    outline: 'border border-cyan-500/50 hover:border-cyan-400 text-cyan-400 hover:bg-cyan-950/30 focus:ring-cyan-400',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-glow-red focus:ring-rose-500',
    ghost: 'text-slate-400 hover:text-slate-100 hover:bg-navy-800 focus:ring-slate-500',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
