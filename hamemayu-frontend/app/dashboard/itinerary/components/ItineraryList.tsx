import { useEffect, useState } from 'react';
import { fetchAPI } from '../../../lib/api';
import { ItineraryHistory } from '../types';

interface ItineraryListProps {
  onNavigate: (id: number) => void;
}

export default function ItineraryList({ onNavigate }: ItineraryListProps) {
  const [historyList, setHistoryList] = useState<ItineraryHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      setLoading(true);
      try {
        // HANYA 1x FETCH! Tidak ada lagi Promise.all yang menembak API Detail satu-satu.
        const res = await fetchAPI<ItineraryHistory[]>('/itinerary/history', { requireAuth: true });
        
        if (!isMounted) return;

        if (res && Array.isArray(res)) {
          const historyData = [...res];
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          historyData.sort((a: ItineraryHistory, b: ItineraryHistory) => {
            const dateA = a.start_date ? new Date(a.start_date) : new Date(a.created_at || 0);
            const dateB = b.start_date ? new Date(b.start_date) : new Date(b.created_at || 0);
            
            const diffTimeA = Math.abs(dateA.getTime() - today.getTime());
            const diffTimeB = Math.abs(dateB.getTime() - today.getTime());
            const diffDaysA = Math.ceil(diffTimeA / (1000 * 60 * 60 * 24));
            const diffDaysB = Math.ceil(diffTimeB / (1000 * 60 * 60 * 24));
            
            return diffDaysA - diffDaysB;
          });
          
          setHistoryList(historyData);
        }
      } catch (error) { 
        console.error("Gagal memuat riwayat:", error); 
      } finally { 
        if (isMounted) setLoading(false); 
      }
    };
    
    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const getItineraryStatus = (startDate: string | undefined, endDate: string | undefined) => {
    if (!startDate || !endDate) return { status: 'unknown', label: 'TANGGAL KOSONG', theme: 'bg-slate-100 text-slate-500 border-slate-200' };
    
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now > end) {
      return { status: 'completed', label: 'SELESAI', theme: 'bg-slate-200/50 text-slate-600 border-slate-300/50' };
    } else if (now >= start && now <= end) {
      return { status: 'ongoing', label: 'BERLANGSUNG', theme: 'bg-green-100 text-green-800 border-green-300' };
    } else {
      return { status: 'upcoming', label: 'MENDATANG', theme: 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-black dark:border-white' };
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number, title: string) => {
    e.stopPropagation();
    if (!confirm(`Hapus permanen rencana "${title}"?`)) return;
    
    try {
      await fetchAPI(`/itinerary/history/${id}`, { method: 'DELETE', requireAuth: true });
      setHistoryList(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus itinerary.");
    }
  };

  const activeItineraries = historyList.filter(item => getItineraryStatus(item.start_date, item.end_date).status !== 'completed');
  const completedItineraries = historyList.filter(item => getItineraryStatus(item.start_date, item.end_date).status === 'completed');

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((skeleton) => (
          <div key={skeleton} className="h-48 bg-white/30 dark:bg-black/20 backdrop-blur-sm rounded-4xl border border-white/20 animate-pulse p-8 flex flex-col justify-between">
            <div className="w-24 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="space-y-3">
              <div className="w-3/4 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (historyList.length === 0) {
    return (
      <div className="text-center py-24 bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-4xl border border-white/20">
        <p className="font-serif text-2xl text-slate-400 mb-2">Belum Ada Rencana Perjalanan</p>
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-6">Silakan buat itinerary pertama Anda</p>
      </div>
    );
  }

  const renderCard = (item: ItineraryHistory, isCompleted: boolean) => {
    const status = getItineraryStatus(item.start_date, item.end_date);
    let displayDays = item.days || 0;
    
    if (item.start_date && item.end_date) {
      const start = new Date(item.start_date);
      const end = new Date(item.end_date);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        displayDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
    }

    return (
      <div 
        key={item.id} 
        onClick={() => !isCompleted && onNavigate(item.id)}
        className={`group relative flex flex-col h-full p-8 rounded-4xl transition-all duration-500 ${
          isCompleted 
            ? 'bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/10 opacity-75 cursor-not-allowed grayscale-50' 
            : 'bg-white/60 dark:bg-[#111111]/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] cursor-pointer'
        }`}
      >
        <div className="flex justify-between items-start mb-12">
          <span className={`px-4 py-1.5 rounded-full font-mono text-[10px] font-bold tracking-widest border ${status.theme}`}>
            {status.label}
          </span>
          <button 
            onClick={(e) => handleDelete(e, item.id, item.title)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1">
          <h3 className="font-serif text-2xl font-bold leading-tight mb-6 line-clamp-2">{item.title}</h3>
          
          <div className="flex gap-6 mb-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">Durasi</p>
              <p className="font-serif text-lg font-bold">{displayDays} Hari</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">Tujuan</p>
              <p className="font-serif text-lg font-bold">{item.total_destinations || 0} Titik</p>
            </div>
          </div>
        </div> 
        
        {item.start_date && item.end_date && (
          <div className="pt-6 border-t border-slate-200/50 dark:border-slate-700/50 mt-auto flex justify-between items-center">
            <span className="font-mono text-[10px] tracking-widest text-slate-500">
              {new Date(item.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} — {new Date(item.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            {!isCompleted && (
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                Buka →
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      {activeItineraries.length > 0 && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeItineraries.map(item => renderCard(item, false))}
          </div>
        </section>
      )}
      
      {completedItineraries.length > 0 && (
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-slate-300 dark:bg-slate-800 flex-1" />
            <h2 className="font-mono text-xs tracking-widest uppercase text-slate-400">Arsip Perjalanan</h2>
            <div className="h-px bg-slate-300 dark:bg-slate-800 flex-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedItineraries.map(item => renderCard(item, true))}
          </div>
        </section>
      )}
    </div>
  );
}