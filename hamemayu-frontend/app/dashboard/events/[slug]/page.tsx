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

          {/* Action Buttons */}
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
            <button className="flex-1 py-3 px-6 border-2 border-green-700 dark:border-yellow-400 text-green-700 dark:text-yellow-400 font-bold rounded-xl hover:bg-green-50 dark:hover:bg-yellow-400/10 transition">
              ❤️ Tambah ke Wishlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}