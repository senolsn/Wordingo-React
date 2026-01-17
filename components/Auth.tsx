import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, LogIn, UserPlus, AlertCircle } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false); //Loading spinnerini tuttugumuz degisken.
  const [isLogin, setIsLogin] = useState(true); //Login mi Register mi onu tuttugumuz degisken.
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-white rounded-lg flex items-center justify-center text-zinc-950 font-bold text-2xl mb-4">
            LG
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {isLogin ? 'Hoş Geldiniz' : 'Hesap Oluştur'}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {isLogin
              ? 'Kelime hazinenizi geliştirmeye devam edin.'
              : 'Ücretsiz üye olun ve öğrenmeye başlayın.'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="text-sm font-medium text-zinc-300 block mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-white focus:ring-1 focus:ring-white focus:border-white outline-none placeholder:text-zinc-600 transition-all"
                placeholder="ornek@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-300 block mb-1">Şifre</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-white focus:ring-1 focus:ring-white focus:border-white outline-none placeholder:text-zinc-600 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-md">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-md bg-white px-3 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : isLogin ? (
              <span className="flex items-center gap-2"><LogIn size={18} /> Giriş Yap</span>
            ) : (
              <span className="flex items-center gap-2"><UserPlus size={18} /> Kayıt Ol</span>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            {isLogin
              ? 'Hesabınız yok mu? Kayıt olun.'
              : 'Zaten hesabınız var mı? Giriş yapın.'}
          </button>
        </div>
      </div>
    </div>
  );
};