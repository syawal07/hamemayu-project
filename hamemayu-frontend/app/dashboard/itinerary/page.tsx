"use client";

import { useEffect, useState, FormEvent } from 'react';
import { fetchAPI } from '../../lib/api';
import { fetchItineraryWeather } from '../../lib/weather';

import ItineraryCreate from './components/ItineraryCreate';
import ItineraryList from './components/ItineraryList';
import ItineraryDetail from './components/ItineraryDetail';
import DestinationPickerModal from './components/ui/DestinationPickerModal';
import ManualSchedulerModal from './components/ui/ManualSchedulerModal';
import SlotManagerModal from './components/ui/SlotManagerModal';
import RetroButton from './components/ui/RetroButton';

const normalizeApiDate = (dateStr?: string) => {
  if (!dateStr) return dateStr;
  return dateStr.replace(/Z$/, '').replace(' ', 'T');
};

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
  total_destinations?: number;
  itinerary_data?: {
    days?: ItineraryDay[];
  };
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

interface ItineraryDetailData {
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

interface DestinationItem {
  id: number;
  title: string;
  category?: { name: string } | string;
  type?: string;
  content_id?: number;
  excerpt?: string;
}

interface WishlistItem {
  id: number;
  title?: string;
  content?: DestinationItem;
  plannable?: DestinationItem;
  category?: string | { name: string };
  notes?: string;
}

interface WeatherInfo {
  icon: string;
  temp: number;
  description: string;
}

interface MapMarker {
  id: number;
  title: string;
  lat: string | number;
  lng: string | number;
}

interface GeneratePayload {
  start_date: string;
  end_date: string;
  mode: 'ai' | 'manual';
  budget: string;
  use_wishlist: boolean;
  interests?: string[];
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
  const [formBudget] = useState('hemat');
  const [generateMode, setGenerateMode] = useState<'ai' | 'manual'>('ai');
  const [useWishlist, setUseWishlist] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const [generatedResult, setGeneratedResult] = useState<ItineraryGenerateResponse | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ItineraryDetailData | null>(null);
  const [manualDestinations, setManualDestinations] = useState<ManualDestination[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DestinationItem[]>([]);
  const [showScheduler, setShowScheduler] = useState(false);
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

  const [selectedDatabaseItems, setSelectedDatabaseItems] = useState<Map<string, DestinationItem>>(new Map());
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (activeTab !== 'list' && activeTab !== 'detail') return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const res = await fetchAPI<ItineraryHistory[]>('/itinerary/history', { requireAuth: true });
        if (res && Array.isArray(res)) {
          const detailedHistory = await Promise.all(
            res.map(async (item) => {
              item.start_date = normalizeApiDate(item.start_date);
              item.end_date = normalizeApiDate(item.end_date);
              
              try {
                const detail = await fetchAPI<ItineraryDetailData>(`/itinerary/history/${item.id}`, { requireAuth: true });
                if (detail) {
                  return {
                    ...item,
                    start_date: normalizeApiDate(detail.start_date),
                    end_date: normalizeApiDate(detail.end_date),
                    total_destinations: detail.total_destinations,
                    itinerary_data: detail.itinerary_data,
                  };
                }
                return item;
              } catch {
                return item;
              }
            })
          );
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          detailedHistory.sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date) : new Date(a.created_at || 0);
            const dateB = b.start_date ? new Date(b.start_date) : new Date(b.created_at || 0);
            const diffTimeA = Math.abs(dateA.getTime() - today.getTime());
            const diffTimeB = Math.abs(dateB.getTime() - today.getTime());
            return Math.ceil(diffTimeA / (1000 * 60 * 60 * 24)) - Math.ceil(diffTimeB / (1000 * 60 * 60 * 24));
          });

          setHistoryList(detailedHistory);
        }
      } catch {
       } finally { 
        setLoading(false); 
      }
    };
    loadHistory();
  }, [activeTab]);

  useEffect(() => {
    fetchAPI<Category[]>('/categories').then(res => {
      if (res && Array.isArray(res)) {
        setCategories(res);
        if (res.length > 0) setSelectedInterests([res[0].slug]);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchWishlist = async () => {
      try {
        const res = await fetchAPI<WishlistItem[]>('/wishlist', { requireAuth: true });
        if (isMounted && res && Array.isArray(res)) {
          setWishlistItems(res);
        }
      } catch {}
    };

    if (generateMode === 'manual') {
      void fetchWishlist();
    }
    
    return () => {
      isMounted = false;
    };
  }, [generateMode]);

  const toggleInterest = (slug: string) => {
    setSelectedInterests(prev => prev.includes(slug) ? prev.filter(i => i !== slug) : [...prev, slug]);
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const searchDestinations = async (query: string) => {
    if (!query.trim()) { 
      setSearchResults([]); 
      return; 
    }
    try {
      const contentsRes = await fetchAPI<{data: DestinationItem[]} | DestinationItem[]>(`/contents?search=${query}&limit=20`, { requireAuth: true });
      const contents = (Array.isArray(contentsRes) ? contentsRes : contentsRes?.data) || [];

      const eventsRes = await fetchAPI<{data: DestinationItem[]} | DestinationItem[]>(`/events?search=${query}&limit=20`, { requireAuth: true });
      const events = (Array.isArray(eventsRes) ? eventsRes : eventsRes?.data) || [];
      
      const allResults: DestinationItem[] = [
        ...contents.map((item) => ({ ...item, type: 'destination', category: item.category || { name: 'Destinasi' } })),
        ...events.map((item) => ({ ...item, type: 'event', category: item.category || { name: 'Event' } })),
      ];

      setSearchResults(allResults);
    } catch {}
  };

  const removeDestinationFromManual = (id: number) => {
    setManualDestinations(manualDestinations.filter(d => d.id !== id));
  };

  const updateDestinationSchedule = (destId: number, day: number, time: string) => {
    setManualDestinations(manualDestinations.map(d => d.id === destId ? { ...d, assigned_day: day, assigned_time: time } : d));
  };

  const handleManualGenerate = async () => {
    if (manualDestinations.length === 0) { alert('PILIH MINIMAL 1 DESTINASI DULU!'); return; }
    if (!startDate || !endDate) { alert('PILIH TANGGAL MULAI DAN SELESAI!'); return; }

    setIsGenerating(true);
    try {
      const days = calculateDays();
      const daysArray: ItineraryDay[] = [];

      for (let dayNum = 1; dayNum <= days; dayNum++) {
        const dayDestinations = manualDestinations.filter(d => d.assigned_day === dayNum);
        daysArray.push({
          day: dayNum,
          theme: `Hari ${dayNum}`,
          slots: dayDestinations.length > 0 ? dayDestinations.map((dest) => ({
            content_id: dest.content_id,
            title: dest.title,
            time_slot: dest.assigned_time || '08:00',
            notes: '',
          })) : [],
        });
      }

      const unassigned = manualDestinations.filter(d => !d.assigned_day);
      if (unassigned.length > 0 && daysArray.length > 0) {
        unassigned.forEach((dest, idx) => {
          daysArray[0].slots.push({ content_id: dest.content_id, title: dest.title, time_slot: ['08:00', '12:00', '16:00'][idx % 3] });
        });
      }

      const budgetRanges = { hemat: { min: 150000, max: 300000 }, normal: { min: 300000, max: 600000 }, mewah: { min: 600000, max: 1200000 } };
      const budgetRange = budgetRanges[formBudget as keyof typeof budgetRanges] || budgetRanges.normal;
      const totalDestinations = manualDestinations.length;
      const minBudget = budgetRange.min * days;
      const maxBudget = budgetRange.max * days;
      const formatRupiah = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;
      
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
    } catch {
      alert('GAGAL GENERATE ITINERARY MANUAL');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) { alert('MOHON PILIH TANGGAL MULAI DAN SELESAI'); return; }
    if (selectedInterests.length === 0 && generateMode === 'ai') { alert("MOHON PILIH MINIMAL SATU FOKUS MINAT"); return; }
    
    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const payload: GeneratePayload = { 
        start_date: `${startDate} ${startTime}:00`, 
        end_date: `${endDate} ${endTime}:00`, 
        mode: generateMode, 
        budget: formBudget, 
        use_wishlist: useWishlist 
      };
      
      if (generateMode === 'ai') payload.interests = selectedInterests;
      
      const res = await fetchAPI<ItineraryGenerateResponse>('/itinerary/generate', { method: 'POST', requireAuth: true, body: JSON.stringify(payload) });
      if (res) setGeneratedResult(res);
    } catch {
      alert('GAGAL MENGHASILKAN ITINERARY');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveItinerary = async () => {
    if (!generatedResult || !startDate || !endDate) { alert('Mohon lengkapi tanggal mulai dan selesai!'); return; }

    const startDateTime = `${startDate} ${startTime || '00:00'}:00`;
    const endDateTime = `${endDate} ${endTime || '23:59'}:00`;

    const daysArray: ItineraryDay[] = generatedResult.days || [];
    const totalDestinations = daysArray.reduce((acc: number, day: ItineraryDay) => acc + (day.slots?.length || 0), 0);

    const payload = {
      title: formTitle || 'Rencana Eksplorasi Baru',
      start_date: startDateTime,
      end_date: endDateTime,
      days: calculateDays(),
      budget_type: formBudget,
      total_destinations: totalDestinations,
      estimated_budget: generatedResult.summary.estimated_total_budget || 'Rp 0',
      itinerary_data: {
        summary: { total_days: calculateDays(), total_destinations: totalDestinations, estimated_total_budget: generatedResult.summary.estimated_total_budget || 'Rp 0', highlights: generatedResult.summary.highlights || [] },
        days: daysArray.map((day: ItineraryDay) => ({
          day: day.day, theme: day.theme || `Hari ${day.day}`, slots: (day.slots || []).map((slot: ItinerarySlot) => ({
            content_id: slot.content_id || null, title: slot.title || '', time_slot: slot.time_slot || '08:00', notes: slot.notes || ''
          }))
        }))
      }
    };

    try {
      const token = localStorage.getItem('hamemayu_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}/itinerary/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) { alert(`GAGAL MENYIMPAN ITINERARY\n\n${data.message || 'Validasi gagal'}`); return; }
      
      alert('ITINERARY BERHASIL DISIMPAN!');
      setActiveTab('list');
      setGeneratedResult(null);
      setManualDestinations([]);
      setShowScheduler(false);
    } catch (error) {
      const err = error as Error;
      alert(`GAGAL MENYIMPAN: ${err.message}`);
    }
  };

  const handleViewDetail = async (id: number) => {
    setActiveTab('detail');
    try {
      const res = await fetchAPI<ItineraryDetailData>(`/itinerary/history/${id}`, { requireAuth: true });
      if (!res) { alert("Sesi berakhir atau token tidak valid! Silakan login kembali."); setActiveTab('list'); return; }
      
      res.start_date = normalizeApiDate(res.start_date);
      res.end_date = normalizeApiDate(res.end_date);
      setSelectedDetail(res);

      const normalizedDays = res.itinerary_data.days.map((day: ItineraryDay) => ({
        ...day,
        slots: day.slots.map(slot => {
          const rawTitle = slot.title || '';
          if (!rawTitle.includes('\n') && !rawTitle.includes('(')) return slot;
          
          const lines = rawTitle.split('\n').map(l => l.trim()).filter(l => l);
          let extractedTitle = '';
          let extractedTime = slot.time_slot || '';

          for (const line of lines) {
            const timeMatch = line.match(/\((\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\)/);
            if (timeMatch) { extractedTime = timeMatch[1]; continue; }
            if (line.match(/^[A-Z\s&]+$/) && line.length < 30) continue;
            if (line.match(/^\d{1,2}:\d{2}$/)) continue;
            if (line.length > 2 && !extractedTitle) extractedTitle = line;
          }
          if (!extractedTitle && lines.length > 0) extractedTitle = lines[lines.length - 1];
          return { ...slot, title: extractedTitle || rawTitle, time_slot: extractedTime };
        })
      }));
      setEditableDays(JSON.parse(JSON.stringify(normalizedDays)));
      setNewTitle(res.title);

      if (res.start_date && res.end_date) {
        try {
          const daysCount = res.days || calculateDays();
          const weatherData = await fetchItineraryWeather(res.start_date, daysCount) as WeatherInfo[];
          setWeatherForecast(weatherData || []);
        } catch { setWeatherForecast([]); }
      }
    } catch {
      alert('GAGAL MEMUAT DETAIL');
      setActiveTab('list');
    }
  };

  const navigateAllToMap = async () => {
    try {
      if (!selectedDetail) { alert("Itinerary belum dimuat dengan benar."); return; }
      const { extractItineraryCoords } = await import('../../lib/itinerary-utils');
      const destinations = await extractItineraryCoords(selectedDetail);
      if (destinations.length === 0) { alert("Tidak ada destinasi dengan koordinat valid di itinerary ini."); return; }
      const routeParam = encodeURIComponent(JSON.stringify(destinations));
      window.location.href = `/dashboard/peta?route=${routeParam}`;
    } catch { alert("Gagal memuat data peta."); }
  };

  const navigateSingleToMap = async (slot: ItinerarySlot) => {
    try {
      const markers = await fetchAPI<MapMarker[]>('/map-markers');
      if (!Array.isArray(markers)) { alert(`Gagal memuat data peta.`); return; }
      
      let matchedMarker = null;
      if (slot.content_id) matchedMarker = markers.find(m => m.id === slot.content_id);
      if (!matchedMarker && slot.title) {
        const slotTitle = slot.title.toLowerCase().trim();
        matchedMarker = markers.find(marker => {
          const markerTitle = marker.title.toLowerCase().trim();
          return markerTitle === slotTitle || markerTitle.includes(slotTitle) || slotTitle.includes(markerTitle);
        });
      }

      if (!matchedMarker) { alert(`Destinasi "${slot.title}" tidak ditemukan di database peta.`); return; }
      
      const lat = typeof matchedMarker.lat === 'string' ? parseFloat(matchedMarker.lat) : matchedMarker.lat;
      const lng = typeof matchedMarker.lng === 'string' ? parseFloat(matchedMarker.lng) : matchedMarker.lng;

      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        const destination = { lat: lat, lng: lng, title: matchedMarker.title || slot.title, content_id: matchedMarker.id };
        const routeParam = encodeURIComponent(JSON.stringify([destination]));
        window.location.href = `/dashboard/peta?route=${routeParam}`;
      } else { alert(`Koordinat "${matchedMarker.title}" belum tersedia di database.`); }
    } catch { alert(`Gagal membuka peta navigasi`); }
  };

  const handleUpdateDetail = async (updatedData: Partial<ItineraryDetailData>) => {
    if (!selectedDetail) return;
    try {
      await fetchAPI(`/itinerary/history/${selectedDetail.id}`, { method: 'PUT', requireAuth: true, body: JSON.stringify(updatedData) });
      handleViewDetail(selectedDetail.id);
    } catch { alert("Gagal menyimpan perubahan"); }
  };

  const handleDeleteItinerary = async (id: number) => {
    const itineraryToDelete = historyList.find(item => item.id === id);
    if (!itineraryToDelete) { alert("Itinerary tidak ditemukan!"); return; }
    if (!confirm(`Yakin ingin menghapus "${itineraryToDelete.title}" secara permanen?`)) return;
    
    try {
      await fetchAPI(`/itinerary/history/${id}`, { method: 'DELETE', requireAuth: true });
      alert('Itinerary berhasil dihapus!');
      setHistoryList(prev => prev.filter(item => item.id !== id));
      if (selectedDetail?.id === id) { setActiveTab('list'); setSelectedDetail(null); }
    } catch { alert("Gagal menghapus itinerary"); }
  };

  const handleTitleBlur = () => {
    if (newTitle.trim() && newTitle !== selectedDetail?.title) handleUpdateDetail({ title: newTitle });
    setIsEditingTitle(false);
  };

  const moveSlot = (dayIndex: number, slotIndex: number, direction: 'up' | 'down') => {
    if (!editableDays) return;
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

  const getWeatherForDay = (dayIndex: number) => Array.isArray(weatherForecast) ? weatherForecast[dayIndex] || null : null;

  const openEditSlotModal = async (dayIndex: number, slotIndex: number) => {
    setEditingSlot({ dayIndex, slotIndex });
    try {
      const res = await fetchAPI<WishlistItem[]>('/wishlist', { requireAuth: true });
      if (res && Array.isArray(res)) { setWishlistForEdit(res); setShowEditSlotModal(true); } 
      else alert("Wishlist kosong atau gagal dimuat!");
    } catch { alert("Gagal memuat wishlist. Silakan coba lagi."); }
  };

  const openAddDestinationModal = async (dayIndex: number) => {
    setEditingSlot({ dayIndex, slotIndex: -1 });
    try {
      const res = await fetchAPI<WishlistItem[]>('/wishlist', { requireAuth: true });
      if (res && Array.isArray(res)) { setWishlistForEdit(res); setShowEditSlotModal(true); } 
      else alert("Wishlist kosong atau gagal dimuat!");
    } catch { alert("Gagal memuat wishlist"); }
  };

  const replaceSlotFromWishlist = async (wishlistItem: WishlistItem) => {
    if (!editingSlot || !editableDays) return;
    const newDays = [...editableDays];
    const { dayIndex, slotIndex } = editingSlot;
    const actualData = wishlistItem.content || wishlistItem.plannable || wishlistItem;
    
    if (slotIndex === -1) { setPendingWishlistItem(wishlistItem); setShowTimeInputModal(true); return; }
    
    const newSlot = {
      content_id: actualData.id, title: actualData.title || wishlistItem.title || 'Destinasi Baru',
      time_slot: newDays[dayIndex].slots[slotIndex].time_slot, notes: wishlistItem.notes || '',
    };
    newDays[dayIndex].slots[slotIndex] = newSlot;
    setEditableDays(newDays);
    setShowEditSlotModal(false);
    setEditingSlot(null);
    await handleUpdateDetail({ itinerary_data: { ...selectedDetail!.itinerary_data, days: newDays } });
    alert(`Slot berhasil diganti dengan "${actualData.title}"!`);
  };

  const handleAddDestinationWithTime = async () => {
    if (!pendingWishlistItem || !editingSlot || !editableDays) return;
    const newDays = [...editableDays];
    const { dayIndex } = editingSlot;
    const actualData = pendingWishlistItem.content || pendingWishlistItem.plannable || pendingWishlistItem;
    
    if (!/^\d{1,2}:\d{2}$/.test(customTime)) { alert("Format jam tidak valid! Gunakan HH:MM"); return; }
    
    const newSlot = {
      content_id: actualData.id, title: actualData.title || pendingWishlistItem.title || 'Destinasi Baru',
      time_slot: customTime, notes: pendingWishlistItem.notes || '',
    };
    
    newDays[dayIndex].slots.push(newSlot);
    newDays[dayIndex].slots.sort((a, b) => (a.time_slot || '23:59').localeCompare(b.time_slot || '23:59'));
    
    setEditableDays(newDays);
    setShowEditSlotModal(false);
    setShowTimeInputModal(false);
    setEditingSlot(null);
    setPendingWishlistItem(null);
    await handleUpdateDetail({ itinerary_data: { ...selectedDetail!.itinerary_data, days: newDays } });
    alert(`"${actualData.title}" berhasil ditambahkan ke Hari ${dayIndex + 1}!`);
  };

  const toggleTempSelect = (index: number) => {
    setTempSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleDatabaseSelection = (key: string, item: DestinationItem) => {
    setSelectedDatabaseItems(prev => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, item);
      return next;
    });
  };

  const addSelectedDestinations = () => {
    const fromWishlist = wishlistItems.filter((_, index) => tempSelectedIds.has(index)).map((item) => {
      const content = item.content || item.plannable || item;
      const categoryName = typeof content.category === 'object' ? content.category?.name : content.category;
      const itemCategory = typeof item.category === 'object' ? item.category?.name : item.category;
      return { id: content.id || item.id, title: content.title || item.title || '', content_id: content.id || item.id, category: categoryName || itemCategory || 'Umum', assigned_day: undefined, assigned_time: undefined };
    });
    
    const fromSearch = Array.from(selectedDatabaseItems.values()).map(dest => {
      const categoryName = typeof dest.category === 'object' ? dest.category?.name : dest.category;
      return { id: dest.id, title: dest.title, content_id: dest.id, category: categoryName || (dest.type === 'event' ? 'Event' : 'Destinasi'), assigned_day: undefined, assigned_time: undefined };
    });
    
    const itemsToAdd = [...fromWishlist, ...fromSearch];
    const existingIds = new Set(manualDestinations.map(d => d.content_id));
    const uniqueNew = itemsToAdd.filter(d => !existingIds.has(d.content_id));
    
    if (uniqueNew.length === 0) { alert("Semua destinasi yang dipilih sudah ada di list!"); return; }
    
    setManualDestinations(prev => [...prev, ...uniqueNew]);
    setTempSelectedIds(new Set());
    setSelectedDatabaseItems(new Map());
    setSearchQuery('');
    setSearchResults([]);
    setShowDestinationPicker(false);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2">
          Itinerary
        </h1>
        <p className="font-mono text-slate-600 dark:text-slate-400 text-xs tracking-widest uppercase">
          Sistem Perencanaan Perjalanan Otomatis
        </p>
      </div>

      <div className="flex gap-3 mb-8 overflow-x-auto hide-scrollbar pb-2">
        <button onClick={() => setActiveTab('create')} className={`px-8 py-3 rounded-full font-mono text-xs font-bold transition-all ${activeTab === 'create' ? 'bg-slate-900 dark:bg-green-400 text-white dark:text-slate-900 shadow-md' : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}>
          BUAT ITINERARY
        </button>
        <button onClick={() => setActiveTab('list')} className={`px-8 py-3 rounded-full font-mono text-xs font-bold transition-all ${activeTab === 'list' || activeTab === 'detail' ? 'bg-slate-900 dark:bg-green-400 text-white dark:text-slate-900 shadow-md' : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}>
          DAFTAR ITINERARY
        </button>
      </div>

      {activeTab === 'create' && (
        <ItineraryCreate
          formTitle={formTitle} setFormTitle={setFormTitle}
          startDate={startDate} setStartDate={setStartDate}
          startTime={startTime} setStartTime={setStartTime}
          endDate={endDate} setEndDate={setEndDate}
          endTime={endTime} setEndTime={setEndTime}
          calculateDays={calculateDays}
          generateMode={generateMode} setGenerateMode={setGenerateMode}
          manualDestinations={manualDestinations}
          setShowDestinationPicker={setShowDestinationPicker}
          removeDestinationFromManual={removeDestinationFromManual}
          setShowScheduler={setShowScheduler}
          categories={categories}
          selectedInterests={selectedInterests} toggleInterest={toggleInterest}
          useWishlist={useWishlist} setUseWishlist={setUseWishlist}
          isGenerating={isGenerating} handleGenerate={handleGenerate}
          generatedResult={generatedResult} handleSaveItinerary={handleSaveItinerary}
        />
      )}

      {activeTab === 'list' && (
        <ItineraryList
          loading={loading}
          historyList={historyList}
          handleViewDetail={handleViewDetail}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'detail' && selectedDetail && editableDays && (
        <ItineraryDetail
          selectedDetail={selectedDetail}
          editableDays={editableDays}
          setActiveTab={setActiveTab}
          navigateAllToMap={navigateAllToMap}
          navigateSingleToMap={navigateSingleToMap}
          handleDeleteItinerary={handleDeleteItinerary}
          isEditingTitle={isEditingTitle} setIsEditingTitle={setIsEditingTitle}
          newTitle={newTitle} setNewTitle={setNewTitle} handleTitleBlur={handleTitleBlur}
          getWeatherForDay={getWeatherForDay}
          openEditSlotModal={openEditSlotModal}
          moveSlot={moveSlot} deleteSlot={deleteSlot}
          openAddDestinationModal={openAddDestinationModal}
        />
      )}

      <DestinationPickerModal isOpen={showDestinationPicker} onClose={() => setShowDestinationPicker(false)}>
        <div>
          <h4 className="font-bold text-sm mb-3 text-slate-900 dark:text-white">Wishlist Saya</h4>
          <div className="space-y-2">
            {wishlistItems.map((item: WishlistItem, index: number) => {
              const isSelected = tempSelectedIds.has(index);
              const title = item.content?.title || item.plannable?.title || item.title || 'Destinasi';
              const categoryName = typeof item.content?.category === 'object' ? item.content?.category?.name : item.content?.category;
              const itemCategory = typeof item.category === 'object' ? item.category?.name : item.category;
              const category = categoryName || itemCategory || 'Umum';
              
              return (
                <div key={index} onClick={() => toggleTempSelect(index)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 accent-green-600" />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{title}</p>
                    <p className="text-xs text-slate-500">{category}</p>
                  </div>
                </div>
              );
            })}
            {wishlistItems.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Wishlist kosong</p>}
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <h4 className="font-bold text-sm mb-3 text-slate-900 dark:text-white">Cari dari Database</h4>
            <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); searchDestinations(e.target.value); }} placeholder="Ketik nama destinasi..." className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl mb-3 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((dest: DestinationItem) => {
                const uniqueKey = `search-${dest.type || 'content'}-${dest.id}`;
                const isSelected = selectedDatabaseItems.has(uniqueKey);
                const categoryName = typeof dest.category === 'object' ? dest.category?.name : dest.category;
                return (
                  <div key={uniqueKey} onClick={() => toggleDatabaseSelection(uniqueKey, dest)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                    <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 accent-green-600" />
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{dest.title}</p>
                      <p className="text-xs text-slate-500">{categoryName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <p className="text-sm text-slate-500 font-mono">
            {tempSelectedIds.size + selectedDatabaseItems.size > 0 ? `${tempSelectedIds.size + selectedDatabaseItems.size} destinasi dipilih` : 'Pilih destinasi'}
          </p>
          <RetroButton onClick={addSelectedDestinations} disabled={tempSelectedIds.size === 0 && selectedDatabaseItems.size === 0}>
            + TAMBAHKAN
          </RetroButton>
        </div>
      </DestinationPickerModal>

      <ManualSchedulerModal isOpen={showScheduler} onClose={() => setShowScheduler(false)}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">Atur Jadwal Manual</h3>
          <button onClick={() => setShowScheduler(false)} className="text-slate-500 hover:text-slate-700 text-2xl"> </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-sm mb-3 text-slate-900 dark:text-white">Destinasi Tersedia</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {manualDestinations.map((dest, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{dest.title}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <select value={dest.assigned_day || ''} onChange={(e) => updateDestinationSchedule(dest.id, parseInt(e.target.value) || 0, dest.assigned_time || '08:00')} className="p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50">
                      <option value="">Pilih Hari</option>
                      {Array.from({ length: calculateDays() }, (_, i) => <option key={i + 1} value={i + 1}>Hari {i + 1}</option>)}
                    </select>
                    <input type="time" lang="id-ID" value={dest.assigned_time || '08:00'} onChange={(e) => updateDestinationSchedule(dest.id, dest.assigned_day || 1, e.target.value)} className="p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-3 text-slate-900 dark:text-white">Preview Jadwal</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Array.from({ length: calculateDays() }, (_, i) => {
                const dayNum = i + 1;
                const dayDestinations = manualDestinations.filter(d => d.assigned_day === dayNum).sort((a, b) => (a.assigned_time || '').localeCompare(b.assigned_time || ''));
                return (
                  <div key={dayNum} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h5 className="font-bold text-sm mb-2 text-slate-900 dark:text-white">Hari {dayNum}</h5>
                    <ul className="space-y-1">
                      {dayDestinations.map((dest, idx) => (
                        <li key={idx} className="text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className="font-bold font-mono">{dest.assigned_time}:</span> {dest.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <RetroButton variant="secondary" onClick={() => setShowScheduler(false)} className="flex-1">Tutup</RetroButton>
          <RetroButton onClick={handleManualGenerate} className="flex-1">Generate Itinerary</RetroButton>
        </div>
      </ManualSchedulerModal>

      <SlotManagerModal isOpen={showEditSlotModal} onClose={() => setShowEditSlotModal(false)} title={editingSlot?.slotIndex === -1 ? "Tambah dari Wishlist" : "Ganti dari Wishlist"}>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {wishlistForEdit.map((item: WishlistItem, index: number) => {
            const actualTitle = item.content?.title || item.plannable?.title || item.title || 'Destinasi';
            const categoryName = typeof item.content?.category === 'object' ? item.content?.category?.name : item.content?.category;
            const itemCategory = typeof item.category === 'object' ? item.category?.name : item.category;
            
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer" onClick={() => replaceSlotFromWishlist(item)}>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{actualTitle}</p>
                  <p className="text-xs text-slate-500">{categoryName || itemCategory}</p>
                </div>
                <span className="px-3 py-1 text-white text-xs font-bold rounded-lg bg-green-600">Pilih</span>
              </div>
            );
          })}
        </div>
      </SlotManagerModal>

      <SlotManagerModal isOpen={showTimeInputModal} onClose={() => setShowTimeInputModal(false)} title="Tentukan Waktu">
        <input type="time" lang="id-ID" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-6 [color-scheme:light] dark:[color-scheme:dark]" />
        <div className="flex gap-3">
          <RetroButton variant="secondary" onClick={() => setShowTimeInputModal(false)} className="flex-1">Batal</RetroButton>
          <RetroButton onClick={handleAddDestinationWithTime} className="flex-1">Simpan</RetroButton>
        </div>
      </SlotManagerModal>
    </div>
  );
}