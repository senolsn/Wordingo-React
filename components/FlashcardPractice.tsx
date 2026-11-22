import React, { useState, useEffect, useCallback } from 'react';
import { WordGroup, Word, QuizDirection } from '../types';
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  RotateCcw,
  Eye,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  CheckCircle2,
  BookOpen,
  X,
  Play
} from 'lucide-react';
import { speakEnglish } from '../services/ttsService';
import usFlag from '../assets/us.svg';
import trFlag from '../assets/tr.svg';

interface FlashcardPracticeProps {
  group: WordGroup;
  onExit: () => void;
  onStartQuiz: () => void;
}

type PracticeDirection = 'en-to-tr' | 'tr-to-en';

const FlashcardPractice: React.FC<FlashcardPracticeProps> = ({ group, onExit, onStartQuiz }) => {
  const [direction, setDirection] = useState<PracticeDirection | null>(null);
  const [cards, setCards] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [isFinished, setIsFinished] = useState(false);

  // Shuffle helper
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const startPractice = (dir: PracticeDirection) => {
    setDirection(dir);
    setCards(shuffleArray(group.words));
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownIds(new Set());
    setIsFinished(false);
  };

  const handleShuffle = () => {
    setCards(shuffleArray(cards));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleFlip = () => setIsFlipped((prev) => !prev);

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, cards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleMarkKnown = () => {
    setKnownIds((prev) => new Set([...prev, cards[currentIndex].id]));
    handleNext();
  };

  const handleRestartUnknown = () => {
    const unknownCards = cards.filter((c) => !knownIds.has(c.id));
    if (unknownCards.length === 0) {
      setIsFinished(false);
      setCurrentIndex(0);
      setIsFlipped(false);
      setKnownIds(new Set());
      setCards(shuffleArray(group.words));
      return;
    }
    setCards(shuffleArray(unknownCards));
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownIds(new Set());
    setIsFinished(false);
  };

  const handleRestartAll = () => {
    setCards(shuffleArray(group.words));
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownIds(new Set());
    setIsFinished(false);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!direction || isFinished) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'l') handleNext();
      if (e.key === 'ArrowLeft' || e.key === 'h') handlePrev();
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      }
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [direction, isFinished, handleNext, handlePrev]);

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const knownCount = knownIds.size;

  // ── Direction Selection Screen ──────────────────────────────────────────────
  if (!direction) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 safe-area-inset-top safe-area-inset-bottom">
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <button
            onClick={onExit}
            className="flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Geri Dön"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="font-bold text-sm text-slate-900 dark:text-white mx-auto pr-11">
            Kelime Kartı Pratiği
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 max-w-md mx-auto w-full py-8 pb-28 md:py-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/10">
              <BookOpen size={30} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
              Flashcard Pratiği
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deste: <span className="font-semibold text-slate-800 dark:text-slate-200">{group.name}</span> ({group.words.length} kelime)
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Kartın üstüne tıklayarak anlamını görün, geçmişini takip edin.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => startPractice('en-to-tr')}
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
              onClick={() => startPractice('tr-to-en')}
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

  // ── Finished Screen ─────────────────────────────────────────────────────────
  if (isFinished) {
    const unknownCount = cards.length - knownCount;
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 safe-area-inset-top safe-area-inset-bottom">
        <div className="flex items-center justify-center px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pratik Tamamlandı</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 pb-28 md:py-8 max-w-md mx-auto w-full text-center">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 border border-blue-200 dark:border-blue-800 shadow-xl shadow-blue-500/10 flex items-center justify-center mb-6">
            <BookOpen size={40} />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
            {knownCount === cards.length ? 'Harika! Hepsini Biliyorsunuz!' : 'Tur Tamamlandı!'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
            {knownCount === cards.length
              ? 'Tüm kelimeleri öğrendiniz. Quiz\'e geçmeye hazırsınız!'
              : `${unknownCount} kelimeyi tekrar çalışabilirsiniz.`}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 w-full mb-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">{knownCount}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Biliyorum ✓</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-0.5">{unknownCount}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Tekrar Gerek</div>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full space-y-2.5">
            <button
              onClick={onStartQuiz}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-98 text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              <Play size={15} className="fill-current" />
              <span>Quiz'e Geç</span>
            </button>

            {unknownCount > 0 && (
              <button
                onClick={handleRestartUnknown}
                className="w-full bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60 font-bold py-3.5 rounded-2xl transition-all active:scale-98 text-xs flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                <span>Bilinmeyenleri Tekrarla ({unknownCount})</span>
              </button>
            )}

            <button
              onClick={handleRestartAll}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold py-3.5 rounded-2xl transition-all active:scale-98 text-xs shadow-sm flex items-center justify-center gap-2"
            >
              <RotateCcw size={13} />
              Tümünü Baştan Başlat
            </button>

            <button
              onClick={onExit}
              className="w-full text-slate-500 dark:text-slate-400 font-medium py-2.5 rounded-2xl text-xs hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Destelere Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active Flashcard Screen ─────────────────────────────────────────────────
  const frontText = direction === 'en-to-tr' ? currentCard.en : currentCard.tr;
  const backText = direction === 'en-to-tr' ? currentCard.tr : currentCard.en;
  const isEnFront = direction === 'en-to-tr';
  const isKnown = knownIds.has(currentCard.id);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 safe-area-inset-top safe-area-inset-bottom">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={onExit}
            className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none"
            aria-label="Çıkış"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/50 dark:border-blue-900/50">
              {direction === 'en-to-tr' ? 'EN → TR' : 'TR → EN'}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {currentIndex + 1} / {cards.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200/50 dark:border-emerald-900/50">
              <CheckCircle2 size={12} />
              {knownCount}
            </span>
            <button
              onClick={handleShuffle}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
              title="Kartları Karıştır"
            >
              <Shuffle size={16} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 pb-28 md:py-8 max-w-lg mx-auto w-full">

        {/* Card */}
        <div
          className="w-full cursor-pointer select-none"
          onClick={handleFlip}
          role="button"
          tabIndex={0}
          aria-label={isFlipped ? 'Kartı gizle' : 'Anlamı göster'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleFlip();
            }
          }}
        >
          <div
            className={`relative w-full rounded-3xl border-2 shadow-xl transition-all duration-200 overflow-hidden
              ${isKnown
                ? 'border-emerald-400/60 dark:border-emerald-700/60'
                : 'border-slate-200/80 dark:border-slate-700/60'}
              ${isFlipped
                ? 'bg-blue-50 dark:bg-slate-800/60'
                : 'bg-white dark:bg-slate-900'}
            `}
            style={{ minHeight: '220px' }}
          >
            {/* Known indicator */}
            {isKnown && (
              <div className="absolute top-3 right-3">
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                  <CheckCircle2 size={10} />
                  Biliyorum
                </span>
              </div>
            )}

            {/* Front */}
            <div className="flex flex-col items-center justify-center p-8 pt-10" style={{ minHeight: '220px' }}>
              {/* Language indicator */}
              <div className="flex items-center gap-1.5 mb-5">
                <img
                  src={isEnFront ? usFlag : trFlag}
                  alt={isEnFront ? 'English' : 'Türkçe'}
                  className="w-5 h-5 rounded-full object-cover shadow-sm ring-1 ring-black/10"
                />
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {isEnFront ? 'İngilizce' : 'Türkçe'}
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight text-center break-words mb-4">
                {frontText}
              </h2>

              {/* TTS button for English front */}
              {isEnFront && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakEnglish(frontText);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                  title="Telaffuzu Dinle"
                >
                  <Volume2 size={20} />
                </button>
              )}

              {/* Flip Hint */}
              {!isFlipped && (
                <div className="mt-6 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 animate-pulse">
                  <Eye size={13} />
                  <span>Anlamı görmek için tıkla</span>
                </div>
              )}

              {/* Answer revealed */}
              {isFlipped && (
                <div className="mt-5 w-full border-t border-blue-200/50 dark:border-slate-700/60 pt-5 flex flex-col items-center animate-fade-in">
                  <div className="flex items-center gap-1.5 mb-2">
                    <img
                      src={isEnFront ? trFlag : usFlag}
                      alt={isEnFront ? 'Türkçe' : 'English'}
                      className="w-5 h-5 rounded-full object-cover shadow-sm ring-1 ring-black/10"
                    />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {isEnFront ? 'Türkçe Anlamı' : 'İngilizce Karşılığı'}
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-300 text-center break-words">
                    {backText}
                  </p>
                  {/* TTS for English back */}
                  {!isEnFront && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakEnglish(backText);
                      }}
                      className="mt-3 w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                      title="Telaffuzu Dinle"
                    >
                      <Volume2 size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation & Action Row */}
        <div className="mt-6 w-full flex items-center gap-3">
          {/* Prev */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center justify-center w-12 h-12 min-w-[48px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            aria-label="Önceki kart"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Know / Don't Know */}
          <div className="flex flex-1 gap-2">
            <button
              onClick={() => {
                // Mark as not known and go next
                setKnownIds((prev) => {
                  const next = new Set(prev);
                  next.delete(currentCard.id);
                  return next;
                });
                handleNext();
              }}
              className="flex-1 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:border-rose-800 dark:hover:text-rose-400 transition-all shadow-sm active:scale-98"
            >
              Bilmiyorum
            </button>
            <button
              onClick={handleMarkKnown}
              className="flex-1 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all shadow-sm active:scale-98"
            >
              Biliyorum ✓
            </button>
          </div>

          {/* Next */}
          <button
            onClick={handleNext}
            className="flex items-center justify-center w-12 h-12 min-w-[48px] rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            aria-label="Sonraki kart"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-600 text-center hidden sm:block">
          <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">Space</kbd> çevir ·{' '}
          <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">←</kbd>{' '}
          <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">→</kbd> gezin
        </p>
      </div>
    </div>
  );
};

export default FlashcardPractice;
