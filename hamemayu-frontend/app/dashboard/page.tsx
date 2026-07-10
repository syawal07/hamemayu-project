"use client";

import { useEffect, useState } from 'react';
import { fetchAPI } from '../lib/api';
import { User } from '../types/api';
import Link from 'next/link';
import WeatherWidget from '../components/WeatherWidget'; // ✅ Import Widget

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
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-0">
      
      {/* HEADER DASHBOARD */}
      <div className="mb-8 bg-white/40 dark:bg-brutal-dark/40 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 p-6 md:p-8 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Bagian Kiri: Sapaan User (Font Diperkecil) */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2 leading-tight break-words">
              Selamat Datang, <br/>
              <span className="text-green-700 dark:text-yellow-400 drop-shadow-sm">
                {user?.name || 'Explorer'}
              </span>
            </h1>
            <div className="inline-flex items-center gap-2 bg-green-50/80 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 px-3 py-1.5 rounded-lg backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <p className="font-mono text-slate-700 dark:text-slate-300 text-[10px] font-bold tracking-widest uppercase">
                Portal Digital Siap Digunakan
              </p>
            </div>
          </div>

          {/* Bagian Kanan: Widget Cuaca */}
          <div className="shrink-0 w-full md:w-auto flex justify-start md:justify-end">
            <WeatherWidget />
          </div>

        </div>
      </div>

      {/* GRID MENU (Tetap Sama) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Card 1: Eksplorasi Destinasi */}
        <div className="bg-linear-to-br from-green-700 to-green-900 dark:from-brutal-dark dark:to-slate-900 border border-white/20 dark:border-slate-700/50 p-8 rounded-3xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
            <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h2 className="font-mono text-xl font-bold text-yellow-400 mb-3 relative z-10 tracking-wider">EKSPLORASI_DESTINASI</h2>
          <p className="text-slate-100 dark:text-slate-300 mb-8 relative z-10 text-sm leading-relaxed max-w-[85%]">
            Jelajahi seluruh basis data sejarah dan pariwisata berdasarkan kategori terstruktur.
          </p>
          <Link href="/dashboard/destinasi" className="inline-flex items-center justify-center gap-2 bg-white text-green-900 dark:bg-yellow-400 dark:text-slate-900 px-6 py-3 font-mono text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-all duration-300 relative z-10 uppercase shadow-sm">
            Mulai Jelajah
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        {/* Card 2: Peta Interaktif */}
        <div className="bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 p-8 rounded-3xl shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <svg className="w-32 h-32 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          </div>
          <h2 className="font-mono text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10 tracking-wider">PETA_INTERAKTIF</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10 text-sm leading-relaxed max-w-[85%]">
            Visualisasi lokasi dari seluruh titik koordinat destinasi dalam jangkauan radar.
          </p>
          <Link href="/dashboard/peta" className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-6 py-3 font-mono text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-all duration-300 relative z-10 uppercase shadow-sm">
            Buka Radar
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        {/* Card 3: Wishlist */}
        <div className="bg-white/40 dark:bg-slate-800/30 backdrop-blur-md border border-white/50 dark:border-slate-700/40 p-8 rounded-3xl shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:-translate-y-2 transition-all duration-500">
            <svg className="w-32 h-32 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
          <h2 className="font-mono text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10 tracking-wider">PANGKALAN_WISHLIST</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10 text-sm leading-relaxed max-w-[85%]">
            Koleksi destinasi impian yang telah Anda tandai untuk dieksplorasi di masa depan.
          </p>
          <Link href="/dashboard/wishlist" className="inline-flex items-center justify-center gap-2 bg-white/60 dark:bg-brutal-dark/60 text-slate-800 dark:text-slate-200 border border-white dark:border-slate-700/50 px-6 py-3 font-mono text-xs font-bold rounded-xl hover:bg-white dark:hover:bg-brutal-dark transition-all duration-300 relative z-10 uppercase shadow-sm">
            Lihat Wishlist
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        {/* Card 4: Itinerary */}
        <div className="bg-white/40 dark:bg-slate-800/30 backdrop-blur-md border border-white/50 dark:border-slate-700/40 p-8 rounded-3xl shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:-translate-y-2 transition-all duration-500">
            <svg className="w-32 h-32 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="font-mono text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10 tracking-wider">GENERATOR_ITINERARY</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10 text-sm leading-relaxed max-w-[85%]">
            Modul AI untuk menyusun rencana perjalanan harian yang optimal dan efisien.
          </p>
          <Link href="/dashboard/itinerary" className="inline-flex items-center justify-center gap-2 bg-white/60 dark:bg-brutal-dark/60 text-slate-800 dark:text-slate-200 border border-white dark:border-slate-700/50 px-6 py-3 font-mono text-xs font-bold rounded-xl hover:bg-white dark:hover:bg-brutal-dark transition-all duration-300 relative z-10 uppercase shadow-sm">
            Lihat Itinerary
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

      </div>
    </div>
  );
}