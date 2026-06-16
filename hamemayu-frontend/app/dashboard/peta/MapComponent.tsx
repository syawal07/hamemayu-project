"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet-routing-machine';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface ContentItem {
  id: number;
  title: string;
  slug: string;
  lat: number | null;
  lng: number | null;
  category: { name: string };
}

interface MapComponentProps {
  markers: ContentItem[];
  center: [number, number];
  focusSlug?: string | null;
}

const createGlassIcon = (fillColor: string, strokeColor: string, scale: number = 1) => {
  return L.divIcon({
    className: 'bg-transparent',
    html: `
      <div class="relative transition-transform duration-300 hover:-translate-y-2 group" style="width: ${36 * scale}px; height: ${44 * scale}px;">
        <svg viewBox="0 0 24 24" class="w-full h-full drop-shadow-md transition-all duration-300 group-hover:drop-shadow-xl">
          <path fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5" stroke-linejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3.5" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="1.5"/>
        </svg>
      </div>
    `,
    iconSize: [36 * scale, 44 * scale],
    iconAnchor: [18 * scale, 44 * scale],
    popupAnchor: [0, -40 * scale],
  });
};

const customIcon = createGlassIcon('rgba(255, 255, 255, 0.95)', '#166534', 1); 
const focusIcon = createGlassIcon('rgba(250, 204, 21, 0.95)', '#854D0E', 1.2); 
const userIcon = createGlassIcon('rgba(34, 197, 94, 0.95)', '#14532D', 1);

function RoutingMachine({ userLocation, targetLocation }: { userLocation: [number, number] | null, targetLocation: [number, number] | null }) {
  const map = useMap();
  const routingRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!routingRef.current) {
      routingRef.current = L.Routing.control({
        // @ts-expect-error: Mengabaikan peringatan tipe data karena property ini valid di library aslinya
        createMarker: function() { return null; },
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          language: 'id'
        }),
        lineOptions: {
          styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0
        },
        show: false, 
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
      }).addTo(map);
    }

    if (userLocation && targetLocation) {
      routingRef.current.setWaypoints([
        L.latLng(userLocation[0], userLocation[1]),
        L.latLng(targetLocation[0], targetLocation[1])
      ]);
    } else {
      routingRef.current.setWaypoints([]);
    }

  }, [userLocation, targetLocation, map]);

  return null;
}

export default function MapComponent({ markers, center, focusSlug }: MapComponentProps) {
  const searchParams = useSearchParams();
  const focusLat = searchParams.get('lat');
  const focusLng = searchParams.get('lng');

  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  
  // State baru untuk melacak status GPS demi pengalaman UX yang lebih baik
  const [gpsStatus, setGpsStatus] = useState<'mencari' | 'aktif' | 'ditolak'>('mencari');
  
  const [routeStartLoc, setRouteStartLoc] = useState<[number, number] | null>(null);
  const [manualTarget, setManualTarget] = useState<[number, number] | null>(null);

useEffect(() => {
    // Mengecek apakah browser tidak memiliki fitur GPS
    if (!("geolocation" in navigator)) {
      // Menggunakan setTimeout untuk mengubah status secara asinkron agar tidak memicu cascading render
      setTimeout(() => setGpsStatus('ditolak'), 0);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLoc([position.coords.latitude, position.coords.longitude]);
        setGpsStatus('aktif');
      },
      (error) => {
        console.warn("Gagal membaca sinyal GPS: ", error.message);
        // Menangkap error jika user menolak akses lokasi
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('ditolak');
        }
      },
      { 
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const autoTargetLoc = useMemo<[number, number] | null>(() => {
    if (focusLat && focusLng) {
      return [parseFloat(focusLat), parseFloat(focusLng)];
    }
    return null;
  }, [focusLat, focusLng]);

  const activeTargetLoc = manualTarget || autoTargetLoc;

  const handleMulaiRute = (lat: number, lng: number) => {
    if (!userLoc) {
      alert("MOHON IZINKAN AKSES LOKASI (GPS) DI BROWSER ANDA UNTUK MENGAKTIFKAN RUTE.");
      return;
    }
    setRouteStartLoc(userLoc);
    setManualTarget([lat, lng]);
  };

  const isTargetNotInMarkers = focusSlug && !markers.some(m => m.slug === focusSlug);

  return (
    <>
      <MapContainer 
        center={center} 
        zoom={focusSlug ? 15 : 12} 
        className="w-full h-full z-0 font-sans"
        maxZoom={18}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {userLoc && (
          <Marker position={userLoc} icon={userIcon}>
            <Popup>
              <div className="font-mono font-bold text-[10px] tracking-widest text-slate-800 text-center py-1">
                POSISI ANDA
              </div>
            </Popup>
          </Marker>
        )}

        <RoutingMachine userLocation={routeStartLoc} targetLocation={activeTargetLoc} />

        {isTargetNotInMarkers && autoTargetLoc && (
          <Marker position={autoTargetLoc} icon={focusIcon}>
             <Popup>
                <div className="font-mono font-bold text-[10px] tracking-widest text-slate-800 text-center py-1">
                  TITIK DESTINASI
                </div>
             </Popup>
          </Marker>
        )}

        <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
          {markers.map((marker) => {
            const isFocused = marker.slug === focusSlug;
            return (
              <Marker 
                key={marker.id} 
                position={[marker.lat!, marker.lng!]}
                icon={isFocused ? focusIcon : customIcon}
                zIndexOffset={isFocused ? 1000 : 0}
              >
                <Popup className="rounded-2xl overflow-hidden shadow-xl border-0">
                  <div className="flex flex-col gap-3 p-1 min-w-50">
                    <div className="bg-slate-100 text-green-800 px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-widest rounded-full w-fit border border-slate-200">
                      {marker.category?.name || 'UMUM'}
                    </div>
                    <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight m-0 tracking-tight">
                      {marker.title}
                    </h3>
                    
                    <div className="flex flex-col gap-2 mt-2">
                      <button 
                        onClick={() => handleMulaiRute(marker.lat!, marker.lng!)}
                        className="bg-green-600 text-white text-center font-mono font-bold text-[10px] py-2.5 px-4 rounded-xl hover:bg-green-700 shadow-sm transition-all uppercase cursor-pointer flex items-center justify-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        NAVIGASI RUTE
                      </button>
                      <Link 
                        href={`/dashboard/destinasi/${marker.slug}`}
                        className="bg-slate-100 text-slate-700 text-center font-mono font-bold text-[10px] py-2.5 px-4 rounded-xl hover:bg-slate-200 transition-colors uppercase border border-slate-200"
                      >
                        DETAIL ARSIP
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Floating GPS Badge dengan Penanganan Error */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-1000 bg-white/80 dark:bg-brutal-dark/80 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 px-5 py-2.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-3 pointer-events-none text-slate-800 dark:text-slate-200">
        <div className={`w-2.5 h-2.5 rounded-full ${
          gpsStatus === 'aktif' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
          gpsStatus === 'ditolak' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 
          'bg-slate-300 dark:bg-slate-600'
        }`}></div>
        <span className={gpsStatus === 'ditolak' ? 'text-red-600 dark:text-red-400' : ''}>
          {gpsStatus === 'aktif' ? 'GPS MELACAK...' : 
           gpsStatus === 'ditolak' ? 'AKSES DITOLAK' : 
           'MENCARI SINYAL...'}
        </span>
      </div>
    </>
  );
}