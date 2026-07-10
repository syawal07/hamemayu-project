"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchAPI } from '../lib/api';
import { User } from '../types/api';
import ThemeToggle from '../components/ThemeToggle';
import Image from 'next/image';
import ChatWidget from '../components/ChatWidget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = document.cookie.split('; ').find(row => row.startsWith('hamemayu_token='))?.split('=')[1];
      
      if (!token) {
        router.push('/login');
        return;
      }

      const userData = await fetchAPI<User>('/user/profile', { requireAuth: true });
      if (userData) {
        setUser(userData);
      } else {
        router.push('/login');
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleLogout = async () => {
    await fetchAPI('/auth/logout', { method: 'POST', requireAuth: true });
    localStorage.removeItem('hamemayu_token');
    document.cookie = "hamemayu_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.dispatchEvent(new Event('authChange'));
    router.push('/login');
  };

  const navItems = [
    { name: 'OVERVIEW', path: '/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'DESTINASI', path: '/dashboard/destinasi', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { 
      name: 'EVENTS', 
      path: '/dashboard/events', 
      icon: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z' 
    },
    { name: 'PETA', path: '/dashboard/peta', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
    { name: 'WISHLIST', path: '/dashboard/wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { name: 'ITINERARY', path: '/dashboard/itinerary', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { 
      name: 'LIVE CCTV', 
      path: '/dashboard/live-cctv', 
      icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' 
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-brutal-dark">
        <div className="font-mono text-green-800 dark:text-yellow-400 text-sm font-bold tracking-widest animate-pulse border border-white/50 dark:border-slate-700/50 px-8 py-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-sm">
          [ MEMUAT_DATA_PENGGUNA ]
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brutal-dark flex flex-col md:flex-row transition-colors duration-500 relative">
      
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, var(--color-jogja-green) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

      <aside className="hidden md:flex flex-col w-70 bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-2xl border-r border-white/60 dark:border-slate-700/50 sticky top-0 h-screen z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 border-b border-white/60 dark:border-slate-700/50 flex justify-between items-center bg-transparent">
          <Link href="/" className="font-serif font-bold text-2xl text-slate-900 dark:text-white uppercase tracking-widest hover:scale-105 transition-transform duration-300 drop-shadow-sm">
            Hamemayu
          </Link>
          <ThemeToggle />
        </div>

        <div className="p-6 mx-4 mt-6 border border-white/60 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/30 backdrop-blur-md rounded-2xl flex items-center gap-4 shadow-sm group hover:bg-white/60 dark:hover:bg-slate-800/50 transition-colors">
          <Image 
            src={user.avatar || "https://ui-avatars.com/api/?name=User"} 
            alt={user.name} 
            width={44} 
            height={44} 
            className="rounded-full border border-white/60 dark:border-slate-600/60 bg-slate-200 object-cover aspect-square shadow-sm group-hover:scale-105 transition-transform"
            unoptimized
          />
          <div className="overflow-hidden">
            <p className="font-bold text-slate-900 dark:text-white truncate text-sm">{user.name}</p>
            <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.name} 
                href={item.path}
                className={`flex items-center gap-4 px-5 py-3.5 font-mono font-bold text-xs uppercase transition-all duration-300 rounded-xl border ${
                  isActive 
                    ? 'bg-green-700 dark:bg-yellow-400 text-white dark:text-slate-900 border-transparent shadow-md scale-[1.02]' 
                    : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:border-white/60 dark:hover:border-slate-700/50 hover:bg-white/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={item.icon} />
                </svg>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 font-mono font-bold text-xs uppercase bg-white/40 dark:bg-slate-800/30 text-red-600 dark:text-red-400 border border-white/60 dark:border-slate-700/50 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-900/50 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            KELUAR_SISTEM
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen pb-24 md:pb-0 relative z-10">
        <div className="md:hidden flex justify-between items-center p-4 bg-white/70 dark:bg-brutal-dark/70 backdrop-blur-2xl border-b border-white/50 dark:border-slate-700/50 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <Image 
              src={user.avatar || "https://ui-avatars.com/api/?name=User"} 
              alt={user.name} 
              width={36} 
              height={36} 
              className="rounded-full border border-white/60 dark:border-slate-600/60 bg-slate-200 object-cover"
              unoptimized
            />
            <span className="font-bold text-slate-900 dark:text-white uppercase text-xs truncate max-w-30">
              {user.name.split(' ')[0]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center border border-white/60 dark:border-slate-700/50 rounded-full text-red-600 bg-white/50 dark:bg-slate-800/40 shadow-sm active:scale-95 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-8 lg:p-10 overflow-x-hidden">
          {children}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-white/75 dark:bg-slate-800/85 backdrop-blur-3xl border border-white/40 dark:border-slate-700/50 z-50 px-2 py-2 flex justify-between shadow-[0_16px_40px_-8px_rgba(0,0,0,0.2)] rounded-3xl">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`flex flex-col items-center justify-center w-full max-w-18 h-14 rounded-2xl transition-all duration-300 border ${
                isActive 
                  ? 'bg-green-700 dark:bg-yellow-400 text-white dark:text-slate-900 border-transparent shadow-md -translate-y-2' 
                  : 'bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/40'
              }`}
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={item.icon} />
              </svg>
              <span className={`text-[8px] font-mono font-bold tracking-wider truncate w-full text-center px-1 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
      <ChatWidget />
    </div>
  );
}