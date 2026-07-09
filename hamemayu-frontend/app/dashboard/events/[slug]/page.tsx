'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { Event } from '../../../types/event';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api/v1';

export default function EventDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ STATE: Track wishlist status
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<number | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // ✅ FUNGSI: Load event detail
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('hamemayu_token='))?.split('=')[1];
        
        const res = await fetch(`${API_BASE}/events/${slug}`, {
          headers: {
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        
        if (!res.ok) throw new Error('Event tidak ditemukan');
        const data = await res.json();
        setEvent(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  // ✅ FUNGSI: Check wishlist status pas event udah load
  useEffect(() => {
    if (!event) return;
    
    const checkWishlist = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('hamemayu_token='))?.split('=')[1];
        
        const res = await fetch(`${API_BASE}/wishlist`, {
          headers: {
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          const wishlistData = data.data || data;
          
          // Cari apakah event ini udah di wishlist
          const found = wishlistData.find((item: any) => {
            const plannableId = item.plannable?.id || item.content?.id;
            return plannableId === event.id;
          });
          
          if (found) {
            setIsWishlisted(true);
            setWishlistId(found.id);
          }
        }
      } catch (err) {
        console.error('Failed to check wishlist:', err);
      }
    };
    
    checkWishlist();
  }, [event]);

  // ✅ FUNGSI: Toggle wishlist (Add/Remove)
  const handleToggleWishlist = async () => {
    if (!event || wishlistLoading) return;
    
    setWishlistLoading(true);
    
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('hamemayu_token='))?.split('=')[1];
      
      let res;
      if (isWishlisted && wishlistId) {
        // ✅ REMOVE dari wishlist
        res = await fetch(`${API_BASE}/wishlist/${wishlistId}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
      } else {
        // ✅ ADD ke wishlist
        res = await fetch(`${API_BASE}/wishlist`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ event_id: event.id })
        });
      }
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal update wishlist');
      }
      
      // Update state
      if (isWishlisted) {
        setIsWishlisted(false);
        setWishlistId(null);
        alert(` ${event.title} dihapus dari wishlist`);
      } else {
        const responseData = await res.json();
        setIsWishlisted(true);
        setWishlistId(responseData.data?.id);
        alert(`✅ ${event.title} ditambahkan ke wishlist!`);
      }
      
    } catch (err: any) {
      console.error('Wishlist error:', err);
      alert(' Gagal: ' + err.message);
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500 dark:text-slate-400 font-mono animate-pulse">
          Memuat detail event...
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Event tidak ditemukan'}</p>
        <a href="/dashboard/events" className="text-green-700 dark:text-green-400 underline">
          ← Kembali ke daftar event
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <a 
        href="/dashboard/events" 
        className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-green-700 dark:hover:text-green-400 transition"
      >
        ← Kembali
      </a>

      {/* Event Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Image */}
        {event.image && (
          <div className="w-full h-64 md:h-96 relative">
            <img 
              src={event.image} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            {event.title}
          </h1>
          
          {/* Category Badge */}
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-green-500 text-white mb-6">
            {event.category}
          </span>

          {/* Info Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Tanggal</p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {new Date(event.start_date!).toLocaleDateString('id-ID', { 
                      day: 'numeric', month: 'long', year: 'numeric' 
                    })}
                    {event.end_date && event.end_date !== event.start_date && (
                      <> - {new Date(event.end_date).toLocaleDateString('id-ID', { 
                        day: 'numeric', month: 'long', year: 'numeric' 
                      })}</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">🕐</span>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Waktu</p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {event.start_time || 'Sepanjang hari'}
                    {event.end_time && ` - ${event.end_time}`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Lokasi</p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {event.location_name || 'Belum ditentukan'}
                  </p>
                  {event.location_address && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{event.location_address}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">💰</span>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Harga Tiket</p>
                  <p className="text-slate-900 dark:text-white font-medium text-xl font-bold">
                    {event.ticket_price === 0 ? 'Gratis' : 
                      new Intl.NumberFormat('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR',
                        maximumFractionDigits: 0 
                      }).format(event.ticket_price)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">👤</span>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Penyelenggara</p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {event.organizer_name || '-'}
                  </p>
                  {event.organizer_contact && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{event.organizer_contact}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Deskripsi</h2>
              <div 
                className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>
          )}

          {/* ✅ ACTION BUTTONS - WISHLIST SEKARANG FUNCTIONAL */}
          <div className="flex gap-4">
            {event.ticket_link && (
              <a 
                href={event.ticket_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-6 bg-green-700 dark:bg-yellow-400 text-white dark:text-slate-900 font-bold rounded-xl hover:bg-green-800 dark:hover:bg-yellow-500 transition text-center"
              >
                🎟️ Beli Tiket
              </a>
            )}
            <button 
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={`flex-1 py-3 px-6 border-2 font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                isWishlisted 
                  ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' 
                  : 'border-green-700 dark:border-yellow-400 text-green-700 dark:text-yellow-400 hover:bg-green-50 dark:hover:bg-yellow-400/10'
              } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {wishlistLoading ? (
                <span className="animate-pulse">Memproses...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isWishlisted ? 'Di Wishlist' : 'Tambah ke Wishlist'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}