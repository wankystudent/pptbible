import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Presentation, 
  Moon, 
  Sun, 
  LogIn, 
  LogOut,
  ArrowRight,
  HeartHandshake,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';
import ContactForm from './ContactForm';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import VerseOfDayWidget from './VerseOfDayWidget';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  onShowAbout: () => void;
  onShowTerms: () => void;
  onShowPrivacy: () => void;
  onShowDonation: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  user: any;
}

export default function LandingPage({ 
  onStart, 
  onLogin, 
  onShowAbout, 
  onShowTerms,
  onShowPrivacy,
  onShowDonation,
  darkMode, 
  setDarkMode, 
  user 
}: LandingPageProps) {
  const { t } = useLanguage();
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = t('hero.slides') || [
    { title: "Psalm 103:1", text: "Bless the Lord, O my soul..." },
    { title: "John 3:16", text: "For God so loved the world..." },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="https://i.postimg.cc/X7j5bZCj/biblslide.png" alt="Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-black tracking-tighter text-indigo-600">BibSlide</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-2xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-indigo-600 hover:bg-slate-100'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={onStart}
                  className="hidden md:flex items-center gap-2 text-indigo-600 font-bold hover:underline"
                >
                  <Layout className="w-4 h-4" /> {t('nav.dashboard')}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-500 font-bold hover:underline"
                >
                  <LogOut className="w-4 h-4" /> {t('buttons.logout')}
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" /> {t('buttons.login')}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-[0.9]" dangerouslySetInnerHTML={{ __html: t('hero.title') }} />
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={onStart}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
              >
                {t('buttons.startNow')} <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={onShowAbout}
                className={`px-8 py-4 rounded-2xl font-bold text-lg border transition-all flex items-center justify-center gap-2 ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm'}`}
              >
                {t('buttons.learnMore')}
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Animated Slide Preview */}
            <div className={`aspect-video rounded-[2.5rem] p-4 shadow-2xl transition-colors duration-500 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} border-8`}>
              <div className="w-full h-full bg-indigo-900 rounded-[1.5rem] flex flex-col items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-3xl" />
                  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 rounded-full blur-3xl" />
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slideIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-6 z-10"
                  >
                    <h3 className="text-indigo-300 font-bold tracking-widest uppercase text-sm">
                      BibSlide Preview
                    </h3>
                    <p className="text-2xl md:text-3xl font-medium text-white leading-tight">
                      "{slides[slideIndex].text}"
                    </p>
                    <p className="text-indigo-400 font-bold text-lg">
                      — {slides[slideIndex].title}
                    </p>
                  </motion.div>
                </AnimatePresence>
                
                <div className="absolute bottom-6 flex gap-2">
                  {slides.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === slideIndex ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-600/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Verse of the Day Section */}
      <section className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
        <VerseOfDayWidget />
      </section>

      {/* Features Section */}
      <section className={`py-24 px-6 transition-colors ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black tracking-tight">{t('features.title')}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">{t('features.subtitle')}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: t('features.bible.title'), desc: t('features.bible.desc') },
              { icon: Search, title: t('features.manual.title'), desc: t('features.manual.desc') },
              { icon: Presentation, title: t('features.export.title'), desc: t('features.export.desc') }
            ].map((feat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className={`p-10 rounded-[2rem] border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}
              >
                <div className="bg-indigo-600/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <feat.icon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto bg-indigo-600 rounded-[3rem] p-12 md:p-20 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 space-y-8">
            <HeartHandshake className="w-16 h-16 mx-auto text-indigo-200" />
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">{t('donation.title')}</h2>
            <p className="text-xl text-indigo-100 max-w-xl mx-auto">
              {t('donation.subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <a 
                  href="https://www.paypal.com/paypalme/wankym" 
                  target="_blank"
                  className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-indigo-50 transition-all active:scale-95"
                >
                  {t('donation.paypal')}
                </a>
                <div className="bg-white p-2 rounded-xl shadow-lg">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://www.paypal.com/paypalme/wankym" alt="PayPal QR" className="w-24 h-24" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <a 
                  href="https://donate.stripe.com/6oUbJ3fDU59O8369e6awo0b?locale=en" 
                  target="_blank"
                  className="bg-indigo-900/30 text-white border border-indigo-400/30 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-900/50 transition-all active:scale-95"
                >
                  {t('donation.stripe')}
                </a>
                <div className="bg-white p-2 rounded-xl shadow-lg">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://donate.stripe.com/6oUbJ3fDU59O8369e6awo0b" alt="Stripe QR" className="w-24 h-24" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactForm darkMode={darkMode} />

      {/* Footer */}
      <footer className={`py-8 px-6 border-t text-center transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
        <div className="max-w-6xl mx-auto">
          <p className="text-sm">
            {t('footer.copyright')}{" "}
            {t('labels.poweredBy')} <strong>Wanky Massenat</strong>.
          </p>
          <div className="flex justify-center gap-4 mt-2 text-sm font-bold flex-wrap">
            <button onClick={onShowAbout} className="hover:underline text-indigo-600">{t('nav.about')}</button>
            <span className="text-slate-300">|</span>
            <button onClick={onShowTerms} className="hover:underline text-indigo-600">{t('nav.terms')}</button>
            <span className="text-slate-300">|</span>
            <button onClick={onShowPrivacy} className="hover:underline text-indigo-600">{t('nav.privacy')}</button>
            <span className="text-slate-300">|</span>
            <button onClick={onShowDonation} className="hover:underline text-emerald-600">{t('nav.donation')} 💝</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
