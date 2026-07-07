"use client";

import { useState, useEffect, useRef } from 'react';

export default function LiveCCTVPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const proxyUrl = process.env.NEXT_PUBLIC_API_URL + '/cctv-proxy';
  const [iframeKey, setIframeKey] = useState(0);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setIsLoading(true);
    setIframeLoaded(false);
    
    // Reset key untuk force reload
    setIframeKey(prev => prev + 1);
    
    // Cleanup
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  const handleIframeLoad = () => {
    console.log("✅ Iframe loaded, waiting for auto-clicker...");
    
    // Tunggu 5 detik (waktu untuk auto-clicker selesai kerja)
    loadTimeoutRef.current = setTimeout(() => {
      console.log("✅ Auto-clicker should be done, showing map...");
      setIframeLoaded(true);
      
      // Tunggu sebentar lagi baru hide loading
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    }, 1000); // 1 detik = waktu yang cukup untuk auto-click
  };

  const handleManualRefresh = () => {
    setIsLoading(true);
    setIframeLoaded(false);
    setIframeKey(prev => prev + 1);
  };

  const cacheBuster = new Date().getTime();
  const fullUrl = `${proxyUrl}?t=${cacheBuster}`;

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-brutal-dark overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center z-50 shadow-sm shrink-0">
        <div>
          <h1 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
            LIVE CCTV YOGYAKARTA
          </h1>
          <p className="text-[10px] text-slate-500 font-mono">
            {isLoading ? 'Loading markers...' : 'All cameras active'}
          </p>
        </div>
        
        <button 
          onClick={handleManualRefresh}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-2"
        >
          <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          RELOAD
        </button>
      </div>

      {/* Container */}
      <div className="flex-1 relative bg-slate-200 dark:bg-slate-800 overflow-hidden">
        {/* Loading Overlay - FULL SCREEN sampai iframe ready */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-white dark:bg-slate-900">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="font-mono text-sm text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest animate-pulse">
              Initializing CCTV System...
            </p>
            <p className="font-mono text-xs text-slate-400 mt-2">
              Please wait
            </p>
          </div>
        )}

        {/* Iframe - Hidden sampai loaded sempurna */}
        <iframe
          key={iframeKey}
          src={fullUrl}
          className={`w-full h-full border-0 z-10 relative transition-opacity duration-500 ${
            iframeLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          title="CCTV Proxy"
          onLoad={handleIframeLoad}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}