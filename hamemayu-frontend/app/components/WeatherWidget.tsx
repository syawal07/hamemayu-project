// app/components/WeatherWidget.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getCurrentWeather, getForecast, getWeatherIconUrl, formatDate } from '../lib/weather';

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
  city: string;
}

interface ForecastData {
  dt: number;
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
}

const DIY_REGIONS = [
  { name: 'Kota Yogyakarta', lat: -7.7956, lon: 110.3695 },
  { name: 'Bantul', lat: -7.8881, lon: 110.3289 },
  { name: 'Sleman', lat: -7.7053, lon: 110.3533 },
  { name: 'Gunung Kidul', lat: -7.9786, lon: 110.6031 },
  { name: 'Kulon Progo', lat: -7.8236, lon: 110.1619 },
];

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[] | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [diyWeather, setDiyWeather] = useState<{[key: string]: WeatherData | null}>({});

  // Kunci scroll body saat modal buka
  useEffect(() => {
    if (showDetail) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showDetail]);

  // ✅ FIX 1: Memasukkan deklarasi fungsi ke dalam useEffect agar tidak error immutability & deps
  useEffect(() => {
    const loadDiyWeather = async () => {
      const weatherData: {[key: string]: WeatherData | null} = {};
      for (const region of DIY_REGIONS) {
        try {
          const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${region.lat}&lon=${region.lon}&appid=${API_KEY}&units=metric&lang=id`,
            { next: { revalidate: 300 } }
          );
          if (res.ok) {
            const data = await res.json();
            weatherData[region.name] = {
              temp: Math.round(data.main.temp),
              feels_like: Math.round(data.main.feels_like),
              humidity: data.main.humidity,
              description: data.weather[0].description,
              icon: data.weather[0].icon,
              wind_speed: data.wind.speed,
              city: region.name,
            };
          }
        } catch {
          // ✅ FIX 2: Menghapus (error) karena tidak dipakai
          weatherData[region.name] = null;
        }
      }
      setDiyWeather(weatherData);
    };

    const loadWeather = async () => {
      setLoading(true);
      const [current, forecastData] = await Promise.all([
        getCurrentWeather(),
        getForecast(),
      ]);
      setWeather(current);
      setForecast(forecastData);
      setLoading(false);
      loadDiyWeather();
    };

    loadWeather();
  }, []);

  if (loading) {
    return <div className="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-white/60 shadow-sm w-fit">
      <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
      <div className="h-4 bg-slate-200 rounded w-16"></div>
    </div>;
  }

  if (!weather) return <div className="text-xs text-slate-500">Cuaca tidak tersedia</div>;

  // ✅ FIX 3: Mengubah komponen () => menjadi variabel JSX biasa agar React tidak bingung
  const modalContent = (
    <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
      {/* 1. Background Hitam Full Screen */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setShowDetail(false)}
      ></div>
      
      {/* 2. Konten Modal */}
      <div 
        className="relative bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl z-10 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between z-20">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Prakiraan Cuaca DIY</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Yogyakarta & Sekitarnya</p>
          </div>
          <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Cuaca Utama */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">{weather.temp}°C</span>
                <span className="text-sm text-blue-600 dark:text-blue-400 capitalize">{weather.description}</span>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-slate-600 dark:text-slate-400">
                <span>Terasa: {weather.feels_like}°C</span>
                <span>Angin: {weather.wind_speed} m/s</span>
              </div>
            </div>
            <img src={getWeatherIconUrl(weather.icon)} alt="" className="w-16 h-16" />
          </div>

          {/* Grid Wilayah */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wide">Per Wilayah</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DIY_REGIONS.map((region) => {
                const w = diyWeather[region.name];
                if (!w) return null;
                return (
                  <div key={region.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <img src={getWeatherIconUrl(w.icon)} alt="" className="w-8 h-8" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{region.name}</p>
                        <p className="text-[10px] text-slate-500 capitalize">{w.description}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{w.temp}°C</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Forecast 7 Hari */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wide">7 Hari Kedepan</h3>
            <div className="space-y-2">
              {forecast?.map((day, i) => (
                <div key={day.dt} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-24 truncate">
                      {i === 0 ? 'Hari Ini' : formatDate(day.dt)}
                    </span>
                    <img src={getWeatherIconUrl(day.icon)} alt="" className="w-8 h-8" />
                  </div>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{day.temp}°C</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Tombol Widget Kecil */}
      <button
        onClick={() => setShowDetail(true)}
        className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all cursor-pointer shadow-sm hover:shadow-md border border-white/20 dark:border-slate-700/50"
      >
        <div className="relative shrink-0">
          <img src={getWeatherIconUrl(weather.icon)} alt="" className="w-10 h-10" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
        </div>
        <div className="text-left">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900 dark:text-white">{weather.temp}°C</span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">{weather.city}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 capitalize truncate max-w-25">{weather.description}</p>
        </div>
      </button>

      {/* RENDER MODAL MELALUI PORTAL */}
      {showDetail && typeof document !== 'undefined' && createPortal(
        modalContent,
        document.body
      )}
    </>
  );
}