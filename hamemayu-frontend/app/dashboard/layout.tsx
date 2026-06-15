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
    { name: 'PETA', path: '/dashboard/peta', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
    { name: 'WISHLIST', path: '/dashboard/wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { name: 'ITINERARY', path: '/dashboard/itinerary', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F0EA] dark:bg-[#0B1426]">
        <div className="font-mono text-golden-heritage font-bold tracking-widest animate-pulse border-2 border-slate-900 px-6 py-3 bg-white dark:bg-slate-900 brutal-shadow">
          [ MEMUAT_DATA_PENGGUNA ]
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#0B1426] flex flex-col md:flex-row transition-colors duration-500">
      
      <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-[#0F1C35] border-r-4 border-slate-900 dark:border-white/10 sticky top-0 h-screen z-40">
        <div className="p-8 border-b-4 border-slate-900 dark:border-white/10 flex justify-between items-center bg-[#F4F0EA] dark:bg-[#0B1426]">
          <Link href="/" className="font-serif font-bold text-2xl text-slate-900 dark:text-golden-heritage uppercase tracking-widest hover:-translate-y-1 transition-transform">
            Hamemayu
          </Link>
          <ThemeToggle />
        </div>

        <div className="p-8 border-b-4 border-slate-900 dark:border-white/10 flex items-center gap-4">
          <Image 
            src={user.avatar || "https://ui-avatars.com/api/?name=User"} 
            alt={user.name} 
            width={48} 
            height={48} 
            className="rounded-full brutal-border bg-slate-200"
            unoptimized
          />
          <div className="overflow-hidden">
            <p className="font-bold text-slate-900 dark:text-white truncate uppercase text-sm">{user.name}</p>
            <p className="font-mono text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        <nav className="flex-1 p-6 flex flex-col gap-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.name} 
                href={item.path}
                className={`flex items-center gap-4 px-5 py-4 font-mono font-bold text-sm uppercase transition-all duration-300 border-2 ${
                  isActive 
                    ? 'bg-golden-heritage text-slate-900 border-slate-900 brutal-shadow translate-x-2' 
                    : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-900 dark:hover:border-white/20 hover:bg-[#F4F0EA] dark:hover:bg-[#0B1426]'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d={item.icon} />
                </svg>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t-4 border-slate-900 dark:border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 font-mono font-bold text-sm uppercase bg-white dark:bg-[#0F1C35] text-red-600 dark:text-red-400 border-2 border-slate-900 dark:border-white/20 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors brutal-shadow-sm hover:translate-x-1 hover:-translate-y-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            KELUAR_SISTEM
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0 relative">
        <div className="md:hidden flex justify-between items-center p-4 bg-white dark:bg-[#0F1C35] border-b-4 border-slate-900 dark:border-white/10 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Image 
              src={user.avatar || "https://ui-avatars.com/api/?name=User"} 
              alt={user.name} 
              width={36} 
              height={36} 
              className="rounded-full brutal-border bg-slate-200"
              unoptimized
            />
            <span className="font-bold text-slate-900 dark:text-white uppercase text-xs truncate max-w-[120px]">
              {user.name.split(' ')[0]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center border-2 border-slate-900 dark:border-white/20 rounded-full text-red-600 bg-[#F4F0EA] dark:bg-[#0B1426]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-8 lg:p-12 overflow-x-hidden">
          {children}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-[#0F1C35] border-t-4 border-slate-900 dark:border-white/10 z-50 px-1 py-2 flex justify-between pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`flex flex-col items-center justify-center w-full max-w-[72px] h-14 rounded-lg transition-colors border-2 mx-0.5 ${
                isActive 
                  ? 'bg-golden-heritage text-slate-900 border-slate-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] -translate-y-1' 
                  : 'bg-transparent text-slate-500 border-transparent'
              }`}
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={isActive ? 2.5 : 2} d={item.icon} />
              </svg>
              <span className="text-[8px] font-mono font-bold tracking-wider truncate w-full text-center px-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <ChatWidget />
    </div>
  );
}