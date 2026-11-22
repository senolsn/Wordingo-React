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
    <div className="full-height-mobile flex flex-col bg-zinc-950 safe-area-inset-top safe-area-inset-bottom">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 relative z-10">
        <div className="w-full max-w-sm">
          {/* Logo & Header */}
          <div className="text-center mb-10 animate-slide-down">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-2xl mb-6 shadow-xl relative">
              <Languages size={36} className="text-white" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center">
                <Sparkles size={14} className="text-zinc-200" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              {isLogin ? 'Hoş Geldiniz' : 'Hesap Oluştur'}
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base">
              {isLogin
                ? 'Kelime hazinenizi geliştirmeye devam edin'
                : 'Ücretsiz üye olun ve öğrenmeye başlayın'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl animate-slide-up">
            <form className="space-y-5" onSubmit={handleAuth}>
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mobile-input"
                  placeholder="ornek@email.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-2">Şifre</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mobile-input"
                  placeholder="••••••••"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  minLength={6}
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl animate-shake">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-zinc-950 py-4 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 haptic-feedback text-base mt-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : isLogin ? (
                  <>
                    <LogIn size={18} />
                    Giriş Yap
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Kayıt Ol
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Toggle Mode */}
          <div className="text-center mt-6 animate-fade-in">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm font-medium text-zinc-400 active:text-white transition-colors py-2 haptic-feedback"
            >
              {isLogin
                ? 'Hesabınız yok mu? Kayıt olun'
                : 'Zaten hesabınız var mı? Giriş yapın'}
            </button>
          </div>

          {/* Features Preview */}
          <div className="mt-10 grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-2 text-zinc-300">
                <Sparkles size={20} />
              </div>
              <p className="text-xs text-zinc-400 font-medium">AI Destekli</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-2 text-zinc-300">
                <BookOpen size={20} />
              </div>
              <p className="text-xs text-zinc-400 font-medium">Kelime Grupları</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-2 text-zinc-300">
                <Target size={20} />
              </div>
              <p className="text-xs text-zinc-400 font-medium">Akıllı Quiz</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-5 pb-6 text-center">
        <p className="text-xs text-zinc-400">
          Wordingo — The Minimalist Study Deck
        </p>
      </div>
    </div>
  );
};