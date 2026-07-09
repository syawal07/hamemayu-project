"use client";

import { useEffect, useState } from 'react';
import { fetchAPI } from '../../lib/api';
import Image from 'next/image';
import Link from 'next/link';

// UPDATE INTERFACE
interface WishlistItem {
  id: number;
  notes: string | null;
  visited: boolean;
  priority: number;
  plannable?: {
    id: number;
    slug: string;
    title: string;
    category: string | { name: string };
    image: string | null;
    cover_image?: string | null;
    type: string;
  };
  content?: {
    id: number;
    slug: string;
    title: string;
    category: { name: string };
    cover_image: string | null;
  };
}

export default function WishlistPage() {
  const [wishlists, setWishlists] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // STATE UNTUK INLINE EDIT
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftNote, setDraftNote] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadWishlists = async () => {
      if (isMounted) setLoading(true);
      try {
        const res = await fetchAPI<any>('/wishlist', { requireAuth: true });
        const data = res?.data || res || [];
        if (Array.isArray(data) && isMounted) setWishlists(data);
      } catch (error) { console.error(error); }
      finally { if (isMounted) setLoading(false); }
    };
    loadWishlists();
    return () => { isMounted = false; };
  }, []);

  // FUNGSI START EDIT
  const startEditing = (item: WishlistItem) => {
    setEditingId(item.id);
    setDraftNote(item.notes || '');
  };

  // FUNGSI SAVE NOTE
  const saveNote = async (item: WishlistItem) => {
    // Cegah save jika konten sama
    if (item.notes === draftNote) {
      setEditingId(null);
      return;
    }

    try {
      await fetchAPI(`/wishlist/${item.id}`, {
        method: 'PUT', 
        requireAuth: true,
        body: JSON.stringify({ 
          notes: draftNote, 
          visited: item.visited, // Kirim data lain juga biar aman
          priority: item.priority 
        })
      });
      
      // Update state lokal
      setWishlists(prev => prev.map(w => w.id === item.id ? { ...w, notes: draftNote } : w));
    } catch (error) { 
      console.error(error); 
      alert("Gagal menyimpan catatan!");
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('HAPUS DATA INI DARI PANGKALAN WISHLIST?')) return;
    try {
      await fetchAPI(`/wishlist/${id}`, { method: 'DELETE', requireAuth: true });
      setWishlists(prev => prev.filter(w => w.id !== id));
    } catch (error) { console.error(error); }
  };

  const toggleVisited = async (item: WishlistItem) => {
    try {
      await fetchAPI(`/wishlist/${item.id}`, {
        method: 'PUT', requireAuth: true,
        body: JSON.stringify({ visited: !item.visited, priority: item.priority })
      });
      setWishlists(prev => prev.map(w => w.id === item.id ? { ...w, visited: !w.visited } : w));
    } catch (error) { console.error(error); }
  };

  // Helper data item
  const getItemData = (item: WishlistItem) => {
    const data = item.plannable || item.content;
    if (!data) return null;
    let imageUrl = data.image || data.cover_image;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `http://localhost/storage/${imageUrl}`;
    }
    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      category: typeof data.category === 'string' ? data.category : data.category?.name,
      image: imageUrl,
      type: (data as any).type || 'App\Models\Content'
    };
  };

  const navigateToItem = async (item: WishlistItem) => {
    // Logic navigasi (sama seperti sebelumnya)
    try {
      const { extractWishlistCoords } = await import('../../lib/itinerary-utils');
      const destinations = await extractWishlistCoords([item]);
      if (destinations.length === 0) {
        alert(`Koordinat untuk "${item.plannable?.title || item.content?.title}" belum tersedia.`);
        return;
      }
      window.location.href = `/dashboard/peta?route=${encodeURIComponent(JSON.stringify(destinations))}`;
    } catch (err) { console.error("Nav item failed:", err); alert("Gagal membuka peta."); }
  };

  const navigateAll = async () => {
    try {
      const { extractWishlistCoords } = await import('../../lib/itinerary-utils');
      const destinations = await extractWishlistCoords(wishlists);
      if (destinations.length === 0) { alert("Tidak ada destinasi dengan koordinat."); return; }
      window.location.href = `/dashboard/peta?route=${encodeURIComponent(JSON.stringify(destinations))}`;
    } catch (err) { console.error("Nav all failed:", err); alert("Gagal memuat peta."); }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2 drop-shadow-sm">
            Pangkalan Wishlist
          </h1>
          <p className="font-mono text-slate-600 dark:text-slate-400 text-xs tracking-widest uppercase">
            Manajemen Target Destinasi Personal
          </p>
        </div>
        <Link href="/dashboard/destinasi" className="bg-green-700 text-white dark:bg-yellow-400 dark:text-slate-900 px-6 py-3.5 rounded-full font-mono text-xs font-bold shadow-[0_4px_12px_rgba(22,101,52,0.3)] dark:shadow-[0_4px_12px_rgba(250,204,21,0.3)] hover:scale-105 active:scale-95 transition-all uppercase text-center flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          TAMBAH TARGET BARU
        </Link>
      </div>

      {wishlists.length > 0 && (
        <div className="mb-6 flex justify-end">
          <button onClick={navigateAll} className="inline-flex items-center gap-2 bg-green-700 dark:bg-yellow-400 text-white dark:text-slate-900 font-mono text-xs font-bold px-6 py-3 rounded-xl hover:bg-green-800 dark:hover:bg-yellow-500 transition-all shadow-sm active:scale-95 uppercase tracking-wide">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 3V4m0 0L9 7" />
            </svg>
            Navigasi Semua ({wishlists.length})
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-5">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-3xl animate-pulse border border-white/50 dark:border-slate-700/50 shadow-sm"></div>)}</div>
      ) : wishlists.length > 0 ? (
        <div className="flex flex-col gap-6">
          {wishlists.map(item => {
            const itemData = getItemData(item);
            if (!itemData) return null;
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} className={`flex flex-col sm:flex-row bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 shadow-[0_8px_32px_rgba(15,28,53,0.04)] rounded-3xl p-2.5 transition-all duration-500 group ${item.visited ? 'opacity-80' : 'hover:shadow-[0_12px_40px_rgba(15,28,53,0.08)] hover:-translate-y-1'}`}>
                
                <div className="relative w-full sm:w-56 h-48 sm:h-auto rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
                  {itemData.image ? (
                    <div className={`absolute inset-0 w-full h-full transition-transform duration-700 ease-out group-hover:scale-105 ${item.visited ? 'grayscale opacity-80' : ''}`}>
                      <Image src={itemData.image} alt={itemData.title} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                      <svg className="w-8 h-8 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      [ NO_IMAGE ]
                    </div>
                  )}
                  {item.visited && (
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full font-mono text-[9px] font-bold tracking-widest flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      TERKUNJUNGI
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-3 mb-2">
                      <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight line-clamp-2">
                        {itemData.title}
                      </h3>
                      <span className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full font-mono text-[9px] font-bold uppercase tracking-widest whitespace-nowrap shadow-sm w-fit">
                        {itemData.category || 'UMUM'}
                      </span>
                    </div>

                    {/* INLINE EDIT CATATAN */}
                    {isEditing ? (
                      <div className="mb-6 relative group/edit">
                        <textarea
                          value={draftNote}
                          onChange={(e) => setDraftNote(e.target.value)}
                          onBlur={() => saveNote(item)}
                          onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveNote(item);
                          }}
                          autoFocus
                          className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/50 border border-green-500 dark:border-green-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none font-mono text-slate-600 dark:text-slate-400 min-h-[80px] leading-relaxed shadow-sm"
                          placeholder="Tulis catatan di sini (Ctrl+Enter untuk simpan)..."
                        />
                        <div className="absolute bottom-2 right-3 text-[9px] text-slate-400 font-mono pointer-events-none">
                          Auto-save saat klik luar • Ctrl+Enter
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => startEditing(item)}
                        className="bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-500 transition-colors cursor-text group/note mb-6 min-h-[50px] flex items-center"
                      >
                        <p className="font-mono text-xs text-slate-600 dark:text-slate-400 leading-relaxed break-words w-full">
                          <span className="font-bold text-slate-800 dark:text-slate-200 group-hover/note:text-green-600 dark:group-hover/note:text-green-400 transition-colors mr-2">Catatan:</span> 
                          {item.notes || <span className="italic text-slate-400">Klik untuk tambah catatan...</span>}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-auto">
                    <button onClick={() => navigateToItem(item)} className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all uppercase flex items-center justify-center gap-2 border shadow-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      NAVIGASI
                    </button>
                    <button onClick={() => toggleVisited(item)} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all uppercase flex items-center justify-center gap-2 border shadow-sm ${item.visited ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.visited ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"} /></svg>
                      {item.visited ? 'TERKUNJUNGI' : 'TANDAI SELESAI'}
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="px-5 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-mono text-xs font-bold border border-red-200 dark:border-red-900/50 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all uppercase flex items-center gap-2 shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      <span className="hidden sm:inline">HAPUS</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/40 dark:bg-brutal-dark/40 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 p-16 rounded-[2.5rem] text-center shadow-sm flex flex-col items-center justify-center mt-6">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-white dark:border-slate-700 shadow-inner">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
          <p className="font-mono text-slate-800 dark:text-slate-200 font-bold uppercase tracking-widest text-base mb-4">Pangkalan Wishlist Kosong</p>
          <Link href="/dashboard/destinasi" className="text-green-700 dark:text-yellow-400 hover:text-green-800 dark:hover:text-yellow-500 font-mono text-xs font-bold tracking-widest flex items-center gap-2 transition-colors">
            MULAI EKSPLORASI SEKARANG <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      )}
    </div>
  );
}