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
        // Otomatis pilih kategori pertama sebagai default jika array tidak kosong
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
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
            MODUL_ITINERARY
          </h1>
          <p className="font-mono text-slate-600 dark:text-slate-400 text-sm">
            SISTEM PERENCANAAN PERJALANAN OTOMATIS BERBASIS AI
          </p>
        </div>
      </div>

      <div className="flex border-b-4 border-slate-900 dark:border-white/20 mb-8 font-mono text-sm font-bold uppercase overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-8 py-4 border-b-4 transition-colors whitespace-nowrap ${activeTab === 'history' || activeTab === 'detail' ? 'border-golden-heritage text-slate-900 dark:text-golden-heritage bg-[#F4F0EA] dark:bg-slate-900/50' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          [ RIWAYAT PERJALANAN ]
        </button>
        <button 
          onClick={() => setActiveTab('generate')}
          className={`px-8 py-4 border-b-4 transition-colors whitespace-nowrap ${activeTab === 'generate' ? 'border-golden-heritage text-slate-900 dark:text-golden-heritage bg-[#F4F0EA] dark:bg-slate-900/50' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          [ GENERATOR BARU ]
        </button>
      </div>

      {activeTab === 'history' && (
        <div className="flex flex-col gap-4 animate-in fade-in">
          {loading ? (
             <div className="flex justify-center py-12">
               <span className="font-mono font-bold animate-pulse text-slate-500">MEMUAT PANGKALAN DATA...</span>
             </div>
          ) : historyList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {historyList.map(item => (
                <div key={item.id} className="bg-white dark:bg-[#0F1C35] border-2 border-slate-900 dark:border-white/20 p-6 brutal-shadow-sm group hover:-translate-y-1 transition-transform flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-[#F4F0EA] dark:bg-slate-800 border-2 border-slate-900 dark:border-white/20 flex items-center justify-center font-mono font-bold text-xl text-slate-900 dark:text-white">
                      {item.days}H
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 border border-slate-300 dark:border-slate-700 px-2 py-1 uppercase">
                      ID: {item.id}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="mt-auto pt-6">
                    <button 
                      onClick={() => handleViewDetail(item.id)}
                      className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono text-xs font-bold py-3 uppercase border-2 border-slate-900 dark:border-white hover:bg-golden-heritage hover:text-slate-900 dark:hover:bg-golden-heritage transition-colors"
                    >
                      LIHAT DETAIL PERJALANAN
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0F1C35] border-2 border-slate-900 dark:border-white/20 p-12 text-center brutal-shadow-sm flex flex-col items-center justify-center">
              <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <p className="font-mono text-slate-500 font-bold uppercase mb-4">BELUM ADA RIWAYAT ITINERARY</p>
              <button onClick={() => setActiveTab('generate')} className="text-golden-heritage hover:underline font-mono text-sm font-bold uppercase">
                AKTIFKAN GENERATOR SEKARANG &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'detail' && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <button 
            onClick={() => setActiveTab('history')} 
            className="flex items-center gap-2 font-mono text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-6 uppercase"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            KEMBALI KE RIWAYAT
          </button>

          {detailLoading ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white dark:bg-[#0F1C35] border-2 border-slate-900 dark:border-white/20 brutal-shadow-sm">
              <div className="w-12 h-12 border-4 border-golden-heritage border-t-slate-900 dark:border-t-white rounded-full animate-spin mb-4"></div>
              <p className="font-mono text-slate-500 font-bold uppercase">MENGUNDUH DATA DOKUMEN...</p>
            </div>
          ) : selectedDetail ? (
            <div className="bg-white dark:bg-[#0F1C35] border-2 border-slate-900 dark:border-white/20 brutal-shadow-sm">
              <div className="p-6 md:p-8 border-b-2 border-slate-900 dark:border-white/20 bg-[#F4F0EA] dark:bg-slate-900/50">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div>
                    <span className="inline-block bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1 font-mono text-[10px] font-bold uppercase mb-3">
                      DOKUMEN ID: #{selectedDetail.id}
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
                      {selectedDetail.title}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono border-t-2 border-slate-900 dark:border-white/10 pt-6">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase mb-1">DURASI</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{selectedDetail.days} HARI</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase mb-1">PROFIL ANGGARAN</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white uppercase">{selectedDetail.budget_type || 'NORMAL'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">ESTIMASI BIAYA</p>
                    <p className="text-xl font-bold text-golden-heritage">{selectedDetail.estimated_budget}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <h3 className="font-mono text-lg font-bold text-slate-900 dark:text-white uppercase mb-6 border-l-4 border-golden-heritage pl-4">
                  JADWAL_OPERASIONAL
                </h3>
                
                <div className="flex flex-col gap-8">
                  {selectedDetail.itinerary_data.days?.map((dayPlan, index) => (
                    <div key={index} className="relative pl-6 md:pl-8 border-l-2 border-dashed border-slate-300 dark:border-slate-700">
                      <div className="absolute top-0 -left-[17px] md:-left-[21px] w-8 h-8 md:w-10 md:h-10 bg-golden-heritage border-2 border-slate-900 flex items-center justify-center font-mono font-bold text-slate-900 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        H{dayPlan.day}
                      </div>
                      
                      <div className="mb-4 pt-1">
                        <h4 className="font-serif text-xl font-bold text-slate-900 dark:text-white uppercase">
                          {dayPlan.theme || `Eksplorasi Hari ${dayPlan.day}`}
                        </h4>
                        {dayPlan.transport_tip && (
                          <p className="font-mono text-xs text-slate-500 mt-1 uppercase">
                            TIPS TRANSPORTASI: {dayPlan.transport_tip}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-3">
                        {dayPlan.slots?.map((slot, slotIndex) => (
                          <div key={slotIndex} className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-900 dark:border-white/10 p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1 font-mono text-[10px] font-bold uppercase w-fit md:w-24 text-center shrink-0">
                              {slot.time_slot}
                            </div>
                            <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 uppercase flex-1">
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

      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
          
          <div className="lg:col-span-4 h-fit bg-white dark:bg-[#0F1C35] border-2 border-slate-900 dark:border-white/20 p-6 brutal-shadow-sm">
            <h2 className="font-mono font-bold text-lg text-slate-900 dark:text-white mb-6 uppercase border-b-2 border-slate-900 dark:border-white/20 pb-2">
              PARAMETER_INPUT
            </h2>
            
            <form onSubmit={handleGenerate} className="flex flex-col gap-6">
              <div>
                <label className="block font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">LAMA PERJALANAN (HARI)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="7"
                  value={formDays}
                  onChange={(e) => setFormDays(Number(e.target.value))}
                  className="w-full bg-[#F4F0EA] dark:bg-slate-900 border-2 border-slate-900 dark:border-white/20 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-golden-heritage text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">PROFIL ANGGARAN</label>
                <select 
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  className="w-full bg-[#F4F0EA] dark:bg-slate-900 border-2 border-slate-900 dark:border-white/20 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-golden-heritage text-slate-900 dark:text-white appearance-none"
                >
                  <option value="hemat">EKONOMIS / HEMAT</option>
                  <option value="normal">STANDAR / NORMAL</option>
                  <option value="mewah">EKSKLUSIF / MEWAH</option>
                </select>
              </div>

              {/* Data Kategori Dinamis */}
              <div>
                <label className="block font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">FOKUS MINAT EKSPLORASI</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleInterest(cat.slug)}
                      className={`px-3 py-2 font-mono text-[10px] font-bold border-2 transition-colors uppercase ${
                        selectedInterests.includes(cat.slug)
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                          : 'bg-[#F4F0EA] text-slate-600 border-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:border-white/20'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border-2 border-slate-900 dark:border-white/20 bg-[#F4F0EA] dark:bg-slate-900 cursor-pointer" onClick={() => setUseWishlist(!useWishlist)}>
                <div className={`w-5 h-5 border-2 border-slate-900 dark:border-white flex items-center justify-center ${useWishlist ? 'bg-golden-heritage' : 'bg-transparent'}`}>
                  {useWishlist && <svg className="w-3 h-3 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white uppercase">SINKRONISASI WISHLIST</span>
              </div>

              <button 
                type="submit" 
                disabled={isGenerating}
                className="mt-2 w-full bg-golden-heritage text-slate-900 font-mono font-bold py-4 uppercase border-2 border-slate-900 brutal-shadow-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'MEMPROSES ALGORITMA...' : 'EKSEKUSI GENERATOR'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-8">
            {!generatedResult && !isGenerating && (
              <div className="h-full min-h-100 border-2 border-dashed border-slate-400 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center bg-white/50 dark:bg-slate-900/20">
                <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                <p className="font-mono text-slate-500 font-bold uppercase">SISTEM MENUNGGU PARAMETER UNTUK MEMULAI PROSES GENERASI</p>
              </div>
            )}

            {isGenerating && (
              <div className="h-full min-h-100 border-2 border-slate-900 dark:border-white/20 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#0F1C35] brutal-shadow-sm">
                <div className="w-16 h-16 border-4 border-golden-heritage border-t-slate-900 dark:border-t-white rounded-full animate-spin mb-6"></div>
                <p className="font-mono text-slate-900 dark:text-white font-bold uppercase animate-pulse">MENYUSUN RUTE OPTIMAL...</p>
              </div>
            )}

            {generatedResult && !isGenerating && (
              <div className="bg-white dark:bg-[#0F1C35] border-2 border-slate-900 dark:border-white/20 brutal-shadow-sm p-6 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start border-b-2 border-slate-900 dark:border-white/20 pb-4 mb-6">
                  <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">HASIL_KALKULASI</h2>
                  <span className="bg-green-600 text-white font-mono text-[10px] font-bold px-3 py-1 uppercase">SUKSES</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 font-mono">
                  <div className="bg-[#F4F0EA] dark:bg-slate-900 border-2 border-slate-900 dark:border-white/20 p-4">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">TOTAL HARI</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{generatedResult.summary.total_days}</p>
                  </div>
                  <div className="bg-[#F4F0EA] dark:bg-slate-900 border-2 border-slate-900 dark:border-white/20 p-4">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">DESTINASI</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{generatedResult.summary.total_destinations || generatedResult.summary.highlights?.length || 0}</p>
                  </div>
                  <div className="col-span-2 bg-[#F4F0EA] dark:bg-slate-900 border-2 border-slate-900 dark:border-white/20 p-4">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">ESTIMASI ANGGARAN</p>
                    <p className="text-lg font-bold text-golden-heritage">{generatedResult.summary.estimated_total_budget}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="font-mono text-sm font-bold text-slate-900 dark:text-white uppercase mb-4 border-l-4 border-golden-heritage pl-3">HIGHLIGHT DESTINASI UTAMA</h3>
                  <ul className="space-y-3 font-mono text-sm">
                    {generatedResult.summary.highlights?.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <span className="text-golden-heritage font-bold">[{index + 1}]</span>
                        <span className="text-slate-700 dark:text-slate-300 uppercase">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t-2 border-slate-900 dark:border-white/20 pt-6 mt-6">
                  <label className="block font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">BERI NAMA RENCANA INI UNTUK DISIMPAN</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                      type="text" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="flex-1 bg-[#F4F0EA] dark:bg-slate-900 border-2 border-slate-900 dark:border-white/20 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-golden-heritage text-slate-900 dark:text-white"
                    />
                    <button 
                      onClick={handleSaveItinerary}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono font-bold px-8 py-3 uppercase border-2 border-slate-900 dark:border-white brutal-shadow-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-transform whitespace-nowrap"
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