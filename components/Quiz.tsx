import React, { useState, useEffect } from 'react';
import { WordGroup, QuizQuestion, WrongAnswer, QuizDirection } from '../types';
import { ArrowLeft, Check, X, Loader2, Trophy, AlertCircle, Languages, ArrowRight } from 'lucide-react';
import { prepareQuizData } from '../services/geminiService';

interface QuizProps {
  group: WordGroup;
  onExit: () => void;
}

const Quiz: React.FC<QuizProps> = ({ group, onExit }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingState, setLoadingState] = useState<'direction-select' | 'generating' | 'ready'>('direction-select');
  const [quizDirection, setQuizDirection] = useState<QuizDirection | null>(null);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

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

    if (option === currentQuestion.correctOption) {
      setIsCorrect(true);
      setScore(s => s + 1);
    } else {
      setIsCorrect(false);
      setWrongAnswers(prev => [
        {
          word: currentQuestion.targetWord,
          userAnswer: option,
          correctAnswer: currentQuestion.correctOption
        },
        ...prev
      ]);
    }

    // Her durumda otomatik geçiş (1.2 saniye bekleme süresi)
    // Yanlış cevapta da kullanıcının doğruyu görmesi için süre tanıyoruz
    setTimeout(() => {
      handleNext();
    }, 1200);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsCorrect(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      setFinished(true);
    }
  };

  // Direction selection screen
  if (loadingState === 'direction-select') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-lg w-full">
          <div className="text-center mb-10">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-purple-400 rounded-full flex items-center justify-center mb-6 ring-1 ring-purple-500/30">
              <Languages size={32} />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight">Quiz Yönünü Seçin</h2>
            <p className="text-zinc-400">Hangi çeviri yönünde pratik yapmak istiyorsunuz?</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Türkçe -> İngilizce */}
            <button
              onClick={() => startQuiz('tr-to-en')}
              className="group relative p-6 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-800/80 transition-all duration-300 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center text-2xl ring-1 ring-red-500/30">
                    🇹🇷
                  </div>
                  <ArrowRight className="text-zinc-500 group-hover:text-purple-400 transition-colors" size={24} />
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center text-2xl ring-1 ring-blue-500/30">
                    🇬🇧
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">Türkçe → İngilizce</h3>
                  <p className="text-sm text-zinc-500">Türkçe kelime görün, İngilizce karşılığını seçin</p>
                </div>
              </div>
            </button>

            {/* İngilizce -> Türkçe */}
            <button
              onClick={() => startQuiz('en-to-tr')}
              className="group relative p-6 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-800/80 transition-all duration-300 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center text-2xl ring-1 ring-blue-500/30">
                    🇬🇧
                  </div>
                  <ArrowRight className="text-zinc-500 group-hover:text-purple-400 transition-colors" size={24} />
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center text-2xl ring-1 ring-red-500/30">
                    🇹🇷
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">İngilizce → Türkçe</h3>
                  <p className="text-sm text-zinc-500">İngilizce kelime görün, Türkçe karşılığını seçin</p>
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={onExit}
            className="mt-8 w-full text-zinc-500 hover:text-zinc-300 font-medium py-3 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // Loading screen
  if (loadingState === 'generating') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 text-zinc-100">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400 mb-4" />
        <h2 className="text-2xl font-bold tracking-tight">Quiz Hazırlanıyor</h2>
        <p className="text-zinc-400 mt-2">Yapay zeka çeldirici şıkları üretiyor...</p>
        <p className="text-zinc-500 text-sm mt-1">
          {quizDirection === 'tr-to-en' ? 'Türkçe → İngilizce' : 'İngilizce → Türkçe'}
        </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-100 animate-in fade-in duration-500">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mb-6">
            <Trophy size={32} />
          </div>
          <h2 className="text-3xl font-bold mb-2">Tebrikler!</h2>
          <p className="text-zinc-400 mb-8">Quiz tamamlandı.</p>

          <div className="flex justify-center items-center gap-2 text-5xl font-bold mb-8">
            <span className="text-white">{score}</span>
            <span className="text-zinc-600 text-2xl">/ {questions.length}</span>
          </div>

          <button
            onClick={onExit}
            className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium py-3 rounded-lg transition-colors"
          >
            Ana Ekrana Dön
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 md:flex-row overflow-hidden">
      {/* Main Quiz Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 bg-zinc-950 border-b border-zinc-800">
          <button onClick={onExit} className="flex items-center gap-2 text-zinc-400 hover:text-white font-medium transition-colors">
            <ArrowLeft size={20} /> <span className="hidden sm:inline">Çıkış</span>
          </button>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-zinc-400">Soru</span>
              <span className="text-white">{currentIndex + 1} / {questions.length}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-900 h-1">
          <div className="bg-white h-1 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="mb-12 text-center">
              <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-zinc-700/10 mb-6">
                {quizDirection === 'tr-to-en' ? 'Türkçe → İngilizce' : 'İngilizce → Türkçe'}
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                {quizDirection === 'tr-to-en' ? currentQuestion.targetWord.tr : currentQuestion.targetWord.en}
              </h2>
              <p className="text-zinc-500">
                {quizDirection === 'tr-to-en' ? 'Doğru İngilizce karşılığı seçin' : 'Doğru Türkçe karşılığı seçin'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, idx) => {
                let btnClass = "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700";

                if (selectedOption) {
                  if (option === currentQuestion.correctOption) {
                    btnClass = "bg-green-900/30 border-green-800 text-green-400 ring-1 ring-green-500/50"; // Correct
                  } else if (option === selectedOption) {
                    btnClass = "bg-red-900/30 border-red-800 text-red-400 ring-1 ring-red-500/50"; // Wrong
                  } else {
                    btnClass = "bg-zinc-900 border-zinc-800 text-zinc-600 opacity-40"; // Dimmed
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(option)}
                    disabled={selectedOption !== null}
                    className={`relative p-5 rounded-lg text-lg font-medium transition-all min-h-[72px] flex items-center justify-center ${btnClass}`}
                  >
                    {option}
                    {selectedOption && option === currentQuestion.correctOption && (
                      <Check className="absolute right-4 w-5 h-5 text-green-500" />
                    )}
                    {selectedOption && option === selectedOption && option !== currentQuestion.correctOption && (
                      <X className="absolute right-4 w-5 h-5 text-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
            {/* Manual next button removed */}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Wrong Answers (Desktop Only) */}
      <div className="hidden md:flex w-80 bg-zinc-900 border-l border-zinc-800 flex-col z-10">
        <div className="p-4 border-b border-zinc-800 font-semibold text-zinc-200 flex items-center gap-2 text-sm">
          <AlertCircle size={16} />
          Hatalı Cevaplar
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {wrongAnswers.length === 0 ? (
            <div className="text-center text-zinc-600 mt-10 text-sm">
              <p>Hata yok, harika!</p>
            </div>
          ) : (
            wrongAnswers.map((wa, idx) => (
              <div key={idx} className="bg-zinc-950/50 p-3 rounded border border-red-900/30">
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