"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LiveCCTVPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0); 
  const router = useRouter();

  const proxyUrl = process.env.NEXT_PUBLIC_API_URL + '/cctv-proxy';
  const fullUrl = `${proxyUrl}?t=${iframeKey}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey(Date.now()); 
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <div className="absolute inset-0 z-10 bg-slate-900 overflow-hidden group">
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 md:gap-4 bg-white/30 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-2 md:p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500 hover:bg-white/40 dark:hover:bg-black/50 max-w-[95vw] md:max-w-max">
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => router.push('/dashboard')} 
            className="p-2 bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 border border-white/60 dark:border-white/10 backdrop-blur-md rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
          >
            <svg className="w-4 h-4 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex flex-col min-w-0 pr-2 md:pr-4 border-r border-slate-900/10 dark:border-white/10">
            <h1 className="text-[10px] md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider truncate drop-shadow-sm">
              CCTV YOGYAKARTA
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]'}`}></span>
              <p className="text-[8px] md:text-[10px] text-slate-800 dark:text-slate-300 font-mono tracking-wider uppercase font-bold truncate">
                {isLoading ? 'CONNECTING...' : 'ONLINE'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-3 py-2 bg-white/50 hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md border border-white/60 dark:border-white/20 text-slate-900 dark:text-white text-[9px] md:text-xs font-mono font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:block">RELOAD</span>
        </button>
      </div>

      <div className={`absolute inset-0 flex flex-col items-center justify-center z-40 bg-slate-100/60 dark:bg-black/80 backdrop-blur-2xl transition-opacity duration-700 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mb-6">
          <div className="absolute inset-0 border-4 border-slate-400/30 dark:border-white/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-slate-900 dark:border-white rounded-full border-t-transparent animate-spin"></div>
          <div className="w-6 h-6 md:w-8 md:h-8 bg-slate-900 dark:bg-white rounded-full animate-ping opacity-20"></div>
        </div>
        <p className="font-mono text-[10px] md:text-xs text-slate-900 dark:text-white font-bold uppercase tracking-[0.3em] bg-white/40 dark:bg-black/40 px-5 md:px-6 py-2 md:py-2.5 rounded-full border border-white/50 dark:border-white/10 shadow-sm">
          Memuat Visual...
        </p>
      </div>

      <iframe
        key={iframeKey}
        src={fullUrl}
        className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        title="CCTV Proxy"
        onLoad={() => setIsLoading(false)}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
        style={{
          transform: 'translateY(-65px)',
          width: '100%',
          height: 'calc(100% + 65px)',
        }}
      />
    </div>
  );
}