import React, { useState, useEffect } from 'react';
import { WordGroup, ViewState, Word } from './types';
import WordGroupManager from './components/WordGroupManager';
import WordGroupEditor from './components/WordGroupEditor';
import Quiz from './components/Quiz';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabaseClient';
import { LogOut, Loader2, Languages, Sparkles, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [groups, setGroups] = useState<WordGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<WordGroup | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  // 2. Fetch Data (Replace LocalStorage)
  useEffect(() => {
    if (session?.user) {
      fetchGroups();
    }
  }, [session]);

  const fetchGroups = async () => {
    setLoadingData(true);
    try {
      // Fetch groups AND their related words in one query
      const { data, error } = await supabase
        .from('word_groups')
        .select(`
          id,
          name,
          description,
          level,
          created_at,
          words (
            id,
            en,
            tr
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data if necessary (Supabase returns words array automatically due to foreign key)
      // We map it to ensure it strictly matches WordGroup interface, though Supabase type is loose here.
      const formattedData: WordGroup[] = (data || []).map((g: any) => ({
        ...g,
        createdAt: new Date(g.created_at).getTime(), // Map string to number if needed, or keep string
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
    setShowMobileMenu(false);
    await supabase.auth.signOut();
    setGroups([]);
    setView(ViewState.DASHBOARD);
  };

  // --- Actions ---

  const handleCreateGroup = async (newGroupData: WordGroup) => {
    if (!session?.user) return;

    try {
      // 1. Insert Group
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

      // 2. Insert Words (if any, e.g. from Excel or AI)
      let insertedWords: Word[] = [];
      if (newGroupData.words.length > 0) {
        const wordsPayload = newGroupData.words.map(w => ({
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

      // 3. Update State
      const newGroup: WordGroup = {
        ...newGroupData,
        id: groupData.id,
        words: insertedWords,
        createdAt: Date.now()
      };

      setGroups(prev => [newGroup, ...prev]);

    } catch (error) {
      console.error("Error creating group:", error);
      alert("Grup oluşturulurken bir hata oluştu.");
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Bu grubu silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('word_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGroups(prev => prev.filter(g => g.id !== id));
      if (activeGroup?.id === id) {
        setActiveGroup(null);
        setView(ViewState.DASHBOARD);
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Silme işlemi başarısız.");
    }
  };

  const handleSelectGroup = (group: WordGroup) => {
    setActiveGroup(group);
    setView(ViewState.EDITOR);
  };

  const handleStartQuiz = (group: WordGroup) => {
    setActiveGroup(group);
    setView(ViewState.QUIZ);
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
      setGroups(prev => prev.map(g => g.id === activeGroup.id ? updatedGroup : g));
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
      setGroups(prev => prev.map(g => g.id === activeGroup.id ? updatedGroup : g));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleDeleteWordFromGroup = async (wordId: string) => {
    if (!activeGroup) return;
    try {
      const { error } = await supabase
        .from('words')
        .delete()
        .eq('id', wordId);

      if (error) throw error;

      const updatedWords = activeGroup.words.filter(w => w.id !== wordId);
      const updatedGroup = { ...activeGroup, words: updatedWords };

      setActiveGroup(updatedGroup);
      setGroups(prev => prev.map(g => g.id === activeGroup.id ? updatedGroup : g));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };


  if (loadingAuth) {
    return (
      <div className="full-height-mobile bg-zinc-950 flex flex-col items-center justify-center text-white">
        <div className="relative">
          <Loader2 className="animate-spin w-10 h-10 text-purple-400" />
          <div className="absolute inset-0 w-10 h-10 bg-purple-500/20 rounded-full blur-xl" />
        </div>
        <p className="mt-4 text-zinc-400 text-sm animate-pulse">Yükleniyor...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Header only on non-quiz pages for immersive feel */}
      {view !== ViewState.QUIZ && (
        <header className="bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-30 safe-area-inset-top">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl flex items-center justify-center text-white ring-1 ring-zinc-700">
                <Languages size={20} />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-md flex items-center justify-center">
                  <Sparkles size={10} className="text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Wordingo
                </h1>
                <p className="text-xs text-zinc-500">AI Vocabulary App</p>
              </div>
            </div>

            {/* Desktop User Info */}
            <div className="hidden sm:flex items-center gap-4">
              <span className="text-sm text-zinc-500 truncate max-w-[200px]">
                {session?.user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-zinc-400 hover:text-white flex items-center gap-2 transition-colors px-3 py-2 rounded-lg hover:bg-zinc-900"
              >
                <LogOut size={16} />
                <span>Çıkış</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="sm:hidden p-2 -mr-2 text-zinc-400 active:text-white haptic-feedback"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>
      )}

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="ml-auto w-[280px] bg-zinc-900 border-l border-zinc-800 relative animate-slide-left flex flex-col safe-area-inset-top safe-area-inset-bottom">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <span className="font-semibold text-white">Menü</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 -mr-2 text-zinc-400 active:text-white haptic-feedback"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-4">
              <div className="bg-zinc-800/50 rounded-xl p-4 mb-4">
                <p className="text-xs text-zinc-500 mb-1">Giriş yapıldı:</p>
                <p className="text-sm text-zinc-200 truncate">{session?.user?.email}</p>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-zinc-500 uppercase tracking-wider px-2 mb-2">İstatistikler</div>
                <div className="bg-zinc-800/50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📚</span>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{groups.length}</p>
                    <p className="text-xs text-zinc-500">Kelime Grubu</p>
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🔤</span>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">
                      {groups.reduce((acc, g) => acc + g.words.length, 0)}
                    </p>
                    <p className="text-xs text-zinc-500">Toplam Kelime</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800 text-red-400 font-medium active:bg-zinc-700 transition-colors haptic-feedback"
              >
                <LogOut size={18} />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <Loader2 className="animate-spin text-zinc-500 w-8 h-8 mb-4" />
            <p className="text-zinc-500 text-sm">Veriler yükleniyor...</p>
          </div>
        ) : (
          <>
            {view === ViewState.DASHBOARD && (
              <WordGroupManager
                groups={groups}
                onCreateGroup={handleCreateGroup}
                onDeleteGroup={handleDeleteGroup}
                onSelectGroup={handleSelectGroup}
                onStartQuiz={handleStartQuiz}
              />
            )}

            {view === ViewState.EDITOR && activeGroup && (
              <WordGroupEditor
                group={activeGroup}
                onRenameGroup={handleRenameGroup}
                onAddWord={handleAddWordToGroup}
                onDeleteWord={handleDeleteWordFromGroup}
                onBack={() => setView(ViewState.DASHBOARD)}
              />
            )}

            {view === ViewState.QUIZ && activeGroup && (
              <Quiz
                group={activeGroup}
                onExit={() => setView(ViewState.DASHBOARD)}
              />
            )}
          </>
        )}
      </main>

      {/* Add slide-left animation */}
      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-left {
          animation: slideLeft 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;