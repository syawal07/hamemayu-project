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
        <div className="w-16 h-16 border-4 border-golden-heritage border-t-slate-900 dark:border-t-white rounded-full animate-spin mb-6"></div>
        <p className="font-mono text-slate-500 font-bold uppercase">MENGAMBIL DATA ARSIP...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mb-4">404_TIDAK_DITEMUKAN</h1>
        <button onClick={() => router.back()} className="font-mono font-bold border-b-2 border-golden-heritage text-golden-heritage hover:text-slate-900 dark:hover:text-white pb-1">
          KEMBALI KE PANGKALAN DATA
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 font-mono text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-6 uppercase"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        KEMBALI
      </button>

      <div className="bg-white dark:bg-[#0F1C35] border-4 border-slate-900 dark:border-white/20 brutal-shadow-light overflow-hidden mb-8">
        <div className="relative h-64 md:h-96 w-full bg-slate-200 dark:bg-slate-800 border-b-4 border-slate-900 dark:border-white/20">
          {data.cover_image ? (
            <Image 
              src={data.cover_image.startsWith('http') ? data.cover_image : `http://127.0.0.1:8000/storage/${data.cover_image}`} 
              alt={data.title} 
              fill 
              className="object-cover grayscale hover:grayscale-0 transition-all duration-700" 
              priority
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center font-mono text-slate-400">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>[ VISUAL_ASSET_MISSING ]</span>
            </div>
          )}
          <div className="absolute top-4 left-4 bg-golden-heritage text-slate-900 px-4 py-2 font-mono text-sm font-bold border-2 border-slate-900 uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            {data.category?.name || 'UMUM'}
          </div>
        </div>

        <div className="p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b-2 border-slate-900 dark:border-white/10 pb-8">
            <div className="flex-1">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tighter mb-4 leading-none">
                {data.title}
              </h1>
              <p className="font-mono text-slate-600 dark:text-slate-400 text-sm md:text-base border-l-4 border-golden-heritage pl-4">
                {data.excerpt}
              </p>
            </div>
            
            <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
              <button 
                onClick={addToWishlist}
                disabled={isAdding}
                className="w-full md:w-64 flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono font-bold px-6 py-4 border-2 border-slate-900 dark:border-white hover:-translate-y-1 hover:translate-x-1 brutal-shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                {isAdding ? 'MEMPROSES...' : 'SIMPAN KE WISHLIST'}
              </button>
              
              {data.lat && data.lng && (
                <button 
                  onClick={() => router.push(`/dashboard/peta?lat=${data.lat}&lng=${data.lng}&focus=${data.slug}`)}
                  className="w-full md:w-64 flex items-center justify-center gap-2 bg-[#F4F0EA] dark:bg-[#0B1426] text-slate-900 dark:text-white font-mono font-bold px-6 py-4 border-2 border-slate-900 dark:border-white/20 hover:-translate-y-1 hover:translate-x-1 brutal-shadow transition-all uppercase cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  BUKA DI RADAR PETA
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <h3 className="font-mono font-bold text-lg text-slate-900 dark:text-white uppercase mb-6 bg-golden-heritage inline-block px-3 py-1 border-2 border-slate-900">
                ARSIP_DOKUMEN
              </h3>
              <div 
                className="prose prose-slate dark:prose-invert max-w-none font-serif text-lg leading-relaxed text-slate-800 dark:text-slate-300 prose-headings:font-bold prose-headings:font-serif prose-headings:uppercase prose-a:text-golden-heritage prose-a:font-bold"
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            </div>

            <div className="lg:col-span-1">
              <div className="bg-[#F4F0EA] dark:bg-slate-900 border-2 border-slate-900 dark:border-white/20 p-6 sticky top-24 brutal-shadow-sm">
                <h3 className="font-mono font-bold text-base text-slate-900 dark:text-white uppercase mb-6 border-b-2 border-slate-900 dark:border-white/20 pb-2">
                  DATA_OPERASIONAL
                </h3>
                
                {data.info && Object.keys(data.info).length > 0 ? (
                  <ul className="flex flex-col gap-4 font-mono text-sm">
                    {Object.entries(data.info).map(([key, value]) => (
                      <li key={key} className="flex flex-col">
                        <span className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] mb-1">{key}</span>
                        <span className="text-slate-900 dark:text-white font-bold">{value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-mono text-sm text-slate-500 italic uppercase">INFO OPERASIONAL TIDAK TERSEDIA</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}