"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchAPI } from '../../lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Content {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string | null;
  category: Category;
}

interface PaginatedResponse {
  data: Content[];
  current_page: number;
  last_page: number;
}

const fixImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  
  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL;
    if (!storageUrl) {
    throw new Error('NEXT_PUBLIC_STORAGE_URL must be set in .env');
  }
  return `${storageUrl}/${url}`;
};

export default function DestinasiPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeQuery, setActiveQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    fetchAPI<Category[]>('/categories').then(res => {
      if (res && Array.isArray(res) && isMounted) setCategories(res);
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchInitialContents = async () => {
      setLoading(true);
      try {
        let url = `/contents?page=1&per_page=12`;
        if (activeCategory !== 'all') url += `&category=${activeCategory}`;
        if (activeQuery) url += `&search=${activeQuery}`;

        const res = await fetchAPI<PaginatedResponse | Content[]>(url);
        
        let newData: Content[] = [];
        let isLastPage = true;

        if (res && !Array.isArray(res) && 'data' in res) {
          newData = res.data;
          isLastPage = res.current_page >= res.last_page;
        } else if (Array.isArray(res)) {
          newData = res;
          isLastPage = res.length < 12;
        }

        if (isMounted) {
          setContents(newData);
          setHasMore(!isLastPage);
          setPage(1);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialContents();

    return () => {
      isMounted = false;
    };
  }, [activeCategory, activeQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchInput);
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      let url = `/contents?page=${nextPage}&per_page=12`;
      if (activeCategory !== 'all') url += `&category=${activeCategory}`;
      if (activeQuery) url += `&search=${activeQuery}`;

      const res = await fetchAPI<PaginatedResponse | Content[]>(url);
      
      let newData: Content[] = [];
      let isLastPage = true;

      if (res && !Array.isArray(res) && 'data' in res) {
        newData = res.data;
        isLastPage = res.current_page >= res.last_page;
      } else if (Array.isArray(res)) {
        newData = res;
        isLastPage = res.length < 12;
      }

      setContents(prev => [...prev, ...newData]);
      setHasMore(!isLastPage);
      setPage(nextPage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  const addToWishlist = async (contentId: number) => {
    try {
      await fetchAPI('/wishlist', {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify({ content_id: contentId, priority: 1, visited: false })
      });
      alert('DESTINASI DITAMBAHKAN KE WISHLIST!');
    } catch (error) {
      console.error(error);
      alert('GAGAL MENAMBAHKAN KE WISHLIST');
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Header Area */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-3 drop-shadow-sm">
          Eksplorasi Destinasi
        </h1>
        <p className="font-mono text-slate-600 dark:text-slate-400 text-xs md:text-sm tracking-widest uppercase">
          Database Lokasi Sejarah dan Pariwisata Nusantara
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 flex gap-3 relative group">
          <input 
            type="text" 
            placeholder="Ketik nama atau lokasi destinasi..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 p-4 pl-5 rounded-2xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-yellow-400/50 text-slate-900 dark:text-white shadow-sm transition-all duration-300"
          />
          <button type="submit" className="bg-green-700 text-white dark:bg-yellow-400 dark:text-slate-900 px-8 rounded-2xl font-mono text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <span className="hidden sm:inline">CARI</span>
          </button>
        </form>
      </div>

      {/* Category Pills */}
      <div className="flex overflow-x-auto pb-4 mb-8 gap-3 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        <button
          onClick={() => setActiveCategory('all')}
          className={`shrink-0 px-6 py-2.5 rounded-full font-mono text-xs font-bold transition-all duration-300 uppercase border shadow-sm ${
            activeCategory === 'all' 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-[0_4px_12px_rgba(15,28,53,0.15)] scale-105' 
              : 'bg-white/50 dark:bg-brutal-dark/50 backdrop-blur-md text-slate-600 dark:text-slate-400 border-white/60 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white hover:scale-105'
          }`}
        >
          SEMUA DATA
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.slug)}
            className={`shrink-0 px-6 py-2.5 rounded-full font-mono text-xs font-bold transition-all duration-300 uppercase border shadow-sm ${
              activeCategory === cat.slug 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-[0_4px_12px_rgba(15,28,53,0.15)] scale-105' 
                : 'bg-white/50 dark:bg-brutal-dark/50 backdrop-blur-md text-slate-600 dark:text-slate-400 border-white/60 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white hover:scale-105'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-105 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-3xl animate-pulse border border-white/50 dark:border-slate-700/50 shadow-sm"></div>
          ))}
        </div>
      ) : contents.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 mb-12">
            {contents.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-3xl flex flex-col shadow-[0_8px_32px_rgba(15,28,53,0.04)] group hover:shadow-[0_16px_48px_rgba(15,28,53,0.08)] hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                
                {/* Image Area */}
                <div className="relative h-56 md:h-64 overflow-hidden bg-slate-100 dark:bg-slate-900 m-2 rounded-2xl">
                {item.cover_image ? (
                  <Image 
                    src={fixImageUrl(item.cover_image) || ''} 
                    alt={item.title} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                    unoptimized
                  />
                ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono text-[10px] tracking-widest text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 uppercase backdrop-blur-sm">
                      [ VISUAL_DATA_MISSING ]
                    </div>
                  )}
                  {/* Category Badge Floating on Image */}
                  <div className="absolute top-4 left-4 bg-white/80 dark:bg-brutal-dark/80 backdrop-blur-md text-slate-900 dark:text-yellow-400 px-4 py-1.5 rounded-full font-mono text-[10px] font-bold border border-white/50 dark:border-slate-700/50 uppercase shadow-sm">
                    {item.category?.name || 'UMUM'}
                  </div>
                </div>

                {/* Text & Actions Area */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 leading-snug group-hover:text-green-800 dark:group-hover:text-yellow-400 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="font-mono text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3 mb-8 flex-1">
                    {item.excerpt}
                  </p>
                  
                  <div className="flex gap-3 mt-auto pt-4 border-t border-slate-200/60 dark:border-slate-700/50">
                    <Link href={`/dashboard/destinasi/${item.slug}`} className="flex-1 flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-mono text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      EKSPLORASI
                    </Link>
                    <button 
                      onClick={() => addToWishlist(item.id)} 
                      className="w-12 h-12 flex items-center justify-center bg-green-50 dark:bg-slate-800 text-green-700 dark:text-yellow-400 rounded-xl hover:bg-green-600 hover:text-white dark:hover:bg-yellow-400 dark:hover:text-slate-900 active:scale-95 transition-all shadow-sm border border-green-200 dark:border-slate-700"
                      title="Tambahkan ke Wishlist"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
          
          {/* Pagination/Load More */}
          {hasMore && (
            <div className="flex justify-center mt-4 pb-12">
              <button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-md text-slate-900 dark:text-white border border-white/60 dark:border-slate-700/50 px-8 py-3.5 rounded-full font-mono text-xs font-bold tracking-widest uppercase hover:-translate-y-1 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-3"
              >
                {loadingMore ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-green-700 dark:text-yellow-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    MENARIK DATA SATELIT...
                  </>
                ) : (
                  'MUAT LEBIH BANYAK ARSIP'
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="bg-white/40 dark:bg-brutal-dark/40 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 p-16 rounded-3xl text-center shadow-sm flex flex-col items-center mt-8">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-white dark:border-slate-700">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="font-mono text-slate-700 dark:text-slate-300 font-bold uppercase tracking-widest text-sm mb-3">Tidak Ada Data Ditemukan</p>
          <p className="font-mono text-slate-500 dark:text-slate-400 text-xs">Silakan sesuaikan kata kunci pencarian atau pilih kategori lain.</p>
        </div>
      )}
    </div>
  );
}
