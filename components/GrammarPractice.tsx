import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, X, Loader2, AlertCircle, RotateCcw, Volume2, Keyboard, ListChecks } from 'lucide-react';
import { GrammarAnswerMode, GrammarQuestion } from '../types';
import { generateGrammarExercise, isGrammarAnswerCorrect } from '../services/geminiService';
import { speakEnglish } from '../services/ttsService';

interface GrammarPracticeProps {
  onExit: () => void;
  onRecordStudyTime?: (minutes: number) => void;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const TOPICS = [
  'Simple Present',
  'Present Continuous',
  'Simple Past',
  'Past Continuous',
  'Present Perfect',
  'Present Perfect Continuous',
  'Past Perfect',
  'Future (will)',
  'Future (be going to)',
  'Modal Verbs',
  'Passive Voice',
  'Conditionals',
];

const QUESTION_COUNTS = [10, 20];

type Phase = 'setup' | 'generating' | 'playing' | 'finished';

const chipClass = (active: boolean) =>
  `min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition-colors active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
    active
      ? 'bg-blue-600 border-blue-600 text-white'
      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500'
  }`;

const primaryButtonClass =
  'w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all active:scale-98 text-xs flex items-center justify-center gap-2';

const GrammarPractice: React.FC<GrammarPracticeProps> = ({ onExit, onRecordStudyTime }) => {
  const [phase, setPhase] = useState<Phase>('setup');
  const [level, setLevel] = useState('A1');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [count, setCount] = useState(20);
  const [answerMode, setAnswerMode] = useState<GrammarAnswerMode>('choice');
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [onlyWrong, setOnlyWrong] = useState(false);

  const startTimeRef = useRef(Date.now());
  // Çıkıştan sonra veya yeni istekten sonra gelen eski yanıtları yok saymak için
  const requestRef = useRef(0);

  useEffect(() => () => { requestRef.current++; }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  const resetRound = (nextQuestions: GrammarQuestion[]) => {
    setQuestions(nextQuestions);
    setAnswers({});
    setCurrentIndex(0);
    setOnlyWrong(false);
    startTimeRef.current = Date.now();
    setPhase('playing');
  };

  const generate = async () => {
    const requestId = ++requestRef.current;
    setError(null);
    setPhase('generating');
    try {
      const generated = await generateGrammarExercise(topic, level, count);
      if (requestId !== requestRef.current) return;
      resetRound(generated);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      console.error('Failed to generate grammar exercise', err);
      setError(
        (err as { status?: number })?.status === 429
          ? 'Yapay zeka kullanım kotası doldu. Biraz sonra veya yarın tekrar deneyin.'
          : 'Cümleler oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.'
      );
      setPhase('setup');
    }
  };

  const cancelGeneration = () => {
    requestRef.current++;
    setPhase('setup');
  };

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const finish = () => {
    setPhase('finished');
    if (onRecordStudyTime) {
      onRecordStudyTime(Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000)));
    }
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      finish();
    }
  };

  const handleExitRound = () => {
    if (Object.keys(answers).length > 0 && !window.confirm('Alıştırmadan çıkılsın mı? Cevaplarınız silinecek.')) return;
    setPhase('setup');
  };

  // Seçmeli modda klavye kısayolları: 1-4 şık seçer, Enter ilerler
  useEffect(() => {
    if (phase !== 'playing' || answerMode !== 'choice') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const question = questions[currentIndex];
      if (!question || e.ctrlKey || e.metaKey || e.altKey) return;

      const option = question.options[Number(e.key) - 1];
      if (option) {
        e.preventDefault();
        setAnswer(question.id, option);
      } else if (e.key === 'Enter' && answers[question.id] && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, answerMode, questions, currentIndex, answers]);

  const renderHeader = (title: string, onBack: () => void, backLabel: string) => (
    <div className="flex items-center px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <button
        onClick={onBack}
        className="flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        title={backLabel}
        aria-label={backLabel}
      >
        <ArrowLeft size={18} />
      </button>
      <span className="font-bold text-sm text-slate-900 dark:text-white mx-auto pr-11">{title}</span>
    </div>
  );

  const pageClass =
    'min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 safe-area-inset-top safe-area-inset-bottom';

  if (phase === 'setup') {
    return (
      <div className={pageClass}>
        {renderHeader('Gramer Pratiği', onExit, "Dashboard'a dön")}
        <div className="flex-1 px-4 sm:px-6 max-w-lg mx-auto w-full py-6 pb-mobile-nav space-y-6">
          {error && (
            <div role="alert" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <fieldset>
            <legend className="text-sm font-bold mb-2">Seviye</legend>
            <div className="grid grid-cols-6 gap-2">
              {LEVELS.map((item) => (
                <button key={item} type="button" aria-pressed={level === item} onClick={() => setLevel(item)} className={chipClass(level === item)}>
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-bold mb-2">Konu</legend>
            <div className="grid grid-cols-2 gap-2">
              {TOPICS.map((item) => (
                <button key={item} type="button" aria-pressed={topic === item} onClick={() => setTopic(item)} className={chipClass(topic === item)}>
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-bold mb-2">Cümle sayısı</legend>
            <div className="grid grid-cols-2 gap-2">
              {QUESTION_COUNTS.map((item) => (
                <button key={item} type="button" aria-pressed={count === item} onClick={() => setCount(item)} className={chipClass(count === item)}>
                  {item} cümle
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-bold mb-2">Cevaplama şekli</legend>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" aria-pressed={answerMode === 'choice'} onClick={() => setAnswerMode('choice')} className={`${chipClass(answerMode === 'choice')} flex items-center justify-center gap-2`}>
                <ListChecks size={16} />
                <span>Şıklardan seç</span>
              </button>
              <button type="button" aria-pressed={answerMode === 'type'} onClick={() => setAnswerMode('type')} className={`${chipClass(answerMode === 'type')} flex items-center justify-center gap-2`}>
                <Keyboard size={16} />
                <span>Kendim yazacağım</span>
              </button>
            </div>
          </fieldset>

          <button type="button" onClick={generate} className={primaryButtonClass}>
            <span>Alıştırmayı Oluştur</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-5">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1.5">Alıştırma Hazırlanıyor</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
          Yapay zeka {level} seviyesinde {count} adet {topic} cümlesi üretiyor...
        </p>
        <button type="button" onClick={cancelGeneration} className="mt-6 min-h-[44px] px-5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white">
          Vazgeç
        </button>
      </div>
    );
  }

  if (phase === 'finished') {
    const results = questions.map((question, index) => {
      const userAnswer = (answers[question.id] || '').trim();
      return { question, index, userAnswer, correct: isGrammarAnswerCorrect(question, userAnswer) };
    });
    const score = results.filter((r) => r.correct).length;
    const wrong = results.filter((r) => !r.correct);
    const visibleResults = onlyWrong ? wrong : results;

    return (
      <div className={pageClass}>
        {renderHeader('Sonuçlar', onExit, "Dashboard'a dön")}
        <div className="flex-1 px-4 sm:px-6 max-w-lg mx-auto w-full py-6 pb-mobile-nav space-y-4">
          <div className="text-center">
            <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">%{Math.round((score / questions.length) * 100)}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{topic} · {level}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{score}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Doğru</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl">
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">{wrong.length}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Yanlış / Boş</div>
            </div>
          </div>

          {wrong.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" aria-pressed={!onlyWrong} onClick={() => setOnlyWrong(false)} className={chipClass(!onlyWrong)}>
                Tümü ({results.length})
              </button>
              <button type="button" aria-pressed={onlyWrong} onClick={() => setOnlyWrong(true)} className={chipClass(onlyWrong)}>
                Yanlışlar ({wrong.length})
              </button>
            </div>
          )}

          <ol className="space-y-3">
            {visibleResults.map(({ question, index, userAnswer, correct }) => {
              const [before, after] = question.sentence.split('___');
              return (
                <li
                  key={question.id}
                  className={`p-4 rounded-2xl border bg-white dark:bg-slate-900 ${
                    correct ? 'border-emerald-300 dark:border-emerald-800' : 'border-rose-300 dark:border-rose-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {correct ? <Check size={14} /> : <X size={14} />}
                      {index + 1}. {correct ? 'Doğru' : userAnswer ? 'Yanlış' : 'Boş'}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakEnglish(`${before}${question.answer}${after}`)}
                      className="w-11 h-11 -my-2 -mr-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-label={`${index + 1}. cümleyi dinle`}
                    >
                      <Volume2 size={18} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {before}
                    <span className="text-emerald-600 dark:text-emerald-400 underline underline-offset-4">{question.answer}</span>
                    {after}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{question.tr}</p>
                  {!correct && (
                    <p className="text-xs mt-2">
                      <span className="text-slate-500 dark:text-slate-400">Cevabınız: </span>
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">{userAnswer || '—'}</span>
                    </p>
                  )}
                  {question.explanation && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {question.explanation}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="space-y-2.5 pt-2">
            <button type="button" onClick={generate} className={primaryButtonClass}>
              <span>Yeni Cümleler Üret</span>
              <ArrowRight size={16} />
            </button>
            {wrong.length > 0 && (
              <button type="button" onClick={() => resetRound(wrong.map((r) => r.question))} className={`${chipClass(false)} w-full flex items-center justify-center gap-2`}>
                <RotateCcw size={16} />
                <span>Sadece Yanlışları Tekrar Çöz ({wrong.length})</span>
              </button>
            )}
            <button type="button" onClick={() => setPhase('setup')} className={`${chipClass(false)} w-full`}>
              Seviye veya Konu Değiştir
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Aktif soru
  const question = questions[currentIndex];
  const [before, after] = question.sentence.split('___');
  const currentAnswer = answers[question.id] || '';
  const isLast = currentIndex === questions.length - 1;
  const answeredCount = questions.filter((q) => (answers[q.id] || '').trim()).length;

  return (
    <div className={pageClass}>
      {renderHeader(`${topic} · ${currentIndex + 1} / ${questions.length}`, handleExitRound, 'Alıştırmadan çık')}
      <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full">
        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          goNext();
        }}
        className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-6 max-w-lg mx-auto w-full space-y-6"
      >
        <div className="text-center">
          <p className="text-xl sm:text-2xl font-bold leading-relaxed text-slate-900 dark:text-white">
            {before}
            <span className={`inline-block min-w-[5rem] px-2 border-b-2 ${currentAnswer ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-slate-400'}`}>
              {currentAnswer || ' '}
            </span>
            {after}
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">({question.baseVerb})</p>
        </div>

        {answerMode === 'choice' ? (
          <div key={question.id} className="space-y-3">
            {question.options.map((option, idx) => (
              <button
                key={option}
                type="button"
                aria-pressed={currentAnswer === option}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setAnswer(question.id, option);
                }}
                className={`relative w-full min-h-[52px] px-10 py-3 rounded-2xl border-2 text-sm sm:text-base font-semibold transition-colors active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  currentAnswer === option
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                }`}
              >
                <span className="hidden sm:inline-block absolute left-4 text-xs font-mono text-slate-400">{idx + 1}</span>
                {option}
              </button>
            ))}
          </div>
        ) : (
          <input
            key={question.id}
            type="text"
            autoFocus
            value={currentAnswer}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            placeholder="Boşluğa gelecek fiili yazın"
            aria-label="Cevabınız"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint={isLast ? 'done' : 'next'}
            className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-base font-semibold text-center focus:outline-none focus:border-blue-600"
          />
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => i - 1)}
            disabled={currentIndex === 0}
            className={`${chipClass(false)} px-4 disabled:opacity-40`}
            aria-label="Önceki soru"
          >
            <ArrowLeft size={16} />
          </button>
          <button type="submit" className={primaryButtonClass}>
            <span>{isLast ? 'Bitir ve Sonuçları Gör' : currentAnswer.trim() ? 'Sonraki' : 'Boş Geç'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
        <p className="text-center text-xs text-slate-500">
          {answeredCount} / {questions.length} cevaplandı · Doğru ve yanlışlar alıştırma sonunda gösterilir
        </p>
      </form>
    </div>
  );
};

export default GrammarPractice;
