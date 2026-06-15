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
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
          EKSPLORASI_DESTINASI
        </h1>
        <p className="font-mono text-slate-600 dark:text-slate-400 text-sm">
          DATABASE LOKASI SEJARAH DAN PARIWISATA NUSANTARA
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input 
            type="text" 
            placeholder="KODE PENCARIAN..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 bg-white dark:bg-[#0B1426] border-2 border-slate-900 dark:border-white/20 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-golden-heritage text-slate-900 dark:text-white brutal-shadow-sm"
          />
          <button type="submit" className="bg-golden-heritage text-slate-900 px-6 font-mono font-bold border-2 border-slate-900 brutal-shadow-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-transform">
            CARI
          </button>
        </form>
      </div>

      <div className="flex overflow-x-auto pb-4 mb-6 gap-3 hide-scrollbar">
        <button
          onClick={() => setActiveCategory('all')}
          className={`shrink-0 px-5 py-2 font-mono text-sm font-bold border-2 transition-all uppercase ${
            activeCategory === 'all' 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white brutal-shadow-sm' 
              : 'bg-white dark:bg-[#0F1C35] text-slate-600 dark:text-slate-400 border-slate-900 dark:border-white/20 hover:bg-[#F4F0EA] dark:hover:bg-[#0B1426]'
          }`}
        >
          SEMUA_DATA
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.slug)}
            className={`shrink-0 px-5 py-2 font-mono text-sm font-bold border-2 transition-all uppercase ${
              activeCategory === cat.slug 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white brutal-shadow-sm' 
                : 'bg-white dark:bg-[#0F1C35] text-slate-600 dark:text-slate-400 border-slate-900 dark:border-white/20 hover:bg-[#F4F0EA] dark:hover:bg-[#0B1426]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 bg-slate-200 dark:bg-slate-800 animate-pulse border-2 border-slate-900 dark:border-white/20 brutal-shadow-sm"></div>
          ))}
        </div>
      ) : contents.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {contents.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="bg-white dark:bg-[#0F1C35] border-2 border-slate-900 dark:border-white/20 flex flex-col brutal-shadow-sm group">
                <div className="relative h-48 border-b-2 border-slate-900 dark:border-white/20 overflow-hidden bg-slate-100 dark:bg-slate-900">
                  {item.cover_image ? (
                    <Image 
                      src={item.cover_image.startsWith('http') ? item.cover_image : `http://127.0.0.1:8000/storage/${item.cover_image}`} 
                      alt={item.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono text-xs text-slate-400 bg-slate-200 dark:bg-slate-800 uppercase">
                      [ NO_IMAGE ]
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-golden-heritage text-slate-900 px-3 py-1 font-mono text-xs font-bold border-2 border-slate-900 uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    {item.category?.name || 'UMUM'}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 uppercase tracking-tight">
                    {item.title}
                  </h3>
                  <p className="font-mono text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-6 flex-1">
                    {item.excerpt}
                  </p>
                  <div className="flex gap-2 mt-auto">
                    <Link href={`/dashboard/destinasi/${item.slug}`} className="flex-1 text-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 font-mono text-xs font-bold border-2 border-slate-900 dark:border-white hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors uppercase">
                      DETAIL
                    </Link>
                    <button onClick={() => addToWishlist(item.id)} className="w-10 h-10 flex items-center justify-center bg-[#F4F0EA] dark:bg-transparent text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white hover:bg-golden-heritage hover:border-slate-900 dark:hover:bg-golden-heritage dark:hover:text-slate-900 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div className="flex justify-center mt-8 pb-12">
              <button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-[#F4F0EA] dark:bg-slate-800 text-slate-900 dark:text-white border-4 border-slate-900 dark:border-white/20 px-8 py-3 font-mono font-bold uppercase hover:-translate-y-1 brutal-shadow transition-all disabled:opacity-50"
              >
                {loadingMore ? 'MENARIK DATA SATELIT...' : 'MUAT LEBIH BANYAK ARSIP'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-[#0F1C35] border-2 border-slate-900 dark:border-white/20 p-12 text-center brutal-shadow-sm flex flex-col items-center">
          <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="font-mono text-slate-500 font-bold uppercase">NO_DATA_FOUND</p>
          <p className="font-mono text-slate-400 text-xs mt-2">UBAH KATA KUNCI ATAU KATEGORI PENCARIAN</p>
        </div>
      )}
    </div>
  );
}