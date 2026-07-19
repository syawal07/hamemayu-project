import { ButtonHTMLAttributes, ReactNode } from 'react';

interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export default function RetroButton({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}: RetroButtonProps) {
  const baseStyle = "font-mono text-xs font-bold uppercase transition-all rounded-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-slate-900 dark:bg-green-400 text-white dark:text-slate-900 hover:bg-green-600 dark:hover:bg-green-300 shadow-md",
    secondary: "bg-green-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-green-100 border border-green-200 dark:border-slate-700 hover:bg-green-100 dark:hover:bg-slate-700",
    danger: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50 hover:bg-green-100 dark:hover:bg-green-900/40",
    ghost: "bg-transparent text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
  };

  const widthStyle = fullWidth ? "w-full py-4" : "px-6 py-3";

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}