import React, { useState, useEffect } from 'react';
import { WordGroup, ViewState, Word } from './types';
import WordGroupManager from './components/WordGroupManager';
import WordGroupEditor from './components/WordGroupEditor';
import Quiz from './components/Quiz';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabaseClient';
import { LogOut, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [groups, setGroups] = useState<WordGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<WordGroup | null>(null);
  const [loadingData, setLoadingData] = useState(false);

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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <Loader2 className="animate-spin w-8 h-8" />
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
        <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded flex items-center justify-center text-zinc-950 font-bold text-lg">
                EN
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight hidden sm:block">
                @Codeweh - AI Vocabulary App
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-500 hidden sm:inline">Welcome @Codeweh</span>
              <button
                onClick={handleLogout}
                className="text-sm text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Çıkış</span>
              </button>
            </div>
          </div>
        </header>
      )}

      <main>
        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-zinc-500 w-8 h-8" />
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
    </div>
  );
};

export default App;