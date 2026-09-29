import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paperclip, Trash2, Star, ChevronDown } from 'lucide-react';
import api from '../lib/axios';
import { ACCENT, SURFACE, SURFACE_2, BORDER, TEXT_SECONDARY, mono, inter } from '../lib/theme';
import { getSlaBadge } from '../lib/sla';
import { PRIORITY_STYLES, getPriorityBadge } from '../lib/priority';

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'NEW', label: 'NOUVEAU', color: '#38BDF8' },
  { value: 'IN_PROGRESS', label: 'EN COURS', color: '#F59E0B' },
  { value: 'RESOLVED', label: 'RÉSOLU', color: ACCENT },
];

const STATUS_LABELS: Record<string, string> = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s.label]));

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  useEffect(() => {
    fetchComplaint();
    fetchAgents();
  }, [id]);

  const fetchAgents = async () => {
    try {
      const res = await api.get('/users');
      setAgents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComplaint = async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data);
      setSelectedAgentId(res.data.agent_assigne_id ? String(res.data.agent_assigne_id) : '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAgentId) return;
    try {
      await api.post(`/complaints/${id}/assign`, { agentId: Number(selectedAgentId) });
      fetchComplaint();
      setAssignSuccess(true);
      setTimeout(() => setAssignSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'assignation');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.post(`/complaints/${id}/status`, { statut: newStatus });
      fetchComplaint();
    } catch (err) {
      console.error(err);
      alert('Erreur lors du changement de statut');
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      await api.post(`/complaints/${id}/priority`, { priorite: newPriority });
      fetchComplaint();
    } catch (err) {
      console.error(err);
      alert('Erreur lors du changement de priorité');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      await api.post(`/complaints/${id}/attachments`, formData);
      fetchComplaint();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'envoi du fichier');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm('Supprimer cette pièce jointe ?')) return;
    try {
      await api.delete(`/complaints/${id}/attachments/${attachmentId}`);
      fetchComplaint();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression de la pièce jointe');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await api.post(`/complaints/${id}/comments`, { content: comment });
      setComment('');
      fetchComplaint();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'ajout du commentaire');
    }
  };

  if (loading) {
    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] bg-theme-bg flex items-center justify-center" style={mono}>
        <p className="text-sm tracking-widest uppercase" style={{ color: TEXT_SECONDARY }}>Chargement...</p>
      </div>
    );
  }
  if (!complaint) {
    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] bg-theme-bg flex items-center justify-center" style={mono}>
        <p className="text-sm tracking-widest uppercase text-red-400">Réclamation introuvable.</p>
      </div>
    );
  }

  const innerCardStyle = { backgroundColor: SURFACE_2, borderColor: BORDER };

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-theme-bg px-8 py-10" style={inter}>
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/complaints')}
          className="text-sm transition-colors hover:text-theme-text"
          style={{ color: TEXT_SECONDARY }}
        >
          ← Retour aux réclamations
        </button>

        <div className="rounded-[15px] border p-6" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
          <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-medium tracking-tight text-theme-text">Ticket {complaint.numero_ticket}</h1>
              <p className="text-sm mt-1" style={{ color: TEXT_SECONDARY }}>
                Client: {complaint.client_nom} ({complaint.client_telephone}{complaint.client_email ? ` · ${complaint.client_email}` : ''})
              </p>
              {(() => {
                const slaBadge = getSlaBadge(complaint.sla_status);
                if (!slaBadge || !complaint.sla_date_limite) return null;
                return (
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ ...mono, color: slaBadge.color, backgroundColor: slaBadge.bg }}
                    >
                      SLA: {slaBadge.label}
                    </span>
                    <span className="text-xs" style={{ ...mono, color: TEXT_SECONDARY }}>
                      échéance {new Date(complaint.sla_date_limite).toLocaleString('fr-FR', { hour12: false })}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap gap-2 justify-end">
                {STATUS_OPTIONS.map(s => {
                  const active = complaint.statut === s.value;
                  return (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(s.value)}
                      disabled={active}
                      className="px-3 py-1 text-xs font-semibold rounded-full transition-colors disabled:cursor-default"
                      style={{
                        ...mono,
                        backgroundColor: active ? s.color : 'rgba(161,161,170,0.12)',
                        color: active ? '#031a12' : TEXT_SECONDARY,
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <select
                value={complaint.priorite}
                onChange={e => handlePriorityChange(e.target.value)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{
                  ...mono,
                  color: (getPriorityBadge(complaint.priorite) || PRIORITY_STYLES.MEDIUM).color,
                  backgroundColor: (getPriorityBadge(complaint.priorite) || PRIORITY_STYLES.MEDIUM).bg,
                }}
              >
                <option value="LOW" className="bg-theme-surface text-theme-text">BASSE</option>
                <option value="MEDIUM" className="bg-theme-surface text-theme-text">MOYENNE</option>
                <option value="HIGH" className="bg-theme-surface text-theme-text">HAUTE</option>
                <option value="URGENT" className="bg-theme-surface text-theme-text">URGENTE</option>
              </select>
            </div>
          </div>

          <div className="rounded-[8px] p-4 mb-4 border" style={innerCardStyle}>
            <h3 className="text-xs uppercase tracking-[0.15em] font-semibold mb-2" style={{ ...mono, color: TEXT_SECONDARY }}>Description du problème</h3>
            <p className="text-theme-text whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {complaint.satisfaction_note != null && (
            <div className="rounded-[8px] p-4 mb-4 border" style={innerCardStyle}>
              <h3 className="text-xs uppercase tracking-[0.15em] font-semibold mb-2" style={{ ...mono, color: TEXT_SECONDARY }}>Satisfaction client</h3>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={16} fill={n <= complaint.satisfaction_note ? ACCENT : 'none'} style={{ color: ACCENT }} />
                  ))}
                </div>
                <span className="text-sm font-semibold" style={{ color: ACCENT }}>{complaint.satisfaction_note}/5</span>
              </div>
              {complaint.satisfaction_commentaire && (
                <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: TEXT_SECONDARY }}>"{complaint.satisfaction_commentaire}"</p>
              )}
            </div>
          )}

          <div className="rounded-[8px] p-4 mb-4 border flex items-center justify-between flex-wrap gap-3" style={innerCardStyle}>
            <div>
              <h3 className="text-xs uppercase tracking-[0.15em] font-semibold mb-1" style={{ ...mono, color: TEXT_SECONDARY }}>Agent assigné</h3>
              <p className="text-sm text-theme-text">{complaint.agentAssigned ? `${complaint.agentAssigned.nom} (${complaint.agentAssigned.email})` : 'Non assignée'}</p>
              {assignSuccess && (
                <p className="text-xs mt-1 font-medium" style={{ color: ACCENT }}>✓ Assignation effectuée avec succès</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <select
                className="px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                style={{ borderColor: BORDER }}
                value={selectedAgentId}
                onChange={e => setSelectedAgentId(e.target.value)}
              >
                <option value="" className="bg-theme-surface">Sélectionner un agent...</option>
                {agents.map((a: any) => (
                  <option key={a.id} value={a.id} className="bg-theme-surface">{a.nom}</option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={!selectedAgentId}
                className="px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: ACCENT, color: '#031a12' }}
              >
                Assigner
              </button>
            </div>
          </div>

          <div className="rounded-[8px] p-4 mb-6 border" style={innerCardStyle}>
            <h3 className="text-xs uppercase tracking-[0.15em] font-semibold mb-2" style={{ ...mono, color: TEXT_SECONDARY }}>Pièces jointes</h3>
            <div className="space-y-2 mb-3">
              {complaint.attachments?.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between gap-2">
                  <a
                    href={`${api.defaults.baseURL}${a.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:underline min-w-0 truncate"
                    style={{ color: ACCENT }}
                  >
                    <Paperclip size={14} className="shrink-0" /> <span className="truncate">{a.nom_fichier}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteAttachment(a.id)}
                    className="p-1 rounded transition-colors hover:text-rose-400 shrink-0"
                    style={{ color: TEXT_SECONDARY }}
                    title="Supprimer la pièce jointe"
                    aria-label="Supprimer la pièce jointe"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {(!complaint.attachments || complaint.attachments.length === 0) && (
                <p className="text-sm" style={{ color: TEXT_SECONDARY }}>Aucune pièce jointe.</p>
              )}
            </div>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-[8px] file:border-0 file:text-xs file:font-semibold file:cursor-pointer"
              style={{ color: TEXT_SECONDARY }}
            />
            {uploading && <p className="text-xs mt-1" style={{ color: TEXT_SECONDARY }}>Envoi en cours...</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <button
                type="button"
                onClick={() => setShowHistory((o) => !o)}
                className="w-full flex items-center gap-2 mb-4"
              >
                <h3 className="text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Historique des statuts</h3>
                <span className="text-xs" style={{ ...mono, color: TEXT_SECONDARY }}>({complaint.statusHistories.length})</span>
                <ChevronDown
                  size={14}
                  className="ml-auto transition-transform"
                  style={{ color: TEXT_SECONDARY, transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
              {showHistory && (
                <div className="space-y-3">
                  {complaint.statusHistories.map((h: any) => (
                    <div key={h.id} className="flex text-sm p-3 rounded-[8px] border justify-between gap-3" style={innerCardStyle}>
                      <div className="flex-1">
                        <span className="font-semibold text-theme-text">{h.user?.nom || 'Système'}</span>{' '}
                        <span style={{ color: TEXT_SECONDARY }}>a passé le statut de</span>{' '}
                        <span style={{ color: TEXT_SECONDARY }}>{STATUS_LABELS[h.ancien_statut] ?? h.ancien_statut}</span>{' '}
                        <span style={{ color: TEXT_SECONDARY }}>à</span>{' '}
                        <span className="font-bold" style={{ color: ACCENT }}>{STATUS_LABELS[h.nouveau_statut] ?? h.nouveau_statut}</span>
                      </div>
                      <div className="text-xs whitespace-nowrap" style={{ ...mono, color: TEXT_SECONDARY }}>{new Date(h.date_changement).toLocaleString('fr-FR', { hour12: false })}</div>
                    </div>
                  ))}
                  {complaint.statusHistories.length === 0 && <p className="text-sm" style={{ color: TEXT_SECONDARY }}>Aucun historique disponible.</p>}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-[0.15em] font-semibold mb-4" style={{ ...mono, color: TEXT_SECONDARY }}>Commentaires</h3>
              <form onSubmit={handleAddComment} className="mb-4">
                <textarea
                  placeholder="Ajouter une note ou un commentaire interne..."
                  className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text placeholder-theme-text-secondary text-sm h-20 resize-none mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                  style={{ borderColor: BORDER }}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!comment.trim()}
                  className="px-4 py-1.5 rounded-[8px] text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: ACCENT, color: '#031a12' }}
                >
                  Publier
                </button>
              </form>

              <div className="space-y-3">
                {complaint.comments.map((c: any) => (
                  <div key={c.id} className="text-sm p-3 rounded-[8px] border" style={innerCardStyle}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-theme-text">{c.user?.nom || 'Inconnu'}</span>
                      <span className="text-xs" style={{ ...mono, color: TEXT_SECONDARY }}>{new Date(c.created_at).toLocaleString('fr-FR', { hour12: false })}</span>
                    </div>
                    <p style={{ color: TEXT_SECONDARY }}>{c.contenu}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
