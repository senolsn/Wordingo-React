import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CuratedWord } from '../types';
import {
  ArrowLeft,
  Volume2,
  ChevronUp,
  ChevronDown,
  Shuffle,
  CheckCircle2,
  RotateCcw,
  Search,
  List,
  Layers,
  Eye,
  EyeOff,
  Check,
  Quote,
  Sparkles,
  Tag
} from 'lucide-react';
import { speakEnglish } from '../services/ttsService';

interface CuratedVocabularyPracticeProps {
  title: string;
  subtitle: string;
  badgeText: string;
  storageKey: string;
  words: CuratedWord[];
  onExit: () => void;
}

// Helper to shuffle array (Fisher-Yates)
const shuffleArray = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const CuratedVocabularyPractice: React.FC<CuratedVocabularyPracticeProps> = ({
  title,
  subtitle,
  badgeText,
  storageKey,
  words: initialWords,
  onExit
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'list'>('cards');
  const [shuffleVersion, setShuffleVersion] = useState(0);
  const [words, setWords] = useState<CuratedWord[]>(initialWords);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto Reveal Mode: when active, meaning & example sentence are open by default (Reels fast-scroll)
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

  const [learnedIds, setLearnedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [searchQuery, setSearchQuery] = useState('');

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
    const target = container.querySelector<HTMLElement>(`#curated-card-${index}`);
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

  // Synchronize words if initialWords prop changes (resets to default order on open)
  useEffect(() => {
    setWords(initialWords);
    setCurrentIndex(0);
    setFlippedMap({});
    setShuffleVersion((v) => v + 1);
  }, [initialWords]);

  // Shuffle helper: always randomize from full initial words and restart at 0
  const handleShuffle = () => {
    const shuffled = shuffleArray(initialWords);
    setWords(shuffled);
    setCurrentIndex(0);
    setFlippedMap({});
    setShuffleVersion((v) => v + 1);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  const handleResetOrder = () => {
    setWords(initialWords);
    setCurrentIndex(0);
    setFlippedMap({});
    setShuffleVersion((v) => v + 1);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  // Keyboard navigation: Down/Up arrows, j/k, space
  useEffect(() => {
    if (activeTab !== 'cards') return;
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
  }, [activeTab, handleNext, handlePrev, autoReveal, currentIndex, words, onExit]);

  // Filtered words for list view (reflects shuffled order when shuffled)
  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return words;
    const q = searchQuery.toLowerCase().trim();
    return words.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.tr.toLowerCase().includes(q) ||
        w.example.toLowerCase().includes(q) ||
        (w.synonym && w.synonym.toLowerCase().includes(q)) ||
        (w.level && w.level.toLowerCase().includes(q))
    );
  }, [searchQuery, words]);

  const progressPercent = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden safe-area-inset-top safe-area-inset-bottom">
      {/* ── TOP STICKY HEADER ─────────────────────────────────────────────────── */}
      <div className="flex-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 z-30">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Left: Back button + Title & Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onExit}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0"
              title="Dashboard'a Dön"
              aria-label="Dashboard'a Dön"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {title}
                </h1>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50 shrink-0">
                  {badgeText}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                {subtitle} • {learnedIds.size}/{words.length} öğrenildi
              </span>
            </div>
          </div>

          {/* Right Controls: AutoReveal Toggle + Shuffle + Tabs */}
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

              return (
                <div
                  key={`${shuffleVersion}-${item.id}`}
                  id={`curated-card-${index}`}
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

                      <div className="p-5 sm:p-6 flex flex-col justify-between" style={{ minHeight: '320px' }}>
                        {/* Card Header: Counter & Badges */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                                #{index + 1} / {words.length}
                              </span>
                              {item.level && (
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/40 dark:border-amber-800/40">
                                  {item.level}
                                </span>
                              )}
                              {item.type && (
                                <span className="text-[11px] italic text-slate-400 dark:text-slate-500">
                                  ({item.type})
                                </span>
                              )}
                            </div>

                            {/* Pronunciation button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                speakEnglish(item.word);
                              }}
                              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                              title="Telaffuz Dinle"
                              aria-label="Telaffuz Dinle"
                            >
                              <Volume2 size={18} />
                            </button>
                          </div>

                          {/* Word Title & Synonym */}
                          <div className="mt-1">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                              {item.word}
                            </h2>
                            {item.synonym && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                <Tag size={12} className="shrink-0 text-slate-400" />
                                <span>
                                  Eş anlam: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.synonym}</span>
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Card Body: Revealed (Translation + Example) OR Hint */}
                        <div className="my-4">
                          {isRevealed ? (
                            <div className="space-y-3 animate-in fade-in duration-200">
                              {/* Türkçe Anlamı Box */}
                              <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200/60 dark:border-slate-700/60">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                                  Türkçe Anlamı
                                </span>
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                  {item.tr}
                                </p>
                              </div>

                              {/* Örnek Cümle Box */}
                              {item.example && (
                                <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/40">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                      <Quote size={11} />
                                      Örnek Cümle
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        speakEnglish(item.example);
                                      }}
                                      className="text-slate-500 hover:text-blue-600 p-1 rounded-md"
                                      title="Cümleyi Dinle"
                                    >
                                      <Volume2 size={14} />
                                    </button>
                                  </div>
                                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 italic leading-relaxed">
                                    &ldquo;{item.example}&rdquo;
                                  </p>
                                  {item.exampleTr && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                      {item.exampleTr}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500 gap-2">
                              <Eye size={26} className="stroke-[1.5]" />
                              <span className="text-xs font-semibold">
                                Anlamı ve örneği görmek için dokunun
                              </span>
                              <span className="text-[10px] text-slate-400">
                                veya üstteki &ldquo;Anlamlar Açık&rdquo; butonunu açın
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
                    {index === 0 && (
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
                placeholder="Kelime, anlam, eş anlam veya örnek ara..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 self-end sm:self-center">
              {filteredWords.length} kelime listeleniyor •{' '}
              <span className="text-emerald-600 font-semibold">{learnedIds.size}</span> öğrenildi
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Word + TTS + Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-bold text-slate-900 dark:text-white">
                            {item.word}
                          </span>
                          <button
                            onClick={() => speakEnglish(item.word)}
                            className="text-slate-400 hover:text-blue-600 p-1 rounded-md"
                            title="Dinle"
                          >
                            <Volume2 size={15} />
                          </button>
                          {item.level && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50">
                              {item.level}
                            </span>
                          )}
                          {item.type && (
                            <span className="text-xs text-slate-400 italic">
                              ({item.type})
                            </span>
                          )}
                        </div>

                        {/* Turkish Meaning */}
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                          {item.tr}
                        </p>

                        {/* Synonym if present */}
                        {item.synonym && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                            <Tag size={12} className="shrink-0 text-slate-400" />
                            <span>
                              Eş anlam:{' '}
                              <span className="text-slate-700 dark:text-slate-300 font-medium">
                                {item.synonym}
                              </span>
                            </span>
                          </p>
                        )}

                        {/* Example Sentence */}
                        {item.example && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                              &ldquo;{item.example}&rdquo;
                            </p>
                            {item.exampleTr && (
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                {item.exampleTr}
                              </p>
                            )}
                          </div>
                        )}
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

export default CuratedVocabularyPractice;
