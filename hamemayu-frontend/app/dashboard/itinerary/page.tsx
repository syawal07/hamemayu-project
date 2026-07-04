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

  // ✅ FIX: Handle Save Generated Itinerary (total_destinations PASTI INTEGER)
  const handleSaveItinerary = async () => {
    if (!generatedResult || !startDate || !endDate) {
      alert('Mohon lengkapi tanggal mulai dan selesai!');
      return;
    }
    
    const startDateTime = `${startDate} ${startTime || '00:00'}:00`;
    const endDateTime = `${endDate} ${endTime || '23:59'}:00`;
    
    const daysArray = generatedResult.days && generatedResult.days.length > 0 
      ? generatedResult.days.map((day, idx) => ({
          day: idx + 1,
          theme: day.theme || `Hari ${idx + 1}`,
          slots: day.slots.map(slot => ({
            title: slot.title,
            time_slot: slot.time_slot,
            content_id: slot.content_id || null,
            notes: slot.notes || null,
          })),
          transport_tip: day.transport_tip || null,
        }))
      : [
          {
            day: 1,
            theme: "Eksplorasi Mandiri",
            slots: (generatedResult.summary.highlights || []).map((h, i) => ({
              title: h,
              time_slot: i === 0 ? 'pagi' : i === 1 ? 'siang' : 'sore',
              content_id: null,
              notes: null,
            })),
            transport_tip: null,
          }
        ];

    // ✅ FIX: PASTIKAN total_destinations INTEGER
    const totalDestinations = generatedResult.summary.total_destinations 
      ? Math.floor(parseInt(String(generatedResult.summary.total_destinations))) 
      : daysArray.reduce((acc, day) => acc + day.slots.length, 0);

    const payload = {
      title: formTitle || 'Rencana Eksplorasi Baru',
      start_date: startDateTime,
      end_date: endDateTime,
      days: calculateDays(),
      budget_type: formBudget,
      total_destinations: totalDestinations, // ✅ PASTI INTEGER
      estimated_budget: generatedResult.summary.estimated_total_budget || 'Rp 0',
      itinerary_data: {
        summary: {
          total_days: calculateDays(),
          total_destinations: totalDestinations, // ✅ PASTI INTEGER
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
              <div>
                <label className="block font-mono text-[10px] font-bold mb-3 uppercase">Mode Generate</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setGenerateMode('ai')} className={`flex-1 p-3 rounded-xl border-2 text-xs font-bold transition-all ${generateMode === 'ai' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-slate-200 dark:border-slate-700'}`}>🤖 AI</button>
                  <button type="button" onClick={() => setGenerateMode('manual')} className={`flex-1 p-3 rounded-xl border-2 text-xs font-bold transition-all ${generateMode === 'manual' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700'}`}>📝 Manual</button>
                </div>
              </div>
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
                </>
              )}
              <div>
                <label className="block font-mono text-[10px] font-bold mb-2 uppercase">Profil Anggaran</label>
                <select value={formBudget} onChange={(e) => setFormBudget(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
                  <option value="hemat">HEMAT</option>
                  <option value="normal">NORMAL</option>
                  <option value="mewah">MEWAH</option>
                </select>
              </div>
              <button type="submit" disabled={isGenerating || !startDate || !endDate} className="w-full bg-slate-900 dark:bg-yellow-400 text-white dark:text-slate-900 py-4 rounded-xl font-mono text-xs font-bold uppercase disabled:opacity-50">
                {isGenerating ? 'MEMPROSES...' : '✨ GENERATE ITINERARY'}
              </button>
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
                  <div className="p-3 bg-white/50 dark:bg-slate-800/40 rounded-xl">
                    <p className="text-[10px] text-slate-500 uppercase">Hari</p>
                    <p className="font-bold text-lg">{generatedResult.summary.total_days}</p>
                  </div>
                  <div className="p-3 bg-white/50 dark:bg-slate-800/40 rounded-xl">
                    <p className="text-[10px] text-slate-500 uppercase">Destinasi</p>
                    <p className="font-bold text-lg">{generatedResult.summary.total_destinations}</p>
                  </div>
                  <div className="p-3 bg-white/50 dark:bg-slate-800/40 rounded-xl col-span-3">
                    <p className="text-[10px] text-slate-500 uppercase">Estimasi Biaya</p>
                    <p className="font-bold text-lg text-green-700 dark:text-green-400">{generatedResult.summary.estimated_total_budget}</p>
                  </div>
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
          {loading ? (
            <div className="text-center py-20">Loading...</div>
          ) : historyList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {historyList.map(item => (
                <div key={item.id} className="bg-white/60 dark:bg-brutal-dark/60 p-6 rounded-3xl border border-white/60 dark:border-slate-700/50">
                  <h3 className="font-serif text-xl font-bold mb-2">{item.title}</h3>
                  {item.start_date && item.end_date ? (
                    <p className="font-mono text-xs text-slate-500 mb-2">📅 {new Date(item.start_date).toLocaleDateString('id-ID')} - {new Date(item.end_date).toLocaleDateString('id-ID')}</p>
                  ) : (
                    <p className="font-mono text-xs text-slate-500 mb-2">{item.days} Hari</p>
                  )}
                  <button onClick={() => handleViewDetail(item.id)} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-mono text-xs font-bold uppercase mt-4">LIHAT DETAIL</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="mb-4">Belum ada itinerary</p>
              <button onClick={() => setActiveTab('create')} className="text-green-700 font-bold">Buat Itinerary →</button>
            </div>
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
                    <div>
                      <p className="text-sm font-bold">Periode Perjalanan</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(selectedDetail.start_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {' - '}
                        {new Date(selectedDetail.end_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm font-bold">{selectedDetail.days} Hari</p>
                    <p className="text-xs text-slate-500">{selectedDetail.budget_type?.toUpperCase()}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-6">
              {selectedDetail.itinerary_data.days?.map((dayPlan) => (
                <div key={dayPlan.day} className="p-6 bg-white/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-xl font-bold">Hari {dayPlan.day}</h3>
                  </div>
                  <div className="space-y-3">
                    {dayPlan.slots?.map((slot, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full">{slot.time_slot}</span>
                          <span className="font-mono text-sm font-bold">{slot.title}</span>
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
    </div>
  );
}