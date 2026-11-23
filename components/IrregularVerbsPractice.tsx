import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { IrregularVerb } from '../types';
import { IRREGULAR_VERBS } from '../data/irregularVerbs';
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
  Sparkles,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { speakEnglish } from '../services/ttsService';

interface IrregularVerbsPracticeProps {
  onExit: () => void;
}

export const IrregularVerbsPractice: React.FC<IrregularVerbsPracticeProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'list'>('cards');
  const [verbs, setVerbs] = useState<IrregularVerb[]>(IRREGULAR_VERBS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto Reveal Mode: when active, meaning & V2/V3 forms are open by default (Reels fast-scroll)
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
      const saved = localStorage.getItem('wordingo-learned-irregular-verbs');
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
        localStorage.setItem('wordingo-learned-irregular-verbs', JSON.stringify(Array.from(next)));
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
    const target = container.querySelector<HTMLElement>(`#irregular-card-${index}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      container.scrollTo({ top: index * container.clientHeight, behavior: 'smooth' });
    }
    setCurrentIndex(index);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < verbs.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  }, [currentIndex, verbs.length, scrollToIndex]);

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
    if (newIndex >= 0 && newIndex < verbs.length && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  // Shuffle helper
  const handleShuffle = () => {
    const shuffled = [...verbs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setVerbs(shuffled);
    setCurrentIndex(0);
    setFlippedMap({});
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleResetOrder = () => {
    setVerbs(IRREGULAR_VERBS);
    setCurrentIndex(0);
    setFlippedMap({});
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // Keyboard navigation
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
        if (!autoReveal && verbs[currentIndex]) {
          toggleCardFlip(verbs[currentIndex].id);
        }
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handleNext, handlePrev, autoReveal, currentIndex, verbs, onExit]);

  // Filtered verbs for list view
  const filteredVerbs = useMemo(() => {
    if (!searchQuery.trim()) return IRREGULAR_VERBS;
    const q = searchQuery.toLowerCase().trim();
    return IRREGULAR_VERBS.filter(
      (v) =>
        v.v1.toLowerCase().includes(q) ||
        v.v2.toLowerCase().includes(q) ||
        v.v3.toLowerCase().includes(q) ||
        v.tr.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const progressPercent = verbs.length > 0 ? ((currentIndex + 1) / verbs.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden safe-area-inset-top safe-area-inset-bottom">
      {/* ── TOP STICKY HEADER ─────────────────────────────────────────────────── */}
      <div className="flex-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 z-30">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Left: Back button + Title */}
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
                  Irregular Verbs
                </h1>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50 shrink-0">
                  Düzensiz Fiiller
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                {verbs.length} fiil • {learnedIds.size} öğrenildi
              </span>
            </div>
          </div>

          {/* Right Controls: AutoReveal Toggle + Shuffle + Tabs */}
          <div className="flex items-center gap-1.5 shrink-0">
            {activeTab === 'cards' && (
              <>
                {/* Auto Reveal (Anlamlar Açık - Seri Mod) Toggle */}
                <button
                  onClick={toggleAutoReveal}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    autoReveal
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/80 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title={autoReveal ? 'Anlamlar açık (Seri kaydırma modu aktif)' : 'Anlamları gizle (Klasik kart modu)'}
                >
                  {autoReveal ? (
                    <Eye size={13} className="stroke-[2.5] text-amber-600 dark:text-amber-400" />
                  ) : (
                    <EyeOff size={13} />
                  )}
                  <span className="hidden sm:inline">Anlamlar Açık</span>
                  <span className="sm:hidden">{autoReveal ? 'Açık' : 'Gizli'}</span>
                  {autoReveal && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>

                {/* Shuffle */}
                <button
                  onClick={handleShuffle}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                  title="Kartları Karıştır"
                  aria-label="Kartları Karıştır"
                >
                  <Shuffle size={15} />
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
            ref={containerRef}
            onScroll={handleSnapScroll}
            className="w-full h-full overflow-y-auto snap-y snap-mandatory scroll-smooth hide-scrollbar"
            style={{
              scrollSnapType: 'y mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {verbs.map((item, index) => {
              const isLearned = learnedIds.has(item.id);
              const isRevealed = autoReveal || !!flippedMap[item.id];

              return (
                <div
                  key={item.id}
                  id={`irregular-card-${index}`}
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
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                                #{index + 1} / {verbs.length}
                              </span>
                              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/40 dark:border-blue-800/40">
                                Irregular Verb
                              </span>
                            </div>

                            {/* Pronunciation button for V1 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                speakEnglish(item.v1);
                              }}
                              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                              title="V1 Telaffuz Dinle"
                              aria-label="V1 Telaffuz Dinle"
                            >
                              <Volume2 size={18} />
                            </button>
                          </div>

                          {/* Base Verb (V1) Title */}
                          <div className="mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                              V1 • Base Form
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                              {item.v1}
                            </h2>
                          </div>
                        </div>

                        {/* Card Body: Revealed (Meaning + V2/V3) OR Hint */}
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

                              {/* V2 & V3 Side-by-Side Grid */}
                              <div className="grid grid-cols-2 gap-2.5">
                                {/* V2 Past Simple */}
                                <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/40">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                      V2 • Past
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        speakEnglish(item.v2);
                                      }}
                                      className="text-slate-400 hover:text-blue-600 p-0.5"
                                      title="V2 Dinle"
                                    >
                                      <Volume2 size={13} />
                                    </button>
                                  </div>
                                  <p className="text-base font-bold text-slate-900 dark:text-white">
                                    {item.v2}
                                  </p>
                                </div>

                                {/* V3 Past Participle */}
                                <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/40">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                      V3 • Participle
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        speakEnglish(item.v3);
                                      }}
                                      className="text-slate-400 hover:text-blue-600 p-0.5"
                                      title="V3 Dinle"
                                    >
                                      <Volume2 size={13} />
                                    </button>
                                  </div>
                                  <p className="text-base font-bold text-slate-900 dark:text-white">
                                    {item.v3}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500 gap-2">
                              <Eye size={26} className="stroke-[1.5]" />
                              <span className="text-xs font-semibold">
                                Anlamı ve V2/V3 hallerini görmek için dokunun
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
                        <span>Sonraki fiil için aşağı kaydırın</span>
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
              title="Önceki Fiil (Yukarı)"
              aria-label="Önceki Fiil"
            >
              <ChevronUp size={18} />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === verbs.length - 1}
              className="w-10 h-10 rounded-full bg-blue-600 text-white shadow-md flex items-center justify-center hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              title="Sonraki Fiil (Aşağı)"
              aria-label="Sonraki Fiil"
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
                placeholder="V1, V2, V3 veya Türkçe anlam ara..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 self-end sm:self-center">
              {filteredVerbs.length} fiil listeleniyor •{' '}
              <span className="text-emerald-600 font-semibold">{learnedIds.size}</span> öğrenildi
            </div>
          </div>

          {/* Verbs Table/List */}
          <div className="space-y-2 pb-16">
            {filteredVerbs.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                <p className="text-sm text-slate-500">Aramanıza uygun düzensiz fiil bulunamadı.</p>
              </div>
            ) : (
              filteredVerbs.map((item) => {
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
                        {/* V1 + TTS */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-bold text-slate-900 dark:text-white">
                            {item.v1}
                          </span>
                          <button
                            onClick={() => speakEnglish(item.v1)}
                            className="text-slate-400 hover:text-blue-600 p-1 rounded-md"
                            title="V1 Dinle"
                          >
                            <Volume2 size={15} />
                          </button>
                        </div>

                        {/* Turkish Meaning */}
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                          {item.tr}
                        </p>

                        {/* V2 & V3 Details */}
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-semibold">V2:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.v2}</span>
                            <button
                              onClick={() => speakEnglish(item.v2)}
                              className="text-slate-400 hover:text-blue-600"
                              title="V2 Dinle"
                            >
                              <Volume2 size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-semibold">V3:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.v3}</span>
                            <button
                              onClick={() => speakEnglish(item.v3)}
                              className="text-slate-400 hover:text-blue-600"
                              title="V3 Dinle"
                            >
                              <Volume2 size={12} />
                            </button>
                          </div>
                        </div>
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

export default IrregularVerbsPractice;
