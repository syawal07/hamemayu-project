'use client';

import { useState } from 'react';
import type { CalendarDay, Event } from '../../types/event';
import EventDatePopup from './EventDatePopup';
import Image from 'next/image';

interface EventCalendarProps {
  days: CalendarDay[];
  loading?: boolean;
  onDateClick?: (date: string) => void;
  onEventSelect?: (event: Event) => void;
}

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  concert: 'border-pink-500',
  sports: 'border-blue-500',
  culture: 'border-amber-600',
  festival: 'border-purple-500',
  social: 'border-orange-500',
  exhibition: 'border-indigo-500',
  other: 'border-slate-500'
};

export default function EventCalendar({ 
  days = [], 
  loading = false,
  onDateClick,
  onEventSelect
}: EventCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

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

  const handleDateClick = (day: CalendarDay, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    
    const popupWidth = 320;
    const popupHeight = 400;
    
    let x = rect.left + (rect.width / 2) - (popupWidth / 2);
    
    let y = rect.top - popupHeight - 10;
    
    if (y < 10) {
      y = rect.bottom + 10;
    }
    
    if (x < 10) x = 10;
    if (x + popupWidth > window.innerWidth) {
      x = window.innerWidth - popupWidth - 10;
    }
    
    setPopupPosition({ x, y });
    setSelectedDay(day);
    onDateClick?.(day.date);
  };

  return (
    <>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">{day}</div>
        ))}

        {days.map((day) => {
          const hasEvents = day.events.length > 0;
          
          return (
            <button
              key={day.date}
              onClick={(e) => handleDateClick(day, e)}
              className={`
                relative aspect-square rounded-xl border transition-all duration-200
                flex flex-col items-center justify-center gap-2 cursor-pointer
                ${hasEvents 
                  ? 'bg-white dark:bg-slate-800 border-green-200 dark:border-green-600/30 shadow-sm hover:shadow-md hover:border-green-400' 
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }
              `}
            >
              <span className={`text-xl font-bold ${hasEvents ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                {day.day}
              </span>

              {hasEvents && (
                <div className="flex flex-row-reverse justify-center -space-x-3">
                  {day.events.slice(0, 4).map((ev) => {
                    const borderColor = CATEGORY_BORDER_COLORS[ev.category] || CATEGORY_BORDER_COLORS.other;
                    return (
                      <div 
                        key={ev.id} 
                        className={`
                          w-10 h-10 rounded-full border-2 overflow-hidden shadow-md relative z-10
                          ${borderColor}
                        `}
                        title={`${ev.title} (${ev.category})`}
                      >
                        {ev.image ? (
                          <Image 
                            src={ev.image} 
                            alt={ev.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-xs font-bold text-white ${borderColor.replace('border-', 'bg-')}`}>
                            {ev.category.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {day.events.length > 4 && (
                    <span className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-600 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 z-50 shadow-md">
                      +{day.events.length - 4}
                    </span>
                  )}
                </div>
              )}

              {hasEvents && (
                <div className="w-1/2 h-1.5 bg-green-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <EventDatePopup
          day={selectedDay}
          position={popupPosition}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </>
  );
}