"use client";

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { fetchAPI } from '../../lib/api';
import { extractWishlistCoords } from '../../lib/itinerary-utils';
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
      <div className="w-full h-full flex flex-col items-center justify-center bg-white/50 dark:bg-brutal-dark/50 backdrop-blur-xl animate-pulse">
        <div className="w-12 h-12 border-4 border-green-700/30 dark:border-yellow-400/30 border-t-green-700 dark:border-t-yellow-400 rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mengaktifkan Radar Satelit...</p>
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
  const [routeDestinations, setRouteDestinations] = useState<{lat: number, lng: number, title: string}[]>([]);

  const mapCenter: [number, number] = useMemo(() => {
    if (focusLat && focusLng) {
      return [parseFloat(focusLat), parseFloat(focusLng)];
    }
    return DEFAULT_CENTER;
  }, [focusLat, focusLng]);

  // ✅ Baca query param 'route' untuk navigasi itinerary/wishlist
  useEffect(() => {
    const routeParam = searchParams.get('route');
    if (routeParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(routeParam));
        if (Array.isArray(parsed)) {
          setRouteDestinations(parsed);
        }
      } catch (err) {
        console.error('Failed to parse route param:', err);
      }
    }
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
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] w-full">
      <div className="px-6 mb-6">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2">
          Radar Interaktif
        </h1>
        <p className="font-mono text-slate-600 dark:text-slate-400 text-xs tracking-widest uppercase">
          Navigasi & Pemantauan Titik Destinasi
        </p>
      </div>
      
      <div className="w-full h-full">
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