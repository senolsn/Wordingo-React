import React, { useState, useEffect } from 'react';
import { WordGroup, QuizQuestion, WrongAnswer, QuizDirection } from '../types';
import {
  ArrowLeft,
  Check,
  X,
  Loader2,
  Trophy,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Volume2,
  Star,
  Play
} from 'lucide-react';
import { prepareQuizData } from '../services/geminiService';
import usFlag from '../assets/us.svg';
import trFlag from '../assets/tr.svg';

interface QuizProps {
  group: WordGroup;
  onExit: () => void;
  onUpdateMistakes?: (wordIds: string[]) => void;
  onPerfectCompletion?: () => void;
  onRecordStudyTime?: (minutes: number) => void;
}

const Quiz: React.FC<QuizProps> = ({
  group,
  onExit,
  onUpdateMistakes,
  onPerfectCompletion,
  onRecordStudyTime
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingState, setLoadingState] = useState<'direction-select' | 'generating' | 'ready'>('direction-select');
  const [quizDirection, setQuizDirection] = useState<QuizDirection | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<number>(Date.now());

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showWrongPanel, setShowWrongPanel] = useState(false);

  const [quizError, setQuizError] = useState<string | null>(null);

  // Audio pronunciation helper
  const speakEnglish = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error', e);
    }
  };

  // Start quiz when direction is selected
  const startQuiz = async (direction: QuizDirection) => {
    setQuizDirection(direction);
    setLoadingState('generating');
    setQuizStartTime(Date.now());
    setQuizError(null);
    try {
      const generatedQuestions = await prepareQuizData(group.words, direction);
      setQuestions(generatedQuestions);
      setLoadingState('ready');
    } catch (error) {
      console.error("Failed to prepare quiz", error);
      setQuizError("Quiz hazırlanırken bir sorun oluştu. Lütfen tekrar deneyin.");
      setLoadingState('direction-select');
    }
  };

  // Keyboard shortcut support (1-4 for options, Space/Enter to advance on error, Esc to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loadingState !== 'ready' || finished) return;

      if (e.key === 'Escape') {
        onExit();
        return;
      }

      if (selectedOption !== null) {
        if (!isCorrect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleNext(wrongAnswers);
        }
        return;
      }

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 4) {
        const currentOpts = questions[currentIndex]?.options;
        if (currentOpts && currentOpts[num - 1]) {
          e.preventDefault();
          handleOptionClick(currentOpts[num - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadingState, finished, selectedOption, isCorrect, currentIndex, questions, wrongAnswers]);

  const handleOptionClick = (option: string) => {
    if (selectedOption) return;

    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const currentQuestion = questions[currentIndex];
    setSelectedOption(option);

    if (option === currentQuestion.correctOption) {
      setIsCorrect(true);
      setScore((s) => s + 1);
      setTimeout(() => {
        handleNext(wrongAnswers);
      }, 550);
    } else {
      setIsCorrect(false);
      const wrongItem: WrongAnswer = {
        word: currentQuestion.targetWord,
        userAnswer: option,
        correctAnswer: currentQuestion.correctOption
      };
      setWrongAnswers((prev) => [wrongItem, ...prev]);
    }
  };

  const handleNext = (currentWrongAnswers: WrongAnswer[]) => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setFinished(true);

      const uniqueWrongWordIds = Array.from(new Set(currentWrongAnswers.map((w) => w.word.id)));
      if (onUpdateMistakes) {
        onUpdateMistakes(uniqueWrongWordIds);
      }

      if (currentWrongAnswers.length === 0 && onPerfectCompletion) {
        onPerfectCompletion();
      }

      if (onRecordStudyTime) {
        const minutes = Math.max(1, Math.round((Date.now() - quizStartTime) / 60000));
        onRecordStudyTime(minutes);
      }
    }
  };

  const retryWrongWords = () => {
    if (wrongAnswers.length === 0) return;
    const uniqueWrongWords = Array.from(new Map(wrongAnswers.map((wa) => [wa.word.id, wa.word])).values());
    const direction = quizDirection || 'en-to-tr';
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setWrongAnswers([]);
    setFinished(false);
    setSelectedOption(null);
    setIsCorrect(null);
    setShowWrongPanel(false);
    setLoadingState('generating');

    prepareQuizData(uniqueWrongWords, direction)
      .then((newQuestions) => {
        setQuestions(newQuestions);
        setLoadingState('ready');
      })
      .catch((err) => {
        console.error("Retry failed", err);
        setQuizError("Tekrar soruları yüklenirken bir sorun oluştu.");
        setLoadingState('direction-select');
      });
  };

  // Direction Select Screen
  if (loadingState === 'direction-select') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 safe-area-inset-top safe-area-inset-bottom">
        <div className="flex items-center px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <button
            onClick={onExit}
            className="flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Geri Dön"
            aria-label="Destelere geri dön"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="font-bold text-sm text-slate-900 dark:text-white mx-auto pr-11">
            Quiz Yönü Seçin
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 max-w-md mx-auto w-full py-8 pb-28 md:py-8">
          {quizError && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs animate-shake">
              <AlertCircle size={18} className="shrink-0" />
              <span>{quizError}</span>
            </div>
          )}

          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
              Nasıl Pratik Yapmak İstersiniz?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deste: <span className="font-semibold text-slate-800 dark:text-slate-200">{group.name}</span> ({group.words.length} kelime)
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => startQuiz('en-to-tr')}
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">Soru İngilizce, şıklar Türkçe</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
            </button>

            <button
              onClick={() => startQuiz('tr-to-en')}
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">Soru Türkçe, şıklar İngilizce</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (loadingState === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-6">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1.5">
            Quiz Hazırlanıyor
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            Yapay zeka akıllı çeldiriciler ve soru seçeneklerini üretiyor...
          </p>
        </div>
      </div>
    );
  }

  // Finished Screen
  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    const isGoodScore = percentage >= 70;

    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 safe-area-inset-top safe-area-inset-bottom">
        <div className="flex items-center justify-center px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Quiz Sonucu
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 pb-28 md:py-8 max-w-md mx-auto w-full text-center">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${
              isGoodScore
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-800 shadow-amber-500/20'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border border-blue-200 dark:border-blue-800 shadow-blue-500/20'
            }`}
          >
            <Trophy size={40} />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
            {isGoodScore ? 'Muhteşem Başarı!' : 'Quiz Tamamlandı!'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
            {isGoodScore
              ? 'Kelimeleri harika bir başarı oranıyla tamamladınız.'
              : 'Yanlışlarınızı inceleyip hatalı kelimeleri tekrar ederek hafızanızı güçlendirebilirsiniz.'}
          </p>

          {/* Score Badge */}
          <div className="w-32 h-32 rounded-full border-4 border-blue-500/20 flex flex-col items-center justify-center mb-8 relative bg-white dark:bg-slate-900 shadow-md">
            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              %{percentage}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {score} / {questions.length} Doğru
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full mb-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">{score}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Doğru Cevap</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mb-0.5">{wrongAnswers.length}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Yanlış Cevap</div>
            </div>
          </div>

          {/* Wrong answers review button */}
          {wrongAnswers.length > 0 && (
            <button
              onClick={() => setShowWrongPanel(true)}
              className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 mb-6 px-3.5 py-2 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 transition-colors"
            >
              <AlertCircle size={14} />
              <span>Hatalı {wrongAnswers.length} kelimeyi incele</span>
            </button>
          )}

          {/* Actions */}
          <div className="w-full space-y-2.5">
            {wrongAnswers.length > 0 && (
              <button
                onClick={retryWrongWords}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-98 text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
              >
                <RotateCcw size={16} />
                <span>Sadece Hataları Tekrarla ({wrongAnswers.length} Kelime)</span>
              </button>
            )}
            <button
              onClick={onExit}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold py-3.5 rounded-2xl transition-all active:scale-98 text-xs shadow-sm"
            >
              Destelere Dön
            </button>
          </div>
        </div>

        {/* Wrong Answers Sheet */}
        {showWrongPanel && (
          <div className="fixed inset-0 z-50 flex flex-col">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={() => setShowWrongPanel(false)}
            />
            <div className="mt-auto bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 relative animate-slide-up max-h-[70vh] flex flex-col safe-area-inset-bottom shadow-2xl p-5">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-500" />
                  <span>Hatalı Cevaplar ({wrongAnswers.length})</span>
                </h3>
                <button
                  onClick={() => setShowWrongPanel(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5">
                {wrongAnswers.map((wa, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                      {quizDirection === 'tr-to-en' ? wa.word.tr : wa.word.en}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-rose-500 line-through">
                        <X size={13} />
                        <span>{wa.userAnswer}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Check size={13} />
                        <span>{wa.correctAnswer}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active Quiz Question
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isEnTarget = quizDirection !== 'tr-to-en';
  const targetText = isEnTarget ? currentQuestion.targetWord.en : currentQuestion.targetWord.tr;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 safe-area-inset-top safe-area-inset-bottom">
      {/* Quiz Top Bar */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={onExit}
            className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Quizden Çık"
            aria-label="Quizden Çık"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/50 dark:border-blue-900/50">
              {quizDirection === 'tr-to-en' ? 'TR ➔ EN' : 'EN ➔ TR'}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200/50 dark:border-emerald-900/50">
            <Check size={13} />
            <span>{score}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Body */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-6 pb-28 md:py-6 max-w-lg mx-auto w-full">
        {/* Target Word */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
              {targetText}
            </h2>
            {isEnTarget && (
              <button
                onClick={() => speakEnglish(targetText)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                title="Telaffuzu Dinle"
                aria-label="İngilizce Telaffuzu Dinle"
              >
                <Volume2 size={22} />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isEnTarget ? 'Doğru Türkçe karşılığı seçin' : 'Doğru İngilizce karşılığı seçin'}
          </p>
        </div>

        {/* 4 Option Buttons (Keyed to question ID to guarantee complete DOM recycling on mobile) */}
        <div key={`options-container-${currentQuestion.targetWord.id}-${currentIndex}`} className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            let stateStyles =
              'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 quiz-option-hover';
            let iconComponent = null;

            if (selectedOption) {
              if (option === currentQuestion.correctOption) {
                stateStyles =
                  'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30';
                iconComponent = <Check size={18} className="text-emerald-600 absolute right-4" />;
              } else if (option === selectedOption) {
                stateStyles =
                  'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30 animate-shake';
                iconComponent = <X size={18} className="text-rose-600 absolute right-4" />;
              } else {
                stateStyles = 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/40 text-slate-400 opacity-60';
              }
            }

            return (
              <button
                key={`opt-${currentQuestion.targetWord.id}-${idx}`}
                onClick={(e) => {
                  e.currentTarget.blur();
                  handleOptionClick(option);
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.blur();
                }}
                disabled={selectedOption !== null}
                className={`quiz-option-btn relative w-full p-4 rounded-2xl border-2 text-sm sm:text-base font-semibold transition-colors duration-150 min-h-[56px] flex items-center justify-center text-center shadow-sm active:scale-98 focus:outline-none focus:ring-0 sm:focus-visible:ring-2 sm:focus-visible:ring-blue-500 sm:focus-visible:ring-offset-2 dark:sm:focus-visible:ring-offset-slate-900 ${stateStyles}`}
              >
                <span className="hidden sm:inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-mono font-bold absolute left-3.5">
                  {idx + 1}
                </span>
                <span className="w-full px-8 truncate">{option}</span>
                {iconComponent}
              </button>
            );
          })}

          {/* Pause on Wrong Answer: manual advance button */}
          {selectedOption !== null && !isCorrect && (
            <div className="pt-4 flex flex-col items-center animate-slide-up">
              <button
                onClick={() => handleNext(wrongAnswers)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-98 text-xs transition-all"
              >
                <span>Devam Et</span>
                <span className="hidden sm:inline text-xs bg-white/20 text-white rounded px-1.5 py-0.5">
                  Space ↵
                </span>
                <ArrowRight size={16} />
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Doğru cevabı inceledikten sonra devam edebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
