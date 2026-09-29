import { useState, useEffect } from 'react';
import api from '../lib/axios';
import { ACCENT, SURFACE, BORDER, TEXT_SECONDARY, mono, inter } from '../lib/theme';

const DANGER = '#F43F5E';

interface AgentPerformance {
  id: number;
  nom: string;
  email: string;
  actif: boolean;
  totalAssigned: number;
  resolved: number;
  inProgress: number;
  slaBreached: number;
  avgResolutionDays: number;
}

export default function AdminAgents() {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/statistics/agents')
      .then((res) => setAgents(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-theme-bg px-8 py-10" style={inter}>
      <div className="mb-8">
        <h1 className="text-4xl font-medium tracking-tight text-theme-text">Performance des Agents</h1>
        <p className="mt-2 text-sm" style={{ color: TEXT_SECONDARY }}>
          Charge de travail et délais de résolution par agent.
        </p>
      </div>

      <div className="rounded-[15px] border overflow-hidden" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: TEXT_SECONDARY }}>Chargement des données...</div>
        ) : agents.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: TEXT_SECONDARY }}>Aucun agent trouvé.</div>
        ) : (
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Agent</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Statut</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Assignées</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>En cours</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Résolues</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Délai moyen</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>SLA en retard</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-t transition-colors hover:bg-theme-hover" style={{ borderColor: BORDER }}>
                  <td className="px-6 py-4 text-sm">
                    <p className="font-semibold text-theme-text">{a.nom}</p>
                    <p className="text-xs" style={{ color: TEXT_SECONDARY }}>{a.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        ...mono,
                        color: a.actif ? ACCENT : TEXT_SECONDARY,
                        backgroundColor: a.actif ? 'rgba(16,185,129,0.12)' : 'rgba(161,161,170,0.12)',
                      }}
                    >
                      {a.actif ? 'ACTIF' : 'INACTIF'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-theme-text" style={mono}>{a.totalAssigned}</td>
                  <td className="px-6 py-4 text-sm text-theme-text" style={mono}>{a.inProgress}</td>
                  <td className="px-6 py-4 text-sm text-theme-text" style={mono}>{a.resolved}</td>
                  <td className="px-6 py-4 text-sm text-theme-text" style={mono}>
                    {a.avgResolutionDays > 0 ? `${a.avgResolutionDays} j` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ ...mono, color: a.slaBreached > 0 ? DANGER : TEXT_SECONDARY }}>
                    {a.slaBreached}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
