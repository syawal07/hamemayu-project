'use client';

import type { CalendarDay } from '../../types/event';
import Image from 'next/image';

interface EventCalendarProps {
  days: CalendarDay[];
  loading?: boolean;
  onDateClick?: (date: string) => void;
}

export default function EventCalendar({ 
  days = [], 
  loading = false,
  onDateClick 
}: EventCalendarProps) {
  const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-mono font-bold text-slate-400 py-2">
            {day}
          </div>
        ))}
        {[...Array(35)].map((_, i) => (
          <div key={i} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-1 md:gap-2">
      {/* Weekday Headers */}
      {weekDays.map(day => (
        <div key={day} className="text-center text-xs font-mono font-bold text-slate-400 py-2">
          {day}
        </div>
      ))}

      {/* Calendar Days */}
      {days.map((day) => {
        const hasEvents = day.events.length > 0;
        
        return (
          <button
            key={day.date}
            onClick={() => onDateClick?.(day.date)}
            className={`
              relative aspect-square rounded-lg border transition-all duration-200
              flex flex-col items-center justify-center p-1
              ${hasEvents 
                ? 'bg-white dark:bg-slate-800 border-green-200 dark:border-yellow-400/30 hover:border-green-400 dark:hover:border-yellow-400 hover:shadow-md' 
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }
            `}
          >
            {/* Date Number */}
            <span className={`text-sm font-bold ${hasEvents ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              {day.day}
            </span>

            {/* ✅ FOTO MINI BADGE DI ATAS ANGKA (Sesuai Request!) */}
            {hasEvents && (
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex -space-x-1.5 z-10">
                {day.events.slice(0, 3).map((ev, idx) => (
                  <div 
                    key={ev.id} 
                    className={`
                      w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 
                      bg-slate-200 dark:bg-slate-700 overflow-hidden
                      ${idx === 0 ? 'z-20' : idx === 1 ? 'z-10' : 'z-0'}
                    `}
                    title={ev.title}
                  >
                    {ev.image ? (
                      <Image 
                        src={ev.image} 
                        alt={ev.title}
                        width={20}
                        height={20}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-green-500 dark:bg-yellow-400 flex items-center justify-center text-[8px] text-white dark:text-slate-900 font-bold">
                        {ev.category.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                {day.events.length > 3 && (
                  <span className="w-5 h-5 rounded-full bg-slate-600 dark:bg-slate-500 text-[9px] text-white flex items-center justify-center z-30 border-2 border-white dark:border-slate-900">
                    +{day.events.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Indicator Line di Bawah */}
            {hasEvents && (
              <div className="w-3/4 h-1 bg-green-500 dark:bg-yellow-400 rounded-full mt-1" />
            )}
          </button>
        );
      })}
    </div>
  );
}