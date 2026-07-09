// app/dashboard/itinerary/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { fetchAPI } from '../../lib/api';
import { fetchItineraryWeather } from '../../lib/weather'; 

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ItineraryHistory {
  id: number;
  title: string;
  start_date?: string;
  end_date?: string;
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
  start_date?: string;
  end_date?: string;
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

interface ManualDestination {
  id: number;
  title: string;
  content_id: number;
  category: string;
  assigned_day?: number;
  assigned_time?: string;
}

export default function ItineraryPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'detail'>('list');
  
  const [historyList, setHistoryList] = useState<ItineraryHistory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formTitle, setFormTitle] = useState('Rencana Eksplorasi Baru');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('20:00');
  
  const [formBudget, setFormBudget] = useState('hemat');
  const [generateMode, setGenerateMode] = useState<'ai' | 'manual'>('ai');
  const [useWishlist, setUseWishlist] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const [generatedResult, setGeneratedResult] = useState<ItineraryGenerateResponse | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ItineraryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [manualDestinations, setManualDestinations] = useState<ManualDestination[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showScheduler, setShowScheduler] = useState(false);
  
  const [editableDays, setEditableDays] = useState<ItineraryDay[] | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [weatherForecast, setWeatherForecast] = useState<{[key: string]: any} | any[]>({});
  
  const [showEditSlotModal, setShowEditSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{dayIndex: number, slotIndex: number} | null>(null);
  const [wishlistForEdit, setWishlistForEdit] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab !== 'list' && activeTab !== 'detail') return;
    const loadHistory = async () => {
      setLoading(true);
      try {
        const res = await fetchAPI<ItineraryHistory[]>('/itinerary/history', { requireAuth: true });
        if (res && Array.isArray(res)) setHistoryList(res);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    loadHistory();
  }, [activeTab]);

  useEffect(() => {
    fetchAPI<Category[]>('/categories').then(res => {
      if (res && Array.isArray(res)) {
        setCategories(res);
        if (res.length > 0) setSelectedInterests([res[0].slug]);
      }
    });
  }, []);

  useEffect(() => {
    if (generateMode === 'manual') {
      loadWishlist();
    }
  }, [generateMode]);

  const toggleInterest = (slug: string) => {
    setSelectedInterests(prev => 
      prev.includes(slug) ? prev.filter(i => i !== slug) : [...prev, slug]
    );
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  const loadWishlist = async () => {
    try {
      const res = await fetchAPI('/wishlist', { requireAuth: true });
      if (res) setWishlistItems(res);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    }
  };

  const searchDestinations = async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    try {
      const res = await fetchAPI(`/contents?search=${query}&limit=10`);
      if (res && res.data) setSearchResults(res.data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const addDestinationToManual = (destination: any) => {
    if (!manualDestinations.find(d => d.id === destination.id)) {
      setManualDestinations([...manualDestinations, {
        id: destination.id,
        title: destination.title,
        content_id: destination.id,
        category: destination.category?.name || 'Umum',
        assigned_day: undefined,
        assigned_time: undefined,
      }]);
    }
    setShowDestinationPicker(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeDestinationFromManual = (id: number) => {
    setManualDestinations(manualDestinations.filter(d => d.id !== id));
  };

  const updateDestinationSchedule = (destId: number, day: number, time: string) => {
    setManualDestinations(manualDestinations.map(d => 
      d.id === destId ? { ...d, assigned_day: day, assigned_time: time } : d
    ));
  };

  const clearDestinationSchedule = (destId: number) => {
    setManualDestinations(manualDestinations.map(d => 
      d.id === destId ? { ...d, assigned_day: undefined, assigned_time: undefined } : d
    ));
  };

  const handleManualGenerate = async () => {
    if (manualDestinations.length === 0) { alert('PILIH MINIMAL 1 DESTINASI DULU!'); return; }
    if (!startDate || !endDate) { alert('PILIH TANGGAL MULAI DAN SELESAI!'); return; }
  
    setIsGenerating(true);
    try {
      const days = calculateDays();
      const daysArray = [];
      
      for (let dayNum = 1; dayNum <= days; dayNum++) {
        const dayDestinations = manualDestinations.filter(d => d.assigned_day === dayNum);
        daysArray.push({
          day: dayNum,
          theme: `Hari ${dayNum}`,
          // PASTIKAN slots ADA (array, bukan undefined)
          slots: dayDestinations.length > 0 ? dayDestinations.map((dest, idx) => ({
            content_id: dest.content_id,
            title: dest.title,
            time_slot: dest.assigned_time || '08:00',
            notes: '',
          })) : [], // Fallback: array kosong kalau nggak ada destinasi
        });
      }
      
      const unassigned = manualDestinations.filter(d => !d.assigned_day);
      if (unassigned.length > 0 && daysArray.length > 0) {
        unassigned.forEach((dest, idx) => {
          daysArray[0].slots.push({
            content_id: dest.content_id,
            title: dest.title,
            time_slot: ['pagi', 'siang', 'sore'][idx % 3],
          });
        });
      }
      
      const budgetRanges = {
        hemat: { min: 150000, max: 300000 },
        normal: { min: 300000, max: 600000 },
        mewah: { min: 600000, max: 1200000 },
      };
      
      const budgetRange = budgetRanges[formBudget as keyof typeof budgetRanges] || budgetRanges.normal;
      const totalDestinations = manualDestinations.length;
      const minBudget = budgetRange.min * days;
      const maxBudget = budgetRange.max * days;
      
      const formatRupiah = (amount: number) => {
        return `Rp ${amount.toLocaleString('id-ID')}`;
      };
      
      setGeneratedResult({
        summary: {
          total_days: days,
          total_destinations: totalDestinations,
          estimated_total_budget: `${formatRupiah(minBudget)} - ${formatRupiah(maxBudget)}`,
          highlights: manualDestinations.map((d) => d.title),
        },
        days: daysArray,
      });
      
      setShowScheduler(false);
    } catch (error) {
      console.error('Manual generate error:', error);
      alert('GAGAL GENERATE ITINERARY MANUAL');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) { alert('MOHON PILIH TANGGAL MULAI DAN SELESAI'); return; }
    if (selectedInterests.length === 0 && generateMode === 'ai') { alert("MOHON PILIH MINIMAL SATU FOKUS MINAT"); return; }

    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const payload: any = {
        start_date: `${startDate} ${startTime}:00`,
        end_date: `${endDate} ${endTime}:00`,
        mode: generateMode,
        budget: formBudget,
        use_wishlist: useWishlist,
      };
      if (generateMode === 'ai') payload.interests = selectedInterests;

      const res = await fetchAPI<ItineraryGenerateResponse>('/itinerary/generate', {
        method: 'POST', requireAuth: true, body: JSON.stringify(payload)
      });
      if (res) setGeneratedResult(res);
    } catch (error) {
      console.error(error);
      alert('GAGAL MENGHASILKAN ITINERARY');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveItinerary = async () => {
    if (!generatedResult || !startDate || !endDate) {
      alert('Mohon lengkapi tanggal mulai dan selesai!');
      return;
    }
    
    const startDateTime = `${startDate} ${startTime || '00:00'}:00`;
    const endDateTime = `${endDate} ${endTime || '23:59'}:00`;
    const daysArray = generatedResult.days || [];
    
    const totalDestinations = generatedResult.summary.total_destinations 
      ? Math.floor(parseInt(String(generatedResult.summary.total_destinations))) 
      : daysArray.reduce((acc: number, day: any) => acc + day.slots.length, 0);

      const payload = {
        title: formTitle || 'Rencana Eksplorasi Baru',
        start_date: startDateTime,
        end_date: endDateTime,
        days: calculateDays(),
        budget_type: formBudget,
        total_destinations: totalDestinations,
        estimated_budget: generatedResult.summary.estimated_total_budget || 'Rp 0',
        itinerary_data: {
          summary: {
            total_days: calculateDays(),
            total_destinations: totalDestinations,
            estimated_total_budget: generatedResult.summary.estimated_total_budget || 'Rp 0',
            highlights: generatedResult.summary.highlights || [],
          },
          // ✅ PASTIKAN days ada & setiap day punya slots
          days: daysArray.map(day => ({
            day: day.day,
            theme: day.theme || `Hari ${day.day}`,
            slots: day.slots || [], // ✅ Pastikan slots ada
          }))
        }
      };

    console.log("SENDING PAYLOAD:", payload);

    try {
      const token = localStorage.getItem('hamemayu_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}/itinerary/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log("RESPONSE:", data);

      if (!response.ok) {
        const errors = data.errors || data.data?.errors || {};
        const hasErrors = Object.keys(errors).length > 0;
        
        if (response.status === 422) {
          if (hasErrors) {
            const errorMessages = Object.values(errors).flat().join('\n');
            console.error("VALIDATION ERRORS:", errors);
            alert(`GAGAL MENYIMPAN ITINERARY\n\n${errorMessages}`);
          } else {
            console.error("VALIDATION FAILED (empty errors):", data);
            alert(`GAGAL MENYIMPAN ITINERARY\n\n${data.message || 'Validasi gagal, cek console untuk detail'}`);
          }
        } else {
          alert(`GAGAL MENYIMPAN ITINERARY\n\n${data.message || 'Unknown error'}`);
        }
        return;
      }

      alert('ITINERARY BERHASIL DISIMPAN!');
      setActiveTab('list');
      setGeneratedResult(null);
      setManualDestinations([]);
      setShowScheduler(false);
      
    } catch (error: any) {
      console.error("SAVE ERROR:", error);
      alert(`GAGAL MENYIMPAN: ${error.message}`);
    }
  };

  const handleViewDetail = async (id: number) => {
    setActiveTab('detail');
    setDetailLoading(true);
    try {
      const res = await fetchAPI<ItineraryDetail>(`/itinerary/history/${id}`, { requireAuth: true });
      
      if (!res) {
        alert("Sesi berakhir atau token tidak valid! Silakan login kembali.");
        setActiveTab('list');
        return;
      }
  
      setSelectedDetail(res);
      
      // ✅ NORMALISASI DATA: Bersihin format AI jadi kayak manual
      const normalizedDays = res.itinerary_data.days.map((day: ItineraryDay) => ({
        ...day,
        slots: day.slots.map(slot => {
          const rawTitle = slot.title || '';
          
          // Kalau format sederhana, langsung return
          if (!rawTitle.includes('\n') && !rawTitle.includes('(')) {
            return slot;
          }
          
          // ✅ Parse format AI yang kompleks
          const lines = rawTitle.split('\n').map(l => l.trim()).filter(l => l);
          let extractedTitle = '';
          let extractedTime = slot.time_slot || '';
          
          for (const line of lines) {
            // Cari waktu (HH:MM - HH:MM)
            const timeMatch = line.match(/\((\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\)/);
            if (timeMatch) {
              extractedTime = timeMatch[1];
              continue;
            }
            // Skip kategori ALL CAPS
            if (line.match(/^[A-Z\s&]+$/) && line.length < 30) continue;
            // Skip baris waktu doang
            if (line.match(/^\d{1,2}:\d{2}$/)) continue;
            // Ambil judul
            if (line.length > 2 && !extractedTitle) {
              extractedTitle = line;
            }
          }
          
          // Fallback
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
      
      setEditableDays(JSON.parse(JSON.stringify(normalizedDays)));
      setNewTitle(res.title);
      
      // Fetch weather
      if (res.start_date && res.end_date) {
        try {
          const daysCount = res.days || calculateDays();
          const weatherData = await fetchItineraryWeather(res.start_date, daysCount);
          setWeatherForecast(weatherData);
        } catch (err) {
          console.warn("Weather fetch failed", err);
          setWeatherForecast([]);
        }
      }
    } catch (error) {
      console.error(error);
      alert('GAGAL MEMUAT DETAIL');
      setActiveTab('list');
    } finally {
      setDetailLoading(false);
    }
  };

// NAVIGASI SEMUA DESTINASI - PAKAI extractItineraryCoords YANG UDAH ADA
const navigateAllToMap = async () => {
  try {
    if (!selectedDetail) {
      alert("Itinerary belum dimuat dengan benar.");
      return;
    }

    console.log("Navigasi semua destinasi...");

    // 1. Import dan pakai fungsi yang udah ada di itinerary-utils
    const { extractItineraryCoords } = await import('../../lib/itinerary-utils');
    
    // 2. Extract koordinat (udah handle semua logic matching)
    const destinations = await extractItineraryCoords(selectedDetail);
    
    console.log("Destinations extracted:", destinations);

    if (destinations.length === 0) {
      alert("Tidak ada destinasi dengan koordinat valid di itinerary ini.");
      return;
    }

    // 3. Buka peta (sama kayak wishlist)
    const routeParam = encodeURIComponent(JSON.stringify(destinations));
    console.log("Opening peta dengan route:", destinations);
    window.location.href = `/dashboard/peta?route=${routeParam}`;
    
  } catch (err) {
    console.error("Nav all failed:", err);
    alert("Gagal memuat data peta.");
  }
};

// NAVIGASI SATU DESTINASI - FINAL FIX DENGAN FALLBACK TITLE MATCHING
const navigateSingleToMap = async (slot: ItinerarySlot) => {
  try {
    console.log("Navigasi slot:", slot);

    // Fetch semua markers dari database
    const markers: any[] = await fetchAPI('/map-markers');
    
    if (!Array.isArray(markers)) {
      alert(`Gagal memuat data peta.`);
      return;
    }

    let matchedMarker = null;

    // PRIORITAS 1: Match by content_id (kalau ada)
    if (slot.content_id) {
      matchedMarker = markers.find(m => m.id === slot.content_id);
      console.log("Match by content_id:", matchedMarker);
    }

    // PRIORITAS 2: Fallback - Match by title (case-insensitive)
    if (!matchedMarker && slot.title) {
      const slotTitle = slot.title.toLowerCase().trim();
      
      matchedMarker = markers.find(marker => {
        const markerTitle = marker.title.toLowerCase().trim();
        
        // Match exact atau contains
        return markerTitle === slotTitle || 
               markerTitle.includes(slotTitle) || 
               slotTitle.includes(markerTitle);
      });
      
      console.log("🔍 Match by title:", matchedMarker);
    }

    if (!matchedMarker) {
      alert(`Destinasi "${slot.title}" tidak ditemukan di database peta.\n\nKemungkinan penyebab:\n1. Destinasi belum ditambahkan ke database\n2. Nama destinasi berbeda dengan yang di database`);
      return;
    }

    // Parse koordinat (handle string atau number)
    const lat = typeof matchedMarker.lat === 'string' ? parseFloat(matchedMarker.lat) : matchedMarker.lat;
    const lng = typeof matchedMarker.lng === 'string' ? parseFloat(matchedMarker.lng) : matchedMarker.lng;

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const destination = {
        lat: lat,
        lng: lng,
        title: matchedMarker.title || slot.title,
        content_id: matchedMarker.id,
      };
      
      console.log("🗺️ Opening peta dengan koordinat:", destination);
      
      // Buka peta internal (format sama kayak wishlist)
      const routeParam = encodeURIComponent(JSON.stringify([destination]));
      window.location.href = `/dashboard/peta?route=${routeParam}`;
    } else {
      alert(`Koordinat "${matchedMarker.title}" belum tersedia di database.`);
    }
  } catch (err: any) {
    console.error("Navigation error:", err);
    alert(`Gagal membuka peta navigasi\n\nError: ${err.message || 'Unknown error'}`);
  }
};


  const handleUpdateDetail = async (updatedData: any) => {
    if (!selectedDetail) return;
    try {
      await fetchAPI(`/itinerary/history/${selectedDetail.id}`, {
        method: 'PUT', requireAuth: true, body: JSON.stringify(updatedData)
      });
      handleViewDetail(selectedDetail.id);
    } catch (error) {
      console.error("Update failed", error);
      alert("Gagal menyimpan perubahan");
    }
  };

  const handleDeleteItinerary = async () => {
    if (!selectedDetail) return;
    if (!confirm(`Yakin ingin menghapus "${selectedDetail.title}" secara permanen?`)) return;
    
    try {
      await fetchAPI(`/itinerary/history/${selectedDetail.id}`, {
        method: 'DELETE', requireAuth: true
      });
      alert('Itinerary berhasil dihapus!');
      setActiveTab('list');
      setSelectedDetail(null);
    } catch (error) {
      console.error("Delete failed", error);
      alert("Gagal menghapus itinerary");
    }
  };

  const handleTitleBlur = () => {
    if (newTitle.trim() && newTitle !== selectedDetail?.title) {
      handleUpdateDetail({ title: newTitle });
    }
    setIsEditingTitle(false);
  };

  const moveSlot = (dayIndex: number, slotIndex: number, direction: 'up' | 'down') => {
    if (!editableDays) return;
    const newDays = [...editableDays];
    const slots = [...newDays[dayIndex].slots];
    const newIndex = direction === 'up' ? slotIndex - 1 : slotIndex + 1;
    if (newIndex < 0 || newIndex >= slots.length) return;
  
    // 1. Tukar posisi destinasi
    [slots[slotIndex], slots[newIndex]] = [slots[newIndex], slots[slotIndex]];
  
    // 2. AUTO-URUTKAN JAM BERDASARKAN URUTAN BARU (08:00, 10:30, 13:00, 15:30, 18:00)
    const baseMinutes = 8 * 60; // Mulai dari 08:00
    const intervalMinutes = 150; // Jeda 2.5 jam per destinasi
    
    const reorderedSlots = slots.map((slot, idx) => {
      const totalMin = baseMinutes + (idx * intervalMinutes);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return {
        ...slot,
        time_slot: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      };
    });
  
    newDays[dayIndex].slots = reorderedSlots;
    setEditableDays(newDays);
  
    // Auto-save
    handleUpdateDetail({ itinerary_data: { ...selectedDetail!.itinerary_data, days: newDays } });
  };

  const deleteSlot = (dayIndex: number, slotIndex: number) => {
    if (!editableDays) return;
    if (!confirm("Hapus destinasi ini dari jadwal?")) return;
    
    const newDays = [...editableDays];
    newDays[dayIndex].slots.splice(slotIndex, 1);
    setEditableDays(newDays);
    
    handleUpdateDetail({ itinerary_data: { ...selectedDetail!.itinerary_data, days: newDays } });
  };

  const getWeatherForDay = (dayIndex: number) => {
    return Array.isArray(weatherForecast) ? weatherForecast[dayIndex] || null : null;
  };

  const openEditSlotModal = async (dayIndex: number, slotIndex: number) => {
    setEditingSlot({ dayIndex, slotIndex });
    try {
      const res = await fetchAPI('/wishlist', { requireAuth: true });
      if (res) {
        setWishlistForEdit(res);
        setShowEditSlotModal(true);
      }
    } catch (error) {
      console.error("Failed to load wishlist:", error);
      alert("Gagal memuat wishlist");
    }
  };

  const replaceSlotFromWishlist = async (wishlistItem: any) => {
    if (!editingSlot || !editableDays) return;
    
    const newDays = [...editableDays];
    const { dayIndex, slotIndex } = editingSlot;
    
    newDays[dayIndex].slots[slotIndex] = {
      content_id: wishlistItem.content?.id || wishlistItem.id,
      title: wishlistItem.content?.title || wishlistItem.title,
      time_slot: newDays[dayIndex].slots[slotIndex].time_slot,
      notes: wishlistItem.notes || '',
    };
    
    setEditableDays(newDays);
    setShowEditSlotModal(false);
    setEditingSlot(null);
    
    await handleUpdateDetail({ 
      itinerary_data: { ...selectedDetail!.itinerary_data, days: newDays } 
    });
    
    alert("Destinasi berhasil diganti!");
  };

// ✅ State untuk multi-select sementara di modal
const [tempSelectedIds, setTempSelectedIds] = useState<Set<number>>(new Set());

// ✅ Toggle centang destinasi
const toggleTempSelect = (index: number) => {
  setTempSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    return next;
  });
};

// Tambahkan semua yang dicentang sekaligus (PAKAI INDEX)
const addSelectedDestinations = () => {
  // Dari wishlist (pakai index)
  const fromWishlist = wishlistItems
    .filter((item, index) => tempSelectedIds.has(index))
    .map((item) => {
      const content = item.content || item.plannable || item;
      return {
        id: content.id || item.id,
        title: content.title || item.title,
        content_id: content.id || item.id,
        category: content.category?.name || content.category || item.category || 'Umum',
        assigned_day: undefined,
        assigned_time: undefined,
      };
    });

  // Dari search results (pakai ID dengan prefix)
  const fromSearch = searchResults
    .filter(dest => tempSelectedIds.has(`search-${dest.id}`))
    .map(dest => ({
      id: dest.id,
      title: dest.title,
      content_id: dest.id,
      category: dest.category?.name || 'Umum',
      assigned_day: undefined,
      assigned_time: undefined,
    }));

  const itemsToAdd = [...fromWishlist, ...fromSearch];

  // Filter duplikat
  const existingIds = new Set(manualDestinations.map(d => d.content_id));
  const uniqueNew = itemsToAdd.filter(d => !existingIds.has(d.content_id));

  setManualDestinations(prev => [...prev, ...uniqueNew]);
  setTempSelectedIds(new Set());
  setShowDestinationPicker(false);
};



  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2">
          Modul Itinerary
        </h1>
        <p className="font-mono text-slate-600 dark:text-slate-400 text-xs tracking-widest uppercase">
          Sistem Perencanaan Perjalanan Otomatis
        </p>
      </div>

      <div className="flex gap-3 mb-8 overflow-x-auto hide-scrollbar pb-2">
        <button 
          onClick={() => setActiveTab('create')}
          className={`px-8 py-3 rounded-full font-mono text-xs font-bold transition-all ${
            activeTab === 'create' 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
              : 'bg-white/50 dark:bg-brutal-dark/50 text-slate-600 dark:text-slate-400'
          }`}
        >
          ✨ BUAT ITINERARY
        </button>
        <button 
          onClick={() => setActiveTab('list')}
          className={`px-8 py-3 rounded-full font-mono text-xs font-bold transition-all ${
            activeTab === 'list' || activeTab === 'detail'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
              : 'bg-white/50 dark:bg-brutal-dark/50 text-slate-600 dark:text-slate-400'
          }`}
        >
          📋 DAFTAR ITINERARY
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-2xl p-6 rounded-3xl border border-white/60 dark:border-slate-700/50 h-fit">
            <h2 className="font-mono font-bold text-sm mb-6 uppercase">Parameter Perjalanan</h2>
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block font-mono text-[10px] font-bold mb-2 uppercase">Judul Perjalanan</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50" placeholder="Contoh: Liburan ke Jogja 2026" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] font-bold mb-2 uppercase">Mulai</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50" required />
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-2 mt-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-bold mb-2 uppercase">Selesai</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50" required />
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-2 mt-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm" />
                </div>
              </div>
              {calculateDays() > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="text-sm font-bold text-green-700 dark:text-green-400 text-center">⏱️ Total: {calculateDays()} Hari</p>
                </div>
              )}
              
              <div>
                <label className="block font-mono text-[10px] font-bold mb-3 uppercase">Mode Generate</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setGenerateMode('ai')} className={`flex-1 p-3 rounded-xl border-2 text-xs font-bold transition-all ${generateMode === 'ai' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-slate-200 dark:border-slate-700'}`}>🤖 AI</button>
                  <button type="button" onClick={() => setGenerateMode('manual')} className={`flex-1 p-3 rounded-xl border-2 text-xs font-bold transition-all ${generateMode === 'manual' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700'}`}>📝 Manual</button>
                </div>
              </div>

              {generateMode === 'manual' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-mono text-xs font-bold uppercase text-blue-700 dark:text-blue-400">📋 Destinasi ({manualDestinations.length})</h3>
                      <button type="button" onClick={() => setShowDestinationPicker(true)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">+ Tambah</button>
                    </div>
                    {manualDestinations.length === 0 ? (
                      <p className="text-xs text-blue-600 dark:text-blue-400 italic">Belum ada destinasi dipilih.</p>
                    ) : (
                      <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {manualDestinations.map((dest, idx) => (
                          <li key={`${dest.id}-${idx}`} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg text-xs">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">{dest.title}</p>
                                <p className="text-[10px] text-slate-500">{dest.category}</p>
                                {dest.assigned_day && (
                                  <p className="text-[10px] text-green-600 dark:text-green-400 mt-1">
                                    Hari {dest.assigned_day} - {dest.assigned_time || 'Belum diatur'}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button type="button" onClick={() => setShowScheduler(true)} className="text-blue-500 hover:text-blue-700 p-1" title="Atur Jadwal">📅</button>
                              <button type="button" onClick={() => removeDestinationFromManual(dest.id)} className="text-red-500 hover:text-red-700 p-1">✕</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button type="button" onClick={() => setShowScheduler(true)} disabled={manualDestinations.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white py-4 rounded-xl font-mono text-xs font-bold uppercase transition-all">
                    📅 ATUR JADWAL MANUAL
                  </button>
                </div>
              )}

              {generateMode === 'ai' && (
                <>
                  <div>
                    <label className="block font-mono text-[10px] font-bold mb-3 uppercase">Minat/Kategori</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button key={cat.id} type="button" onClick={() => toggleInterest(cat.slug)} className={`px-3 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase transition-all ${selectedInterests.includes(cat.slug) ? 'bg-slate-900 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>{cat.name}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input type="checkbox" checked={useWishlist} onChange={(e) => setUseWishlist(e.target.checked)} className="w-4 h-4" />
                    <label className="text-xs font-bold">Prioritaskan Wishlist saya</label>
                  </div>
                  <button type="submit" disabled={isGenerating || !startDate || !endDate} className="w-full bg-slate-900 dark:bg-yellow-400 text-white dark:text-slate-900 py-4 rounded-xl font-mono text-xs font-bold uppercase disabled:opacity-50">
                    {isGenerating ? 'MEMPROSES...' : '✨ GENERATE ITINERARY'}
                  </button>
                </>
              )}
            </form>
          </div>

          <div className="lg:col-span-7">
            {!generatedResult && !isGenerating && (
              <div className="h-full min-h-[400px] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center p-8 text-center">
                <p className="font-mono text-slate-500 text-sm">Pilih parameter & klik Generate untuk mulai</p>
              </div>
            )}
            {isGenerating && (
              <div className="h-full min-h-[400px] rounded-3xl flex flex-col items-center justify-center p-8 bg-white/60 dark:bg-brutal-dark/60">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-mono text-sm font-bold uppercase animate-pulse">Menyusun rute optimal...</p>
              </div>
            )}
            {generatedResult && !isGenerating && (
              <div className="bg-white/60 dark:bg-brutal-dark/60 p-6 rounded-3xl border border-white/60 dark:border-slate-700/50">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="font-serif text-2xl font-bold">Hasil Generate</h3>
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase">SUKSES</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6 font-mono text-sm">
                  <div className="p-3 bg-white/50 dark:bg-slate-800/40 rounded-xl"><p className="text-[10px] text-slate-500 uppercase">Hari</p><p className="font-bold text-lg">{generatedResult.summary.total_days}</p></div>
                  <div className="p-3 bg-white/50 dark:bg-slate-800/40 rounded-xl"><p className="text-[10px] text-slate-500 uppercase">Destinasi</p><p className="font-bold text-lg">{generatedResult.summary.total_destinations}</p></div>
                  <div className="p-3 bg-white/50 dark:bg-slate-800/40 rounded-xl col-span-3"><p className="text-[10px] text-slate-500 uppercase">Estimasi Biaya</p><p className="font-bold text-lg text-green-700 dark:text-green-400">{generatedResult.summary.estimated_total_budget}</p></div>
                </div>
                <div className="mb-6">
                  <h4 className="font-mono text-xs font-bold uppercase mb-3">Highlight Destinasi</h4>
                  <ul className="space-y-2">
                    {generatedResult.summary.highlights?.map((h, i) => (
                      <li key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                        <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center justify-center text-xs font-bold">{i+1}</span>
                        <span className="font-mono text-sm">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <label className="block font-mono text-[10px] font-bold mb-3 uppercase">Nama untuk Disimpan</label>
                  <div className="flex gap-3">
                    <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700" />
                    <button onClick={handleSaveItinerary} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-mono text-xs font-bold rounded-xl uppercase">💾 SIMPAN</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div>
          {loading ? (<div className="text-center py-20">Loading...</div>) : historyList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {historyList.map(item => (
                <div key={item.id} className="bg-white/60 dark:bg-brutal-dark/60 p-6 rounded-3xl border border-white/60 dark:border-slate-700/50">
                  <h3 className="font-serif text-xl font-bold mb-2">{item.title}</h3>
                  {item.start_date && item.end_date ? (<p className="font-mono text-xs text-slate-500 mb-2">📅 {new Date(item.start_date).toLocaleDateString('id-ID')} - {new Date(item.end_date).toLocaleDateString('id-ID')}</p>) : (<p className="font-mono text-xs text-slate-500 mb-2">{item.days} Hari</p>)}
                  <button onClick={() => handleViewDetail(item.id)} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-mono text-xs font-bold uppercase mt-4">LIHAT DETAIL</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20"><p className="mb-4">Belum ada itinerary</p><button onClick={() => setActiveTab('create')} className="text-green-700 font-bold">Buat Itinerary →</button></div>
          )}
        </div>
      )}

{/* DETAIL TAB - LAYOUT DIPERBAIKI */}
{activeTab === 'detail' && selectedDetail && editableDays && (
  <div>
    {/* Header dengan Tombol di Atas */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <button 
        onClick={() => setActiveTab('list')} 
        className="font-mono text-xs font-bold flex items-center gap-2 hover:text-green-700 transition-colors w-fit"
      >
        ← KEMBALI KE DAFTAR
      </button>
      
      <div className="flex gap-3">
        <button
          onClick={navigateAllToMap}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 3V4m0 0L9 7" />
          </svg>
          LIHAT DI PETA
        </button>
        
        <button 
          onClick={handleDeleteItinerary}
          className="px-6 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl font-mono text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          HAPUS ITINERARY
        </button>
      </div>
    </div>

    <div className="bg-white/60 dark:bg-brutal-dark/60 rounded-3xl p-8 border border-white/60 dark:border-slate-700/50 shadow-sm">
      
      {/* Header: Title & Date */}
      <div className="mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            {isEditingTitle ? (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                autoFocus
                className="text-3xl md:text-4xl font-serif font-bold bg-transparent border-b-2 border-green-500 focus:outline-none w-full pb-2"
              />
            ) : (
              <h2 
                onClick={() => setIsEditingTitle(true)}
                className="text-3xl md:text-4xl font-serif font-bold uppercase cursor-pointer hover:text-green-700 transition-colors flex items-center gap-3 group"
              >
                {selectedDetail.title}
                <span className="opacity-0 group-hover:opacity-100 text-sm font-mono font-normal text-slate-500">✏️ Edit</span>
              </h2>
            )}
          </div>
          
          <div className="text-right">
             <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">{selectedDetail.budget_type}</p>
             <p className="text-2xl font-bold text-green-700 dark:text-green-400">{selectedDetail.estimated_budget}</p>
          </div>
        </div>

        {selectedDetail.start_date && selectedDetail.end_date && (
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <span className="text-xl">📅</span>
            <div>
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">Periode Perjalanan</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {new Date(selectedDetail.start_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' - '}
                {new Date(selectedDetail.end_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Itinerary Days Loop */}
      <div className="space-y-8">
        {editableDays.map((dayPlan, dayIndex) => {
          const currentDate = selectedDetail?.start_date 
            ? new Date(selectedDetail.start_date)
            : null;
          
          const dayDate = currentDate 
            ? new Date(currentDate.getTime() + (dayIndex * 24 * 60 * 60 * 1000))
            : null;

          const weather = getWeatherForDay(dayIndex);
          
          return (
            <div key={dayPlan.day} className="relative pl-8 md:pl-12 border-l-2 border-dashed border-slate-300 dark:border-slate-700 last:border-0 pb-8 last:pb-0">
              
              {/* Day Marker */}
              <div className="absolute -left-[14px] top-0 w-7 h-7 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-full flex items-center justify-center font-bold text-xs text-slate-500 z-10">
                {dayPlan.day}
              </div>

              {/* Day Header dengan Tanggal & Weather */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                    Hari {dayPlan.day}
                  </h3>
                  {dayDate && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {dayDate.toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
                
                {weather ? (
                  <div className="flex items-center gap-3 mt-2 sm:mt-0 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt={weather.description} className="w-8 h-8" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{weather.temp}°C</p>
                      <p className="text-[10px] text-slate-500 capitalize">{weather.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Cuaca belum bisa diprediksi</span>
                  </div>
                )}
              </div>

{/* Slots List - FIX: EKSTRAK WAKTU DARI time_slot */}
<div className="space-y-3">
  {dayPlan.slots.map((slot, slotIndex) => {
    // ✅ Ekstrak waktu dari time_slot yang formatnya "KATEGORI (HH:MM - HH:MM)"
    const extractTime = (timeSlot: string) => {
      if (!timeSlot) return '00:00';
      
      // Cari pola (HH:MM - HH:MM)
      const timeMatch = timeSlot.match(/\((\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\)/);
      if (timeMatch) {
        return timeMatch[1]; // Return waktu mulai
      }
      
      // Kalau nggak ada pola waktu, coba ambil angka pertama yang mirip waktu
      const simpleTime = timeSlot.match(/(\d{1,2}:\d{2})/);
      if (simpleTime) {
        return simpleTime[1];
      }
      
      return timeSlot; // Fallback
    };
    
    const displayTime = extractTime(slot.time_slot || '');
    const displayTitle = slot.title || 'No Title';
    
    return (
      <div key={slotIndex} className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
        
        <div className="flex items-center gap-4 flex-1">
          {/* Time Badge */}
          <div className="flex-shrink-0 w-16 text-center">
            <span className="block text-lg font-bold text-slate-900 dark:text-white font-mono">
              {displayTime}
            </span>
          </div>
          
          {/* Destination Info */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 dark:text-white truncate">
              {displayTitle}
            </p>
            {slot.notes && <p className="text-xs text-slate-500 italic truncate">{slot.notes}</p>}
          </div>
        </div>

        {/* Actions Buttons */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
          <button 
            onClick={() => navigateSingleToMap(slot)}
            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all"
            title="Lihat di Peta"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          <button 
            onClick={() => openEditSlotModal(dayIndex, slotIndex)}
            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg"
            title="Ganti dari Wishlist"
          >
            ✏️
          </button>
          
          <button 
            onClick={() => moveSlot(dayIndex, slotIndex, 'up')}
            disabled={slotIndex === 0}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            title="Pindah Atas"
          >
            ↑
          </button>
          <button 
            onClick={() => moveSlot(dayIndex, slotIndex, 'down')}
            disabled={slotIndex === dayPlan.slots.length - 1}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            title="Pindah Bawah"
          >
            ↓
          </button>
          <button 
            onClick={() => deleteSlot(dayIndex, slotIndex)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
            title="Hapus Destinasi"
          >
            🗑️
          </button>
        </div>
      </div>
    );
  })}
  
  {dayPlan.slots.length === 0 && (
    <p className="text-center text-sm text-slate-400 italic py-4">Belum ada destinasi untuk hari ini.</p>
  )}
</div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}

      {/* Destination Picker Modal */}
{/* Destination Picker Modal */}
{showDestinationPicker && (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDestinationPicker(false)}>
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Pilih Destinasi</h3>
        <button onClick={() => setShowDestinationPicker(false)} className="text-slate-500 hover:text-slate-700">✕</button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {/* Wishlist Section */}
        <div>
          <h4 className="font-bold text-sm mb-3 text-blue-600 dark:text-blue-400">❤️ Wishlist Saya</h4>
          <div className="space-y-2">
            {wishlistItems.map((item: any, index: number) => {
              const isSelected = tempSelectedIds.has(index);
              const title = item.content?.title || item.plannable?.title || item.title || 'Destinasi';
              const category = item.content?.category?.name || item.plannable?.category || item.category || 'Umum';
              
              return (
                <div 
                  key={`${item.id || index}-${index}`}
                  onClick={() => toggleTempSelect(index)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                      : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 accent-blue-600" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{title}</p>
                    <p className="text-xs text-slate-500">{category}</p>
                  </div>
                </div>
              );
            })}
            {wishlistItems.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Wishlist kosong</p>}
          </div>
        </div>

        {/* Search Section */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <h4 className="font-bold text-sm mb-3">Cari dari Database</h4>
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => { setSearchQuery(e.target.value); searchDestinations(e.target.value); }} 
            placeholder="Cari destinasi..." 
            className="w-full p-3 border rounded-xl mb-3 bg-white dark:bg-slate-800" 
          />
          <div className="space-y-2">
            {searchResults.map((dest: any) => {
              const isSelected = tempSelectedIds.has(`search-${dest.id}`);
              
              return (
                <div 
                  key={`search-${dest.id}`} 
                  onClick={() => toggleTempSelect(`search-${dest.id}`)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                      : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 accent-blue-600" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{dest.title}</p>
                    <p className="text-xs text-slate-500">{dest.category?.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <p className="text-sm text-slate-500">
          {tempSelectedIds.size > 0 ? `${tempSelectedIds.size} destinasi dipilih` : 'Centang destinasi untuk menambahkan'}
        </p>
        <button 
          onClick={addSelectedDestinations} 
          disabled={tempSelectedIds.size === 0}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-mono text-xs font-bold rounded-xl uppercase transition-all"
        >
          + TAMBAHKAN
        </button>
      </div>
    </div>
  </div>
)}

{showScheduler && (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowScheduler(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold">📅 Atur Jadwal Manual</h3>
                <p className="text-sm text-slate-500 mt-1">Tempatkan destinasi ke hari dan jam yang diinginkan</p>
              </div>
              <button onClick={() => setShowScheduler(false)} className="text-slate-500 hover:text-slate-700 text-2xl">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-sm mb-3 text-blue-600 dark:text-blue-400">📋 Destinasi Tersedia</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {manualDestinations.map((dest, idx) => (
                    <div key={`${dest.id}-${idx}`} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                        <div className="flex-1">
                          <p className="font-bold text-sm">{dest.title}</p>
                          <p className="text-xs text-slate-500">{dest.category}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <select
                          value={dest.assigned_day || ''}
                          onChange={(e) => updateDestinationSchedule(dest.id, parseInt(e.target.value) || 0, dest.assigned_time || '08:00')}
                          className="p-2 text-xs border rounded-lg bg-white dark:bg-slate-700"
                        >
                          <option value="">Pilih Hari</option>
                          {Array.from({ length: calculateDays() }, (_, i) => (
                            <option key={i + 1} value={i + 1}>Hari {i + 1}</option>
                          ))}
                        </select>
                        
                        <input
                          type="time"
                          value={dest.assigned_time || '08:00'}
                          onChange={(e) => updateDestinationSchedule(dest.id, dest.assigned_day || 1, e.target.value)}
                          className="p-2 text-xs border rounded-lg bg-white dark:bg-slate-700"
                        />
                      </div>
                      
                      {dest.assigned_day && dest.assigned_time && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                            Hari {dest.assigned_day} - {dest.assigned_time}
                          </span>
                          <button onClick={() => clearDestinationSchedule(dest.id)} className="text-xs text-red-500 hover:text-red-700">Clear</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-3 text-green-600 dark:text-green-400">📅 Preview Jadwal</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Array.from({ length: calculateDays() }, (_, i) => {
                    const dayNum = i + 1;
                    const dayDestinations = manualDestinations
                      .filter(d => d.assigned_day === dayNum)
                      .sort((a, b) => (a.assigned_time || '').localeCompare(b.assigned_time || ''));
                    
                    return (
                      <div key={dayNum} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <h5 className="font-bold text-sm mb-2 text-green-700 dark:text-green-400">Hari {dayNum}</h5>
                        {dayDestinations.length === 0 ? (
                          <p className="text-xs text-green-600 dark:text-green-400 italic">Belum ada destinasi</p>
                        ) : (
                          <ul className="space-y-1">
                            {dayDestinations.map((dest, idx) => (
                              <li key={`${dest.id}-${idx}`} className="text-xs flex items-center gap-2">
                                <span className="text-green-600 dark:text-green-400 font-bold font-mono">{dest.assigned_time}:</span>
                                <span className="text-slate-700 dark:text-slate-300">{dest.title}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowScheduler(false)} className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold rounded-xl uppercase">Tutup</button>
              <button onClick={handleManualGenerate} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold rounded-xl uppercase">Generate Itinerary</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Slot dari Wishlist - DENGAN TOMBOL NAVIGASI */}
      {showEditSlotModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditSlotModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Pilih Destinasi dari Wishlist</h3>
              <button onClick={() => setShowEditSlotModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {wishlistForEdit.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  {/* Area kiri untuk klik ganti slot */}
                  <div className="flex-1 cursor-pointer" onClick={() => replaceSlotFromWishlist(item)}>
                    <p className="font-bold text-sm">{item.content?.title || item.title}</p>
                    <p className="text-xs text-slate-500">{item.content?.category?.name || item.category}</p>
                  </div>
                  
                  {/* Tombol-tombol di kanan */}
                  <div className="flex gap-2">
                    {/* ✅ TOMBOL NAVIGASI - DENGAN LOGIC MATCHING YANG DIPERBAIKI */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation(); // Jangan trigger replaceSlotFromWishlist
                        
                        // Navigasi ke destinasi ini
                        const title = item.content?.title || item.title;
                        
                        try {
                          // Fetch markers
                          const markers: any[] = await fetchAPI('/map-markers');
                          
                          if (!Array.isArray(markers)) {
                            alert("Gagal memuat data peta.");
                            return;
                          }

                          let matchedMarker = null;

                          // PRIORITAS 1: Match by content.id
                          if (item.content?.id) {
                            matchedMarker = markers.find(m => m.id === item.content.id);
                          }

                          // PRIORITAS 2: Fallback - Match by title
                          if (!matchedMarker && title) {
                            const searchTitle = title.toLowerCase().trim();
                            matchedMarker = markers.find(marker => {
                              const markerTitle = marker.title.toLowerCase().trim();
                              return markerTitle === searchTitle || 
                                    markerTitle.includes(searchTitle) || 
                                    searchTitle.includes(markerTitle);
                            });
                          }

                          if (!matchedMarker) {
                            alert(`Destinasi "${title}" tidak ditemukan di database peta.`);
                            return;
                          }

                          // Parse koordinat
                          const lat = typeof matchedMarker.lat === 'string' ? parseFloat(matchedMarker.lat) : matchedMarker.lat;
                          const lng = typeof matchedMarker.lng === 'string' ? parseFloat(matchedMarker.lng) : matchedMarker.lng;

                          if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                            const destination = {
                              lat: lat,
                              lng: lng,
                              title: matchedMarker.title || title,
                              content_id: matchedMarker.id,
                            };
                            
                            const routeParam = encodeURIComponent(JSON.stringify([destination]));
                            window.location.href = `/dashboard/peta?route=${routeParam}`;
                          } else {
                            alert(`Koordinat "${title}" belum tersedia di database.`);
                          }
                        } catch (err: any) {
                          console.error("Navigation error:", err);
                          alert(`Gagal membuka peta: ${err.message || 'Unknown error'}`);
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                      title="Lihat di Peta"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Peta
                    </button>
                    
                    {/* Tombol Ganti */}
                    <button 
                      onClick={() => replaceSlotFromWishlist(item)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg"
                    >
                      Ganti
                    </button>
                  </div>
                </div>
              ))}
              {wishlistForEdit.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">
                  Wishlist kosong. Tambahkan destinasi ke wishlist dulu!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}