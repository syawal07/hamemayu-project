import Link from 'next/link';
import Image from 'next/image';
import { EventDatePopupProps } from '../types';

export default function EventDatePopup({ day, position, onClose, onEventSelect }: EventDatePopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white/90 dark:bg-[#111111]/90 backdrop-blur-2xl rounded-4xl p-6 md:p-8 max-w-md w-full max-h-[80vh] overflow-y-auto border border-white/40 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-300" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8 border-b border-slate-200/50 dark:border-white/5 pb-4">
          <div>
            <h3 className="text-2xl font-serif font-bold leading-tight">Agenda Harian</h3>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mt-1">
              {String(day.date).padStart(2, '0')} / {String(day.month + 1).padStart(2, '0')} / {day.year}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {day.events.length > 0 ? (
            day.events.map(ev => {
              const isFree = ev.is_free || !ev.price || ev.price === 0;
              const imageUrl = ev.image || '/images/logo-adat-jawa.png';
              
              return (
                <div key={ev.id} className="group relative flex items-start gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
                  <div className="relative shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800">
                    <Image 
                      src={imageUrl} 
                      alt={ev.title} 
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="64px"
                      unoptimized={imageUrl.startsWith('http')}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 truncate">
                      {ev.start_time ? ev.start_time.substring(0, 5) : '00:00'} • {ev.location}
                    </p>
                    <h4 className="font-bold text-sm leading-tight text-slate-900 dark:text-white line-clamp-1 mb-3">
                      {ev.title}
                    </h4>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold tracking-widest">
                        {isFree ? (
                          <span className="text-emerald-600 dark:text-emerald-400">GRATIS</span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-300">Rp {ev.price?.toLocaleString('id-ID')}</span>
                        )}
                      </span>
                      
                      {onEventSelect ? (
                        <button 
                          onClick={() => { onEventSelect(ev); onClose(); }}
                          className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-900 dark:text-white hover:underline decoration-2 underline-offset-4"
                        >
                          Pilih →
                        </button>
                      ) : (
                        <Link 
                          href={`/dashboard/events/${ev.slug}`}
                          className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-900 dark:text-white hover:underline decoration-2 underline-offset-4"
                        >
                          Detail →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-12 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
              <p className="font-mono text-xs uppercase tracking-widest text-slate-400">Jadwal Kosong</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}