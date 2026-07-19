import { ReactNode } from 'react';

interface RetroBadgeProps {
  children: ReactNode;
  status?: 'success' | 'warning' | 'info' | 'neutral' | 'danger';
  className?: string;
}

export default function RetroBadge({ children, status = 'neutral', className = '' }: RetroBadgeProps) {
  const baseStyle = "px-3 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest inline-flex items-center justify-center";
  
  const statuses = {
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    danger: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
  };

  return (
    <span className={`${baseStyle} ${statuses[status]} ${className}`}>
      {children}
    </span>
  );
}