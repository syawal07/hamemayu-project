// app/dashboard/peta/MapComponent.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  name: string;
}

interface RouteInfo {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

// ✅ Icons Configuration
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
const userIcon = createGlassIcon('rgba(34, 197, 94, 0.95)', '#14532D', 1);

// ✅ Custom Icon dengan Angka Urutan (Gaya Google Maps)
const createWaypointIcon = (number: number) => {
  return L.divIcon({
    className: 'waypoint-marker',
    html: `<div style="background-color: #854D0E; color: white; width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); border: 3px solid white;">
             <span style="transform: rotate(45deg); font-family: sans-serif; font-weight: 800; font-size: 18px;">${number}</span>
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -45]
  });
};

function FitMapView({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }, [coordinates, map]);

  return null;
}

// ✅ Helper: Hitung jarak 2 titik (Haversine formula)
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = lat1 * Math.PI/180, φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180, Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function MapComponent({ markers, center, focusSlug, routeDestinations }: MapComponentProps) {
  const searchParams = useSearchParams();
  const focusLat = searchParams.get('lat');
  const focusLng = searchParams.get('lng');

  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'mencari' | 'aktif' | 'ditolak'>('mencari');
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  
  // ✅ Refs untuk throttling
  const lastRouteCalcRef = useRef<number>(0);
  const prevUserLocRef = useRef<[number, number] | null>(null);
  const MIN_MOVE_METERS = 15; // Recalculate cuma kalau udah geser >15 meter

  // ✅ GPS Tracking dengan Throttling
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      Promise.resolve().then(() => setGpsStatus('ditolak'));
      return;
    }
  

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
        
        // Hitung jarak dari userLoc terakhir
        let shouldUpdate = false;
        if (userLoc) {
          const dist = getDistanceFromLatLonInMeters(userLoc[0], userLoc[1], newLoc[0], newLoc[1]);
          if (dist > MIN_MOVE_METERS) shouldUpdate = true;
        } else {
          shouldUpdate = true; // First location
        }

        if (shouldUpdate) {
          setUserLoc(newLoc);
          setGpsStatus('aktif');
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setGpsStatus('ditolak');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userLoc]);

  // ✅ Fetch Route dengan OSRM - IMPROVED
  useEffect(() => {
    // Reset route kalau destinations kosong
    if (!routeDestinations || routeDestinations.length === 0) {
      Promise.resolve().then(() => {
        setRouteCoordinates([]);
        setRouteInfo(null);
      });
      return;
    }
  

    const fetchRoute = async () => {
      // ✅ Throttle: hanya recalculate kalau user bergerak signifikan ATAU first load
      const now = Date.now();
      const timeSinceLastCalc = now - lastRouteCalcRef.current;
      
      // Kalau destinations berubah, langsung hitung (skip throttle)
      const destinationsChanged = prevUserLocRef.current === null && userLoc === null;
      
      // Kalau user masih di lokasi yang sama (< 15 meter), skip
      if (userLoc && prevUserLocRef.current) {
        const dist = getDistanceFromLatLonInMeters(
          prevUserLocRef.current[0], 
          prevUserLocRef.current[1], 
          userLoc[0], 
          userLoc[1]
        );
        if (dist < MIN_MOVE_METERS && timeSinceLastCalc < 10000) {
          return; // Masih terlalu dekat & terlalu cepat, skip
        }
      }
      
      // Update throttle timer
      lastRouteCalcRef.current = now;
      if (userLoc) {
        prevUserLocRef.current = userLoc;
      }

      setRouteLoading(true);
      setRouteCoordinates([]);
      setRouteInfo(null);

      try {
        const validDestinations = routeDestinations.filter(d => 
          typeof d.lat === 'number' && typeof d.lng === 'number' && !isNaN(d.lat) && !isNaN(d.lng)
        );

        if (validDestinations.length === 0) { 
          setRouteLoading(false); 
          return; 
        }

        const points: string[] = [];
        if (userLoc && !isNaN(userLoc[0]) && !isNaN(userLoc[1])) {
          points.push(`${userLoc[1]},${userLoc[0]}`);
        }
        validDestinations.forEach(d => points.push(`${d.lng},${d.lat}`));

        if (points.length < 2) { 
          setRouteLoading(false); 
          return; 
        }

        const coordsStr = points.join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&steps=true`;

        console.log("🗺️ Fetching route:", url);

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
        setRouteCoordinates(route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]));

            const steps: RouteStep[] = [];
            let totalDistance = 0;
            let totalDuration = 0;

            route.legs?.forEach((leg: { steps?: Array<{ distance?: number; duration?: number; name?: string; maneuver?: { instruction?: string } }> }) => {
              leg.steps?.forEach((step: { distance?: number; duration?: number; name?: string; maneuver?: { instruction?: string } }) => {
                steps.push({
                  instruction: step.maneuver?.instruction || 'Lanjutkan',
                  distance: step.distance || 0,
                  duration: step.duration || 0,
                  name: step.name || '',
                });
                totalDistance += step.distance || 0;
                totalDuration += step.duration || 0;
              });
            });

            setRouteInfo({ distance: totalDistance, duration: totalDuration, steps });
            console.log("✅ Route calculated:", totalDistance, "m,", steps.length, "steps");
          } else {
            console.warn("⚠️ No routes found");
          }
        } else {
          console.error("❌ OSRM error:", res.status, await res.text());
        }
      } catch (err) { 
        console.warn("OSRM routing error:", err); 
      }
      finally { 
        setRouteLoading(false); 
      }
    };

    fetchRoute();
  }, [routeDestinations, userLoc]); // Recalculate when destinations or user location changes

  const formatDistance = (meters: number) => meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins >= 60) { const hours = Math.floor(mins / 60); return `${hours}j ${(mins % 60)}m`; }
    return `${mins} menit`;
  };

  const autoTargetLoc = useMemo<[number, number] | null>(() => {
    if (focusLat && focusLng) return [parseFloat(focusLat), parseFloat(focusLng)];
    return null;
  }, [focusLat, focusLng]);

  const isTargetNotInMarkers = focusSlug && !markers.some(m => m.slug === focusSlug);

  return (
    <>
      {/* Panel Panduan */}
      {showDirections && routeInfo && (
        <div className="absolute top-6 left-6 right-20 z-[1000] bg-white/95 dark:bg-brutal-dark/95 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-3xl shadow-2xl max-h-[60vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-green-50 dark:bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">Panduan Rute</h3>
            <button onClick={() => setShowDirections(false)} className="text-slate-500 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <div className="flex gap-4 p-4 text-xs font-mono border-b border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">📏 {formatDistance(routeInfo.distance)}</div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">⏱️ {formatDuration(routeInfo.duration)}</div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">📍 {routeInfo.steps.length} langkah</div>
          </div>
          <div className="overflow-y-auto flex-1 p-4 space-y-2">
            {routeInfo.steps.map((step, index) => (
              <div key={index} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1">{step.instruction} {step.name && <span className="text-slate-500 font-normal">di {step.name}</span>}</p>
                    <div className="flex gap-3 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span>📏 {formatDistance(step.distance)}</span><span>⏱️ {formatDuration(step.duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tombol Toggle */}
      {routeInfo && !showDirections && (
        <button onClick={() => setShowDirections(true)} className="absolute top-6 right-6 z-[1000] bg-white/90 dark:bg-brutal-dark/90 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl shadow-lg p-3 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-brutal-dark transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </button>
      )}

      <MapContainer center={center} zoom={focusSlug ? 15 : 12} className="w-full h-full z-0 font-sans" maxZoom={18} zoomControl={false}>
        {/* FIT MAP AUTO */}
        <FitMapView coordinates={routeCoordinates} />

        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

        {userLoc && (
          <Marker position={userLoc} icon={userIcon}><Popup><div className="font-mono font-bold text-[10px] tracking-widest text-slate-800 text-center py-1">POSISI ANDA</div></Popup></Marker>
        )}

        {isTargetNotInMarkers && autoTargetLoc && (
          <Marker position={autoTargetLoc} icon={customIcon}><Popup><div className="font-mono font-bold text-[10px] tracking-widest text-slate-800 text-center py-1">TITIK DESTINASI</div></Popup></Marker>
        )}

        {routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="#16a34a" weight={5} opacity={0.8} dashArray="5, 10" />
        )}

        {/* MARKER DENGAN ANGKA URUT */}
        {routeDestinations?.map((dest, i) => (
          <Marker key={`route-${i}`} position={[dest.lat, dest.lng]} icon={createWaypointIcon(i + 1)}>
            <Popup><div className="font-mono font-bold text-[10px] tracking-widest text-slate-800 text-center py-1">STOP {i + 1}: {dest.title}</div></Popup>
          </Marker>
        ))}

        <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
          {markers.map((marker) => {
            const isFocused = marker.slug === focusSlug;
            return (
              <Marker key={marker.id} position={[marker.lat!, marker.lng!]} icon={customIcon} zIndexOffset={isFocused ? 1000 : 0}>
                <Popup className="rounded-2xl overflow-hidden shadow-xl border-0">
                  <div className="flex flex-col gap-3 p-1 min-w-50">
                    <div className="bg-slate-100 text-green-800 px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-widest rounded-full w-fit border border-slate-200">{marker.category?.name || 'UMUM'}</div>
                    <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight m-0 tracking-tight">{marker.title}</h3>
                    <Link href={`/dashboard/destinasi/${marker.slug}`} className="bg-slate-100 text-slate-700 text-center font-mono font-bold text-[10px] py-2.5 px-4 rounded-xl hover:bg-slate-200 transition-colors uppercase border border-slate-200">DETAIL ARSIP</Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Badge Status */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-white/80 dark:bg-brutal-dark/80 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 px-5 py-2.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-3 pointer-events-none text-slate-800 dark:text-slate-200">
        <div className={`w-2.5 h-2.5 rounded-full ${routeCoordinates.length > 0 ? 'bg-green-500 animate-pulse' : gpsStatus === 'aktif' ? 'bg-green-500' : gpsStatus === 'ditolak' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
        <span>
          {routeCoordinates.length > 0 ? `✅ RUTE AKTIF (${formatDistance(routeInfo?.distance || 0)})` : gpsStatus === 'aktif' ? 'GPS MELACAK...' : gpsStatus === 'ditolak' ? 'GPS DITOLAK' : 'MENCARI SINYAL...'}
        </span>
        {routeDestinations && routeDestinations.length > 0 && (
          <span className="hidden md:inline text-slate-500 dark:text-slate-400 ml-2 border-l border-slate-300 dark:border-slate-600 pl-3">{routeDestinations.length} DESTINASI</span>
        )}
      </div>
    </>
  );
}