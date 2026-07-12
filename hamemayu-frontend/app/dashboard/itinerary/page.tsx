"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';

const ItineraryList = dynamic(() => import('./components/ItineraryList').catch(() => DummyComponent('ItineraryList')), {
  ssr: false,
  loading: () => <LoadingState />
});

const ItineraryCreate = dynamic(() => import('./components/ItineraryCreate').catch(() => DummyComponent('ItineraryCreate')), {
  ssr: false,
  loading: () => <LoadingState />
});

const ItineraryDetail = dynamic(() => import('./components/ItineraryDetail').catch(() => DummyComponent('ItineraryDetail')), {
  ssr: false,
  loading: () => <LoadingState />
});

const DummyComponent = (name: string) => {
  const Fallback = () => (
    <div className="flex flex-col items-center justify-center p-12 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/20 dark:border-white/10">
      <p className="font-mono text-sm tracking-widest uppercase text-slate-500">Menunggu Tahap Berikutnya</p>
      <p className="font-serif text-2xl font-bold mt-2 text-slate-800 dark:text-slate-200">Komponen {name} Belum Dibuat</p>
    </div>
  );
  Fallback.displayName = `Fallback${name}`;
  return Fallback;
};

const LoadingState = () => (
  <div className="w-full h-64 flex flex-col items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-[2rem] border border-white/20 dark:border-white/10 animate-pulse">
    <div className="w-10 h-10 border-4 border-slate-800 dark:border-slate-200 border-t-transparent rounded-full animate-spin mb-4" />
    <span className="font-mono text-xs tracking-widest uppercase">Memuat Modul...</span>
  </div>
);

export default function ItineraryPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const navigateToDetail = (id: number) => {
    setSelectedId(id);
    setActiveTab('detail');
  };

  const navigateToList = () => {
    setSelectedId(null);
    setActiveTab('list');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      
      <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-2 drop-shadow-sm">
              Modul Itinerary
            </h1>
            <p className="font-mono text-xs tracking-widest uppercase opacity-60">
              Sistem Perencanaan Perjalanan Otomatis
            </p>
          </div>
          
          <div className="flex gap-2 p-1.5 bg-black/5 dark:bg-white/5 backdrop-blur-2xl rounded-full border border-black/5 dark:border-white/5 w-fit shadow-inner">
            <button 
              onClick={() => setActiveTab('create')}
              className={`px-6 py-2.5 rounded-full font-mono text-xs font-bold uppercase transition-all duration-300 ${
                activeTab === 'create' 
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md scale-100' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 scale-95'
              }`}
            >
              Buat Baru
            </button>
            <button 
              onClick={navigateToList}
              className={`px-6 py-2.5 rounded-full font-mono text-xs font-bold uppercase transition-all duration-300 ${
                activeTab === 'list' || activeTab === 'detail'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md scale-100' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 scale-95'
              }`}
            >
              Riwayat
            </button>
          </div>
        </header>

        <main className="relative w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          {activeTab === 'list' && (
            <ItineraryList onNavigate={navigateToDetail} />
          )}
          
          {activeTab === 'create' && (
            <ItineraryCreate onComplete={navigateToList} />
          )}
          
          {activeTab === 'detail' && selectedId && (
            <ItineraryDetail id={selectedId} onBack={navigateToList} />
          )}
        </main>
      </div>
    </div>
  );
}