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

const DEFAULT_CENTER: [number, number] = [-7.7829, 110.3671];

const MapComponent = dynamic(
  () => import('./MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white/40 dark:bg-black/20 backdrop-blur-xl animate-pulse rounded-[2.5rem]">
        <div className="w-12 h-12 border-4 border-slate-900/30 dark:border-white/30 border-t-slate-900 dark:border-t-white rounded-full animate-spin mb-4" />
        <p className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-widest">Menyiapkan Radar Peta...</p>
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

  const routeDestinations = useMemo(() => {
    const routeParam = searchParams.get('route');
    if (routeParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(routeParam));
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (err) {
        console.error('Gagal memproses parameter rute:', err);
      }
    }
    return [];
  }, [searchParams]);

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
        console.error(error);
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
    <div className="animate-in fade-in duration-500 h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] flex flex-col max-w-7xl mx-auto w-full pb-6 px-4 md:px-8">
      <div className="mb-6 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4 mt-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-2 drop-shadow-sm leading-tight">
            Peta Global
          </h1>
          <p className="font-mono text-slate-500 dark:text-slate-400 text-xs tracking-widest uppercase">
            Pemantauan Titik Destinasi & Navigasi
          </p>
        </div>
      </div>

      <div className="flex-1 relative border border-white/40 dark:border-white/10 shadow-xl overflow-hidden bg-white/60 dark:bg-[#111111]/60 backdrop-blur-2xl rounded-[2.5rem] z-0 p-2 md:p-4">
        <div className="w-full h-full rounded-[2rem] overflow-hidden relative">
          {!loading && (
             <MapComponent 
               markers={markers} 
               center={mapCenter} 
               focusSlug={focusSlug}
               routeDestinations={routeDestinations}
             />
          )}
        </div>
      </div>
    </div>
  );
}