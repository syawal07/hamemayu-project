'use client';

import type { CalendarDay } from '../../types/event';
import Image from 'next/image';

interface EventDatePopupProps {
  day: CalendarDay;
  position: { x: number; y: number };
  onClose: () => void;
  onEventClick?: (event: any) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  concert: 'bg-pink-500',
  sports: 'bg-blue-500',
  culture: 'bg-amber-600',
  festival: 'bg-purple-500',
  social: 'bg-orange-500',
  exhibition: 'bg-indigo-500',
  other: 'bg-slate-500'
};

const CATEGORY_LABELS: Record<string, string> = {
  concert: '🎵 Konser',
  sports: '⚽ Olahraga',
  culture: '🎭 Budaya',
  festival: '🎉 Festival',
  exhibition: '🖼️ Pameran',
  social: '🤝 Sosial',
  other: '📌 Lainnya'
};

export default function EventDatePopup({ 
  day, 
  position, 
  onClose,
  onEventClick 
}: EventDatePopupProps) {
  if (day.events.length === 0) return null;

  return (
    <div 
      className="fixed z-50 min-w-[280px] max-w-sm"
      style={{ 
        top: position.y, 
        left: position.x,
      }}
    >
      {/* Backdrop (klik luar untuk tutup) */}
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      
      {/* Popup Content */}
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white">
              {new Date(day.date).toLocaleDateString('id-ID', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </h3>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {day.events.length} event{day.events.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Event List */}
        <div className="max-h-[400px] overflow-y-auto p-3 space-y-2">
          {day.events.map((event) => (
            <button
              key={event.id}
              onClick={() => {
                onEventClick?.(event);
                onClose();
              }}
              className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition group"
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800">
                  {event.image ? (
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl">📅</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-400 line-clamp-2">
                    {event.title}
                  </h4>
                  
                  {/* Category Badge */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other} text-white`}>
                    {CATEGORY_LABELS[event.category] || event.category}
                  </span>

                  {/* Time */}
                  {event.time && event.time !== 'All Day' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                      🕐 {event.time}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}