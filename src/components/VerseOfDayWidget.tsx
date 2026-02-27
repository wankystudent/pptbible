import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { BookOpen } from 'lucide-react';

export default function VerseOfDayWidget() {
  const { lang, t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Map app language to DailyVerses language
    const langMap: Record<string, string> = {
      en: 'en',
      fr: 'sg21',
      es: 'es'
    };
    const dvLang = langMap[lang] || 'sg21';

    // Clear previous content to handle re-renders/language changes
    if (containerRef.current) {
      containerRef.current.innerHTML = '<div id="dailyVersesWrapper"></div>';
    }

    // Create and append the script
    const script = document.createElement('script');
    script.src = `https://dailyverses.net/get/verse.js?language=${dvLang}`;
    script.async = true;
    script.defer = true;
    script.id = 'daily-verses-script';
    
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount or language change
      const existingScript = document.getElementById('daily-verses-script');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [lang]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 my-6 border border-slate-100 dark:border-slate-700 transition-all hover:shadow-md">
      <h3 className="text-indigo-600 dark:text-indigo-400 font-bold text-lg mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" /> {t('labels.verseOfDay')}
      </h3>
      
      <div ref={containerRef} className="verse-container min-h-[60px]">
        <div id="dailyVersesWrapper">
          <div className="animate-pulse flex space-y-2 flex-col">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/50">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
          Source: DailyVerses.net
        </p>
      </div>

      <noscript>
        <p className="text-sm text-red-500 mt-2">
          Veuillez activer JavaScript pour voir le verset du jour.
        </p>
      </noscript>

      <style>{`
        /* Style overrides for the external widget content */
        #dailyVersesWrapper .dv-verse {
          font-size: 1.125rem !important;
          line-height: 1.75rem !important;
          color: inherit !important;
          font-family: inherit !important;
          margin-bottom: 0.5rem !important;
        }
        #dailyVersesWrapper .dv-reference {
          font-weight: 700 !important;
          color: #4f46e5 !important;
          text-decoration: none !important;
        }
        .dark #dailyVersesWrapper .dv-verse {
          color: #e2e8f0 !important;
        }
        #dailyVersesWrapper a {
          color: inherit !important;
          text-decoration: none !important;
        }
      `}</style>
    </div>
  );
}
