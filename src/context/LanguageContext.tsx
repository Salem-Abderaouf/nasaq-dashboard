import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Direction, SUPPORTED_LANGUAGES } from '../i18n/types';
import { translations } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: Direction;
  isRtl: boolean;
  t: (key: string, fallback?: string) => string;
}

const STORAGE_KEY = 'nasaq_app_lang';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (saved && (saved === 'fr' || saved === 'en' || saved === 'ar')) {
        return saved;
      }
    } catch {}
    return 'en';
  });

  const dir: Direction = language === 'ar' ? 'rtl' : 'ltr';
  const isRtl = dir === 'rtl';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    if (isRtl) {
      document.documentElement.classList.add('is-rtl');
    } else {
      document.documentElement.classList.remove('is-rtl');
    }
  }, [language, dir, isRtl]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Could not save language to localStorage:', e);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English first if key not found in selected language
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    // Fallback to French
    if (translations.fr && translations.fr[key]) {
      return translations.fr[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir, isRtl, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
