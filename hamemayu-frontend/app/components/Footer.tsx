import Link from 'next/link';
import Image from 'next/image';
import { fetchAPI, BACKEND_URL } from '../lib/api';
import { SiteSettings } from '../types/api';

async function getSettings() {
  return await fetchAPI<SiteSettings>('/settings', { cache: 'no-store' });
}

const getSocialIcon = (platform: string) => {
  const p = platform.toLowerCase();
  
  if (p === 'ig' || p.includes('instagram')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    );
  }
  
  if (p === 'fb' || p.includes('facebook')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
      </svg>
    );
  }
  
  if (p === 'tw' || p.includes('twitter') || p.includes('x')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/>
      </svg>
    );
  }
  
  if (p === 'yt' || p.includes('youtube')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
      </svg>
    );
  }

  if (p === 'tt' || p.includes('tiktok')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
      </svg>
    );
  }

  return <span className="font-mono text-[10px] font-bold uppercase">{platform.substring(0, 2)}</span>;
};

export default async function Footer() {
  const settings = await getSettings();

  return (
    <footer className="relative bg-white/60 dark:bg-brutal-dark/60 backdrop-blur-xl border-t border-white/40 dark:border-slate-700/50 pt-20 pb-10 px-6 transition-colors duration-500 overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-green-500/10 dark:bg-green-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-yellow-400/10 dark:bg-yellow-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          <div className="md:col-span-5 lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              {settings?.site_logo && settings.site_logo !== "" && (
                <Image 
                  src={`${BACKEND_URL}/storage/${settings.site_logo}`} 
                  alt="Logo" 
                  width={120} 
                  height={32} 
                  className="h-8 w-auto object-contain dark:brightness-110 drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)] transition-all duration-500" 
                  style={{ width: "auto", height: "auto" }}
                  unoptimized
                />
              )}
              <div className="text-xl font-serif font-bold text-green-900 dark:text-yellow-400 tracking-wide uppercase drop-shadow-sm">
                {settings?.site_name || 'Hamemayu'}
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8 max-w-sm">
              {settings?.footer_text || 'Melestarikan dan mengenalkan kekayaan budaya Nusantara melalui teknologi modern.'}
            </p>
            <div className="flex gap-3">
              {settings?.social_links?.map((social, index) => (
                <a 
                  key={index} 
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-green-50 hover:text-green-800 hover:border-green-200 dark:hover:bg-yellow-400/10 dark:hover:text-yellow-400 dark:hover:border-yellow-400/30 hover:scale-110 transition-all duration-300 shadow-sm"
                  aria-label={social.platform}
                >
                  {getSocialIcon(social.platform)}
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 lg:col-span-2 lg:col-start-7">
            <h4 className="font-mono text-green-900 dark:text-yellow-400 text-xs font-bold tracking-widest uppercase bg-green-50 dark:bg-yellow-400/5 inline-block px-3 py-1.5 rounded-md border border-green-100 dark:border-yellow-400/20 mb-6 shadow-sm">
              / Navigasi
            </h4>
            <ul className="flex flex-col gap-4 text-xs font-mono text-slate-700 dark:text-slate-300 font-bold">
              <li><Link href="#fitur" className="hover:text-green-800 dark:hover:text-yellow-400 transition-colors duration-300">FITUR</Link></li>
              <li><Link href="#faq" className="hover:text-green-800 dark:hover:text-yellow-400 transition-colors duration-300">TANYA JAWAB</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 lg:col-span-4 bg-white/50 dark:bg-slate-800/30 backdrop-blur-2xl p-6 md:p-8 border border-white/60 dark:border-slate-700/50 shadow-[0_8px_32px_0_rgba(15,28,53,0.06)] rounded-3xl group transition-all duration-500 hover:shadow-[0_16px_48px_0_rgba(15,28,53,0.1)]">
            <h4 className="text-lg font-serif text-slate-900 dark:text-white font-bold mb-3 group-hover:text-green-800 dark:group-hover:text-yellow-400 transition-colors duration-300">
              Siap Menjelajahi Nusantara?
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-6 font-medium">
              Mulai petualangan budaya Anda hari ini. Akses seluruh ekosistem digital dalam satu genggaman.
            </p>
            <Link 
              href="/login"
              className="inline-block w-full text-center px-6 py-3 bg-green-700 dark:bg-yellow-400 text-white dark:text-slate-900 font-mono text-xs font-bold rounded-xl hover:bg-green-800 dark:hover:bg-yellow-500 active:scale-[0.98] transition-all duration-300 shadow-md hover:shadow-lg"
            >
              COBA SEKARANG
            </Link>
          </div>

        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200/80 dark:border-slate-800/80 font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 gap-4 tracking-widest">
          <p className="bg-slate-50/50 dark:bg-white/5 px-4 py-2 border border-white/60 dark:border-white/10 rounded-full shadow-sm">
            &copy; {new Date().getFullYear()} {settings?.site_name || 'Hamemayu'}. SYSTEM ONLINE.
          </p>
        </div>
      </div>
    </footer>
  );
}