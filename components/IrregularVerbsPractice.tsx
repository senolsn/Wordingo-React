import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IrregularVerb } from '../types';
import { IRREGULAR_VERBS } from '../data/irregularVerbs';
import {
  ArrowLeft,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  CheckCircle2,
  RotateCcw,
  Search,
  BookOpen,
  List,
  Layers,
  Sparkles,
  Eye,
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
  const [isFlipped, setIsFlipped] = useState(false);
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

  // Shuffle helper
  const handleShuffle = () => {
    const shuffled = [...verbs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setVerbs(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleResetOrder = () => {
    setVerbs(IRREGULAR_VERBS);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleNext = useCallback(() => {
    if (currentIndex < verbs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, verbs.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = () => setIsFlipped((prev) => !prev);

  // Keyboard navigation
  useEffect(() => {
    if (activeTab !== 'cards') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handleNext, handlePrev, onExit]);

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

  const currentVerb = verbs[currentIndex];
  const isCurrentLearned = currentVerb ? learnedIds.has(currentVerb.id) : false;
  const progressPercent = verbs.length > 0 ? ((currentIndex + 1) / verbs.length) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 safe-area-inset-top safe-area-inset-bottom">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onExit}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0"
              title="Dashboard'a Dön"
              aria-label="Dashboard'a Dön"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Irregular Verbs
              </h1>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Düzensiz Fiiller ({verbs.length} fiil)
              </span>
            </div>
          </div>

          {/* Mode Switcher (Kartlar / Liste) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers size={13} />
              <span>Kart</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'list'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List size={13} />
              <span>Liste</span>
            </button>
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

      {/* Main Content Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        {activeTab === 'cards' ? (
          /* ── CARDS VIEW ────────────────────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center max-w-lg mx-auto w-full py-2 pb-24 sm:pb-12">
            {/* Meta bar: Counter, Learned status, Shuffle */}
            <div className="w-full flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">
                  {currentIndex + 1} / {verbs.length}
                </span>
                <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  {learnedIds.size} öğrenildi
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleShuffle}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                  title="Kartları Karıştır"
                  aria-label="Kartları Karıştır"
                >
                  <Shuffle size={16} />
                </button>
                <button
                  onClick={handleResetOrder}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                  title="Sırayı Sıfırla (A-Z)"
                  aria-label="Sırayı Sıfırla"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            {/* The Flashcard */}
            <div
              onClick={handleFlip}
              role="button"
              tabIndex={0}
              aria-label={isFlipped ? 'Kartı gizle' : 'V2 ve V3 hallerini göster'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFlip();
                }
              }}
              className="w-full cursor-pointer select-none"
            >
              <div
                className={`relative w-full rounded-3xl border-2 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                  isCurrentLearned
                    ? 'border-emerald-400/60 dark:border-emerald-700/60'
                    : 'border-slate-200/90 dark:border-slate-800'
                } ${
                  isFlipped
                    ? 'bg-blue-50/50 dark:bg-slate-900/90'
                    : 'bg-white dark:bg-slate-900'
                }`}
                style={{ minHeight: '260px' }}
              >
                {/* Learned indicator badge */}
                {isCurrentLearned && (
                  <div className="absolute top-3.5 right-3.5 z-10">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                      <Check size={11} className="stroke-[2.5]" />
                      Öğrenildi
                    </span>
                  </div>
                )}

                {/* Card Content Container */}
                <div className="flex flex-col items-center justify-center p-6 sm:p-8 min-h-[260px]">
                  {/* Front View: V1 only */}
                  <div className="flex flex-col items-center text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-bold tracking-wider uppercase mb-3">
                      V1 · Base Form
                    </span>

                    <div className="flex items-center justify-center gap-3 mb-2">
                      <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
                        {currentVerb.v1}
                      </h2>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakEnglish(currentVerb.v1);
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                        title="V1 Telaffuzu Dinle"
                        aria-label="V1 Telaffuzu Dinle"
                      >
                        <Volume2 size={22} />
                      </button>
                    </div>

                    {!isFlipped && (
                      <div className="mt-8 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 animate-pulse">
                        <Eye size={14} />
                        <span>V2, V3 ve anlamı görmek için tıkla</span>
                      </div>
                    )}
                  </div>

                  {/* Back View: V1, V2, V3 + Turkish Meaning revealed */}
                  {isFlipped && (
                    <div className="mt-6 w-full border-t border-slate-200/80 dark:border-slate-800 pt-6 animate-fade-in">
                      {/* 3 Forms Grid */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 text-center">
                        {/* V1 Block */}
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            V1
                          </span>
                          <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            {currentVerb.v1}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakEnglish(currentVerb.v1);
                            }}
                            className="mt-1.5 p-1 rounded-md text-slate-400 hover:text-blue-600"
                            title="Dinle"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>

                        {/* V2 Block */}
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                            V2 (Past)
                          </span>
                          <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                            {currentVerb.v2}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakEnglish(currentVerb.v2);
                            }}
                            className="mt-1.5 p-1 rounded-md text-slate-400 hover:text-blue-600"
                            title="Dinle"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>

                        {/* V3 Block */}
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                            V3 (Participle)
                          </span>
                          <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {currentVerb.v3}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakEnglish(currentVerb.v3);
                            }}
                            className="mt-1.5 p-1 rounded-md text-slate-400 hover:text-blue-600"
                            title="Dinle"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Turkish Meaning Block */}
                      <div className="text-center p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/40">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Türkçe Anlamı
                        </span>
                        <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                          {currentVerb.tr}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-6 w-full flex items-center gap-3">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center justify-center w-12 h-12 min-w-[48px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                title="Önceki Fiil (←)"
                aria-label="Önceki Fiil"
              >
                <ChevronLeft size={22} />
              </button>

              <button
                onClick={() => toggleLearned(currentVerb.id)}
                className={`flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 border ${
                  isCurrentLearned
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 size={16} className={isCurrentLearned ? 'text-emerald-500' : 'text-slate-400'} />
                <span>{isCurrentLearned ? 'Öğrenildi Olarak İşaretli' : 'Öğrendim Olarak İşaretle'}</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === verbs.length - 1}
                className="flex items-center justify-center w-12 h-12 min-w-[48px] rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                title="Sonraki Fiil (→)"
                aria-label="Sonraki Fiil"
              >
                <ChevronRight size={22} />
              </button>
            </div>

            {/* Keyboard shortcut guide */}
            <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500 text-center hidden sm:block">
              <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">Space</kbd> çevir ·{' '}
              <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">←</kbd>{' '}
              <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">→</kbd> gezin
            </p>
          </div>
        ) : (
          /* ── LIST VIEW ─────────────────────────────────────────────────────────── */
          <div className="space-y-4 pb-20">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Fiil veya Türkçe anlam ara (örn: be, went, görmek)..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm"
              />
            </div>

            {/* Verbs Table / List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-12 gap-2 p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="col-span-3">V1 (Base)</div>
                <div className="col-span-3">V2 (Past)</div>
                <div className="col-span-3">V3 (Participle)</div>
                <div className="col-span-3 text-right">Anlamı</div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[60vh] overflow-y-auto">
                {filteredVerbs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Aramanıza uygun düzensiz fiil bulunamadı.
                  </div>
                ) : (
                  filteredVerbs.map((v) => {
                    const isLearned = learnedIds.has(v.id);
                    return (
                      <div
                        key={v.id}
                        className={`grid grid-cols-12 gap-2 p-3 text-xs items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          isLearned ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''
                        }`}
                      >
                        <div className="col-span-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                          <button
                            type="button"
                            onClick={() => speakEnglish(v.v1)}
                            className="text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                            title="Dinle"
                          >
                            <Volume2 size={13} />
                          </button>
                          <span className="truncate">{v.v1}</span>
                        </div>
                        <div className="col-span-3 text-blue-600 dark:text-blue-400 font-semibold truncate">
                          {v.v2}
                        </div>
                        <div className="col-span-3 text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                          {v.v3}
                        </div>
                        <div className="col-span-3 text-right text-slate-500 dark:text-slate-400 truncate">
                          {v.tr}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 px-1">
              Toplam {filteredVerbs.length} fiil listeleniyor
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IrregularVerbsPractice;
