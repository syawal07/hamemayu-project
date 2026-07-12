"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { fetchAPI } from '../../lib/api';
import { EventItem, Category } from './types';
import CategoryTabs from './components/CategoryTabs';
import EventCard from './components/EventCard';

const EventCalendar = dynamic(() => import('./components/EventCalendar'), {
  ssr: false,
  loading: () => <LoadingState />
});

const LoadingState = () => (
  <div className="w-full h-64 flex flex-col items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-4xl border border-white/20 dark:border-white/10 animate-pulse">
    <div className="w-10 h-10 border-4 border-slate-800 dark:border-slate-200 border-t-transparent rounded-full animate-spin mb-4" />
    <span className="font-mono text-xs tracking-widest uppercase">Memuat Agenda...</span>
  </div>
);

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const [eventsRes, categoriesRes] = await Promise.all([
          fetchAPI<EventItem[]>('/events', { requireAuth: true }),
          fetchAPI<Category[]>('/categories', { requireAuth: true })
        ]);
        
        if (!isMounted) return;
        
        if (eventsRes && Array.isArray(eventsRes)) setEvents(eventsRes);
        if (categoriesRes && Array.isArray(categoriesRes)) setCategories(categoriesRes);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEvents = activeCategory === 'all' 
    ? events 
    : events.filter(e => e.category?.slug === activeCategory);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      
      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-2 drop-shadow-sm">
              Katalog Acara
            </h1>
            <p className="font-mono text-xs tracking-widest uppercase opacity-60">
              Eksplorasi Event & Festival Terkini
            </p>
          </div>
          
          <div className="flex gap-2 p-1.5 bg-black/5 dark:bg-white/5 backdrop-blur-2xl rounded-full border border-black/5 dark:border-white/5 w-fit shadow-inner">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-6 py-2.5 rounded-full font-mono text-xs font-bold uppercase transition-all duration-300 ${
                viewMode === 'list' 
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md scale-100' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 scale-95'
              }`}
            >
              Daftar
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`px-6 py-2.5 rounded-full font-mono text-xs font-bold uppercase transition-all duration-300 ${
                viewMode === 'calendar'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md scale-100' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 scale-95'
              }`}
            >
              Kalender
            </button>
          </div>
        </header>

        <main className="relative w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          {loading ? (
            <LoadingState />
          ) : (
            <>
              {viewMode === 'list' ? (
                <div className="space-y-8">
                  <CategoryTabs 
                    categories={categories} 
                    activeCategory={activeCategory} 
                    onSelect={setActiveCategory} 
                  />
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-24 bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-4xl border border-white/20">
                      <p className="font-serif text-2xl text-slate-400 mb-2">Tidak Ada Acara</p>
                      <p className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-6">Belum ada acara untuk kategori ini</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/60 dark:bg-[#111111]/60 backdrop-blur-2xl p-6 md:p-10 rounded-4xl border border-white/40 dark:border-white/10 shadow-xl">
                  <EventCalendar events={events} />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}