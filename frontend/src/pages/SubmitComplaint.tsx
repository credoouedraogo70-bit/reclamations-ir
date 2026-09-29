import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { ACCENT, SURFACE, BORDER, TEXT_SECONDARY, inter } from '../lib/theme';
import { Assistant } from '../components/Assistant';

interface Category {
  id: number;
  libelle: string;
}

interface SubmitResult {
  numero_ticket: string;
  sla_date_limite: string | null;
}

export default function SubmitComplaint() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [categorieId, setCategorieId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    api.get('/complaints/public/categories').then((res) => {
      setCategories(res.data);
      if (res.data.length > 0) setCategorieId(String(res.data[0].id));
    }).catch(() => setError('Impossible de charger les catégories.'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/complaints/public', {
        client_nom: nom.trim(),
        client_telephone: telephone.trim(),
        client_email: email.trim() || undefined,
        categorie_id: parseInt(categorieId, 10),
        description: description.trim(),
      });
      setResult(res.data);
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message[0] : message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center px-6 py-12" style={inter}>
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center text-center">
          <img src="/moov-africa-logo.png" alt="Moov Africa" className="h-16 mb-4 rounded-lg shadow" />
          <h1 className="text-2xl font-medium tracking-tight text-theme-text">Déposer une réclamation</h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_SECONDARY }}>
            Décrivez votre problème, nous vous attribuons un numéro de suivi immédiatement.
          </p>
        </div>

        <div className="rounded-[15px] border p-6" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
          {result ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                <span style={{ color: ACCENT }} className="text-2xl">✓</span>
              </div>
              <div>
                <p className="text-sm" style={{ color: TEXT_SECONDARY }}>Votre réclamation a bien été enregistrée.</p>
                <p className="mt-2 text-2xl font-semibold" style={{ color: ACCENT }}>{result.numero_ticket}</p>
                <p className="mt-1 text-xs" style={{ color: TEXT_SECONDARY }}>
                  Conservez ce numéro pour suivre l'avancement de votre dossier.
                </p>
              </div>
              <Link
                to="/track"
                className="inline-block mt-2 px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors"
                style={{ backgroundColor: ACCENT, color: '#031a12' }}
              >
                Suivre ma réclamation
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                type="text"
                placeholder="Nom complet"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
              <input
                required
                type="text"
                placeholder="Numéro de téléphone"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email (optionnel, pour être notifié)"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <select
                required
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={categorieId}
                onChange={(e) => setCategorieId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-theme-surface text-theme-text">{c.libelle}</option>
                ))}
              </select>
              <textarea
                required
                placeholder="Décrivez votre problème..."
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary h-28 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
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
                {loading ? 'Envoi en cours...' : 'Envoyer ma réclamation'}
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 text-sm">
          <Link to="/track" className="hover:underline" style={{ color: TEXT_SECONDARY }}>
            Suivre une réclamation existante
          </Link>
          <span style={{ color: TEXT_SECONDARY }}>·</span>
          <Link to="/login" className="hover:underline" style={{ color: TEXT_SECONDARY }}>
            ← Retour à la connexion
          </Link>
        </div>
      </div>

      <Assistant />
    </div>
  );
}
