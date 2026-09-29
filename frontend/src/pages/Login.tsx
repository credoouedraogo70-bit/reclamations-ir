import { useRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { Assistant } from '../components/Assistant';

interface GlowInputProps extends InputHTMLAttributes<HTMLInputElement> {}

function GlowInput({ className, ...rest }: GlowInputProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const setGlowX = (x: number) => {
    if (topRef.current) topRef.current.style.background = `radial-gradient(30px circle at ${x}px 0px, #60a5fa 0%, transparent 70%)`;
    if (bottomRef.current) bottomRef.current.style.background = `radial-gradient(30px circle at ${x}px 2px, #60a5fa 0%, transparent 70%)`;
  };

  const setGlowOpacity = (opacity: number) => {
    if (topRef.current) topRef.current.style.opacity = String(opacity);
    if (bottomRef.current) bottomRef.current.style.opacity = String(opacity);
  };

  return (
    <div className="relative w-full">
      <input
        {...rest}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setGlowX(e.clientX - rect.left);
        }}
        onMouseEnter={() => setGlowOpacity(1)}
        onMouseLeave={() => setGlowOpacity(0)}
        className={className}
      />
      <div ref={topRef} className="absolute pointer-events-none top-0 left-0 right-0 h-[2px] rounded-t-xl overflow-hidden opacity-0 transition-opacity" />
      <div ref={bottomRef} className="absolute pointer-events-none bottom-0 left-0 right-0 h-[2px] rounded-b-xl overflow-hidden opacity-0 transition-opacity" />
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'AGENT'>('ADMIN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const glowRef = useRef<HTMLDivElement>(null);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!glowRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    glowRef.current.style.transform = `translate(${x - 250}px, ${y - 250}px)`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: password.trim()
      });
      if (response.data.user.role !== role) {
        setError(
          role === 'ADMIN'
            ? "Ce compte n'est pas un compte administrateur. Sélectionnez l'onglet « Agent Service Client »."
            : "Ce compte n'est pas un compte agent. Sélectionnez l'onglet « Administrateur »."
        );
        setLoading(false);
        return;
      }
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        setError('Le serveur (Backend) n\'est pas accessible. Avez-vous lancé npm run dev à la racine ?');
      } else {
        setError('Email ou mot de passe incorrect.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Side panel with logo */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-gray-900 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="z-10 flex flex-col items-center text-center px-10">
          <img src="/moov-africa-logo.png" alt="Moov Africa" className="h-64 w-auto mb-2 rounded-xl shadow-lg" />
          <p className="mt-3 text-base text-gray-300 font-medium max-w-xs">
            Plateforme de gestion des réclamations
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div
        className="flex-1 relative flex items-center justify-center bg-gray-950 lg:bg-white px-6 py-12 overflow-hidden"
        onMouseMove={handleCardMouseMove}
        onMouseEnter={() => { if (glowRef.current) glowRef.current.style.opacity = '1'; }}
        onMouseLeave={() => { if (glowRef.current) glowRef.current.style.opacity = '0'; }}
      >
        <div
          ref={glowRef}
          className="hidden lg:block absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-blue-200/40 via-cyan-200/40 to-orange-200/30 rounded-full blur-3xl opacity-0 transition-opacity duration-200"
        />
        <div className="relative z-10 w-full max-w-md space-y-8">
          {/* Logo shown here only on small screens, where the side panel is hidden */}
          <div className="flex flex-col items-center text-center lg:hidden">
            <img src="/moov-africa-logo.png" alt="Moov Africa" className="h-40 w-auto mb-2 rounded-lg shadow" />
            <p className="mt-2 text-sm text-gray-300 lg:text-gray-500 font-medium">
              Plateforme de gestion des réclamations
            </p>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold text-white lg:text-gray-900">Connexion</h1>
            <p className="mt-1 text-sm text-gray-400 lg:text-gray-500">Accédez à votre espace de gestion.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 lg:bg-red-50 border border-red-500/50 lg:border-red-200 text-red-200 lg:text-red-700 text-sm rounded-lg text-center transition-all">
              {error}
            </div>
          )}

          <div className="flex p-1 bg-black/20 lg:bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRole('ADMIN')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${role === 'ADMIN' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white lg:text-gray-500 lg:hover:text-gray-900'}`}
            >
              Administrateur
            </button>
            <button
              type="button"
              onClick={() => setRole('AGENT')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${role === 'AGENT' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white lg:text-gray-500 lg:hover:text-gray-900'}`}
            >
              Agent Service Client
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="sr-only">Adresse Email</label>
                <GlowInput
                  id="email-address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 bg-black/20 lg:bg-gray-50 border border-white/10 lg:border-gray-200 placeholder-gray-400 text-white lg:text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="Adresse Email"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Mot de passe</label>
                <GlowInput
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 bg-black/20 lg:bg-gray-50 border border-white/10 lg:border-gray-200 placeholder-gray-400 text-white lg:text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="Mot de passe"
                />
              </div>
              {role === 'ADMIN' && (
                <p className="text-right">
                  <Link to="/forgot-password" className="text-sm text-gray-400 lg:text-gray-500 hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center overflow-hidden py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.35)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">{loading ? 'Connexion en cours...' : 'Se Connecter'}</span>
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] transition-transform duration-700 group-hover:duration-1000 group-hover:[transform:skew(-13deg)_translateX(100%)]">
                  <div className="relative h-full w-8 bg-white/20" />
                </div>
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400 lg:text-gray-500 space-x-3">
            <Link to="/submit" className="hover:underline">Déposer une réclamation</Link>
            <span>·</span>
            <Link to="/track" className="hover:underline">Suivre ma réclamation</Link>
          </p>
        </div>
      </div>

      <Assistant />
    </div>
  );
}
