"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchAPI, BACKEND_URL } from '../lib/api';
import { SiteSettings, User } from '../types/api';
import { getCurrentWeather } from '../lib/weather';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string>("Hamemayu");
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'ID' | 'EN'>('ID');
  const [temperature, setTemperature] = useState<number | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      const data = await fetchAPI<SiteSettings>('/settings');
      if (data) {
        setSiteLogo(data.site_logo || null);
        setSiteName(data.site_name || "Hamemayu");
      }
    }
    fetchSettings();

    getCurrentWeather().then(data => {
      if (data) setTemperature(data.temp);
    });
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
    <header className="fixed top-0 left-0 w-full z-50 px-4 md:px-8 py-6 flex justify-center transition-all duration-300">
      <div className="max-w-6xl w-full glass-nav rounded-full px-5 md:px-6 py-3 flex items-center justify-between relative">
        
        <Link href="/" className="flex items-center gap-3 z-20 shrink-0 group">
          {siteLogo && siteLogo !== "" ? (
            <div className="relative h-8 md:h-9 w-28 md:w-36 transition-transform duration-300 group-hover:scale-105">
              <Image
                src={`${BACKEND_URL}/storage/${siteLogo}`}
                alt={siteName}
                fill
                className="object-contain object-left dark:brightness-110"
                unoptimized
                priority
              />
            </div>
          ) : (
            <span className="font-serif font-bold text-xl md:text-2xl text-slate-900 dark:text-white tracking-tight transition-transform duration-300 group-hover:scale-105">
              {siteName}
            </span>
          )}
        </Link>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden z-20 w-10 h-10 flex items-center justify-center rounded-full glass-btn text-slate-900 dark:text-white"
        >
          <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        <nav className="hidden md:flex items-center gap-2 text-xs font-mono font-medium tracking-wide text-slate-600 dark:text-slate-400">
          <Link href="/" className="px-4 py-2 rounded-full hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300">
            {language === 'EN' ? 'HOME' : 'BERANDA'}
          </Link>
          <Link href="#fitur" className="px-4 py-2 rounded-full hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300">
            {language === 'EN' ? 'FEATURES' : 'FITUR'}
          </Link>
          <Link href="#faq" className="px-4 py-2 rounded-full hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300">
            FAQ
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          {temperature !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-btn font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              {temperature}°C DIY
            </div>
          )}

          <ThemeToggle />
          
          <button 
            onClick={toggleLanguage}
            className="w-9 h-9 rounded-full glass-btn font-mono text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center hover:text-slate-900 dark:hover:text-white"
          >
            {language}
          </button>
          
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 pl-3 pr-1 py-1 glass-btn rounded-full group"
              >
                <span className="font-sans text-xs font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white max-w-24 truncate transition-colors duration-300">
                  {user.name.split(' ')[0]}
                </span>
                <Image
                  src={user.avatar || "https://ui-avatars.com/api/?name=User&background=111&color=fff"}
                  alt={user.name}
                  width={28}
                  height={28}
                  className="rounded-full border border-white/60 dark:border-white/10 bg-slate-200 dark:bg-slate-800 object-cover aspect-square"
                  unoptimized
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 glass-panel rounded-2xl py-2 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="px-4 py-3 border-b border-slate-200/50 dark:border-white/5 mb-1 bg-white/40 dark:bg-white/5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="mx-2 px-4 py-2 font-mono text-xs font-bold text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors duration-200"
                  >
                    [ {language === 'EN' ? 'LOGOUT' : 'KELUAR'} ]
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login" 
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-full font-mono text-xs font-bold hover:opacity-90 active:scale-95 transition-all duration-300 shadow-sm"
            >
              {language === 'EN' ? 'LOGIN' : 'MASUK'}
            </Link>
          )}
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-[115%] left-0 w-full glass-panel rounded-3xl flex flex-col p-5 md:hidden z-50 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            
            {temperature !== null && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                KONDISI CUACA: {temperature}°C DIY
              </div>
            )}

            <nav className="flex flex-col gap-1 text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-all">{language === 'EN' ? 'HOME' : 'BERANDA'}</Link>
              <Link href="#fitur" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-all">{language === 'EN' ? 'FEATURES' : 'FITUR'}</Link>
              <Link href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-all">FAQ</Link>
            </nav>
            
            <div className="h-px w-full bg-slate-200/50 dark:bg-white/5" />
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <ThemeToggle />
                <button 
                  onClick={toggleLanguage}
                  className="w-10 h-10 rounded-full glass-btn font-mono text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center"
                >
                  {language}
                </button>
              </div>
              
              {user ? (
                <button onClick={handleLogout} className="font-mono text-xs font-bold text-red-600 dark:text-red-400 px-4 py-2 border crisp-border rounded-xl bg-red-50/40 dark:bg-red-500/10 transition-colors">
                  [ {language === 'EN' ? 'LOGOUT' : 'KELUAR'} ]
                </button>
              ) : (
                <Link 
                  href="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-mono text-xs font-bold text-center shadow-md active:scale-95 transition-transform"
                >
                  {language === 'EN' ? 'LOGIN' : 'MASUK'}
                </Link>
              )}
            </div>

            {user && (
              <div className="flex items-center gap-3 mt-1 p-3 bg-white/40 dark:bg-white/5 border crisp-border rounded-2xl shadow-sm">
              <Image
                src={user.avatar || "https://ui-avatars.com/api/?name=User&background=111&color=fff"}
                alt={user.name}
                width={32}
                height={32}
                className="rounded-full border border-white/60 dark:border-white/10 bg-slate-200 dark:bg-slate-800 object-cover aspect-square"
                unoptimized
              />
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
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