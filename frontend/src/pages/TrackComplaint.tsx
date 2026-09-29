import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import api from '../lib/axios';
import { ACCENT, SURFACE, SURFACE_2, BORDER, TEXT_SECONDARY, mono, inter } from '../lib/theme';
import { getPriorityBadge, PRIORITY_STYLES } from '../lib/priority';
import { Assistant } from '../components/Assistant';

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'NOUVEAU', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
  IN_PROGRESS: { label: 'EN COURS', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  RESOLVED: { label: 'RÉSOLU', color: ACCENT, bg: 'rgba(16,185,129,0.12)' },
};

interface TrackResult {
  numero_ticket: string;
  statut: string;
  priorite: string;
  categorie: string;
  created_at: string;
  sla_date_limite: string | null;
  satisfaction_note: number | null;
  historique: { statut: string; date: string }[];
}

export default function TrackComplaint() {
  const [ticket, setTicket] = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);

  const [hoverNote, setHoverNote] = useState(0);
  const [selectedNote, setSelectedNote] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setSelectedNote(0);
    setRatingComment('');
    setRatingError('');
    try {
      const res = await api.get('/track', {
        params: { ticket: ticket.trim(), telephone: telephone.trim() },
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async () => {
    if (!result || selectedNote === 0) return;
    setRatingSubmitting(true);
    setRatingError('');
    try {
      await api.post('/track/rate', {
        ticket: result.numero_ticket,
        telephone: telephone.trim(),
        note: selectedNote,
        commentaire: ratingComment.trim() || undefined,
      });
      setResult({ ...result, satisfaction_note: selectedNote });
    } catch (err: any) {
      setRatingError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const status = result ? STATUS_STYLES[result.statut] || { label: result.statut, color: TEXT_SECONDARY, bg: 'rgba(161,161,170,0.12)' } : null;
  const priorityBadge = result ? getPriorityBadge(result.priorite) || PRIORITY_STYLES.MEDIUM : null;

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center px-6 py-12" style={inter}>
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center text-center">
          <img src="/moov-africa-logo.png" alt="Moov Africa" className="h-16 mb-4 rounded-lg shadow" />
          <h1 className="text-2xl font-medium tracking-tight text-theme-text">Suivre ma réclamation</h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_SECONDARY }}>
            Entrez votre numéro de ticket et votre téléphone pour voir l'état de votre dossier.
          </p>
        </div>

        <div className="rounded-[15px] border p-6" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              type="text"
              placeholder="Numéro de ticket (ex: TICK-12345)"
              className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              style={{ borderColor: BORDER }}
              value={ticket}
              onChange={e => setTicket(e.target.value)}
            />
            <input
              required
              type="text"
              placeholder="Numéro de téléphone"
              className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              style={{ borderColor: BORDER }}
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-[8px] text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: ACCENT, color: '#031a12' }}
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
          </form>

          {error && (
            <div
              className="mt-4 p-3 rounded-lg text-sm text-center border"
              style={{ backgroundColor: 'rgba(244,63,94,0.1)', borderColor: 'rgba(244,63,94,0.3)', color: '#F43F5E' }}
            >
              {error}
            </div>
          )}

          {result && status && priorityBadge && (
            <div className="mt-6 pt-6 border-t space-y-4" style={{ borderColor: BORDER }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold" style={{ ...mono, color: ACCENT }}>{result.numero_ticket}</span>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ ...mono, color: status.color, backgroundColor: status.bg }}>
                    {status.label}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ ...mono, color: priorityBadge.color, backgroundColor: priorityBadge.bg }}>
                    {priorityBadge.label}
                  </span>
                </div>
              </div>

              <div className="text-sm space-y-1" style={{ color: TEXT_SECONDARY }}>
                <p>Catégorie : <span className="text-theme-text">{result.categorie}</span></p>
                <p>Déposée le : <span className="text-theme-text">{new Date(result.created_at).toLocaleDateString('fr-FR')}</span></p>
                {result.sla_date_limite && (
                  <p>Traitement prévu avant le : <span className="text-theme-text">{new Date(result.sla_date_limite).toLocaleDateString('fr-FR')}</span></p>
                )}
              </div>

              {result.historique.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-[0.15em] font-semibold mb-2" style={{ ...mono, color: TEXT_SECONDARY }}>
                    Historique
                  </h3>
                  <div className="space-y-2">
                    {result.historique.map((h, i) => {
                      const s = STATUS_STYLES[h.statut] || { label: h.statut, color: TEXT_SECONDARY, bg: 'rgba(161,161,170,0.12)' };
                      return (
                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded-[8px]" style={{ backgroundColor: SURFACE_2 }}>
                          <span className="font-semibold" style={{ ...mono, color: s.color }}>{s.label}</span>
                          <span style={{ ...mono, color: TEXT_SECONDARY }}>{new Date(h.date).toLocaleString('fr-FR', { hour12: false })}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {result.statut === 'RESOLVED' && (
                <div className="pt-4 border-t" style={{ borderColor: BORDER }}>
                  {result.satisfaction_note !== null ? (
                    <div className="text-center">
                      <p className="text-sm mb-2" style={{ color: TEXT_SECONDARY }}>Merci pour votre retour !</p>
                      <div className="flex items-center justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={20}
                            fill={n <= result.satisfaction_note! ? ACCENT : 'none'}
                            style={{ color: ACCENT }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-center text-theme-text">Comment évaluez-vous votre expérience ?</p>
                      <div className="flex items-center justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setSelectedNote(n)}
                            onMouseEnter={() => setHoverNote(n)}
                            onMouseLeave={() => setHoverNote(0)}
                            aria-label={`Noter ${n} sur 5`}
                            className="p-0.5"
                          >
                            <Star
                              size={24}
                              fill={n <= (hoverNote || selectedNote) ? ACCENT : 'none'}
                              style={{ color: ACCENT }}
                            />
                          </button>
                        ))}
                      </div>
                      {selectedNote > 0 && (
                        <>
                          <textarea
                            placeholder="Un commentaire à ajouter ? (optionnel)"
                            className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary text-sm h-16 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                            style={{ borderColor: BORDER }}
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                          />
                          {ratingError && (
                            <p className="text-xs text-center" style={{ color: '#F43F5E' }}>{ratingError}</p>
                          )}
                          <button
                            type="button"
                            onClick={handleRate}
                            disabled={ratingSubmitting}
                            className="w-full px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: ACCENT, color: '#031a12' }}
                          >
                            {ratingSubmitting ? 'Envoi...' : 'Envoyer ma note'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center">
          <Link to="/login" className="text-sm hover:underline" style={{ color: TEXT_SECONDARY }}>
            ← Retour à la connexion
          </Link>
        </div>
      </div>

      <Assistant />
    </div>
  );
}
