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

  // ✅ STATE BARU UNTUK MANUAL MODE
  const [manualDestinations, setManualDestinations] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

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

  // ✅ Load Wishlist saat mode Manual dipilih
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

  // ✅ Load Wishlist dari API
  const loadWishlist = async () => {
    try {
      const res = await fetchAPI('/wishlist', { requireAuth: true });
      if (res) setWishlistItems(res);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    }
  };

  // ✅ Search database destinasi
  const searchDestinations = async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    try {
      const res = await fetchAPI(`/contents?search=${query}&limit=10`);
      if (res && res.data) setSearchResults(res.data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // ✅ Tambah destinasi ke pilihan manual
  const addDestinationToManual = (destination: any) => {
    if (!manualDestinations.find(d => d.id === destination.id)) {
      setManualDestinations([...manualDestinations, {
        id: destination.id,
        title: destination.title,
        content_id: destination.id,
        category: destination.category?.name || 'Umum',
      }]);
    }
    setShowDestinationPicker(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // ✅ Hapus destinasi dari pilihan manual
  const removeDestinationFromManual = (id: number) => {
    setManualDestinations(manualDestinations.filter(d => d.id !== id));
  };

  // ✅ Handle Generate untuk Manual Mode
  const handleManualGenerate = async () => {
    if (manualDestinations.length === 0) { alert('PILIH MINIMAL 1 DESTINASI DULU!'); return; }
    if (!startDate || !endDate) { alert('PILIH TANGGAL MULAI DAN SELESAI!'); return; }

    setIsGenerating(true);
    try {
      const days = calculateDays();
      const destinationsPerDay = Math.ceil(manualDestinations.length / days);
      const daysArray = [];
      
      for (let i = 1; i <= days; i++) {
        const startIndex = (i - 1) * destinationsPerDay;
        const dayDestinations = manualDestinations.slice(startIndex, startIndex + destinationsPerDay);
        daysArray.push({
          day: i,
          theme: `Hari ${i} - Eksplorasi`,
          slots: dayDestinations.map((dest: any, idx: number) => ({
            content_id: dest.content_id,
            title: dest.title,
            time_slot: idx === 0 ? 'pagi' : idx === 1 ? 'siang' : 'sore',
          })),
        });
      }
      
      setGeneratedResult({
        summary: {
          total_days: days,
          total_destinations: manualDestinations.length,
          estimated_total_budget: 'Rp 0 - Rp 0',
          highlights: manualDestinations.map((d: any) => d.title),
        },
        days: daysArray,
      });
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

  // ✅ Handle Save Generated Itinerary (FIX: total_destinations INTEGER)
  const handleSaveItinerary = async () => {
    if (!generatedResult || !startDate || !endDate) {
      alert('Mohon lengkapi tanggal mulai dan selesai!');
      return;
    }
    
    const startDateTime = `${startDate} ${startTime || '00:00'}:00`;
    const endDateTime = `${endDate} ${endTime || '23:59'}:00`;
    const daysArray = generatedResult.days || [];
    
    // ✅ FIX: PASTIKAN total_destinations INTEGER
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
        days: daysArray
      }
    };

    console.log("📤 SENDING PAYLOAD:", payload);

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
      console.log("📥 RESPONSE:", data);

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          console.error("❌ VALIDATION ERRORS:", data.errors);
          alert(`GAGAL MENYIMPAN ITINERARY\n\n${errorMessages}`);
        } else {
          alert(`GAGAL MENYIMPAN ITINERARY\n\n${data.message || 'Unknown error'}`);
        }
        return;
      }

      alert('✅ ITINERARY BERHASIL DISIMPAN!');
      setActiveTab('list');
      setGeneratedResult(null);
      setManualDestinations([]);
      
    } catch (error: any) {
      console.error("❌ SAVE ERROR:", error);
      alert(`GAGAL MENYIMPAN: ${error.message}`);
    }
  };

  const handleViewDetail = async (id: number) => {
    setActiveTab('detail');
    setDetailLoading(true);
    try {
      const res = await fetchAPI<ItineraryDetail>(`/itinerary/history/${id}`, { requireAuth: true });
      if (res) setSelectedDetail(res);
    } catch (error) {
      console.error(error);
      alert('GAGAL MEMUAT DETAIL');
      setActiveTab('list');
    } finally {
      setDetailLoading(false);
    }
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
              
              {/* Mode Selector */}
              <div>
                <label className="block font-mono text-[10px] font-bold mb-3 uppercase">Mode Generate</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setGenerateMode('ai')} className={`flex-1 p-3 rounded-xl border-2 text-xs font-bold transition-all ${generateMode === 'ai' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-slate-200 dark:border-slate-700'}`}>🤖 AI</button>
                  <button type="button" onClick={() => setGenerateMode('manual')} className={`flex-1 p-3 rounded-xl border-2 text-xs font-bold transition-all ${generateMode === 'manual' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700'}`}>📝 Manual</button>
                </div>
              </div>

              {/* MANUAL MODE UI */}
              {generateMode === 'manual' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-mono text-xs font-bold uppercase text-blue-700 dark:text-blue-400">📋 Destinasi Pilihan ({manualDestinations.length})</h3>
                      <button type="button" onClick={() => setShowDestinationPicker(true)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">+ Tambah</button>
                    </div>
                    {manualDestinations.length === 0 ? (
                      <p className="text-xs text-blue-600 dark:text-blue-400 italic">Belum ada destinasi dipilih.</p>
                    ) : (
                      <ul className="space-y-2 max-h-40 overflow-y-auto">
                        {manualDestinations.map((dest, idx) => (
                          <li key={dest.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                              <div><p className="font-bold text-slate-900 dark:text-white">{dest.title}</p><p className="text-[10px] text-slate-500">{dest.category}</p></div>
                            </div>
                            <button type="button" onClick={() => removeDestinationFromManual(dest.id)} className="text-red-500 hover:text-red-700 p-1">✕</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button type="button" onClick={handleManualGenerate} disabled={manualDestinations.length === 0 || isGenerating} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white py-4 rounded-xl font-mono text-xs font-bold uppercase transition-all">
                    {isGenerating ? 'MEMPROSES...' : '📝 GENERATE ITINERARY MANUAL'}
                  </button>
                </div>
              )}

              {/* AI MODE UI */}
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

      {activeTab === 'detail' && selectedDetail && (
        <div>
          <button onClick={() => setActiveTab('list')} className="mb-6 font-mono text-xs font-bold">← KEMBALI KE DAFTAR</button>
          <div className="bg-white/60 dark:bg-brutal-dark/60 rounded-3xl p-8 border border-white/60 dark:border-slate-700/50">
            <div className="mb-6">
              <h2 className="font-serif text-3xl font-bold uppercase mb-2">{selectedDetail.title}</h2>
              {selectedDetail.start_date && selectedDetail.end_date && (
                <div className="flex items-center gap-4 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    <div><p className="text-sm font-bold">Periode Perjalanan</p><p className="text-xs text-slate-600 dark:text-slate-400">{new Date(selectedDetail.start_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} - {new Date(selectedDetail.end_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
                  </div>
                  <div className="ml-auto text-right"><p className="text-sm font-bold">{selectedDetail.days} Hari</p><p className="text-xs text-slate-500">{selectedDetail.budget_type?.toUpperCase()}</p></div>
                </div>
              )}
            </div>
            <div className="space-y-6">
              {selectedDetail.itinerary_data.days?.map((dayPlan) => (
                <div key={dayPlan.day} className="p-6 bg-white/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4"><h3 className="font-serif text-xl font-bold">Hari {dayPlan.day}</h3></div>
                  <div className="space-y-3">
                    {dayPlan.slots?.map((slot, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between"><span className="font-mono text-xs font-bold bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full">{slot.time_slot}</span><span className="font-mono text-sm font-bold">{slot.title}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ✅ Destination Picker Modal (Untuk Manual Mode) */}
      {showDestinationPicker && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDestinationPicker(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Pilih Destinasi</h3>
              <button onClick={() => setShowDestinationPicker(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            
            {/* Wishlist Section */}
            <div className="mb-6">
              <h4 className="font-bold text-sm mb-3 text-blue-600 dark:text-blue-400">❤️ Wishlist Saya</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {wishlistItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div><p className="font-bold text-sm">{item.content?.title}</p><p className="text-xs text-slate-500">{item.content?.category?.name}</p></div>
                    <button onClick={() => addDestinationToManual(item.content)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg">+ Pilih</button>
                  </div>
                ))}
                {wishlistItems.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Wishlist kosong</p>}
              </div>
            </div>

            {/* Search Database Section */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="font-bold text-sm mb-3">🔍 Cari dari Database</h4>
              <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); searchDestinations(e.target.value); }} placeholder="Cari destinasi..." className="w-full p-3 border rounded-xl mb-3" />
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((dest: any) => (
                  <div key={dest.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div><p className="font-bold text-sm">{dest.title}</p><p className="text-xs text-slate-500">{dest.category?.name}</p></div>
                    <button onClick={() => addDestinationToManual(dest)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg">+ Pilih</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}