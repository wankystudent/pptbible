import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();
  
  const langs = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  return (
    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2 py-1 rounded-lg transition-all text-sm flex items-center gap-1 ${
            lang === l.code 
            ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 font-bold' 
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
          title={l.label}
        >
          <span>{l.flag}</span>
          <span className="hidden sm:inline uppercase">{l.code}</span>
        </button>
      ))}
    </div>
  );
};
