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
    <header className="absolute top-0 w-full z-50 px-4 md:px-6 py-6 flex justify-center">
      <div className="max-w-5xl w-full bg-white/40 dark:bg-slate-900/50 backdrop-blur-md border-2 border-slate-900 dark:border-yellow-400 shadow-[4px_4px_0_0_rgba(15,28,53,1)] dark:shadow-[4px_4px_0_0_rgba(250,204,21,1)] rounded-full px-5 md:px-8 py-3 flex items-center justify-between transition-all duration-500 relative">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 z-20 shrink-0">
          {siteLogo && siteLogo !== "" ? (
            <div className="relative h-8 md:h-10 w-32 md:w-40">
              <Image 
                src={`${BACKEND_URL}/storage/${siteLogo}`} 
                alt={siteName} 
                fill
                className="object-contain object-left dark:brightness-110 drop-shadow-sm transition-all duration-500" 
                unoptimized 
              />
            </div>
          ) : (
            <span className="font-serif font-bold text-xl text-green-700 dark:text-yellow-400 drop-shadow-[1px_1px_0_rgba(15,28,53,1)]">{siteName}</span>
          )}
        </Link>

        {/* MOBILE HAMBURGER BUTTON */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-2 border-slate-900 dark:border-yellow-400 text-slate-900 dark:text-yellow-400 shadow-[2px_2px_0_0_rgba(15,28,53,1)] dark:shadow-[2px_2px_0_0_rgba(250,204,21,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
          <Link href="/" className="px-3 py-1.5 rounded-full border-2 border-transparent hover:border-slate-900 dark:hover:border-yellow-400 hover:bg-yellow-400/80 hover:text-slate-900 transition-all">/{language === 'EN' ? 'HOME' : 'BERANDA'}</Link>
          <Link href="#fitur" className="px-3 py-1.5 rounded-full border-2 border-transparent hover:border-slate-900 dark:hover:border-yellow-400 hover:bg-yellow-400/80 hover:text-slate-900 transition-all">/{language === 'EN' ? 'FEATURES' : 'FITUR'}</Link>
          <Link href="#faq" className="px-3 py-1.5 rounded-full border-2 border-transparent hover:border-slate-900 dark:hover:border-yellow-400 hover:bg-yellow-400/80 hover:text-slate-900 transition-all">/FAQ</Link>
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="hidden md:flex items-center gap-3 md:gap-4 shrink-0">
          <ThemeToggle />
          
          <button 
            onClick={toggleLanguage}
            className="w-10 h-10 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-2 border-slate-900 dark:border-yellow-400 font-mono text-xs font-bold text-slate-900 dark:text-yellow-400 shadow-[2px_2px_0_0_rgba(15,28,53,1)] dark:shadow-[2px_2px_0_0_rgba(250,204,21,1)] flex items-center justify-center hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(15,28,53,1)] transition-all active:translate-y-0 active:translate-x-0 active:shadow-none"
            aria-label="Toggle Language"
            title={language === 'EN' ? 'Switch to Indonesian' : 'Switch to English'}
          >
            {language}
          </button>
          
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 pl-4 pr-1 py-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-2 border-slate-900 dark:border-yellow-400 shadow-[2px_2px_0_0_rgba(15,28,53,1)] dark:shadow-[2px_2px_0_0_rgba(250,204,21,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_rgba(15,28,53,1)] transition-all duration-300 rounded-full active:translate-y-0 active:shadow-none"
              >
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white max-w-24 truncate">
                  {user.name.split(' ')[0]}
                </span>
                <Image 
                  src={user.avatar || "https://ui-avatars.com/api/?name=User&background=FFD662&color=000"} 
                  alt={user.name} 
                  width={32} 
                  height={32} 
                  className="rounded-full border-2 border-slate-900 dark:border-yellow-400 bg-slate-200 dark:bg-slate-800" 
                  unoptimized
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-4 w-56 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-slate-900 dark:border-yellow-400 shadow-[4px_4px_0_0_rgba(15,28,53,1)] dark:shadow-[4px_4px_0_0_rgba(250,204,21,1)] rounded-xl py-2 flex flex-col z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b-2 border-slate-900 dark:border-yellow-400/30 mb-2 bg-green-50/50 dark:bg-green-900/20">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="font-mono text-xs text-slate-600 dark:text-slate-400 truncate mt-1">{user.email}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="mx-2 px-4 py-2 font-mono text-sm font-bold text-left text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    [ {language === 'EN' ? 'LOGOUT' : 'KELUAR'} ]
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login" 
              className="bg-yellow-400/90 dark:bg-yellow-500/90 backdrop-blur-sm text-slate-900 px-6 py-2 rounded-full font-mono text-sm font-bold border-2 border-slate-900 shadow-[2px_2px_0_0_rgba(15,28,53,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(15,28,53,1)] active:translate-y-0 active:shadow-none transition-all whitespace-nowrap"
            >
              {language === 'EN' ? 'LOGIN' : 'MASUK'}
            </Link>
          )}
        </div>

        {/* MOBILE DROPDOWN MENU */}
        {isMobileMenuOpen && (
          <div className="absolute top-[110%] left-0 w-full bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-slate-900 dark:border-yellow-400 shadow-[4px_4px_0_0_rgba(15,28,53,1)] dark:shadow-[4px_4px_0_0_rgba(250,204,21,1)] rounded-2xl flex flex-col p-6 md:hidden z-50 gap-6">
            <nav className="flex flex-col gap-2 text-base font-mono font-bold text-slate-900 dark:text-slate-100">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="p-3 border-2 border-transparent hover:border-slate-900 dark:hover:border-yellow-400 hover:bg-yellow-400/80 hover:text-slate-900 rounded-xl transition-all">/{language === 'EN' ? 'HOME' : 'BERANDA'}</Link>
              <Link href="#fitur" onClick={() => setIsMobileMenuOpen(false)} className="p-3 border-2 border-transparent hover:border-slate-900 dark:hover:border-yellow-400 hover:bg-yellow-400/80 hover:text-slate-900 rounded-xl transition-all">/{language === 'EN' ? 'FEATURES' : 'FITUR'}</Link>
              <Link href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="p-3 border-2 border-transparent hover:border-slate-900 dark:hover:border-yellow-400 hover:bg-yellow-400/80 hover:text-slate-900 rounded-xl transition-all">/FAQ</Link>
            </nav>
            
            <div className="h-0.5 w-full bg-slate-900 dark:bg-yellow-400/30" />

            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <ThemeToggle />
                <button 
                  onClick={toggleLanguage}
                  className="w-10 h-10 rounded-xl bg-white/60 dark:bg-slate-800/60 border-2 border-slate-900 dark:border-yellow-400 font-mono text-xs font-bold text-slate-900 dark:text-yellow-400 shadow-[2px_2px_0_0_rgba(15,28,53,1)] dark:shadow-[2px_2px_0_0_rgba(250,204,21,1)] flex items-center justify-center"
                >
                  {language}
                </button>
              </div>

              {user ? (
                <button onClick={handleLogout} className="font-mono text-sm font-bold text-red-600 dark:text-red-400 px-4 py-2 border-2 border-red-200 dark:border-red-900 rounded-xl bg-red-50/50 dark:bg-red-900/20">
                  [ {language === 'EN' ? 'LOGOUT' : 'KELUAR'} ]
                </button>
              ) : (
                <Link 
                  href="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-yellow-400/90 text-slate-900 px-6 py-2.5 rounded-xl font-mono text-sm font-bold border-2 border-slate-900 shadow-[2px_2px_0_0_rgba(15,28,53,1)]"
                >
                  {language === 'EN' ? 'LOGIN' : 'MASUK'}
                </Link>
              )}
            </div>

            {user && (
              <div className="flex items-center gap-4 mt-2 p-4 bg-green-50/50 dark:bg-green-900/20 border-2 border-slate-900 dark:border-yellow-400/50 rounded-xl shadow-[2px_2px_0_0_rgba(15,28,53,1)]">
                <Image 
                  src={user.avatar || "https://ui-avatars.com/api/?name=User&background=FFD662&color=000"} 
                  alt={user.name} 
                  width={40} 
                  height={40} 
                  className="rounded-full border-2 border-slate-900 dark:border-yellow-400" 
                  unoptimized
                />
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
}