"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchAPI, BACKEND_URL } from '../lib/api';
import { SiteSettings, User } from '../types/api';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string>("Hamemayu");
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'ID' | 'EN'>('ID');

  useEffect(() => {
    async function fetchSettings() {
      const data = await fetchAPI<SiteSettings>('/settings');
      if (data) {
        setSiteLogo(data.site_logo || null);
        setSiteName(data.site_name || "Hamemayu");
      }
    }
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('hamemayu_token');
      
      if (!token) {
        setUser(null);
        return;
      }

      const userData = await fetchAPI<User>('/user/profile', { requireAuth: true });
      
      if (userData) {
        setUser(userData);
      } else {
        localStorage.removeItem('hamemayu_token');
        setUser(null);
      }
    };

    fetchUserProfile();
    window.addEventListener('authChange', fetchUserProfile);
    return () => window.removeEventListener('authChange', fetchUserProfile);
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem('hamemayu_token');
    if (token) {
      await fetchAPI('/auth/logout', { method: 'POST', requireAuth: true });
    }
    localStorage.removeItem('hamemayu_token');
    document.cookie = "hamemayu_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    setUser(null);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new Event('authChange'));
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ID' ? 'EN' : 'ID');
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-4 md:px-8 py-4 flex justify-center transition-all duration-300">
      <div className="max-w-6xl w-full bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-[0_8px_32px_0_rgba(15,28,53,0.08)] rounded-full px-6 md:px-10 py-3 flex items-center justify-between transition-all duration-500 relative">
        
        <Link href="/" className="flex items-center gap-3 z-20 shrink-0 transform hover:scale-[1.02] transition-transform duration-300">
          {siteLogo && siteLogo !== "" ? (
            <div className="relative h-8 md:h-9 w-28 md:w-36">
              <Image 
                src={`${BACKEND_URL}/storage/${siteLogo}`} 
                alt={siteName} 
                fill
                className="object-contain object-left dark:brightness-110 drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)] transition-all duration-500" 
                unoptimized 
              />
            </div>
          ) : (
            <span className="font-serif font-bold text-xl md:text-2xl text-green-900 dark:text-yellow-400 tracking-wide drop-shadow-sm">{siteName}</span>
          )}
        </Link>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-slate-700/40 text-slate-900 dark:text-white shadow-sm hover:bg-green-50 hover:text-green-800 dark:hover:bg-yellow-400/10 dark:hover:text-yellow-400 transition-all duration-300"
        >
          <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        <nav className="hidden md:flex items-center gap-1 text-xs font-mono font-bold tracking-wider text-slate-700 dark:text-slate-300 bg-slate-900/5 dark:bg-white/5 p-1 rounded-full border border-slate-900/5 dark:border-white/5">
          <Link href="/" className="px-4 py-2 rounded-full hover:text-green-800 dark:hover:text-yellow-400 hover:bg-green-50 dark:hover:bg-yellow-400/10 transition-all duration-300">/{language === 'EN' ? 'HOME' : 'BERANDA'}</Link>
          <Link href="#fitur" className="px-4 py-2 rounded-full hover:text-green-800 dark:hover:text-yellow-400 hover:bg-green-50 dark:hover:bg-yellow-400/10 transition-all duration-300">/{language === 'EN' ? 'FEATURES' : 'FITUR'}</Link>
          <Link href="#faq" className="px-4 py-2 rounded-full hover:text-green-800 dark:hover:text-yellow-400 hover:bg-green-50 dark:hover:bg-yellow-400/10 transition-all duration-300">/FAQ</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <ThemeToggle />
          
          <button 
            onClick={toggleLanguage}
            className="w-9 h-9 rounded-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm flex items-center justify-center hover:bg-green-50 hover:text-green-800 dark:hover:bg-yellow-400/10 dark:hover:text-yellow-400 transition-all duration-300"
            title={language === 'EN' ? 'Switch to Indonesian' : 'Switch to English'}
          >
            {language}
          </button>
          
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 pl-4 pr-1 py-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-slate-700/40 shadow-sm hover:bg-green-50 hover:border-green-200 dark:hover:bg-yellow-400/10 dark:hover:border-yellow-400/30 transition-all duration-300 rounded-full group"
              >
                <span className="font-mono text-xs font-bold text-slate-800 group-hover:text-green-800 dark:text-slate-200 dark:group-hover:text-yellow-400 max-w-24 truncate transition-colors duration-300">
                  {user.name.split(' ')[0]}
                </span>
                <Image 
                  src={user.avatar || "https://ui-avatars.com/api/?name=User&background=FFD662&color=000"} 
                  alt={user.name} 
                  width={28} 
                  height={32} 
                  className="rounded-full border border-white/60 dark:border-slate-600/60 bg-slate-200 dark:bg-slate-800 object-cover aspect-square" 
                  unoptimized
                  onError={(e) => {
                    // Fallback ke ui-avatars kalau Google image gagal load (429/404)
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=FFD662&color=000&size=128`;
                }}
              />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/80 dark:bg-brutal-dark/80 backdrop-blur-2xl border border-white/40 dark:border-yellow-400/30 shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-2xl py-2 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="px-4 py-3 border-b border-slate-200/60 dark:border-slate-700/60 mb-1 bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="text-xs font-bold text-green-900 dark:text-yellow-400 truncate">{user.name}</p>
                    <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="mx-1 px-4 py-2 font-mono text-xs font-bold text-left text-red-600 dark:text-red-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 rounded-xl transition-colors duration-200"
                  >
                    [ {language === 'EN' ? 'LOGOUT' : 'KELUAR'} ]
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login" 
              className="bg-green-700 dark:bg-yellow-400 text-white dark:text-slate-900 px-5 py-2 rounded-full font-mono text-xs font-bold hover:bg-green-800 dark:hover:bg-yellow-500 active:scale-95 transition-all duration-300 whitespace-nowrap shadow-md"
            >
              {language === 'EN' ? 'LOGIN' : 'MASUK'}
            </Link>
          )}
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-[115%] left-0 w-full bg-white/85 dark:bg-brutal-dark/85 backdrop-blur-3xl border border-white/40 dark:border-yellow-400/20 shadow-[0_16px_48px_rgba(15,28,53,0.15)] rounded-3xl flex flex-col p-5 md:hidden z-50 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <nav className="flex flex-col gap-1 text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl hover:bg-green-50 hover:text-green-800 dark:hover:bg-yellow-400/10 dark:hover:text-yellow-400 transition-all">/{language === 'EN' ? 'HOME' : 'BERANDA'}</Link>
              <Link href="#fitur" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl hover:bg-green-50 hover:text-green-800 dark:hover:bg-yellow-400/10 dark:hover:text-yellow-400 transition-all">/{language === 'EN' ? 'FEATURES' : 'FITUR'}</Link>
              <Link href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl hover:bg-green-50 hover:text-green-800 dark:hover:bg-yellow-400/10 dark:hover:text-yellow-400 transition-all">/FAQ</Link>
            </nav>
            
            <div className="h-px w-full bg-slate-200/80 dark:bg-slate-700/60" />

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <ThemeToggle />
                <button 
                  onClick={toggleLanguage}
                  className="w-10 h-10 rounded-full bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm flex items-center justify-center hover:bg-green-50 hover:text-green-800 dark:hover:bg-yellow-400/10 dark:hover:text-yellow-400 transition-all"
                >
                  {language}
                </button>
              </div>

              {user ? (
                <button onClick={handleLogout} className="font-mono text-xs font-bold text-red-600 dark:text-red-400 px-4 py-2 border border-red-200/50 dark:border-red-900/40 rounded-xl bg-red-50/40 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  [ {language === 'EN' ? 'LOGOUT' : 'KELUAR'} ]
                </button>
              ) : (
                <Link 
                  href="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-green-700 dark:bg-yellow-400 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-mono text-xs font-bold text-center shadow-md active:scale-95 transition-transform"
                >
                  {language === 'EN' ? 'LOGIN' : 'MASUK'}
                </Link>
              )}
            </div>

            {user && (
              <div className="flex items-center gap-3 mt-1 p-3 bg-green-50/50 dark:bg-yellow-400/5 border border-green-100 dark:border-yellow-400/20 rounded-2xl shadow-sm">
              <Image 
                src={user.avatar || "https://ui-avatars.com/api/?name=User&background=FFD662&color=000"} 
                alt={user.name} 
                width={28} 
                height={32} 
                className="rounded-full border border-white/60 dark:border-slate-600/60 bg-slate-200 dark:bg-slate-800 object-cover aspect-square" 
                unoptimized
                onError={(e) => {
                  // Fallback ke ui-avatars kalau Google image gagal load (429/404)
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=FFD662&color=000&size=128`;
                }}
              />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-green-900 dark:text-yellow-400 truncate">{user.name}</p>
                  <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
}