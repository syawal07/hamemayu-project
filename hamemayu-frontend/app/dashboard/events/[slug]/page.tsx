'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchAPI } from '../../../lib/api';
import { EventItem } from '../types';

interface ExtendedEventItem extends EventItem {
  location_address?: string;
  organizer_name?: string;
  organizer_contact?: string;
  ticket_link?: string;
}

interface WishlistCheckItem {
  id: number;
  plannable?: { id: number };
  content?: { id: number };
}

export default function EventDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [event, setEvent] = useState<ExtendedEventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<number | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchEvent = async () => {
      try {
        const res = await fetchAPI<ExtendedEventItem>(`/events/${slug}`, { requireAuth: true });
        if (isMounted && res) {
          setEvent(res);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Event tidak ditemukan';
          setError(errorMessage);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEvent();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    let isMounted = true;

    if (!event) return;
    
    const checkWishlist = async () => {
      try {
        const res = await fetchAPI<WishlistCheckItem[]>('/wishlist', { requireAuth: true });
        
        if (isMounted && res && Array.isArray(res)) {
          const found = res.find((item) => {
            const plannableId = item.plannable?.id || item.content?.id;
            return plannableId === event.id;
          });
          
          if (found) {
            setIsWishlisted(true);
            setWishlistId(found.id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    checkWishlist();

    return () => {
      isMounted = false;
    };
  }, [event]);

  const handleToggleWishlist = async () => {
    if (!event || wishlistLoading) return;
    
    setWishlistLoading(true);
    
    try {
      if (isWishlisted && wishlistId) {
        await fetchAPI(`/wishlist/${wishlistId}`, {
          method: 'DELETE',
          requireAuth: true
        });
        
        setIsWishlisted(false);
        setWishlistId(null);
      } else {
        const res = await fetchAPI<{ id: number }>('/wishlist', {
          method: 'POST',
          requireAuth: true,
          body: JSON.stringify({ event_id: event.id })
        });
        
        setIsWishlisted(true);
        if (res && res.id) setWishlistId(res.id);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memproses wishlist';
      alert(`Pemberitahuan: ${errorMessage}`);
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center bg-white/40 dark:bg-black/20 backdrop-blur-2xl p-12 rounded-[2.5rem] border border-white/20 shadow-xl">
          <div className="w-12 h-12 border-4 border-slate-900/30 dark:border-white/30 border-t-slate-900 dark:border-t-white rounded-full animate-spin mb-6" />
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold">Menyusun Detail Arsip...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center bg-white/60 dark:bg-[#111111]/60 backdrop-blur-2xl p-12 rounded-[2.5rem] border border-white/40 dark:border-white/10 shadow-xl max-w-md w-full">
          <p className="font-serif text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">Arsip Tidak Ditemukan</p>
          <p className="font-mono text-xs tracking-widest uppercase text-slate-500 mb-8">{error || 'Data event rusak atau telah dihapus.'}</p>
          <Link href="/dashboard/events" className="px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-black rounded-full font-mono text-[10px] font-bold uppercase tracking-widest transition-transform hover:scale-105 inline-block">
            ← Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  const isFree = event.is_free || !event.price || event.price === 0;
  const imageUrl = event.image || '/images/logo-adat-jawa.png';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 pb-20 animate-in fade-in duration-700">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 relative z-10">
        <Link 
          href="/dashboard/events" 
          className="group inline-flex items-center gap-3 bg-white/50 dark:bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/40 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all mb-8 shadow-sm"
        >
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            ← Kembali ke Katalog
          </span>
        </Link>

        <div className="bg-white/60 dark:bg-[#111111]/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/40 dark:border-white/10 overflow-hidden shadow-2xl">
          <div className="w-full h-64 md:h-[28rem] relative bg-slate-200 dark:bg-slate-800">
            <Image 
              src={imageUrl} 
              alt={event.title}
              fill
              className="object-cover"
              priority
              unoptimized={imageUrl.startsWith('http')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
              <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md text-white border border-white/30 mb-4 shadow-sm">
                {event.category?.name || 'UMUM'}
              </span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight text-balance drop-shadow-md">
                {event.title}
              </h1>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="flex items-start gap-4 p-6 rounded-3xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-sm">
                <div className="shrink-0 w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-slate-200 dark:border-white/10">
                  <span className="font-mono text-xl">📅</span>
                </div>
                <div>
                  <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-1">Jadwal Pelaksanaan</p>
                  <p className="font-bold text-sm md:text-base leading-snug">
                    {new Date(event.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {event.end_date && event.end_date !== event.start_date && ` — ${new Date(event.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                  </p>
                  <p className="text-xs font-mono text-slate-500 mt-1">
                    {event.start_time ? event.start_time.substring(0, 5) : 'Sepanjang hari'}
                    {event.end_time ? ` - ${event.end_time.substring(0, 5)}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 rounded-3xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-sm">
                <div className="shrink-0 w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-slate-200 dark:border-white/10">
                  <span className="font-mono text-xl">📍</span>
                </div>
                <div>
                  <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-1">Lokasi Titik</p>
                  <p className="font-bold text-sm md:text-base leading-snug">
                    {event.location || 'Belum ditentukan'}
                  </p>
                  {event.location_address && (
                    <p className="text-xs font-mono text-slate-500 mt-1 line-clamp-2">{event.location_address}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 rounded-3xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-sm">
                <div className="shrink-0 w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-slate-200 dark:border-white/10">
                  <span className="font-mono text-xl">🎟️</span>
                </div>
                <div>
                  <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-1">Akses & Tiket</p>
                  <p className="font-serif text-2xl font-bold">
                    {isFree ? 'Gratis' : `Rp ${event.price?.toLocaleString('id-ID')}`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 rounded-3xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-sm">
                <div className="shrink-0 w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-slate-200 dark:border-white/10">
                  <span className="font-mono text-xl">👥</span>
                </div>
                <div>
                  <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-1">Penyelenggara</p>
                  <p className="font-bold text-sm md:text-base leading-snug">
                    {event.organizer_name || 'Tidak ada informasi'}
                  </p>
                  {event.organizer_contact && (
                    <p className="text-xs font-mono text-slate-500 mt-1">{event.organizer_contact}</p>
                  )}
                </div>
              </div>
            </div>

            {event.description && (
              <div className="mb-12">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
                  <h2 className="font-mono text-xs tracking-widest uppercase text-slate-400">Deskripsi Agenda</h2>
                  <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
                </div>
                <div 
                  className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-loose prose-p:mb-4 prose-headings:font-serif prose-headings:text-slate-900 dark:prose-headings:text-white"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-200/50 dark:border-white/5">
              {event.ticket_link && (
                <a 
                  href={event.ticket_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-4 px-6 bg-slate-900 text-white dark:bg-white dark:text-black font-mono text-[10px] font-bold rounded-2xl uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all text-center shadow-xl flex items-center justify-center gap-2"
                >
                  <span className="text-lg">🎟️</span> Dapatkan Akses
                </a>
              )}
              
              <button 
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`flex-1 py-4 px-6 font-mono text-[10px] font-bold rounded-2xl uppercase tracking-widest transition-all flex items-center justify-center gap-3 border shadow-sm ${
                  isWishlisted 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-100' 
                    : 'bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:border-slate-300'
                } ${wishlistLoading ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-[1.02] active:scale-95'}`}
              >
                {wishlistLoading ? (
                  <span className="animate-pulse">Menyelaraskan...</span>
                ) : (
                  <>
                    <svg className={`w-4 h-4 ${isWishlisted ? 'fill-current' : 'fill-transparent'}`} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {isWishlisted ? 'Terarsip di Wishlist' : 'Simpan ke Wishlist'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}