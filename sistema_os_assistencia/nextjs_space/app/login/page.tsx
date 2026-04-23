'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import NextImage from 'next/image';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { if (d?.logoUrl) setLogoUrl(d.logoUrl); })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await signIn('credentials', {
        email: usuario.toLowerCase(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError('Usuário ou senha inválidos');
      } else {
        router.replace('/dashboard');
      }
    } catch {
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          {logoUrl ? (
            <div className="relative w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm shadow-2xl">
              <NextImage src={logoUrl} alt="DRT Informática" fill className="object-contain p-2" unoptimized />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <span className="text-2xl font-black text-white">DRT</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">Sistema de Gestão DRT</h1>
          <p className="text-blue-200/60 mt-1 text-sm">Assistência Técnica</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
          <h2 className="text-lg font-semibold text-white text-center mb-6">Entrar no Sistema</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/50" />
              <input
                type="text"
                name="email"
                placeholder="Usuário"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-blue-200/30 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                autoComplete="username"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/50" />
              <input
                type="password"
                name="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-blue-200/30 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/30"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Entrar
            </button>
          </form>
        </div>

        <p className="text-center text-blue-200/30 text-xs mt-6">DRT Informática &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}