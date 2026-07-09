'use client';

import { useRouter } from 'next/navigation';
import type { Event } from '../../types/event';
import Image from 'next/image';

interface EventCardProps {
  event: Event;
  id?: string;
  onAddToWishlist?: (event: Event) => void;
  onAddToItinerary?: (event: Event) => void;
}

export default function EventCard({ 
  event, 
  id,
  onAddToWishlist, 
  onAddToItinerary 
}: EventCardProps) {
  const router = useRouter();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratis';
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      maximumFractionDigits: 0 
    }).format(price);
  };

  // ✅ NAVIGASI KE DETAIL
  const handleCardClick = () => {
    router.push(`/dashboard/events/${event.slug}`);
  };

  // ✅ STOP PROPAGATION UNTUK BUTTON AKSI
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToWishlist?.(event);
  };

  const handleItineraryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToItinerary?.(event);
  };

  return (
    <div 
      id={id}
      onClick={handleCardClick} // ✅ KLIK CARD = NAVIGASI
      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-40 bg-slate-200 dark:bg-slate-800 overflow-hidden">
        {event.image ? (
          <Image 
            src={event.image} 
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-2 py-1 text-[10px] font-mono font-bold uppercase bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg text-slate-700 dark:text-slate-300 border border-white/60 dark:border-slate-700/50">
          {event.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 group-hover:text-green-700 dark:group-hover:text-yellow-400 transition-colors">
            {event.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            {event.location_name || 'Lokasi belum ditentukan'}
          </p>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            {formatDate(event.start_date)}
            {event.end_date && event.end_date !== event.start_date && ` - ${formatDate(event.end_date)}`}
            {event.start_time && ` • ${event.start_time}`}
          </span>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className={`font-bold text-sm ${event.ticket_price === 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
            {formatPrice(event.ticket_price)}
          </span>
          
          {/* Action Buttons - STOP PROPAGATION */}
          <div className="flex gap-1.5">
            <button 
              onClick={handleWishlistClick}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Tambah ke Wishlist"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button 
              onClick={handleItineraryClick}
              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Tambah ke Itinerary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}