import React, { useState, useEffect } from 'react';
import { Target, X, Plus, Minus, Check, Sparkles, Calendar, TrendingUp } from 'lucide-react';

interface DailyGoalModalProps {
  isOpen: boolean;
  currentGoal: number;
  onSave: (newGoal: number) => Promise<void>;
  onClose: () => void;
}

const PRESET_GOALS = [
  { value: 10, label: '10', subtitle: 'Rahat' },
  { value: 20, label: '20', subtitle: 'Önerilen' },
  { value: 30, label: '30', subtitle: 'Hızlı' },
  { value: 50, label: '50', subtitle: 'Yoğun' },
  { value: 100, label: '100', subtitle: 'Master' },
];

export const DailyGoalModal: React.FC<DailyGoalModalProps> = ({
  isOpen,
  currentGoal,
  onSave,
  onClose,
}) => {
  const [goal, setGoal] = useState<number>(currentGoal);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGoal(currentGoal || 20);
    }
  }, [isOpen, currentGoal]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleIncrement = (amount: number = 5) => {
    setGoal((prev) => Math.min(200, prev + amount));
  };

  const handleDecrement = (amount: number = 5) => {
    setGoal((prev) => Math.max(5, prev - amount));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setGoal(Math.min(200, Math.max(1, val)));
    } else {
      setGoal(5);
    }
  };

  const handleSave = async () => {
    const validatedGoal = Math.min(200, Math.max(5, goal));
    setIsSaving(true);
    try {
      await onSave(validatedGoal);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const weeklyProjection = goal * 7;
  const monthlyProjection = goal * 30;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={isSaving ? undefined : onClose}
      />

      {/* Dialog Body (Bottom sheet on mobile, centered card on desktop) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-dialog-title"
        className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 border-t sm:border border-slate-200/80 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl animate-slide-up sm:animate-scale-in safe-area-inset-bottom"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shadow-sm">
              <Target size={20} />
            </div>
            <div>
              <h2 id="goal-dialog-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Günlük Kelime Hedefi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Günde kaç yeni kelime çalışmak istersiniz?
              </p>
            </div>
          </div>
          <button
            onClick={isSaving ? undefined : onClose}
            className="w-10 h-10 min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Kapat"
            disabled={isSaving}
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Display */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 text-center mb-5">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handleDecrement(5)}
              disabled={goal <= 5 || isSaving}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-sm hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Hedefi 5 kelime azalt"
            >
              <Minus size={18} className="stroke-[2.5]" />
            </button>

            <div className="flex flex-col items-center justify-center min-w-[120px]">
              <input
                type="number"
                min={5}
                max={200}
                value={goal}
                onChange={handleInputChange}
                className="w-24 text-center text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white bg-transparent focus:outline-none tracking-tight font-sans selection:bg-blue-500"
                aria-label="Günlük kelime hedefi sayısı"
              />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                Kelime / Gün
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleIncrement(5)}
              disabled={goal >= 200 || isSaving}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-sm hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Hedefi 5 kelime artır"
            >
              <Plus size={18} className="stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Hızlı Seçim
          </label>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_GOALS.map((preset) => {
              const isSelected = goal === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setGoal(preset.value)}
                  className={`py-2 px-1 rounded-xl text-center transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold block">{preset.label}</span>
                  <span className={`text-[10px] block truncate ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    {preset.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Motivational Learning Projection */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Calendar size={15} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Haftalık Potansiyel</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">~{weeklyProjection} Kelime</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp size={15} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Aylık Dağarcık</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">~{monthlyProjection} Kelime</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors min-h-[44px]"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/25 active:scale-98 transition-all min-h-[44px]"
          >
            {isSaving ? (
              <span>Kaydediliyor...</span>
            ) : (
              <>
                <Check size={16} />
                <span>Hedefi Ayarla ({goal})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
