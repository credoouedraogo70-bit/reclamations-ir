import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Clock, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import api from '../lib/axios';
import { ACCENT, SURFACE, SURFACE_2, BORDER, TEXT, TEXT_SECONDARY, PIE_COLORS, mono, inter } from '../lib/theme';

const DANGER = '#F43F5E';

const PERIOD_OPTIONS = [
  { value: 7, label: '7 derniers jours' },
  { value: 14, label: '14 derniers jours' },
  { value: 30, label: '30 derniers jours' },
  { value: 90, label: '90 derniers jours' },
];

interface DashboardStats {
  periodDays: number;
  totalComplaints: number;
  inProgress: number;
  resolvedInPeriod: number;
  avgResolutionDays: number;
  slaBreached: number;
  dailyComplaints: { date: string; count: number }[];
  byCategory: { name: string; value: number }[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await api.get('/statistics/dashboard', { params: { days } });
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [days]);

  if (loading && !stats) {
    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] bg-theme-bg flex items-center justify-center" style={mono}>
        <p className="text-sm tracking-widest uppercase" style={{ color: TEXT_SECONDARY }}>Chargement du flux...</p>
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] bg-theme-bg flex items-center justify-center" style={mono}>
        <p className="text-sm tracking-widest uppercase text-red-400">Flux de télémétrie indisponible.</p>
      </div>
    );
  }

  const dataLigne = stats.dailyComplaints.map((d) => ({
    name: new Date(d.date).toLocaleDateString('fr-FR', days <= 14 ? { weekday: 'short' } : { day: '2-digit', month: '2-digit' }),
    reclamations: d.count,
  }));

  const dataPie = stats.byCategory;

  const slaColor = stats.slaBreached > 0 ? DANGER : ACCENT;

  const kpis = [
    { label: 'Total Réclamations', value: String(stats.totalComplaints), icon: <Activity size={18} style={{ color: ACCENT }} />, color: ACCENT, path: '/complaints' },
    { label: 'En cours', value: String(stats.inProgress), icon: <Clock size={18} style={{ color: ACCENT }} />, color: ACCENT, path: '/complaints?statut=IN_PROGRESS' },
    { label: `Résolues (${days}j)`, value: String(stats.resolvedInPeriod), icon: <CheckCircle size={18} style={{ color: ACCENT }} />, color: ACCENT, path: '/complaints?statut=RESOLVED' },
    { label: 'Délai moyen (j)', value: String(stats.avgResolutionDays), icon: <AlertTriangle size={18} style={{ color: ACCENT }} />, color: ACCENT, path: null },
    { label: 'SLA en retard', value: String(stats.slaBreached), icon: <ShieldAlert size={18} style={{ color: slaColor }} />, color: slaColor, path: '/complaints?sla_breached=true' },
  ];

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-theme-bg px-8 py-10" style={inter}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: ACCENT }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: ACCENT }} />
            </span>
            <span className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ ...mono, color: ACCENT }}>
              Flux en direct
            </span>
          </div>
          <h1 className="text-4xl font-medium tracking-tight" style={{ color: TEXT }}>Tableau de bord</h1>
          <p className="mt-2 text-sm" style={{ color: TEXT_SECONDARY }}>
            Aperçu de l'activité et des performances du service client.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
          style={{ borderColor: BORDER }}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-theme-surface">{opt.label}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            onClick={kpi.path ? () => navigate(kpi.path) : undefined}
            className={`p-6 rounded-[15px] border transition-colors ${kpi.path ? 'cursor-pointer hover:border-emerald-800' : ''}`}
            style={{ backgroundColor: SURFACE, borderColor: kpi.value !== '0' && kpi.color === DANGER ? 'rgba(244,63,94,0.4)' : BORDER }}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>
                {kpi.label}
              </span>
              <div className="p-2 rounded-lg" style={{ backgroundColor: kpi.color === DANGER ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)' }}>
                {kpi.icon}
              </div>
            </div>
            <p className="text-3xl font-medium" style={{ ...mono, color: kpi.color === DANGER ? DANGER : TEXT }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Line Chart */}
        <div className="p-6 rounded-[15px] border" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
          <h3 className="text-xs uppercase tracking-[0.15em] font-semibold mb-6" style={{ ...mono, color: TEXT_SECONDARY }}>
            Évolution des réclamations ({days} jours)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataLigne}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BORDER} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: TEXT_SECONDARY, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: TEXT_SECONDARY, fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: `1px solid ${BORDER}`, backgroundColor: SURFACE_2, color: TEXT }}
                  labelStyle={{ color: TEXT_SECONDARY }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: TEXT_SECONDARY }} />
                <Line type="monotone" dataKey="reclamations" stroke={ACCENT} strokeWidth={2} dot={{ r: 3, fill: ACCENT }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="p-6 rounded-[15px] border" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
          <h3 className="text-xs uppercase tracking-[0.15em] font-semibold mb-6" style={{ ...mono, color: TEXT_SECONDARY }}>
            Répartition par catégorie
          </h3>
          <div className="h-[300px] w-full">
            {dataPie.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm" style={{ color: TEXT_SECONDARY }}>
                Aucune donnée disponible.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataPie.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={SURFACE} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: `1px solid ${BORDER}`, backgroundColor: SURFACE_2, color: TEXT }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: TEXT_SECONDARY }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
