"use client";

import { useEffect, useState } from 'react';
import { fetchAPI } from '../../lib/api';
import Image from 'next/image';
import Link from 'next/link';

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
  };
}

export default function WishlistPage() {
  const [wishlists, setWishlists] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadWishlists = async () => {
      if (isMounted) setLoading(true);
      try {
        const res = await fetchAPI<WishlistItem[]>('/wishlist', { requireAuth: true });
        if (res && Array.isArray(res) && isMounted) {
          setWishlists(res);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadWishlists();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('HAPUS DATA INI DARI PANGKALAN WISHLIST?')) return;
    try {
      await fetchAPI(`/wishlist/${id}`, { method: 'DELETE', requireAuth: true });
      setWishlists(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const toggleVisited = async (item: WishlistItem) => {
    try {
      await fetchAPI(`/wishlist/${item.id}`, {
        method: 'PUT',
        requireAuth: true,
        body: JSON.stringify({ visited: !item.visited, priority: item.priority })
      });
      setWishlists(prev => prev.map(w => w.id === item.id ? { ...w, visited: !w.visited } : w));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
            PANGKALAN_WISHLIST
          </h1>
          <p className="font-mono text-slate-600 dark:text-slate-400 text-sm">
            MANAJEMEN TARGET DESTINASI PERSONAL
          </p>
        </div>
        <Link href="/dashboard/destinasi" className="bg-golden-heritage text-slate-900 px-6 py-3 font-mono text-sm font-bold border-2 border-slate-900 brutal-shadow-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-transform uppercase text-center">
          TAMBAH TARGET BARU
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 animate-pulse border-2 border-slate-900 dark:border-white/20 brutal-shadow-sm"></div>
          ))}
        </div>
      ) : wishlists.length > 0 ? (
        <div className="flex flex-col gap-4">
          {wishlists.map(item => (
            <div key={item.id} className={`flex flex-col sm:flex-row bg-white dark:bg-[#0F1C35] border-2 border-slate-900 dark:border-white/20 brutal-shadow-sm transition-all ${item.visited ? 'opacity-75 grayscale' : ''}`}>
              
              <div className="relative w-full sm:w-48 h-32 sm:h-auto border-b-2 sm:border-b-0 sm:border-r-2 border-slate-900 dark:border-white/20 bg-slate-100 dark:bg-slate-900 shrink-0">
                {item.content?.cover_image ? (
                  <Image 
                    src={item.content.cover_image.startsWith('http') ? item.content.cover_image : `http://127.0.0.1:8000/storage/${item.content.cover_image}`} 
                    alt={item.content.title} 
                    fill 
                    className="object-cover" 
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-mono text-[10px] text-slate-400 uppercase">
                    [ NO_IMAGE ]
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">
                      {item.content?.title}
                    </h3>
                    <span className="bg-slate-900 text-golden-heritage px-2 py-0.5 font-mono text-[10px] font-bold uppercase whitespace-nowrap">
                      {item.content?.category?.name || 'UMUM'}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-500 mb-4 line-clamp-1">
                    CATATAN: {item.notes || 'TIDAK ADA CATATAN'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-auto">
                  <button 
                    onClick={() => toggleVisited(item)}
                    className={`flex-1 sm:flex-none px-4 py-2 font-mono text-xs font-bold border-2 transition-colors uppercase ${
                      item.visited 
                        ? 'bg-green-600 text-white border-green-800' 
                        : 'bg-[#F4F0EA] dark:bg-slate-800 text-slate-900 dark:text-white border-slate-900 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {item.visited ? '[V] TERKUNJUNGI' : '[ ] BELUM DIKUNJUNGI'}
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="px-4 py-2 bg-red-600 text-white font-mono text-xs font-bold border-2 border-red-800 hover:bg-red-700 transition-colors uppercase"
                  >
                    HAPUS
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0F1C35] border-2 border-slate-900 dark:border-white/20 p-12 text-center brutal-shadow-sm flex flex-col items-center justify-center">
          <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          <p className="font-mono text-slate-500 font-bold uppercase mb-4">PANGKALAN WISHLIST KOSONG</p>
          <Link href="/dashboard/destinasi" className="text-golden-heritage hover:underline font-mono text-sm font-bold">
            MULAI EKSPLORASI SEKARANG &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}