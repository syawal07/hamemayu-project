"use client";

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { fetchAPI } from '../../lib/api';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface ContentItem {
  id: number;
  title: string;
  slug: string;
  lat: number | null;
  lng: number | null;
  category: { name: string };
}

interface ApiListResponse {
  data?: ContentItem[];
}

// Pusat koordinat Tugu Jogja dipindah ke luar komponen agar tidak memicu re-render
const DEFAULT_CENTER: [number, number] = [-7.7829, 110.3671];

const MapComponent = dynamic(
  () => import('./MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 dark:bg-slate-800 border-4 border-slate-900 dark:border-white/20 brutal-shadow animate-pulse">
        <div className="w-16 h-16 border-4 border-golden-heritage border-t-slate-900 rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-slate-500 font-bold uppercase">MENGAKTIFKAN RADAR SATELIT & RUTE...</p>
      </div>
    )
  }
);

export default function PetaPage() {
  const searchParams = useSearchParams();
  const focusLat = searchParams.get('lat');
  const focusLng = searchParams.get('lng');
  const focusSlug = searchParams.get('focus');

  const [markers, setMarkers] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const mapCenter: [number, number] = useMemo(() => {
    if (focusLat && focusLng) {
      return [parseFloat(focusLat), parseFloat(focusLng)];
    }
    return DEFAULT_CENTER;
  }, [focusLat, focusLng]);

  useEffect(() => {
    let isMounted = true;

    const loadMarkers = async () => {
      try {
        const res = await fetchAPI<ContentItem[] | ApiListResponse>('/contents?per_page=100'); 
        
        const dataArray = Array.isArray(res) ? res : (res as ApiListResponse)?.data || [];
        
        const validMarkers = dataArray.filter((item: ContentItem) => item.lat !== null && item.lng !== null);
        
        if (isMounted) {
          setMarkers(validMarkers);
        }
      } catch (error) {
        console.error("Gagal memuat radar:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMarkers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
            RADAR_INTERAKTIF
          </h1>
          <p className="font-mono text-slate-600 dark:text-slate-400 text-sm">
            NAVIGASI & PEMANTAUAN TITIK DESTINASI (OSRM POWERED)
          </p>
        </div>
      </div>

      <div className="flex-1 relative border-4 border-slate-900 dark:border-white/20 brutal-shadow overflow-hidden bg-slate-200 dark:bg-slate-800 z-0">
        {!loading && (
           <MapComponent 
             markers={markers} 
             center={mapCenter} 
             focusSlug={focusSlug} 
           />
        )}
      </div>
    </div>
  );
}