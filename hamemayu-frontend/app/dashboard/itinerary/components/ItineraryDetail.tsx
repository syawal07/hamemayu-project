import { KeyboardEvent } from 'react';
import GlassCard from './ui/GlassCard';
import RetroButton from './ui/RetroButton';

interface WeatherInfo {
  icon: string;
  temp: number;
  description: string;
}

interface ItinerarySlot {
  title: string;
  time_slot: string;
  content_id?: number;
  notes?: string;
}

interface ItineraryDay {
  day: number;
  theme?: string;
  slots: ItinerarySlot[];
  transport_tip?: string;
}

interface ItineraryDetailData {
  id: number;
  title: string;
  start_date?: string;
  end_date?: string;
  days: number;
  budget_type: string;
  total_destinations: number;
  estimated_budget: string;
}

interface ItineraryDetailProps {
  selectedDetail: ItineraryDetailData;
  editableDays: ItineraryDay[];
  setActiveTab: (tab: 'create' | 'list' | 'detail') => void;
  navigateAllToMap: () => void;
  navigateSingleToMap: (slot: ItinerarySlot) => void;
  handleDeleteItinerary: (id: number) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (isEditing: boolean) => void;
  newTitle: string;
  setNewTitle: (title: string) => void;
  handleTitleBlur: () => void;
  getWeatherForDay: (dayIndex: number) => WeatherInfo | null;
  openEditSlotModal: (dayIndex: number, slotIndex: number) => void;
  moveSlot: (dayIndex: number, slotIndex: number, direction: 'up' | 'down') => void;
  deleteSlot: (dayIndex: number, slotIndex: number) => void;
  openAddDestinationModal: (dayIndex: number) => void;
}

export default function ItineraryDetail({
  selectedDetail,
  editableDays,
  setActiveTab,
  navigateAllToMap,
  navigateSingleToMap,
  handleDeleteItinerary,
  isEditingTitle,
  setIsEditingTitle,
  newTitle,
  setNewTitle,
  handleTitleBlur,
  getWeatherForDay,
  openEditSlotModal,
  moveSlot,
  deleteSlot,
  openAddDestinationModal
}: ItineraryDetailProps) {
  
  const extractTime = (timeSlot: string) => {
    if (!timeSlot) return '00:00';
    const timeMatch = timeSlot.match(/\((\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\)/);
    if (timeMatch) return timeMatch[1];
    
    const simpleTime = timeSlot.match(/(\d{1,2}:\d{2})/);
    if (simpleTime) return simpleTime[1];
    
    return timeSlot;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleTitleBlur();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('list')}
          className="font-mono text-xs font-bold flex items-center gap-2 text-slate-500 hover:text-green-700 transition-colors w-fit"
        >
          KEMBALI KE DAFTAR
        </button>
        
        <div className="flex gap-3">
          <RetroButton onClick={navigateAllToMap} className="!py-2.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
            LIHAT DI PETA
          </RetroButton>
          
          <RetroButton 
            variant="danger" 
            onClick={() => handleDeleteItinerary(selectedDetail.id)}
            className="!py-2.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            HAPUS ITINERARY
          </RetroButton>
        </div>
      </div>

      <GlassCard className="p-8">
        <div className="mb-8 border-b border-green-200/50 dark:border-slate-700 pb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="text-3xl md:text-4xl font-serif font-bold bg-transparent border-b-2 border-green-500 focus:outline-none w-full pb-2 text-slate-900 dark:text-white"
                />
              ) : (
                <h2 
                  onClick={() => setIsEditingTitle(true)}
                  className="text-3xl md:text-4xl font-serif font-bold uppercase cursor-pointer text-slate-900 dark:text-white hover:text-green-700 dark:hover:text-yellow-400 transition-colors flex items-center gap-3 group"
                >
                  {selectedDetail.title}
                  <span className="opacity-0 group-hover:opacity-100 text-sm font-mono font-normal text-green-700 bg-green-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md">
                      Edit
                  </span>
                </h2>
              )}
            </div>
            
            <div className="text-right">
               <p className="text-sm font-mono font-bold text-slate-500 uppercase tracking-wide">
                 {selectedDetail.budget_type}
               </p>
               <p className="text-2xl font-bold text-green-700 dark:text-yellow-400 font-mono">
                 {selectedDetail.estimated_budget}
               </p>
            </div>
          </div>

          {selectedDetail.start_date && selectedDetail.end_date && (
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xl"></span>
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Periode Perjalanan</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {new Date(selectedDetail.start_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' - '}
                  {new Date(selectedDetail.end_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {editableDays.map((dayPlan, dayIndex) => {
            const currentDate = selectedDetail?.start_date ? new Date(selectedDetail.start_date) : null;
            const dayDate = currentDate ? new Date(currentDate.getTime() + (dayIndex * 24 * 60 * 60 * 1000)) : null;
            const weather = getWeatherForDay(dayIndex);
            
            return (
              <div key={dayPlan.day} className="relative pl-8 md:pl-12 border-l-2 border-dashed border-green-300/50 dark:border-slate-700 last:border-0 pb-8 last:pb-0">
                <div className="absolute -left-[14px] top-0 w-7 h-7 bg-white dark:bg-slate-900 border-2 border-green-400/50 dark:border-slate-600 rounded-full flex items-center justify-center font-mono font-bold text-xs text-green-700 dark:text-yellow-400 shadow-sm z-10">
                  {dayPlan.day}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                      Hari {dayPlan.day}
                    </h3>
                    {dayDate && (
                      <p className="text-sm font-mono text-slate-600 dark:text-slate-400 mt-1">
                        {dayDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  
                  {weather ? (
                    <div className="flex items-center gap-3 mt-2 sm:mt-0 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                      <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt={weather.description} className="w-8 h-8" />
                      <div className="text-left font-mono">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{weather.temp} C</p>
                        <p className="text-[10px] text-slate-500 capitalize">{weather.description}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-slate-400 italic flex items-center gap-2">
                      <span></span>
                      <span>Cuaca belum bisa diprediksi</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {dayPlan.slots.map((slot, slotIndex) => {
                    const displayTime = extractTime(slot.time_slot || '');
                    const displayTitle = slot.title || 'No Title';
                    
                    return (
                      <div key={slotIndex} className="group flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:opacity-90 active:scale-95 transition-all">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-shrink-0 w-16 text-center">
                            <span className="block text-lg font-bold text-green-700 dark:text-yellow-400 font-mono">
                              {displayTime}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0 border-l-2 border-slate-100 dark:border-slate-800 pl-4">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {displayTitle}
                            </p>
                            {slot.notes && <p className="text-xs text-slate-500 italic truncate mt-1">{slot.notes}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border border-slate-100 dark:border-slate-700">
                          <button onClick={() => navigateSingleToMap(slot)} className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-all" title="Lihat di Peta" type="button">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
                          </button>
                          
                          <button onClick={() => openEditSlotModal(dayIndex, slotIndex)} className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-md transition-all" title="Ganti dari Wishlist">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 16h16a2 2 0 0 0 2-2V6l-4 4"/><path d="M21 8H5a2 2 0 0 0-2 2v8l4-4"/></svg>
                          </button>
                          
                          <button onClick={() => moveSlot(dayIndex, slotIndex, 'up')} disabled={slotIndex === 0} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Pindah Atas">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                          </button>
                          
                          <button onClick={() => moveSlot(dayIndex, slotIndex, 'down')} disabled={slotIndex === dayPlan.slots.length - 1} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Pindah Bawah">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </button>
                          
                          <button onClick={() => deleteSlot(dayIndex, slotIndex)} className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-all" title="Hapus Destinasi">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => openAddDestinationModal(dayIndex)}
                    className="w-full mt-3 py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-mono text-xs font-bold hover:bg-green-50 dark:hover:bg-yellow-900/20 hover:text-green-600 dark:hover:text-yellow-400 hover:border-green-400 dark:hover:border-yellow-500 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                    TAMBAH DESTINASI KE HARI INI
                  </button>
                  
                  {dayPlan.slots.length === 0 && (
                    <p className="text-center text-sm font-mono text-slate-400 italic py-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                      Belum ada destinasi untuk hari ini.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}