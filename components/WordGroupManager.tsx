import React, { useState, useRef, useMemo, useEffect } from 'react';
import { WordGroup, Word } from '../types';
import {
  Plus,
  Upload,
  Wand2,
  FileDown,
  Trash2,
  BookOpen,
  Loader2,
  X,
  Sparkles,
  Search,
  Star,
  Play,
  Pencil,
  AlertCircle
} from 'lucide-react';
import { generateWordGroup } from '../services/geminiService';
import { LanguageBadge } from './LanguageBadge';

interface WordGroupManagerProps {
  groups: WordGroup[];
  onSelectGroup: (group: WordGroup) => void;
  onDeleteGroup: (id: string) => void;
  onCreateGroup: (group: WordGroup) => void;
  onStartQuiz: (group: WordGroup) => void;
  onStartFlashcard: (group: WordGroup) => void;
  onStartMistakesQuiz?: () => void;
  totalMistakes?: number;
  isAddDeckOpen?: boolean;
  onCloseAddDeck?: () => void;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const getLevelBadgeStyle = (level?: string) => {
  const l = (level || '').toUpperCase();
  if (l.includes('A1') || l.includes('A2')) {
    return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50';
  }
  if (l.includes('B1') || l.includes('B2')) {
    return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50';
  }
  if (l.includes('C1') || l.includes('C2')) {
    return 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/50';
  }
  return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50';
};

const WordGroupManager: React.FC<WordGroupManagerProps> = ({
  groups,
  onSelectGroup,
  onDeleteGroup,
  onCreateGroup,
  onStartQuiz,
  onStartFlashcard,
  onStartMistakesQuiz,
  totalMistakes = 0,
  isAddDeckOpen = false,
  onCloseAddDeck
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'A1-A2' | 'B1-B2' | 'C1-C2' | 'ai'>('all');

  const [newGroupName, setNewGroupName] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiLevel, setAiLevel] = useState('A1');
  const [aiCount, setAiCount] = useState(10);
  const [aiError, setAiError] = useState<string | null>(null);

  // Mobile action sheet
  const [showActionSheet, setShowActionSheet] = useState(false);

  useEffect(() => {
    if (isAddDeckOpen) {
      setShowActionSheet(true);
    }
  }, [isAddDeckOpen]);

  const handleCloseActionSheet = () => {
    setShowActionSheet(false);
    onCloseAddDeck?.();
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualCreate = () => {
    if (!newGroupName.trim()) return;
    const newGroup: WordGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name: newGroupName,
      description: 'Manuel Liste',
      level: 'Mix',
      words: [],
      createdAt: Date.now()
    };
    onCreateGroup(newGroup);
    setNewGroupName('');
    setShowCreateModal(false);
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,EN,TR\napple,elma\nrun,koşmak";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "kelime_sablonu.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n');
      const words: Word[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [en, tr] = line.split(',');
        if (en && tr) {
          words.push({
            id: Math.random().toString(36).substr(2, 9),
            en: en.trim(),
            tr: tr.trim()
          });
        }
      }

      if (words.length > 0) {
        const newGroup: WordGroup = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name.replace('.csv', '').replace('.xlsx', ''),
          description: 'Excel/CSV',
          level: 'Mix',
          words: words,
          createdAt: Date.now()
        };
        onCreateGroup(newGroup);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowActionSheet(false);
  };

  const handleAIGenerate = async () => {
    if (!aiTopic) return;
    setIsGenerating(true);
    try {
      const generatedWords = await generateWordGroup(aiTopic, aiLevel, aiCount);
      const newGroup: WordGroup = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${aiTopic} (${aiLevel})`,
        description: 'AI Generated',
        level: aiLevel,
        words: generatedWords,
        createdAt: Date.now()
      };
      onCreateGroup(newGroup);
      setShowAIModal(false);
      setAiTopic('');
      setAiError(null);
    } catch (error) {
      console.error("AI Generation error:", error);
      setAiError("Yapay zeka ile kelimeler üretilirken bir sorun oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setIsGenerating(false);
    }
  };

  const openManualModal = () => {
    handleCloseActionSheet();
    setTimeout(() => setShowCreateModal(true), 100);
  };

  const openAIModal = () => {
    handleCloseActionSheet();
    setTimeout(() => setShowAIModal(true), 100);
  };

  const triggerFileUpload = () => {
    handleCloseActionSheet();
    fileInputRef.current?.click();
  };

  // Filtered groups
  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const matchesSearch =
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.words.some(
          (w) =>
            w.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.tr.toLowerCase().includes(searchQuery.toLowerCase())
        );

      if (!matchesSearch) return false;

      if (selectedFilter === 'A1-A2') {
        return group.level === 'A1' || group.level === 'A2';
      }
      if (selectedFilter === 'B1-B2') {
        return group.level === 'B1' || group.level === 'B2';
      }
      if (selectedFilter === 'C1-C2') {
        return group.level === 'C1' || group.level === 'C2';
      }
      if (selectedFilter === 'ai') {
        return group.description === 'AI Generated';
      }
      return true;
    });
  }, [groups, searchQuery, selectedFilter]);

  return (
    <div className="min-h-screen pb-24 md:pb-16 safe-area-inset-bottom">
      {/* Top Search & Filter Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-2">
        {/* Search Input */}
        <div className="relative mb-3.5">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={17} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kelime grubu veya kelime arayın..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Tümü ({groups.length})
          </button>
          <button
            onClick={() => setSelectedFilter('A1-A2')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
              selectedFilter === 'A1-A2'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            A1 - A2
          </button>
          <button
            onClick={() => setSelectedFilter('B1-B2')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
              selectedFilter === 'B1-B2'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            B1 - B2
          </button>
          <button
            onClick={() => setSelectedFilter('C1-C2')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
              selectedFilter === 'C1-C2'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            C1 - C2
          </button>
          <button
            onClick={() => setSelectedFilter('ai')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 flex items-center gap-1 ${
              selectedFilter === 'ai'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Sparkles size={11} />
            AI Grup
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 pt-2">
        {/* Desktop Quick Header */}
        <div className="hidden sm:flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Kelime Grupları
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {groups.length} kayıtlı grup · Çalışmak istediğiniz kelime grubunu seçin
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl hover:bg-slate-50 text-xs font-medium transition-colors shadow-sm"
            >
              <Plus size={15} />
              Manuel Ekle
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl hover:bg-slate-50 text-xs font-medium transition-colors shadow-sm"
            >
              <Upload size={15} />
              Excel Yükle
            </button>
            <button
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              <Wand2 size={15} />
              AI ile Üret
            </button>
          </div>
        </div>

        {/* ALL DECKS (Clean, calm list cards matching reference image) */}
        <div>
          <div className="mb-2.5 px-1">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {searchQuery ? `Arama Sonuçları (${filteredGroups.length})` : 'Tüm Kelime Grupları'}
            </h2>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="py-14 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center px-4">
              <BookOpen size={24} className="text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                {searchQuery ? 'Eşleşen kelime grubu bulunamadı' : 'Henüz kelime grubu oluşturmadınız'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {searchQuery
                  ? 'Farklı bir arama yapabilir veya yeni kelime grubu ekleyebilirsiniz.'
                  : 'AI ile otomatik veya manuel olarak ilk kelime grubunuzu ekleyin.'}
              </p>
              <button
                onClick={() => setShowAIModal(true)}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                <Wand2 size={13} />
                AI ile Yeni Grup
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 group"
                >
                  {/* Left: Level Squircle Tile + Title & Metadata */}
                  <div
                    onClick={() => onSelectGroup(group)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectGroup(group);
                      }
                    }}
                    aria-label={`${group.name} grubunu incele ve düzenle`}
                  >
                    {/* Deck Icon Tile */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${getLevelBadgeStyle(
                        group.level
                      )}`}
                      title={`Seviye: ${group.level || 'Mix'}`}
                    >
                      <BookOpen size={20} className="stroke-[2.2]" />
                    </div>

                    {/* Title & Metadata Line */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {group.name}
                      </h3>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {group.words.length} kelime
                        </span>
                        <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          EN ➔ TR
                        </span>
                        {(group.perfect_completion_count ?? 0) > 0 && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50"
                              title={`${group.perfect_completion_count} kez sıfır hatayla kusursuz tamamlandı`}
                            >
                              <Star size={11} className="fill-amber-400 text-amber-500" />
                              <span>{group.perfect_completion_count}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right / Bottom on mobile: Balanced Actions */}
                  <div className="flex items-center gap-2 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                    {/* Düzenle (Edit) Button */}
                    <button
                      type="button"
                      onClick={() => onSelectGroup(group)}
                      className="flex-1 sm:flex-initial px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      title="Grubu ve Kelimeleri Düzenle"
                      aria-label={`${group.name} grubunu düzenle`}
                    >
                      <Pencil size={13} />
                      <span>Düzenle</span>
                    </button>

                    {/* Flashcard Practice Button */}
                    <button
                      type="button"
                      onClick={() => onStartFlashcard(group)}
                      disabled={group.words.length < 1}
                      className={`flex-1 sm:flex-initial px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        group.words.length < 1
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                          : 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 active:scale-95'
                      }`}
                      title={group.words.length < 1 ? "Pratik için gruba kelime ekleyin" : "Kelime Kartı Pratiği"}
                      aria-label={`${group.name} grubunda flashcard pratiği başlat`}
                    >
                      <BookOpen size={13} />
                      <span>Pratik</span>
                    </button>

                    {/* Quiz Button */}
                    <button
                      type="button"
                      onClick={() => onStartQuiz(group)}
                      disabled={group.words.length < 1}
                      className={`flex-1 sm:flex-initial px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        group.words.length < 1
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:scale-95'
                      }`}
                      title={group.words.length < 1 ? "Quiz başlatmak için gruba kelime ekleyin" : "Quiz Başlat"}
                      aria-label={`${group.name} grubunda quiz başlat`}
                    >
                      <Play size={12} className="fill-current" />
                      <span>Quiz</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGroup(group.id);
                      }}
                      className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 shrink-0"
                      title="Kelime Grubunu Sil"
                      aria-label={`${group.name} grubunu sil`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Action Sheet */}
      {showActionSheet && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={handleCloseActionSheet}
          />
          <div className="mt-auto bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 relative animate-slide-up safe-area-inset-bottom p-5">
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Yeni Kelime Grubu</h3>
            <div className="space-y-2">
              <button
                onClick={openAIModal}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-left active:scale-98 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Wand2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI ile Kelime Grubu Üret</h4>
                  <p className="text-xs text-slate-500">Konu belirterek otomatik kelime listesi oluşturun</p>
                </div>
              </button>

              <button
                onClick={openManualModal}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-left active:scale-98 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                  <Plus size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Manuel Kelime Grubu</h4>
                  <p className="text-xs text-slate-500">Kendi kelimelerinizi tek tek ekleyin</p>
                </div>
              </button>

              <button
                onClick={triggerFileUpload}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-left active:scale-98 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                  <Upload size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Excel / CSV Yükle</h4>
                  <p className="text-xs text-slate-500">Tablonuzu doğrudan içe aktarın</p>
                </div>
              </button>
            </div>

            <button
              onClick={handleCloseActionSheet}
              className="w-full mt-3 py-2.5 text-slate-500 text-xs font-semibold"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Manual Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 animate-slide-up sm:animate-scale-in safe-area-inset-bottom shadow-xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Yeni Kelime Grubu</h2>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Kelime Grubu Adı
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: Günlük Konuşma Fiilleri"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800"
              >
                İptal
              </button>
              <button
                onClick={handleManualCreate}
                disabled={!newGroupName.trim()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => !isGenerating && setShowAIModal(false)}
          />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 animate-slide-up sm:animate-scale-in safe-area-inset-bottom shadow-xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                <Wand2 size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">AI Kelime Oluşturucu</h2>
                <p className="text-xs text-slate-500">Konu ve seviyeye göre liste hazırla</p>
              </div>
            </div>

            {aiError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle size={15} className="shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Konu / Tema
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Restoranda Yemek, İş Görüşmesi..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Seviye
                  </label>
                  <select
                    value={aiLevel}
                    onChange={(e) => setAiLevel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LEVELS.map((lvl) => {
                      const desc = lvl === 'A1' ? 'A1 - Başlangıç' : lvl === 'A2' ? 'A2 - Temel' : lvl === 'B1' ? 'B1 - Orta' : lvl === 'B2' ? 'B2 - İyi' : lvl === 'C1' ? 'C1 - İleri' : lvl === 'C2' ? 'C2 - Yetkin' : 'Karışık Seviye';
                      return (
                        <option key={lvl} value={lvl}>
                          {desc}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Kelime Sayısı
                  </label>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5 Kelime</option>
                    <option value={10}>10 Kelime</option>
                    <option value={15}>15 Kelime</option>
                    <option value={20}>20 Kelime</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={handleDownloadTemplate}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <FileDown size={13} />
                <span>CSV Şablonu</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAIModal(false)}
                  disabled={isGenerating}
                  className="py-2 px-3 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800"
                >
                  İptal
                </button>
                <button
                  onClick={handleAIGenerate}
                  disabled={isGenerating || !aiTopic.trim()}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Üretiliyor...</span>
                    </>
                  ) : (
                    <span>Üret</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default WordGroupManager;
