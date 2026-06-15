import Link from 'next/link';
import Image from 'next/image';
import { fetchAPI, BACKEND_URL } from '../lib/api';
import { SiteSettings } from '../types/api';

async function getSettings() {
  return await fetchAPI<SiteSettings>('/settings', { cache: 'no-store' });
}

export default async function Footer() {
  const settings = await getSettings();

  return (
    <footer className="relative bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl border-t-4 border-slate-900 dark:border-yellow-400 pt-20 pb-10 px-6 transition-colors duration-500 overflow-hidden">
      {/* Abstract Glass Shape in Background */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-green-400/20 dark:bg-green-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-yellow-400/20 dark:bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          <div className="md:col-span-5 lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              {settings?.site_logo && settings.site_logo !== "" && (
               <Image 
                 src={`${BACKEND_URL}/storage/${settings.site_logo}`} 
                 alt="Logo" 
                 width={120} 
                 height={32} 
                 className="h-8 w-auto object-contain dark:brightness-110 drop-shadow-[1px_1px_0_rgba(15,28,53,1)] transition-all duration-500" 
                 style={{ width: "auto", height: "auto" }}
                 unoptimized
               />
              )}
              <div className="text-2xl font-serif font-bold text-green-800 dark:text-yellow-400 drop-shadow-[1px_1px_0_rgba(15,28,53,1)] tracking-wide uppercase">
                {settings?.site_name || 'Hamemayu'}
              </div>
            </div>
            <p className="text-slate-800 dark:text-slate-300 font-medium text-sm leading-relaxed mb-8 max-w-sm">
              {settings?.footer_text || 'Melestarikan dan mengenalkan kekayaan budaya Nusantara melalui teknologi modern.'}
            </p>
            <div className="flex gap-4">
              {settings?.social_links?.map((social, index) => (
                <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-2 border-slate-900 dark:border-yellow-400 shadow-[3px_3px_0_0_rgba(15,28,53,1)] dark:shadow-[3px_3px_0_0_rgba(250,204,21,1)] hover:bg-yellow-400 dark:hover:bg-yellow-400 hover:-translate-y-1 hover:shadow-[5px_5px_0_0_rgba(15,28,53,1)] flex items-center justify-center text-slate-900 transition-all">
                  <span className="font-mono text-xs font-bold uppercase">{social.platform.substring(0, 2)}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 lg:col-span-2 lg:col-start-7">
            <h4 className="font-mono text-slate-900 dark:text-yellow-400 font-bold mb-6 tracking-widest uppercase bg-green-100/80 dark:bg-green-900/40 inline-block px-3 py-1 border-2 border-slate-900 dark:border-yellow-400 shadow-[2px_2px_0_0_rgba(15,28,53,1)] dark:shadow-[2px_2px_0_0_rgba(250,204,21,1)]">/ Navigasi</h4>
            <ul className="flex flex-col gap-4 text-sm font-mono text-slate-800 dark:text-slate-300 font-bold">
              <li><Link href="#fitur" className="hover:text-green-700 dark:hover:text-yellow-400 hover:pl-2 transition-all">FITUR</Link></li>
              <li><Link href="#faq" className="hover:text-green-700 dark:hover:text-yellow-400 hover:pl-2 transition-all">TANYA JAWAB</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 lg:col-span-4 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-6 border-2 border-slate-900 dark:border-yellow-400 shadow-[4px_4px_0_0_rgba(15,28,53,1)] dark:shadow-[4px_4px_0_0_rgba(250,204,21,1)]">
            <h4 className="text-xl font-serif text-slate-900 dark:text-white font-bold mb-3">Siap Menjelajahi Nusantara?</h4>
            <p className="text-slate-800 dark:text-slate-300 text-sm mb-6 font-medium">
              Mulai petualangan budaya Anda hari ini. Akses seluruh ekosistem digital dalam satu genggaman.
            </p>
            <Link 
              href="/login"
              className="inline-block px-6 py-3 bg-green-600/90 dark:bg-green-500/90 backdrop-blur-sm text-white font-mono text-sm font-bold border-2 border-slate-900 dark:border-white shadow-[4px_4px_0_0_rgba(15,28,53,1)] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_rgba(15,28,53,1)] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all"
            >
              COBA SEKARANG
            </Link>
          </div>

        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t-2 border-slate-900 dark:border-yellow-400/50 font-mono text-xs font-bold text-slate-900 dark:text-yellow-400 gap-4 uppercase tracking-widest">
          <p className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 border-2 border-slate-900 dark:border-yellow-400 shadow-[2px_2px_0_0_rgba(15,28,53,1)] dark:shadow-[2px_2px_0_0_rgba(250,204,21,1)]">
            &copy; {new Date().getFullYear()} {settings?.site_name || 'Hamemayu'}. SYSTEM ONLINE.
          </p>
        </div>
      </div>
    </footer>
  );
}