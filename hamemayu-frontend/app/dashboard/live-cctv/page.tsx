"use client";

import { useState, useEffect } from 'react';

export default function LiveCCTVPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [timestamp, setTimestamp] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimestamp(Date.now());
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setTimestamp(Date.now());
      setIsLoading(false);
    }, 500);
  };

  const proxyUrl = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/cctv-proxy` : '';
  const fullUrl = timestamp ? `${proxyUrl}?t=${timestamp}` : '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      
      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-2 drop-shadow-sm">
              Pemantauan CCTV
            </h1>
            <p className="font-mono text-xs tracking-widest uppercase opacity-60">
              Lalu Lintas & Area Publik Real-Time
            </p>
          </div>
          
          <button 
            onClick={handleRefresh}
            className="px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-black rounded-full font-mono text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg w-fit"
          >
            Muat Ulang Sinyal
          </button>
        </header>

        <main className="relative w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          <div className="bg-white/60 dark:bg-[#111111]/60 backdrop-blur-2xl p-4 md:p-8 rounded-[2.5rem] border border-white/40 dark:border-white/10 shadow-xl">
            <div className="relative w-full aspect-video rounded-4xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-white/60 dark:border-white/10 shadow-inner">
              
              {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-md">
                  <div className="w-12 h-12 border-4 border-slate-900/30 dark:border-white/30 border-t-slate-900 dark:border-t-white rounded-full animate-spin mb-4" />
                  <p className="font-mono text-[10px] tracking-widest uppercase font-bold text-slate-800 dark:text-slate-200">
                    Menyambungkan Sinyal...
                  </p>
                </div>
              )}

              {fullUrl && (
                <iframe
                  key={timestamp}
                  src={fullUrl}
                  className={`w-full h-full border-0 transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                  allowFullScreen
                  onLoad={() => setIsLoading(false)}
                />
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}