"use client";

import { useState, useRef, useEffect } from 'react';
import { fetchAPI } from '../lib/api';
import Image from 'next/image';

interface MapData {
  label: string;
  url: string;
  source: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  maps?: MapData | null;
  suggestions?: string[];
}

interface ChatApiResponse {
  bot_name: string;
  message: string;
  timestamp: string;
  suggestions: string[];
  is_ai_generated: boolean;
  maps: MapData | null;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'SALAM EKSPLORASI! SAYA HALOMAYU. ADA YANG BISA SAYA BANTU TERKAIT YOGYAKARTA?',
      timestamp: new Date().toISOString(),
      suggestions: [
        'Rekomendasi kuliner legendaris',
        'Cari wisata sejarah terdekat',
        'Cara ke Candi Prambanan'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-4)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      const res = await fetchAPI<ChatApiResponse>('/chat', {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify({ 
          message: text,
          history: chatHistory 
        })
      });

      if (res) {
        const botMessage: ChatMessage = {
          id: crypto.randomUUID(),
          sender: 'bot',
          text: res.message,
          timestamp: res.timestamp,
          maps: res.maps,
          suggestions: res.suggestions
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'bot',
        text: '[ GANGGUAN SINYAL. GAGAL MENGHUBUNGI SERVER PUSAT. SILAKAN COBA LAGI. ]',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 bg-golden-heritage rounded-xl border-2 border-slate-900 brutal-shadow flex items-center z-60 hover:-translate-y-1 hover:translate-x-1 transition-transform group overflow-hidden"
        aria-label="Toggle Chat"
      >
        {isOpen ? (
          <div className="w-16 h-16 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        ) : (
          <div className="p-3 pr-5 flex items-center gap-3">
            <div className="relative w-12 h-12 shrink-0">
              <div className="absolute inset-0 border-2 border-slate-900 rounded-full animate-ping opacity-20 bg-slate-900"></div>
              <Image 
                src="/images/logo-adat-jawa.png"
                alt="Logo HaloMayu Adat Jawa"
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-mono text-[10px] text-slate-500 uppercase">ASISTEN AI</span>
              <span className="font-serif text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">CHAT MAYU</span>
            </div>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-36 md:bottom-28 right-4 md:right-8 w-[calc(100vw-32px)] md:w-96 h-125 max-h-[60vh] bg-white dark:bg-[#0F1C35] border-4 border-slate-900 dark:border-white/20 brutal-shadow z-60 flex flex-col animate-in slide-in-from-bottom-8 duration-300">
          
          <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 border-b-2 border-slate-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse border border-slate-900"></div>
              <h3 className="font-serif font-bold text-lg uppercase tracking-widest">HALOMAYU AI</h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#F4F0EA] dark:bg-[#0B1426] hide-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 font-mono text-sm border-2 ${
                    msg.sender === 'user' 
                      ? 'bg-golden-heritage text-slate-900 border-slate-900 brutal-shadow-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-900 dark:border-white/20'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  
                  {msg.maps && msg.maps.url && (
                    <a 
                      href={msg.maps.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-2 text-xs font-bold uppercase hover:bg-slate-800 transition-colors w-fit border border-slate-900"
                    >
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      BUKA RADAR: {msg.maps.label}
                    </a>
                  )}
                </div>
                
                {msg.sender === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 max-w-[90%]">
                    {msg.suggestions.map((suggestion, idx) => (
                      <button 
                        key={idx}
                        onClick={() => sendMessage(suggestion)}
                        className="bg-white dark:bg-transparent text-slate-600 dark:text-slate-400 border border-slate-400 dark:border-slate-600 px-2 py-1 font-mono text-[10px] uppercase hover:bg-golden-heritage hover:text-slate-900 transition-colors text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-white/20 p-3 font-mono text-sm brutal-shadow-sm flex gap-2 items-center text-slate-500">
                  <span className="w-2 h-2 bg-slate-500 animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-500 animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-slate-500 animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t-2 border-slate-900 dark:border-white/20 bg-white dark:bg-[#0F1C35] flex gap-2 shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="TULIS PERINTAH..."
              className="flex-1 bg-[#F4F0EA] dark:bg-slate-900 border-2 border-slate-900 dark:border-white/20 px-3 py-2 font-mono text-xs focus:outline-none focus:border-golden-heritage text-slate-900 dark:text-white uppercase"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="bg-golden-heritage text-slate-900 px-4 border-2 border-slate-900 font-bold disabled:opacity-50 hover:bg-yellow-500 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </form>

        </div>
      )}
    </>
  );
}