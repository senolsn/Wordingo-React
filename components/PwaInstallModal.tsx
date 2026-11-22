import React, { useState, useEffect } from 'react';
import { Smartphone, X, Download, Share, PlusSquare, MoreVertical, Monitor, CheckCircle2 } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess,
}) => {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('android');
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setPlatform('ios');
      } else if (/android/.test(ua)) {
        setPlatform('android');
      } else {
        setPlatform('desktop');
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNativePrompt = async () => {
    if (!deferredPrompt) return;
    try {
      setIsInstalling(true);
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        onInstallSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Install prompt error:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
              <Smartphone size={22} />
            </div>
            <div>
              <h2 id="pwa-install-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Wordingo'yu Cihaza Yükle
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PWA ile tam ekran, hızlı ve mobil uygulama deneyimi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Direct Native Install Button (if Chrome / Edge beforeinstallprompt is active) */}
        {deferredPrompt && (
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Tek tıkla kuruluma hazır!</span>
            </div>
            <button
              type="button"
              onClick={handleNativePrompt}
              disabled={isInstalling}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} />
              {isInstalling ? 'Yükleniyor...' : 'Şimdi Yükle ve Ana Ekrana Ekle'}
            </button>
          </div>
        )}

        {/* Platform Selector Tabs */}
        <div>
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setPlatform('ios')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                platform === 'ios'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              iPhone / iPad (iOS)
            </button>
            <button
              type="button"
              onClick={() => setPlatform('android')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                platform === 'android'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Android (Chrome)
            </button>
            <button
              type="button"
              onClick={() => setPlatform('desktop')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                platform === 'desktop'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bilgisayar (Masaüstü)
            </button>
          </div>
        </div>

        {/* Platform Step-by-Step Instructions */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-xs space-y-3">
          {platform === 'ios' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  Safari'de alt menüdeki <span className="font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1"><Share size={12} /> Paylaş</span> simgesine dokunun.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  Aşağı kaydırıp <span className="font-semibold text-slate-900 dark:text-white inline-flex items-center gap-1"><PlusSquare size={12} /> Ana Ekrana Ekle</span> seçeneğine tıklayın.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  Sağ üstteki <span className="font-semibold text-slate-900 dark:text-white">"Ekle"</span> butonuna basın. Wordingo artık App Store uygulaması gibi ana ekranınızda hazır!
                </div>
              </div>
            </div>
          )}

          {platform === 'android' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  Chrome tarayıcısının sağ üstündeki <span className="font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5"><MoreVertical size={12} /> Üç Nokta</span> menüsüne dokunun.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white inline-flex items-center gap-1"><Download size={12} /> "Uygulamayı Yükle"</span> veya <span className="font-semibold text-slate-900 dark:text-white">"Ana Ekrana Ekle"</span> butonuna dokunun.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  Onay verin. Wordingo telefonunuza bağımsız bir uygulama olarak kurulacaktır.
                </div>
              </div>
            </div>
          )}

          {platform === 'desktop' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  Tarayıcınızın (Chrome, Edge, Brave) adres çubuğunun en sağındaki <span className="font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1"><Monitor size={12} /> Uygulama Yükle</span> simgesine tıklayın.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  Açılan onay penceresinde <span className="font-semibold text-slate-900 dark:text-white">"Yükle"</span> butonuna basın.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  Wordingo masaüstü simgesiyle ayrı bir pencerede hızlıca çalışır!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Footnote */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
          <span>App Store / Play Store indirmesi gerektirmez, doğrudan güncellenir.</span>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Anladım, Kapat
        </button>
      </div>
    </div>
  );
};
