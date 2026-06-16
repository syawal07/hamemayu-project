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

export default function ItineraryPage() {
  const [activeTab, setActiveTab] = useState<'history' | 'generate' | 'detail'>('history');
  const [historyList, setHistoryList] = useState<ItineraryHistory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State Parameter Form
  const [formDays, setFormDays] = useState<number>(1);
  const [formBudget, setFormBudget] = useState<string>('hemat');
  const [useWishlist, setUseWishlist] = useState<boolean>(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [formTitle, setFormTitle] = useState<string>('Rencana Eksplorasi Baru');

  const [generatedResult, setGeneratedResult] = useState<ItineraryGenerateResponse | null>(null);
  
  const [selectedDetail, setSelectedDetail] = useState<ItineraryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  // Load Categories (Data Dinamis)
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
      alert('GAGAL MENGHASILKAN ITINERARY. PERIKSA KONEKSI SISTEM.');
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

      alert('ITINERARY BERHASIL DISIMPAN KE PANGKALAN DATA!');
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
      }
    } catch (error) {
      console.error(error);
      alert('GAGAL MEMUAT DETAIL ITINERARY.');
      setActiveTab('history');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      
      {/* Header Area */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2 drop-shadow-sm">
            Modul Itinerary
          </h1>
          <p className="font-mono text-slate-600 dark:text-slate-400 text-xs tracking-widest uppercase">
            Sistem Perencanaan Perjalanan Otomatis Berbasis AI
          </p>
        </div>
      </div>

      {/* Tabs Navigation (Glass Pills) */}
      <div className="flex gap-3 mb-8 overflow-x-auto hide-scrollbar pb-2">
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-8 py-3 rounded-full font-mono text-xs font-bold transition-all duration-300 whitespace-nowrap shadow-sm border ${
            activeTab === 'history' || activeTab === 'detail' 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent scale-105 shadow-[0_4px_16px_rgba(15,28,53,0.15)]' 
              : 'bg-white/50 dark:bg-brutal-dark/50 backdrop-blur-md text-slate-600 dark:text-slate-400 border-white/60 dark:border-slate-700/50 hover:bg-white/80 hover:text-slate-900 dark:hover:bg-slate-800/80 dark:hover:text-white'
          }`}
        >
          RIWAYAT PERJALANAN
        </button>
        <button 
          onClick={() => setActiveTab('generate')}
          className={`px-8 py-3 rounded-full font-mono text-xs font-bold transition-all duration-300 whitespace-nowrap shadow-sm border ${
            activeTab === 'generate' 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent scale-105 shadow-[0_4px_16px_rgba(15,28,53,0.15)]' 
              : 'bg-white/50 dark:bg-brutal-dark/50 backdrop-blur-md text-slate-600 dark:text-slate-400 border-white/60 dark:border-slate-700/50 hover:bg-white/80 hover:text-slate-900 dark:hover:bg-slate-800/80 dark:hover:text-white'
          }`}
        >
          GENERATOR BARU
        </button>
      </div>

      {/* TAB: HISTORY */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-4 animate-in fade-in">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-brutal-dark/40 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-slate-700/50">
               <div className="w-8 h-8 border-4 border-green-700/30 dark:border-yellow-400/30 border-t-green-700 dark:border-t-yellow-400 rounded-full animate-spin mb-4"></div>
               <span className="font-mono text-[10px] font-bold tracking-widest text-slate-500 uppercase">MEMUAT PANGKALAN DATA...</span>
             </div>
          ) : historyList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {historyList.map(item => (
                <div key={item.id} className="bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 p-6 rounded-3xl shadow-[0_8px_32px_rgba(15,28,53,0.04)] hover:shadow-[0_16px_48px_rgba(15,28,53,0.08)] group hover:-translate-y-1 transition-all duration-500 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-green-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center font-mono font-bold text-xl text-green-800 dark:text-yellow-400 border border-green-200 dark:border-slate-700 shadow-sm group-hover:scale-110 transition-transform">
                      {item.days}<span className="text-xs ml-0.5">H</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full uppercase shadow-sm">
                      ID: {item.id}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight mb-4 line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="mt-auto pt-6 border-t border-slate-200/60 dark:border-slate-700/50">
                    <button 
                      onClick={() => handleViewDetail(item.id)}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono text-xs font-bold py-3.5 rounded-xl uppercase hover:bg-green-700 dark:hover:bg-yellow-400 dark:hover:text-slate-900 transition-colors shadow-sm active:scale-95"
                    >
                      LIHAT DETAIL PERJALANAN
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/40 dark:bg-brutal-dark/40 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 p-16 rounded-[2.5rem] text-center shadow-sm flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-white dark:border-slate-700 shadow-inner">
                 <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <p className="font-mono text-slate-800 dark:text-slate-200 font-bold uppercase tracking-widest text-sm mb-3">Belum Ada Riwayat Itinerary</p>
              <button onClick={() => setActiveTab('generate')} className="text-green-700 dark:text-yellow-400 hover:text-green-800 dark:hover:text-yellow-500 font-mono text-xs font-bold flex items-center gap-1 transition-colors uppercase tracking-widest">
                Aktifkan Generator Sekarang &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB: DETAIL ITINERARY */}
      {activeTab === 'detail' && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <button 
            onClick={() => setActiveTab('history')} 
            className="flex items-center gap-2 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 mb-6 uppercase tracking-widest bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-md px-4 py-2 border border-white/60 dark:border-slate-700/50 rounded-full shadow-sm w-fit hover:-translate-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            KEMBALI KE RIWAYAT
          </button>

          {detailLoading ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white/40 dark:bg-brutal-dark/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/50 dark:border-slate-700/50 shadow-sm">
              <div className="w-10 h-10 border-4 border-green-700/30 dark:border-yellow-400/30 border-t-green-700 dark:border-t-yellow-400 rounded-full animate-spin mb-4"></div>
              <p className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-widest">MENGUNDUH DATA DOKUMEN...</p>
            </div>
          ) : selectedDetail ? (
            <div className="bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 shadow-[0_8px_32px_rgba(15,28,53,0.05)] rounded-[2.5rem] overflow-hidden">
              
              <div className="p-8 md:p-12 border-b border-slate-200/60 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                  <div>
                    <span className="inline-block bg-slate-900/10 dark:bg-white/10 text-slate-800 dark:text-slate-200 px-4 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase mb-4 shadow-sm">
                      DOKUMEN ID: #{selectedDetail.id}
                    </span>
                    <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                      {selectedDetail.title}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono border-t border-slate-200/60 dark:border-slate-700/50 pt-8">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">DURASI</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedDetail.days} HARI</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">PROFIL ANGGARAN</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white uppercase">{selectedDetail.budget_type || 'NORMAL'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">ESTIMASI BIAYA</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-yellow-400">{selectedDetail.estimated_budget}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-12">
                <h3 className="font-mono text-sm font-bold text-slate-900 dark:text-white uppercase mb-8 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-green-700 dark:bg-yellow-400 rounded-full"></span>
                  JADWAL_OPERASIONAL
                </h3>
                
                <div className="flex flex-col gap-10">
                  {selectedDetail.itinerary_data.days?.map((dayPlan, index) => (
                    <div key={index} className="relative pl-8 md:pl-12 border-l-2 border-dashed border-slate-200 dark:border-slate-700">
                      
                      <div className="absolute top-0 -left-[21px] md:-left-[25px] w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-full border-4 border-green-100 dark:border-slate-700 flex items-center justify-center font-mono font-bold text-slate-900 dark:text-white shadow-sm">
                        <span className="text-green-700 dark:text-yellow-400">H{dayPlan.day}</span>
                      </div>
                      
                      <div className="mb-6 pt-1">
                        <h4 className="font-serif text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                          {dayPlan.theme || `Eksplorasi Hari ${dayPlan.day}`}
                        </h4>
                        {dayPlan.transport_tip && (
                          <div className="inline-flex items-center gap-2 mt-3 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                             <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                             <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                               TIPS TRANSPORT: {dayPlan.transport_tip}
                             </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-4">
                        {dayPlan.slots?.map((slot, slotIndex) => (
                          <div key={slotIndex} className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-slate-900/10 dark:bg-white/10 text-slate-800 dark:text-slate-200 px-4 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase w-fit text-center shrink-0">
                              {slot.time_slot}
                            </div>
                            <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 uppercase flex-1 leading-snug">
                              {slot.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB: GENERATOR */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
          
          <div className="lg:col-span-4 h-fit bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(15,28,53,0.05)]">
            <h2 className="font-mono font-bold text-sm text-slate-900 dark:text-white mb-6 uppercase border-b border-slate-200/60 dark:border-slate-700/50 pb-4 tracking-widest">
              PARAMETER_INPUT
            </h2>
            
            <form onSubmit={handleGenerate} className="flex flex-col gap-6">
              <div>
                <label className="block font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">LAMA PERJALANAN (HARI)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="7"
                  value={formDays}
                  onChange={(e) => setFormDays(Number(e.target.value))}
                  className="w-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-4 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-yellow-400 text-slate-900 dark:text-white transition-shadow"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">PROFIL ANGGARAN</label>
                <select 
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  className="w-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-4 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-yellow-400 text-slate-900 dark:text-white appearance-none cursor-pointer transition-shadow"
                >
                  <option value="hemat">EKONOMIS / HEMAT</option>
                  <option value="normal">STANDAR / NORMAL</option>
                  <option value="mewah">EKSKLUSIF / MEWAH</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest">FOKUS MINAT EKSPLORASI</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleInterest(cat.slug)}
                      className={`px-4 py-2 rounded-full font-mono text-[10px] font-bold transition-all duration-300 uppercase shadow-sm border ${
                        selectedInterests.includes(cat.slug)
                          ? 'bg-slate-900 text-white border-transparent dark:bg-white dark:text-slate-900 scale-105'
                          : 'bg-white/40 text-slate-600 border-white/60 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/50 hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm cursor-pointer hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors" onClick={() => setUseWishlist(!useWishlist)}>
                <div className={`w-5 h-5 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center transition-colors ${useWishlist ? 'bg-green-600 border-green-600 dark:bg-yellow-400 dark:border-yellow-400' : 'bg-transparent'}`}>
                  {useWishlist && <svg className="w-3.5 h-3.5 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">SINKRONISASI WISHLIST</span>
              </div>

              <button 
                type="submit" 
                disabled={isGenerating}
                className="mt-4 w-full bg-slate-900 dark:bg-yellow-400 text-white dark:text-slate-900 rounded-xl font-mono text-xs font-bold py-4 uppercase shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isGenerating ? (
                   <>
                     <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-slate-900" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     MEMPROSES ALGORITMA...
                   </>
                ) : 'EKSEKUSI GENERATOR'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-8">
            {!generatedResult && !isGenerating && (
              <div className="h-full min-h-[400px] border border-dashed border-slate-300 dark:border-slate-700 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm">
                <svg className="w-20 h-20 text-slate-300 dark:text-slate-700 mb-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                <p className="font-mono text-slate-500 font-bold uppercase tracking-widest text-xs">SISTEM MENUNGGU PARAMETER UNTUK MEMULAI PROSES GENERASI</p>
              </div>
            )}

            {isGenerating && (
              <div className="h-full min-h-[400px] border border-white/50 dark:border-slate-700/50 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-2xl shadow-[0_8px_32px_rgba(15,28,53,0.05)]">
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-green-500 dark:border-yellow-400 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-2 bg-green-100 dark:bg-slate-800 rounded-full animate-pulse"></div>
                </div>
                <p className="font-mono text-slate-800 dark:text-slate-200 font-bold uppercase tracking-widest text-xs animate-pulse">MENYUSUN RUTE OPTIMAL...</p>
              </div>
            )}

            {generatedResult && !isGenerating && (
              <div className="bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 shadow-[0_8px_32px_rgba(15,28,53,0.06)] p-8 md:p-10 rounded-[2.5rem] animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start border-b border-slate-200/60 dark:border-slate-700/50 pb-6 mb-8">
                  <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">HASIL_KALKULASI</h2>
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 font-mono text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">SUKSES</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 font-mono">
                  <div className="bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/50 p-5 rounded-2xl">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1.5">TOTAL HARI</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{generatedResult.summary.total_days}</p>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/50 p-5 rounded-2xl">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1.5">DESTINASI</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{generatedResult.summary.total_destinations || generatedResult.summary.highlights?.length || 0}</p>
                  </div>
                  <div className="col-span-2 bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/50 p-5 rounded-2xl">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1.5">ESTIMASI ANGGARAN</p>
                    <p className="text-xl font-bold text-green-700 dark:text-yellow-400">{generatedResult.summary.estimated_total_budget}</p>
                  </div>
                </div>

                <div className="mb-10">
                  <h3 className="font-mono text-xs font-bold text-slate-900 dark:text-white uppercase mb-5 flex items-center gap-3">
                    <span className="w-1.5 h-4 bg-green-700 dark:bg-yellow-400 rounded-full"></span>
                    HIGHLIGHT DESTINASI UTAMA
                  </h3>
                  <ul className="space-y-3 font-mono text-xs">
                    {generatedResult.summary.highlights?.map((highlight, index) => (
                      <li key={index} className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-green-700 dark:text-yellow-400 font-bold border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">{index + 1}</span>
                        <span className="text-slate-800 dark:text-slate-200 uppercase font-bold">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-200/60 dark:border-slate-700/50 pt-8 mt-8">
                  <label className="block font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest">BERI NAMA RENCANA INI UNTUK DISIMPAN</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                      type="text" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="flex-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-4 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-yellow-400 text-slate-900 dark:text-white shadow-sm"
                    />
                    <button 
                      onClick={handleSaveItinerary}
                      className="bg-green-700 dark:bg-yellow-400 text-white dark:text-slate-900 font-mono font-bold px-8 py-4 rounded-xl uppercase shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 whitespace-nowrap text-xs tracking-wide"
                    >
                      SIMPAN PERJALANAN
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}