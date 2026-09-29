import { useState, useEffect } from 'react';
import { Mail, MailWarning } from 'lucide-react';
import api from '../lib/axios';
import { ACCENT, SURFACE, SURFACE_2, BORDER, TEXT_SECONDARY, inter } from '../lib/theme';

interface Settings {
  default_sla_hours: number;
  mail_configured: boolean;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [slaHours, setSlaHours] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        setSettings(res.data);
        setSlaHours(String(res.data.default_sla_hours));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const res = await api.patch('/settings', { default_sla_hours: parseInt(slaHours, 10) });
      setSettings(res.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour des paramètres.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-theme-bg px-8 py-10" style={inter}>
      <div className="mb-8">
        <h1 className="text-4xl font-medium tracking-tight text-theme-text">Paramètres</h1>
        <p className="mt-2 text-sm" style={{ color: TEXT_SECONDARY }}>
          Configuration générale de la plateforme.
        </p>
      </div>

      {loading ? (
        <div className="rounded-[15px] border p-8 text-center text-sm" style={{ backgroundColor: SURFACE, borderColor: BORDER, color: TEXT_SECONDARY }}>
          Chargement des données...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
          <div className="rounded-[15px] border p-6" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
            <h2 className="text-sm font-semibold text-theme-text mb-1">Réclamations</h2>
            <p className="text-xs mb-4" style={{ color: TEXT_SECONDARY }}>
              Délai pré-rempli lors de la création d'une nouvelle catégorie. N'affecte pas les catégories existantes.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="sla" className="block text-sm font-medium mb-2 text-theme-text">
                  Délai SLA par défaut (heures)
                </label>
                <input
                  id="sla"
                  required
                  type="number"
                  min={1}
                  max={8760}
                  className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                  style={{ borderColor: BORDER }}
                  value={slaHours}
                  onChange={(e) => setSlaHours(e.target.value)}
                />
              </div>

              {error && (
                <div
                  className="p-3 rounded-lg text-sm border"
                  style={{ backgroundColor: 'rgba(244,63,94,0.1)', borderColor: 'rgba(244,63,94,0.3)', color: '#F43F5E' }}
                >
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: ACCENT }}>
                  Paramètres enregistrés avec succès.
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: ACCENT, color: '#031a12' }}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
          </div>

          <div className="rounded-[15px] border p-6" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
            <h2 className="text-sm font-semibold text-theme-text mb-1">Notifications email</h2>
            <p className="text-xs mb-4" style={{ color: TEXT_SECONDARY }}>
              Statut de l'envoi d'emails aux clients lors des changements de statut.
            </p>
            <div
              className="flex items-start gap-3 p-4 rounded-[8px] border"
              style={{
                backgroundColor: settings?.mail_configured ? 'rgba(16,185,129,0.08)' : SURFACE_2,
                borderColor: settings?.mail_configured ? 'rgba(16,185,129,0.3)' : BORDER,
              }}
            >
              {settings?.mail_configured ? (
                <Mail size={18} style={{ color: ACCENT }} className="shrink-0 mt-0.5" />
              ) : (
                <MailWarning size={18} style={{ color: '#F59E0B' }} className="shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium text-theme-text">
                  {settings?.mail_configured ? 'SMTP configuré' : 'Mode simulation'}
                </p>
                <p className="text-xs mt-1" style={{ color: TEXT_SECONDARY }}>
                  {settings?.mail_configured
                    ? 'Les emails sont réellement envoyés via le serveur SMTP configuré.'
                    : "Aucun serveur SMTP configuré (SMTP_HOST/PORT/USER/PASS) — les emails sont journalisés dans la console du serveur au lieu d'être envoyés."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
