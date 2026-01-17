import React, { useState } from 'react';
import { WordGroup, Word } from '../types';
import { ArrowLeft, Plus, Trash2, Loader2, Save } from 'lucide-react';

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

  const handleAddWord = async () => {
    if (!newEn.trim() || !newTr.trim()) return;
    setIsAdding(true);
    try {
      await onAddWord(newEn.trim(), newTr.trim());
      setNewEn('');
      setNewTr('');
      // Focus back to English input could go here
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
    } catch (e) {
      console.error(e);
      alert('Kelime silinirken hata oluştu.');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSaveName = async () => {
    if (groupName !== group.name) {
      await onRenameGroup(groupName);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto h-full flex flex-col text-zinc-100">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
            <input 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onBlur={handleSaveName}
              className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 focus:outline-none w-full text-white placeholder-zinc-600 transition-colors"
            />
            <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
               {group.words.length} kelime
            </p>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col overflow-hidden">
        {/* Add Word Bar */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex flex-col md:flex-row gap-3">
          <input 
            placeholder="İngilizce (Örn: Apple)" 
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-white focus:ring-1 focus:ring-white outline-none placeholder:text-zinc-600"
            value={newEn}
            onChange={(e) => setNewEn(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
          />
          <input 
            placeholder="Türkçe (Örn: Elma)" 
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-white focus:ring-1 focus:ring-white outline-none placeholder:text-zinc-600"
            value={newTr}
            onChange={(e) => setNewTr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
          />
          <button 
            onClick={handleAddWord}
            disabled={isAdding}
            className="bg-white text-zinc-950 px-6 py-2.5 rounded-md hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-70 min-w-[100px]"
          >
            {isAdding ? <Loader2 className="animate-spin" size={18} /> : <><Plus size={18} /> Ekle</>}
          </button>
        </div>

        {/* Word List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {group.words.length === 0 ? (
                <div className="text-center py-16 text-zinc-600">
                    <p>Bu grupta henüz kelime yok.</p>
                </div>
            ) : (
                group.words.map((word, index) => (
                    <div key={word.id} className="flex items-center justify-between p-3 hover:bg-zinc-800/50 rounded-lg group transition-colors">
                        <div className="flex items-center gap-4">
                            <span className="w-8 h-8 flex items-center justify-center bg-zinc-800 text-zinc-400 rounded-md text-xs font-mono">
                                {group.words.length - index}
                            </span>
                            <div>
                                <p className="font-medium text-zinc-200">{word.en}</p>
                                <p className="text-zinc-500 text-sm">{word.tr}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDeleteWord(word.id)}
                            disabled={isDeletingId === word.id}
                            className="p-2 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                        >
                            {isDeletingId === word.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default WordGroupEditor;