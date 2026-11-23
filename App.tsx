import React, { useState, useEffect } from 'react';
import { WordGroup, ViewState, Word, UserProfile } from './types';
import WordGroupManager from './components/WordGroupManager';
import WordGroupEditor from './components/WordGroupEditor';
import Quiz from './components/Quiz';
import FlashcardPractice from './components/FlashcardPractice';
import IrregularVerbsPractice from './components/IrregularVerbsPractice';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabaseClient';
import { TTSAccent, getStoredAccent, setStoredAccent } from './services/ttsService';
import {
  LogOut,
  Loader2,
  Languages,
  Sparkles,
  BookOpen,
  Flame,
  Trophy,
  RotateCcw,
  Play,
  Sun,
  Moon,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Volume2,
  Clock,
  Trash2,
  Check,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Plus,
  Target,
  ShieldCheck,
  Smartphone,
  Download
} from 'lucide-react';
import { LanguageBadge } from './components/LanguageBadge';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DailyGoalModal } from './components/DailyGoalModal';
import { PwaInstallModal } from './components/PwaInstallModal';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    try {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      );
    } catch {
      return false;
    }
  });

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleOpenPwaInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsStandalone(true);
        }
      });
    } else {
      setIsPwaModalOpen(true);
    }
  };

  // Theme Management (Light vs Dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('wordingo-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('wordingo-theme', theme);
    } catch {}
  }, [theme]);

  // Audio Pronunciation Preference State
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('wordingo-audio');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleAudio = () => {
    setAudioEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('wordingo-audio', String(next));
      } catch {}
      return next;
    });
  };

  // TTS Accent State ('en-US' | 'en-GB')
  const [ttsAccent, setTtsAccent] = useState<TTSAccent>(() => getStoredAccent());

  const cycleTtsAccent = () => {
    const next: TTSAccent = ttsAccent === 'en-US' ? 'en-GB' : 'en-US';
    setTtsAccent(next);
    setStoredAccent(next);
  };

  // Quiz Direction Preference State ('both' | 'en-to-tr' | 'tr-to-en')
  const [directionPref, setDirectionPref] = useState<'both' | 'en-to-tr' | 'tr-to-en'>(() => {
    try {
      const saved = localStorage.getItem('wordingo-direction-pref') as any;
      return saved === 'en-to-tr' || saved === 'tr-to-en' ? saved : 'both';
    } catch {
      return 'both';
    }
  });

  const cycleDirectionPref = () => {
    const next = directionPref === 'both' ? 'en-to-tr' : directionPref === 'en-to-tr' ? 'tr-to-en' : 'both';
    setDirectionPref(next);
    try {
      localStorage.setItem('wordingo-direction-pref', next);
    } catch {}
  };

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (session?.user) {
      try {
        await supabase.rpc('update_user_theme', { p_theme: nextTheme });
      } catch (e) {
        console.warn('Could not sync theme with supabase', e);
      }
    }
  };

  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isAddDeckModalOpen, setIsAddDeckModalOpen] = useState(false);
  const [groups, setGroups] = useState<WordGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<WordGroup | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const handleBottomBarAddDeck = () => {
    setView(ViewState.DECKS);
    setIsAddDeckModalOpen(true);
  };

  // 1. Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch User Data & Profile
  useEffect(() => {
    if (session?.user) {
      fetchGroups();
      fetchUserProfile(session.user.id);
      // Record today's login activity / refresh streak
      handleRecordStudyTime(0);
    }
  }, [session?.user?.id]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setUserProfile(data as UserProfile);
        if (data.theme_preference) {
          setTheme(data.theme_preference as 'dark' | 'light');
        }
      } else {
        // Create initial profile if missing
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert({ id: userId, email: session?.user?.email })
          .select()
          .single();
        if (newProfile) setUserProfile(newProfile as UserProfile);
      }
    } catch (e) {
      console.error('Error fetching user profile:', e);
    }
  };

  const handleRecordStudyTime = async (minutes: number = 1) => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase.rpc('record_study_activity', {
        p_study_minutes: minutes
      });
      if (error) throw error;
      if (data) {
        setUserProfile(data as UserProfile);
      }
    } catch (e) {
      console.error('Error recording study time:', e);
    }
  };

  const fetchGroups = async () => {
    if (groups.length === 0) {
      setLoadingData(true);
    }
    try {
      const { data, error } = await supabase
        .from('word_groups')
        .select(`
          id,
          name,
          description,
          level,
          created_at,
          perfect_completion_count,
          words (
            id,
            en,
            tr,
            wrong_count
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData: WordGroup[] = (data || []).map((g: any) => ({
        ...g,
        createdAt: new Date(g.created_at).getTime(),
        words: g.words || []
      }));

      setGroups(formattedData);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setGroups([]);
    setView(ViewState.DECKS);
  };

  const promptLogout = () => {
    setModalConfig({
      isOpen: true,
      title: 'Oturumu Kapat',
      description: 'Hesabınızdan çıkış yapmak istediğinize emin misiniz? Dilediğiniz zaman tekrar giriş yapabilirsiniz.',
      confirmLabel: 'Çıkış Yap',
      cancelLabel: 'Vazgeç',
      isDestructive: true,
      showCancel: true,
      onConfirm: async () => {
        closeModal();
        await handleLogout();
      }
    });
  };

  const handleSaveDailyGoal = async (newGoal: number) => {
    if (session?.user) {
      try {
        await supabase
          .from('user_profiles')
          .update({ daily_goal_words: newGoal })
          .eq('id', session.user.id);
        setUserProfile((prev) => (prev ? { ...prev, daily_goal_words: newGoal } : null));
      } catch (e) {
        console.error('Error updating daily goal', e);
        throw e;
      }
    }
  };

  // --- Actions ---

  const handleCreateGroup = async (newGroupData: WordGroup) => {
    if (!session?.user) return;

    try {
      const { data: groupData, error: groupError } = await supabase
        .from('word_groups')
        .insert({
          user_id: session.user.id,
          name: newGroupData.name,
          description: newGroupData.description,
          level: newGroupData.level,
        })
        .select()
        .single();

      if (groupError) throw groupError;
      if (!groupData) return;

      let insertedWords: Word[] = [];
      if (newGroupData.words.length > 0) {
        const wordsPayload = newGroupData.words.map((w) => ({
          group_id: groupData.id,
          en: w.en,
          tr: w.tr
        }));

        const { data: wordsData, error: wordsError } = await supabase
          .from('words')
          .insert(wordsPayload)
          .select();

        if (wordsError) throw wordsError;
        insertedWords = wordsData || [];
      }

      const newGroup: WordGroup = {
        ...newGroupData,
        id: groupData.id,
        words: insertedWords,
        createdAt: Date.now()
      };

      setGroups((prev) => [newGroup, ...prev]);
    } catch (error) {
      console.error('Error creating group:', error);
      setModalConfig({
        isOpen: true,
        title: 'Hata',
        description: 'Grup oluşturulurken bir hata oluştu.',
        confirmLabel: 'Tamam',
        showCancel: false,
        isDestructive: false,
        onConfirm: closeModal
      });
    }
  };

  // --- Modal Dialog / Bottom Sheet State ---
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    showCancel?: boolean;
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeleteGroup = (id: string) => {
    const groupToDelete = groups.find((g) => g.id === id);
    const groupTitle = groupToDelete?.name || 'Bu kelime grubu';

    setModalConfig({
      isOpen: true,
      title: 'Kelime Grubunu Sil',
      description: `"${groupTitle}" kelime grubunu ve içerisindeki tüm kelimeleri kalıcı olarak silmek istediğinize emin misiniz?`,
      confirmLabel: 'Kelime Grubunu Sil',
      cancelLabel: 'Vazgeç',
      isDestructive: true,
      showCancel: true,
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isLoading: true }));
        try {
          const { error } = await supabase.from('word_groups').delete().eq('id', id);
          if (error) throw error;

          setGroups((prev) => prev.filter((g) => g.id !== id));
          if (activeGroup?.id === id) {
            setActiveGroup(null);
            setView(ViewState.DECKS);
          }
          closeModal();
        } catch (error) {
          console.error('Error deleting group:', error);
          setModalConfig({
            isOpen: true,
            title: 'Hata',
            description: 'Silme işlemi gerçekleştirilirken bir hata oluştu.',
            confirmLabel: 'Tamam',
            showCancel: false,
            isDestructive: false,
            onConfirm: closeModal
          });
        }
      }
    });
  };

  const handleSelectGroup = (group: WordGroup) => {
    setActiveGroup(group);
    setView(ViewState.EDITOR);
  };

  const handleStartQuiz = (group: WordGroup) => {
    setActiveGroup(group);
    setView(ViewState.QUIZ);
  };

  const handleStartFlashcard = (group: WordGroup) => {
    setActiveGroup(group);
    setView(ViewState.FLASHCARD);
  };

  const handleQuickQuiz = () => {
    const eligibleGroups = groups.filter((g) => (g.words?.length || 0) >= 4);
    if (eligibleGroups.length === 0) {
      setModalConfig({
        isOpen: true,
        title: 'Yetersiz Kelime',
        description: 'Hızlı quiz başlatabilmek için en az 4 kelimelik bir gruba ihtiyacınız var.',
        confirmLabel: 'Anladım',
        showCancel: false,
        isDestructive: false,
        onConfirm: closeModal
      });
      return;
    }
    const prioritized =
      eligibleGroups.find((g) => (g.words || []).some((w) => (w.wrong_count || 0) > 0)) || eligibleGroups[0];
    handleStartQuiz(prioritized);
  };

  const handleStartMistakesQuiz = () => {
    const allMistakeWords = groups.flatMap((g) => (g.words || []).filter((w) => (w.wrong_count || 0) > 0));
    const uniqueMistakes = Array.from(new Map(allMistakeWords.map((w) => [w.id, w])).values());
    if (uniqueMistakes.length < 1) {
      setModalConfig({
        isOpen: true,
        title: 'Hatalı Kelime Yok 🎉',
        description: 'Tebrikler! Şu an tekrar edilecek hiçbir hatalı kelimeniz bulunmuyor.',
        confirmLabel: 'Harika',
        showCancel: false,
        isDestructive: false,
        onConfirm: closeModal
      });
      return;
    }
    const mistakeGroup: WordGroup = {
      id: 'mistakes-review',
      name: '🎯 Hatalı Kelimeler Tekrarı',
      description: 'Daha önce yanlış bilinen kelimelerden dinamik kelime grubu',
      level: 'Mix',
      words: uniqueMistakes,
      createdAt: Date.now()
    };
    handleStartQuiz(mistakeGroup);
  };

  const [isClearingMistakes, setIsClearingMistakes] = useState(false);

  // Triggered when user clicks "Hataları Temizle" / "Listeyi Temizle"
  const promptClearAllMistakes = () => {
    setModalConfig({
      isOpen: true,
      title: 'Hatalı Kelimeleri Sil',
      description: 'Hatalar havuzundaki tüm kelimeler sıfırlanacak ve listeden tamamen kaldırılacaktır. Bu işlem geri alınamaz.',
      confirmLabel: 'Hataları Sil',
      cancelLabel: 'Vazgeç',
      isDestructive: true,
      showCancel: true,
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isLoading: true }));
        setIsClearingMistakes(true);
        try {
          const { error } = await supabase.rpc('clear_all_mistakes');
          if (error) throw error;
          await fetchGroups();
          closeModal();
        } catch (err) {
          console.error('Error clearing all mistakes:', err);
          setModalConfig({
            isOpen: true,
            title: 'Hata',
            description: 'Hatalar temizlenirken bir hata meydana geldi.',
            confirmLabel: 'Tamam',
            showCancel: false,
            isDestructive: false,
            onConfirm: closeModal
          });
        } finally {
          setIsClearingMistakes(false);
        }
      }
    });
  };

  // Triggered when user clicks delete icon for an individual mistake word
  const promptClearWordMistake = (wordId: string, wordEn: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Kelimeyi Havuzdan Kaldır',
      description: `"${wordEn}" kelimesini hatalar havuzundan silmek ve öğrenildi olarak işaretlemek istediğinize emin misiniz?`,
      confirmLabel: 'Kelimeyi Sil',
      cancelLabel: 'Vazgeç',
      isDestructive: true,
      showCancel: true,
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isLoading: true }));
        try {
          const { error } = await supabase.rpc('clear_word_mistake', { p_word_id: wordId });
          if (error) throw error;
          setGroups((prev) =>
            prev.map((g) => ({
              ...g,
              words: (g.words || []).map((w) => (w.id === wordId ? { ...w, wrong_count: 0 } : w))
            }))
          );
          closeModal();
        } catch (err) {
          console.error('Error clearing word mistake:', err);
          closeModal();
        }
      }
    });
  };

  const handleClearWordMistake = async (wordId: string) => {
    try {
      const { error } = await supabase.rpc('clear_word_mistake', { p_word_id: wordId });
      if (error) throw error;
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          words: (g.words || []).map((w) => (w.id === wordId ? { ...w, wrong_count: 0 } : w))
        }))
      );
    } catch (err) {
      console.error('Error clearing word mistake:', err);
    }
  };

  // --- Editor Specific Actions ---

  const handleRenameGroup = async (newName: string) => {
    if (!activeGroup) return;
    try {
      const { error } = await supabase
        .from('word_groups')
        .update({ name: newName })
        .eq('id', activeGroup.id);

      if (error) throw error;

      const updatedGroup = { ...activeGroup, name: newName };
      setActiveGroup(updatedGroup);
      setGroups((prev) => prev.map((g) => (g.id === activeGroup.id ? updatedGroup : g)));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleAddWordToGroup = async (en: string, tr: string) => {
    if (!activeGroup) return;
    try {
      const { data, error } = await supabase
        .from('words')
        .insert({
          group_id: activeGroup.id,
          en,
          tr
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) return;

      const newWord: Word = { id: data.id, en: data.en, tr: data.tr };
      const updatedWords = [newWord, ...activeGroup.words];
      const updatedGroup = { ...activeGroup, words: updatedWords };

      setActiveGroup(updatedGroup);
      setGroups((prev) => prev.map((g) => (g.id === activeGroup.id ? updatedGroup : g)));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleDeleteWordFromGroup = async (wordId: string) => {
    if (!activeGroup) return;
    try {
      const { error } = await supabase.from('words').delete().eq('id', wordId);
      if (error) throw error;

      const updatedWords = activeGroup.words.filter((w) => w.id !== wordId);
      const updatedGroup = { ...activeGroup, words: updatedWords };

      setActiveGroup(updatedGroup);
      setGroups((prev) => prev.map((g) => (g.id === activeGroup.id ? updatedGroup : g)));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // --- Quiz Analytics ---
  const handleUpdateMistakes = async (wordIds: string[]) => {
    if (!wordIds.length) return;
    try {
      const { error } = await supabase.rpc('increment_wrong_counts', { word_ids: wordIds });
      if (error) throw error;
      fetchGroups();
    } catch (e) {
      console.error('Error updating mistake counts:', e);
    }
  };

  const handlePerfectCompletion = async (groupId: string) => {
    try {
      const { error } = await supabase.rpc('increment_perfect_completion', { p_group_id: groupId });
      if (error) throw error;
      fetchGroups();
    } catch (e) {
      console.error('Error updating perfect completion count:', e);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-3">
          <Loader2 className="animate-spin" size={24} />
        </div>
        <p className="text-xs text-slate-500 font-medium">Wordingo hazırlanıyor...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const totalWords = groups.reduce((acc, g) => acc + (g.words?.length || 0), 0);
  const totalMastery = groups.reduce((acc, g) => acc + (g.perfect_completion_count || 0), 0);
  const allMistakeWords = groups.flatMap((g) => (g.words || []).filter((w) => (w.wrong_count || 0) > 0));
  const uniqueMistakes = Array.from(new Map(allMistakeWords.map((w) => [w.id, w])).values());
  const totalMistakes = uniqueMistakes.length;
  const streakDays = userProfile?.streak_days ?? 1;
  const studyMinutes = userProfile?.study_time_minutes ?? 0;
  const userEmail = session?.user?.email || '';
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'W';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans antialiased">
      {/* Top Header - Visible on all non-quiz pages */}
      {view !== ViewState.QUIZ && view !== ViewState.FLASHCARD && view !== ViewState.IRREGULAR_VERBS && (
        <header className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 safe-area-inset-top transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="h-16 flex items-center justify-between gap-3 sm:gap-4">
              {/* Left: Brand Logo & Web Desktop Tabs */}
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setView(ViewState.DASHBOARD)}
                  className="flex items-center gap-2.5 group text-left"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:bg-blue-700 transition-all shrink-0">
                    <Languages size={18} />
                  </div>
                  <div>
                    <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white block leading-tight">
                      Wordingo
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                      Modern AI Vocabulary
                    </span>
                  </div>
                </button>

                {/* Desktop Tabs */}
                <nav className="hidden md:flex items-center gap-1.5 ml-2">
                  <button
                    onClick={() => setView(ViewState.DASHBOARD)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      view === ViewState.DASHBOARD
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setView(ViewState.DECKS)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      view === ViewState.DECKS
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    Kelime Grupları
                  </button>
                  <button
                    onClick={() => setView(ViewState.MISTAKES)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      view === ViewState.MISTAKES
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span>Hatalarım</span>
                    {totalMistakes > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-rose-500 text-white">
                        {totalMistakes}
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              {/* Right: Metrics & User Profile (Ayarlar) */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Streak Badge */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 text-xs font-bold"
                  title={`${streakDays} Günlük Çalışma Serisi`}
                >
                  <Flame size={14} className="fill-amber-400 text-amber-500" />
                  <span>{streakDays} Gün</span>
                </div>

                {/* Mastery Badge (Desktop) */}
                <div
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold"
                  title="Kusursuz Tamamlanan Quiz"
                >
                  <Trophy size={13} />
                  <span>{totalMastery} Quiz</span>
                </div>

                {/* User Avatar & Ayarlar Girişi (Sadece Masaüstünde, Mobilde Alt Bar Ayarlar Kullanılır) */}
                <button
                  onClick={() => setView(ViewState.SETTINGS)}
                  className={`hidden sm:flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-98 ${
                    view === ViewState.SETTINGS || view === ViewState.PROFILE
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  title="Hesap ve Uygulama Ayarları"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    <span className="leading-none">{userInitial.toUpperCase()}</span>
                  </div>
                  <span className="max-w-[100px] truncate">{userEmail.split('@')[0]}</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main>
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-3">
              <Loader2 className="animate-spin" size={24} />
            </div>
            <p className="text-xs text-slate-500 font-medium">Kelime grupları yükleniyor...</p>
          </div>
        ) : (
          <>
            {view === ViewState.DECKS && (
              <WordGroupManager
                groups={groups}
                onCreateGroup={handleCreateGroup}
                onDeleteGroup={handleDeleteGroup}
                onSelectGroup={handleSelectGroup}
                onStartQuiz={handleStartQuiz}
                onStartFlashcard={handleStartFlashcard}
                onStartMistakesQuiz={handleStartMistakesQuiz}
                totalMistakes={totalMistakes}
                isAddDeckOpen={isAddDeckModalOpen}
                onCloseAddDeck={() => setIsAddDeckModalOpen(false)}
              />
            )}

            {/* DASHBOARD VIEW (Minimalist Learning Hub) */}
            {view === ViewState.DASHBOARD && (
              <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-16 space-y-6 animate-fade-in">
                {/* Minimal Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Genel Bakış
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {streakDays > 0 ? `${streakDays} günlük seridesiniz` : 'Öğrenme yolculuğunuz devam ediyor'} · {groups.length} kayıtlı kelime grubu
                    </p>
                  </div>
                  <button
                    onClick={() => setView(ViewState.DECKS)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    <span>Tüm Gruplar</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {/* 4 Minimal Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Metric: Streak */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 transition-all">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-medium">Seri</span>
                      <Flame size={15} className="text-amber-500 fill-amber-400/30" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{streakDays}</span>
                      <span className="text-xs text-slate-400 font-normal">gün</span>
                    </div>
                  </div>

                  {/* Metric: Study Time */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 transition-all">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-medium">Çalışma</span>
                      <Clock size={15} className="text-blue-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{studyMinutes > 0 ? studyMinutes : 1}</span>
                      <span className="text-xs text-slate-400 font-normal">dk</span>
                    </div>
                  </div>

                  {/* Metric: Mastery */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 transition-all">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-medium">Kusursuz</span>
                      <Trophy size={15} className="text-emerald-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalMastery}</span>
                      <span className="text-xs text-slate-400 font-normal">quiz</span>
                    </div>
                  </div>

                  {/* Metric: Total Words */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 transition-all">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                      <span className="text-[11px] font-medium">Kelimeler</span>
                      <BookOpen size={15} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalWords}</span>
                      <span className="text-xs text-slate-400 font-normal">toplam</span>
                    </div>
                  </div>
                </div>

                {/* Daily Goal & Mistakes Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Minimal Daily Goal Card */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Target size={15} className="text-blue-600 dark:text-blue-400" />
                          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Günlük Hedef
                          </h2>
                        </div>
                        <button
                          onClick={() => setIsGoalModalOpen(true)}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Hedefi Değiştir
                        </button>
                      </div>

                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          %{Math.min(100, Math.round(((userProfile?.study_time_minutes ?? 1) * 5) / (userProfile?.daily_goal_words ?? 20) * 100))} tamamlandı
                        </span>
                        <span className="text-xs text-slate-400">
                          Hedef: {userProfile?.daily_goal_words ?? 20} kelime
                        </span>
                      </div>

                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(12, Math.round(((userProfile?.study_time_minutes ?? 1) * 5) / (userProfile?.daily_goal_words ?? 20) * 100)))}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Minimal Mistakes Card */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        totalMistakes > 0
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                      }`}>
                        {totalMistakes > 0 ? <RotateCcw size={18} /> : <CheckCircle2 size={18} />}
                      </div>
                      <div>
                        <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Hatalar Havuzu
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {totalMistakes > 0
                            ? `${totalMistakes} kelime tekrar edilmeyi bekliyor`
                            : 'Tekrar bekleyen hata yok, harika!'}
                        </p>
                      </div>
                    </div>

                    {totalMistakes > 0 && (
                      <button
                        onClick={() => setView(ViewState.MISTAKES)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors shrink-0"
                      >
                        İncele
                      </button>
                    )}
                  </div>
                </div>

                {/* Recent / Quick Decks List */}
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Kelime Gruplarınız
                    </h2>
                    <button
                      onClick={() => setView(ViewState.DECKS)}
                      className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Tümünü Gör ({groups.length})
                    </button>
                  </div>

                  {groups.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                      <p className="text-xs text-slate-500 mb-3">Henüz bir kelime grubu oluşturmadınız.</p>
                      <button
                        onClick={handleBottomBarAddDeck}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                      >
                        İlk Grubunu Ekle
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groups.slice(0, 3).map((group) => (
                        <div
                          key={group.id}
                          onClick={() => handleSelectGroup(group)}
                          className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                              {group.level || 'Mix'}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {group.name}
                              </h3>
                              <span className="text-[11px] text-slate-400">
                                {group.words.length} kelime
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleStartFlashcard(group)}
                              disabled={group.words.length < 1}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Pratik Yap"
                            >
                              Pratik
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartQuiz(group)}
                              disabled={group.words.length < 1}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1"
                              title="Quiz Başlat"
                            >
                              <Play size={11} className="fill-current" />
                              <span>Quiz</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Irregular Verbs Hub Card */}
                <div
                  onClick={() => setView(ViewState.IRREGULAR_VERBS)}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md cursor-pointer transition-all active:scale-98 group"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setView(ViewState.IRREGULAR_VERBS);
                    }
                  }}
                  aria-label="Irregular Verbs (Düzensiz Fiiller) çalışmasına git"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/60 group-hover:scale-105 transition-transform">
                      <Sparkles size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          Irregular Verbs
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-200/50 dark:border-blue-900/40">
                          90+ Fiil
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        V1, V2 ve V3 halleriyle düzensiz fiil çalışma kartları
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:bg-blue-600 group-hover:text-white text-xs font-semibold transition-all">
                    <span>Çalış</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            )}

            {view === ViewState.EDITOR && activeGroup && (
              <WordGroupEditor
                group={activeGroup}
                onRenameGroup={handleRenameGroup}
                onAddWord={handleAddWordToGroup}
                onDeleteWord={handleDeleteWordFromGroup}
                onBack={() => setView(ViewState.DECKS)}
              />
            )}

            {view === ViewState.QUIZ && activeGroup && (
              <Quiz
                group={activeGroup}
                onExit={() => setView(ViewState.DECKS)}
                onUpdateMistakes={handleUpdateMistakes}
                onPerfectCompletion={() => handlePerfectCompletion(activeGroup.id)}
                onRecordStudyTime={handleRecordStudyTime}
              />
            )}

            {view === ViewState.FLASHCARD && activeGroup && (
              <FlashcardPractice
                group={activeGroup}
                onExit={() => setView(ViewState.DECKS)}
                onStartQuiz={() => handleStartQuiz(activeGroup)}
              />
            )}

            {view === ViewState.IRREGULAR_VERBS && (
              <IrregularVerbsPractice
                onExit={() => setView(ViewState.DASHBOARD)}
              />
            )}

            {/* MISTAKES VIEW (Dedicated Mistakes Tab) */}
            {view === ViewState.MISTAKES && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-16 animate-fade-in">
                {/* Header with Title and Actions */}
                <div className="mb-6 space-y-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <XCircle className="text-rose-500 shrink-0" size={22} />
                      <span>Hatalı Kelimeler Havuzu</span>
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Quizlerde yanlış cevapladığınız kelimeler burada toplanır.
                    </p>
                  </div>

                  {totalMistakes > 0 && (
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        onClick={handleStartMistakesQuiz}
                        disabled={totalMistakes < 1}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-98 min-h-[44px] ${
                          totalMistakes >= 1
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Play size={13} className="fill-current" />
                        <span>Hepsini Tekrarla ({totalMistakes})</span>
                      </button>

                      <button
                        onClick={promptClearAllMistakes}
                        disabled={isClearingMistakes}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/60 dark:border-rose-900/50 transition-colors active:scale-98 min-h-[44px]"
                        title="Tüm hatalı kelimeleri listeden sil"
                        aria-label="Tüm hatalı kelimeleri listeden sil"
                      >
                        {isClearingMistakes ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        <span>Hataları Sil</span>
                      </button>
                    </div>
                  )}
                </div>

                {totalMistakes === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                      Harika! Tekrar bekleyen kelimeniz yok 🎉
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
                      Quizlerde yanlış yaptığınız tüm kelimeleri düzelttiniz veya henüz hata yapmadınız.
                    </p>
                    <button
                      onClick={() => setView(ViewState.DECKS)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/25"
                    >
                      <BookOpen size={14} />
                      Kelime Gruplarına Göz At
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {uniqueMistakes.map((w, index) => (
                      <div
                        key={w.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-500 text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{w.en}</span>
                              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200/50 dark:border-rose-900/50">
                                {w.wrong_count} kez yanlış
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{w.tr}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => promptClearWordMistake(w.id, w.en)}
                            className="w-10 h-10 min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                            title="Bu kelimeyi hatalar havuzundan sil"
                            aria-label={`${w.en} kelimesini hatalar havuzundan sil`}
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => handleClearWordMistake(w.id)}
                            className="w-10 h-10 min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            title="Öğrendim olarak işaretle ve listeden kaldır"
                            aria-label={`${w.en} kelimesini öğrendim olarak işaretle ve listeden kaldır`}
                          >
                            <Check size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS VIEW (Clean Grouped Native Buttons & Account Header) */}
            {(view === ViewState.SETTINGS || view === ViewState.PROFILE) && (
              <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-16 space-y-4 animate-fade-in">
                <div className="px-1">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Ayarlar
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hesap bilgileri ve uygulama tercihleri
                  </p>
                </div>

                {/* 1. Üstte Hesap Bilgileri Kartı */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    {/* Yuvarlak ve Kusursuz Ortalı Kullanıcı Avatarı */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/15 dark:ring-blue-400/10 shrink-0 select-none">
                      <span className="text-xl sm:text-2xl font-extrabold leading-none text-white block">
                        {userInitial.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                          {userEmail}
                        </h2>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Aktif
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Wordingo Pro Öğrenci · Bulut Eşitlemesi Açık
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Altta Button Button Ayarlar Listesi */}
                
                {/* Grup 1: Görünüm */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                    Görünüm
                  </span>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800/70">
                    <button
                      onClick={toggleTheme}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
                          {theme === 'dark' ? <Moon size={16} className="text-blue-400" /> : <Sun size={16} />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                            Görünüm Teması
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {theme === 'dark' ? 'Notion Koyu Mod devrede' : 'Aydınlık Mod devrede'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {theme === 'dark' ? 'Koyu 🌙' : 'Aydınlık ☀️'}
                        </span>
                        <ChevronRight size={15} className="text-slate-400" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Grup 2: Öğrenme Tercihleri */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                    Öğrenme Tercihleri
                  </span>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800/70">
                    {/* Günlük Hedef Butonu */}
                    <button
                      type="button"
                      onClick={() => setIsGoalModalOpen(true)}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors active:scale-[0.99] min-h-[52px]"
                      aria-label="Günlük kelime hedefini dinamik ayarla"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center shrink-0">
                          <Target size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                            Günlük Kelime Hedefi
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Seriyi korumak için günlük çalışma hedefi
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50">
                          {userProfile?.daily_goal_words ?? 20} Kelime
                        </span>
                        <ChevronRight size={15} className="text-slate-400" />
                      </div>
                    </button>

                    {/* Sesli Telaffuz Desteği (Gerçek Toggle Etkileşimi) */}
                    <button
                      type="button"
                      onClick={toggleAudio}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors active:scale-[0.99] min-h-[52px]"
                      aria-label="Sesli telaffuz desteğini aç veya kapat"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Volume2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                            Sesli Telaffuz Desteği
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {audioEnabled ? 'Kelime kartlarında telaffuz seslendirmesi açık' : 'Sesli telaffuz kapatıldı'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          audioEnabled
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {audioEnabled ? 'Açık ✓' : 'Kapalı ✕'}
                        </span>
                        {/* Visual Switch */}
                        <div className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                          audioEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                        }`}>
                          <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                        </div>
                      </div>
                    </button>

                    {/* Telaffuz Aksanı (US / UK) */}
                    <button
                      type="button"
                      onClick={cycleTtsAccent}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors active:scale-[0.99] min-h-[52px]"
                      aria-label="Telaffuz aksanını Amerikan veya İngiliz olarak değiştir"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                          <Volume2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                            İngilizce Telaffuz Aksanı
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {ttsAccent === 'en-US'
                              ? 'Doğal Amerikan İngilizcesi (US 🇺🇸) seslendirme'
                              : 'Doğal İngiliz İngilizcesi (UK 🇬🇧) seslendirme'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-900/50">
                          {ttsAccent === 'en-US' ? 'Amerikan 🇺🇸' : 'İngiliz 🇬🇧'}
                        </span>
                        <ChevronRight size={15} className="text-slate-400" />
                      </div>
                    </button>

                    {/* Çeviri Yönü (Gerçek Döngüsel Seçim) */}
                    <button
                      type="button"
                      onClick={cycleDirectionPref}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors active:scale-[0.99] min-h-[52px]"
                      aria-label="Varsayılan dil yönünü değiştir"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center shrink-0">
                          <Languages size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                            Varsayılan Dil Yönü
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {directionPref === 'both' ? 'İki yön dengeli pratik sunulur' : directionPref === 'en-to-tr' ? 'İngilizce ➔ Türkçe öncelikli' : 'Türkçe ➔ İngilizce öncelikli'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50">
                          {directionPref === 'both' ? 'İki Yönlü ⇄' : directionPref === 'en-to-tr' ? 'EN ➔ TR' : 'TR ➔ EN'}
                        </span>
                        <ChevronRight size={15} className="text-slate-400" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Grup 3: Veri & Bulut */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                    Veri & Havuz Yönetimi
                  </span>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800/70">
                    {/* Hataları Sıfırla Butonu */}
                    <button
                      type="button"
                      onClick={promptClearAllMistakes}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors active:scale-[0.99] min-h-[52px]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0">
                          <RotateCcw size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                            Hatalar Havuzunu Sıfırla
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {totalMistakes > 0 ? `${totalMistakes} hatalı kelime kayıtlı` : 'Havuz şu anda temiz'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50">
                          {totalMistakes > 0 ? 'Sıfırla' : 'Temiz'}
                        </span>
                        <ChevronRight size={15} className="text-slate-400" />
                      </div>
                    </button>

                    {/* Bulut Senkronizasyonu Bilgi Kartı (Yalancı Ok Olmadan Temiz Statü) */}
                    <div className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left min-h-[52px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center shrink-0">
                          <ShieldCheck size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                            Supabase Bulut Eşitlemesi
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Hesap, kelime grubu ve çalışma verileriniz güvende
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Aktif
                      </div>
                    </div>

                    {/* Yapay Zeka & Sürüm Bilgi Kartı */}
                    <div className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left min-h-[52px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center shrink-0">
                          <Sparkles size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                            Yapay Zeka ve Sürüm
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Google Gemini 2.5 Flash entegrasyonu
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0 font-mono">
                        v2.4 Pro
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grup 4: Cihaza Kurulum & PWA */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                    Cihaza Kurulum & PWA
                  </span>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800/70">
                    <button
                      type="button"
                      onClick={handleOpenPwaInstall}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors active:scale-[0.99] min-h-[52px]"
                      aria-label="Uygulamayı ana ekrana ekle veya cihazına kur"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Smartphone size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                            Ana Ekrana Ekle (PWA)
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {isStandalone
                              ? 'Uygulama ana ekran modunda çalışıyor'
                              : 'Tarayıcı çubuğu olmadan tam ekran mobil deneyim'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          isStandalone
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50'
                            : 'bg-blue-600 text-white shadow-sm'
                        }`}>
                          {isStandalone ? 'Kurulu ✓' : 'Yükle 📲'}
                        </span>
                        {!isStandalone && <ChevronRight size={15} className="text-slate-400" />}
                      </div>
                    </button>

                    <div className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left min-h-[52px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                            Çevrimdışı Önbellek (Offline Cache)
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Service Worker ve arayüz kaynakları önbelleğe alındı
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                        Aktif ✓
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grup 5: Oturum ve Çıkış */}
                <div className="space-y-1.5 pt-1">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={promptLogout}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors active:scale-[0.99] group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <LogOut size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 block">
                            Oturumu Kapat
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {userEmail} oturumundan güvenle çıkış yapın
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-rose-400 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom on mobile, hidden on md+) */}
      {session && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 z-40 safe-area-inset-bottom">
          <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
            {/* Tab 1: Dashboard */}
            <button
              onClick={() => setView(ViewState.DASHBOARD)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                view === ViewState.DASHBOARD
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <LayoutDashboard size={19} className={view === ViewState.DASHBOARD ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className="text-[10px] tracking-tight">Dashboard</span>
            </button>

            {/* Tab 2: Kelime Grupları */}
            <button
              onClick={() => setView(ViewState.DECKS)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                view === ViewState.DECKS
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <BookOpen size={19} className={view === ViewState.DECKS ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className="text-[10px] tracking-tight">Kelime Grupları</span>
            </button>

            {/* Tab 3 [CENTER]: + Kelime Grubu Ekle (Elevated Floating Action) */}
            <div className="flex items-center justify-center relative">
              <button
                onClick={handleBottomBarAddDeck}
                className="relative -top-3.5 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md border-[3px] border-white dark:border-slate-900 flex items-center justify-center active:scale-90 transition-all z-10"
                title="Yeni Kelime Grubu Ekle"
                aria-label="Yeni Kelime Grubu Ekle"
              >
                <Plus size={23} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Tab 4: Hatalar */}
            <button
              onClick={() => setView(ViewState.MISTAKES)}
              className={`flex flex-col items-center justify-center gap-1 relative transition-colors ${
                view === ViewState.MISTAKES
                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <div className="relative">
                <XCircle size={19} className={view === ViewState.MISTAKES ? 'stroke-[2.5]' : 'stroke-2'} />
                {totalMistakes > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white leading-none">
                    {totalMistakes}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">Hatalar</span>
            </button>

            {/* Tab 5: Ayarlar */}
            <button
              onClick={() => setView(ViewState.SETTINGS)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                view === ViewState.SETTINGS || view === ViewState.PROFILE
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <Settings size={19} className={view === ViewState.SETTINGS || view === ViewState.PROFILE ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className="text-[10px] tracking-tight">Ayarlar</span>
            </button>
          </div>
        </nav>
      )}

      {/* Responsive Confirmation Dialog: Mobile Bottom Sheet / Desktop Centered Dialog */}
      <ConfirmDialog
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmLabel={modalConfig.confirmLabel}
        cancelLabel={modalConfig.cancelLabel}
        isDestructive={modalConfig.isDestructive}
        showCancel={modalConfig.showCancel}
        isLoading={modalConfig.isLoading}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
      />

      {/* Dynamic Daily Goal Selector Modal */}
      <DailyGoalModal
        isOpen={isGoalModalOpen}
        currentGoal={userProfile?.daily_goal_words ?? 20}
        onSave={handleSaveDailyGoal}
        onClose={() => setIsGoalModalOpen(false)}
      />

      {/* PWA Install Guide Modal */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => {
          setIsStandalone(true);
          setNotification({
            type: 'success',
            title: 'Harika! 🎉',
            message: 'Wordingo başarıyla ana ekranınıza eklendi.'
          });
        }}
      />
    </div>
  );
};

export default App;
