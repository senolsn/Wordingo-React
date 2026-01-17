import React, { useState, useRef, useEffect } from 'react';
import { WordGroup, Word } from '../types';
import { ArrowLeft, Plus, Trash2, Loader2, Search, X, Check } from 'lucide-react';

interface WordGroupEditorProps {
  group: WordGroup;
  onRenameGroup: (newName: string) => Promise<void>;
  onAddWord: (en: string, tr: string) => Promise<void>;
  onDeleteWord: (id: string) => Promise<void>;
  onBack: () => void;
}

const WordGroupEditor: React.FC<WordGroupEditorProps> = ({ group, onRenameGroup, onAddWord, onDeleteWord, onBack }) => {
  const [newEn, setNewEn] = useState('');
  const [newTr, setNewTr] = useState('');
  const [groupName, setGroupName] = useState(group.name);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const enInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus on English input when add form opens
  useEffect(() => {
    if (showAddForm && enInputRef.current) {
      setTimeout(() => enInputRef.current?.focus(), 100);
    }
  }, [showAddForm]);

  const handleAddWord = async () => {
    if (!newEn.trim() || !newTr.trim()) return;
    setIsAdding(true);
    try {
      await onAddWord(newEn.trim(), newTr.trim());
      setNewEn('');
      setNewTr('');
      // Keep form open for quick adding
      enInputRef.current?.focus();
      // Scroll to top to see new word
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    } catch (e) {
      console.error(e);
      alert('Kelime eklenirken hata oluştu.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteWord = async (id: string) => {
    setIsDeletingId(id);
    try {
      await onDeleteWord(id);
      setShowDeleteConfirm(null);
    } catch (e) {
      console.error(e);
      alert('Kelime silinirken hata oluştu.');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSaveName = async () => {
    if (groupName !== group.name && groupName.trim()) {
      await onRenameGroup(groupName);
    }
  };

  // Filter words based on search
  const filteredWords = group.words.filter(word =>
    word.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    word.tr.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="full-height-mobile flex flex-col bg-zinc-950 text-zinc-100 safe-area-inset-top safe-area-inset-bottom">
      {/* Header */}
      <div className="flex-shrink-0 bg-zinc-950 border-b border-zinc-800">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 text-zinc-400 active:text-white active:bg-zinc-800 transition-colors haptic-feedback"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onBlur={handleSaveName}
              className="text-lg sm:text-xl font-bold bg-transparent w-full text-white placeholder-zinc-600 focus:outline-none border-b-2 border-transparent focus:border-zinc-700 transition-colors truncate py-1"
              placeholder="Grup adı..."
            />
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              {group.words.length} kelime
            </p>
          </div>
        </div>

        {/* Search Bar */}
        {group.words.length > 0 && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                placeholder="Kelime ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 active:text-white haptic-feedback"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Word List */}
      <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain">
        {group.words.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
            <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
              <Plus className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-2">Henüz kelime yok</h3>
            <p className="text-zinc-500 text-sm mb-6">Bu gruba kelimeler ekleyerek başlayın</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-white text-zinc-950 px-6 py-3 rounded-xl font-medium haptic-feedback active:scale-[0.98] transition-transform"
            >
              <Plus size={18} />
              İlk Kelimeyi Ekle
            </button>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-300 mb-1">Sonuç bulunamadı</h3>
            <p className="text-zinc-500 text-sm">"{searchQuery}" için eşleşme yok</p>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-2 animate-fade-in">
            {filteredWords.map((word, index) => (
              <div
                key={word.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-3 active:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-zinc-800 text-zinc-400 rounded-lg text-xs font-mono">
                    {group.words.length - group.words.findIndex(w => w.id === word.id)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white text-base truncate">{word.en}</p>
                    <p className="text-zinc-400 text-sm truncate">{word.tr}</p>
                  </div>
                </div>

                {showDeleteConfirm === word.id ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="p-2 text-zinc-400 active:text-white rounded-lg haptic-feedback"
                    >
                      <X size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteWord(word.id)}
                      disabled={isDeletingId === word.id}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg haptic-feedback"
                    >
                      {isDeletingId === word.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Check size={18} />
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(word.id)}
                    className="p-2 text-zinc-600 active:text-red-400 active:bg-zinc-800 rounded-lg transition-all haptic-feedback flex-shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Word FAB - Mobile */}
      {group.words.length > 0 && !showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-white text-zinc-950 rounded-2xl shadow-lg shadow-black/30 flex items-center justify-center haptic-feedback active:scale-95 transition-transform z-40"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Desktop Add Form (Always visible on tablet/desktop) */}
      <div className="hidden sm:block flex-shrink-0 border-t border-zinc-800 bg-zinc-900 p-4">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input
            placeholder="İngilizce (Örn: Apple)"
            className="flex-1 mobile-input"
            value={newEn}
            onChange={(e) => setNewEn(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
          />
          <input
            placeholder="Türkçe (Örn: Elma)"
            className="flex-1 mobile-input"
            value={newTr}
            onChange={(e) => setNewTr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
          />
          <button
            onClick={handleAddWord}
            disabled={isAdding || !newEn.trim() || !newTr.trim()}
            className="bg-white text-zinc-950 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 haptic-feedback min-w-[100px]"
          >
            {isAdding ? <Loader2 className="animate-spin" size={18} /> : <><Plus size={18} /> Ekle</>}
          </button>
        </div>
      </div>

      {/* Mobile Add Form Modal */}
      {showAddForm && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowAddForm(false)}
          />
          <div className="mt-auto bg-zinc-900 rounded-t-3xl border-t border-zinc-800 relative animate-slide-up safe-area-inset-bottom">
            <div className="pt-3 pb-2">
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto" />
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Kelime Ekle</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 -mr-2 text-zinc-400 active:text-white haptic-feedback"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">İngilizce</label>
                  <input
                    ref={enInputRef}
                    type="text"
                    placeholder="Örn: Apple"
                    className="mobile-input"
                    value={newEn}
                    onChange={(e) => setNewEn(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && document.getElementById('tr-input')?.focus()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Türkçe</label>
                  <input
                    id="tr-input"
                    type="text"
                    placeholder="Örn: Elma"
                    className="mobile-input"
                    value={newTr}
                    onChange={(e) => setNewTr(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                  />
                </div>
              </div>

              <button
                onClick={handleAddWord}
                disabled={isAdding || !newEn.trim() || !newTr.trim()}
                className="w-full bg-white text-zinc-950 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 haptic-feedback text-base"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Ekleniyor...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Ekle
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordGroupEditor;