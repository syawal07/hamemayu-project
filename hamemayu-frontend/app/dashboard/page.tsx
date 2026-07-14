"use client";

import { useEffect, useState } from 'react';
import { fetchAPI } from '../lib/api';
import { User } from '../types/api';
import Link from 'next/link';
import WeatherWidget from '../components/WeatherWidget';

export default function DashboardOverview() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await fetchAPI<User>('/user/profile', { requireAuth: true });
      if (userData) setUser(userData);
    };
    loadUser();
  }, []);

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-0">
      
      <div className="mb-8 bg-white/50 dark:bg-brutal-dark/40 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 p-6 md:p-8 rounded-4xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2.5 leading-tight break-words">
              Selamat Datang, <br/>
              <span className="text-green-700 dark:text-yellow-400 drop-shadow-sm">
                {user?.name || 'Explorer'}
              </span>
            </h1>
            <div className="inline-flex items-center gap-2.5 bg-white/60 dark:bg-slate-800/40 border border-white/80 dark:border-slate-700/50 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <p className="font-mono text-slate-700 dark:text-slate-300 text-[10px] font-bold tracking-widest uppercase">
                Portal Digital Siap Digunakan
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto flex justify-start md:justify-end">
            <WeatherWidget />
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-8">
        
        <div className="bg-linear-to-br from-green-700 to-green-900 dark:from-brutal-dark dark:to-slate-900 border border-green-600/30 dark:border-slate-700/50 p-7 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
            <svg className="w-28 h-28 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h2 className="font-mono text-lg md:text-xl font-bold text-yellow-400 mb-3 relative z-10 tracking-wider">EKSPLORASI DESTINASI</h2>
          <p className="text-slate-100 dark:text-slate-300 mb-8 relative z-10 text-xs md:text-sm leading-relaxed max-w-[90%]">
            Jelajahi seluruh basis data sejarah dan pariwisata berdasarkan kategori terstruktur.
          </p>
          <Link href="/dashboard/destinasi" className="inline-flex items-center justify-center gap-2 bg-white text-green-900 dark:bg-yellow-400 dark:text-slate-900 px-5 py-3 font-mono text-[10px] md:text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-all duration-300 relative z-10 uppercase shadow-sm">
            Mulai Jelajah
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        <div className="bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 p-7 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-lg transition-all duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <svg className="w-28 h-28 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          </div>
          <h2 className="font-mono text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10 tracking-wider">PETA INTERAKTIF</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10 text-xs md:text-sm leading-relaxed max-w-[90%]">
            Visualisasi lokasi dari seluruh titik koordinat destinasi dalam jangkauan radar.
          </p>
          <Link href="/dashboard/peta" className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3 font-mono text-[10px] md:text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-all duration-300 relative z-10 uppercase shadow-sm">
            Buka Radar
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        <div className="bg-white/40 dark:bg-slate-800/30 backdrop-blur-md border border-white/50 dark:border-slate-700/40 p-7 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-lg transition-all duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:-translate-y-2 group-hover:scale-110 transition-all duration-500">
            <svg className="w-28 h-28 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="font-mono text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10 tracking-wider">AGENDA EVENT</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10 text-xs md:text-sm leading-relaxed max-w-[90%]">
            Pantau jadwal kegiatan kebudayaan, festival, dan acara lokal secara komprehensif.
          </p>
          <Link href="/dashboard/events" className="inline-flex items-center justify-center gap-2 bg-white/60 dark:bg-brutal-dark/60 text-slate-800 dark:text-slate-200 border border-white dark:border-slate-700/50 px-5 py-3 font-mono text-[10px] md:text-xs font-bold rounded-xl hover:bg-white dark:hover:bg-brutal-dark hover:scale-105 active:scale-95 transition-all duration-300 relative z-10 uppercase shadow-sm">
            Lihat Event
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        <div className="bg-white/40 dark:bg-slate-800/30 backdrop-blur-md border border-white/50 dark:border-slate-700/40 p-7 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-lg transition-all duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <svg className="w-28 h-28 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="font-mono text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10 tracking-wider">LIVE CCTV</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10 text-xs md:text-sm leading-relaxed max-w-[90%]">
            Akses pemantauan visual real-time di berbagai titik strategis pariwisata.
          </p>
          <Link href="/dashboard/live-cctv" className="inline-flex items-center justify-center gap-2 bg-white/60 dark:bg-brutal-dark/60 text-slate-800 dark:text-slate-200 border border-white dark:border-slate-700/50 px-5 py-3 font-mono text-[10px] md:text-xs font-bold rounded-xl hover:bg-white dark:hover:bg-brutal-dark hover:scale-105 active:scale-95 transition-all duration-300 relative z-10 uppercase shadow-sm">
            Buka Siaran
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        <div className="bg-white/40 dark:bg-slate-800/30 backdrop-blur-md border border-white/50 dark:border-slate-700/40 p-7 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-lg transition-all duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:-translate-y-2 transition-all duration-500">
            <svg className="w-28 h-28 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
          <h2 className="font-mono text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10 tracking-wider">PANGKALAN WISHLIST</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10 text-xs md:text-sm leading-relaxed max-w-[90%]">
            Koleksi destinasi impian yang telah Anda tandai untuk dieksplorasi di masa depan.
          </p>
          <Link href="/dashboard/wishlist" className="inline-flex items-center justify-center gap-2 bg-white/60 dark:bg-brutal-dark/60 text-slate-800 dark:text-slate-200 border border-white dark:border-slate-700/50 px-5 py-3 font-mono text-[10px] md:text-xs font-bold rounded-xl hover:bg-white dark:hover:bg-brutal-dark hover:scale-105 active:scale-95 transition-all duration-300 relative z-10 uppercase shadow-sm">
            Lihat Wishlist
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        <div className="bg-white/40 dark:bg-slate-800/30 backdrop-blur-md border border-white/50 dark:border-slate-700/40 p-7 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-lg transition-all duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:-translate-y-2 group-hover:scale-110 transition-all duration-500">
            <svg className="w-28 h-28 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14" /></svg>
          </div>
          <h2 className="font-mono text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10 tracking-wider">GENERATOR ITINERARY</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10 text-xs md:text-sm leading-relaxed max-w-[90%]">
            Modul AI untuk menyusun rencana perjalanan harian yang optimal dan efisien.
          </p>
          <Link href="/dashboard/itinerary" className="inline-flex items-center justify-center gap-2 bg-white/60 dark:bg-brutal-dark/60 text-slate-800 dark:text-slate-200 border border-white dark:border-slate-700/50 px-5 py-3 font-mono text-[10px] md:text-xs font-bold rounded-xl hover:bg-white dark:hover:bg-brutal-dark hover:scale-105 active:scale-95 transition-all duration-300 relative z-10 uppercase shadow-sm">
            Lihat Itinerary
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

      </div>
    </div>
  );
}