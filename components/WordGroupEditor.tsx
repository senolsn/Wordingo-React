import React, { useState, useRef, useEffect } from 'react';
import { WordGroup, Word } from '../types';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Search,
  X,
  Check,
  Volume2,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { LanguageBadge } from './LanguageBadge';

interface WordGroupEditorProps {
  group: WordGroup;
  onRenameGroup: (newName: string) => Promise<void>;
  onAddWord: (en: string, tr: string) => Promise<void>;
  onDeleteWord: (id: string) => Promise<void>;
  onBack: () => void;
}

const WordGroupEditor: React.FC<WordGroupEditorProps> = ({
  group,
  onRenameGroup,
  onAddWord,
  onDeleteWord,
  onBack
}) => {
  const [newEn, setNewEn] = useState('');
  const [newTr, setNewTr] = useState('');
  const [groupName, setGroupName] = useState(group.name);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [nameSavedFeedback, setNameSavedFeedback] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const enInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus on English input when add form opens
  useEffect(() => {
    if (showAddForm && enInputRef.current) {
      setTimeout(() => enInputRef.current?.focus(), 100);
    }
  }, [showAddForm]);

  const speakEnglish = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      setPlayingWord(text);
      utterance.onend = () => setPlayingWord(null);
      utterance.onerror = () => setPlayingWord(null);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis not available', e);
      setPlayingWord(null);
    }
  };

  const handleAddWord = async () => {
    if (!newEn.trim() || !newTr.trim()) return;
    setIsAdding(true);
    try {
      await onAddWord(newEn.trim(), newTr.trim());
      setNewEn('');
      setNewTr('');
      enInputRef.current?.focus();
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    } catch (e) {
      console.error(e);
      setEditorError('Kelime eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      setTimeout(() => setEditorError(null), 3000);
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
      setEditorError('Kelime silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      setTimeout(() => setEditorError(null), 3000);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSaveName = async () => {
    if (groupName !== group.name && groupName.trim()) {
      await onRenameGroup(groupName);
      setNameSavedFeedback(true);
      setTimeout(() => setNameSavedFeedback(false), 2000);
    }
  };

  const filteredWords = group.words.filter(
    (word) =>
      word.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.tr.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 safe-area-inset-top safe-area-inset-bottom">
      {/* Top Bar Header */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Geri Dön"
              aria-label="Desteler listesine geri dön"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onBlur={handleSaveName}
                  className="text-base sm:text-lg font-bold bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none border-b border-transparent focus:border-blue-500 transition-colors truncate max-w-[280px] sm:max-w-md"
                  placeholder="Deste adı..."
                  aria-label="Deste adı"
                />
                {nameSavedFeedback && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1 animate-fade-in shrink-0">
                    <Check size={12} /> Kaydedildi
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <LanguageBadge fromLang="en" toLang="tr" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  · {group.words.length} Kelime
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="sm:hidden flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm shadow-blue-500/25 active:scale-95 transition-all min-h-[44px]"
            aria-label="Yeni Kelime Ekle"
          >
            <Plus size={16} />
            <span>Ekle</span>
          </button>
        </div>

        {/* Search Bar in Deck */}
        {group.words.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Bu destede kelime ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-9 pr-9 py-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all min-h-[40px]"
                aria-label="Bu destede kelime ara"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Aramayı temizle"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Word List Area */}
      <div ref={listRef} className="flex-1 max-w-4xl w-full mx-auto p-4 pb-28 sm:pb-24 overflow-y-auto">
        {editorError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle size={16} className="shrink-0" />
            <span>{editorError}</span>
          </div>
        )}
        {group.words.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 mt-4">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <Plus size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Bu destede henüz kelime yok
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-xs">
              Aşağıdaki formu kullanarak İngilizce kelimeleri ve Türkçe anlamlarını ekleyin.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-md shadow-blue-500/25 active:scale-98 transition-all"
            >
              <Plus size={16} />
              İlk Kelimeyi Ekle
            </button>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Search className="w-10 h-10 text-slate-400 mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Sonuç bulunamadı</h3>
            <p className="text-xs text-slate-500 mt-0.5">"{searchQuery}" aramasıyla eşleşen kelime yok</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredWords.map((word, index) => (
              <div
                key={word.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono font-semibold shrink-0">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {word.en}
                      </span>
                      <button
                        onClick={() => speakEnglish(word.en)}
                        className={`w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors ${
                          playingWord === word.en ? 'text-blue-600 animate-pulse' : ''
                        }`}
                        title="Telaffuzu Dinle"
                        aria-label={`${word.en} telaffuzunu dinle`}
                      >
                        <Volume2 size={16} />
                      </button>
                      {(word.wrong_count ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50">
                          <AlertCircle size={11} />
                          {word.wrong_count} Yanlış
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {word.tr}
                    </p>
                  </div>
                </div>

                {showDeleteConfirm === word.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors"
                      aria-label="Silmekten vazgeç"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteWord(word.id)}
                      disabled={isDeletingId === word.id}
                      className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all min-h-[36px]"
                      aria-label={`${word.en} kelimesini silmeyi onayla`}
                    >
                      {isDeletingId === word.id ? (
                        <Loader2 className="animate-spin" size={13} />
                      ) : (
                        <>
                          <Check size={13} /> Sil
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(word.id)}
                    className="w-10 h-10 min-w-[40px] flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors rounded-xl shrink-0"
                    title="Kelimeyi Sil"
                    aria-label={`${word.en} kelimesini sil`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Quick Add Bar */}
      <div className="hidden sm:block fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <input
            placeholder="İngilizce kelime (Örn: Apple)"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newEn}
            onChange={(e) => setNewEn(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
          />
          <input
            placeholder="Türkçe karşılığı (Örn: Elma)"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newTr}
            onChange={(e) => setNewTr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
          />
          <button
            onClick={handleAddWord}
            disabled={isAdding || !newEn.trim() || !newTr.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/25 shrink-0"
          >
            {isAdding ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <>
                <Plus size={14} />
                <span>Ekle</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Add Word Sheet */}
      {showAddForm && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowAddForm(false)}
          />
          <div className="mt-auto bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 relative animate-slide-up safe-area-inset-bottom p-5 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Yeni Kelime Ekle</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  İngilizce
                </label>
                <input
                  ref={enInputRef}
                  type="text"
                  placeholder="Örn: Resilience"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newEn}
                  onChange={(e) => setNewEn(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Türkçe
                </label>
                <input
                  type="text"
                  placeholder="Örn: Direnç, dayanıklılık"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTr}
                  onChange={(e) => setNewTr(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                />
              </div>
            </div>

            <button
              onClick={handleAddWord}
              disabled={isAdding || !newEn.trim() || !newTr.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              {isAdding ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Ekleniyor...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Kelimeyi Ekle</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordGroupEditor;
