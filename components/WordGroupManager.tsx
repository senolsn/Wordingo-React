import React, { useState, useRef } from 'react';
import { WordGroup, Word } from '../types';
import { Plus, Upload, Wand2, FileDown, Trash2, BookOpen, Loader2, ArrowRight } from 'lucide-react';
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Kitaplık</h2>
          <p className="text-zinc-400 mt-2">Kelime gruplarını yönet ve geliştir.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-zinc-900 text-zinc-100 border border-zinc-800 px-4 py-2.5 rounded-md hover:bg-zinc-800 transition-all text-sm font-medium"
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
              className="flex items-center gap-2 bg-zinc-900 text-zinc-100 border border-zinc-800 px-4 py-2.5 rounded-md hover:bg-zinc-800 transition-all text-sm font-medium"
            >
              <Upload size={16} />
              Excel Yükle
            </button>
          </div>
          <button 
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 bg-white text-zinc-950 px-4 py-2.5 rounded-md hover:bg-zinc-200 shadow-sm transition-all text-sm font-medium"
          >
            <Wand2 size={16} />
            AI Oluşturucu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.length === 0 && (
          <div className="col-span-full text-center py-24 bg-zinc-900/50 rounded-xl border border-zinc-800 border-dashed">
            <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-300">Henüz grup yok</h3>
            <p className="text-zinc-500 mt-1">Başlamak için yeni bir grup oluşturun.</p>
          </div>
        )}

        {groups.map(group => (
          <div key={group.id} className="bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-200 flex flex-col group">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {group.level}
                </span>
                <button onClick={() => onDeleteGroup(group.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{group.name}</h3>
              <p className="text-zinc-500 text-sm mb-6 line-clamp-2">{group.description}</p>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <BookOpen size={16} />
                <span>{group.words.length} Kelime</span>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800 flex gap-3">
              <button 
                onClick={() => onSelectGroup(group)}
                className="flex-1 bg-transparent border border-zinc-700 text-zinc-300 py-2 rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Düzenle
              </button>
              <button 
                onClick={() => onStartQuiz(group)}
                disabled={group.words.length < 4}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  group.words.length < 4 
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-white text-zinc-950 hover:bg-zinc-200'
                }`}
              >
                Quiz
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-white">Yeni Grup</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Grup İsmi</label>
              <input 
                type="text" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 text-white focus:ring-1 focus:ring-white focus:border-white outline-none transition-all placeholder:text-zinc-600"
                placeholder="Örn: Fiiller"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm">İptal</button>
              <button onClick={handleManualCreate} className="px-4 py-2 bg-white text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors text-sm font-medium">Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
              <Wand2 size={20} />
              AI Oluşturucu
            </h2>
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Konu</label>
                <input 
                  type="text" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 text-white focus:ring-1 focus:ring-white focus:border-white outline-none placeholder:text-zinc-600"
                  placeholder="Örn: Teknoloji"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Seviye</label>
                  <select 
                    value={aiLevel} 
                    onChange={(e) => setAiLevel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 text-white focus:ring-1 focus:ring-white outline-none"
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Sayı</label>
                  <select 
                    value={aiCount} 
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 text-white focus:ring-1 focus:ring-white outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
               <button 
                  onClick={handleDownloadTemplate} 
                  className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                >
                  <FileDown size={14} /> Şablon (CSV)
              </button>

              <div className="flex gap-3">
                <button onClick={() => setShowAIModal(false)} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm">İptal</button>
                <button 
                  onClick={handleAIGenerate} 
                  disabled={isGenerating || !aiTopic}
                  className="px-4 py-2 bg-white text-zinc-950 rounded-md hover:bg-zinc-200 disabled:opacity-50 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={16} /> : 'Üret'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordGroupManager;