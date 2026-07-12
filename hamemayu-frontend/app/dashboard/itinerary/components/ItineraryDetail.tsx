import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchAPI } from '../../../lib/api';
import { fetchItineraryWeather } from '../../../lib/weather';
import { 
  ItineraryDetail as ItineraryDetailType, 
  ItineraryDay, 
  ItinerarySlot, 
  MapMarker, 
  WishlistItem 
} from '../types';

interface ItineraryDetailProps {
  id: number;
  onBack: () => void;
}

interface WeatherInfo {
  icon: string;
  temp: number;
  description: string;
}

export default function ItineraryDetail({ id, onBack }: ItineraryDetailProps) {
  const router = useRouter();
  
  const [selectedDetail, setSelectedDetail] = useState<ItineraryDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editableDays, setEditableDays] = useState<ItineraryDay[] | null>(null);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [weatherForecast, setWeatherForecast] = useState<WeatherInfo[]>([]);
  
  const [showEditSlotModal, setShowEditSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{dayIndex: number, slotIndex: number} | null>(null);
  const [wishlistForEdit, setWishlistForEdit] = useState<WishlistItem[]>([]);

  const [showTimeInputModal, setShowTimeInputModal] = useState(false);
  const [pendingWishlistItem, setPendingWishlistItem] = useState<WishlistItem | null>(null);
  const [customTime, setCustomTime] = useState('08:00');

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const res = await fetchAPI<ItineraryDetailType>(`/itinerary/history/${id}`, { requireAuth: true });
        if (!res) {
          alert("Data tidak valid atau sesi berakhir.");
          onBack();
          return;
        }

        setSelectedDetail(res);
        setNewTitle(res.title);

        const normalizedDays = res.itinerary_data.days.map((day) => ({
          ...day,
          slots: day.slots.map(slot => {
            const rawTitle = slot.title || '';
            if (!rawTitle.includes('\n') && !rawTitle.includes('(')) {
              return slot;
            }
            
            const lines = rawTitle.split('\n').map(l => l.trim()).filter(l => l);
            let extractedTitle = '';
            let extractedTime = slot.time_slot || '';
            
            for (const line of lines) {
              const timeMatch = line.match(/\((\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\)/);
              if (timeMatch) {
                extractedTime = timeMatch[1];
                continue;
              }
              if (line.match(/^[A-Z\s&]+$/) && line.length < 30) continue;
              if (line.match(/^\d{1,2}:\d{2}$/)) continue;
              if (line.length > 2 && !extractedTitle) {
                extractedTitle = line;
              }
            }
            
            if (!extractedTitle && lines.length > 0) {
              extractedTitle = lines[lines.length - 1];
            }
            
            return {
              ...slot,
              title: extractedTitle || rawTitle,
              time_slot: extractedTime
            };
          })
        }));
        
        setEditableDays(normalizedDays);

        if (res.start_date && res.days) {
          try {
            const weatherData = await fetchItineraryWeather(res.start_date, res.days);
            if (Array.isArray(weatherData)) {
               setWeatherForecast(weatherData as WeatherInfo[]);
            }
          } catch (err) {
            console.error(err);
            setWeatherForecast([]);
          }
        }
      } catch (error) {
        console.error(error);
        alert('Gagal memuat detail itinerary.');
        onBack();
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id, onBack]);

  const handleUpdateDetail = async (updatedData: Partial<ItineraryDetailType>) => {
    if (!selectedDetail) return;
    try {
      await fetchAPI(`/itinerary/history/${selectedDetail.id}`, {
        method: 'PUT', requireAuth: true, body: JSON.stringify(updatedData)
      });
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan perubahan ke server");
    }
  };

  const handleDeleteItinerary = async () => {
    if (!selectedDetail) return;
    if (!confirm(`Yakin ingin menghapus permanen "${selectedDetail.title}"?`)) return;
    try {
      await fetchAPI(`/itinerary/history/${selectedDetail.id}`, { method: 'DELETE', requireAuth: true });
      onBack();
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus itinerary");
    }
  };

  const handleTitleBlur = () => {
    if (newTitle.trim() && newTitle !== selectedDetail?.title) {
      const updated = { ...selectedDetail!, title: newTitle };
      setSelectedDetail(updated);
      handleUpdateDetail({ title: newTitle });
    }
    setIsEditingTitle(false);
  };

  const navigateAllToMap = async () => {
    try {
      if (!selectedDetail) return;
      const { extractItineraryCoords } = await import('../../../lib/itinerary-utils');
      const destinations = await extractItineraryCoords(selectedDetail);
      
      if (destinations.length === 0) {
        alert("Tidak ada destinasi dengan koordinat valid di itinerary ini.");
        return;
      }
      
      const routeParam = encodeURIComponent(JSON.stringify(destinations));
      router.push(`/dashboard/peta?route=${routeParam}`);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data peta kolektif.");
    }
  };

  const navigateSingleToMap = async (slot: ItinerarySlot) => {
    try {
      const markers = await fetchAPI<MapMarker[]>('/map-markers');
      if (!markers || !Array.isArray(markers)) {
        alert('Gagal memuat data referensi peta.');
        return;
      }

      let matchedMarker = slot.content_id ? markers.find(m => m.id === slot.content_id) : undefined;
      
      if (!matchedMarker && slot.title) {
        const slotTitle = slot.title.toLowerCase().trim();
        matchedMarker = markers.find(marker => {
          const markerTitle = marker.title.toLowerCase().trim();
          return markerTitle === slotTitle || markerTitle.includes(slotTitle) || slotTitle.includes(markerTitle);
        });
      }

      if (!matchedMarker) {
        alert(`Destinasi "${slot.title}" tidak ditemukan di database peta sistem.`);
        return;
      }

      const lat = typeof matchedMarker.lat === 'string' ? parseFloat(matchedMarker.lat) : matchedMarker.lat;
      const lng = typeof matchedMarker.lng === 'string' ? parseFloat(matchedMarker.lng) : matchedMarker.lng;

      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        const destination = { lat, lng, title: matchedMarker.title || slot.title, content_id: matchedMarker.id };
        const routeParam = encodeURIComponent(JSON.stringify([destination]));
        router.push(`/dashboard/peta?route=${routeParam}`);
      } else {
        alert(`Data koordinat untuk "${matchedMarker.title}" tidak lengkap.`);
      }
    } catch (err: unknown) {
      console.error(err);
      alert('Terjadi kendala teknis saat membuka navigasi peta.');
    }
  };

  const moveSlot = (dayIndex: number, slotIndex: number, direction: 'up' | 'down') => {
    if (!editableDays || !selectedDetail) return;
    const newDays = [...editableDays];
    const slots = [...newDays[dayIndex].slots];
    const newIndex = direction === 'up' ? slotIndex - 1 : slotIndex + 1;
    
    if (newIndex < 0 || newIndex >= slots.length) return;
  
    [slots[slotIndex], slots[newIndex]] = [slots[newIndex], slots[slotIndex]];
  
    const baseMinutes = 8 * 60;
    const intervalMinutes = 150; 
    
    const reorderedSlots = slots.map((slot, idx) => {
      const totalMin = baseMinutes + (idx * intervalMinutes);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return { ...slot, time_slot: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
    });
  
    newDays[dayIndex].slots = reorderedSlots;
    setEditableDays(newDays);
    handleUpdateDetail({ itinerary_data: { ...selectedDetail.itinerary_data, days: newDays } });
  };

  const deleteSlot = (dayIndex: number, slotIndex: number) => {
    if (!editableDays || !selectedDetail) return;
    if (!confirm("Hapus destinasi ini dari jadwal?")) return;
    
    const newDays = [...editableDays];
    newDays[dayIndex].slots.splice(slotIndex, 1);
    setEditableDays(newDays);
    handleUpdateDetail({ itinerary_data: { ...selectedDetail.itinerary_data, days: newDays } });
  };

  const openEditSlotModal = async (dayIndex: number, slotIndex: number) => {
    setEditingSlot({ dayIndex, slotIndex });
    try {
      const res = await fetchAPI<WishlistItem[]>('/wishlist', { requireAuth: true });
      if (res && Array.isArray(res)) {
        setWishlistForEdit(res);
        setShowEditSlotModal(true);
      } else {
        alert("Wishlist kosong atau gagal dimuat.");
      }
    } catch (error) {
      console.error(error);
      alert("Gagal memuat wishlist. Silakan coba lagi.");
    }
  };

  const openAddDestinationModal = async (dayIndex: number) => {
    openEditSlotModal(dayIndex, -1);
  };

  const replaceSlotFromWishlist = async (wishlistItem: WishlistItem) => {
    if (!editingSlot || !editableDays || !selectedDetail) return;
    
    const actualData = wishlistItem.content || wishlistItem.plannable || wishlistItem;
    
    if (editingSlot.slotIndex === -1) {
      setPendingWishlistItem(wishlistItem);
      setShowTimeInputModal(true);
      return;
    }
    
    const newDays = [...editableDays];
    const { dayIndex, slotIndex } = editingSlot;
    
    newDays[dayIndex].slots[slotIndex] = {
      content_id: actualData.id,
      title: actualData.title || wishlistItem.title || 'Destinasi Baru',
      time_slot: newDays[dayIndex].slots[slotIndex].time_slot,
      notes: wishlistItem.notes || '',
    };
    
    setEditableDays(newDays);
    setShowEditSlotModal(false);
    setEditingSlot(null);
    handleUpdateDetail({ itinerary_data: { ...selectedDetail.itinerary_data, days: newDays } });
  };

  const handleAddDestinationWithTime = async () => {
    if (!pendingWishlistItem || !editingSlot || !editableDays || !selectedDetail) return;
    
    if (!/^\d{1,2}:\d{2}$/.test(customTime)) {
      alert("Format jam tidak valid! Gunakan format HH:MM (contoh: 14:30)");
      return;
    }
    
    const actualData = pendingWishlistItem.content || pendingWishlistItem.plannable || pendingWishlistItem;
    const newSlot: ItinerarySlot = {
      content_id: actualData.id,
      title: actualData.title || pendingWishlistItem.title || 'Destinasi Baru',
      time_slot: customTime,
      notes: pendingWishlistItem.notes || '',
    };
    
    const newDays = [...editableDays];
    newDays[editingSlot.dayIndex].slots.push(newSlot);
    
    newDays[editingSlot.dayIndex].slots.sort((a, b) => {
      const timeA = a.time_slot || '23:59';
      const timeB = b.time_slot || '23:59';
      return timeA.localeCompare(timeB);
    });
    
    setEditableDays(newDays);
    setShowEditSlotModal(false);
    setShowTimeInputModal(false);
    setEditingSlot(null);
    setPendingWishlistItem(null);
    handleUpdateDetail({ itinerary_data: { ...selectedDetail.itinerary_data, days: newDays } });
  };

  if (loading || !selectedDetail || !editableDays) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/20">
        <div className="w-8 h-8 border-2 border-slate-800 dark:border-slate-200 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono text-xs tracking-widest uppercase text-slate-500">Menganalisis Rute...</span>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <button 
          onClick={onBack} 
          className="group flex items-center gap-3 w-fit bg-white/50 dark:bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/40 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all"
        >
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            ← Kembali
          </span>
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={navigateAllToMap}
            className="px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-black rounded-full font-mono text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
          >
            Navigasi Peta Global
          </button>
          
          <button 
            onClick={handleDeleteItinerary}
            className="px-6 py-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-100 dark:border-red-900/30"
          >
            Hapus Arsip
          </button>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-[#111111]/60 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-12 border border-white/40 dark:border-white/10 shadow-xl">
        <div className="mb-12 border-b border-slate-200/50 dark:border-white/5 pb-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-6">
            <div className="flex-1">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                  autoFocus
                  className="text-4xl md:text-5xl font-serif font-bold bg-transparent border-b-2 border-slate-900 dark:border-white focus:outline-none w-full pb-3"
                />
              ) : (
                <h2 
                  onClick={() => setIsEditingTitle(true)}
                  className="text-4xl md:text-5xl font-serif font-bold cursor-pointer hover:opacity-70 transition-opacity flex flex-col gap-2 group leading-tight"
                >
                  {selectedDetail.title}
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono tracking-widest uppercase text-slate-400">
                    Klik untuk merubah judul
                  </span>
                </h2>
              )}
            </div>
            
            <div className="text-left md:text-right p-6 bg-white/50 dark:bg-white/5 rounded-3xl border border-white/60 dark:border-white/10 min-w-50">
               <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">{selectedDetail.budget_type}</p>
               <p className="text-2xl font-serif font-bold">{selectedDetail.estimated_budget}</p>
            </div>
          </div>

          {selectedDetail.start_date && selectedDetail.end_date && (
            <div className="inline-flex items-center gap-6 px-6 py-4 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5">
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">Periode Eksplorasi</p>
                <p className="text-sm font-medium">
                  {new Date(selectedDetail.start_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' — '}
                  {new Date(selectedDetail.end_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-12">
          {editableDays.map((dayPlan, dayIndex) => {
            const currentDate = selectedDetail?.start_date ? new Date(selectedDetail.start_date) : null;
            const dayDate = currentDate ? new Date(currentDate.getTime() + (dayIndex * 24 * 60 * 60 * 1000)) : null;
            const weather = weatherForecast[dayIndex] || null;
            
            return (
              <div key={dayPlan.day} className="relative pl-6 md:pl-10 border-l border-slate-200 dark:border-slate-800 pb-4 last:pb-0">
                <div className="absolute -left-4.25 top-0 w-8 h-8 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-serif text-sm font-bold shadow-md">
                  {dayPlan.day}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 p-6 bg-white/40 dark:bg-white/5 rounded-3xl border border-white/60 dark:border-white/10">
                  <div>
                    <h3 className="font-serif text-2xl font-bold">
                      Hari {dayPlan.day}
                    </h3>
                    {dayDate && (
                      <p className="text-xs font-mono tracking-widest text-slate-500 mt-2 uppercase">
                        {dayDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    )}
                  </div>
                  
                  {weather ? (
                    <div className="flex items-center gap-4 mt-4 sm:mt-0 bg-white/60 dark:bg-black/40 px-5 py-3 rounded-2xl border border-white/80 dark:border-white/10">
                      <Image 
                        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
                        alt={weather.description} 
                        width={40} 
                        height={40} 
                        unoptimized 
                      />
                      <div className="text-left">
                        <p className="text-lg font-serif font-bold">{weather.temp}°C</p>
                        <p className="text-[10px] font-mono tracking-widest uppercase text-slate-500">{weather.description}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-4 sm:mt-0">
                      Data Cuaca Terbatas
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {dayPlan.slots.map((slot, slotIndex) => {
                    const extractTime = (timeSlot: string) => {
                      if (!timeSlot) return '00:00';
                      const timeMatch = timeSlot.match(/\((\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\)/);
                      if (timeMatch) return timeMatch[1];
                      const simpleTime = timeSlot.match(/(\d{1,2}:\d{2})/);
                      return simpleTime ? simpleTime[1] : timeSlot;
                    };
                    
                    const displayTime = extractTime(slot.time_slot || '');
                    const displayTitle = slot.title || 'Destinasi Tidak Dikenal';
                    
                    return (
                      <div key={slotIndex} className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/80 dark:bg-[#1a1a1a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all gap-4">
                        <div className="flex items-center gap-6 flex-1">
                          <div className="shrink-0 w-20 text-center border-r border-slate-200 dark:border-white/10 pr-6">
                            <span className="block text-xl font-serif font-bold">
                              {displayTime}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-base md:text-lg">
                              {displayTitle}
                            </p>
                            {slot.notes && <p className="text-xs font-mono tracking-wide text-slate-500 mt-1">{slot.notes}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => navigateSingleToMap(slot)}
                            className="px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-white/10 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black rounded-full transition-all"
                          >
                            Peta
                          </button>
                          <button 
                            onClick={() => openEditSlotModal(dayIndex, slotIndex)}
                            className="px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-white/10 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black rounded-full transition-all"
                          >
                            Ubah
                          </button>
                          <div className="flex flex-col gap-1 mx-2">
                            <button 
                              onClick={() => moveSlot(dayIndex, slotIndex, 'up')}
                              disabled={slotIndex === 0}
                              className="text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20"
                            >
                              ▲
                            </button>
                            <button 
                              onClick={() => moveSlot(dayIndex, slotIndex, 'down')}
                              disabled={slotIndex === dayPlan.slots.length - 1}
                              className="text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20"
                            >
                              ▼
                            </button>
                          </div>
                          <button 
                            onClick={() => deleteSlot(dayIndex, slotIndex)}
                            className="px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-500 hover:text-white rounded-full transition-all"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => openAddDestinationModal(dayIndex)}
                    className="w-full mt-2 py-6 border border-dashed border-slate-300 dark:border-white/20 rounded-3xl text-slate-400 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all"
                  >
                    + Sisipkan Destinasi Baru
                  </button>
                  
                  {dayPlan.slots.length === 0 && (
                    <p className="text-center text-[10px] font-mono uppercase tracking-widest text-slate-400 py-6">Jadwal masih kosong</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showEditSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={() => setShowEditSlotModal(false)}>
          <div className="bg-white/90 dark:bg-[#111111]/90 backdrop-blur-2xl rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/40 dark:border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-serif font-bold">Koleksi Wishlist</h3>
              <button onClick={() => setShowEditSlotModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-2xl">✕</button>
            </div>
            
            <div className="space-y-3">
              {wishlistForEdit.length > 0 ? (
                wishlistForEdit.map((item, index) => {
                  const actualData = item.content || item.plannable || item;
                  const title = actualData.title || item.title || 'Destinasi';
                  
                  const categoryData = actualData.category || item.category;
                  const categoryName = typeof categoryData === 'string' ? categoryData : (categoryData?.name || 'Umum');
                  
                  return (
                    <div key={item.id || index} className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer group" onClick={() => replaceSlotFromWishlist(item)}>
                      <div>
                        <p className="font-bold text-sm">{title}</p>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-1">{categoryName}</p>
                      </div>
                      <span className="px-4 py-2 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-white/10 text-slate-500 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                        {editingSlot?.slotIndex === -1 ? 'Pilih' : 'Ganti'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="font-mono text-xs uppercase tracking-widest text-slate-400">Wishlist Anda Masih Kosong.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showTimeInputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={() => setShowTimeInputModal(false)}>
          <div className="bg-white/90 dark:bg-[#111111]/90 backdrop-blur-2xl rounded-[2.5rem] p-8 max-w-md w-full border border-white/40 dark:border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-serif font-bold mb-6 text-center">Waktu Kunjungan</h3>
            
            <div className="mb-8">
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-full p-6 text-center text-3xl font-serif rounded-3xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:outline-none"
                step="300"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowTimeInputModal(false)}
                className="flex-1 px-4 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold rounded-full uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleAddDestinationWithTime}
                className="flex-1 px-4 py-4 bg-slate-900 text-white dark:bg-white dark:text-black font-mono text-[10px] font-bold rounded-full uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}