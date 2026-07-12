import Link from 'next/link';
import Image from 'next/image';
import { EventItem } from '../types';

interface EventCardProps {
  event: EventItem;
}

export default function EventCard({ event }: EventCardProps) {
  const isFree = event.is_free || !event.price || event.price === 0;
  const imageUrl = event.image || '/images/logo-adat-jawa.png';

  return (
    <Link href={`/dashboard/events/${event.slug}`} className="block group h-full">
      <div className="flex flex-col h-full bg-white/60 dark:bg-[#111111]/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-4xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
        <div className="relative w-full h-56 bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <Image 
            src={imageUrl} 
            alt={event.title} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized={imageUrl.startsWith('http')}
          />
          <div className="absolute top-4 left-4">
            <span className="px-4 py-1.5 bg-white/90 dark:bg-black/90 backdrop-blur-md text-slate-900 dark:text-white rounded-full font-mono text-[10px] font-bold uppercase tracking-widest shadow-md">
              {event.category?.name || 'Umum'}
            </span>
          </div>
        </div>

        <div className="flex flex-col flex-1 p-6 md:p-8">
          <div className="mb-6">
            <h3 className="font-serif text-2xl font-bold leading-tight group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors line-clamp-2 mb-3">
              {event.title}
            </h3>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 line-clamp-2 leading-relaxed">
              {event.excerpt || 'Eksplorasi detail acara ini lebih lanjut di halaman khusus.'}
            </p>
          </div>

          <div className="mt-auto space-y-4 pt-6 border-t border-slate-200/50 dark:border-white/5">
            <div className="flex items-start gap-4 text-slate-600 dark:text-slate-400">
              <div className="shrink-0 w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/10 shadow-sm">
                <span className="font-serif text-sm font-bold text-slate-900 dark:text-white">
                  {new Date(event.start_date).getDate()}
                </span>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="font-mono text-[9px] uppercase tracking-widest opacity-70 mb-0.5">Waktu Pelaksanaan</p>
                <p className="font-bold text-xs">
                  {new Date(event.start_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 text-slate-600 dark:text-slate-400">
              <div className="shrink-0 w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/10 shadow-sm">
                <span className="font-mono text-sm">📍</span>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="font-mono text-[9px] uppercase tracking-widest opacity-70 mb-0.5">Lokasi Utama</p>
                <p className="font-bold text-xs truncate">{event.location}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-white/5">
            <div className="font-mono text-xs font-bold uppercase tracking-widest">
              {isFree ? (
                <span className="text-emerald-600 dark:text-emerald-400">Terbuka / Gratis</span>
              ) : (
                <span>Rp {event.price?.toLocaleString('id-ID')}</span>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
              <span className="font-mono font-bold text-sm">→</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}