import React, { useState, useRef } from 'react';
import { WordGroup, Word } from '../types';
import { Plus, Upload, Wand2, FileDown, Trash2, BookOpen, Loader2, ArrowRight, X, Sparkles } from 'lucide-react';
import { generateWordGroup } from '../services/geminiService';

interface WordGroupManagerProps {
  groups: WordGroup[];
  onSelectGroup: (group: WordGroup) => void;
  onDeleteGroup: (id: string) => void;
  onCreateGroup: (group: WordGroup) => void;
  onStartQuiz: (group: WordGroup) => void;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const WordGroupManager: React.FC<WordGroupManagerProps> = ({
  groups,
  onSelectGroup,
  onDeleteGroup,
  onCreateGroup,
  onStartQuiz
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [newGroupName, setNewGroupName] = useState('');

  const [aiTopic, setAiTopic] = useState('');
  const [aiLevel, setAiLevel] = useState('A1');
  const [aiCount, setAiCount] = useState(10);

  // Mobile action sheet
  const [showActionSheet, setShowActionSheet] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualCreate = () => {
    if (!newGroupName.trim()) return;
    const newGroup: WordGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name: newGroupName,
      description: 'Manuel',
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
    } catch (error) {
      alert("AI hatası.");
    } finally {
      setIsGenerating(false);
    }
  };

  const openManualModal = () => {
    setShowActionSheet(false);
    setTimeout(() => setShowCreateModal(true), 100);
  };

  const openAIModal = () => {
    setShowActionSheet(false);
    setTimeout(() => setShowAIModal(true), 100);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen pb-24 safe-area-inset-bottom">
      {/* Header Section */}
      <div className="px-5 pt-6 pb-4 sm:px-6 sm:pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Kitaplık</h2>
              <p className="text-zinc-400 mt-1 text-sm sm:text-base">
                {groups.length === 0
                  ? 'Henüz grup oluşturmadınız'
                  : `${groups.length} kelime grubu`
                }
              </p>
            </div>

            {/* Desktop Buttons - Hidden on Mobile */}
            <div className="hidden sm:flex gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-zinc-900 text-zinc-100 border border-zinc-800 px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-all text-sm font-medium haptic-feedback"
              >
                <Plus size={16} />
                Manuel Ekle
              </button>
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-zinc-900 text-zinc-100 border border-zinc-800 px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-all text-sm font-medium haptic-feedback"
                >
                  <Upload size={16} />
                  Excel Yükle
                </button>
              </div>
              <button
                onClick={() => setShowAIModal(true)}
                className="flex items-center gap-2 bg-white text-zinc-950 px-4 py-2.5 rounded-xl hover:bg-zinc-200 shadow-sm transition-all text-sm font-medium haptic-feedback"
              >
                <Wand2 size={16} />
                AI Oluşturucu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-24 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed animate-fade-in">
            <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-2">Henüz grup yok</h3>
            <p className="text-zinc-500 text-center max-w-xs mb-6 text-sm">
              Kelime grupları oluşturarak öğrenmeye başlayın
            </p>
            <button
              onClick={() => setShowActionSheet(true)}
              className="sm:hidden flex items-center gap-2 bg-white text-zinc-950 px-6 py-3 rounded-xl font-medium haptic-feedback"
            >
              <Plus size={18} />
              İlk Grubu Oluştur
            </button>
            <button
              onClick={() => setShowAIModal(true)}
              className="hidden sm:flex items-center gap-2 bg-white text-zinc-950 px-6 py-3 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
            >
              <Wand2 size={18} />
              AI ile Oluştur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
            {groups.map((group, index) => (
              <div
                key={group.id}
                className="bg-zinc-900 rounded-2xl border border-zinc-800 transition-all duration-200 flex flex-col group animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-5 sm:p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {group.level}
                      </span>
                      {group.description === 'AI Generated' && (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                          <Sparkles size={10} className="text-zinc-400" />
                          AI
                        </span>
                      )}
                      {(group.perfect_completion_count ?? 0) > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          ★ {group.perfect_completion_count}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onDeleteGroup(group.id)}
                      className="p-2 -mr-2 text-zinc-600 hover:text-red-400 active:text-red-400 active:bg-zinc-800 rounded-lg transition-all haptic-feedback"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-2">{group.name}</h3>
                  <p className="text-zinc-500 text-sm mb-4 line-clamp-1">{group.description}</p>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                      <BookOpen size={14} />
                    </div>
                    <span className="font-medium">{group.words.length} Kelime</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 border-t border-zinc-800 flex gap-3">
                  <button
                    onClick={() => onSelectGroup(group)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 py-3 rounded-xl text-sm font-medium active:bg-zinc-700 transition-colors haptic-feedback"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => onStartQuiz(group)}
                    disabled={group.words.length < 4}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 haptic-feedback ${group.words.length < 4
                        ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                        : 'bg-white text-zinc-950 active:bg-zinc-200'
                      }`}
                  >
                    Quiz
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowActionSheet(true)}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-white text-zinc-950 rounded-2xl shadow-lg shadow-black/30 flex items-center justify-center haptic-feedback active:scale-95 transition-transform z-40 safe-area-inset-bottom"
      >
        <Plus size={24} />
      </button>

      {/* Mobile Action Sheet */}
      {showActionSheet && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowActionSheet(false)}
          />
          <div className="mt-auto bg-zinc-900 rounded-t-3xl border-t border-zinc-800 relative animate-slide-up safe-area-inset-bottom">
            <div className="pt-3 pb-2">
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto" />
            </div>
            <div className="px-5 py-4">
              <h3 className="text-lg font-semibold text-white mb-4">Yeni Grup Oluştur</h3>
              <div className="space-y-2">
                {/* AI Generate */}
                <button
                  onClick={openAIModal}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-zinc-600 active:scale-[0.98] transition-all haptic-feedback"
                >
                  <div className="w-12 h-12 rounded-xl bg-zinc-700 border border-zinc-600 flex items-center justify-center text-zinc-100">
                    <Wand2 size={22} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-white">AI Oluşturucu</h4>
                    <p className="text-sm text-zinc-400">Yapay zeka ile kelime listesi</p>
                  </div>
                </button>

                {/* Manual Create */}
                <button
                  onClick={openManualModal}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-800 border border-zinc-700 active:scale-[0.98] transition-transform haptic-feedback"
                >
                  <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center">
                    <Plus size={22} className="text-zinc-300" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-white">Manuel Ekle</h4>
                    <p className="text-sm text-zinc-400">Boş grup oluştur</p>
                  </div>
                </button>

                {/* CSV Upload */}
                <button
                  onClick={triggerFileUpload}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-800 border border-zinc-700 active:scale-[0.98] transition-transform haptic-feedback"
                >
                  <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center">
                    <Upload size={22} className="text-zinc-300" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-white">Excel/CSV Yükle</h4>
                    <p className="text-sm text-zinc-400">Dosyadan aktar</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowActionSheet(false)}
                className="w-full mt-4 py-4 text-zinc-400 font-medium active:text-white transition-colors haptic-feedback"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full sm:max-w-md bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up sm:animate-scale-in safe-area-inset-bottom sm:mx-4">
            <div className="sm:hidden w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6 -mt-2" />
            <h2 className="text-xl font-bold mb-6 text-white">Yeni Grup</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Grup İsmi</label>
              <input
                type="text"
                className="mobile-input"
                placeholder="Örn: Fiiller"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 text-zinc-400 font-medium active:text-white transition-colors haptic-feedback"
              >
                İptal
              </button>
              <button
                onClick={handleManualCreate}
                className="flex-1 py-3 bg-white text-zinc-950 rounded-xl font-medium active:bg-zinc-200 transition-colors haptic-feedback"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => !isGenerating && setShowAIModal(false)}
          />
          <div className="relative w-full sm:max-w-md bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up sm:animate-scale-in safe-area-inset-bottom sm:mx-4">
            <div className="sm:hidden w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6 -mt-2" />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100">
                <Wand2 size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Oluşturucu</h2>
                <p className="text-sm text-zinc-400">Yapay zeka ile kelime listesi</p>
              </div>
            </div>

            <div className="space-y-5 mb-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Konu</label>
                <input
                  type="text"
                  className="mobile-input"
                  placeholder="Örn: Teknoloji, Yemekler, Hayvanlar..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Seviye</label>
                  <select
                    value={aiLevel}
                    onChange={(e) => setAiLevel(e.target.value)}
                    className="mobile-input appearance-none"
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Sayı</label>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="mobile-input appearance-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <button
                onClick={handleDownloadTemplate}
                className="text-sm text-zinc-500 active:text-zinc-300 flex items-center gap-1 py-2 haptic-feedback"
              >
                <FileDown size={14} /> CSV Şablonu İndir
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAIModal(false)}
                  disabled={isGenerating}
                  className="flex-1 sm:flex-none py-3 px-6 text-zinc-400 font-medium active:text-white transition-colors haptic-feedback disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleAIGenerate}
                  disabled={isGenerating || !aiTopic}
                  className="flex-1 sm:flex-none py-3 px-6 bg-white text-zinc-950 rounded-xl font-medium active:bg-zinc-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-all haptic-feedback min-w-[100px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span className="hidden sm:inline">Üretiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Üret
                    </>
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