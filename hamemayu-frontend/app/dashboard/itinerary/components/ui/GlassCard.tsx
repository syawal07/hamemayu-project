import { HTMLAttributes, ReactNode } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = '', ...props }: GlassCardProps) {
  return (
    <div 
      className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-3xl shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}