/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Settings, 
  BookOpen, 
  Layers, 
  Palette, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Music,
  Type,
  ClipboardPaste,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Image,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import pptxgen from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from './supabaseClient';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SlideOptions from './components/SlideOptions';
import SlidePreview from './components/SlidePreview';
import CanvaIntegration from './components/CanvaIntegration';
import ContactForm from './components/ContactForm';
import AboutContent from './components/AboutContent';
import BibleSearch from './components/BibleSearch';
import bibleFallback from './bible_fallback.json';
import { useLanguage } from './i18n/LanguageContext';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { fetchBiblePassage } from './services/bibleService';

interface Verse {
  number: number;
  text: string;
}

interface BibleData {
  book: string;
  chapter: number;
  verses: Verse[];
  language: string;
  source: string;
}

interface SongPart {
  part: string;
  lines: string[];
}

interface SongData {
  title: string;
  collection?: string;
  author?: string;
  language: string;
  license: string;
  lyrics: SongPart[];
}

const LANGUAGES = [
  { id: 'Kreyòl', label: 'Kreyòl' },
  { id: 'Français', label: 'Français' },
  { id: 'English', label: 'English' },
];

const BIBLE_TRANSLATIONS = [
  { id: 'Louis Segond 1910', label: 'Louis Segond 1910' },
  { id: 'King James Version (KJV)', label: 'KJV' },
  { id: 'Reina-Valera 1960', label: 'RVR60' },
];

const THEMES = (t: any) => [
  { id: 'light', label: t('labels.themeLight'), bg: 'bg-white', text: 'text-slate-900', accent: 'bg-indigo-600' },
  { id: 'dark', label: t('labels.themeDark'), bg: 'bg-slate-900', text: 'text-white', accent: 'bg-indigo-500' },
  { id: 'worship', label: t('labels.themeWorship'), bg: 'bg-blue-900', text: 'text-blue-50', accent: 'bg-blue-400' },
  { id: 'gold', label: 'Doré', bg: 'bg-amber-900', text: 'text-amber-50', accent: 'bg-amber-500' },
  { id: 'nature', label: t('labels.themeNature'), bg: 'bg-emerald-900', text: 'text-emerald-50', accent: 'bg-emerald-400' },
];

export default function App() {
  const { lang, t } = useLanguage();
  const [view, setView] = useState<'landing' | 'generator' | 'auth' | 'dashboard'>('landing');
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);

  const [mode, setMode] = useState<'bible' | 'song' | 'paste'>('bible');
  const [reference, setReference] = useState('');
  const [themeInput, setThemeInput] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [pasteType, setPasteType] = useState<'bible' | 'song'>('bible');
  const [language, setLanguage] = useState('Kreyòl');
  const [bibleTranslation, setBibleTranslation] = useState('Bib Kreyòl 1985');
  const [loading, setLoading] = useState(false);
  const [bibleData, setBibleData] = useState<BibleData | null>(null);
  const [songData, setSongData] = useState<SongData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Slide Options
  const [versesPerSlide, setVersesPerSlide] = useState(1);
  const [linesPerSlide, setLinesPerSlide] = useState(2);
  const [selectedTheme, setSelectedTheme] = useState(THEMES(t)[1]);
  const [churchName, setChurchName] = useState('');

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Update default translation when language changes
  useEffect(() => {
    if (lang === 'en') setBibleTranslation('King James Version (KJV)');
    else if (lang === 'es') setBibleTranslation('Reina-Valera 1960');
    else setBibleTranslation('Louis Segond 1910');
  }, [lang]);

  const [slideStyle, setSlideStyle] = useState({
    font: "Arial",
    fontSize: 32,
    bgColor: "#ffffff",
    brightness: 100,
    textColor: "#000000",
    bgImage: null as string | null,
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

  // Auto Save & Load
  useEffect(() => {
    const saved = localStorage.getItem('bibslide_autosave');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.slideStyle) setSlideStyle(data.slideStyle);
        if (data.bibleData) setBibleData(data.bibleData);
        if (data.songData) setSongData(data.songData);
        if (data.pastedText) setPastedText(data.pastedText);
        if (data.mode) setMode(data.mode);
        if (data.reference) setReference(data.reference);
      } catch (e) {
        console.error("Failed to load autosave", e);
      }
    }
  }, []);

  useEffect(() => {
    const dataToSave = {
      slideStyle,
      bibleData,
      songData,
      pastedText,
      mode,
      reference
    };
    localStorage.setItem('bibslide_autosave', JSON.stringify(dataToSave));
  }, [slideStyle, bibleData, songData, pastedText, mode, reference]);

  const adjustBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * (percent - 100));
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  };

  const getSlidesForPreview = () => {
    if (mode === 'bible' && bibleData) {
      const grouped: string[] = [];
      for (let i = 0; i < bibleData.verses.length; i += versesPerSlide) {
        grouped.push(bibleData.verses.slice(i, i + versesPerSlide).map(v => `${v.number}. ${v.text}`).join('\n\n'));
      }
      return grouped;
    } else if (mode === 'song' && songData) {
      const allLines: string[] = [];
      songData.lyrics.forEach(part => {
        for (let i = 0; i < part.lines.length; i += linesPerSlide) {
          allLines.push(part.lines.slice(i, i + linesPerSlide).join('\n'));
        }
      });
      return allLines;
    } else if (mode === 'paste' && pastedText) {
      const lines = pastedText.split(/\r?\n/).filter(l => l.trim() !== "");
      const chunkSize = pasteType === 'bible' ? versesPerSlide : linesPerSlide;
      const grouped: string[] = [];
      for (let i = 0; i < lines.length; i += chunkSize) {
        grouped.push(lines.slice(i, i + chunkSize).join('\n'));
      }
      return grouped;
    }
    return [];
  };

  const previewSlides = getSlidesForPreview();

  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [previewSlides.length]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        setSlideStyle(data.preferences);
      }
    } catch (err) {
      console.error("Error loading preferences:", err);
    }
  };

  const handleSaveDesign = async (options: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user.id, 
          preferences: options,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      alert("Design ou sove ak siksè! 🎉");
    } catch (err) {
      console.error("Error saving design:", err);
      alert("Gen yon erè ki rive lè n ap sove design ou.");
    }
  };

  const fetchVerses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setLoading(true);
    setError(null);
    setBibleData(null);
    setSongData(null);

    const BIBLIA_KEY = import.meta.env.VITE_BIBLIA_API_KEY || 'a885981dd77323d92bb9190a36c6ea24';
    const translationMap: Record<string, string> = {
      'Louis Segond 1910': 'lsg',
      'King James Version (KJV)': 'kjv',
      'Reina-Valera 1960': 'rvr60'
    };

    try {
      if (mode === 'bible') {
        const ref = reference.trim();
        const match = ref.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);
        
        // Offline: Try local fallback first
        if (!navigator.onLine) {
          if (match) {
            const [_, book, chapter, verseStart, verseEnd] = match;
            const searchKey = `${book} ${chapter}`;
            
            const fallbackKeys = Object.keys(bibleFallback);
            const foundKey = fallbackKeys.find(k => k.toLowerCase().includes(searchKey.toLowerCase()));
            
            if (foundKey) {
              const text = bibleFallback[foundKey as keyof typeof bibleFallback];
              setBibleData({
                book: book,
                chapter: parseInt(chapter),
                verses: [{ number: parseInt(verseStart) || 1, text }],
                language: 'Kreyòl',
                source: 'Offline Fallback'
              });
              setLoading(false);
              return;
            }
          }
        }

        const translation = translationMap[bibleTranslation] || (lang === 'en' ? 'kjv' : lang === 'es' ? 'rvr60' : 'lsg');
        
        // EXCLUSIVE for others: Biblia ONLY
        const bibliaTranslation = translation.toUpperCase();
        const BIBLIA_KEY = import.meta.env.VITE_BIBLIA_API_KEY || 'a885981dd77323d92bb9190a36c6ea24';
        const url = `https://api.biblia.com/v1/bible/content/${bibliaTranslation}.txt.json?passage=${encodeURIComponent(reference)}&key=${BIBLIA_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(t('messages.errorSearch'));
        const data = await response.json();
        
        if (!data.text) throw new Error(t('messages.errorNoVerse'));

        setBibleData({
          book: reference.split(' ')[0],
          chapter: 0,
          verses: [{ number: 0, text: data.text }],
          language: language,
          source: bibleTranslation
        });
      } else {
        setError(t('messages.songSearchNotAvailable'));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePPTX = () => {
    if (!bibleData && !songData && !pastedText) return;

    const pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';

    const themeColors = {
      light: { bg: 'FFFFFF', text: '1E293B', accent: '4F46E5' },
      dark: { bg: '0F172A', text: 'F8FAFC', accent: '6366F1' },
      worship: { bg: '1E3A8A', text: 'EFF6FF', accent: '60A5FA' },
      nature: { bg: '064E3B', text: 'ECFDF5', accent: '34D399' },
    }[selectedTheme.id as 'light' | 'dark' | 'worship' | 'nature'];

    const adjustedBg = adjustBrightness(slideStyle.bgColor, slideStyle.brightness).replace('#', '');
    const isDarkBg = slideStyle.brightness < 50 || (parseInt(slideStyle.bgColor.replace('#', ''), 16) < 0x888888 && slideStyle.brightness < 80);
    const calculatedTextColor = isDarkBg ? 'FFFFFF' : '000000';
    const textColor = (slideStyle.textColor || calculatedTextColor).replace('#', '');

    if (mode === 'bible' && bibleData) {
      // ... existing bible logic ...
      const groupedVerses: Verse[][] = [];
      for (let i = 0; i < bibleData.verses.length; i += versesPerSlide) {
        groupedVerses.push(bibleData.verses.slice(i, i + versesPerSlide));
      }

      groupedVerses.forEach((group) => {
        const slide = pres.addSlide();
        if (slideStyle.bgImage) {
          slide.background = { data: slideStyle.bgImage };
          // Add overlay for brightness
          if (slideStyle.brightness < 100) {
            slide.addShape(pres.ShapeType.rect, {
              x: 0, y: 0, w: '100%', h: '100%',
              fill: { color: '000000', transparency: slideStyle.brightness }
            });
          }
        } else {
          slide.background = { color: adjustedBg };
        }

        if (churchName) {
          slide.addText(churchName, {
            x: 0.5, y: 0.3, w: '90%',
            fontSize: 14,
            color: themeColors.accent,
            align: 'right',
            italic: true
          });
        }

        const verseText = group.map(v => `${v.number}. ${v.text}`).join('\n\n');
        slide.addText(verseText, {
          x: 1, y: 1, w: '80%', h: '60%',
          fontSize: group.length > 2 ? slideStyle.fontSize - 8 : slideStyle.fontSize,
          color: textColor,
          align: 'center',
          valign: 'middle',
          fontFace: slideStyle.font
        });

        const refText = `${bibleData.book} ${bibleData.chapter}:${group[0].number}${group.length > 1 ? '-' + group[group.length - 1].number : ''}`;
        slide.addText(refText, {
          x: 0.5, y: 4.8, w: '90%',
          fontSize: 18,
          color: themeColors.accent,
          align: 'center',
          bold: true
        });
      });

      pres.writeFile({ fileName: `${bibleData.book}_${bibleData.chapter}.pptx` });
    } else if (mode === 'song' && songData) {
      // ... existing song logic ...
      let sTitle = pres.addSlide();
      if (slideStyle.bgImage) {
        sTitle.background = { data: slideStyle.bgImage };
        if (slideStyle.brightness < 100) {
          sTitle.addShape(pres.ShapeType.rect, {
            x: 0, y: 0, w: '100%', h: '100%',
            fill: { color: '000000', transparency: slideStyle.brightness }
          });
        }
      } else {
        sTitle.background = { color: adjustedBg };
      }
      sTitle.addText(songData.title, { 
        x: 1, y: 2.5, w: '80%',
        fontSize: 44, bold: true, color: textColor, align: 'center', fontFace: slideStyle.font
      });
      if (songData.author) {
        sTitle.addText(`Otè: ${songData.author}`, { 
          x: 1, y: 4, w: '80%',
          fontSize: 18, italic: true, color: themeColors.accent, align: 'center' 
        });
      }

      songData.lyrics.forEach((partObj) => {
        const part = partObj.part || '';
        const lines = partObj.lines || [];

        for (let i = 0; i < lines.length; i += linesPerSlide) {
          const chunk = lines.slice(i, i + linesPerSlide);
          const slide = pres.addSlide();
          if (slideStyle.bgImage) {
            slide.background = { data: slideStyle.bgImage };
            if (slideStyle.brightness < 100) {
              slide.addShape(pres.ShapeType.rect, {
                x: 0, y: 0, w: '100%', h: '100%',
                fill: { color: '000000', transparency: slideStyle.brightness }
              });
            }
          } else {
            slide.background = { color: adjustedBg };
          }

          if (part) {
            slide.addText(part.toUpperCase(), { 
              x: 0.5, y: 0.3, w: '90%',
              fontSize: 14, color: themeColors.accent, bold: true 
            });
          }

          slide.addText(chunk.join("\n"), {
            x: 1, y: 1, w: '80%', h: '60%',
            fontSize: chunk.length > 2 ? slideStyle.fontSize - 8 : slideStyle.fontSize,
            color: textColor,
            align: "center",
            valign: "middle",
            fontFace: slideStyle.font
          });

          slide.addText(`${songData.title} — ${songData.author || ""}`, { 
            x: 0.5, y: 4.8, w: '90%',
            fontSize: 12, color: themeColors.accent, align: 'center' 
          });
        }
      });

      pres.writeFile({ fileName: `${songData.title.replace(/\s+/g, '_')}.pptx` });
    } else if (mode === 'paste' && pastedText) {
      const lines = pastedText.split(/\r?\n/).filter(l => l.trim() !== "");
      const chunkSize = pasteType === 'bible' ? versesPerSlide : linesPerSlide;
      
      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize);
        const slide = pres.addSlide();
        if (slideStyle.bgImage) {
          slide.background = { data: slideStyle.bgImage };
          if (slideStyle.brightness < 100) {
            slide.addShape(pres.ShapeType.rect, {
              x: 0, y: 0, w: '100%', h: '100%',
              fill: { color: '000000', transparency: slideStyle.brightness }
            });
          }
        } else {
          slide.background = { color: adjustedBg };
        }

        if (churchName) {
          slide.addText(churchName, {
            x: 0.5, y: 0.3, w: '90%',
            fontSize: 14,
            color: themeColors.accent,
            align: 'right',
            italic: true
          });
        }

        slide.addText(chunk.join("\n"), {
          x: 1, y: 1, w: '80%', h: '60%',
          fontSize: chunk.length > 2 ? slideStyle.fontSize - 8 : slideStyle.fontSize,
          color: textColor,
          align: 'center',
          valign: 'middle',
          fontFace: slideStyle.font
        });
      }
      pres.writeFile({ fileName: `BibSlide_Pasted.pptx` });
    }
  };

  const generatePDF = () => {
    if (!bibleData && !songData && !pastedText) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1280, 720]
    });

    const themeColors = {
      light: { bg: '#FFFFFF', text: '#1E293B', accent: '#4F46E5' },
      dark: { bg: '#0F172A', text: '#F8FAFC', accent: '#6366F1' },
      worship: { bg: '#1E3A8A', text: '#EFF6FF', accent: '#60A5FA' },
      nature: { bg: '#064E3B', text: '#ECFDF5', accent: '#34D399' },
    }[selectedTheme.id as 'light' | 'dark' | 'worship' | 'nature'];

    const adjustedBg = adjustBrightness(slideStyle.bgColor, slideStyle.brightness);
    const isDarkBg = slideStyle.brightness < 50 || (parseInt(slideStyle.bgColor.replace('#', ''), 16) < 0x888888 && slideStyle.brightness < 80);
    const calculatedTextColor = isDarkBg ? '#FFFFFF' : '#000000';
    const textColor = slideStyle.textColor || calculatedTextColor;

    if (mode === 'bible' && bibleData) {
      // ... existing bible logic ...
      const groupedVerses: Verse[][] = [];
      for (let i = 0; i < bibleData.verses.length; i += versesPerSlide) {
        groupedVerses.push(bibleData.verses.slice(i, i + versesPerSlide));
      }

      groupedVerses.forEach((group, index) => {
        if (index > 0) doc.addPage([1280, 720], 'landscape');
        
        if (slideStyle.bgImage) {
          doc.addImage(slideStyle.bgImage, 'JPEG', 0, 0, 1280, 720);
          if (slideStyle.brightness < 100) {
            doc.setFillColor(0, 0, 0);
            doc.setGState(new (doc as any).GState({ opacity: (100 - slideStyle.brightness) / 100 }));
            doc.rect(0, 0, 1280, 720, 'F');
            doc.setGState(new (doc as any).GState({ opacity: 1 }));
          }
        } else {
          doc.setFillColor(adjustedBg);
          doc.rect(0, 0, 1280, 720, 'F');
        }

        if (churchName) {
          doc.setFontSize(24);
          doc.setTextColor(themeColors.accent);
          doc.text(churchName, 1200, 40, { align: 'right' });
        }

        doc.setTextColor(textColor);
        doc.setFont(slideStyle.font);
        const fontSize = group.length > 2 ? slideStyle.fontSize * 1.2 : slideStyle.fontSize * 1.5;
        doc.setFontSize(fontSize);
        const verseText = group.map(v => `${v.number}. ${v.text}`).join('\n\n');
        const splitText = doc.splitTextToSize(verseText, 1000);
        const textHeight = splitText.length * fontSize * 1.2;
        const yPos = (720 - textHeight) / 2 + fontSize;
        doc.text(splitText, 640, yPos, { align: 'center' });

        const refText = `${bibleData.book} ${bibleData.chapter}:${group[0].number}${group.length > 1 ? '-' + group[group.length - 1].number : ''}`;
        doc.setFontSize(28);
        doc.setTextColor(themeColors.accent);
        doc.text(refText, 640, 680, { align: 'center' });
      });

      doc.save(`${bibleData.book}_${bibleData.chapter}.pdf`);
    } else if (mode === 'song' && songData) {
      // ... existing song logic ...
      if (slideStyle.bgImage) {
        doc.addImage(slideStyle.bgImage, 'JPEG', 0, 0, 1280, 720);
        if (slideStyle.brightness < 100) {
          doc.setFillColor(0, 0, 0);
          doc.setGState(new (doc as any).GState({ opacity: (100 - slideStyle.brightness) / 100 }));
          doc.rect(0, 0, 1280, 720, 'F');
          doc.setGState(new (doc as any).GState({ opacity: 1 }));
        }
      } else {
        doc.setFillColor(adjustedBg);
        doc.rect(0, 0, 1280, 720, 'F');
      }
      doc.setTextColor(textColor);
      doc.setFont(slideStyle.font);
      doc.setFontSize(64);
      doc.text(songData.title, 640, 300, { align: 'center' });
      if (songData.author) {
        doc.setFontSize(32);
        doc.setTextColor(themeColors.accent);
        doc.text(`Otè: ${songData.author}`, 640, 380, { align: 'center' });
      }

      songData.lyrics.forEach((partObj) => {
        const part = partObj.part || '';
        const lines = partObj.lines || [];

        for (let i = 0; i < lines.length; i += linesPerSlide) {
          const chunk = lines.slice(i, i + linesPerSlide);
          doc.addPage([1280, 720], 'landscape');
          if (slideStyle.bgImage) {
            doc.addImage(slideStyle.bgImage, 'JPEG', 0, 0, 1280, 720);
            if (slideStyle.brightness < 100) {
              doc.setFillColor(0, 0, 0);
              doc.setGState(new (doc as any).GState({ opacity: (100 - slideStyle.brightness) / 100 }));
              doc.rect(0, 0, 1280, 720, 'F');
              doc.setGState(new (doc as any).GState({ opacity: 1 }));
            }
          } else {
            doc.setFillColor(adjustedBg);
            doc.rect(0, 0, 1280, 720, 'F');
          }

          if (part) {
            doc.setFontSize(24);
            doc.setTextColor(themeColors.accent);
            doc.text(part.toUpperCase(), 40, 40);
          }

          doc.setTextColor(textColor);
          doc.setFont(slideStyle.font);
          const fontSize = chunk.length > 2 ? slideStyle.fontSize * 1.2 : slideStyle.fontSize * 1.5;
          doc.setFontSize(fontSize);
          const verseText = chunk.join("\n");
          const splitText = doc.splitTextToSize(verseText, 1000);
          const textHeight = splitText.length * fontSize * 1.2;
          const yPos = (720 - textHeight) / 2 + fontSize;
          doc.text(splitText, 640, yPos, { align: 'center' });

          doc.setFontSize(20);
          doc.setTextColor(themeColors.accent);
          doc.text(`${songData.title} — ${songData.author || ""}`, 640, 680, { align: 'center' });
        }
      });

      doc.save(`${songData.title.replace(/\s+/g, '_')}.pdf`);
    } else if (mode === 'paste' && pastedText) {
      const lines = pastedText.split(/\r?\n/).filter(l => l.trim() !== "");
      const chunkSize = pasteType === 'bible' ? versesPerSlide : linesPerSlide;

      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize);
        if (i > 0) doc.addPage([1280, 720], 'landscape');
        if (slideStyle.bgImage) {
          doc.addImage(slideStyle.bgImage, 'JPEG', 0, 0, 1280, 720);
          if (slideStyle.brightness < 100) {
            doc.setFillColor(0, 0, 0);
            doc.setGState(new (doc as any).GState({ opacity: (100 - slideStyle.brightness) / 100 }));
            doc.rect(0, 0, 1280, 720, 'F');
            doc.setGState(new (doc as any).GState({ opacity: 1 }));
          }
        } else {
          doc.setFillColor(adjustedBg);
          doc.rect(0, 0, 1280, 720, 'F');
        }

        if (churchName) {
          doc.setFontSize(24);
          doc.setTextColor(themeColors.accent);
          doc.text(churchName, 1200, 40, { align: 'right' });
        }

        doc.setTextColor(textColor);
        doc.setFont(slideStyle.font);
        const fontSize = chunk.length > 2 ? slideStyle.fontSize * 1.2 : slideStyle.fontSize * 1.5;
        doc.setFontSize(fontSize);
        const text = chunk.join("\n");
        const splitText = doc.splitTextToSize(text, 1000);
        const textHeight = splitText.length * fontSize * 1.2;
        const yPos = (720 - textHeight) / 2 + fontSize;
        doc.text(splitText, 640, yPos, { align: 'center' });
      }
      doc.save(`BibSlide_Pasted.pdf`);
    }
  };

  const generatePNG = async () => {
    const previewElement = document.querySelector('.actual-slide-content') as HTMLElement;
    if (previewElement) {
      try {
        const canvas = await html2canvas(previewElement, {
          useCORS: true,
          scale: 2,
          backgroundColor: null,
        });
        const link = document.createElement('a');
        link.download = `BibSlide_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error("Error generating PNG:", err);
      }
    }
  };

  const exportToHTML = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="ht">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BibSlide Presentation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; background: #000; color: #fff; font-family: ${slideStyle.font}, sans-serif; overflow: hidden; }
        .slide { display: none; height: 100vh; width: 100vw; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; box-sizing: border-box; background-size: cover; background-position: center; }
        .slide.active { display: flex; }
        .text { font-size: ${slideStyle.fontSize * 1.5}px; line-height: 1.4; white-space: pre-wrap; max-width: 90%; }
        .controls { position: fixed; bottom: 20px; right: 20px; display: flex; gap: 10px; opacity: 0.3; transition: opacity 0.3s; }
        .controls:hover { opacity: 1; }
        button { background: rgba(255,255,255,0.2); border: none; color: white; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    ${previewSlides.map((slide, i) => `
    <div class="slide ${i === 0 ? 'active' : ''}" style="background-color: ${slideStyle.bgColor}; color: ${slideStyle.textColor}; background-image: ${slideStyle.bgImage ? `url(${slideStyle.bgImage})` : 'none'}">
        <div class="text">${slide}</div>
    </div>`).join('')}
    <div class="controls">
        <button onclick="prev()">Anvan</button>
        <button onclick="next()">Apre</button>
    </div>
    <script>
        let current = 0;
        const slides = document.querySelectorAll('.slide');
        function show(n) {
            slides[current].classList.remove('active');
            current = (n + slides.length) % slides.length;
            slides[current].classList.add('active');
        }
        function next() { show(current + 1); }
        function prev() { show(current - 1); }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') next();
            if (e.key === 'ArrowLeft') prev();
        });
    </script>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BibSlide_${Date.now()}.html`;
    link.click();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('landing');
  };

  if (view === 'dashboard' && user) {
    return (
      <Dashboard 
        user={user} 
        darkMode={darkMode} 
        onLogout={handleLogout}
        onCreateNew={() => setView('generator')}
      />
    );
  }

  if (view === 'landing') {
    return (
      <LandingPage 
        onStart={() => setView(user ? 'dashboard' : 'generator')} 
        onLogin={() => setView('auth')}
        onShowAbout={() => setShowAbout(true)}
        onShowTerms={() => setShowTerms(true)}
        onShowPrivacy={() => setShowPrivacy(true)}
        onShowDonation={() => setShowDonation(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
      />
    );
  }

  if (view === 'auth') {
    return (
      <Auth 
        onBack={() => setView('landing')}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-10 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setView('landing')} className="p-1 hover:opacity-80 transition-opacity">
              <img 
                src="https://i.postimg.cc/X7j5bZCj/biblslide.png" 
                alt="BibSlide Logo" 
                className="w-10 h-10 object-contain"
                referrerPolicy="no-referrer"
              />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-indigo-600">BibSlide</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {THEMES(t).map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`w-6 h-6 rounded-lg border-2 transition-all ${selectedTheme.id === theme.id ? 'border-indigo-600 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: theme.bg.replace('bg-', '') }}
                  title={theme.label}
                />
              ))}
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-50 border-slate-200 text-indigo-600'}`}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {user && (
                <button 
                  onClick={() => setView('dashboard')}
                  className="hidden sm:flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
                >
                  <Layout className="w-4 h-4" /> {t('nav.dashboard')}
                </button>
              )}
              <button 
                onClick={() => setView('landing')}
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> {t('buttons.prev')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Bible Search API Integration */}
        <BibleSearch 
          darkMode={darkMode} 
          onAddVerse={(text) => {
            setMode('paste');
            setPasteType('bible');
            setPastedText(text);
            // Scroll to editor
            window.scrollTo({ top: 400, behavior: 'smooth' });
          }} 
        />

        {/* Mode Switcher */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => { setMode('bible'); setError(null); setBibleData(null); setSongData(null); }}
            className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'bible' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-5 h-5" /> {t('labels.bible')}
          </button>
          <button 
            onClick={() => { setMode('song'); setError(null); setBibleData(null); setSongData(null); }}
            className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'song' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Music className="w-5 h-5" /> {t('nav.create')}
          </button>
          <button 
            onClick={() => { setMode('paste'); setError(null); setBibleData(null); setSongData(null); }}
            className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'paste' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ClipboardPaste className="w-5 h-5" /> {t('labels.paste')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Input & Config */}
          <div className="lg:col-span-1 space-y-6">
            <section className={`p-6 rounded-2xl shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Search className="w-4 h-4" /> {mode === 'bible' ? t('auth.searchPassage') : mode === 'song' ? t('auth.searchSong') : t('auth.pasteText')}
              </h2>
              {mode === 'paste' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mode Manuel</span>
                  </div>
                    <textarea
                      rows={8}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder={t('auth.pastePlaceholder')}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPasteType('bible')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                          pasteType === 'bible' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {t('labels.bible')} 📖
                      </button>
                      <button
                        onClick={() => setPasteType('song')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                          pasteType === 'song' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {t('labels.paste')} 🎵
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={generatePPTX}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                      >
                        <Download className="w-4 h-4" /> PPTX
                      </button>
                      <button 
                        onClick={generatePDF}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                      >
                        <Download className="w-4 h-4" /> PDF
                      </button>
                    </div>
                </div>
              ) : (
                <form onSubmit={fetchVerses} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      {mode === 'bible' ? t('labels.referenceBible') : t('labels.referenceSong')}
                    </label>
                      <input 
                        type="text" 
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder={mode === 'bible' ? t('labels.placeholderBible') : t('labels.placeholderSong')}
                        className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                      />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      {mode === 'bible' ? t('labels.bibleVersion') : t('labels.songLanguage')}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {mode === 'bible' ? (
                        BIBLE_TRANSLATIONS.map((trans) => (
                          <button
                            key={`bible-trans-${trans.id}`}
                            type="button"
                            onClick={() => setBibleTranslation(trans.id)}
                            className={`py-2 text-[10px] font-medium rounded-lg border transition-all ${
                              bibleTranslation === trans.id 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {trans.label}
                          </button>
                        ))
                      ) : (
                        LANGUAGES.map((lang) => (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => setLanguage(lang.id)}
                            className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                              language === lang.id 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {lang.label}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  <button 
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    {mode === 'bible' ? t('buttons.search') : t('buttons.search')}
                  </button>
                </form>
              )}
            </section>

            <section className={`p-6 rounded-2xl shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" /> {t('labels.slideStyle')}
              </h2>
              <div className="space-y-4">
                {(mode === 'bible' || (mode === 'paste' && pasteType === 'bible')) ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> {t('labels.versesPerSlide')}
                    </label>
                    <select 
                      value={versesPerSlide}
                      onChange={(e) => setVersesPerSlide(Number(e.target.value))}
                      className={`w-full px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <option value={1}>1 {t('labels.versesPerSlide')}</option>
                      <option value={2}>2 {t('labels.versesPerSlide')}</option>
                      <option value={3}>3 {t('labels.versesPerSlide')}</option>
                      <option value={4}>4 {t('labels.versesPerSlide')}</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                      <Type className="w-3 h-3" /> {t('labels.linesPerSlide')}
                    </label>
                    <select 
                      value={linesPerSlide}
                      onChange={(e) => setLinesPerSlide(Number(e.target.value))}
                      className={`w-full px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <option value={1}>1 {t('labels.linesPerSlide')}</option>
                      <option value={2}>2 {t('labels.linesPerSlide')}</option>
                      <option value={3}>3 {t('labels.linesPerSlide')}</option>
                      <option value={4}>4 {t('labels.linesPerSlide')}</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> {t('labels.presentationTheme')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {THEMES(t).map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          selectedTheme.id === theme.id 
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                          : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-full h-8 rounded-lg ${theme.bg} border border-slate-200 mb-2`} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{t('labels.churchName')}</label>
                  <input 
                    type="text" 
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    placeholder={t('labels.churchNamePlaceholder')}
                    className={`w-full px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>
            </section>

            <SlideOptions 
              onChange={setSlideStyle} 
              onSave={handleSaveDesign}
              darkMode={darkMode} 
              isLoggedIn={!!user}
            />
          </div>

          {/* Right Column: Preview & Download */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  key="error-alert"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-700"
                >
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{t('auth.searchError')}</p>
                    <p className="text-xs opacity-80">{error}</p>
                  </div>
                </motion.div>
              )}

              {bibleData || songData || (mode === 'paste' && pastedText) ? (
                <motion.div 
                  key={mode === 'bible' ? "bible-results" : mode === 'song' ? "song-results" : "paste-results"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Preview Section */}
                  <div className={`p-8 rounded-3xl shadow-xl border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {mode === 'bible' && bibleData ? `${bibleData.book} ${bibleData.chapter}` : mode === 'song' ? songData?.title : t('auth.textPreview')}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                          {mode === 'bible' && bibleData ? `${bibleData.source} • ${bibleData.language}` : mode === 'song' ? `${songData?.collection || 'Chante'} • ${songData?.language}` : t('auth.pasteConvert')}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button 
                          onClick={generatePPTX}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                        >
                          <Download className="w-5 h-5" /> PPTX
                        </button>
                        <button 
                          onClick={generatePDF}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                          <Download className="w-5 h-5" /> PDF
                        </button>
                        <button 
                          onClick={generatePNG}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
                        >
                          <Image className="w-5 h-5" /> PNG
                        </button>
                        <button 
                          onClick={exportToHTML}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-100 transition-all active:scale-95"
                        >
                          <BookOpen className="w-5 h-5" /> HTML Share
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {mode === 'bible' && bibleData ? (
                        bibleData.verses.map((verse, idx) => (
                          <div key={`${verse.number}-${idx}`} className={`group flex gap-4 p-4 rounded-2xl transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                            <span className="text-indigo-600 font-bold text-lg leading-none pt-1">{verse.number}</span>
                            <p className={`${darkMode ? 'text-slate-200' : 'text-slate-700'} leading-relaxed`}>{verse.text}</p>
                          </div>
                        ))
                      ) : mode === 'song' && songData ? (
                        songData.lyrics.map((part, pIdx) => (
                          <div key={`part-${pIdx}`} className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-600">{part.part}</h4>
                            <div className={`p-4 rounded-2xl space-y-1 ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                              {part.lines.map((line, lIdx) => (
                                <p key={`line-${pIdx}-${lIdx}`} className={`${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{line}</p>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : mode === 'paste' && pastedText ? (
                        <div className={`p-6 rounded-2xl whitespace-pre-wrap leading-relaxed ${darkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
                          {pastedText}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Live Preview Section */}
                  <div className="slide-preview-container">
                    <SlidePreview 
                      slides={previewSlides} 
                      current={currentSlideIndex}
                      setCurrent={setCurrentSlideIndex}
                      options={slideStyle} 
                      darkMode={darkMode} 
                    />
                  </div>

                  {/* Canva Integration Section */}
                  <CanvaIntegration 
                    currentText={previewSlides[currentSlideIndex] || ""} 
                    darkMode={darkMode} 
                  />
                </motion.div>
              ) : !loading && (
                <motion.div 
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-[400px] flex flex-col items-center justify-center text-center space-y-4 bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl"
                >
                  <div className="bg-slate-100 p-4 rounded-full">
                    <BookOpen className="w-12 h-12 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-400">{t('auth.nothingHere')}</h3>
                    <p className="text-sm text-slate-400 max-w-xs">{t('auth.nothingHereSubtitle')}</p>
                  </div>
                </motion.div>
              )}

              {loading && (
                <div 
                  key="loading-state"
                  className="h-[400px] flex flex-col items-center justify-center space-y-4"
                >
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <BookOpen className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-indigo-600 font-medium animate-pulse">
                    {mode === 'bible' ? t('auth.searchingBible') : t('auth.searchingSong')}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* App Info Section */}
        <section className={`mt-16 p-8 rounded-[2rem] border transition-all text-center max-w-4xl mx-auto ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-indigo-50/50 border-indigo-100'}`}>
          <div className="bg-indigo-600/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            {t('about.title')}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-2xl mx-auto mb-6">
            {t('about.tagline')}. {t('about.description1').replace(/<\/?[^>]+(>|$)/g, "")}
          </p>
          <button 
            onClick={() => setShowAbout(true)}
            className="text-indigo-600 font-bold text-sm hover:underline flex items-center justify-center gap-2 mx-auto"
          >
            {t('buttons.learnMore')} <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </main>

      <footer className={`text-center py-6 border-t mt-12 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-sm">
            {t('footer.copyright')}{" "}
            {t('labels.poweredBy')} <strong>Wanky Massenat</strong>.
          </p>
          <div className="flex justify-center gap-4 mt-2 text-sm font-medium flex-wrap">
            <button onClick={() => setShowAbout(true)} className="hover:underline text-indigo-600">{t('nav.about')}</button>
            <span className="text-slate-300">|</span>
            <button onClick={() => setShowTerms(true)} className="hover:underline text-indigo-600">{t('nav.terms')}</button>
            <span className="text-slate-300">|</span>
            <button onClick={() => setShowPrivacy(true)} className="hover:underline text-indigo-600">{t('nav.privacy')}</button>
            <span className="text-slate-300">|</span>
            <button onClick={() => setShowContact(true)} className="hover:underline text-indigo-600">{t('nav.contact')}</button>
            <span className="text-slate-300">|</span>
            <button onClick={() => setShowDonation(true)} className="hover:underline text-emerald-600 font-bold">{t('nav.donation')} 💝</button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title={t('nav.terms')}>
        <TermsContent />
      </Modal>

      <Modal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title={t('nav.privacy')}>
        <PrivacyContent />
      </Modal>

      <Modal isOpen={showDonation} onClose={() => setShowDonation(false)} title={t('nav.donation')}>
        <DonationContent />
      </Modal>

      <Modal isOpen={showContact} onClose={() => setShowContact(false)} title={t('nav.contact')}>
        <ContactForm darkMode={darkMode} />
      </Modal>

      <Modal isOpen={showAbout} onClose={() => setShowAbout(false)} title={t('labels.aboutTitle')}>
        <AboutContent />
      </Modal>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-8 overflow-y-auto custom-scrollbar text-slate-600 leading-relaxed">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const TermsContent = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6 text-sm sm:text-base">
      <section>
        <h4 className="font-bold text-slate-900 mb-2">{t('terms.section1Title')}</h4>
        <p dangerouslySetInnerHTML={{ __html: t('terms.section1Desc') }} />
      </section>
      <section>
        <h4 className="font-bold text-slate-900 mb-2">{t('terms.section2Title')}</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('terms.section2Item1')}</li>
          <li dangerouslySetInnerHTML={{ __html: t('terms.section2Item2') }} />
          <li>{t('terms.section2Item3')}</li>
        </ul>
      </section>
      <section>
        <h4 className="font-bold text-slate-900 mb-2">{t('terms.section3Title')}</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('terms.section3Item1')}</li>
          <li>{t('terms.section3Item2')}</li>
          <li>{t('terms.section3Item3')}</li>
        </ul>
      </section>
      <section>
        <h4 className="font-bold text-slate-900 mb-2">{t('terms.section4Title')}</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li dangerouslySetInnerHTML={{ __html: t('terms.section4Item1') }} />
          <li>{t('terms.section4Item2')}</li>
          <li>{t('terms.section4Item3')}</li>
        </ul>
      </section>
      <section>
        <h4 className="font-bold text-slate-900 mb-2">{t('terms.section5Title')}</h4>
        <p>{t('terms.section5Desc')}</p>
      </section>
      <section>
        <h4 className="font-bold text-slate-900 mb-2">{t('terms.section6Title')}</h4>
        <p>{t('terms.section6Desc')}</p>
      </section>
    </div>
  );
};

const PrivacyContent = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-4 text-sm sm:text-base">
      <p>{t('privacy.desc1')}</p>
      <p dangerouslySetInnerHTML={{ __html: t('privacy.desc2') }} />
    </div>
  );
};

const DonationContent = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-8 text-sm sm:text-base text-slate-600 leading-relaxed">
      <div className="text-center space-y-4">
        <p>
          {t('labels.aboutSubtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="bg-indigo-100 p-1.5 rounded-lg">💳</span> {t('labels.electronicDonation')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="flex flex-col items-center gap-4">
            <a 
              href="https://www.paypal.com/paypalme/wankym" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl shadow-lg shadow-blue-100 font-bold text-center transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              PayPal
            </a>
            <div className="bg-white p-2 rounded-xl shadow-md border border-slate-100">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.paypal.com/paypalme/wankym" alt="PayPal QR" className="w-32 h-32" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <a 
              href="https://donate.stripe.com/6oUbJ3fDU59O8369e6awo0b?locale=en&__embed_source=buy_btn_1SaoLdRpnzu1xmnI6UMOWfGF" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl shadow-lg shadow-indigo-100 font-bold text-center transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Stripe
            </a>
            <div className="bg-white p-2 rounded-xl shadow-md border border-slate-100">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://donate.stripe.com/6oUbJ3fDU59O8369e6awo0b" alt="Stripe QR" className="w-32 h-32" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="bg-emerald-100 p-1.5 rounded-lg">🏦</span> {t('labels.bankTransfer')}
        </h4>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Banreservas</p>
            <p className="text-slate-900 font-medium">Cuenta de Ahorro: <span className="font-bold text-indigo-600">960-469-7671</span></p>
            <p className="text-slate-600">Titular: <strong>Wanky Massenat</strong></p>
          </div>
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Banco BHD</p>
            <p className="text-slate-900 font-medium">Cuenta: <span className="font-bold text-indigo-600">36-475-68-0012</span></p>
            <p className="text-slate-600">Titular: <strong>Wanky Massenat</strong></p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-slate-500 italic text-center border-t border-slate-100 pt-6">
        {t('labels.bibleQuote')}
      </p>
    </div>
  );
};
