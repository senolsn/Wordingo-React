import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Swords,
  Users,
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  Volume2,
  RotateCcw,
  Copy,
  Check,
  Share2,
  Flame,
  Zap,
  Clock,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Target,
  ShieldAlert,
  Loader2,
  Play,
  LogOut,
  RefreshCw,
  BookOpen,
  Plus,
  AlertCircle,
  Compass,
  Plane,
  MessageCircle,
  Cpu
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { CuratedWord, DuelCategory, DuelQuestion, DuelPlayer, WordGroup } from '../types';
import { OXFORD_WORDS } from '../data/oxfordWords';
import { YDS_WORDS } from '../data/ydsWords';
import { BUSINESS_WORDS } from '../data/businessWords';
import { PHRASAL_VERBS } from '../data/phrasalVerbs';
import { TRAVEL_WORDS } from '../data/travelWords';
import { DAILY_WORDS } from '../data/dailyWords';
import { TECH_WORDS } from '../data/techWords';
import { speakEnglish } from '../services/ttsService';

// Map phrasal verbs to CuratedWord structure
const PHRASAL_WORDS: CuratedWord[] = PHRASAL_VERBS.map((pv) => ({
  id: pv.id,
  word: pv.verb,
  tr: pv.tr,
  type: 'phrasal verb',
  example: pv.example,
  exampleTr: pv.exampleTr
}));

interface DuelPracticeProps {
  userGroups?: WordGroup[];
  defaultPlayerName?: string;
  onAddMistakesToPool?: (missedWords: { en: string; tr: string; id?: string }[]) => Promise<number>;
  onExit: () => void;
}

// Fisher-Yates shuffle
const shuffleArray = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Generate random room code like WD-742
const generateRoomCode = (): string => {
  const num = Math.floor(100 + Math.random() * 900);
  return `WD-${num}`;
};

// Persistent or generated player ID
const getPlayerId = (): string => {
  try {
    let id = sessionStorage.getItem('wordingo-duel-player-id');
    if (!id) {
      id = 'p_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('wordingo-duel-player-id', id);
    }
    return id;
  } catch {
    return 'p_' + Math.random().toString(36).substring(2, 9);
  }
};

const getSavedPlayerName = (fallbackName?: string): string => {
  if (fallbackName && fallbackName.trim()) return fallbackName.trim();
  try {
    const saved = localStorage.getItem('wordingo-duel-player-name');
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return `Oyuncu ${Math.floor(10 + Math.random() * 90)}`;
};

interface QuestionResult {
  question: DuelQuestion;
  selectedOption: string;
  isCorrect: boolean;
}

export const DuelPractice: React.FC<DuelPracticeProps> = ({
  userGroups = [],
  defaultPlayerName,
  onAddMistakesToPool,
  onExit
}) => {
  // Player state
  const myPlayerId = useRef<string>(getPlayerId()).current;
  const [playerName, setPlayerName] = useState<string>(() => getSavedPlayerName(defaultPlayerName));

  // Sync default player name when provided or changed
  useEffect(() => {
    if (defaultPlayerName && defaultPlayerName.trim()) {
      setPlayerName(defaultPlayerName.trim());
    }
  }, [defaultPlayerName]);

  // Filter valid user custom groups (must have at least 4 words for a 4-choice quiz)
  const validCustomGroups = userGroups.filter((g) => (g.words?.length || 0) >= 4);

  // Lobby & Setup state
  const [lobbyTab, setLobbyTab] = useState<'create' | 'join'>('create');
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [selectedCategory, setSelectedCategory] = useState<DuelCategory>('oxford');
  const [selectedCustomGroupId, setSelectedCustomGroupId] = useState<string>(
    validCustomGroups[0]?.id || ''
  );
  const [customGroupName, setCustomGroupName] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [activeRoomCode, setActiveRoomCode] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Game flow state: 'select' | 'waiting' | 'countdown' | 'playing' | 'waiting_opponent' | 'finished'
  const [stage, setStage] = useState<'select' | 'waiting' | 'countdown' | 'playing' | 'waiting_opponent' | 'finished'>('select');
  const [countdownNum, setCountdownNum] = useState<number>(3);

  // Opponent state
  const [opponent, setOpponent] = useState<DuelPlayer | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [opponentQuit, setOpponentQuit] = useState(false);

  // In-Game Safe Exit Confirmation Dialog
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Questions and gameplay state
  const [questions, setQuestions] = useState<DuelQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [myScore, setMyScore] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnsweringLocked, setIsAnsweringLocked] = useState(false);
  const [userHistory, setUserHistory] = useState<QuestionResult[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [myElapsedTimeMs, setMyElapsedTimeMs] = useState<number>(0);
  const [opponentFinishedTimeMs, setOpponentFinishedTimeMs] = useState<number>(0);

  // Mistakes Pool Saving State (Pedagogical Integration)
  const [isSavingMistakes, setIsSavingMistakes] = useState(false);
  const [savedMistakesSuccess, setSavedMistakesSuccess] = useState(false);

  // Rematch state
  const [rematchRequestedByMe, setRematchRequestedByMe] = useState(false);
  const [rematchOfferFromOpponent, setRematchOfferFromOpponent] = useState(false);

  // Channel reference
  const channelRef = useRef<any>(null);

  // Get words for category (including custom user decks)
  const getCategoryWords = useCallback(
    (cat: DuelCategory): { words: CuratedWord[]; name: string } => {
      if (cat === 'custom') {
        const group =
          userGroups.find((g) => g.id === selectedCustomGroupId) || validCustomGroups[0];
        if (group && group.words && group.words.length > 0) {
          return {
            words: group.words.map((w) => ({
              id: w.id,
              word: w.en,
              tr: w.tr,
              example: ''
            })),
            name: group.name
          };
        }
        return { words: OXFORD_WORDS, name: 'Oxford 3000' };
      }

      switch (cat) {
        case 'oxford':
          return { words: OXFORD_WORDS, name: 'Oxford 3000' };
        case 'yds':
          return { words: YDS_WORDS, name: 'YDS Sık Çıkanlar' };
        case 'business':
          return { words: BUSINESS_WORDS, name: 'İş İngilizcesi' };
        case 'phrasal':
          return { words: PHRASAL_WORDS, name: 'Phrasal Verbs' };
        case 'daily':
          return { words: DAILY_WORDS, name: 'Günlük Kalıplar' };
        case 'travel':
          return { words: TRAVEL_WORDS, name: 'Seyahat İngilizcesi' };
        case 'tech':
          return { words: TECH_WORDS, name: 'Yazılım & Teknoloji' };
        default:
          return { words: OXFORD_WORDS, name: 'Oxford 3000' };
      }
    },
    [userGroups, selectedCustomGroupId, validCustomGroups]
  );

  // Generate question deck with 4 choices
  const buildDuelQuestions = useCallback(
    (cat: DuelCategory, count: number): { questions: DuelQuestion[]; groupName: string } => {
      const { words: source, name: groupName } = getCategoryWords(cat);
      const targetWords = shuffleArray([...source]).slice(0, Math.min(count, source.length));

      // Backup pool for distractors if source has few items
      const backupPool = OXFORD_WORDS;

      const questions = targetWords.map((item, idx) => {
        // Find distinct distractors from source
        const pool = source.filter((w) => w.id !== item.id && w.tr !== item.tr);
        let distractors = shuffleArray(pool)
          .slice(0, 3)
          .map((w) => w.tr);

        // If source has fewer than 3 distractors, pad from Oxford words
        if (distractors.length < 3) {
          const extraPool = backupPool.filter((w) => w.tr !== item.tr && !distractors.includes(w.tr));
          const extra = shuffleArray(extraPool)
            .slice(0, 3 - distractors.length)
            .map((w) => w.tr);
          distractors = [...distractors, ...extra];
        }

        while (distractors.length < 3) {
          distractors.push('Tanımsız Çeviri');
        }

        const options = shuffleArray([item.tr, ...distractors]);

        return {
          id: item.id || `dq-${idx}`,
          word: item.word,
          tr: item.tr,
          type: item.type,
          example: item.example,
          exampleTr: item.exampleTr,
          options,
          correctOption: item.tr
        };
      });

      return { questions, groupName };
    },
    [getCategoryWords]
  );

  // Clean up channel on unmount or return to select
  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
      } catch (e) {
        console.warn('Error unsubscribing channel:', e);
      }
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupChannel();
    };
  }, [cleanupChannel]);

  // Connect to Supabase Realtime channel
  const connectToRoom = (code: string, asHost: boolean) => {
    cleanupChannel();

    const formattedCode = code.trim().toUpperCase();
    setActiveRoomCode(formattedCode);
    setIsHost(asHost);
    setOpponent(null);
    setOpponentDisconnected(false);
    setOpponentQuit(false);
    setShowExitConfirm(false);
    setRematchRequestedByMe(false);
    setRematchOfferFromOpponent(false);
    setUserHistory([]);
    setMyScore(0);
    setCurrentIndex(0);
    setSavedMistakesSuccess(false);

    const channelName = `duel-room-${formattedCode}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: myPlayerId }
      }
    });

    // 1. PRESENCE TRACKING
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const players: DuelPlayer[] = [];

        Object.keys(presenceState).forEach((key) => {
          const stateList = presenceState[key] as any[];
          if (stateList && stateList.length > 0) {
            const p = stateList[0];
            if (p.id !== myPlayerId) {
              players.push({
                id: p.id,
                name: p.name,
                isHost: !!p.isHost,
                score: 0,
                currentQuestionIndex: 0,
                isFinished: false
              });
            }
          }
        });

        if (players.length > 0) {
          setOpponent((prev) => {
            if (!prev) {
              return players[0];
            }
            return {
              ...prev,
              name: players[0].name
            };
          });
          setOpponentDisconnected(false);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key !== myPlayerId) {
          setOpponentDisconnected(true);
          setStage((prev) => {
            if (prev === 'waiting_opponent') {
              setOpponentQuit(true);
              return 'finished';
            }
            return prev;
          });
        }
      });

    // 2. BROADCAST MESSAGES
    channel
      // Guest joined notification
      .on('broadcast', { event: 'GUEST_JOINED' }, ({ payload }) => {
        if (payload && payload.id !== myPlayerId) {
          setOpponent({
            id: payload.id,
            name: payload.name || 'Rakip',
            isHost: false,
            score: 0,
            currentQuestionIndex: 0,
            isFinished: false
          });
          setOpponentDisconnected(false);

          // If I am host, reply with room details so guest knows category & count
          if (asHost) {
            channel.send({
              type: 'broadcast',
              event: 'HOST_INFO',
              payload: {
                id: myPlayerId,
                name: playerName,
                category: selectedCategory,
                customGroupName,
                questionCount
              }
            });
          }
        }
      })
      // Host info received by guest
      .on('broadcast', { event: 'HOST_INFO' }, ({ payload }) => {
        if (payload) {
          if (payload.category) setSelectedCategory(payload.category);
          if (payload.customGroupName) setCustomGroupName(payload.customGroupName);
          if (payload.questionCount) setQuestionCount(payload.questionCount);
          setOpponent({
            id: payload.id,
            name: payload.name || 'Oda Sahibi',
            isHost: true,
            score: 0,
            currentQuestionIndex: 0,
            isFinished: false
          });
        }
      })
      // Game start broadcast
      .on('broadcast', { event: 'START_GAME' }, ({ payload }) => {
        if (payload && payload.questions) {
          setQuestions(payload.questions);
          if (payload.category) setSelectedCategory(payload.category);
          if (payload.customGroupName) setCustomGroupName(payload.customGroupName);
          startCountdown();
        }
      })
      // Progress update broadcast
      .on('broadcast', { event: 'PROGRESS_UPDATE' }, ({ payload }) => {
        if (payload && payload.playerId !== myPlayerId) {
          setOpponent((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              score: payload.score,
              currentQuestionIndex: payload.currentQuestionIndex,
              isFinished: !!payload.isFinished,
              finishedTimeMs: payload.timeMs || prev.finishedTimeMs
            };
          });
          if (payload.timeMs) {
            setOpponentFinishedTimeMs(payload.timeMs);
          }
        }
      })
      // Player quit in-game broadcast
      .on('broadcast', { event: 'PLAYER_QUIT' }, () => {
        setOpponentQuit(true);
        setStage((prev) => {
          if (prev === 'playing' || prev === 'waiting_opponent' || prev === 'countdown') {
            return 'finished';
          }
          return prev;
        });
      })
      // Rematch request
      .on('broadcast', { event: 'REMATCH_OFFER' }, () => {
        setRematchOfferFromOpponent(true);
      })
      // Rematch accepted
      .on('broadcast', { event: 'REMATCH_ACCEPTED' }, ({ payload }) => {
        if (payload && payload.questions) {
          setQuestions(payload.questions);
          setRematchOfferFromOpponent(false);
          setRematchRequestedByMe(false);
          startCountdown();
        }
      });

    // Subscribe
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({
          id: myPlayerId,
          name: playerName,
          isHost: asHost,
          joinedAt: Date.now()
        });

        // If guest, broadcast that we joined
        if (!asHost) {
          channel.send({
            type: 'broadcast',
            event: 'GUEST_JOINED',
            payload: {
              id: myPlayerId,
              name: playerName
            }
          });
        }
      }
    });

    channelRef.current = channel;
    setStage('waiting');
  };

  // Host starts the game
  const handleHostStartGame = () => {
    if (!channelRef.current) return;
    const { questions: generatedQuestions, groupName } = buildDuelQuestions(
      selectedCategory,
      questionCount
    );
    setQuestions(generatedQuestions);
    setCustomGroupName(groupName);

    channelRef.current.send({
      type: 'broadcast',
      event: 'START_GAME',
      payload: {
        category: selectedCategory,
        customGroupName: groupName,
        questionCount,
        questions: generatedQuestions,
        hostPlayerId: myPlayerId
      }
    });

    startCountdown();
  };

  // Synchronized 3-2-1 countdown
  const startCountdown = () => {
    setStage('countdown');
    setCountdownNum(3);
    setMyScore(0);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnsweringLocked(false);
    setUserHistory([]);
    setOpponentQuit(false);
    setShowExitConfirm(false);
    setSavedMistakesSuccess(false);
    setOpponent((prev) => (prev ? { ...prev, score: 0, currentQuestionIndex: 0, isFinished: false } : null));

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
      } else {
        clearInterval(interval);
        setStage('playing');
        setGameStartTime(Date.now());
      }
    }, 1000);
  };

  // Handle answering an option
  const handleSelectOption = useCallback(
    (option: string) => {
      if (isAnsweringLocked || stage !== 'playing' || !questions[currentIndex]) return;

      setIsAnsweringLocked(true);
      setSelectedAnswer(option);

      const currQ = questions[currentIndex];
      const isCorrect = option === currQ.correctOption;
      const newScore = isCorrect ? myScore + 1 : myScore;
      if (isCorrect) {
        setMyScore(newScore);
      }

      const nextIndex = currentIndex + 1;
      const isFinished = nextIndex >= questions.length;
      const elapsed = Date.now() - gameStartTime;

      if (isFinished) {
        setMyElapsedTimeMs(elapsed);
      }

      // Save in user history
      setUserHistory((prev) => [
        ...prev,
        {
          question: currQ,
          selectedOption: option,
          isCorrect
        }
      ]);

      // Broadcast progress immediately
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'PROGRESS_UPDATE',
          payload: {
            playerId: myPlayerId,
            score: newScore,
            currentQuestionIndex: nextIndex,
            isFinished,
            timeMs: elapsed
          }
        });
      }

      // Wait 700ms to show green/red feedback, then advance
      setTimeout(() => {
        setSelectedAnswer(null);
        setIsAnsweringLocked(false);

        if (isFinished) {
          if (opponent?.isFinished || opponentQuit || opponentDisconnected) {
            setStage('finished');
          } else {
            setStage('waiting_opponent');
          }
        } else {
          setCurrentIndex(nextIndex);
        }
      }, 700);
    },
    [
      isAnsweringLocked,
      stage,
      questions,
      currentIndex,
      myScore,
      gameStartTime,
      myPlayerId,
      opponent?.isFinished,
      opponentQuit,
      opponentDisconnected
    ]
  );

  // DESKTOP KEYBOARD ACCELERATORS (1, 2, 3, 4 for options & Escape for exit)
  useEffect(() => {
    if (stage !== 'playing' || isAnsweringLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
        const optionIdx = parseInt(e.key, 10) - 1;
        const currentQ = questions[currentIndex];
        if (currentQ && currentQ.options[optionIdx]) {
          handleSelectOption(currentQ.options[optionIdx]);
        }
      } else if (e.key === 'Escape') {
        setShowExitConfirm(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, isAnsweringLocked, currentIndex, questions, handleSelectOption]);

  // Listen for global header duel exit request (from top right "Terk Et" button)
  useEffect(() => {
    const handleExitRequest = () => {
      if (stage === 'playing' || stage === 'waiting_opponent') {
        setShowExitConfirm(true);
      } else if (stage === 'waiting') {
        cleanupChannel();
        setStage('select');
      } else {
        onExit();
      }
    };

    window.addEventListener('wordingo-duel-exit-request', handleExitRequest);
    return () => {
      window.removeEventListener('wordingo-duel-exit-request', handleExitRequest);
    };
  }, [stage, cleanupChannel, onExit]);

  // Watch opponent finish or quit/disconnect while in 'waiting_opponent'
  useEffect(() => {
    if (stage === 'waiting_opponent') {
      if (opponent?.isFinished || opponentQuit || opponentDisconnected) {
        if (opponentQuit || opponentDisconnected) {
          setOpponentQuit(true);
        }
        setStage('finished');
      }
    }
  }, [stage, opponent?.isFinished, opponentQuit, opponentDisconnected]);

  // Request Rematch
  const handleRequestRematch = () => {
    if (!channelRef.current) return;
    setRematchRequestedByMe(true);
    channelRef.current.send({
      type: 'broadcast',
      event: 'REMATCH_OFFER',
      payload: { playerId: myPlayerId }
    });
  };

  // Accept Rematch
  const handleAcceptRematch = () => {
    if (!channelRef.current) return;
    const { questions: freshQuestions } = buildDuelQuestions(selectedCategory, questionCount);
    channelRef.current.send({
      type: 'broadcast',
      event: 'REMATCH_ACCEPTED',
      payload: {
        questions: freshQuestions,
        category: selectedCategory
      }
    });
    setQuestions(freshQuestions);
    setRematchOfferFromOpponent(false);
    setRematchRequestedByMe(false);
    startCountdown();
  };

  // Safe In-Game Exit (Surrender / Forfeit)
  const handleConfirmExitGame = () => {
    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'PLAYER_QUIT',
          payload: { playerId: myPlayerId }
        });
      } catch {}
    }
    cleanupChannel();
    onExit();
  };

  // Save Missed Words to Mistakes Pool (Pedagogical Integration)
  const handleSaveMistakesToPool = async () => {
    const missed = userHistory
      .filter((h) => !h.isCorrect)
      .map((h) => ({
        en: h.question.word,
        tr: h.question.tr,
        id: h.question.id
      }));

    if (!missed.length || !onAddMistakesToPool) return;

    setIsSavingMistakes(true);
    try {
      await onAddMistakesToPool(missed);
      setSavedMistakesSuccess(true);
    } catch (e) {
      console.error('Failed to save duel mistakes:', e);
    } finally {
      setIsSavingMistakes(false);
    }
  };

  // Copy code helper
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeRoomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  // Pronounce current word
  const handleSpeakCurrentWord = () => {
    if (questions[currentIndex]?.word) {
      speakEnglish(questions[currentIndex].word);
    }
  };

  // Category meta info
  const categoryMeta: Record<
    DuelCategory,
    { title: string; desc: string; badge: string; color: string; icon: any }
  > = {
    oxford: {
      title: 'Oxford 3000',
      desc: 'A1-B2 Çekirdek ve Günlük Temel Kelimeler',
      badge: 'Çekirdek',
      color: 'amber',
      icon: Target
    },
    yds: {
      title: 'YDS Sık Çıkanlar',
      desc: 'Akademik Sınav Kelimeleri ve Eş Anlamlar',
      badge: 'Akademik',
      color: 'sky',
      icon: GraduationCap
    },
    business: {
      title: 'İş İngilizcesi',
      desc: 'Toplantı, Kurumsal Terimler ve Yönetim',
      badge: 'Business',
      color: 'indigo',
      icon: Briefcase
    },
    phrasal: {
      title: 'Phrasal Verbs',
      desc: 'En Çok Kullanılan Deyimsel Fiiller',
      badge: 'Fiil Kalıpları',
      color: 'emerald',
      icon: Compass
    },
    daily: {
      title: 'Günlük Kalıplar',
      desc: 'Pratik Konuşma, Popüler İfadeler & Deyimler',
      badge: 'Deyimler',
      color: 'violet',
      icon: MessageCircle
    },
    travel: {
      title: 'Seyahat İngilizcesi',
      desc: 'Havalimanı, Otel, Ulaşım & Gezi',
      badge: 'Seyahat',
      color: 'teal',
      icon: Plane
    },
    tech: {
      title: 'Yazılım & Teknoloji',
      desc: 'Yazılım Geliştirme, Bulut & Bilişim',
      badge: 'Tech & IT',
      color: 'cyan',
      icon: Cpu
    },
    custom: {
      title: customGroupName || 'Özel Kelime Grubum',
      desc: 'Kendi eklediğiniz kelimelerle kişiselleştirilmiş kapışma',
      badge: 'Kendi Desten',
      color: 'emerald',
      icon: BookOpen
    }
  };

  // Determine Winner
  const currentOpponentScore = opponent?.score || 0;
  let duelResult: 'win' | 'lose' | 'tie' = 'tie';
  if (opponentQuit || (opponentDisconnected && !opponent?.isFinished)) {
    duelResult = 'win';
  } else if (myScore > currentOpponentScore) {
    duelResult = 'win';
  } else if (myScore < currentOpponentScore) {
    duelResult = 'lose';
  } else {
    if (myElapsedTimeMs > 0 && opponentFinishedTimeMs > 0) {
      if (myElapsedTimeMs < opponentFinishedTimeMs) duelResult = 'win';
      else if (myElapsedTimeMs > opponentFinishedTimeMs) duelResult = 'lose';
      else duelResult = 'tie';
    } else {
      duelResult = 'tie';
    }
  }

  const missedQuestions = userHistory.filter((h) => !h.isCorrect);

  // ==========================================
  // RENDER: LOBBY SELECTION & JOIN SCREEN
  // ==========================================
  if (stage === 'select') {
    return (
      <div className="max-w-xl mx-auto px-4 pt-2.5 pb-6 animate-fade-in">
        {/* Top Header & Title Bar (Unified on the same row) */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px]"
              title="Dashboard'a Dön"
            >
              <ArrowLeft size={16} />
              <span className="hidden xs:inline sm:inline">Dashboard</span>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/25">
                <Swords size={16} />
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                Canlı Düello
              </h1>
            </div>
          </div>

          {/* Player Name Display (Read-only, derived from user email) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="truncate max-w-[100px]">{playerName}</span>
          </div>
        </div>

        {/* Tab Switcher: Oda Oluştur / Odaya Katıl */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-3">
          <button
            onClick={() => {
              setLobbyTab('create');
              setCreateStep(1);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 min-h-[40px] ${
              lobbyTab === 'create'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Oda Oluştur</span>
          </button>
          <button
            onClick={() => {
              setLobbyTab('join');
              setCreateStep(1);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 min-h-[40px] ${
              lobbyTab === 'join'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Odaya Katıl</span>
          </button>
        </div>

        {/* TAB 1: ODA OLUŞTUR (STEPPER) */}
        {lobbyTab === 'create' && (
          <div className="space-y-3">
            {/* Stepper Progress Bar */}
            <div className="flex items-center justify-between px-1 mb-2">
              {/* Step 1 Pill */}
              <button
                type="button"
                onClick={() => setCreateStep(1)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-all py-1 ${
                  createStep === 1
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    createStep === 1
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {createStep > 1 ? <Check size={11} strokeWidth={3} /> : '1'}
                </span>
                <span>1. Kelime Grubu</span>
              </button>

              {/* Connecting Divider */}
              <div
                className={`flex-1 h-0.5 mx-2.5 rounded-full transition-all ${
                  createStep === 2 ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />

              {/* Step 2 Pill */}
              <div
                className={`flex items-center gap-1.5 text-xs font-bold transition-all py-1 ${
                  createStep === 2
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    createStep === 2
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  2
                </span>
                <span>2. Soru & Başlat</span>
              </div>
            </div>

            {/* ADIM 1: KELİME GRUBU SEÇİMİ */}
            {createStep === 1 && (
              <div className="space-y-2.5 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[310px] overflow-y-auto pr-1">
                  {/* 7 Statik Kategori */}
                  {(
                    [
                      'oxford',
                      'yds',
                      'business',
                      'phrasal',
                      'daily',
                      'travel',
                      'tech'
                    ] as DuelCategory[]
                  ).map((cat) => {
                    const meta = categoryMeta[cat];
                    const Icon = meta.icon;
                    const isSelected = selectedCategory === cat;
                    return (
                      <div
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 min-h-[48px] ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/15 shadow-sm ring-1 ring-blue-500/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <Icon size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {meta.title}
                              </h3>
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {meta.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {meta.desc}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check size={9} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}

                  {/* Kullanıcının Kendi Özel Kelime Grubu Seçeneği */}
                  {validCustomGroups.length > 0 && (
                    <div
                      onClick={() => setSelectedCategory('custom')}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all sm:col-span-2 ${
                        selectedCategory === 'custom'
                          ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/15 shadow-sm ring-1 ring-blue-500/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              selectedCategory === 'custom'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <BookOpen size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                Özel Kelime Gruplarım
                              </h3>
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40">
                                Kendi Desten
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              Kendi kelime destelerinle kapış
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selectedCategory === 'custom'
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {selectedCategory === 'custom' && <Check size={9} strokeWidth={3} />}
                        </div>
                      </div>

                      {/* Custom Group Dropdown Selector */}
                      {selectedCategory === 'custom' && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={selectedCustomGroupId}
                            onChange={(e) => {
                              setSelectedCustomGroupId(e.target.value);
                              const found = validCustomGroups.find((g) => g.id === e.target.value);
                              if (found) setCustomGroupName(found.name);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none min-h-[38px]"
                          >
                            {validCustomGroups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name} ({g.words.length} kelime) - {g.level || 'Mix'}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 1 Next Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCategory === 'custom') {
                      const grp = validCustomGroups.find((g) => g.id === selectedCustomGroupId) || validCustomGroups[0];
                      if (grp) setCustomGroupName(grp.name);
                    }
                    setCreateStep(2);
                  }}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[44px] mt-1"
                >
                  <span>Soru Sayısını Seç</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* ADIM 2: SORU SAYISI & ODAYI OLUŞTUR */}
            {createStep === 2 && (
              <div className="space-y-3 animate-fade-in">
                {/* Seçilen Deste Özeti Kartı */}
                <div className="p-2.5 sm:p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      {selectedCategory === 'custom' ? (
                        <BookOpen size={16} />
                      ) : (
                        (() => {
                          const IconComp = categoryMeta[selectedCategory].icon;
                          return <IconComp size={16} />;
                        })()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Seçilen Deste:
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          {selectedCategory === 'custom'
                            ? validCustomGroups.find((g) => g.id === selectedCustomGroupId)?.name || 'Özel Deste'
                            : categoryMeta[selectedCategory].badge}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {selectedCategory === 'custom'
                          ? validCustomGroups.find((g) => g.id === selectedCustomGroupId)?.name || 'Özel Destem'
                          : categoryMeta[selectedCategory].title}
                      </h4>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCreateStep(1)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 transition-colors shrink-0"
                  >
                    <span>Değiştir</span>
                  </button>
                </div>

                {/* Soru Sayısı Seçimi */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Soru Sayısı
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 15, 20].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setQuestionCount(cnt)}
                        className={`py-2.5 px-1.5 rounded-xl border text-xs font-bold transition-all min-h-[46px] flex flex-col items-center justify-center gap-0.5 ${
                          questionCount === cnt
                            ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/25'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-black">{cnt} Soru</span>
                        <span className="text-[9px] opacity-80 font-normal">
                          {cnt === 10 ? '~1.5 dk' : cnt === 15 ? '~2.5 dk' : '~3.5 dk'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Butonlar: Odayı Oluştur & Geri */}
                <div className="space-y-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const code = generateRoomCode();
                      if (selectedCategory === 'custom') {
                        const grp = validCustomGroups.find((g) => g.id === selectedCustomGroupId) || validCustomGroups[0];
                        if (grp) setCustomGroupName(grp.name);
                      }
                      connectToRoom(code, true);
                    }}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[46px]"
                  >
                    <Sparkles size={16} />
                    <span>Odayı Oluştur & Kodu Al</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateStep(1)}
                    className="w-full py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft size={13} />
                    <span>Kelime Grubunu Değiştir</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ODAYA KATIL */}
        {lobbyTab === 'join' && (
          <div className="space-y-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Oda Kodu
              </label>
              <input
                type="text"
                placeholder="Örn: WD-742"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-black tracking-widest text-center text-slate-900 dark:text-white uppercase placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 outline-none focus:border-blue-500 min-h-[44px]"
              />
              <p className="text-[11px] text-slate-400 text-center mt-1.5">
                Arkadaşının ekranındaki oda kodunu girerek bağlanabilirsin.
              </p>
            </div>

            <button
              disabled={!roomCodeInput.trim()}
              onClick={() => {
                if (roomCodeInput.trim()) {
                  connectToRoom(roomCodeInput.trim(), false);
                }
              }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[44px]"
            >
              <ArrowRight size={15} />
              <span>Odaya Bağlan</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: WAITING ROOM (LOBBY)
  // ==========================================
  if (stage === 'waiting') {
    const meta = categoryMeta[selectedCategory];
    const Icon = meta.icon;

    return (
      <div className="max-w-xl mx-auto px-4 pt-6 pb-mobile-nav animate-fade-in">
        {/* Header with Exit */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              cleanupChannel();
              setStage('select');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
          >
            <ArrowLeft size={16} />
            <span>Odadan Ayrıl</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200/50 dark:border-emerald-900/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Bağlantı Aktif</span>
          </div>
        </div>

        {/* Room Code Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-3xl p-6 text-center shadow-xl shadow-blue-600/20 mb-6">
          <span className="text-xs font-semibold tracking-wider uppercase opacity-80">
            Oda Kodu
          </span>
          <div className="text-4xl sm:text-5xl font-black tracking-widest my-2 select-all">
            {activeRoomCode}
          </div>
          <p className="text-xs text-white/80 max-w-xs mx-auto mb-4">
            Arkadaşına bu kodu ver veya aşağıdaki butona basarak kopyala.
          </p>

          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-sm transition-all active:scale-95 min-h-[44px]"
          >
            {copiedCode ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedCode ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
          </button>
        </div>

        {/* Selected Settings Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Icon size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedCategory === 'custom' ? customGroupName || 'Özel Desten' : meta.title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {meta.badge}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {questionCount} Soru • 4 Şıklı Canlı Kapışma
              </span>
            </div>
          </div>
        </div>

        {/* Players Card */}
        <div className="space-y-3 mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Oyuncular (2/2)
          </label>

          {/* Player 1 (You) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
                {playerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {playerName}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40">
                    Sen {isHost ? '(Kurucu)' : ''}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Hazır
                </span>
              </div>
            </div>
          </div>

          {/* Player 2 (Opponent) */}
          <div
            className={`rounded-2xl p-4 flex items-center justify-between border transition-all ${
              opponent
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-800'
            }`}
          >
            {opponent ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-amber-500/20">
                  {opponent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {opponent.name}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40">
                      Rakip
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Bağlandı
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full justify-center py-2 text-slate-400">
                <Loader2 size={18} className="animate-spin text-blue-500" />
                <span className="text-xs font-semibold">
                  Rakip bekleniyor... Arkadaşına kodu ilet.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {isHost ? (
          <button
            disabled={!opponent}
            onClick={handleHostStartGame}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Play size={18} className="fill-current" />
            <span>{opponent ? 'Düelloyu Başlat!' : 'Rakibin Katılması Bekleniyor...'}</span>
          </button>
        ) : (
          <div className="text-center p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Oda sahibinin ({opponent?.name || 'Kurucu'}) oyunu başlatması bekleniyor...
            </p>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: COUNTDOWN OVERLAY (Smooth Expo Spring Transition)
  // ==========================================
  if (stage === 'countdown') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-600 text-white text-5xl font-black shadow-2xl shadow-blue-500/30 animate-pulse scale-105 transition-all duration-300 mb-6">
          {countdownNum}
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Hazır Ol!
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Düello başlıyor. Doğru ve hızlı cevap veren kazanır!
          <span className="hidden sm:inline-block ml-1 opacity-75">(Klavye 1-4 ile cevaplayabilirsin)</span>
        </p>
      </div>
    );
  }

  // ==========================================
  // RENDER: WAITING OPPONENT TO FINISH
  // ==========================================
  if (stage === 'waiting_opponent') {
    return (
      <div className="max-w-md mx-auto px-4 pt-12 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          Tüm Soruları Bitirdin! 🏁
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Skorun: <strong className="text-slate-900 dark:text-white text-base">{myScore} / {questions.length}</strong>
        </p>

        {/* Live Opponent Progress card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-blue-500" />
              <span>{opponent?.name || 'Rakip'} yarışıyor...</span>
            </span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400">
              Soru {opponent?.currentQuestionIndex || 0} / {questions.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300 rounded-full"
              style={{
                width: `${Math.min(100, (((opponent?.currentQuestionIndex || 0)) / questions.length) * 100)}%`
              }}
            />
          </div>

          <p className="text-[11px] text-slate-400 mt-4">
            Rakip son soruyu çözdüğünde veya oyundan çıktığında sonuç ekranı otomatik açılacaktır.
          </p>
        </div>

        {/* Instant Results Button (Never get stuck) */}
        <button
          onClick={() => {
            if (opponentDisconnected || !opponent?.isFinished) {
              setOpponentQuit(true);
            }
            setStage('finished');
          }}
          className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-2 min-h-[44px]"
        >
          <span>Sonuç Ekranını Gör</span>
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  // ==========================================
  // RENDER: PLAYING (LIVE DUEL BATTLE)
  // ==========================================
  if (stage === 'playing') {
    const currentQ = questions[currentIndex];
    const oppIndex = opponent?.currentQuestionIndex || 0;
    const oppScore = opponent?.score || 0;

    return (
      <div className="max-w-xl mx-auto px-4 pt-3 pb-mobile-nav animate-fade-in">
        {/* Opponent Quit Alert Banner */}
        {opponentQuit && (
          <div className="mb-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2 font-bold">
              <Trophy size={18} className="text-amber-500 shrink-0" />
              <span>Rakip oyundan ayrıldı! Hükmen galipsin. 🏆</span>
            </div>
            <button
              onClick={() => setStage('finished')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shrink-0"
            >
              Sonucu Gör
            </button>
          </div>
        )}

        {/* Opponent Disconnect Alert */}
        {opponentDisconnected && !opponentQuit && (
          <div className="mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>Rakibin bağlantısı koptu veya odadan ayrıldı.</span>
          </div>
        )}

        {/* Exit Confirmation Modal */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <LogOut size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Düellodan Ayrıl?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Oyundan çıkarsanız rakip hükmen galip sayılacaktır. Ayrılmak istediğinize emin misiniz?
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
                >
                  Devam Et
                </button>
                <button
                  onClick={handleConfirmExitGame}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors min-h-[44px]"
                >
                  Pes Et & Çık
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LIVE SCOREBOARD HEADER */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            {/* You */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/25">
                {playerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block">
                  Sen
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                  {myScore} <span className="text-xs font-semibold text-slate-400">Puan</span>
                </span>
              </div>
            </div>

            {/* VS Badge & Question Counter */}
            <div className="text-center px-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 tracking-wider">
                VS
              </span>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                {currentIndex + 1} / {questions.length}
              </div>
            </div>

            {/* Opponent */}
            <div className="flex items-center gap-3 text-right flex-row-reverse">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-amber-500/25">
                {opponent?.name?.charAt(0).toUpperCase() || 'R'}
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block truncate max-w-[80px]">
                  {opponent?.name || 'Rakip'}
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                  {oppScore} <span className="text-xs font-semibold text-slate-400">Puan</span>
                </span>
              </div>
            </div>
          </div>

          {/* DUAL RACE PROGRESS BARS */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
            {/* My progress */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-blue-600 w-8">Sen</span>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
            {/* Opponent progress */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-amber-600 w-8 truncate">
                {opponent?.name?.slice(0, 4) || 'Rakip'}
              </span>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${(oppIndex / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* QUESTION CARD */}
        {currentQ && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center shadow-sm relative">
              {/* Category Badge & 44px Touch Target Pronunciation */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {selectedCategory === 'custom' ? customGroupName || 'Özel Desten' : categoryMeta[selectedCategory].title}
                  {currentQ.type ? ` • ${currentQ.type}` : ''}
                </span>

                <button
                  type="button"
                  onClick={handleSpeakCurrentWord}
                  className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm"
                  title="Kelimeyi Dinle"
                  aria-label="Kelimeyi Dinle"
                >
                  <Volume2 size={18} />
                </button>
              </div>

              {/* Target English Word */}
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight my-4">
                {currentQ.word}
              </div>

              {/* Example sentence hint */}
              {currentQ.example && (
                <p className="text-xs italic text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                  "{currentQ.example}"
                </p>
              )}
            </div>

            {/* 4 TURKISH OPTIONS WITH 1-4 KEYBOARD SHORTCUT BADGES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedAnswer === opt;
                const isCorrectAnswer = opt === currentQ.correctOption;

                let btnStyle =
                  'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500';

                if (selectedAnswer !== null) {
                  if (isCorrectAnswer) {
                    btnStyle =
                      'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-bold';
                  } else {
                    btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnsweringLocked}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-4 rounded-2xl border text-sm font-semibold transition-all text-left flex items-center justify-between gap-2 active:scale-98 min-h-[56px] ${btnStyle}`}
                  >
                    <div className="flex items-center min-w-0">
                      <span className="hidden sm:inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 mr-2 shrink-0 border border-slate-200 dark:border-slate-700">
                        {idx + 1}
                      </span>
                      <span className="truncate">{opt}</span>
                    </div>

                    {selectedAnswer !== null && (
                      <span className="shrink-0">
                        {isCorrectAnswer ? (
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        ) : isSelected ? (
                          <XCircle size={18} className="text-rose-500" />
                        ) : null}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: FINISHED (RESULTS SCREEN + MISTAKES LOOP INTEGRATION)
  // ==========================================
  if (stage === 'finished') {
    const oppScore = opponent?.score || 0;
    const oppTimeSec = opponentFinishedTimeMs ? (opponentFinishedTimeMs / 1000).toFixed(1) : '-';
    const myTimeSec = myElapsedTimeMs ? (myElapsedTimeMs / 1000).toFixed(1) : '-';

    return (
      <div className="max-w-xl mx-auto px-4 pt-6 pb-mobile-nav animate-fade-in">
        {/* Rematch Offer from Opponent alert */}
        {rematchOfferFromOpponent && (
          <div className="mb-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 flex items-center justify-between gap-3 shadow-sm">
            <div>
              <h4 className="text-xs font-bold text-blue-900 dark:text-blue-100">
                {opponent?.name} Rövanş İstiyor! 🔥
              </h4>
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                Aynı kategoriden yeni kelimelerle hemen tekrar kapışın.
              </p>
            </div>
            <button
              onClick={handleAcceptRematch}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 min-h-[44px]"
            >
              Kabul Et
            </button>
          </div>
        )}

        {/* Winner Hero Banner */}
        <div
          className={`rounded-3xl p-6 text-center text-white mb-6 shadow-xl ${
            duelResult === 'win'
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-700 shadow-emerald-500/25'
              : duelResult === 'lose'
              ? 'bg-gradient-to-tr from-slate-800 to-rose-700 shadow-rose-500/25'
              : 'bg-gradient-to-tr from-blue-600 to-slate-800 shadow-blue-500/25'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 text-3xl">
            {duelResult === 'win' ? '🏆' : duelResult === 'lose' ? '💔' : '🤝'}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
            {opponentQuit
              ? 'HÜKMEN KAZANDIN! 🏆'
              : duelResult === 'win'
              ? 'TEBRİKLER, KAZANDIN!'
              : duelResult === 'lose'
              ? 'DÜELLOYU KAYBETTİN'
              : 'BERABERE BİTTİ!'}
          </h2>

          <p className="text-xs text-white/90 max-w-sm mx-auto">
            {opponentQuit
              ? 'Rakip oyundan ayrıldığı için düelloyu hükmen galibiyetle tamamladın.'
              : duelResult === 'win'
              ? 'Muazzam bir performans! Kelime düellosunda rakibini geride bıraktın.'
              : duelResult === 'lose'
              ? 'Çok yakındı! Yanlış yaptığın kelimeleri havuzuna ekleyip tekrar çalışabilirsin.'
              : 'İki taraf da eşit sayıda kelime bildi. Kıran kırana bir maç oldu!'}
          </p>
        </div>

        {/* PEDAGOGICAL INTEGRATION: YANLIŞLARI HATALAR HAVUZUNA EKLE */}
        {missedQuestions.length > 0 && onAddMistakesToPool && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 flex items-center justify-between gap-3 mb-6 shadow-sm">
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-100 flex items-center gap-1.5">
                <AlertCircle size={15} className="text-rose-500 shrink-0" />
                <span>Yanlış Bildiğin {missedQuestions.length} Kelime</span>
              </h4>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                Bu kelimeleri Hatalar Havuzuna kaydedip Dashboard'dan tekrar çalışabilirsin.
              </p>
            </div>

            <button
              disabled={isSavingMistakes || savedMistakesSuccess}
              onClick={handleSaveMistakesToPool}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 flex items-center gap-1.5 min-h-[44px] ${
                savedMistakesSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/25'
              }`}
            >
              {isSavingMistakes ? (
                <Loader2 size={13} className="animate-spin" />
              ) : savedMistakesSuccess ? (
                <Check size={13} strokeWidth={3} />
              ) : (
                <Plus size={13} />
              )}
              <span>{savedMistakesSuccess ? 'Havuzuna Eklendi!' : 'Hatalarıma Ekle'}</span>
            </button>
          </div>
        )}

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* You */}
          <div className="bg-white dark:bg-slate-900 border-2 border-blue-500/50 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block mb-1">
              Sen ({playerName})
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {myScore} <span className="text-xs text-slate-400 font-normal">/ {questions.length}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
              <div>Başarı: <strong>%{Math.round((myScore / (questions.length || 1)) * 100)}</strong></div>
              <div>Süre: <strong>{myTimeSec} sn</strong></div>
            </div>
          </div>

          {/* Opponent */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mb-1 truncate">
              Rakip ({opponent?.name || 'Rakip'})
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {oppScore} <span className="text-xs text-slate-400 font-normal">/ {questions.length}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
              <div>Başarı: <strong>%{Math.round((oppScore / (questions.length || 1)) * 100)}</strong></div>
              <div>Süre: <strong>{oppTimeSec} sn</strong></div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Rövanş & Exit */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            disabled={rematchRequestedByMe}
            onClick={handleRequestRematch}
            className="py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <RefreshCw size={14} className={rematchRequestedByMe ? 'animate-spin' : ''} />
            <span>{rematchRequestedByMe ? 'Teklif İletildi...' : 'Rövanş Oyna ⚔️'}</span>
          </button>

          <button
            onClick={() => {
              cleanupChannel();
              onExit();
            }}
            className="py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <LogOut size={14} />
            <span>Dashboard'a Dön</span>
          </button>
        </div>

        {/* Question Review List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Soru Özeti ve Cevapların
          </h3>
          <div className="space-y-2">
            {userHistory.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.question.word}
                    </span>
                    <span className="text-[10px] text-slate-400">➔</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                      {item.question.correctOption}
                    </span>
                  </div>
                  {!item.isCorrect && (
                    <div className="text-[10px] text-rose-500 mt-0.5">
                      Senin cevabın: {item.selectedOption}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {item.isCorrect ? (
                    <span className="text-emerald-500 flex items-center gap-1 font-bold text-[11px]">
                      <CheckCircle2 size={14} /> Doğru
                    </span>
                  ) : (
                    <span className="text-rose-500 flex items-center gap-1 font-bold text-[11px]">
                      <XCircle size={14} /> Yanlış
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
