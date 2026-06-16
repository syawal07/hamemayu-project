import Header from './components/Header';
import Footer from './components/Footer';
import FaqAccordion from './components/FaqAccordion';
import Image from 'next/image';
import Link from 'next/link';
import { fetchAPI, BACKEND_URL } from './lib/api';
import { SiteSettings, Feature, Faq } from './types/api';
export const dynamic = 'force-dynamic';

async function getLandingData() {
  const [settings, features, faqs] = await Promise.all([
    fetchAPI<SiteSettings>('/settings', { cache: 'no-store' }),
    fetchAPI<Feature[]>('/features', { cache: 'no-store' }),
    fetchAPI<Faq[]>('/faqs', { cache: 'no-store' })
  ]);

  return { 
    settings: settings || null, 
    features: features || [], 
    faqs: faqs || []
  };
}

export default async function Home() {
  const { settings, features, faqs } = await getLandingData();

  const heroBg = settings?.hero_background 
    ? `${BACKEND_URL}/storage/${settings.hero_background}` 
    : "https://images.unsplash.com/photo-1584814352222-793540131495?q=80&w=2070";

  return (
    <main className="relative min-h-screen selection:bg-yellow-400 selection:text-slate-900 transition-colors duration-500 overflow-hidden">
      
      <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--color-jogja-green) 1px, transparent 1px), linear-gradient(90deg, var(--color-jogja-green) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <Header />

      <section className="relative min-h-screen flex items-center justify-center border-b border-white/30 dark:border-slate-800/60 z-10 pt-20">
        <div className="absolute inset-0 z-0 bg-slate-100 dark:bg-slate-900 overflow-hidden">
          <Image 
            src={heroBg} 
            alt="Hero Background" 
            fill
            className="object-cover opacity-100 dark:opacity-60 transition-transform duration-[20s] ease-out scale-110 hover:scale-100" 
            unoptimized 
            priority
          />
          {/* Gradient dipercerah untuk Light Mode */}
          <div className="absolute inset-0 bg-linear-to-b from-white/30 via-white/10 to-slate-50 dark:from-brutal-dark/90 dark:via-brutal-dark/60 dark:to-brutal-dark backdrop-blur-[2px] transition-colors duration-500" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center mt-10">
          
          <div className="font-mono bg-white/60 dark:bg-slate-800/40 backdrop-blur-2xl text-green-900 dark:text-yellow-400 px-6 py-2.5 font-bold tracking-[0.2em] uppercase text-xs border border-white/60 dark:border-slate-700/50 shadow-sm rounded-full mb-8 transform hover:scale-105 transition-all duration-300">
            Nusantara Digital City
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl text-slate-900 dark:text-white font-serif font-bold leading-tight mb-8 drop-shadow-sm transition-colors duration-500 tracking-tight max-w-4xl">
            {settings?.hero_title || 'Jelajahi Jiwa Yogyakarta'}
          </h1>

          <div className="bg-white/60 dark:bg-brutal-dark/50 backdrop-blur-3xl border border-white/60 dark:border-slate-700/50 shadow-[0_16px_40px_-8px_rgba(15,28,53,0.15)] p-6 md:p-10 rounded-4xl mb-12 max-w-3xl transform hover:shadow-[0_24px_60px_-12px_rgba(15,28,53,0.2)] transition-all duration-500">
            <p className="text-base md:text-lg text-slate-800 dark:text-slate-300 leading-relaxed font-sans font-medium transition-colors duration-500">
              {settings?.hero_subtitle || 'Padukan kecanggihan AI, peta interaktif, dan visualisasi memukau untuk mendalami warisan leluhur. Semua dalam genggaman.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            <Link 
              href="/login" 
              className="font-mono bg-green-700 dark:bg-yellow-400 text-white dark:text-slate-900 px-12 py-4 text-sm font-bold shadow-[0_8px_24px_rgba(22,101,52,0.25)] dark:shadow-[0_8px_24px_rgba(250,204,21,0.25)] hover:bg-green-800 dark:hover:bg-yellow-500 hover:scale-105 active:scale-95 transition-all duration-300 rounded-full flex items-center justify-center gap-3"
            >
              MULAI EKSPLORASI
            </Link>
          </div>
        </div>
      </section>

      {features.length > 0 && (
        <section id="fitur" className="py-32 px-6 relative z-10 bg-white/20 dark:bg-slate-900/20 backdrop-blur-3xl border-b-4 border-slate-900 dark:border-yellow-400">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-24 flex flex-col items-center">
              <h4 className="font-mono bg-green-100/80 dark:bg-green-900/60 backdrop-blur-sm text-green-900 dark:text-yellow-400 inline-block px-4 py-1.5 border-2 border-slate-900 dark:border-yellow-400 shadow-[4px_4px_0_0_rgba(15,28,53,1)] dark:shadow-[4px_4px_0_0_rgba(250,204,21,1)] text-sm font-bold tracking-widest uppercase mb-6 rounded-full">
                Fitur Ekosistem
              </h4>
              <h2 className="text-4xl md:text-6xl font-serif text-slate-900 dark:text-white uppercase tracking-tighter drop-shadow-[2px_2px_0_rgba(15,28,53,1)] dark:drop-shadow-none">Eksplorasi Tanpa Batas</h2>
            </div>
            
            <div className="flex flex-col gap-32">
              {features.map((feature, index) => (
                <div key={feature.id} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className={index % 2 !== 0 ? 'lg:order-2' : ''}>
                    <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border-2 border-slate-900 dark:border-yellow-400 p-8 rounded-2xl shadow-[6px_6px_0_0_rgba(15,28,53,1)] dark:shadow-[6px_6px_0_0_rgba(250,204,21,1)]">
                      <h3 className="text-3xl md:text-4xl text-slate-900 dark:text-yellow-400 font-serif font-bold uppercase mb-6">{feature.title}</h3>
                      <p className="text-slate-800 dark:text-slate-300 text-lg leading-relaxed whitespace-pre-line font-sans font-medium">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <div className={index % 2 !== 0 ? 'lg:order-1' : ''}>
                    <div className="w-full aspect-video bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-2 border-slate-900 dark:border-yellow-400 shadow-[8px_8px_0_0_rgba(15,28,53,1)] dark:shadow-[8px_8px_0_0_rgba(250,204,21,1)] relative overflow-hidden rounded-2xl group hover:-translate-y-2 hover:shadow-[12px_12px_0_0_rgba(15,28,53,1)] dark:hover:shadow-[12px_12px_0_0_rgba(250,204,21,1)] transition-all duration-500">
                      {feature.image && feature.image !== "" ? (
                       <Image 
                        src={`${BACKEND_URL}/storage/${feature.image}`} 
                        alt={feature.title} 
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        unoptimized
                      />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-mono font-bold text-slate-500 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm">
                          [ VISUAL_ASSET_MISSING ]
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="faq" className="py-32 px-6 relative z-10">
        <div className="absolute inset-0 z-0 opacity-10 dark:opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, var(--color-jogja-green) 3px, transparent 3px)', backgroundSize: '32px 32px' }} />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
          <div className="lg:col-span-5">
            <h4 className="font-mono bg-yellow-400/80 dark:bg-yellow-500/80 backdrop-blur-sm text-slate-900 inline-block px-4 py-1.5 border-2 border-slate-900 shadow-[4px_4px_0_0_rgba(15,28,53,1)] text-sm font-bold tracking-widest uppercase mb-6 rounded-full">
              / TANYA JAWAB
            </h4>
            <h2 className="text-5xl md:text-6xl font-serif text-slate-900 dark:text-white mb-8 uppercase tracking-tighter drop-shadow-[2px_2px_0_rgba(15,28,53,1)] dark:drop-shadow-none">Pusat Bantuan</h2>
            <p className="text-slate-800 dark:text-slate-300 text-lg font-sans font-medium bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-6 border-2 border-slate-900 dark:border-yellow-400 rounded-xl shadow-[4px_4px_0_0_rgba(15,28,53,1)] dark:shadow-[4px_4px_0_0_rgba(250,204,21,1)]">
              Temukan jawaban untuk pertanyaan yang paling sering diajukan oleh pengguna ekosistem digital kami.
            </p>
          </div>
          
          <div className="lg:col-span-7">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-2 border-slate-900 dark:border-yellow-400 shadow-[8px_8px_0_0_rgba(15,28,53,1)] dark:shadow-[8px_8px_0_0_rgba(250,204,21,1)] p-6 md:p-10 rounded-2xl">
              <FaqAccordion faqs={faqs} />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}