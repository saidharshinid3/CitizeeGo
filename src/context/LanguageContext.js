import React, { createContext, useState, useEffect, useContext } from 'react';
import { translations } from '../utils/translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('app_language');
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('app_language', lang);
    }
  };

  const t = (key) => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    // Fallback to English if translation is missing
    if (translations['en'] && translations['en'][key]) {
      return translations['en'][key];
    }
    // If not found in English either, just return the key
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
