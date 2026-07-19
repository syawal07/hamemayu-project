import { FormEvent } from 'react';
import GlassCard from './ui/GlassCard';
import RetroButton from './ui/RetroButton';
import RetroBadge from './ui/RetroBadge';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ManualDestination {
  id: number;
  title: string;
  content_id: number;
  category: string;
  assigned_day?: number;
  assigned_time?: string;
}

interface ItinerarySummary {
  total_days: number;
  total_destinations: number;
  estimated_total_budget: string;
  highlights: string[];
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

interface ItineraryGenerateResponse {
  summary: ItinerarySummary;
  days?: ItineraryDay[];
}

interface ItineraryCreateProps {
  formTitle: string;
  setFormTitle: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  startTime: string;
  setStartTime: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  calculateDays: () => number;
  generateMode: 'ai' | 'manual';
  setGenerateMode: (mode: 'ai' | 'manual') => void;
  manualDestinations: ManualDestination[];
  setShowDestinationPicker: (show: boolean) => void;
  removeDestinationFromManual: (id: number) => void;
  setShowScheduler: (show: boolean) => void;
  categories: Category[];
  selectedInterests: string[];
  toggleInterest: (slug: string) => void;
  useWishlist: boolean;
  setUseWishlist: (use: boolean) => void;
  isGenerating: boolean;
  handleGenerate: (e: FormEvent) => void;
  generatedResult: ItineraryGenerateResponse | null;
  handleSaveItinerary: () => void;
}

export default function ItineraryCreate({
  formTitle,
  setFormTitle,
  startDate,
  setStartDate,
  startTime,
  setStartTime,
  endDate,
  setEndDate,
  endTime,
  setEndTime,
  calculateDays,
  generateMode,
  setGenerateMode,
  manualDestinations,
  setShowDestinationPicker,
  removeDestinationFromManual,
  setShowScheduler,
  categories,
  selectedInterests,
  toggleInterest,
  useWishlist,
  setUseWishlist,
  isGenerating,
  handleGenerate,
  generatedResult,
  handleSaveItinerary
}: ItineraryCreateProps) {
  const inputStyle = "w-full p-3 rounded-xl border border-green-200/50 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-green-500/50 dark:focus:ring-yellow-400/50 focus:outline-none transition-all shadow-sm text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]";
  const labelStyle = "block font-mono text-[10px] font-bold mb-2 uppercase text-slate-600 dark:text-slate-400";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <GlassCard className="lg:col-span-5 p-6 h-fit">
        <h2 className="font-mono font-bold text-sm mb-6 uppercase text-slate-800 dark:text-white border-b border-green-200/50 dark:border-slate-700 pb-2">
          Parameter Perjalanan
        </h2>

        <form onSubmit={handleGenerate} className="space-y-5">
          <div>
            <label className={labelStyle}>Judul Perjalanan</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className={inputStyle}
              placeholder="Contoh: Liburan ke Jogja 2026"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelStyle}>Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputStyle}
                required
              />
              <input
                type="time"
                lang="id-ID"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`${inputStyle} mt-2 text-sm py-2`}
              />
            </div>
            <div>
              <label className={labelStyle}>Selesai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputStyle}
                required
              />
              <input
                type="time"
                lang="id-ID"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`${inputStyle} mt-2 text-sm py-2`}
              />
            </div>
          </div>

          {calculateDays() > 0 && (
            <div className="p-3 bg-green-50/50 dark:bg-yellow-900/10 rounded-xl border border-green-200 dark:border-yellow-900/30">
              <p className="text-sm font-bold text-green-700 dark:text-yellow-400 text-center font-mono">
                Total: {calculateDays()} Hari
              </p>
            </div>
          )}

          <div>
            <label className={labelStyle}>Mode Generate</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGenerateMode('ai')}
                className={`flex-1 p-3 rounded-xl border-2 text-xs font-bold font-mono uppercase transition-all ${
                  generateMode === 'ai'
                    ? 'border-green-500 bg-green-50 dark:bg-yellow-900/20 text-green-700 dark:text-yellow-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                AI
              </button>
              <button
                type="button"
                onClick={() => setGenerateMode('manual')}
                className={`flex-1 p-3 rounded-xl border-2 text-xs font-bold font-mono uppercase transition-all ${
                  generateMode === 'manual'
                    ? 'border-slate-800 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Manual
              </button>
            </div>
          </div>

          {generateMode === 'manual' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-mono text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    Destinasi ({manualDestinations.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowDestinationPicker(true)}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md font-mono text-[10px] font-bold uppercase transition-colors"
                  >
                    + Tambah
                  </button>
                </div>

                {manualDestinations.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">Belum ada destinasi dipilih.</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {manualDestinations.map((dest, idx) => (
                      <li key={`${dest.id}-${idx}`} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg text-xs shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{dest.title}</p>
                            <p className="text-[10px] text-slate-500">{dest.category}</p>
                            {dest.assigned_day && (
                              <p className="text-[10px] text-green-600 dark:text-yellow-400 mt-1 font-mono">
                                Hari {dest.assigned_day} - {dest.assigned_time || 'Belum diatur'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setShowScheduler(true)} className="text-slate-400 hover:text-green-600 p-1 transition-colors" title="Atur Jadwal">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                          <button type="button" onClick={() => removeDestinationFromManual(dest.id)} className="text-slate-400 hover:text-red-500 p-1 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <RetroButton
                type="button"
                fullWidth
                disabled={manualDestinations.length === 0}
                onClick={() => setShowScheduler(true)}
              >
                ATUR JADWAL MANUAL
              </RetroButton>
            </div>
          )}

          {generateMode === 'ai' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 space-y-4">
              <div>
                <label className={labelStyle}>Minat / Kategori</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleInterest(cat.slug)}
                      className={`px-3 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase transition-all shadow-sm ${
                        selectedInterests.includes(cat.slug)
                          ? 'bg-green-600 text-white border border-green-700 dark:bg-yellow-400 dark:text-slate-900 dark:border-yellow-500'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-yellow-500'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200/50 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
                <input
                  type="checkbox"
                  checked={useWishlist}
                  onChange={(e) => setUseWishlist(e.target.checked)}
                  className="w-4 h-4 accent-green-600 dark:accent-yellow-400"
                />
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Prioritaskan Wishlist saya
                </label>
              </div>

              <RetroButton
                type="submit"
                fullWidth
                disabled={isGenerating || !startDate || !endDate}
              >
                {isGenerating ? 'MEMPROSES...' : 'GENERATE ITINERARY'}
              </RetroButton>
            </div>
          )}
        </form>
      </GlassCard>

      <div className="lg:col-span-7">
        {!generatedResult && !isGenerating && (
          <GlassCard className="h-full min-h-100 flex flex-col items-center justify-center p-8 text-center border-dashed border-2 bg-transparent shadow-none border-slate-300 dark:border-slate-700">
            <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl"> </div>
            <p className="font-mono text-slate-500 text-sm">Pilih parameter & klik Generate untuk mulai</p>
          </GlassCard>
        )}

        {isGenerating && (
          <GlassCard className="h-full min-h-100 flex flex-col items-center justify-center p-8">
            <div className="w-12 h-12 border-4 border-green-200 dark:border-slate-700 border-t-green-600 dark:border-t-yellow-400 rounded-full animate-spin mb-4"></div>
            <p className="font-mono text-sm font-bold uppercase animate-pulse text-green-600 dark:text-yellow-400">Menyusun rute optimal...</p>
          </GlassCard>
        )}

        {generatedResult && !isGenerating && (
          <GlassCard className="p-6 animate-in slide-in-from-right-8 duration-500">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">Hasil Generate</h3>
              <RetroBadge status="success">SUKSES</RetroBadge>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 font-mono text-sm">
              <div className="p-3 bg-white/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-500 uppercase">Hari</p>
                <p className="font-bold text-lg text-slate-900 dark:text-white">{generatedResult.summary.total_days}</p>
              </div>
              <div className="p-3 bg-white/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-500 uppercase">Destinasi</p>
                <p className="font-bold text-lg text-slate-900 dark:text-white">{generatedResult.summary.total_destinations}</p>
              </div>
              <div className="p-3 bg-green-50/50 dark:bg-yellow-900/10 rounded-xl col-span-3 border border-green-200 dark:border-yellow-900/30">
                <p className="text-[10px] text-slate-500 uppercase">Estimasi Biaya</p>
                <p className="font-bold text-lg text-green-700 dark:text-yellow-400">{generatedResult.summary.estimated_total_budget}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-mono text-xs font-bold uppercase mb-3 text-slate-700 dark:text-slate-300">Highlight Destinasi</h4>
              <ul className="space-y-2">
                {generatedResult.summary.highlights?.map((h, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-yellow-900/30 text-green-700 dark:text-yellow-400 flex items-center justify-center text-[10px] font-bold font-mono">
                      {i + 1}
                    </span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
              <label className={labelStyle}>Nama untuk Disimpan</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={inputStyle}
                />
                <RetroButton onClick={handleSaveItinerary} className="whitespace-nowrap">
                  SIMPAN
                </RetroButton>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}