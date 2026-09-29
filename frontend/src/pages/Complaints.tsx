import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import api from '../lib/axios';
import { ACCENT, SURFACE, BORDER, TEXT, TEXT_SECONDARY, mono, inter } from '../lib/theme';
import { getSlaBadge } from '../lib/sla';
import { PRIORITY_STYLES, getPriorityBadge } from '../lib/priority';

const PAGE_SIZE = 10;
const DANGER = '#F43F5E';

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'NOUVEAU', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
  IN_PROGRESS: { label: 'EN COURS', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  RESOLVED: { label: 'RÉSOLU', color: ACCENT, bg: 'rgba(16,185,129,0.12)' },
};

export default function Complaints() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('statut') ?? '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState(searchParams.get('agent_assigne_id') ?? '');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [slaBreachedFilter, setSlaBreachedFilter] = useState(searchParams.get('sla_breached') === 'true');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({ client_nom: '', client_telephone: '', client_email: '', canal_origine: 'Agence', categorie_id: '', description: '', priorite: 'MEDIUM' });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const searchParamsKey = searchParams.toString();
  useEffect(() => {
    setStatusFilter(searchParams.get('statut') ?? '');
    setAgentFilter(searchParams.get('agent_assigne_id') ?? '');
    setSlaBreachedFilter(searchParams.get('sla_breached') === 'true');
    setPage(1);
  }, [searchParamsKey]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints', {
        params: {
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
          statut: statusFilter || undefined,
          categorie_id: categoryFilter || undefined,
          agent_assigne_id: agentFilter || undefined,
          priorite: priorityFilter || undefined,
          sla_breached: slaBreachedFilter || undefined,
        },
      });
      setComplaints(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Erreur", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [resCat, resAgents] = await Promise.all([api.get('/categories'), api.get('/users')]);
      setCategories(resCat.data);
      setAgents(resAgents.data);
      if (resCat.data.length > 0) setFormData(prev => ({ ...prev, categorie_id: resCat.data[0].id }));
    } catch (err) {
      console.error("Erreur", err);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [page, debouncedSearch, statusFilter, categoryFilter, agentFilter, priorityFilter, slaBreachedFilter]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const res = await api.get(`/complaints/export/${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reclamations.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'export');
    }
  };

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/complaints', {
        ...formData,
        client_email: formData.client_email.trim() || undefined,
        categorie_id: parseInt(formData.categorie_id),
        numero_ticket: `TICK-${Math.floor(Math.random() * 100000)}`
      });
      setIsModalOpen(false);
      fetchComplaints();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-theme-bg px-8 py-10" style={inter}>
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-medium tracking-tight text-theme-text">Réclamations</h1>
          <p className="mt-2 text-sm" style={{ color: TEXT_SECONDARY }}>
            Gérez et suivez toutes les réclamations clients.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 rounded-[8px] border text-sm font-medium transition-colors hover:border-emerald-800"
            style={{ backgroundColor: SURFACE, borderColor: BORDER, color: TEXT }}
          >
            Exporter CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2 rounded-[8px] border text-sm font-medium transition-colors hover:border-emerald-800"
            style={{ backgroundColor: SURFACE, borderColor: BORDER, color: TEXT }}
          >
            Exporter PDF
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors"
            style={{ backgroundColor: ACCENT, color: '#031a12' }}
          >
            Nouvelle réclamation
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-theme-overlay flex items-center justify-center p-4 z-50">
          <div className="rounded-[15px] p-6 w-full max-w-lg border" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
            <h2 className="text-xl font-semibold mb-4 text-theme-text">Créer une réclamation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                type="text"
                placeholder="Nom du client"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={formData.client_nom}
                onChange={e => setFormData({ ...formData, client_nom: e.target.value })}
              />
              <input
                required
                type="text"
                placeholder="Téléphone"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={formData.client_telephone}
                onChange={e => setFormData({ ...formData, client_telephone: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email du client (optionnel, pour les notifications)"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={formData.client_email}
                onChange={e => setFormData({ ...formData, client_email: e.target.value })}
              />
              <select
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={formData.categorie_id}
                onChange={e => setFormData({ ...formData, categorie_id: e.target.value })}
              >
                {categories.map(c => <option key={c.id} value={c.id} className="bg-theme-surface">{c.libelle}</option>)}
              </select>
              <select
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={formData.priorite}
                onChange={e => setFormData({ ...formData, priorite: e.target.value })}
              >
                <option value="LOW" className="bg-theme-surface">Priorité basse</option>
                <option value="MEDIUM" className="bg-theme-surface">Priorité moyenne</option>
                <option value="HIGH" className="bg-theme-surface">Priorité haute</option>
                <option value="URGENT" className="bg-theme-surface">Priorité urgente</option>
              </select>
              <textarea
                required
                placeholder="Description..."
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary h-24 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-[8px] border text-sm font-medium transition-colors"
                  style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[8px] text-sm font-semibold"
                  style={{ backgroundColor: ACCENT, color: '#031a12' }}
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-[15px] border overflow-hidden" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
        <div className="p-4 border-b flex items-center flex-wrap gap-3" style={{ borderColor: BORDER }}>
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} style={{ color: TEXT_SECONDARY }} />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un ticket ou un client..."
              className="w-full pl-10 pr-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition-shadow text-sm"
              style={{ borderColor: BORDER }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={handleFilterChange(setStatusFilter)}
            className="px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            style={{ borderColor: BORDER }}
          >
            <option value="" className="bg-theme-surface">Tous les statuts</option>
            <option value="NEW" className="bg-theme-surface">Nouveau</option>
            <option value="IN_PROGRESS" className="bg-theme-surface">En cours</option>
            <option value="RESOLVED" className="bg-theme-surface">Résolu</option>
          </select>
          <select
            value={categoryFilter}
            onChange={handleFilterChange(setCategoryFilter)}
            className="px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            style={{ borderColor: BORDER }}
          >
            <option value="" className="bg-theme-surface">Toutes les catégories</option>
            {categories.map(c => <option key={c.id} value={c.id} className="bg-theme-surface">{c.libelle}</option>)}
          </select>
          <select
            value={agentFilter}
            onChange={handleFilterChange(setAgentFilter)}
            className="px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            style={{ borderColor: BORDER }}
          >
            <option value="" className="bg-theme-surface">Tous les agents</option>
            {agents.map((a: any) => <option key={a.id} value={a.id} className="bg-theme-surface">{a.nom}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={handleFilterChange(setPriorityFilter)}
            className="px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            style={{ borderColor: BORDER }}
          >
            <option value="" className="bg-theme-surface">Toutes les priorités</option>
            <option value="LOW" className="bg-theme-surface">Basse</option>
            <option value="MEDIUM" className="bg-theme-surface">Moyenne</option>
            <option value="HIGH" className="bg-theme-surface">Haute</option>
            <option value="URGENT" className="bg-theme-surface">Urgente</option>
          </select>
          <button
            type="button"
            onClick={() => { setSlaBreachedFilter(v => !v); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border text-sm font-medium transition-colors"
            style={slaBreachedFilter
              ? { backgroundColor: 'rgba(244,63,94,0.12)', borderColor: 'rgba(244,63,94,0.4)', color: DANGER }
              : { backgroundColor: 'transparent', borderColor: BORDER, color: TEXT_SECONDARY }}
          >
            <ShieldAlert size={14} />
            SLA en retard
          </button>
        </div>
        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: TEXT_SECONDARY }}>Chargement des données...</div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: TEXT_SECONDARY }}>Aucune réclamation trouvée.</div>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Ticket</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Client</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Catégorie</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Statut</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Priorité</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>SLA</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => {
                  const status = STATUS_STYLES[c.statut] || { label: c.statut, color: TEXT_SECONDARY, bg: 'rgba(161,161,170,0.12)' };
                  const slaBadge = getSlaBadge(c.sla_status);
                  const priorityBadge = getPriorityBadge(c.priorite) || PRIORITY_STYLES.MEDIUM;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/complaints/${c.id}`)}
                      className="cursor-pointer transition-colors hover:bg-theme-hover border-t"
                      style={{ borderColor: BORDER }}
                    >
                      <td className="px-6 py-4 text-sm font-semibold" style={{ ...mono, color: ACCENT }}>{c.numero_ticket}</td>
                      <td className="px-6 py-4 text-sm text-theme-text">{c.client_nom}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: TEXT_SECONDARY }}>{c.category?.libelle || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ ...mono, color: status.color, backgroundColor: status.bg }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ ...mono, color: priorityBadge.color, backgroundColor: priorityBadge.bg }}
                        >
                          {priorityBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {slaBadge ? (
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ ...mono, color: slaBadge.color, backgroundColor: slaBadge.bg }}
                          >
                            {slaBadge.label}
                          </span>
                        ) : (
                          <span style={{ color: TEXT_SECONDARY }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && total > 0 && (
          <div className="px-6 py-4 border-t flex items-center justify-between flex-wrap gap-3" style={{ borderColor: BORDER }}>
            <p className="text-xs" style={{ ...mono, color: TEXT_SECONDARY }}>
              {total} réclamation{total > 1 ? 's' : ''} · page {page}/{totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-[8px] border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-[8px] border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
