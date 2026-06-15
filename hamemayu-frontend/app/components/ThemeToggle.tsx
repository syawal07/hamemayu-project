"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setMounted(true);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, []);

  if (!mounted) return <div className="w-10 h-10"></div>;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-2 border-slate-900 dark:border-yellow-400 text-slate-900 dark:text-yellow-400 shadow-[2px_2px_0_0_rgba(15,28,53,1)] dark:shadow-[2px_2px_0_0_rgba(250,204,21,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(15,28,53,1)] dark:hover:shadow-[3px_3px_0_0_rgba(250,204,21,1)] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}