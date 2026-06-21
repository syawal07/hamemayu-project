// app/dashboard/peta/MapComponent.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
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
  routeDestinations?: { lat: number; lng: number; title: string }[];
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

export default function MapComponent({ markers, center, focusSlug, routeDestinations }: MapComponentProps) {
  const searchParams = useSearchParams();
  const focusLat = searchParams.get('lat');
  const focusLng = searchParams.get('lng');

  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'mencari' | 'aktif' | 'ditolak'>('mencari');
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [hasAttemptedRoute, setHasAttemptedRoute] = useState(false);

  // GPS Tracking
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsStatus('ditolak');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLoc(newLoc);
        setGpsStatus('aktif');
      },
      (error) => {
        console.warn("GPS Error:", error.message);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('ditolak');
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Route Calculation - Only run when we have enough points
  useEffect(() => {
    if (!routeDestinations || routeDestinations.length === 0) {
      setRouteCoordinates([]);
      return;
    }

    // Validasi destinasi
    const validDestinations = routeDestinations.filter(d => 
      typeof d.lat === 'number' && typeof d.lng === 'number' && 
      !isNaN(d.lat) && !isNaN(d.lng)
    );

    if (validDestinations.length === 0) {
      console.warn("⚠️ Tidak ada destinasi valid untuk routing.");
      return;
    }

    // Kalau GPS belum ready, tunggu dulu (maksimal 3x percobaan)
    if (!userLoc && gpsStatus === 'mencari' && !hasAttemptedRoute) {
      console.log("⏳ Menunggu GPS...");
      const timeout = setTimeout(() => {
        setHasAttemptedRoute(true);
      }, 3000); // Tunggu 3 detik untuk GPS
      return () => clearTimeout(timeout);
    }

    const fetchRoute = async () => {
      setRouteLoading(true);
      setRouteCoordinates([]);

      try {
        // Format OSRM: Longitude,Latitude
        const points: string[] = [];

        // Tambah User Location di awal JIKA ada
        if (userLoc && !isNaN(userLoc[0]) && !isNaN(userLoc[1])) {
          points.push(`${userLoc[1]},${userLoc[0]}`); // lng,lat
        }

        // Tambah Destinasi
        validDestinations.forEach(d => {
          points.push(`${d.lng},${d.lat}`); // lng,lat
        });

        // OSRM butuh minimal 2 titik
        if (points.length < 2) {
          console.log("ℹ️ Hanya ada 1 titik, tampilkan marker saja tanpa rute.");
          setRouteLoading(false);
          return;
        }

        const coordsStr = points.join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;

        console.log("🗺️ Fetching OSRM Route:", url);

        const res = await fetch(url);
        
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0 && data.routes[0].geometry) {
            const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
            setRouteCoordinates(coords);
            console.log("✅ Route berhasil digambar!", coords.length, "points");
          } else {
            console.warn("⚠️ OSRM tidak menemukan rute.");
          }
        } else {
          console.error("❌ OSRM Request Failed:", res.status);
        }
      } catch (err) {
        console.warn("⚠️ OSRM routing error:", err);
      } finally {
        setRouteLoading(false);
        setHasAttemptedRoute(true);
      }
    };

    fetchRoute();
  }, [routeDestinations, userLoc, gpsStatus, hasAttemptedRoute]);

  const autoTargetLoc = useMemo<[number, number] | null>(() => {
    if (focusLat && focusLng) return [parseFloat(focusLat), parseFloat(focusLng)];
    return null;
  }, [focusLat, focusLng]);

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
            <Popup><div className="font-mono font-bold text-[10px] tracking-widest text-slate-800 text-center py-1">POSISI ANDA</div></Popup>
          </Marker>
        )}

        {isTargetNotInMarkers && autoTargetLoc && (
          <Marker position={autoTargetLoc} icon={focusIcon}>
            <Popup><div className="font-mono font-bold text-[10px] tracking-widest text-slate-800 text-center py-1">TITIK DESTINASI</div></Popup>
          </Marker>
        )}

        {/* Tampilkan Garis Rute */}
        {routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="#16a34a" weight={5} opacity={0.8} dashArray="5, 10" />
        )}

        {/* Tampilkan Marker untuk Titik Rute */}
        {routeDestinations?.map((dest, i) => (
          <Marker key={`route-${i}`} position={[dest.lat, dest.lng]} icon={focusIcon}>
            <Popup>
              <div className="font-mono font-bold text-[10px] tracking-widest text-slate-800 text-center py-1">
                {i + 1}. {dest.title}
              </div>
            </Popup>
          </Marker>
        ))}

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
                    <Link 
                      href={`/dashboard/destinasi/${marker.slug}`}
                      className="bg-slate-100 text-slate-700 text-center font-mono font-bold text-[10px] py-2.5 px-4 rounded-xl hover:bg-slate-200 transition-colors uppercase border border-slate-200"
                    >
                      DETAIL ARSIP
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* ✅ Badge Status yang Lebih Pintar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-1000 bg-white/80 dark:bg-brutal-dark/80 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 px-5 py-2.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-3 pointer-events-none text-slate-800 dark:text-slate-200">
        {/* GPS Indicator */}
        <div className={`w-2.5 h-2.5 rounded-full ${
          gpsStatus === 'aktif' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
          gpsStatus === 'ditolak' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 
          'bg-yellow-500 animate-pulse'
        }`}></div>
        
        {/* Status Text */}
        <span className={gpsStatus === 'ditolak' ? 'text-red-600 dark:text-red-400' : ''}>
          {routeCoordinates.length > 0 ? (
            <span className="text-green-600 dark:text-green-400">
              ✅ RUTE AKTIF ({routeCoordinates.length} titik)
            </span>
          ) : routeLoading ? (
            'HITUNG RUTE...'
          ) : gpsStatus === 'aktif' ? (
            'GPS MELACAK...'
          ) : gpsStatus === 'ditolak' ? (
            'GPS DITOLAK'
          ) : (
            'MENCARI SINYAL...'
          )}
        </span>

        {/* Route Info */}
        {routeDestinations && routeDestinations.length > 0 && (
          <span className="hidden md:inline text-slate-500 dark:text-slate-400 ml-2 border-l border-slate-300 dark:border-slate-600 pl-3">
            {routeDestinations.length} destinasi
          </span>
        )}
      </div>
    </>
  );
}