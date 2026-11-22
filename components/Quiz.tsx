import React, { useState, useEffect } from 'react';
import { WordGroup, QuizQuestion, WrongAnswer, QuizDirection } from '../types';
import { ArrowLeft, Check, X, Loader2, Trophy, AlertCircle, Languages, ArrowRight, ChevronUp, RotateCcw } from 'lucide-react';
import { prepareQuizData } from '../services/geminiService';

interface QuizProps {
  group: WordGroup;
  onExit: () => void;
  onUpdateMistakes?: (wordIds: string[]) => void;
  onPerfectCompletion?: () => void;
}

const Quiz: React.FC<QuizProps> = ({ group, onExit, onUpdateMistakes, onPerfectCompletion }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingState, setLoadingState] = useState<'direction-select' | 'generating' | 'ready'>('direction-select');
  const [quizDirection, setQuizDirection] = useState<QuizDirection | null>(null);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Mobile wrong answers panel
  const [showWrongPanel, setShowWrongPanel] = useState(false);

  // Start quiz when direction is selected
  const startQuiz = async (direction: QuizDirection) => {
    setQuizDirection(direction);
    setLoadingState('generating');
    try {
      const generatedQuestions = await prepareQuizData(group.words, direction);
      setQuestions(generatedQuestions);
      setLoadingState('ready');
    } catch (error) {
      console.error("Failed to prepare quiz", error);
      alert("Quiz başlatılırken hata oluştu.");
      onExit();
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
        // If answered and was wrong, Space or Enter advances
        if (!isCorrect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleNext(wrongAnswers);
        }
        return;
      }

      // Keys 1, 2, 3, 4
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
    if (selectedOption) return; // Prevent double click

    const currentQuestion = questions[currentIndex];
    setSelectedOption(option);

    if (option === currentQuestion.correctOption) {
      setIsCorrect(true);
      setScore(s => s + 1);
      // Doğru cevapta akıcı ve hızlı geçiş (600ms)
      setTimeout(() => {
        handleNext(wrongAnswers);
      }, 600);
    } else {
      setIsCorrect(false);
      const wrongItem: WrongAnswer = {
        word: currentQuestion.targetWord,
        userAnswer: option,
        correctAnswer: currentQuestion.correctOption
      };
      setWrongAnswers(prev => [wrongItem, ...prev]);
      // Yanlış cevapta otomatik geçiş durduruldu; öğrenci inceleyip "Devam Et" butonuna basar!
    }
  };

  const handleNext = (finalWrongAnswers: WrongAnswer[]) => {
    setSelectedOption(null);
    setIsCorrect(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      setFinished(true);

      // Analytics for Supabase
      if (finalWrongAnswers.length === 0) {
        onPerfectCompletion?.();
      } else {
        const uniqueIds = Array.from(new Set(finalWrongAnswers.map(w => w.word.id)));
        onUpdateMistakes?.(uniqueIds);
      }
    }
  };

  const retryWrongWords = async () => {
    if (wrongAnswers.length === 0) return;
    const missedWords = Array.from(
      new Map(wrongAnswers.map(wa => [wa.word.id, wa.word])).values()
    );
    setLoadingState('generating');
    setFinished(false);
    setScore(0);
    setCurrentIndex(0);
    setWrongAnswers([]);
    setSelectedOption(null);
    setIsCorrect(null);
    try {
      const generated = await prepareQuizData(missedWords, quizDirection || 'tr-to-en');
      setQuestions(generated);
      setLoadingState('ready');
    } catch (err) {
      console.error("Hataları tekrarlama hatası:", err);
      alert("Hataları tekrarlama hazırlanırken hata oluştu.");
      onExit();
    }
  };

  // Direction selection screen - MOBILE OPTIMIZED
  if (loadingState === 'direction-select') {
    return (
      <div className="full-height-mobile flex flex-col bg-zinc-950 text-zinc-100 safe-area-inset-top safe-area-inset-bottom">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <button
            onClick={onExit}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors haptic-feedback"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-medium text-zinc-400">{group.name}</span>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 animate-slide-up">
          <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl flex items-center justify-center mb-8">
            <Languages size={40} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight text-center">Quiz Yönünü Seçin</h2>
          <p className="text-zinc-400 text-center mb-10 text-sm sm:text-base px-4">
            Hangi çeviri yönünde pratik yapmak istiyorsunuz?
          </p>

          <div className="w-full max-w-md space-y-4 px-2">
            {/* Türkçe -> İngilizce */}
            <button
              onClick={() => startQuiz('tr-to-en')}
              className="group relative w-full p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800 active:bg-zinc-800 active:scale-[0.98] transition-all duration-200 text-left haptic-feedback"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                    <img src="assets/tr.svg" alt="Turkish" className="w-full h-full object-cover" />
                  </div>
                  <ArrowRight className="text-zinc-500 group-active:text-white transition-colors" size={20} />
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                    <img src="assets/us.svg" alt="English" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Türkçe → İngilizce</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 truncate">Türkçe kelime, İngilizce karşılık</p>
                </div>
              </div>
            </button>

            {/* İngilizce -> Türkçe */}
            <button
              onClick={() => startQuiz('en-to-tr')}
              className="group relative w-full p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800 active:bg-zinc-800 active:scale-[0.98] transition-all duration-200 text-left haptic-feedback"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                    <img src="assets/us.svg" alt="English" className="w-full h-full object-cover" />
                  </div>
                  <ArrowRight className="text-zinc-500 group-active:text-white transition-colors" size={20} />
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                    <img src="assets/tr.svg" alt="Turkish" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-white">İngilizce → Türkçe</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 truncate">İngilizce kelime, Türkçe karşılık</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen - MOBILE OPTIMIZED
  if (loadingState === 'generating') {
    return (
      <div className="full-height-mobile flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 px-6 safe-area-inset-bottom">
        <div className="animate-scale-in text-center">
          <div className="relative mb-6">
            <Loader2 className="h-16 w-16 animate-spin text-zinc-100 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Quiz Hazırlanıyor</h2>
          <p className="text-zinc-400">Yapay zeka çeldirici şıkları üretiyor...</p>
          <div className="mt-4 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 inline-flex items-center gap-2 text-sm text-zinc-300 font-medium">
            {quizDirection === 'tr-to-en' ? (
              <>TR <ArrowRight size={14} className="text-zinc-500" /> EN</>
            ) : (
              <>EN <ArrowRight size={14} className="text-zinc-500" /> TR</>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Finished screen - MOBILE OPTIMIZED
  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    const isGoodScore = percentage >= 70;

    return (
      <div className="full-height-mobile flex flex-col bg-zinc-950 text-zinc-100 safe-area-inset-top safe-area-inset-bottom">
        {/* Header */}
        <div className="flex items-center justify-center px-4 py-3 border-b border-zinc-800">
          <span className="text-sm font-medium text-zinc-400">Quiz Tamamlandı</span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 animate-scale-in">
          <div className={`w-24 h-24 rounded-3xl border flex items-center justify-center mb-8 ${isGoodScore
            ? 'bg-zinc-900 border-emerald-500/30 text-emerald-400'
            : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}>
            <Trophy size={48} />
          </div>

          <h2 className="text-3xl font-bold mb-2">{isGoodScore ? 'Tebrikler!' : 'Quiz Bitti!'}</h2>
          <p className="text-zinc-400 mb-8">
            {isGoodScore ? 'Harika bir performans gösterdin!' : 'Hatalarını tekrar ederek tam kavrayışa ulaşabilirsin.'}
          </p>

          {/* Score Display */}
          <div className="relative mb-10">
            <div className="w-40 h-40 rounded-full border-4 border-zinc-800 flex items-center justify-center relative">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(${isGoodScore ? '#22c55e' : '#fafafa'} ${percentage}%, transparent 0)`,
                  maskImage: 'radial-gradient(transparent 60%, black 61%)',
                  WebkitMaskImage: 'radial-gradient(transparent 60%, black 61%)'
                }}
              />
              <div className="text-center z-10">
                <div className="text-5xl font-bold text-white">{score}</div>
                <div className="text-zinc-500 text-sm">/ {questions.length}</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400 mb-1">{score}</div>
              <div className="text-xs text-zinc-500">Doğru</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-rose-400 mb-1">{wrongAnswers.length}</div>
              <div className="text-xs text-zinc-500">Yanlış</div>
            </div>
          </div>

          {/* Wrong Answers Summary (Mobile) */}
          {wrongAnswers.length > 0 && (
            <button
              onClick={() => setShowWrongPanel(true)}
              className="flex items-center gap-2 text-sm text-zinc-400 mb-8 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 haptic-feedback hover:text-white"
            >
              <AlertCircle size={16} />
              Hatalı cevapları incele ({wrongAnswers.length})
            </button>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="px-5 pb-6 space-y-3">
          {wrongAnswers.length > 0 && (
            <button
              onClick={retryWrongWords}
              className="w-full bg-white text-zinc-950 font-semibold py-4 rounded-xl transition-all active:scale-[0.98] haptic-feedback text-base flex items-center justify-center gap-2 shadow-lg"
            >
              <RotateCcw size={18} />
              <span>Sadece Hataları Tekrarla ({wrongAnswers.length} Kelime)</span>
            </button>
          )}
          <button
            onClick={onExit}
            className={`w-full font-medium py-3.5 rounded-xl transition-all active:scale-[0.98] haptic-feedback text-base ${
              wrongAnswers.length > 0
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'
                : 'bg-white text-zinc-950 font-semibold py-4'
            }`}
          >
            Ana Ekrana Dön
          </button>
        </div>

        {/* Wrong Answers Bottom Sheet */}
        {showWrongPanel && (
          <div className="fixed inset-0 z-50 flex flex-col">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
              onClick={() => setShowWrongPanel(false)}
            />
            <div className="mt-auto bg-zinc-900 rounded-t-3xl border-t border-zinc-800 relative animate-slide-up max-h-[70vh] flex flex-col safe-area-inset-bottom">
              <div className="flex-shrink-0 pt-3 pb-2">
                <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 flex-shrink-0">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-400" />
                  Hatalı Cevaplar
                </h3>
                <button
                  onClick={() => setShowWrongPanel(false)}
                  className="text-zinc-400 hover:text-white p-2 -mr-2"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 overscroll-contain">
                {wrongAnswers.map((wa, idx) => (
                  <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-red-900/30">
                    <div className="font-medium text-white mb-2 text-lg">
                      {quizDirection === 'tr-to-en' ? wa.word.tr : wa.word.en}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-red-400">
                        <X size={14} />
                        <span className="line-through opacity-70">{wa.userAnswer}</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-500 font-medium">
                        <Check size={14} />
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

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Main Quiz Screen - MOBILE OPTIMIZED
  return (
    <div className="full-height-mobile flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 safe-area-inset-top">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onExit}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 text-zinc-400 active:text-white active:bg-zinc-800 transition-colors haptic-feedback"
            title="Çıkış (Esc)"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300">
              {quizDirection === 'tr-to-en' ? 'TR → EN' : 'EN → TR'}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <span className="font-bold text-white">{currentIndex + 1}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-500">{questions.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Header wrong count pill */}
            {wrongAnswers.length > 0 && (
              <button
                onClick={() => setShowWrongPanel(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
                title="Hatalı cevapları incele"
              >
                <AlertCircle size={14} />
                <span>{wrongAnswers.length}</span>
              </button>
            )}
            {/* Score pill */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs">
              <Check size={14} />
              <span>{score}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 flex flex-col justify-center px-5 py-6 overflow-y-auto">
        <div className="animate-slide-up">
          {/* Question Word */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 border border-zinc-800 mb-4">
              {quizDirection === 'tr-to-en' ? 'Türkçe → İngilizce' : 'İngilizce → Türkçe'}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight break-words">
              {quizDirection === 'tr-to-en' ? currentQuestion.targetWord.tr : currentQuestion.targetWord.en}
            </h2>
            <p className="text-zinc-500 text-sm">
              {quizDirection === 'tr-to-en' ? 'Doğru İngilizce karşılığı seçin' : 'Doğru Türkçe karşılığı seçin'}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 max-w-lg mx-auto w-full">
            {currentQuestion.options.map((option, idx) => {
              let btnClass = "bg-zinc-900 border-zinc-800 text-zinc-200 active:bg-zinc-800 active:border-zinc-700";
              let iconComponent = null;

              if (selectedOption) {
                if (option === currentQuestion.correctOption) {
                  btnClass = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 ring-2 ring-emerald-500/30";
                  iconComponent = <Check className="absolute right-4 w-5 h-5 text-emerald-500" />;
                } else if (option === selectedOption) {
                  btnClass = "bg-rose-500/10 border-rose-500/50 text-rose-400 ring-2 ring-rose-500/30 animate-shake";
                  iconComponent = <X className="absolute right-4 w-5 h-5 text-rose-500" />;
                } else {
                  btnClass = "bg-zinc-900/50 border-zinc-800 text-zinc-600 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(option)}
                  disabled={selectedOption !== null}
                  className={`relative w-full p-4 sm:p-5 rounded-xl border-2 text-base sm:text-lg font-medium transition-all duration-200 min-h-[60px] flex items-center justify-center text-center haptic-feedback ${btnClass}`}
                >
                  <span className="hidden sm:inline-flex items-center justify-center w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-mono absolute left-4">
                    {idx + 1}
                  </span>
                  <span className="text-center w-full px-8">{option}</span>
                  {iconComponent}
                </button>
              );
            })}

            {/* Manual Advance Bar on Error */}
            {selectedOption !== null && !isCorrect && (
              <div className="pt-4 flex flex-col items-center animate-slide-up">
                <button
                  onClick={() => handleNext(wrongAnswers)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-zinc-950 font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-lg text-base"
                >
                  <span>Devam Et</span>
                  <span className="hidden sm:inline text-xs text-zinc-500 font-normal border border-zinc-300 rounded px-1.5 py-0.5 ml-1">Space ↵</span>
                  <ArrowRight size={18} />
                </button>
                <p className="text-zinc-500 text-xs mt-2">Cevabı inceledikten sonra devam edebilirsiniz</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wrong Answers Bottom Sheet */}
      {showWrongPanel && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowWrongPanel(false)}
          />
          <div className="mt-auto bg-zinc-900 rounded-t-3xl border-t border-zinc-800 relative animate-slide-up max-h-[60vh] flex flex-col safe-area-inset-bottom">
            <div className="flex-shrink-0 pt-3 pb-2">
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 flex-shrink-0">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <AlertCircle size={18} className="text-red-400" />
                Hatalı Cevaplar ({wrongAnswers.length})
              </h3>
              <button
                onClick={() => setShowWrongPanel(false)}
                className="text-zinc-400 hover:text-white p-2 -mr-2"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 overscroll-contain">
              {wrongAnswers.map((wa, idx) => (
                <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-red-900/30">
                  <div className="font-medium text-white mb-2">
                    {quizDirection === 'tr-to-en' ? wa.word.tr : wa.word.en}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-red-400">
                      <X size={14} />
                      <span className="line-through opacity-70">{wa.userAnswer}</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-500 font-medium">
                      <Check size={14} />
                      <span>{wa.correctAnswer}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Hidden on Mobile */}
      <div className="hidden lg:flex fixed right-0 top-0 bottom-0 w-80 bg-zinc-900 border-l border-zinc-800 flex-col z-10">
        <div className="p-4 border-b border-zinc-800 font-semibold text-zinc-200 flex items-center gap-2 text-sm">
          <AlertCircle size={16} />
          Hatalı Cevaplar
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {wrongAnswers.length === 0 ? (
            <div className="text-center text-zinc-600 mt-10 text-sm">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Check size={24} className="text-zinc-600" />
              </div>
              <p>Hata yok, harika!</p>
            </div>
          ) : (
            wrongAnswers.map((wa, idx) => (
              <div key={idx} className="bg-zinc-950/50 p-3 rounded-xl border border-red-900/30">
                <div className="font-medium text-zinc-200 mb-1">
                  {quizDirection === 'tr-to-en' ? wa.word.tr : wa.word.en}
                </div>
                <div className="text-sm flex flex-col gap-1">
                  <span className="text-red-400 line-through decoration-red-400/50 opacity-70">{wa.userAnswer}</span>
                  <span className="text-green-500 font-medium flex items-center gap-1">
                    {wa.correctAnswer}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;