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

const createGlassIcon = (fillColor: string, strokeColor: string, scale: number = 1) => {
  return L.divIcon({
    className: 'bg-transparent',
    html: `
      <div class="relative transition-transform duration-300 hover:-translate-y-1 group" style="width: ${28 * scale}px; height: ${36 * scale}px;">
        <svg viewBox="0 0 24 24" class="w-full h-full drop-shadow-md transition-all duration-300 group-hover:drop-shadow-lg">
          <path fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5" stroke-linejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3.5" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="1.5"/>
        </svg>
      </div>
    `,
    iconSize: [28 * scale, 36 * scale],
    iconAnchor: [14 * scale, 36 * scale],
    popupAnchor: [0, -32 * scale],
  });
};

const customIcon = createGlassIcon('rgba(255, 255, 255, 0.95)', '#166534', 1); 
const userIcon = createGlassIcon('rgba(34, 197, 94, 0.95)', '#14532D', 1);

const createWaypointIcon = (number: number) => {
  return L.divIcon({
    className: 'waypoint-marker',
    html: `<div style="background-color: #854D0E; color: white; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); border: 2px solid white;">
             <span style="transform: rotate(45deg); font-family: sans-serif; font-weight: 800; font-size: 14px;">${number}</span>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36]
  });
};

function FitMapView({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [coordinates, map]);

  return null;
}

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
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
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  
  const lastRouteCalcRef = useRef<number>(0);
  const prevUserLocRef = useRef<[number, number] | null>(null);
  const MIN_MOVE_METERS = 15;

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      Promise.resolve().then(() => setGpsStatus('ditolak'));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
        
        let shouldUpdate = false;
        if (userLoc) {
          const dist = getDistanceFromLatLonInMeters(userLoc[0], userLoc[1], newLoc[0], newLoc[1]);
          if (dist > MIN_MOVE_METERS) shouldUpdate = true;
        } else {
          shouldUpdate = true;
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

  useEffect(() => {
    if (!routeDestinations || routeDestinations.length === 0) {
      Promise.resolve().then(() => {
        setRouteCoordinates([]);
        setRouteInfo(null);
      });
      return;
    }

    const fetchRoute = async () => {
      const now = Date.now();
      const timeSinceLastCalc = now - lastRouteCalcRef.current;
      
      if (userLoc && prevUserLocRef.current) {
        const dist = getDistanceFromLatLonInMeters(
          prevUserLocRef.current[0], 
          prevUserLocRef.current[1], 
          userLoc[0], 
          userLoc[1]
        );
        if (dist < MIN_MOVE_METERS && timeSinceLastCalc < 10000) {
          return;
        }
      }
      
      lastRouteCalcRef.current = now;
      if (userLoc) {
        prevUserLocRef.current = userLoc;
      }

      setRouteCoordinates([]);
      setRouteInfo(null);

      try {
        const validDestinations = routeDestinations.filter(d => 
          typeof d.lat === 'number' && typeof d.lng === 'number' && !isNaN(d.lat) && !isNaN(d.lng)
        );

        if (validDestinations.length === 0) return;

        const points: string[] = [];
        if (userLoc && !isNaN(userLoc[0]) && !isNaN(userLoc[1])) {
          points.push(`${userLoc[1]},${userLoc[0]}`);
        }
        validDestinations.forEach(d => points.push(`${d.lng},${d.lat}`));

        if (points.length < 2) return;

        const coordsStr = points.join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&steps=true`;

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
          }
        }
      } catch (err) { 
        console.warn("OSRM routing error:", err); 
      }
    };

    fetchRoute();
  }, [routeDestinations, userLoc]);

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
      {showDirections && routeInfo && (
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-1000 w-[260px] md:w-80 max-w-[calc(100vw-2rem)] bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/40 dark:border-slate-700/40 rounded-3xl shadow-xl max-h-[60vh] overflow-hidden flex flex-col">
          <div className="p-3 md:p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center bg-gradient-to-r from-transparent to-green-50/40 dark:to-green-900/20">
            <h3 className="font-serif text-base md:text-lg font-bold text-slate-900 dark:text-white">Rute Navigasi</h3>
            <button onClick={() => setShowDirections(false)} className="text-slate-500 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <div className="flex gap-3 p-3 text-[9px] md:text-[10px] font-mono font-bold tracking-wide border-b border-slate-100/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/30 uppercase">
            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">📏 {formatDistance(routeInfo.distance)}</div>
            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">⏱️ {formatDuration(routeInfo.duration)}</div>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
            {routeInfo.steps.map((step, index) => (
              <div key={index} className="p-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-800 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[9px] md:text-xs font-bold shrink-0">{index + 1}</div>
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug mb-1">{step.instruction} {step.name && <span className="text-slate-500 font-normal">di {step.name}</span>}</p>
                    <div className="flex gap-2 text-[8px] md:text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <span>{formatDistance(step.distance)}</span> • <span>{formatDuration(step.duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {routeInfo && !showDirections && (
        <button onClick={() => setShowDirections(true)} className="absolute top-4 right-4 md:top-6 md:right-6 z-1000 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-full shadow-lg p-3 md:p-3.5 text-slate-800 dark:text-slate-200 hover:scale-105 transition-transform">
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </button>
      )}

      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-1000 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 px-4 md:px-5 py-2 md:py-2.5 rounded-full font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 md:gap-3 pointer-events-none text-slate-800 dark:text-slate-200 whitespace-nowrap">
        <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shadow-inner ${routeCoordinates.length > 0 ? 'bg-green-500 animate-pulse' : gpsStatus === 'aktif' ? 'bg-green-500' : gpsStatus === 'ditolak' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
        <span>
          {routeCoordinates.length > 0 ? `✅ RUTE (${formatDistance(routeInfo?.distance || 0)})` : gpsStatus === 'aktif' ? 'GPS AKTIF' : gpsStatus === 'ditolak' ? 'GPS DITOLAK' : 'MENCARI...'}
        </span>
        {routeDestinations && routeDestinations.length > 0 && (
          <span className="hidden sm:inline text-slate-500 dark:text-slate-400 ml-1 md:ml-2 border-l border-slate-300 dark:border-slate-600 pl-2 md:pl-3">{routeDestinations.length} DESTINASI</span>
        )}
      </div>

      <MapContainer center={center} zoom={focusSlug ? 15 : 12} className="w-full h-full z-0 font-sans bg-transparent" maxZoom={18} zoomControl={false}>
        <FitMapView coordinates={routeCoordinates} />
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

        {userLoc && (
          <Marker position={userLoc} icon={userIcon}><Popup><div className="font-mono font-bold text-[9px] tracking-widest text-slate-800 text-center py-1">POSISI ANDA</div></Popup></Marker>
        )}

        {isTargetNotInMarkers && autoTargetLoc && (
          <Marker position={autoTargetLoc} icon={customIcon}><Popup><div className="font-mono font-bold text-[9px] tracking-widest text-slate-800 text-center py-1">TITIK DESTINASI</div></Popup></Marker>
        )}

        {routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="#16a34a" weight={4} opacity={0.8} dashArray="5, 8" />
        )}

        {routeDestinations?.map((dest, i) => (
          <Marker key={`route-${i}`} position={[dest.lat, dest.lng]} icon={createWaypointIcon(i + 1)}>
            <Popup><div className="font-mono font-bold text-[9px] tracking-widest text-slate-800 text-center py-1">STOP {i + 1}: {dest.title}</div></Popup>
          </Marker>
        ))}

        <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
          {markers.map((marker) => {
            const isFocused = marker.slug === focusSlug;
            return (
              <Marker key={marker.id} position={[marker.lat!, marker.lng!]} icon={customIcon} zIndexOffset={isFocused ? 1000 : 0}>
                <Popup className="rounded-2xl overflow-hidden shadow-xl border-0">
                  <div className="flex flex-col gap-2 p-1 min-w-48">
                    <div className="bg-slate-100 text-green-800 px-2.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest rounded-full w-fit border border-slate-200">{marker.category?.name || 'UMUM'}</div>
                    <h3 className="font-serif font-bold text-base text-slate-900 leading-tight m-0 tracking-tight">{marker.title}</h3>
                    <Link href={`/dashboard/destinasi/${marker.slug}`} className="bg-slate-100 text-slate-700 text-center font-mono font-bold text-[9px] mt-1 py-2 px-3 rounded-xl hover:bg-slate-200 transition-colors uppercase border border-slate-200">DETAIL ARSIP</Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </>
  );
}