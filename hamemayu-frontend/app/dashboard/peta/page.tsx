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
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl animate-pulse">
        <div className="w-10 h-10 border-4 border-slate-800/20 dark:border-white/20 border-t-slate-800 dark:border-t-white rounded-full animate-spin mb-3" />
        <p className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-widest">Memuat Peta...</p>
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
        console.error(err);
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
    <div className="relative w-[calc(100%+2rem)] md:w-[calc(100%+4rem)] lg:w-[calc(100%+6rem)] h-[calc(100vh-60px)] md:h-screen -ml-4 -mt-4 md:-ml-8 md:-mt-8 lg:-ml-12 overflow-hidden bg-slate-50 dark:bg-[#0a0a0a] animate-in fade-in duration-500">
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-1000 pointer-events-none">
        <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 p-3 md:p-4 rounded-2xl shadow-lg pointer-events-auto inline-flex flex-col">
          <h1 className="text-xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white mb-0.5 md:mb-1 leading-none tracking-tight">
            Peta Global
          </h1>
          <p className="font-mono text-slate-600 dark:text-slate-400 text-[8px] md:text-[9px] tracking-[0.2em] uppercase font-bold">
            Pantau & Navigasi
          </p>
        </div>
      </div>

      <div className="w-full h-full z-0 relative">
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
  );
}