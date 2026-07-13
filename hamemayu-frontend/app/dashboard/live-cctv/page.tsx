"use client";

import { useState, useEffect } from 'react';

export default function LiveCCTVPage() {
  const [isLoading, setIsLoading] = useState(true);
  // iframeKey dimulai dari 0 agar render pertama tetap pure/stabil
  const [iframeKey, setIframeKey] = useState(0); 
  
  const proxyUrl = process.env.NEXT_PUBLIC_API_URL + '/cctv-proxy';
  // Gunakan iframeKey sebagai parameter URL untuk memaksa reload tanpa melanggar aturan purity
  const fullUrl = `${proxyUrl}?t=${iframeKey}`;

  useEffect(() => {
    // setIsLoading(true) dihapus dari sini karena state awal sudah true
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    // Date.now() aman dipanggil di dalam fungsi event handler (bukan saat render)
    setIframeKey(Date.now()); 
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-brutal-dark overflow-hidden">
      {/* Header Aplikasi */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center z-50 shadow-sm shrink-0">
        <div>
          <h1 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
            LIVE CCTV YOGYAKARTA
          </h1>
          <p className="text-[10px] text-slate-500 font-mono">
            {isLoading ? 'Loading...' : 'Live View Active'}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-2"
        >
          <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          RELOAD
        </button>
      </div>

      {/* Iframe Container dengan CROP */}
      <div className="flex-1 relative overflow-hidden bg-slate-200 dark:bg-slate-800">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-mono text-sm text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest">
              Loading CCTV...
            </p>
          </div>
        )}

        <div className="absolute inset-0 overflow-hidden">
          <iframe
            key={iframeKey}
            src={fullUrl}
            className="w-full h-full border-0"
            title="CCTV Proxy"
            onLoad={() => setIsLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
            style={{
              transform: 'translateY(-70px) scale(1.05)',
              transformOrigin: 'top center',
              width: '100%',
              height: 'calc(100% + 70px)',
            }}
          />
        </div>
      </div>
    </div>
  );
}