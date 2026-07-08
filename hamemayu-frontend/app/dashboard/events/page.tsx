'use client';

import { useState, useEffect, useCallback } from 'react';
import EventCalendar from './EventCalendar';
import CategoryTabs from './CategoryTabs';
import EventCard from './EventCard';
import type { Event, CalendarDay } from '../../types/event';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return document.cookie.split('; ').find(row => row.startsWith('hamemayu_token='))?.split('=')[1] || null;
  };

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const now = new Date();
  const [viewDate, setViewDate] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });

// ✅ Fetch Calendar Data - FIXED
const fetchCalendar = useCallback(async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('hamemayu_token='))?.split('=')[1];
      
      const res = await fetch(`${API_BASE}/events/calendar?year=${viewDate.year}&month=${viewDate.month}`, {
        headers: { 
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.error('Unauthorized - please login again');
          return;
        }
        throw new Error('Failed to fetch calendar');
      }
      
      const data = await res.json();
      setCalendarData(data.days || []);
    } catch (err) {
      console.error('Calendar fetch error:', err);
    }
  }, [viewDate]);
  
  // ✅ Fetch Events List - FIXED  
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('hamemayu_token='))?.split('=')[1];
      
      const params = new URLSearchParams({
        month: viewDate.month.toString(),
        year: viewDate.year.toString(),
        per_page: '12',
        ...(selectedCategory !== 'all' && { category: selectedCategory })
      });
      
      const res = await fetch(`${API_BASE}/events?${params}`, {
        headers: { 
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Gagal memuat data event');
      }
      
      const data = await res.json();
      setEventsList(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [viewDate, selectedCategory]);

  // Initial & Dependency Load
  useEffect(() => {
    fetchCalendar();
    fetchEvents();
  }, [fetchCalendar, fetchEvents]);

  // Month Navigation
  const handleMonthChange = (direction: 'prev' | 'next') => {
    setViewDate(prev => {
      let newMonth = prev.month + (direction === 'next' ? 1 : -1);
      let newYear = prev.year;
      if (newMonth > 12) { newMonth = 1; newYear++; }
      if (newMonth < 1) { newMonth = 12; newYear--; }
      return { year: newYear, month: newMonth };
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Event Yogyakarta
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Temukan festival, konser, pameran, dan acara budaya terbaru
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <CategoryTabs 
        selected={selectedCategory} 
        onChange={setSelectedCategory} 
      />

      {/* Calendar Component */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold capitalize text-slate-800 dark:text-slate-100">
            {new Date(viewDate.year, viewDate.month - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => handleMonthChange('prev')}
              className="px-3 py-1.5 text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              ← Prev
            </button>
            <button 
              onClick={() => handleMonthChange('next')}
              className="px-3 py-1.5 text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Next →
            </button>
          </div>
        </div>
        
        <EventCalendar days={calendarData} loading={loading} />
      </section>

      {/* Events Grid List */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
          Daftar Event {selectedCategory !== 'all' && `• ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
        </h2>
        
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-300 text-sm mb-4">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : eventsList.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">Tidak ada event yang ditemukan untuk filter ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventsList.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}