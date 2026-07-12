import { useState, useMemo } from 'react';
import Image from 'next/image';
import { EventItem, CalendarDay } from '../types';
import EventDatePopup from './EventDatePopup';

interface EventCalendarProps {
  events: EventItem[];
  onEventSelect?: (event: EventItem) => void;
}

export default function EventCalendar({ events, onEventSelect }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    const today = new Date();
    
    const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        month: currentDate.getMonth() - 1,
        year: currentDate.getFullYear(),
        isCurrentMonth: false,
        events: [],
        isToday: false
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      const dayEvents = events.filter(ev => {
        if (!ev.start_date) return false;
        const evDate = new Date(ev.start_date);
        return evDate.getFullYear() === currentDate.getFullYear() &&
               evDate.getMonth() === currentDate.getMonth() &&
               evDate.getDate() === i;
      });

      const isToday = today.getDate() === i && 
                      today.getMonth() === currentDate.getMonth() && 
                      today.getFullYear() === currentDate.getFullYear();

      days.push({
        date: i,
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        isCurrentMonth: true,
        events: dayEvents,
        isToday
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        isCurrentMonth: false,
        events: [],
        isToday: false
      });
    }

    return days;
  }, [currentDate, events, firstDayOfMonth, daysInMonth]);

  const handleDayClick = (day: CalendarDay, e: React.MouseEvent) => {
    if (day.events.length === 0) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY
    });
    setSelectedDay(day);
  };

  const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8 px-4">
        <h2 className="font-serif text-3xl font-bold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2 bg-slate-100 dark:bg-white/5 p-1.5 rounded-full border border-slate-200 dark:border-white/10">
          <button 
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all shadow-sm"
          >
            ←
          </button>
          <button 
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all shadow-sm"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4 px-2">
        {weekDays.map(day => (
          <div key={day} className="text-center font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4">
        {calendarDays.map((day, idx) => (
          <div 
            key={idx}
            onClick={(e) => handleDayClick(day, e)}
            className={`
              min-h-[100px] md:min-h-[120px] p-2 md:p-3 rounded-3xl border transition-all duration-300 relative group overflow-hidden
              ${!day.isCurrentMonth ? 'opacity-30 bg-transparent border-transparent pointer-events-none' : 'bg-white/50 dark:bg-black/20 border-white/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'}
              ${day.isToday ? 'ring-2 ring-slate-900 dark:ring-white bg-slate-50 dark:bg-white/10' : ''}
              ${day.events.length > 0 ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : 'cursor-default'}
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`font-serif text-lg md:text-xl font-bold ${day.isToday ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                {day.date}
              </span>
              {day.events.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>

            <div className="flex flex-col gap-1.5 mt-auto">
              {day.events.slice(0, 2).map((ev) => (
                <div key={ev.id} className="flex items-center gap-2 bg-white/80 dark:bg-white/10 p-1.5 rounded-xl border border-slate-100 dark:border-white/5">
                  <div className="relative shrink-0 w-5 h-5 rounded-md overflow-hidden bg-slate-200">
                    <Image 
                      src={ev.image || '/images/logo-adat-jawa.png'} 
                      alt={ev.title} 
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <p className="font-mono text-[9px] font-bold uppercase truncate text-slate-700 dark:text-slate-300 flex-1">
                    {ev.title}
                  </p>
                </div>
              ))}
              {day.events.length > 2 && (
                <p className="font-mono text-[9px] text-slate-400 text-center uppercase tracking-widest mt-1">
                  +{day.events.length - 2} Acara
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedDay && (
        <EventDatePopup 
          day={selectedDay}
          position={popupPosition}
          onClose={() => setSelectedDay(null)}
          onEventSelect={onEventSelect}
        />
      )}
    </div>
  );
}