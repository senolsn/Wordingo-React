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

  const handleOptionClick = (option: string) => {
    if (selectedOption) return; // Prevent double click

    const currentQuestion = questions[currentIndex];
    setSelectedOption(option);

    let currentWrongArr = wrongAnswers;

    if (option === currentQuestion.correctOption) {
      setIsCorrect(true);
      setScore(s => s + 1);
    } else {
      setIsCorrect(false);
      const wrongItem = {
        word: currentQuestion.targetWord,
        userAnswer: option,
        correctAnswer: currentQuestion.correctOption
      };
      setWrongAnswers(prev => [wrongItem, ...prev]);
      currentWrongArr = [wrongItem, ...wrongAnswers];
    }

    // Her durumda otomatik geçiş (1.2 saniye bekleme süresi)
    setTimeout(() => {
      handleNext(currentWrongArr);
    }, 1200);
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
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-8 ring-1 ring-purple-500/30">
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
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center text-2xl sm:text-3xl ring-1 ring-red-500/30">
                    <img src="assets/tr.svg" alt="Turkish" className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl" />
                  </div>
                  <ArrowRight className="text-zinc-600 group-active:text-purple-400 transition-colors" size={20} />
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center text-2xl sm:text-3xl ring-1 ring-blue-500/30">
                    <img src="assets/us.svg" alt="English" className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Türkçe → İngilizce</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 truncate">Türkçe kelime, İngilizce karşılık</p>
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
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center text-2xl sm:text-3xl ring-1 ring-blue-500/30">
                    <img src="assets/us.svg" alt="English" className="w-full h-full object-cover rounded-xl" />
                  </div>
                  <ArrowRight className="text-zinc-600 group-active:text-purple-400 transition-colors" size={20} />
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center text-2xl sm:text-3xl ring-1 ring-red-500/30">
                    <img src="assets/tr.svg" alt="Turkish" className="w-full h-full object-cover rounded-xl" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-white">İngilizce → Türkçe</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 truncate">İngilizce kelime, Türkçe karşılık</p>
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
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-purple-400 mb-6 mx-auto" />
            <div className="absolute inset-0 h-16 w-16 bg-purple-500/20 rounded-full blur-xl mx-auto" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Quiz Hazırlanıyor</h2>
          <p className="text-zinc-400">Yapay zeka çeldirici şıkları üretiyor...</p>
          <div className="mt-4 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 inline-flex items-center gap-2 text-sm">
            {quizDirection === 'tr-to-en' ? (
              <>🇹🇷 <ArrowRight size={14} className="text-zinc-500" /> 🇬🇧</>
            ) : (
              <>🇬🇧 <ArrowRight size={14} className="text-zinc-500" /> 🇹🇷</>
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
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 ${isGoodScore
            ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 text-yellow-500 ring-1 ring-yellow-500/30'
            : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-purple-400 ring-1 ring-purple-500/30'
            }`}>
            <Trophy size={48} />
          </div>

          <h2 className="text-3xl font-bold mb-2">{isGoodScore ? 'Tebrikler!' : 'Quiz Bitti!'}</h2>
          <p className="text-zinc-400 mb-8">
            {isGoodScore ? 'Harika bir performans gösterdin!' : 'Pratik yapmaya devam et!'}
          </p>

          {/* Score Display */}
          <div className="relative mb-10">
            <div className="w-40 h-40 rounded-full border-4 border-zinc-800 flex items-center justify-center relative">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(${isGoodScore ? '#22c55e' : '#a855f7'} ${percentage}%, transparent 0)`,
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
              <div className="text-2xl font-bold text-green-500 mb-1">{score}</div>
              <div className="text-xs text-zinc-500">Doğru</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-red-500 mb-1">{wrongAnswers.length}</div>
              <div className="text-xs text-zinc-500">Yanlış</div>
            </div>
          </div>

          {/* Wrong Answers Summary (Mobile) */}
          {wrongAnswers.length > 0 && (
            <button
              onClick={() => setShowWrongPanel(true)}
              className="flex items-center gap-2 text-sm text-zinc-400 mb-8 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 haptic-feedback"
            >
              <AlertCircle size={16} />
              Hatalı cevapları gör ({wrongAnswers.length})
            </button>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="px-5 pb-6 space-y-3">
          <button
            onClick={onExit}
            className="w-full bg-white text-zinc-950 font-semibold py-4 rounded-xl transition-all active:scale-[0.98] haptic-feedback text-base"
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
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-sm">
              {quizDirection === 'tr-to-en' ? '🇹🇷→🇬🇧' : '🇬🇧→🇹🇷'}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">{currentIndex + 1}</span>
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-500">{questions.length}</span>
            </div>
          </div>

          {/* Score pill */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <Check size={14} className="text-green-500" />
            <span className="text-green-500 font-semibold text-sm">{score}</span>
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
                  btnClass = "bg-green-500/10 border-green-500/50 text-green-400 ring-2 ring-green-500/30";
                  iconComponent = <Check className="absolute right-4 w-5 h-5 text-green-500" />;
                } else if (option === selectedOption) {
                  btnClass = "bg-red-500/10 border-red-500/50 text-red-400 ring-2 ring-red-500/30 animate-shake";
                  iconComponent = <X className="absolute right-4 w-5 h-5 text-red-500" />;
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
                  <span className="text-center w-full px-8">{option}</span>
                  {iconComponent}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Wrong Answers Indicator */}
      {wrongAnswers.length > 0 && (
        <button
          onClick={() => setShowWrongPanel(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10 haptic-feedback safe-area-inset-bottom z-40"
        >
          <div className="relative">
            <AlertCircle size={24} className="text-red-400" />
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {wrongAnswers.length}
            </div>
          </div>
        </button>
      )}

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