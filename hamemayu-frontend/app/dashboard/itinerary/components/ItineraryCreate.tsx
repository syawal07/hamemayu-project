import { useState, useEffect } from 'react';
import { fetchAPI } from '../../../lib/api';
import { 
  Category, 
  SearchResultItem, 
  ManualDestination, 
  ItineraryGenerateResponse, 
  ItineraryDay, 
  ItinerarySlot 
} from '../types';

interface ItineraryCreateProps {
  onComplete: () => void;
}

interface RawApiItem {
  id: number;
  title: string;
  category?: { name: string };
  excerpt?: string;
}

interface ApiResponse {
  data?: RawApiItem[];
}

export default function ItineraryCreate({ onComplete }: ItineraryCreateProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formTitle, setFormTitle] = useState('Eksplorasi Nusantara');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('20:00');
  const [formBudget, setFormBudget] = useState('hemat');
  const [generateMode, setGenerateMode] = useState<'ai' | 'manual'>('ai');
  const [useWishlist, setUseWishlist] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<ItineraryGenerateResponse | null>(null);
  
  const [manualDestinations, setManualDestinations] = useState<ManualDestination[]>([]);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);

  useEffect(() => {
    fetchAPI<Category[]>('/categories').then(res => {
      if (res && Array.isArray(res)) {
        setCategories(res);
        if (res.length > 0) setSelectedInterests([res[0].slug]);
      }
    });
  }, []);

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  const toggleInterest = (slug: string) => {
    setSelectedInterests(prev => 
      prev.includes(slug) ? prev.filter(i => i !== slug) : [...prev, slug]
    );
  };

  const searchDestinations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      // Menambahkan error handling aman agar tidak throw 500 error ke layar
      let contents: RawApiItem[] = [];
      let events: RawApiItem[] = [];
      
      try {
        const contentsRes = await fetchAPI<ApiResponse | RawApiItem[]>(`/contents?search=${query}&limit=10`, { requireAuth: true });
        contents = (Array.isArray(contentsRes) ? contentsRes : contentsRes?.data) || [];
      } catch (e) {
        console.warn('Pencarian destinasi gagal:', e);
      }

      try {
        const eventsRes = await fetchAPI<ApiResponse | RawApiItem[]>(`/events?search=${query}&limit=10`, { requireAuth: true });
        events = (Array.isArray(eventsRes) ? eventsRes : eventsRes?.data) || [];
      } catch (e) {
        console.warn('Pencarian event gagal:', e);
      }
      
      const allResults: SearchResultItem[] = [
        ...contents.map((item) => ({
          id: item.id,
          title: item.title,
          type: 'destination' as const,
          category: item.category || { name: 'Destinasi' },
          excerpt: item.excerpt,
        })),
        ...events.map((item) => ({
          id: item.id,
          title: item.title,
          type: 'event' as const,
          category: item.category || { name: 'Event' },
          excerpt: item.excerpt,
        })),
      ];
      
      setSearchResults(allResults);
    } catch (error) {
      console.error('Koneksi pencarian terputus:', error);
    }
  };

  const addDestinationToManual = (destination: SearchResultItem) => {
    if (!manualDestinations.find(d => d.id === destination.id)) {
      setManualDestinations(prev => [...prev, {
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

  const removeDestinationFromManual = (id: number) => {
    setManualDestinations(prev => prev.filter(d => d.id !== id));
  };

  const handleManualGenerate = () => {
    if (manualDestinations.length === 0) { 
      alert('Pilih minimal 1 destinasi!'); 
      return; 
    }
    const days = calculateDays();
    if (days <= 0) { 
      alert('Format tanggal tidak valid atau minimal pilih 1 hari!'); 
      return; 
    }
    
    setIsGenerating(true);
    try {
      const daysArray: ItineraryDay[] = [];
      
      for (let dayNum = 1; dayNum <= days; dayNum++) {
        daysArray.push({
          day: dayNum,
          theme: `Eksplorasi Hari ${dayNum}`,
          slots: [],
        });
      }
      
      manualDestinations.forEach((dest, idx) => {
        const targetDay = (idx % days) + 1;
        const timeSlots = ['08:00', '11:00', '14:00', '16:00', '19:00'];
        const dayIndex = targetDay - 1;
        const slotIndex = daysArray[dayIndex].slots.length % timeSlots.length;
        
        daysArray[dayIndex].slots.push({
          content_id: dest.content_id,
          title: dest.title,
          time_slot: timeSlots[slotIndex],
        });
      });
      
      const budgetRanges = {
        hemat: { min: 150000, max: 300000 },
        normal: { min: 300000, max: 600000 },
        mewah: { min: 600000, max: 1200000 },
      };
      
      const budgetRange = budgetRanges[formBudget as keyof typeof budgetRanges] || budgetRanges.normal;
      const minBudget = budgetRange.min * days;
      const maxBudget = budgetRange.max * days;
      const formatRupiah = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;
      
      setGeneratedResult({
        summary: {
          total_days: days,
          total_destinations: manualDestinations.length,
          estimated_total_budget: `${formatRupiah(minBudget)} - ${formatRupiah(maxBudget)}`,
          highlights: manualDestinations.map(d => d.title).slice(0, 5),
        },
        days: daysArray,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = calculateDays();

    if (days <= 0 || days > 7) { 
      alert('Sistem saat ini hanya mendukung 1 hingga 7 hari eksplorasi. Silakan sesuaikan tanggal!'); 
      return; 
    }
    if (selectedInterests.length === 0) { 
      alert("Pilih minimal satu minat fokus!"); 
      return; 
    }
    
    setIsGenerating(true);
    setGeneratedResult(null);
    
    try {
      const payload = {
        start_date: `${startDate} ${startTime}:00`,
        end_date: `${endDate} ${endTime}:00`,
        days: days, // ✅ INI SOLUSI UNTUK ERROR 422 (Wajib ada untuk Backend)
        mode: 'ai',
        budget: formBudget,
        use_wishlist: useWishlist,
        interests: selectedInterests
      };
      
      const res = await fetchAPI<ItineraryGenerateResponse>('/itinerary/generate', {
        method: 'POST', 
        requireAuth: true, 
        body: JSON.stringify(payload)
      });
      
      if (res) setGeneratedResult(res);
    } catch (error) {
      console.error(error);
      alert('Gagal menghasilkan rute AI. Cek koneksi atau parameter pencarian.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveItinerary = async () => {
    if (!generatedResult || !startDate || !endDate) return;
    
    const startDateTime = `${startDate} ${startTime || '00:00'}:00`;
    const endDateTime = `${endDate} ${endTime || '23:59'}:00`;
    const daysArray = generatedResult.days || [];
    
    const totalDestinations = daysArray.reduce((acc, day) => acc + (day.slots?.length || 0), 0);
    
    const payload = {
      title: formTitle || 'Eksplorasi Nusantara',
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
        days: daysArray.map(day => ({
          day: day.day,
          theme: day.theme || `Hari ${day.day}`,
          slots: (day.slots || []).map((slot: ItinerarySlot) => ({
            content_id: slot.content_id || null,
            title: slot.title || '',
            time_slot: slot.time_slot || '08:00',
            notes: slot.notes || '',
          }))
        }))
      }
    };

    try {
      await fetchAPI('/itinerary/save', {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify(payload)
      });
      onComplete();
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan.';
      alert(`Gagal menyimpan: ${errorMessage}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-in fade-in duration-700">
      <div className="lg:col-span-5 bg-white/60 dark:bg-[#111111]/60 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] border border-white/40 dark:border-white/10 h-fit shadow-xl">
        <h2 className="font-serif text-2xl font-bold mb-8">Parameter Rencana</h2>
        
        <form onSubmit={generateMode === 'ai' ? handleGenerateAI : (e) => { e.preventDefault(); handleManualGenerate(); }} className="space-y-6">
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-3 text-slate-500">Judul Perjalanan</label>
            <input 
              type="text" 
              value={formTitle} 
              onChange={(e) => setFormTitle(e.target.value)} 
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:outline-none focus:border-slate-400 dark:focus:border-white/30 transition-colors font-medium" 
              required 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase mb-3 text-slate-500">Mulai</label>
              <div className="space-y-2">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:outline-none" required />
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase mb-3 text-slate-500">Selesai</label>
              <div className="space-y-2">
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:outline-none" required />
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:outline-none" />
              </div>
            </div>
          </div>

          {calculateDays() > 0 && (
            <div className={`p-4 rounded-2xl text-center ${calculateDays() > 7 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-900 dark:bg-white text-white dark:text-black'}`}>
              <p className="font-mono text-[10px] tracking-widest uppercase font-bold">
                Total Durasi: {calculateDays()} Hari
              </p>
              {calculateDays() > 7 && <p className="text-[9px] mt-1">Maksimal 7 hari diperbolehkan.</p>}
            </div>
          )}

          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-3 text-slate-500">Pilih Mesin</label>
            <div className="flex gap-3 bg-slate-100 dark:bg-white/5 p-1.5 rounded-full">
              <button 
                type="button" 
                onClick={() => setGenerateMode('ai')} 
                className={`flex-1 py-3 rounded-full font-mono text-xs font-bold uppercase transition-all ${generateMode === 'ai' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Kecerdasan Buatan
              </button>
              <button 
                type="button" 
                onClick={() => setGenerateMode('manual')} 
                className={`flex-1 py-3 rounded-full font-mono text-xs font-bold uppercase transition-all ${generateMode === 'manual' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Pilihan Manual
              </button>
            </div>
          </div>

          {generateMode === 'ai' ? (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
              <div>
                <label className="block font-mono text-[10px] tracking-widest uppercase mb-3 text-slate-500">Fokus Minat</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button 
                      key={cat.id} 
                      type="button" 
                      onClick={() => toggleInterest(cat.slug)} 
                      className={`px-4 py-2 rounded-full font-mono text-[10px] font-bold uppercase transition-all ${selectedInterests.includes(cat.slug) ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md' : 'bg-white/50 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10 hover:border-slate-400'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20">
                <input 
                  type="checkbox" 
                  checked={useWishlist} 
                  onChange={(e) => setUseWishlist(e.target.checked)} 
                  className="w-5 h-5 accent-slate-900 rounded-md cursor-pointer" 
                  id="wishlist-toggle"
                />
                <label htmlFor="wishlist-toggle" className="font-mono text-xs uppercase tracking-widest cursor-pointer select-none">Prioritaskan Wishlist</label>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-mono text-[10px] tracking-widest uppercase font-bold text-slate-500">Daftar Destinasi ({manualDestinations.length})</h3>
                  <button 
                    type="button" 
                    onClick={() => setShowDestinationPicker(!showDestinationPicker)} 
                    className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-black font-mono text-[10px] font-bold uppercase rounded-full hover:scale-105 transition-transform"
                  >
                    {showDestinationPicker ? 'Tutup' : 'Tambah'}
                  </button>
                </div>

                {showDestinationPicker && (
                  <div className="mb-6 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg">
                    <input 
                      type="text" 
                      placeholder="Cari destinasi..." 
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchDestinations(e.target.value);
                      }}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/50 text-sm font-medium mb-3 focus:outline-none"
                    />
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {searchResults.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors" onClick={() => addDestinationToManual(item)}>
                          <div>
                            <p className="font-bold text-sm">{item.title}</p>
                            <p className="font-mono text-[10px] text-slate-500 uppercase">{item.category.name}</p>
                          </div>
                          <span className="text-slate-400 font-mono text-lg">+</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {manualDestinations.length === 0 ? (
                  <p className="text-xs font-mono text-slate-400 italic text-center py-4">Belum ada destinasi terpilih.</p>
                ) : (
                  <ul className="space-y-3">
                    {manualDestinations.map((dest, idx) => (
                      <li key={`${dest.id}-${idx}`} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                          <span className="font-serif text-lg font-bold text-slate-300 dark:text-slate-600">{String(idx + 1).padStart(2, '0')}</span>
                          <div>
                            <p className="font-bold text-sm">{dest.title}</p>
                            <p className="font-mono text-[10px] text-slate-500 uppercase">{dest.category}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeDestinationFromManual(dest.id)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isGenerating || !startDate || !endDate || calculateDays() > 7 || (generateMode === 'manual' && manualDestinations.length === 0)} 
            className="w-full py-5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-black font-mono text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            {isGenerating ? 'MEMPROSES...' : 'EKSEKUSI PENYUSUNAN'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-7">
        {!generatedResult && !isGenerating && (
          <div className="h-full min-h-[500px] border border-dashed border-slate-300 dark:border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center bg-white/20 dark:bg-black/20 backdrop-blur-sm">
            <div className="w-16 h-16 mb-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
              <span className="font-serif text-2xl text-slate-400">?</span>
            </div>
            <p className="font-serif text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Area Pratinjau</p>
            <p className="font-mono text-xs text-slate-500 uppercase tracking-widest leading-relaxed max-w-sm">Tentukan parameter di panel kiri dan tekan eksekusi untuk melihat kalkulasi rute.</p>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-[500px] rounded-[2.5rem] flex flex-col items-center justify-center p-12 bg-white/60 dark:bg-[#111111]/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-xl">
            <div className="w-12 h-12 border-4 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mb-8" />
            <p className="font-mono text-xs font-bold uppercase tracking-widest animate-pulse text-slate-600 dark:text-slate-400">Algoritma Bekerja...</p>
          </div>
        )}

        {generatedResult && !isGenerating && (
          <div className="bg-white/60 dark:bg-[#111111]/60 p-8 md:p-10 rounded-[2.5rem] border border-white/40 dark:border-white/10 shadow-xl animate-in zoom-in-95 duration-500">
            <div className="flex justify-between items-start mb-10">
              <h3 className="font-serif text-3xl md:text-4xl font-bold leading-tight">Draft<br/>Perjalanan</h3>
              <span className="bg-slate-900 text-white dark:bg-white dark:text-black px-4 py-2 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest shadow-md">
                BERHASIL
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="p-6 bg-white/50 dark:bg-black/20 rounded-3xl border border-slate-200/50 dark:border-white/10">
                <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2">Total Durasi</p>
                <p className="font-serif text-3xl font-bold">{generatedResult.summary.total_days} Hari</p>
              </div>
              <div className="p-6 bg-white/50 dark:bg-black/20 rounded-3xl border border-slate-200/50 dark:border-white/10">
                <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2">Volume Destinasi</p>
                <p className="font-serif text-3xl font-bold">{generatedResult.summary.total_destinations} Titik</p>
              </div>
              <div className="p-6 bg-white/50 dark:bg-black/20 rounded-3xl border border-slate-200/50 dark:border-white/10 col-span-2">
                <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2">Proyeksi Anggaran</p>
                <p className="font-serif text-2xl md:text-3xl font-bold">{generatedResult.summary.estimated_total_budget}</p>
              </div>
            </div>

            <div className="mb-10">
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest mb-6 text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-4">Cuplikan Destinasi Utama</h4>
              <ul className="space-y-4">
                {generatedResult.summary.highlights?.map((h, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <span className="font-serif text-xl font-bold text-slate-300 dark:text-slate-700 italic">{String(i+1).padStart(2, '0')}</span>
                    <span className="font-bold text-sm md:text-base">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                value={formTitle} 
                onChange={(e) => setFormTitle(e.target.value)} 
                className="flex-1 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:outline-none font-medium" 
                placeholder="Beri nama untuk menyimpan..."
              />
              <button 
                onClick={handleSaveItinerary} 
                className="px-8 py-4 bg-slate-900 text-white dark:bg-white dark:text-black font-mono text-xs font-bold rounded-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl whitespace-nowrap"
              >
                SIMPAN ARSIP
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}