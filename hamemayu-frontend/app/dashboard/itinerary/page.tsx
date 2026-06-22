// app/dashboard/itinerary/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { fetchAPI } from '../../lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ItineraryHistory {
  id: number;
  title: string;
  days: number;
  created_at?: string;
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

interface ItinerarySummary {
  total_days: number;
  total_destinations: number;
  estimated_total_budget: string;
  highlights: string[];
}

interface ItineraryGenerateResponse {
  summary: ItinerarySummary;
  days?: ItineraryDay[]; 
}

interface ItineraryDetail {
  id: number;
  title: string;
  days: number;
  budget_type: string;
  total_destinations: number;
  estimated_budget: string;
  itinerary_data: {
    summary: ItinerarySummary;
    days: ItineraryDay[];
  };
  created_at: string;
}

interface DestWithCoords {
  lat: number;
  lng: number;
  title: string;
  content_id?: number;
}

export default function ItineraryPage() {
  const [activeTab, setActiveTab] = useState<'history' | 'generate' | 'detail'>('history');
  const [historyList, setHistoryList] = useState<ItineraryHistory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formDays, setFormDays] = useState<number>(1);
  const [formBudget, setFormBudget] = useState<string>('hemat');
  const [useWishlist, setUseWishlist] = useState<boolean>(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [formTitle, setFormTitle] = useState<string>('Rencana Eksplorasi Baru');

  const [generatedResult, setGeneratedResult] = useState<ItineraryGenerateResponse | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ItineraryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editableDays, setEditableDays] = useState<ItineraryDay[] | null>(null);
  
  // State untuk GPS user
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Load History
  useEffect(() => {
    let isMounted = true;
    
    const loadHistory = async () => {
      if (activeTab !== 'history') return;
      setLoading(true);
      try {
        const res = await fetchAPI<ItineraryHistory[]>('/itinerary/history', { requireAuth: true });
        if (res && Array.isArray(res) && isMounted) {
          setHistoryList(res);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHistory();
    return () => { isMounted = false; };
  }, [activeTab]);

  // Load Categories
  useEffect(() => {
    let isMounted = true;
    fetchAPI<Category[]>('/categories').then(res => {
      if (res && Array.isArray(res) && isMounted) {
        setCategories(res);
        if (res.length > 0) setSelectedInterests([res[0].slug]);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Get User Location
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      console.warn("Geolocation tidak didukung");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.warn("GPS Error:", error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const toggleInterest = (slug: string) => {
    setSelectedInterests(prev => 
      prev.includes(slug) 
        ? prev.filter(i => i !== slug) 
        : [...prev, slug]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInterests.length === 0) {
      alert("MOHON PILIH MINIMAL SATU FOKUS MINAT EKSPLORASI.");
      return;
    }

    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const res = await fetchAPI<ItineraryGenerateResponse>('/itinerary/generate', {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify({
          days: formDays,
          budget: formBudget,
          use_wishlist: useWishlist,
          interests: selectedInterests 
        })
      });

      if (res) {
        setGeneratedResult(res);
      }
    } catch (error) {
      console.error(error);
      alert('GAGAL MENGHASILKAN ITINERARY.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveItinerary = async () => {
    if (!generatedResult) return;
    
    try {
      const payload = {
        title: formTitle,
        days: formDays,
        interests: selectedInterests,
        budget_type: formBudget,
        total_destinations: generatedResult.summary.total_destinations || generatedResult.summary.highlights?.length || 0,
        estimated_budget: generatedResult.summary.estimated_total_budget,
        itinerary_data: {
          summary: generatedResult.summary,
          days: generatedResult.days || [
            {
              day: 1,
              theme: "Eksplorasi Mandiri",
              slots: generatedResult.summary.highlights?.map((h, i) => ({
                title: h,
                time_slot: i === 0 ? 'pagi' : i === 1 ? 'siang' : 'sore'
              })) || []
            }
          ]
        }
      };

      await fetchAPI('/itinerary/save', {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify(payload)
      });

      alert('ITINERARY BERHASIL DISIMPAN!');
      setActiveTab('history');
      setGeneratedResult(null);
    } catch (error) {
      console.error(error);
      alert('GAGAL MENYIMPAN ITINERARY.');
    }
  };

  const handleViewDetail = async (id: number) => {
    setActiveTab('detail');
    setDetailLoading(true);
    try {
      const res = await fetchAPI<ItineraryDetail>(`/itinerary/history/${id}`, { requireAuth: true });
      if (res) {
        setSelectedDetail(res);
        setEditableDays(JSON.parse(JSON.stringify(res.itinerary_data.days)));
        setNewTitle(res.title);
      }
    } catch (error) {
      console.error(error);
      alert('GAGAL MEMUAT DETAIL.');
      setActiveTab('history');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!selectedDetail || !newTitle.trim()) return;
    
    try {
      await fetchAPI(`/itinerary/history/${selectedDetail.id}`, {
        method: 'PUT',
        requireAuth: true,
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      
      alert('✅ JUDUL BERHASIL DIUPDATE!');
      setIsEditingTitle(false);
      handleViewDetail(selectedDetail.id);
    } catch (error) {
      console.error("Update Title Error:", error);
      alert('GAGAL UPDATE JUDUL.');
    }
  };

  const moveSlot = async (dayIndex: number, slotIndex: number, direction: 'up' | 'down') => {
    if (!editableDays || !selectedDetail) return;
    
    const updatedDays = [...editableDays];
    const currentDaySlots = [...updatedDays[dayIndex].slots];
    
    const newIndex = direction === 'up' ? slotIndex - 1 : slotIndex + 1;
    
    if (newIndex < 0 || newIndex >= currentDaySlots.length) return;
    
    [currentDaySlots[slotIndex], currentDaySlots[newIndex]] = [currentDaySlots[newIndex], currentDaySlots[slotIndex]];
    
    updatedDays[dayIndex].slots = currentDaySlots;
    setEditableDays(updatedDays);
    
    try {
      await fetchAPI(`/itinerary/history/${selectedDetail.id}`, {
        method: 'PUT',
        requireAuth: true,
        body: JSON.stringify({
          itinerary_data: {
            ...selectedDetail.itinerary_data,
            days: updatedDays
          }
        }),
      });
      console.log('✅ Urutan berhasil disimpan otomatis');
    } catch (error) {
      console.error('❌ Gagal auto-save:', error);
      alert('Gagal menyimpan perubahan urutan');
      handleViewDetail(selectedDetail.id);
    }
  };

  const handleRemoveDestination = async (dayIndex: number, slotIndex: number) => {
    if (!confirm('HAPUS DESTINASI INI DARI ITINERARY?')) return;
    
    if (!selectedDetail || !editableDays) return;

    const updatedDays = JSON.parse(JSON.stringify(editableDays));
    updatedDays[dayIndex].slots.splice(slotIndex, 1);
    setEditableDays(updatedDays);

    try {
      await fetchAPI(`/itinerary/history/${selectedDetail.id}`, {
        method: 'PUT',
        requireAuth: true,
        body: JSON.stringify({
          itinerary_data: {
            ...selectedDetail.itinerary_data,
            days: updatedDays
          }
        }),
      });
      
      alert('✅ DESTINASI BERHASIL DIHAPUS!');
      handleViewDetail(selectedDetail.id);
    } catch (error) {
      console.error("Delete Destination Error:", error);
      alert('GAGAL HAPUS DESTINASI.');
      handleViewDetail(selectedDetail.id);
    }
  };

  const handleNavigateSlot = async (slot: ItinerarySlot, dayIndex: number) => {
    try {
      const { extractItineraryCoords } = await import('../../lib/itinerary-utils');
      const singleSlot = { ...slot };
      
      const destinations = await extractItineraryCoords({ 
          itinerary_data: { days: [{ day: dayIndex + 1, slots: [singleSlot] }] } 
      });
      
      if (destinations.length > 0) {
          window.location.href = `/dashboard/peta?route=${encodeURIComponent(JSON.stringify(destinations))}`;
      } else {
          const markers: any[] = await fetchAPI('/map-markers');
          const matchedMarker = markers.find(m => 
              m.title.toLowerCase().includes(slot.title.toLowerCase()) ||
              slot.title.toLowerCase().includes(m.title.toLowerCase())
          );
          
          if (matchedMarker && matchedMarker.lat && matchedMarker.lng) {
              window.location.href = `/dashboard/peta?focus=${matchedMarker.slug}&lat=${matchedMarker.lat}&lng=${matchedMarker.lng}`;
          } else {
              alert(`📍 "${slot.title}" tidak memiliki koordinat di database.`);
          }
      }
   } catch (err) { 
       console.error("Navigation Error:", err);
       alert("Gagal membuka peta.");
   }
  };

  // ✅ Fungsi Navigasi Semua Destinasi dengan Optimasi Rute
  const handleNavigateAllOptimized = async () => {
    if (!selectedDetail || !editableDays) return;

    // Cek apakah user sudah izin GPS
    if (!userLocation) {
      alert('📍 Mohon izinkan akses lokasi (GPS) untuk optimasi rute otomatis.');
      return;
    }

    try {
      // 1. Kumpulkan semua destinasi dari semua hari
      const allDestinations: DestWithCoords[] = [];
      
      for (const day of editableDays) {
        for (const slot of day.slots) {
          const { extractItineraryCoords } = await import('../../lib/itinerary-utils');
          const destinations = await extractItineraryCoords({
            itinerary_data: { days: [{ day: day.day, slots: [slot] }] }
          });
          
          if (destinations.length > 0) {
            allDestinations.push(...destinations);
          } else {
            // Fallback: cari via map-markers
            const markers: any[] = await fetchAPI('/map-markers');
            const matchedMarker = markers.find(m => 
              m.title.toLowerCase().includes(slot.title.toLowerCase()) ||
              slot.title.toLowerCase().includes(m.title.toLowerCase())
            );
            
            if (matchedMarker && matchedMarker.lat && matchedMarker.lng) {
              allDestinations.push({
                lat: matchedMarker.lat,
                lng: matchedMarker.lng,
                title: matchedMarker.title,
                content_id: matchedMarker.id
              });
            }
          }
        }
      }

      if (allDestinations.length === 0) {
        alert('⚠️ Tidak ada destinasi dengan koordinat valid di itinerary ini.');
        return;
      }

      // 2. Optimasi rute: urutkan berdasarkan jarak dari posisi user (Nearest Neighbor)
      const optimizedRoute = optimizeRouteByDistance(userLocation, allDestinations);

      // 3. Redirect ke peta dengan route yang sudah dioptimasi
      window.location.href = `/dashboard/peta?route=${encodeURIComponent(JSON.stringify(optimizedRoute))}&optimized=true`;
      
    } catch (err) {
      console.error("Optimized Navigation Error:", err);
      alert('Gagal memuat rute optimasi.');
    }
  };

  // ✅ Helper: Hitung jarak Haversine (km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius bumi dalam km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // ✅ Helper: Optimasi rute dengan algoritma Nearest Neighbor
  const optimizeRouteByDistance = (
    startPoint: {lat: number, lng: number}, 
    destinations: DestWithCoords[]
  ): DestWithCoords[] => {
    const optimized: DestWithCoords[] = [];
    const remaining = [...destinations];
    let currentPos = startPoint;

    while (remaining.length > 0) {
      // Cari destinasi terdekat dari posisi saat ini
      let nearestIndex = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const dist = calculateDistance(
          currentPos.lat, currentPos.lng,
          remaining[i].lat, remaining[i].lng
        );
        
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIndex = i;
        }
      }

      // Tambahkan ke route yang sudah dioptimasi
      const nearest = remaining.splice(nearestIndex, 1)[0];
      optimized.push(nearest);
      currentPos = { lat: nearest.lat, lng: nearest.lng };
    }

    console.log(`✅ Rute dioptimasi: ${optimized.length} destinasi, total jarak ~${calculateTotalDistance(startPoint, optimized).toFixed(1)} km`);
    return optimized;
  };

  // ✅ Helper: Hitung total jarak rute
  const calculateTotalDistance = (start: {lat: number, lng: number}, route: DestWithCoords[]): number => {
    let total = 0;
    let current = start;
    
    for (const dest of route) {
      total += calculateDistance(current.lat, current.lng, dest.lat, dest.lng);
      current = dest;
    }
    
    return total;
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2 drop-shadow-sm">
            Modul Itinerary
          </h1>
          <p className="font-mono text-slate-600 dark:text-slate-400 text-xs tracking-widest uppercase">
            Sistem Perencanaan Perjalanan Otomatis
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8 overflow-x-auto hide-scrollbar pb-2">
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-8 py-3 rounded-full font-mono text-xs font-bold transition-all ${
            activeTab === 'history' || activeTab === 'detail' 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
              : 'bg-white/50 dark:bg-brutal-dark/50 text-slate-600 dark:text-slate-400'
          }`}
        >
          RIWAYAT
        </button>
        <button 
          onClick={() => setActiveTab('generate')}
          className={`px-8 py-3 rounded-full font-mono text-xs font-bold transition-all ${
            activeTab === 'generate' 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
              : 'bg-white/50 dark:bg-brutal-dark/50 text-slate-600 dark:text-slate-400'
          }`}
        >
          GENERATOR
        </button>
      </div>

      {/* TAB: HISTORY */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-20">Loading...</div>
          ) : historyList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {historyList.map(item => (
                <div key={item.id} className="bg-white/60 dark:bg-brutal-dark/60 p-6 rounded-3xl border border-white/60 dark:border-slate-700/50">
                  <h3 className="font-serif text-xl font-bold mb-2">{item.title}</h3>
                  <p className="font-mono text-sm text-slate-500 mb-4">{item.days} Hari</p>
                  <button 
                    onClick={() => handleViewDetail(item.id)}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-mono text-xs font-bold uppercase"
                  >
                    LIHAT DETAIL
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="mb-4">Belum ada itinerary</p>
              <button onClick={() => setActiveTab('generate')} className="text-green-700 font-bold">
                Buat Itinerary →
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB: DETAIL */}
      {activeTab === 'detail' && selectedDetail && editableDays && (
        <div>
          <button 
            onClick={() => setActiveTab('history')} 
            className="mb-6 font-mono text-xs font-bold"
          >
            ← KEMBALI
          </button>

          <div className="bg-white/60 dark:bg-brutal-dark/60 rounded-[2.5rem] p-8 md:p-12 border border-white/60 dark:border-slate-700/50">
            
            {/* Header dengan Edit Judul */}
            <div className="mb-8">
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-6 mb-6">
                 <div className="flex-1">
                    {isEditingTitle ? (
                        <div className="flex items-center gap-3 animate-in slide-in-from-left duration-200">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleUpdateTitle();
                                        if (e.key === 'Escape') setIsEditingTitle(false);
                                    }}
                                    className="w-full bg-white dark:bg-slate-800 border-2 border-green-500 dark:border-yellow-400 rounded-xl px-4 py-2.5 font-serif text-2xl font-bold text-slate-900 dark:text-white focus:outline-none shadow-lg"
                                    autoFocus
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button
                                        onClick={handleUpdateTitle}
                                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                                        title="Simpan (Enter)"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setIsEditingTitle(false)}
                                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
                                        title="Batal (Esc)"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="font-serif text-4xl font-bold uppercase text-slate-900 dark:text-white">{selectedDetail.title}</h2>
                            <button
                                onClick={() => {
                                    setNewTitle(selectedDetail.title);
                                    setIsEditingTitle(true);
                                }}
                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl font-mono text-[10px] font-bold uppercase hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all hover:scale-105 active:scale-95 shadow-sm"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                UBAH NAMA
                            </button>
                        </>
                    )}
                 </div>

                 <div className="grid grid-cols-3 gap-6 font-mono text-sm text-right hidden md:block">
                    <div><p className="text-slate-500 text-xs">DURASI</p><p className="font-bold text-xl">{selectedDetail.days} HARI</p></div>
                    <div><p className="text-slate-500 text-xs">ANGGARAN</p><p className="font-bold text-xl uppercase">{selectedDetail.budget_type}</p></div>
                    <div><p className="text-slate-500 text-xs">ESTIMASI BIAYA</p><p className="font-bold text-xl text-green-700">{selectedDetail.estimated_budget}</p></div>
                 </div>
              </div>
              
               <div className="grid grid-cols-3 gap-4 font-mono text-sm text-slate-600 dark:text-slate-400 mb-8 md:hidden">
                 <div><span className="block text-xs uppercase">Hari</span>{selectedDetail.days}</div>
                 <div><span className="block text-xs uppercase">Anggaran</span>{selectedDetail.budget_type}</div>
                 <div><span className="block text-xs uppercase">Biaya</span>{selectedDetail.estimated_budget}</div>
               </div>

            </div>

            {/* Tombol Navigasi Massal dengan Optimasi */}
            <div className="mb-8 flex flex-wrap gap-3">
              <button
                onClick={handleNavigateAllOptimized}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-yellow-400 dark:to-yellow-500 text-white dark:text-slate-900 font-mono text-xs font-bold px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 dark:hover:from-yellow-500 dark:hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl active:scale-95 uppercase tracking-wide"
                title="Navigasi semua destinasi dengan rute terdekat dari posisimu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 3V4m0 0L9 7" />
                </svg>
                🗺️ Navigasi Semua (Optimized)
              </button>
              
              {userLocation && (
                <div className="inline-flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-mono text-[10px] font-bold text-green-700 dark:text-green-400 uppercase">
                    GPS Aktif
                  </span>
                </div>
              )}
            </div>

            {/* Jadwal */}
            <div>
              <h3 className="font-mono text-sm font-bold uppercase mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-green-700 dark:bg-yellow-400 rounded-full"></span>
                JADWAL_OPERASIONAL
              </h3>
              
              {editableDays.map((dayPlan, dayIndex) => (
                <div key={dayIndex} className="mb-10 pl-8 md:pl-12 border-l-2 border-dashed border-slate-200 dark:border-slate-700 relative">
                  <div className="absolute -left-[42px] md:-left-[46px] top-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full font-mono text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                    H{dayPlan.day}
                  </div>

                  <div className="space-y-4">
                    {dayPlan.slots?.map((slot, slotIndex) => (
                      <div key={slotIndex} className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase shadow-sm">
                                  {slot.time_slot}
                                </span>
                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase">
                                  #{slotIndex + 1}
                                </span>
                            </div>
                            <p className="font-mono text-base md:text-lg font-bold leading-snug text-slate-900 dark:text-white">
                                {slot.title}
                            </p>
                            {slot.notes && <p className="text-xs text-slate-500 mt-2 italic">"{slot.notes}"</p>}
                          </div>

                          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                             <div className="flex flex-col border-r border-slate-200 dark:border-slate-700 pr-2 mr-2">
                               <button 
                                 onClick={() => moveSlot(dayIndex, slotIndex, 'up')}
                                 disabled={slotIndex === 0}
                                 className="text-slate-500 hover:text-blue-600 disabled:opacity-30 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded p-1.5 mb-1 transition-all"
                                 title="Naik Atas (Auto-save)"
                               >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                 </svg>
                               </button>
                               <button 
                                 onClick={() => moveSlot(dayIndex, slotIndex, 'down')}
                                 disabled={slotIndex === dayPlan.slots.length - 1}
                                 className="text-slate-500 hover:text-blue-600 disabled:opacity-30 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded p-1.5 transition-all"
                                 title="Turun Bawah (Auto-save)"
                               >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                 </svg>
                               </button>
                             </div>

                             <button
                                onClick={() => handleRemoveDestination(dayIndex, slotIndex)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg p-2 transition-all"
                                title="Hapus Destinasi"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                             </button>
                             
                             <button
                                onClick={() => handleNavigateSlot(slot, dayIndex)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg p-2 transition-all"
                                title="Navigasi ke Lokasi"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* TAB: GENERATOR */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/60 dark:bg-brutal-dark/60 p-8 rounded-[2rem] border border-white/60 dark:border-slate-700/50">
            <h2 className="font-mono font-bold text-sm mb-6 uppercase">PARAMETER</h2>
            
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block font-mono text-[10px] font-bold mb-2 uppercase">JUMLAH HARI</label>
                <input 
                  type="number" 
                  min="1" 
                  max="7"
                  value={formDays}
                  onChange={(e) => setFormDays(Number(e.target.value))}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] font-bold mb-2 uppercase">PROFIL ANGGARAN</label>
                <select 
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <option value="hemat">HEMAT</option>
                  <option value="normal">NORMAL</option>
                  <option value="mewah">MEWAH</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] font-bold mb-3 uppercase">MINAT</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleInterest(cat.slug)}
                      className={`px-4 py-2 rounded-full font-mono text-[10px] font-bold uppercase ${
                        selectedInterests.includes(cat.slug)
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isGenerating}
                className="w-full bg-slate-900 dark:bg-yellow-400 text-white dark:text-slate-900 py-4 rounded-xl font-mono text-xs font-bold uppercase"
              >
                {isGenerating ? 'MEMPROSES...' : 'GENERATE'}
              </button>
            </form>
          </div>

          <div>
            {generatedResult && (
              <div className="bg-white/60 dark:bg-brutal-dark/60 p-8 rounded-[2rem] border border-white/60 dark:border-slate-700/50">
                <h3 className="font-serif text-2xl font-bold mb-4">Hasil Generate</h3>
                <p><b>Hari:</b> {generatedResult.summary.total_days}</p>
                <p><b>Destinasi:</b> {generatedResult.summary.total_destinations}</p>
                <p><b>Biaya:</b> {generatedResult.summary.estimated_total_budget}</p>
                
                <div className="mt-6">
                  <label className="block font-mono text-xs mb-2">Judul:</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full p-3 rounded-lg border mb-4"
                  />
                  <button
                    onClick={handleSaveItinerary}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold uppercase"
                  >
                    SIMPAN
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}