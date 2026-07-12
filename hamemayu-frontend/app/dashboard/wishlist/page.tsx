"use client";

import { useEffect, useState } from 'react';
import { fetchAPI } from '../../lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface WishlistItem {
  id: number;
  notes: string | null;
  visited: boolean;
  priority: number;
  content: {
    id: number;
    slug: string;
    title: string;
    category: { name: string };
    cover_image: string | null;
    location?: { lat: number; lng: number };
  };
}

export default function WishlistPage() {
  const [wishlists, setWishlists] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const loadWishlists = async () => {
      if (isMounted) setLoading(true);
      try {
        const res = await fetchAPI<WishlistItem[]>('/wishlist', { requireAuth: true });
        if (res && Array.isArray(res) && isMounted) setWishlists(res);
      } catch (error) { console.error(error); }
      finally { if (isMounted) setLoading(false); }
    };
    loadWishlists();
    return () => { isMounted = false; };
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('HAPUS DATA INI DARI PANGKALAN WISHLIST?')) return;
    try {
      await fetchAPI(`/wishlist/${id}`, { method: 'DELETE', requireAuth: true });
      setWishlists(prev => prev.filter(w => w.id !== id));
    } catch (error) { console.error(error); }
  };

  const toggleVisited = async (item: WishlistItem) => {
    try {
      await fetchAPI(`/wishlist/${item.id}`, {
        method: 'PUT', requireAuth: true,
        body: JSON.stringify({ visited: !item.visited, priority: item.priority })
      });
      setWishlists(prev => prev.map(w => w.id === item.id ? { ...w, visited: !w.visited } : w));
    } catch (error) { console.error(error); }
  };

  const navigateToItem = async (item: WishlistItem) => {
    try {
      const { extractWishlistCoords } = await import('../../lib/itinerary-utils');
      const destinations = await extractWishlistCoords([item]);
      if (destinations.length === 0) {
        alert(`Koordinat untuk "${item.content?.title}" belum tersedia.`);
        return;
      }
      router.push(`/dashboard/peta?route=${encodeURIComponent(JSON.stringify(destinations))}`);
    } catch (err) {
      console.error("Nav item failed:", err);
      alert("Gagal membuka peta.");
    }
  };

  const navigateAll = async () => {
    try {
      const { extractWishlistCoords } = await import('../../lib/itinerary-utils');
      const destinations = await extractWishlistCoords(wishlists);
      if (destinations.length === 0) {
        alert("Tidak ada destinasi dengan koordinat valid di wishlist.");
        return;
      }
      router.push(`/dashboard/peta?route=${encodeURIComponent(JSON.stringify(destinations))}`);
    } catch (err) {
      console.error("Nav all failed:", err);
      alert("Gagal memuat data peta.");
    }
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-5xl mx-auto pb-16 px-4 sm:px-6 lg:px-8">
      
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8">
        <div className="relative">
          <div className="absolute -inset-4 bg-green-500/20 dark:bg-yellow-400/10 blur-3xl rounded-full opacity-50 pointer-events-none"></div>
          <h1 className="relative text-4xl md:text-6xl font-serif font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-3 drop-shadow-lg">
            Pangkalan Wishlist
          </h1>
          <p className="relative font-mono text-slate-600 dark:text-slate-400 text-xs md:text-sm tracking-[0.2em] uppercase font-semibold">
            Manajemen Target Destinasi Personal
          </p>
        </div>
        <Link href="/dashboard/destinasi" className="group relative overflow-hidden bg-white/20 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-slate-700 text-slate-900 dark:text-white px-8 py-4 rounded-full font-mono text-xs font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 uppercase text-center flex items-center justify-center gap-3">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          <span className="relative z-10 tracking-widest">TAMBAH TARGET</span>
        </Link>
      </div>

      {wishlists.length > 0 && (
        <div className="mb-8 flex justify-end">
          <button
            onClick={navigateAll}
            className="group relative overflow-hidden bg-gradient-to-br from-green-600 to-green-800 dark:from-yellow-400 dark:to-yellow-600 text-white dark:text-slate-900 font-mono text-xs font-bold px-7 py-3.5 rounded-2xl transition-all shadow-[0_8px_20px_rgba(22,101,52,0.3)] dark:shadow-[0_8px_20px_rgba(250,204,21,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(22,101,52,0.4)] active:scale-95 uppercase tracking-widest flex items-center gap-3"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 3V4m0 0L9 7" />
            </svg>
            <span className="relative z-10">NAVIGASI SEMUA ({wishlists.length})</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white/30 dark:bg-slate-900/30 backdrop-blur-2xl rounded-[2rem] animate-pulse border border-white/50 dark:border-white/5 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
            </div>
          ))}
        </div>
      ) : wishlists.length > 0 ? (
        <div className="flex flex-col gap-8">
          {wishlists.map(item => (
            <div key={item.id} className={`flex flex-col sm:flex-row bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-[2rem] p-3 transition-all duration-500 group ${item.visited ? 'opacity-75' : 'hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 dark:hover:shadow-[0_20px_40px_rgb(0,0,0,0.4)]'}`}>
              
              <div className="relative w-full sm:w-64 h-56 sm:h-auto rounded-[1.5rem] overflow-hidden bg-slate-200/50 dark:bg-slate-800/50 shrink-0 shadow-inner">
                {item.content?.cover_image ? (
                  <div className={`absolute inset-0 w-full h-full transition-all duration-700 ease-out group-hover:scale-105 ${item.visited ? 'grayscale opacity-70' : ''}`}>
                    <Image src={item.content.cover_image.startsWith('http') ? item.content.cover_image : `http://127.0.0.1:8000/storage/${item.content.cover_image}`} alt={item.content.title} fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center font-mono text-[10px] text-slate-400 uppercase tracking-widest backdrop-blur-md">
                    <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    [ VISUAL_ASSET_MISSING ]
                  </div>
                )}
                {item.visited && (
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xl text-white px-4 py-2 rounded-full font-mono text-[10px] font-bold tracking-[0.2em] flex items-center gap-2 border border-white/20 shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                    TERKUNJUNGI
                  </div>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <h3 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight line-clamp-2 drop-shadow-sm">
                      {item.content?.title}
                    </h3>
                    <span className="bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/50 dark:border-white/10 text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest whitespace-nowrap shadow-sm w-fit">
                      {item.content?.category?.name || 'UMUM'}
                    </span>
                  </div>
                  <div className="bg-black/5 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/40 dark:border-white/5 mb-6 shadow-inner">
                    <p className="font-mono text-xs text-slate-700 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      <span className="font-bold text-slate-900 dark:text-slate-200 mr-2 tracking-widest uppercase text-[10px] bg-white/50 dark:bg-white/10 px-2 py-1 rounded-md border border-white/40 dark:border-white/5">CATATAN</span>
                      {item.notes || 'Tidak ada catatan tambahan untuk destinasi ini.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-auto">
                  <button 
                    onClick={() => navigateToItem(item)}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-mono text-xs font-bold transition-all duration-300 uppercase flex items-center justify-center gap-2 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-sm hover:shadow-md hover:bg-white/80 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 tracking-widest hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    NAVIGASI
                  </button>
                  <button onClick={() => toggleVisited(item)} className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-mono text-xs font-bold transition-all duration-300 uppercase flex items-center justify-center gap-2 backdrop-blur-md shadow-sm tracking-widest hover:-translate-y-0.5 ${item.visited ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/20' : 'bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 hover:shadow-md hover:bg-white/80 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.visited ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"} /></svg>
                    {item.visited ? 'TERKUNJUNGI' : 'TANDAI SELESAI'}
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="px-6 py-3 rounded-xl font-mono text-xs font-bold transition-all duration-300 uppercase flex items-center justify-center gap-2 backdrop-blur-md shadow-sm tracking-widest hover:-translate-y-0.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/20 hover:shadow-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    <span className="hidden sm:inline">HAPUS</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-3xl border border-white/50 dark:border-white/10 p-20 rounded-[3rem] text-center shadow-2xl flex flex-col items-center justify-center mt-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-yellow-500/5 pointer-events-none"></div>
          <div className="w-32 h-32 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center mb-8 border border-white/60 dark:border-white/10 shadow-inner relative z-10">
            <svg className="w-14 h-14 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
          <p className="relative z-10 font-mono text-slate-800 dark:text-slate-200 font-bold uppercase tracking-[0.2em] text-lg mb-6 drop-shadow-sm">Pangkalan Wishlist Kosong</p>
          <Link href="/dashboard/destinasi" className="relative z-10 text-green-700 dark:text-yellow-400 hover:text-green-800 dark:hover:text-yellow-300 font-mono text-xs font-bold tracking-[0.2em] flex items-center gap-2 transition-colors bg-white/50 dark:bg-white/5 px-6 py-3 rounded-full border border-white/60 dark:border-white/10 shadow-sm hover:shadow-md">
            MULAI EKSPLORASI SEKARANG <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      )}
    </div>
  );
}