import GlassCard from './ui/GlassCard';
import RetroButton from './ui/RetroButton';
import RetroBadge from './ui/RetroBadge';

interface ItinerarySlot {
  title?: string;
}

interface ItineraryDay {
  slots?: ItinerarySlot[];
}

interface ItineraryHistory {
  id: number;
  title: string;
  start_date?: string;
  end_date?: string;
  days: number;
  total_destinations?: number;
  created_at?: string;
  itinerary_data?: {
    days?: ItineraryDay[];
  };
}

interface ItineraryListProps {
  loading: boolean;
  historyList: ItineraryHistory[];
  handleViewDetail: (id: number) => void;
  setActiveTab: (tab: 'create' | 'list' | 'detail') => void;
}

const getItineraryStatus = (startDate: string | undefined, endDate: string | undefined) => {
  if (!startDate || !endDate) return { status: 'unknown', label: 'Tidak Ada Tanggal', badge: 'warning' as const };
  
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now > end) {
    return { status: 'completed', label: 'SELESAI', badge: 'neutral' as const };
  } else if (now >= start && now <= end) {
    return { status: 'ongoing', label: 'BERLANGSUNG', badge: 'success' as const };
  } else {
    return { status: 'upcoming', label: 'AKAN DATANG', badge: 'info' as const };
  }
};

export default function ItineraryList({
  loading,
  historyList,
  handleViewDetail,
  setActiveTab
}: ItineraryListProps) {

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 h-64">
        <div className="w-12 h-12 border-4 border-green-200 dark:border-slate-700 border-t-green-600 dark:border-t-green-400 rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-sm font-bold uppercase animate-pulse text-green-600 dark:text-green-400">Memuat Daftar...</p>
      </div>
    );
  }

  if (historyList.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-20 text-center border-dashed border-2 bg-transparent shadow-none border-slate-300 dark:border-slate-700">
        <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl opacity-50"> </div>
        <p className="font-mono text-slate-500 text-sm mb-4">Belum ada itinerary yang dibuat</p>
        <RetroButton onClick={() => setActiveTab('create')}>
          Buat Itinerary Pertama
        </RetroButton>
      </GlassCard>
    );
  }

  const activeItineraries = historyList.filter(item => getItineraryStatus(item.start_date, item.end_date).status !== 'completed');
  const completedItineraries = historyList.filter(item => getItineraryStatus(item.start_date, item.end_date).status === 'completed');

  const ItineraryCardItem = ({ item, isCompleted }: { item: ItineraryHistory, isCompleted: boolean }) => {
    const statusInfo = getItineraryStatus(item.start_date, item.end_date);
    
    let displayDays = item.days || 0;
    if (item.start_date && item.end_date) {
      try {
        const start = new Date(item.start_date);
        start.setHours(0, 0, 0, 0); 
        const end = new Date(item.end_date);
        end.setHours(0, 0, 0, 0); 
        
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const diffTime = Math.abs(end.getTime() - start.getTime());
          displayDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
      } catch (e) {
        console.error('Date parsing error:', e);
      }
    }
    
    let displayDestinations = 0;
    if (item.itinerary_data?.days) {
      displayDestinations = item.itinerary_data.days.reduce((acc: number, day: ItineraryDay) => {
        return acc + (day.slots?.length || 0);
      }, 0);
    } else {
      displayDestinations = item.total_destinations || 0;
    }

    return (
  <GlassCard className={`relative group flex flex-col h-full p-6 transition-all ${isCompleted ? 'opacity-70 grayscale-[30%]' : 'hover:-translate-y-1 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700'}`}>
    <div className="absolute top-4 right-4">
      <RetroBadge status={statusInfo.badge}>{statusInfo.label}</RetroBadge>
    </div>

    <div className="flex-1 mt-2">
      <h3 className={`font-serif text-xl font-bold mb-3 pr-24 ${isCompleted ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
        {item.title}
      </h3>
      
      <div className="space-y-2 mb-4">
        <div className={`flex items-center gap-2 text-sm ${isCompleted ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>
          <svg className="w-4 h-4 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-mono">{displayDays} Hari</span>
        </div>
        
        <div className={`flex items-center gap-2 text-sm ${isCompleted ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>
          <svg className="w-4 h-4 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="font-mono">{displayDestinations} Destinasi</span>
        </div>
      </div>
      
      {item.start_date && item.end_date && (
        <div className={`text-[10px] font-mono mb-4 uppercase tracking-wider ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
          {new Date(item.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - 
          {new Date(item.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      )}
    </div>
      
    <div className="flex gap-3 mt-auto pt-4 border-t border-slate-200/60 dark:border-slate-700/50">
      <button 
        disabled={isCompleted}
        onClick={() => handleViewDetail(item.id)}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-xs font-bold transition-all shadow-sm ${
          isCompleted 
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 active:scale-95'
        }`}
      >
        {!isCompleted && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
        {isCompleted ? 'SUDAH SELESAI' : 'LIHAT DETAIL'}
      </button>
    </div>
  </GlassCard>
);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {activeItineraries.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
              Rencana Perjalanan Aktif
            </h2>
            <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1 ml-4 mt-2"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeItineraries.map(item => (
              <ItineraryCardItem key={item.id} item={item} isCompleted={false} />
            ))}
          </div>
        </section>
      )}
      
      {completedItineraries.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6 opacity-70">
            <h2 className="text-2xl font-serif font-bold text-slate-500 dark:text-slate-400">
              Perjalanan Selesai
            </h2>
            <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1 ml-4 mt-2"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedItineraries.map(item => (
              <ItineraryCardItem key={item.id} item={item} isCompleted={true} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}