"use client";

import { useEffect, useState, useMemo } from 'react';
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

// BEST PRACTICE: Membuat Icon Vektor (SVG) menggunakan DivIcon agar 100% muncul dan beresolusi tinggi
const createBrutalistIcon = (fillColor: string) => {
  return L.divIcon({
    className: 'bg-transparent',
    html: `
      <div class="relative w-8 h-10 hover:-translate-y-1 transition-transform">
        <svg viewBox="0 0 24 24" class="w-full h-full drop-shadow-[2px_2px_0_rgba(15,28,53,1)]">
          <path fill="${fillColor}" stroke="#0F1C35" stroke-width="2" stroke-linejoin="miter" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="4" fill="#FFFFFF" stroke="#0F1C35" stroke-width="2"/>
        </svg>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

const customIcon = createBrutalistIcon('#F4F0EA'); // Krem/Putih untuk Destinasi Umum
const focusIcon = createBrutalistIcon('#D4AF37');  // Golden Heritage untuk Destinasi yang di-Klik/Target
const userIcon = createBrutalistIcon('#22C55E');   // Hijau untuk Posisi User (GPS)

function RoutingMachine({ userLocation, targetLocation }: { userLocation: [number, number] | null, targetLocation: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation || !targetLocation) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLocation[0], userLocation[1]),
        L.latLng(targetLocation[0], targetLocation[1])
      ],
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        language: 'id'
      }),
      lineOptions: {
        styles: [{ color: '#D4AF37', weight: 6, opacity: 0.9 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      show: false, // Panel teks instruksi disembunyikan agar UI Peta bersih
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
    }).addTo(map);

    return () => {
      if (map && routingControl) {
        map.removeControl(routingControl);
      }
    };
  }, [userLocation, targetLocation, map]);

  return null;
}

export default function MapComponent({ markers, center, focusSlug }: MapComponentProps) {
  const searchParams = useSearchParams();
  const focusLat = searchParams.get('lat');
  const focusLng = searchParams.get('lng');

  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [manualTarget, setManualTarget] = useState<[number, number] | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLoc([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Gagal mendapatkan lokasi GPS: ", error.message);
        },
        { enableHighAccuracy: true }
      );
    }
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
    setManualTarget([lat, lng]);
  };

  const isTargetNotInMarkers = focusSlug && !markers.some(m => m.slug === focusSlug);

  return (
    <>
      <MapContainer 
        center={center} 
        zoom={focusSlug ? 15 : 12} 
        className="w-full h-full z-0 font-mono"
        maxZoom={18}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {userLoc && (
          <Marker position={userLoc} icon={userIcon}>
            <Popup className="brutal-popup font-bold uppercase text-center">POSISI ANDA SAAT INI</Popup>
          </Marker>
        )}

        <RoutingMachine userLocation={userLoc} targetLocation={activeTargetLoc} />

        {isTargetNotInMarkers && autoTargetLoc && (
          <Marker position={autoTargetLoc} icon={focusIcon}>
             <Popup className="brutal-popup font-bold uppercase text-center">TITIK DESTINASI</Popup>
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
              >
                <Popup className="brutal-popup">
                  <div className="flex flex-col gap-2 p-1 min-w-55">
                    <div className="bg-slate-900 text-golden-heritage px-2 py-1 text-[10px] font-bold uppercase w-fit">
                      {marker.category?.name || 'UMUM'}
                    </div>
                    <h3 className="font-serif font-bold text-base text-slate-900 uppercase leading-tight m-0">
                      {marker.title}
                    </h3>
                    
                    <div className="flex flex-col gap-2 mt-3">
                      <button 
                        onClick={() => handleMulaiRute(marker.lat!, marker.lng!)}
                        className="bg-golden-heritage border-2 border-slate-900 text-slate-900 text-center font-bold text-xs py-2 hover:-translate-y-0.5 brutal-shadow-sm transition-all uppercase cursor-pointer"
                      >
                        MULAI NAVIGASI RUTE
                      </button>
                      <Link 
                        href={`/dashboard/destinasi/${marker.slug}`}
                        className="bg-[#F4F0EA] border-2 border-slate-900 text-slate-900 text-center font-bold text-xs py-1.5 hover:bg-slate-200 transition-colors uppercase"
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

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 bg-white border-2 border-slate-900 px-4 py-2 font-mono text-xs font-bold uppercase brutal-shadow-sm flex items-center gap-2 pointer-events-none">
        <div className={`w-3 h-3 rounded-full ${userLoc ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        {userLoc ? 'GPS AKTIF' : 'MENUNGGU SINYAL GPS...'}
      </div>
    </>
  );
}