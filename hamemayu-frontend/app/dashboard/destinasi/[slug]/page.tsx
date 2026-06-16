"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchAPI } from '../../../lib/api';

interface ContentDetail {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  cover_image: string | null;
  category: { name: string; slug: string };
  info: Record<string, string> | null;
  lat: number | null;
  lng: number | null;
}

export default function DetailDestinasiPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  
  const [data, setData] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDetail = async () => {
      try {
        const res = await fetchAPI<ContentDetail>(`/contents/${slug}`);
        if (res && isMounted) {
          setData(res);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (slug) loadDetail();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const addToWishlist = async () => {
    if (!data) return;
    setIsAdding(true);
    try {
      await fetchAPI('/wishlist', {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify({ content_id: data.id, priority: 1, visited: false })
      });
      alert('DESTINASI DITAMBAHKAN KE WISHLIST!');
    } catch (error) {
      console.error(error);
      alert('GAGAL MENAMBAHKAN KE WISHLIST');
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-pulse">
        <div className="w-12 h-12 border-4 border-green-700/30 dark:border-yellow-400/30 border-t-green-700 dark:border-t-yellow-400 rounded-full animate-spin mb-6"></div>
        <p className="font-mono text-xs text-slate-500 font-bold uppercase tracking-widest">MENGAMBIL DATA ARSIP...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mb-4">404_TIDAK_DITEMUKAN</h1>
        <button onClick={() => router.back()} className="font-mono font-bold text-xs bg-slate-200 dark:bg-slate-800 px-6 py-2 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors uppercase tracking-widest">
          KEMBALI KE PANGKALAN DATA
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-12">
      
      {/* Tombol Kembali Floating */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 mb-6 uppercase tracking-widest bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-md px-4 py-2 border border-white/60 dark:border-slate-700/50 rounded-full shadow-sm w-fit hover:-translate-x-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        KEMBALI
      </button>

      {/* Main Container */}
      <div className="bg-white/40 dark:bg-brutal-dark/40 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 shadow-[0_8px_32px_rgba(15,28,53,0.05)] rounded-[2.5rem] overflow-hidden mb-8">
        
        {/* Cover Image Area */}
        <div className="relative h-72 md:h-100 w-full bg-slate-200 dark:bg-slate-900">
          {data.cover_image ? (
            <>
              <Image 
                src={data.cover_image.startsWith('http') ? data.cover_image : `http://127.0.0.1:8000/storage/${data.cover_image}`} 
                alt={data.title} 
                fill 
                className="object-cover" 
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center font-mono text-slate-400 bg-slate-100 dark:bg-slate-800">
              <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-xs tracking-widest">[ VISUAL_ASSET_MISSING ]</span>
            </div>
          )}
          
          {/* Header Konten Overlay (Teks di atas gambar) */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <div className="bg-white/20 dark:bg-brutal-dark/60 backdrop-blur-md text-white px-4 py-1.5 font-mono text-[10px] font-bold border border-white/30 dark:border-slate-700/50 uppercase rounded-full w-fit mb-4">
                {data.category?.name || 'UMUM'}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white uppercase tracking-tight leading-tight drop-shadow-md">
                {data.title}
              </h1>
            </div>
            
            {/* Tombol Aksi */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
              <button 
                onClick={addToWishlist}
                disabled={isAdding}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3.5 border border-white/30 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs font-bold uppercase tracking-wide"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                {isAdding ? 'MEMPROSES...' : 'WISHLIST'}
              </button>
              
              {data.lat && data.lng && (
                <button 
                  onClick={() => router.push(`/dashboard/peta?lat=${data.lat}&lng=${data.lng}&focus=${data.slug}`)}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3.5 border border-green-500/50 rounded-xl transition-all shadow-md font-mono text-xs font-bold uppercase tracking-wide cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  RADAR PETA
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-10">
          
          <div className="mb-10 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 p-6 rounded-2xl shadow-sm">
             <p className="font-mono text-slate-700 dark:text-slate-300 text-sm leading-relaxed border-l-2 border-green-600 dark:border-yellow-400 pl-4">
                {data.excerpt}
             </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            
            {/* Artikel Utama */}
            <div className="lg:col-span-2">
              <h3 className="font-mono font-bold text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase mb-4">
                ARSIP_DOKUMEN
              </h3>
              <div className="w-12 h-1 bg-green-700 dark:bg-yellow-400 rounded-full mb-8"></div>
              
              <div 
                className="prose prose-slate dark:prose-invert max-w-none font-serif text-lg leading-relaxed text-slate-800 dark:text-slate-200 prose-headings:font-bold prose-headings:font-serif prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-green-700 dark:prose-a:text-yellow-400 prose-a:font-bold prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl prose-img:shadow-md"
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            </div>

            {/* Panel Informasi Samping */}
            <div className="lg:col-span-1">
              <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 p-6 rounded-2xl sticky top-28 shadow-[0_4px_24px_rgba(15,28,53,0.03)]">
                <h3 className="font-mono font-bold text-xs text-slate-900 dark:text-white uppercase mb-6 flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-700/50 pb-4">
                  <svg className="w-4 h-4 text-green-700 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  DATA OPERASIONAL
                </h3>
                
                {data.info && Object.keys(data.info).length > 0 ? (
                  <ul className="flex flex-col gap-5 font-mono text-sm">
                    {Object.entries(data.info).map(([key, value]) => (
                      <li key={key} className="flex flex-col bg-white/40 dark:bg-slate-900/40 p-3 rounded-xl border border-white/50 dark:border-slate-700/30">
                        <span className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[9px] mb-1 tracking-widest">{key}</span>
                        <span className="text-slate-900 dark:text-white font-medium text-xs leading-snug">{value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="font-mono text-xs text-slate-500 italic uppercase">INFO OPERASIONAL TIDAK TERSEDIA</p>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}