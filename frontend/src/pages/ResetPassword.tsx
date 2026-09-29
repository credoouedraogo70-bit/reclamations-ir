import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/axios';
import { ACCENT, SURFACE, BORDER, TEXT_SECONDARY, inter } from '../lib/theme';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center px-6 py-12" style={inter}>
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <img src="/moov-africa-logo.png" alt="Moov Africa" className="h-16 mb-4 rounded-lg shadow" />
          <h1 className="text-2xl font-medium tracking-tight text-theme-text">Réinitialiser le mot de passe</h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_SECONDARY }}>
            Choisissez un nouveau mot de passe pour votre compte.
          </p>
        </div>

        <div className="rounded-[15px] border p-6" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
          {!token ? (
            <div className="text-center space-y-3">
              <p className="text-sm" style={{ color: '#F43F5E' }}>Lien de réinitialisation invalide.</p>
              <Link to="/forgot-password" className="inline-block text-sm hover:underline" style={{ color: ACCENT }}>
                Demander un nouveau lien
              </Link>
            </div>
          ) : success ? (
            <div className="text-center space-y-2">
              <p className="text-sm text-theme-text">Mot de passe réinitialisé avec succès !</p>
              <p className="text-xs" style={{ color: TEXT_SECONDARY }}>Redirection vers la connexion...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                type="password"
                minLength={6}
                placeholder="Nouveau mot de passe"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                required
                type="password"
                minLength={6}
                placeholder="Confirmer le mot de passe"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {error && (
                <div
                  className="p-3 rounded-lg text-sm text-center border"
                  style={{ backgroundColor: 'rgba(244,63,94,0.1)', borderColor: 'rgba(244,63,94,0.3)', color: '#F43F5E' }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-[8px] text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: ACCENT, color: '#031a12' }}
              >
                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
