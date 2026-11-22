import React, { useEffect } from 'react';
import { AlertCircle, Trash2, Loader2, X, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  isDestructive = true,
  isLoading = false,
  showCancel = true,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={isLoading ? undefined : onCancel}
      />

      {/* Sheet on Mobile (slides up from bottom), Centered Dialog on Desktop (scales in) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 border-t sm:border border-slate-200/80 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl animate-slide-up sm:animate-scale-in safe-area-inset-bottom"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-500 border border-rose-200/60 dark:border-rose-900/50'
                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 border border-blue-200/60 dark:border-blue-900/50'
            }`}
          >
            {isDestructive ? (
              <Trash2 size={18} />
            ) : showCancel ? (
              <AlertCircle size={18} />
            ) : (
              <Info size={18} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 id="confirm-dialog-title" className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
            <p id="confirm-dialog-desc" className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {description}
            </p>
          </div>

          <button
            onClick={isLoading ? undefined : onCancel}
            className="w-10 h-10 min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            disabled={isLoading}
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-3 sm:py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {cancelLabel}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 sm:py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98 disabled:opacity-50 shadow-sm min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>İşleniyor...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
