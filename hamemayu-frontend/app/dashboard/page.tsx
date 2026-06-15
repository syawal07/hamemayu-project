"use client";

import { useEffect, useState } from 'react';
import { fetchAPI } from '../lib/api';
import { User } from '../types/api';
import Link from 'next/link';

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
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="mb-12 border-b-4 border-slate-900 dark:border-white/10 pb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
          SELAMAT_DATANG, <br/>
          <span className="text-golden-heritage">{user?.name || 'EXPLORER'}</span>
        </h1>
        <p className="font-mono text-slate-600 dark:text-slate-400 text-sm md:text-base">
          STATUS_KONEKSI: <span className="text-green-600 dark:text-green-400 font-bold">AMAN</span> | PORTAL DIGITAL NUSANTARA SIAP DIGUNAKAN.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        <div className="bg-slate-900 dark:bg-white border-4 border-slate-900 dark:border-white p-8 brutal-shadow-light relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-24 h-24 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h2 className="font-mono text-xl font-bold text-golden-heritage mb-2 relative z-10">EKSPLORASI_DESTINASI</h2>
          <p className="text-slate-300 dark:text-slate-600 mb-8 relative z-10 font-mono text-sm">
            Jelajahi seluruh basis data sejarah dan pariwisata berdasarkan kategori terstruktur.
          </p>
          <Link href="/dashboard/destinasi" className="inline-flex items-center gap-2 bg-[#F4F0EA] dark:bg-slate-900 text-slate-900 dark:text-white px-6 py-3 font-mono text-sm font-bold border-2 border-slate-900 dark:border-white hover:translate-x-1 hover:-translate-y-1 transition-all relative z-10 uppercase shadow-[4px_4px_0px_#FFD662] dark:shadow-[4px_4px_0px_#FFD662]">
            Mulai Jelajah
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        <div className="bg-white dark:bg-[#0F1C35] border-4 border-slate-900 dark:border-white/10 p-8 brutal-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-24 h-24 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          </div>
          <h2 className="font-mono text-xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">PETA_INTERAKTIF</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10 font-mono text-sm">
            Visualisasi lokasi dari seluruh titik koordinat destinasi dalam jangkauan radar.
          </p>
          <Link href="/dashboard/peta" className="inline-flex items-center gap-2 bg-golden-heritage text-slate-900 px-6 py-3 font-mono text-sm font-bold border-2 border-slate-900 brutal-shadow-sm hover:translate-x-1 hover:-translate-y-1 transition-all relative z-10 uppercase">
            Buka Radar
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        <div className="bg-[#F4F0EA] dark:bg-[#0B1426] border-4 border-slate-900 dark:border-white/10 p-8 brutal-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-24 h-24 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
          <h2 className="font-mono text-xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">PANGKALAN_WISHLIST</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10 font-mono text-sm">
            Koleksi destinasi impian yang telah Anda tandai untuk dieksplorasi di masa depan.
          </p>
          <Link href="/dashboard/wishlist" className="inline-flex items-center gap-2 bg-white dark:bg-[#0F1C35] text-slate-900 dark:text-white px-6 py-3 font-mono text-sm font-bold border-2 border-slate-900 dark:border-white/20 brutal-shadow-sm hover:translate-x-1 hover:-translate-y-1 transition-all relative z-10 uppercase">
            Lihat Wishlist
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        <div className="bg-[#F4F0EA] dark:bg-[#0B1426] border-4 border-slate-900 dark:border-white/10 p-8 brutal-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-24 h-24 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="font-mono text-xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">GENERATOR_ITINERARY</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10 font-mono text-sm">
            Modul AI untuk menyusun rencana perjalanan harian yang optimal dan efisien.
          </p>
          <Link href="/dashboard/itinerary" className="inline-flex items-center gap-2 bg-white dark:bg-[#0F1C35] text-slate-900 dark:text-white px-6 py-3 font-mono text-sm font-bold border-2 border-slate-900 dark:border-white/20 brutal-shadow-sm hover:translate-x-1 hover:-translate-y-1 transition-all relative z-10 uppercase">
            Lihat Itinerary
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

      </div>

    </div>
  );
}