import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/axios';
import { ACCENT, SURFACE, BORDER, TEXT, TEXT_SECONDARY, INPUT_BG, mono, inter } from '../lib/theme';

const PAGE_SIZE = 10;

interface User {
  id: number;
  nom: string;
  email: string;
  role: string;
  statut: boolean;
}

const selectStyle = {
  backgroundColor: INPUT_BG,
  borderColor: BORDER,
  color: TEXT,
};

export default function AdminUsers() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'ADMIN';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({ nom: '', email: '', password: '', role: 'AGENT' });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', {
        params: { page, limit: PAGE_SIZE, search: debouncedSearch || undefined },
      });
      setUsers(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      setIsModalOpen(false);
      setFormData({ nom: '', email: '', password: '', role: 'AGENT' });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleRoleChange = async (id: number, role: string) => {
    try {
      await api.patch(`/users/${id}`, { role });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Erreur lors du changement de rôle');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await api.patch(`/users/${user.id}`, { statut: !user.statut });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    try {
      await api.patch(`/users/${resetPasswordUser.id}/password`, { password: newPassword });
      setResetPasswordUser(null);
      setNewPassword('');
      alert('Mot de passe réinitialisé avec succès.');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Erreur lors de la suppression (l\'utilisateur a peut-être des réclamations liées)');
    }
  };

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-theme-bg px-8 py-10" style={inter}>
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-medium tracking-tight text-theme-text">Gestion des Utilisateurs</h1>
          <p className="mt-2 text-sm" style={{ color: TEXT_SECONDARY }}>
            Liste des comptes administrateurs et agents.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors"
            style={{ backgroundColor: ACCENT, color: '#031a12' }}
          >
            Ajouter un utilisateur
          </button>
        )}
      </div>

      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-theme-overlay flex items-center justify-center p-4 z-50">
          <div className="rounded-[15px] p-6 w-full max-w-lg border" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
            <h2 className="text-xl font-semibold mb-4 text-theme-text">Créer un utilisateur</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                type="text"
                placeholder="Nom complet"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={formData.nom}
                onChange={e => setFormData({ ...formData, nom: e.target.value })}
              />
              <input
                required
                type="email"
                placeholder="Email"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
              <input
                required
                type="password"
                placeholder="Mot de passe"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
              <select
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="AGENT" className="bg-theme-surface">Agent</option>
                <option value="ADMIN" className="bg-theme-surface">Administrateur</option>
              </select>
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

      {resetPasswordUser && (
        <div className="fixed inset-0 bg-theme-overlay flex items-center justify-center p-4 z-50">
          <div className="rounded-[15px] p-6 w-full max-w-md border" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
            <h2 className="text-xl font-semibold mb-1 text-theme-text">Réinitialiser le mot de passe</h2>
            <p className="text-sm mb-4" style={{ color: TEXT_SECONDARY }}>{resetPasswordUser.nom} ({resetPasswordUser.email})</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                required
                type="password"
                minLength={6}
                placeholder="Nouveau mot de passe"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setResetPasswordUser(null); setNewPassword(''); }}
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
                  Réinitialiser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-[15px] border overflow-hidden" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
        <div className="p-4 border-b flex items-center" style={{ borderColor: BORDER }}>
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} style={{ color: TEXT_SECONDARY }} />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un nom ou un email..."
              className="w-full pl-10 pr-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition-shadow text-sm"
              style={{ borderColor: BORDER }}
            />
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: TEXT_SECONDARY }}>Chargement des données...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: TEXT_SECONDARY }}>Aucun utilisateur trouvé.</div>
        ) : (
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Nom</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Email</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Rôle</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Statut</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t transition-colors hover:bg-theme-hover" style={{ borderColor: BORDER }}>
                  <td className="px-6 py-4 text-sm font-semibold text-theme-text">{u.nom}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: TEXT_SECONDARY }}>{u.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      disabled={!isAdmin}
                      className="px-2 py-1 rounded-[8px] border text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      style={selectStyle}
                    >
                      <option value="AGENT" className="bg-theme-surface">Agent</option>
                      <option value="ADMIN" className="bg-theme-surface">Administrateur</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        ...mono,
                        color: u.statut ? ACCENT : TEXT_SECONDARY,
                        backgroundColor: u.statut ? 'rgba(16,185,129,0.12)' : 'rgba(161,161,170,0.12)',
                      }}
                    >
                      {u.statut ? 'ACTIF' : 'INACTIF'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-3">
                    {isAdmin && (
                      <>
                        <button onClick={() => handleToggleStatus(u)} className="hover:underline font-medium" style={{ color: ACCENT }}>
                          {u.statut ? 'Désactiver' : 'Activer'}
                        </button>
                        <button onClick={() => setResetPasswordUser(u)} className="hover:underline font-medium" style={{ color: TEXT_SECONDARY }}>
                          Réinitialiser MDP
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="hover:underline font-medium text-rose-400">
                          Supprimer
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && total > 0 && (
          <div className="px-6 py-4 border-t flex items-center justify-between flex-wrap gap-3" style={{ borderColor: BORDER }}>
            <p className="text-xs" style={{ ...mono, color: TEXT_SECONDARY }}>
              {total} utilisateur{total > 1 ? 's' : ''} · page {page}/{totalPages}
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
