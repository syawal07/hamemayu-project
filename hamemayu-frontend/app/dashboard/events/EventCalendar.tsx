'use client';

import type { CalendarDay } from '../../types/event';

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
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">{day}</div>
        ))}
        {[...Array(35)].map((_, i) => (
          <div key={i} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Header Hari */}
      {weekDays.map(day => (
        <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">{day}</div>
      ))}

      {/* Grid Tanggal */}
      {days.map((day) => {
        const hasEvents = day.events.length > 0;
        
        return (
          <button
            key={day.date}
            onClick={() => onDateClick?.(day.date)}
            className={`
              relative aspect-square rounded-xl border transition-all duration-200
              flex flex-col items-center justify-center gap-2
              ${hasEvents 
                ? 'bg-white dark:bg-slate-800 border-green-300 dark:border-green-600/50 shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }
            `}
          >
            {/* 1. ANGKA TANGGAL (DI ATAS) */}
            <span className={`text-xl font-bold ${hasEvents ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
              {day.day}
            </span>

            {/* 2. LINGKARAN FOTO (DI BAWAH - BESAR & OVERLAP) */}
            {hasEvents && (
              // flex-row-reverse + -space-x-4 bikin efek tumpuk ke kanan
              <div className="flex flex-row-reverse justify-center -space-x-4">
                {day.events.slice(0, 4).map((ev, index) => (
                  <div 
                    key={ev.id} 
                    // w-10 h-10 = Ukuran lebih besar (40px)
                    // border-2 = Pemisah tebal antar lingkaran
                    // z-index diatur biar yang terakhir muncul paling depan
                    className={`
                      w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 
                      overflow-hidden shadow-md relative
                      ${index === 0 ? 'z-10' : index === 1 ? 'z-20' : index === 2 ? 'z-30' : 'z-40'}
                    `}
                    title={ev.title}
                  >
                    {ev.image ? (
                      <img 
                        src={ev.image} 
                        alt={ev.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-green-500 dark:bg-yellow-400 flex items-center justify-center text-xs font-bold text-white dark:text-slate-900">
                        {ev.category.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Badge "+N" jika lebih dari 4 */}
                {day.events.length > 4 && (
                  <span className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 z-50 shadow-md">
                    +{day.events.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* 3. GARIS INDIKATOR (PALING BAWAH) */}
            {hasEvents && (
              <div className="w-1/2 h-1.5 bg-green-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}