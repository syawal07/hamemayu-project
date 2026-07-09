import Image from 'next/image';
import Link from 'next/link';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { fetchAPI, BACKEND_URL } from '../lib/api';
import { SiteSettings } from '../types/api';

export const dynamic = 'force-dynamic';

async function getSettings() {
  return await fetchAPI<SiteSettings>('/settings', { cache: 'no-store' });
}

export default async function LoginPage() {
  const settings = await getSettings();

  const rightBgImage = settings?.hero_background 
    ? `${BACKEND_URL}/storage/${settings.hero_background}` 
    : "https://images.unsplash.com/photo-1584814352222-793540131495?q=80&w=2070";

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-brutal-dark bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-green-100/40 via-slate-50 to-yellow-100/20 dark:from-green-900/10 dark:via-brutal-dark dark:to-brutal-dark flex transition-colors duration-500 selection:bg-yellow-400 selection:text-slate-900 overflow-hidden relative">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-125 h-125 bg-green-500/10 dark:bg-green-600/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/2 w-150 h-150 bg-yellow-400/10 dark:bg-yellow-600/5 rounded-full blur-3xl pointer-events-none translate-x-1/4 translate-y-1/3" />

      {/* LEFT PANEL: Login Form (Glassmorphism) */}
        <div className="w-full lg:w-5/12 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 lg:py-0 relative z-10 bg-white/50 dark:bg-brutal-dark/50 backdrop-blur-2xl border-r border-white/60 dark:border-slate-700/50 shadow-[16px_0_40px_-10px_rgba(15,28,53,0.05)] overflow-y-auto">        
        <Link href="/" className="fixed top-6 left-6 sm:top-8 sm:left-12 lg:absolute lg:left-16 font-mono text-slate-600 dark:text-slate-400 hover:text-green-800 dark:hover:text-yellow-400 flex items-center gap-2 transition-all duration-300 hover:-translate-x-1 text-xs font-bold uppercase tracking-widest bg-white/40 dark:bg-slate-800/40 backdrop-blur-md px-5 py-2.5 border border-white/50 dark:border-slate-700/50 rounded-full shadow-sm z-100">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
      KEMBALI
    </Link>

        {/* Mendorong form ke bawah menggunakan mt-24 pada mobile */}
        <div className="mb-10 pt-12">
  <div className="relative h-14 w-36 md:w-44 bg-white/50 dark:bg-slate-800/30 backdrop-blur-xl px-5 py-8 border border-white/60 dark:border-slate-700/60 shadow-sm rounded-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-500">
            {settings?.site_logo ? (
              <Image 
                src={`${BACKEND_URL}/storage/${settings.site_logo}`} 
                alt="Logo" 
                fill
                className="object-contain object-center dark:brightness-110 drop-shadow-sm p-2" 
                unoptimized 
              />
            ) : (
              <div className="text-2xl font-serif font-bold text-green-900 dark:text-yellow-400 tracking-wide uppercase whitespace-nowrap drop-shadow-sm">
                Hamemayu
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight drop-shadow-sm">
            Akses<br/>Ekosistem<br/><span className="text-green-700 dark:text-yellow-400">Nusantara.</span>
          </h1>
          
          <div className="mb-10 p-4 bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 backdrop-blur-md rounded-2xl shadow-sm border-l-4 border-l-green-600 dark:border-l-yellow-400">
            <p className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
              [ OTORISASI DIPERLUKAN UNTUK MENGAKSES PORTAL DIGITAL DAN FITUR INTERAKTIF ]
            </p>
          </div>

          <div className="mb-8 transform hover:scale-[1.02] transition-transform duration-300">
            <GoogleLoginButton />
          </div>

          <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed uppercase bg-white/30 dark:bg-slate-800/30 p-5 border border-white/50 dark:border-slate-700/50 rounded-2xl backdrop-blur-md shadow-sm">
            Sistem melacak aktivitas Anda. Dengan masuk, Anda tunduk pada <span className="text-green-700 dark:text-yellow-400 font-bold cursor-pointer hover:underline transition-all">Protokol Keamanan</span> dan <span className="text-green-700 dark:text-yellow-400 font-bold cursor-pointer hover:underline transition-all">Privasi Data</span>.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: Hero Image with Soft Glass Gradient */}
      <div className="hidden lg:block lg:w-7/12 relative p-6 bg-transparent">
        <div className="w-full h-full border border-white/40 dark:border-slate-700/50 shadow-[0_8px_32px_rgba(15,28,53,0.1)] relative overflow-hidden bg-slate-200 dark:bg-brutal-dark rounded-3xl group">
          
          {/* Main Image */}
          <Image 
            src={rightBgImage} 
            alt="Pemandangan Nusantara" 
            fill
            className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105" 
            priority
            unoptimized 
          />
          
          {/* Soft Gradient Overlay (Not too dark, preserves image details) */}
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-80 mix-blend-multiply" />
          
          {/* Floating System ID Badge */}
          <div className="absolute bottom-8 left-8 z-20">
            <div className="bg-white/30 dark:bg-brutal-dark/50 backdrop-blur-xl font-mono border border-white/40 dark:border-slate-700/50 px-5 py-2.5 text-white text-xs font-bold uppercase tracking-widest shadow-[0_4px_16px_rgba(0,0,0,0.2)] rounded-2xl flex items-center gap-3 transform group-hover:-translate-y-1 transition-transform duration-500">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 dark:bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)] dark:shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
              SYSTEM ID: {settings?.site_name || 'HAMEMAYU'}
            </div>
          </div>

        </div>
      </div>

    </main>
  );
}