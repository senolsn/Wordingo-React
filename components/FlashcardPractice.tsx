import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WordGroup, Word } from '../types';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Volume2,
  ChevronUp,
  ChevronDown,
  Shuffle,
  CheckCircle2,
  Search,
  List,
  Layers,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { speakEnglish } from '../services/ttsService';
import usFlag from '../assets/us.svg';
import trFlag from '../assets/tr.svg';

interface FlashcardPracticeProps {
  group: WordGroup;
  onExit: () => void;
  onStartQuiz?: () => void;
}

type PracticeDirection = 'en-to-tr' | 'tr-to-en';

// Helper to shuffle array (Fisher-Yates)
const shuffleArray = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const FlashcardPractice: React.FC<FlashcardPracticeProps> = ({
  group,
  onExit
}) => {
  // Practice direction selection (asked at the beginning)
  const [direction, setDirection] = useState<PracticeDirection | null>(null);
  const [activeTab, setActiveTab] = useState<'cards' | 'list'>('cards');
  const [shuffleVersion, setShuffleVersion] = useState(0);
  const [words, setWords] = useState<Word[]>(() => group.words || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto Reveal Mode: when active, translation is revealed by default (Reels fast-scroll)
  const [autoReveal, setAutoReveal] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('wordingo-auto-reveal-mode');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Individual card flip states when autoReveal is false
  const [flippedMap, setFlippedMap] = useState<Record<string, boolean>>({});

  // Persistent Learned IDs for this specific word group
  const storageKey = `wordingo-learned-group-${group.id}`;
  const [learnedIds, setLearnedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize words if group prop changes (resets to original default order on open)
  useEffect(() => {
    setWords(group.words || []);
    setCurrentIndex(0);
    setFlippedMap({});
    setShuffleVersion((v) => v + 1);
  }, [group.id, group.words]);

  // Persist learned IDs
  const toggleLearned = (id: string) => {
    setLearnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const toggleAutoReveal = () => {
    setAutoReveal((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('wordingo-auto-reveal-mode', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleCardFlip = (id: string) => {
    setFlippedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Scroll to a specific card index in the Reels snap container
  const scrollToIndex = useCallback((index: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const target = container.querySelector<HTMLElement>(`#group-card-${index}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      container.scrollTo({ top: index * container.clientHeight, behavior: 'smooth' });
    }
    setCurrentIndex(index);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  }, [currentIndex, words.length, scrollToIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  }, [currentIndex, scrollToIndex]);

  // Handle vertical snap scroll to update current index & progress
  const handleSnapScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const itemHeight = container.clientHeight;
    if (itemHeight <= 0) return;
    const newIndex = Math.round(container.scrollTop / itemHeight);
    if (newIndex >= 0 && newIndex < words.length && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  // Shuffle helper: always randomize from full group words and restart at 0
  const handleShuffle = () => {
    const shuffled = shuffleArray(group.words || []);
    setWords(shuffled);
    setCurrentIndex(0);
    setFlippedMap({});
    setShuffleVersion((v) => v + 1);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!direction || activeTab !== 'cards') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'j') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!autoReveal && words[currentIndex]) {
          toggleCardFlip(words[currentIndex].id);
        }
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, activeTab, handleNext, handlePrev, autoReveal, currentIndex, words, onExit]);

  // Valid learned count based on existing group words
  const validLearnedCount = useMemo(() => {
    const currentWordIds = new Set(words.map((w) => w.id));
    let count = 0;
    learnedIds.forEach((id) => {
      if (currentWordIds.has(id)) count++;
    });
    return count;
  }, [words, learnedIds]);

  // Filtered words for list view
  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return words;
    const q = searchQuery.toLowerCase().trim();
    return words.filter(
      (w) =>
        w.en.toLowerCase().includes(q) ||
        w.tr.toLowerCase().includes(q)
    );
  }, [searchQuery, words]);

  const progressPercent = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;
  const isEnFront = direction === 'en-to-tr';

  // Empty words state
  if (!words || words.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-4">
          <Layers size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">Bu Grupta Henüz Kelime Yok</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
          Flashcard pratiği yapabilmek için gruba önce kelime eklemelisiniz.
        </p>
        <button
          onClick={onExit}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  // ── 1. DIRECTION SELECTION SCREEN ───────────────────────────────────────────
  if (!direction) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto safe-area-inset-top safe-area-inset-bottom">
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <button
            onClick={onExit}
            className="flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Geri Dön"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="font-bold text-sm text-slate-900 dark:text-white mx-auto pr-10">
            Kelime Kartı Pratiği
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 max-w-md mx-auto w-full py-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/10">
              <BookOpen size={30} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
              Flashcard Pratiği
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kelime Grubu: <span className="font-semibold text-slate-800 dark:text-slate-200">{group.name}</span> ({words.length} kelime)
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Çalışmak istediğiniz yönü seçin
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setDirection('en-to-tr');
                setWords(group.words || []);
                setCurrentIndex(0);
                setFlippedMap({});
                setShuffleVersion((v) => v + 1);
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl text-left shadow-sm hover:shadow-md transition-all active:scale-98 group flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex items-center gap-1.5 shrink-0">
                  <img src={usFlag} alt="English" className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-black/10" />
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <img src={trFlag} alt="Türkçe" className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-black/10" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">İngilizce → Türkçe</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">İngilizce kelimeyi görün, Türkçesini hatırlayın</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
            </button>

            <button
              onClick={() => {
                setDirection('tr-to-en');
                setWords(group.words || []);
                setCurrentIndex(0);
                setFlippedMap({});
                setShuffleVersion((v) => v + 1);
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl text-left shadow-sm hover:shadow-md transition-all active:scale-98 group flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex items-center gap-1.5 shrink-0">
                  <img src={trFlag} alt="Türkçe" className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-black/10" />
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <img src={usFlag} alt="English" className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-black/10" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Türkçe → İngilizce</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Türkçe kelimeyi görün, İngilizcesini hatırlayın</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. ACTIVE PRACTICE SCREEN ───────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden safe-area-inset-top safe-area-inset-bottom">
      {/* ── TOP STICKY HEADER (Compact for Mobile) ─────────────────────────── */}
      <div className="flex-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 z-30">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Left: Back button & Direction Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onExit}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0"
              title="Dashboard'a Dön"
              aria-label="Dashboard'a Dön"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50 shrink-0">
              {isEnFront ? 'EN → TR' : 'TR → EN'}
            </span>
          </div>

          {/* Right Controls: AutoReveal + Shuffle + Tabs */}
          <div className="flex items-center gap-1.5 shrink-0">
            {activeTab === 'cards' && (
              <>
                {/* Auto Reveal (Gizli / Açık) Toggle - Icon Only */}
                <button
                  onClick={toggleAutoReveal}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border shrink-0 ${
                    autoReveal
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300/80 dark:border-amber-800/80 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                  title={autoReveal ? 'Anlamlar Açık (Gizlemek için dokunun)' : 'Anlamlar Gizli (Açmak için dokunun)'}
                  aria-label={autoReveal ? 'Anlamları Gizle' : 'Anlamları Göster'}
                >
                  {autoReveal ? (
                    <Eye size={16} className="stroke-[2.5]" />
                  ) : (
                    <EyeOff size={16} />
                  )}
                </button>

                {/* Shuffle - Icon Only */}
                <button
                  onClick={handleShuffle}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-xs shrink-0"
                  title="Kartları Yeniden Karıştır"
                  aria-label="Kartları Yeniden Karıştır"
                >
                  <Shuffle size={16} />
                </button>
              </>
            )}

            {/* Mode Switcher (Kart / Liste) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
              <button
                onClick={() => setActiveTab('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers size={13} />
                <span className="hidden xs:inline">Kart</span>
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'list'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List size={13} />
                <span className="hidden xs:inline">Liste</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card Mode Progress Bar */}
        {activeTab === 'cards' && (
          <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────────────── */}
      {activeTab === 'cards' ? (
        /* ── REELS-STYLE VERTICAL SNAP FEED ────────────────────────────────────── */
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col items-center">
          {/* Vertical Snap Scroll Container */}
          <div
            key={`snap-container-${shuffleVersion}`}
            ref={containerRef}
            onScroll={handleSnapScroll}
            className="w-full h-full overflow-y-auto snap-y snap-mandatory scroll-smooth hide-scrollbar"
            style={{
              scrollSnapType: 'y mandatory',
              WebkitOverflowScrolling: 'touch',
              overflowAnchor: 'none'
            }}
          >
            {words.map((item, index) => {
              const isLearned = learnedIds.has(item.id);
              const isRevealed = autoReveal || !!flippedMap[item.id];
              const frontText = isEnFront ? item.en : item.tr;
              const backText = isEnFront ? item.tr : item.en;

              return (
                <div
                  key={`${shuffleVersion}-${item.id}`}
                  id={`group-card-${index}`}
                  className="w-full h-full snap-start snap-always flex flex-col items-center justify-center p-3 sm:p-5 shrink-0 select-none"
                >
                  <div className="w-full max-w-md mx-auto my-auto flex flex-col justify-between">
                    {/* The Interactive Flashcard */}
                    <div
                      onClick={() => {
                        if (!autoReveal) {
                          toggleCardFlip(item.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={isRevealed ? 'Anlamı gizle' : 'Anlamı göster'}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (!autoReveal) toggleCardFlip(item.id);
                        }
                      }}
                      className={`relative w-full rounded-3xl border-2 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md bg-white dark:bg-slate-900 ${
                        isLearned
                          ? 'border-emerald-400/70 dark:border-emerald-700/60'
                          : 'border-slate-200/90 dark:border-slate-800'
                      } ${!autoReveal ? 'cursor-pointer active:scale-[0.99]' : ''}`}
                    >
                      {/* Learned Indicator Badge */}
                      {isLearned && (
                        <div className="absolute top-3.5 right-3.5 z-10">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-200/70 dark:border-emerald-800/70">
                            <Check size={11} className="stroke-[2.5]" />
                            Öğrenildi
                          </span>
                        </div>
                      )}

                      <div className="p-5 sm:p-6 flex flex-col justify-between" style={{ minHeight: '300px' }}>
                        {/* Card Header: Counter & Badges */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                                #{index + 1} / {words.length}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                                <img
                                  src={isEnFront ? usFlag : trFlag}
                                  alt="Front language"
                                  className="w-3.5 h-3.5 rounded-full object-cover"
                                />
                                {isEnFront ? 'İngilizce' : 'Türkçe'}
                              </span>
                            </div>

                            {/* Audio pronunciation button for English text */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                speakEnglish(item.en);
                              }}
                              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                              title="Telaffuz Dinle"
                              aria-label="Telaffuz Dinle"
                            >
                              <Volume2 size={18} />
                            </button>
                          </div>

                          {/* Front Word */}
                          <div className="mt-2 text-center">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
                              {frontText}
                            </h2>
                          </div>
                        </div>

                        {/* Card Body: Revealed Translation OR Hint */}
                        <div className="my-5">
                          {isRevealed ? (
                            <div className="animate-in fade-in duration-200">
                              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200/60 dark:border-slate-700/60 text-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                                  {isEnFront ? 'Türkçe Anlamı' : 'İngilizce Karşılığı'}
                                </span>
                                <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 break-words">
                                  {backText}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-400 dark:text-slate-500 gap-1.5">
                              <Eye size={24} className="stroke-[1.5]" />
                              <span className="text-xs font-semibold">
                                Anlamı görmek için dokunun
                              </span>
                              <span className="text-[10px] text-slate-400">
                                veya üstteki &ldquo;Anlamlar Açık&rdquo; butonuna basın
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Bottom Action: Öğrendim Button */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLearned(item.id);
                            }}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border font-semibold text-xs transition-all shadow-xs ${
                              isLearned
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70'
                                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <CheckCircle2
                              size={16}
                              className={isLearned ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}
                            />
                            <span>{isLearned ? 'Öğrenildi' : 'Öğrendim'}</span>
                          </button>

                          {!autoReveal && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCardFlip(item.id);
                              }}
                              className="px-3 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              {isRevealed ? 'Gizle' : 'Anlamı Gör'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Swipe down hint on first card */}
                    {index === 0 && words.length > 1 && (
                      <div className="text-center pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1 animate-bounce">
                        <ChevronDown size={14} />
                        <span>Sonraki kelime için aşağı kaydırın</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Floating Vertical Controls (Up & Down Arrows) */}
          <div className="absolute right-3 bottom-4 flex flex-col gap-1.5 z-20">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              title="Önceki Kelime (Yukarı)"
              aria-label="Önceki Kelime"
            >
              <ChevronUp size={18} />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === words.length - 1}
              className="w-10 h-10 rounded-full bg-blue-600 text-white shadow-md flex items-center justify-center hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              title="Sonraki Kelime (Aşağı)"
              aria-label="Sonraki Kelime"
            >
              <ChevronDown size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* ── LIST VIEW ─────────────────────────────────────────────────────────── */
        <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-4 overflow-y-auto">
          {/* Search and Summary */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kelime veya Türkçe anlam ara..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 self-end sm:self-center">
              {filteredWords.length} kelime listeleniyor •{' '}
              <span className="text-emerald-600 font-semibold">{validLearnedCount}</span> öğrenildi
            </div>
          </div>

          {/* Words Table/List */}
          <div className="space-y-2 pb-16">
            {filteredWords.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                <p className="text-sm text-slate-500">Aramanıza uygun kelime bulunamadı.</p>
              </div>
            ) : (
              filteredWords.map((item) => {
                const isLearned = learnedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isLearned
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/40'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Word + TTS */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-bold text-slate-900 dark:text-white">
                            {item.en}
                          </span>
                          <button
                            onClick={() => speakEnglish(item.en)}
                            className="text-slate-400 hover:text-blue-600 p-1 rounded-md"
                            title="Dinle"
                          >
                            <Volume2 size={15} />
                          </button>
                        </div>

                        {/* Turkish Meaning */}
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                          {item.tr}
                        </p>
                      </div>

                      {/* Learn Toggle Button */}
                      <button
                        onClick={() => toggleLearned(item.id)}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-colors ${
                          isLearned
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title={isLearned ? 'Öğrenildi olarak işaretlendi' : 'Öğrenildi olarak işaretle'}
                      >
                        <Check size={16} className={isLearned ? 'stroke-[2.5]' : ''} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardPractice;
