import { useState, useEffect } from 'react';
import api from '../lib/axios';
import { ACCENT, SURFACE, BORDER, TEXT_SECONDARY, mono, inter } from '../lib/theme';

interface Category {
  id: number;
  libelle: string;
  sla_delai_heures: number;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ libelle: '', sla_delai_heures: 48 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ libelle: '', sla_delai_heures: 48 });

  const fetchCategories = () => {
    api.get('/categories').then(res => setCategories(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchCategories();
    api.get('/settings')
      .then(res => setFormData(prev => ({ ...prev, sla_delai_heures: res.data.default_sla_hours })))
      .catch(console.error);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categories', formData);
      setIsModalOpen(false);
      setFormData({ libelle: '', sla_delai_heures: 48 });
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création de la catégorie');
    }
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditData({ libelle: c.libelle, sla_delai_heures: c.sla_delai_heures });
  };

  const handleUpdate = async (id: number) => {
    try {
      await api.patch(`/categories/${id}`, editData);
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour de la catégorie');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression (des réclamations utilisent peut-être cette catégorie)');
    }
  };

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-theme-bg px-8 py-10" style={inter}>
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-medium tracking-tight text-theme-text">Gestion des Catégories</h1>
          <p className="mt-2 text-sm" style={{ color: TEXT_SECONDARY }}>
            Liste des catégories de réclamations et délais de résolution.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors"
          style={{ backgroundColor: ACCENT, color: '#031a12' }}
        >
          Nouvelle catégorie
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-theme-overlay flex items-center justify-center p-4 z-50">
          <div className="rounded-[15px] p-6 w-full max-w-lg border" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
            <h2 className="text-xl font-semibold mb-4 text-theme-text">Créer une catégorie</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                required
                type="text"
                placeholder="Libellé"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={formData.libelle}
                onChange={e => setFormData({ ...formData, libelle: e.target.value })}
              />
              <input
                required
                type="number"
                min={1}
                placeholder="Délai SLA (heures)"
                className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={formData.sla_delai_heures}
                onChange={e => setFormData({ ...formData, sla_delai_heures: Number(e.target.value) })}
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
                  disabled={!formData.libelle.trim() || formData.sla_delai_heures < 1}
                  className="px-4 py-2 rounded-[8px] text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
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
        {categories.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: TEXT_SECONDARY }}>Aucune catégorie trouvée.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Libellé</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>SLA (Heures)</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} className="border-t transition-colors hover:bg-theme-hover" style={{ borderColor: BORDER }}>
                  {editingId === c.id ? (
                    <>
                      <td className="px-6 py-3 text-sm">
                        <input
                          type="text"
                          className="w-full px-2 py-1 rounded-[8px] border bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                          style={{ borderColor: BORDER }}
                          value={editData.libelle}
                          onChange={e => setEditData({ ...editData, libelle: e.target.value })}
                        />
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <input
                          type="number"
                          min={1}
                          className="w-24 px-2 py-1 rounded-[8px] border bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                          style={{ borderColor: BORDER }}
                          value={editData.sla_delai_heures}
                          onChange={e => setEditData({ ...editData, sla_delai_heures: Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-6 py-3 text-sm space-x-3">
                        <button
                          onClick={() => handleUpdate(c.id)}
                          disabled={!editData.libelle.trim() || editData.sla_delai_heures < 1}
                          className="hover:underline font-medium disabled:no-underline disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ color: ACCENT }}
                        >
                          Enregistrer
                        </button>
                        <button onClick={() => setEditingId(null)} className="hover:underline font-medium" style={{ color: TEXT_SECONDARY }}>Annuler</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm font-semibold text-theme-text">{c.libelle}</td>
                      <td className="px-6 py-4 text-sm" style={{ ...mono, color: TEXT_SECONDARY }}>{c.sla_delai_heures}h</td>
                      <td className="px-6 py-4 text-sm space-x-3">
                        <button onClick={() => startEdit(c)} className="hover:underline font-medium" style={{ color: ACCENT }}>Modifier</button>
                        <button onClick={() => handleDelete(c.id)} className="hover:underline font-medium text-rose-400">Supprimer</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
