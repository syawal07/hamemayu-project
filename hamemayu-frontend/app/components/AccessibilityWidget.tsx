'use client';

import React, { useState } from 'react';
import { useAccessibility } from './AccessibilityProvider';

const translations = {
  id: {
    menuTitle: "Menu Aksesibilitas",
    profiles: "Profil Aksesibilitas",
    seizure: "Profil Aman untuk Kejang",
    seizureDesc: "Menghentikan animasi dan mengurangi saturasi warna.",
    vision: "Profil untuk Tunanetra",
    visionDesc: "Meningkatkan kontras warna secara signifikan.",
    mono: "Profil Monokrom",
    monoDesc: "Menonaktifkan semua spektrum warna.",
    adhd: "Profil Ramah ADHD",
    adhdDesc: "Menyembunyikan gangguan untuk memusatkan fokus.",
    individual: "Penyesuaian Individual",
    textSize: "Ukuran Teks",
    textNormal: "Normal",
    textLarge: "Besar",
    textXLarge: "Ekstra Besar",
    statement: "Pernyataan Aksesibilitas"
  },
  en: {
    menuTitle: "Accessibility Menu",
    profiles: "Accessibility Profiles",
    seizure: "Seizure Safe Profile",
    seizureDesc: "Stops animations and reduces color saturation.",
    vision: "Vision Impaired Profile",
    visionDesc: "Significantly enhances color contrast.",
    mono: "Monochrome Profile",
    monoDesc: "Disables all color spectrums.",
    adhd: "ADHD Friendly Profile",
    adhdDesc: "Hides distractions to maintain focus.",
    individual: "Individual Adjustments",
    textSize: "Text Scaling",
    textNormal: "Normal",
    textLarge: "Large",
    textXLarge: "Extra Large",
    statement: "Accessibility Statement"
  }
};

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}

function Switch({ checked, onChange, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jogja-green focus-visible:ring-offset-2 ${
        checked ? 'bg-jogja-green' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const t = translations[lang];

  const {
    seizureSafe, toggleSeizureSafe,
    visionImpaired, toggleVisionImpaired,
    adhdFriendly, toggleAdhdFriendly,
    grayscale, toggleGrayscale,
    fontSize, setFontSize,
    resetAll
  } = useAccessibility();

  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });
  const [isDraggingBtn, setIsDraggingBtn] = useState(false);
  const [btnDragStart, setBtnDragStart] = useState({ x: 0, y: 0 });
  const [btnInitialClick, setBtnInitialClick] = useState({ x: 0, y: 0 });
  const [btnHasMoved, setBtnHasMoved] = useState(false);

  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [modalDragStart, setModalDragStart] = useState({ x: 0, y: 0 });

  const handleBtnPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingBtn(true);
    setBtnHasMoved(false);
    setBtnInitialClick({ x: e.clientX, y: e.clientY });
    setBtnDragStart({ x: e.clientX - btnPos.x, y: e.clientY - btnPos.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBtnPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingBtn) {
      if (Math.abs(e.clientX - btnInitialClick.x) > 5 || Math.abs(e.clientY - btnInitialClick.y) > 5) {
        setBtnHasMoved(true);
      }
      setBtnPos({ x: e.clientX - btnDragStart.x, y: e.clientY - btnDragStart.y });
    }
  };

  const handleBtnPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingBtn(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    if (!btnHasMoved) {
      setIsOpen(prev => !prev);
      setModalPos({ x: 0, y: 0 });
    }
  };

  const handleModalPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingModal(true);
    setModalDragStart({ x: e.clientX - modalPos.x, y: e.clientY - modalPos.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleModalPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingModal) {
      setModalPos({ x: e.clientX - modalDragStart.x, y: e.clientY - modalDragStart.y });
    }
  };

  const handleModalPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingModal(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <>
      <div 
        className="fixed bottom-[110px] md:bottom-8 right-4 md:right-8 z-[70] flex items-center select-none touch-none group"
        style={{ transform: `translate(${btnPos.x}px, ${btnPos.y}px)` }}
        onPointerDown={handleBtnPointerDown}
        onPointerMove={handleBtnPointerMove}
        onPointerUp={handleBtnPointerUp}
        onPointerCancel={handleBtnPointerUp}
      >
        <div className="absolute right-full mr-4 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 pointer-events-none flex items-center">
          <div className="relative bg-green-700 text-yellow-400 border border-yellow-400 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap shadow-md font-sans">
            Fitur Aksesibilitas
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-green-700 border-t border-r border-yellow-400 rotate-45"></div>
          </div>
        </div>

        <div className="absolute -inset-2 rounded-full bg-jogja-gold/30 animate-pulse pointer-events-none"></div>
        
        <button
          aria-label={t.menuTitle}
          className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-jogja-green text-jogja-gold shadow-xl border-2 border-jogja-gold/80 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jogja-gold focus-visible:ring-offset-2 ${isDraggingBtn ? 'cursor-grabbing scale-105' : 'cursor-pointer hover:scale-105'}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 pointer-events-none">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
          </svg>
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed bottom-[170px] md:bottom-28 right-4 md:right-8 z-[100] glass-panel flex w-[calc(100vw-32px)] max-w-md flex-col overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-bottom-8"
          style={{ transform: `translate(${modalPos.x}px, ${modalPos.y}px)` }}
        >
          
          <div className="flex items-center justify-between bg-jogja-green px-6 py-4 text-white">
            <div 
              className={`flex-1 font-serif text-lg font-bold select-none touch-none ${isDraggingModal ? 'cursor-grabbing' : 'cursor-grab'}`}
              onPointerDown={handleModalPointerDown}
              onPointerMove={handleModalPointerMove}
              onPointerUp={handleModalPointerUp}
              onPointerCancel={handleModalPointerUp}
            >
              {t.menuTitle}
            </div>
            
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <button onClick={() => resetAll()} aria-label="Reset Pengaturan" className="rounded-full bg-white/20 p-2 hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button onClick={() => setIsOpen(false)} aria-label="Tutup Menu" className="rounded-full bg-white/20 p-2 hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar max-h-[60vh]">
            
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <select 
                value={lang}
                onChange={(e) => setLang(e.target.value as 'id' | 'en')}
                className="w-full bg-transparent font-sans text-sm font-medium text-slate-900 focus-visible:outline-none dark:text-white cursor-pointer" 
                aria-label="Pilih Bahasa"
              >
                <option value="id">Bahasa Indonesia (Indonesian)</option>
                <option value="en">English (US)</option>
              </select>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t.profiles}</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
              <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /><line x1="3" y1="3" x2="21" y2="21" strokeWidth={2} strokeLinecap="round" /></svg>
                  </div>
                  <Switch checked={seizureSafe} onChange={toggleSeizureSafe} ariaLabel={t.seizure} />
                </div>
                <h4 className="font-sans text-sm font-bold text-slate-900 dark:text-white">{t.seizure}</h4>
                <p className="mt-1 font-sans text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.seizureDesc}</p>
              </div>

              <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  </div>
                  <Switch checked={visionImpaired} onChange={toggleVisionImpaired} ariaLabel={t.vision} />
                </div>
                <h4 className="font-sans text-sm font-bold text-slate-900 dark:text-white">{t.vision}</h4>
                <p className="mt-1 font-sans text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.visionDesc}</p>
              </div>

              <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </div>
                  <Switch checked={grayscale} onChange={toggleGrayscale} ariaLabel={t.mono} />
                </div>
                <h4 className="font-sans text-sm font-bold text-slate-900 dark:text-white">{t.mono}</h4>
                <p className="mt-1 font-sans text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.monoDesc}</p>
              </div>

              <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <Switch checked={adhdFriendly} onChange={toggleAdhdFriendly} ariaLabel={t.adhd} />
                </div>
                <h4 className="font-sans text-sm font-bold text-slate-900 dark:text-white">{t.adhd}</h4>
                <p className="mt-1 font-sans text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.adhdDesc}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t.individual}</h3>
            </div>
            
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h4 className="mb-4 font-sans text-sm font-bold text-slate-900 dark:text-white">{t.textSize}</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setFontSize('normal')}
                  className={`flex-1 rounded-xl py-2 font-sans text-xs font-bold transition-colors border-2 ${fontSize === 'normal' ? 'border-jogja-green bg-jogja-green/10 text-jogja-green dark:border-yellow-400 dark:bg-yellow-400/10 dark:text-yellow-400' : 'border-slate-200 bg-transparent text-slate-600 dark:border-slate-700 dark:text-slate-400'}`}
                >
                  {t.textNormal}
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`flex-1 rounded-xl py-2 font-sans text-sm font-bold transition-colors border-2 ${fontSize === 'large' ? 'border-jogja-green bg-jogja-green/10 text-jogja-green dark:border-yellow-400 dark:bg-yellow-400/10 dark:text-yellow-400' : 'border-slate-200 bg-transparent text-slate-600 dark:border-slate-700 dark:text-slate-400'}`}
                >
                  {t.textLarge}
                </button>
                <button
                  onClick={() => setFontSize('xlarge')}
                  className={`flex-1 rounded-xl py-2 font-sans text-base font-bold transition-colors border-2 ${fontSize === 'xlarge' ? 'border-jogja-green bg-jogja-green/10 text-jogja-green dark:border-yellow-400 dark:bg-yellow-400/10 dark:text-yellow-400' : 'border-slate-200 bg-transparent text-slate-600 dark:border-slate-700 dark:text-slate-400'}`}
                >
                  {t.textXLarge}
                </button>
              </div>
            </div>

          </div>

          <div className="bg-slate-50 px-6 py-4 dark:bg-slate-800">
            <a href="#" className="font-mono text-xs font-bold text-slate-500 underline underline-offset-4 hover:text-jogja-green dark:text-slate-400 dark:hover:text-jogja-gold">
              {t.statement}
            </a>
          </div>

        </div>
      )}
    </>
  );
}