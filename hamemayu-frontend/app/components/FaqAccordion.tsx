"use client";

import { useState } from 'react';
import { Faq } from '../types/api';

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  if (!faqs || faqs.length === 0) {
    return <p className="font-mono text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 p-4 border-2 border-slate-900 dark:border-yellow-400 rounded-xl">Belum ada data tanya jawab.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {faqs.map((faq, index) => (
        <div key={faq.id} className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border-2 border-slate-900 dark:border-yellow-400 rounded-xl overflow-hidden transition-all duration-300 ${activeIndex === index ? 'shadow-[6px_6px_0_0_rgba(15,28,53,1)] dark:shadow-[6px_6px_0_0_rgba(250,204,21,1)] -translate-y-1' : 'shadow-[4px_4px_0_0_rgba(15,28,53,1)] dark:shadow-[4px_4px_0_0_rgba(250,204,21,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_rgba(15,28,53,1)] dark:hover:shadow-[5px_5px_0_0_rgba(250,204,21,1)]'}`}>
          <button
            onClick={() => toggleFaq(index)}
            className="w-full flex justify-between items-center p-6 text-left group bg-transparent"
          >
            <span className={`text-lg font-bold font-serif transition-colors duration-300 pr-4 ${activeIndex === index ? 'text-green-700 dark:text-yellow-400' : 'text-slate-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-yellow-400'}`}>
              {faq.question}
            </span>
            <div className={`w-10 h-10 shrink-0 border-2 flex items-center justify-center rounded-lg transition-all duration-300 ${activeIndex === index ? 'bg-yellow-400 dark:bg-yellow-500 text-slate-900 border-slate-900 shadow-[2px_2px_0_0_rgba(15,28,53,1)]' : 'bg-white/50 dark:bg-slate-700/50 text-slate-900 dark:text-white border-slate-900 dark:border-yellow-400 group-hover:bg-yellow-400 group-hover:text-slate-900 group-hover:border-slate-900 group-hover:shadow-[2px_2px_0_0_rgba(15,28,53,1)]'}`}>
              {activeIndex === index ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              )}
            </div>
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-green-50/50 dark:bg-slate-900/50 ${activeIndex === index ? 'max-h-96 opacity-100 border-t-2 border-slate-900 dark:border-yellow-400/50' : 'max-h-0 opacity-0'}`}>
            <p className="text-slate-800 dark:text-slate-300 text-base font-sans font-medium leading-relaxed p-6">
              {faq.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}