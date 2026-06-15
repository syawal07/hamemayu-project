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
    <main className="min-h-screen bg-green-50 dark:bg-slate-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-100/60 via-slate-50 to-yellow-100/40 dark:from-green-900/20 dark:via-slate-900 dark:to-slate-900 flex transition-colors duration-500 selection:bg-yellow-400 selection:text-slate-900">
      
      <div className="w-full lg:w-5/12 flex flex-col justify-center px-8 sm:px-16 lg:px-20 relative z-10 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl border-r-4 border-slate-900 dark:border-yellow-400 shadow-[8px_0_15px_-3px_rgba(0,0,0,0.1)] dark:shadow-[8px_0_15px_-3px_rgba(250,204,21,0.05)]">
        
        <Link href="/" className="absolute top-8 left-8 sm:left-16 lg:left-20 font-mono text-slate-600 dark:text-slate-400 hover:text-green-700 dark:hover:text-yellow-400 flex items-center gap-2 transition-all hover:-translate-x-1 text-sm font-bold uppercase tracking-widest bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 border-2 border-transparent hover:border-slate-900 dark:hover:border-yellow-400 rounded-full">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          KEMBALI_
        </Link>

        <div className="max-w-md w-full mx-auto mt-16 lg:mt-0">
          <div className="mb-10 relative h-12 w-32 md:w-40 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm px-4 py-8 border-2 border-slate-900 dark:border-yellow-400 shadow-[4px_4px_0_0_rgba(15,28,53,1)] dark:shadow-[4px_4px_0_0_rgba(250,204,21,1)] rounded-xl flex items-center justify-center">
            {settings?.site_logo ? (
              <Image 
                src={`${BACKEND_URL}/storage/${settings.site_logo}`} 
                alt="Logo" 
                fill
                className="object-contain object-center dark:brightness-110 drop-shadow-md p-2" 
                unoptimized 
              />
            ) : (
              <div className="text-2xl font-serif font-bold text-green-800 dark:text-yellow-400 tracking-wide uppercase whitespace-nowrap drop-shadow-[1px_1px_0_rgba(15,28,53,1)]">
                Hamemayu
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-6 leading-tight uppercase tracking-tighter drop-shadow-[2px_2px_0_rgba(15,28,53,0.1)] dark:drop-shadow-none">
            Akses<br/>Ekosistem<br/><span className="text-green-700 dark:text-yellow-400">Nusantara.</span>
          </h1>
          
          <p className="font-mono font-bold text-slate-800 dark:text-slate-300 text-sm leading-relaxed mb-10 bg-green-100/50 dark:bg-green-900/30 p-3 border-l-4 border-slate-900 dark:border-yellow-400 backdrop-blur-sm">
            [ OTORISASI DIPERLUKAN UNTUK MENGAKSES PORTAL DIGITAL DAN FITUR INTERAKTIF ]
          </p>

          <div className="mb-8">
            <GoogleLoginButton />
          </div>

          <p className="font-mono text-xs text-slate-700 dark:text-slate-400 leading-relaxed uppercase bg-white/50 dark:bg-slate-800/50 p-4 border-2 border-slate-900 dark:border-slate-700 rounded-xl backdrop-blur-sm">
            Sistem melacak aktivitas Anda. Dengan masuk, Anda tunduk pada <span className="text-green-700 dark:text-yellow-400 font-bold cursor-pointer hover:underline">Protokol Keamanan</span> dan <span className="text-green-700 dark:text-yellow-400 font-bold cursor-pointer hover:underline">Privasi Data</span>.
          </p>
        </div>
      </div>

      <div className="hidden lg:block lg:w-7/12 relative p-8 bg-transparent">
        <div className="w-full h-full border-2 border-slate-900 dark:border-yellow-400 shadow-[8px_8px_0_0_rgba(15,28,53,1)] dark:shadow-[8px_8px_0_0_rgba(250,204,21,1)] relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-2xl group">
          <Image 
            src={rightBgImage} 
            alt="Pemandangan Nusantara" 
            fill
            className="object-cover grayscale hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
            priority
            unoptimized 
          />
          <div className="absolute inset-0 bg-linear-to-t from-green-900/90 dark:from-slate-900/90 via-transparent to-transparent opacity-80" />
          
          <div className="absolute bottom-10 left-10">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md font-mono border-2 border-slate-900 dark:border-yellow-400 px-6 py-3 text-slate-900 dark:text-yellow-400 text-sm font-bold uppercase tracking-widest shadow-[4px_4px_0_0_rgba(15,28,53,1)] dark:shadow-[4px_4px_0_0_rgba(250,204,21,1)] rounded-xl flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-yellow-400 animate-pulse" />
              SYSTEM_ID: {settings?.site_name || 'HAMEMAYU'}
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}