import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { ACCENT, SURFACE, BORDER, TEXT_SECONDARY, inter } from '../lib/theme';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
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
          <h1 className="text-2xl font-medium tracking-tight text-theme-text">Mot de passe oublié</h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_SECONDARY }}>
            Entrez votre adresse email, nous vous enverrons un lien de réinitialisation.
          </p>
        </div>

        <div className="rounded-[15px] border p-6" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-theme-text">
                Si un compte existe avec cette adresse, un email vient de lui être envoyé avec un lien de réinitialisation valable 1 heure.
              </p>
              <Link to="/login" className="inline-block text-sm hover:underline" style={{ color: ACCENT }}>
                ← Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                type="email"
                placeholder="Adresse email"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </button>

              <p className="text-center text-sm">
                <Link to="/login" className="hover:underline" style={{ color: TEXT_SECONDARY }}>
                  ← Retour à la connexion
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
