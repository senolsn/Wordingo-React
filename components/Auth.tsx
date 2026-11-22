import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, LogIn, UserPlus, AlertCircle, Languages, Sparkles, BookOpen, Target } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 safe-area-inset-top safe-area-inset-bottom">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 relative z-10">
        <div className="w-full max-w-sm">
          {/* Logo & Header */}
          <div className="text-center mb-8 animate-slide-down">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-3xl mb-4 shadow-xl shadow-blue-500/30 text-white relative">
              <Languages size={32} />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-700 rounded-xl flex items-center justify-center border-2 border-white dark:border-slate-900">
                <Sparkles size={12} className="text-amber-300" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5">
              {isLogin ? 'Tekrar Hoş Geldiniz' : 'Wordingo\'ya Katılın'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {isLogin
                ? 'Kelime hazinenizi geliştirmeye hemen devam edin'
                : 'Ücretsiz üye olun, kelime grupları oluşturun ve pratik yapın'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/50 dark:shadow-none animate-slide-up">
            <form className="space-y-4" onSubmit={handleAuth}>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  E-Posta Adresi
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  placeholder="ornek@email.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Şifre
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  placeholder="••••••••"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  minLength={6}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl animate-shake">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold transition-all active:scale-98 disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 text-xs mt-3"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : isLogin ? (
                  <>
                    <LogIn size={16} />
                    <span>Giriş Yap</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Hesap Oluştur</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Toggle Login / Register */}
          <div className="text-center mt-5">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1.5"
            >
              {isLogin
                ? 'Hesabınız yok mu? Hemen ücretsiz kayıt olun'
                : 'Zaten hesabınız var mı? Giriş yapın'}
            </button>
          </div>

          {/* Value Props */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
              <div className="w-8 h-8 mx-auto bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center mb-1 text-blue-600">
                <Sparkles size={16} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">AI Destekli</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
              <div className="w-8 h-8 mx-auto bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center mb-1 text-blue-600">
                <BookOpen size={16} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Kelime Grupları</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
              <div className="w-8 h-8 mx-auto bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center mb-1 text-blue-600">
                <Target size={16} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Akıllı Quiz</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-600 font-medium">
          Wordingo — Modern AI Vocabulary Master
        </p>
      </div>
    </div>
  );
};
