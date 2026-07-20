'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface AccessibilityState {
  fontSize: 'normal' | 'large' | 'xlarge';
  seizureSafe: boolean;
  visionImpaired: boolean;
  adhdFriendly: boolean;
  highContrast: boolean;
  grayscale: boolean;
}

interface AccessibilityContextType extends AccessibilityState {
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  toggleSeizureSafe: () => void;
  toggleVisionImpaired: () => void;
  toggleAdhdFriendly: () => void;
  toggleHighContrast: () => void;
  toggleGrayscale: () => void;
  resetAll: () => void; // Fungsi baru untuk mereset
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const isFirstRender = useRef(true);
  
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [seizureSafe, setSeizureSafe] = useState(false);
  const [visionImpaired, setVisionImpaired] = useState(false);
  const [adhdFriendly, setAdhdFriendly] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [grayscale, setGrayscale] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('hamemayu_a11y');
      if (saved) {
        try {
          const parsed: AccessibilityState = JSON.parse(saved);
          if (parsed.fontSize) setFontSize(parsed.fontSize);
          if (parsed.seizureSafe !== undefined) setSeizureSafe(parsed.seizureSafe);
          if (parsed.visionImpaired !== undefined) setVisionImpaired(parsed.visionImpaired);
          if (parsed.adhdFriendly !== undefined) setAdhdFriendly(parsed.adhdFriendly);
          if (parsed.highContrast !== undefined) setHighContrast(parsed.highContrast);
          if (parsed.grayscale !== undefined) setGrayscale(parsed.grayscale);
        } catch (e) {
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const html = document.documentElement;
    const body = document.body;

    html.classList.remove('a11y-text-large', 'a11y-text-xlarge');
    if (fontSize === 'large') html.classList.add('a11y-text-large');
    if (fontSize === 'xlarge') html.classList.add('a11y-text-xlarge');

    body.classList.toggle('a11y-reduce-motion', seizureSafe);
    body.classList.toggle('a11y-high-contrast', highContrast || visionImpaired);
    body.classList.toggle('a11y-grayscale', grayscale);

    const stateToSave: AccessibilityState = {
      fontSize, seizureSafe, visionImpaired, adhdFriendly, highContrast, grayscale
    };
    localStorage.setItem('hamemayu_a11y', JSON.stringify(stateToSave));
  }, [fontSize, seizureSafe, visionImpaired, adhdFriendly, highContrast, grayscale]);

  const value = {
    fontSize, setFontSize,
    seizureSafe, toggleSeizureSafe: () => setSeizureSafe(p => !p),
    visionImpaired, toggleVisionImpaired: () => setVisionImpaired(p => !p),
    adhdFriendly, toggleAdhdFriendly: () => setAdhdFriendly(p => !p),
    highContrast, toggleHighContrast: () => setHighContrast(p => !p),
    grayscale, toggleGrayscale: () => setGrayscale(p => !p),
    // Definisi fungsi reset
    resetAll: () => {
      setFontSize('normal');
      setSeizureSafe(false);
      setVisionImpaired(false);
      setAdhdFriendly(false);
      setHighContrast(false);
      setGrayscale(false);
    }
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility harus digunakan di dalam AccessibilityProvider');
  }
  return context;
}