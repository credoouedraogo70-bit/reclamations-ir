import { useState, useEffect } from 'react';
import { RefreshCw, UserPlus, ShieldCheck, Headset, ChevronDown } from 'lucide-react';
import api from '../lib/axios';
import { ACCENT, SURFACE, BORDER, TEXT_SECONDARY, mono, inter } from '../lib/theme';

interface ActivityEntry {
  type: 'STATUS_CHANGE' | 'USER_CREATED';
  message: string;
  date: string;
  role: string;
}

function ActivitySection({ title, icon, entries }: { title: string; icon: React.ReactNode; entries: ActivityEntry[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[15px] border overflow-hidden" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-6 py-4"
        style={open ? { borderBottom: `1px solid ${BORDER}` } : undefined}
      >
        {icon}
        <h2 className="text-sm font-semibold text-theme-text">{title}</h2>
        <span className="text-xs" style={{ ...mono, color: TEXT_SECONDARY }}>({entries.length})</span>
        <ChevronDown
          size={16}
          className="ml-auto transition-transform"
          style={{ color: TEXT_SECONDARY, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {open && (
        entries.length === 0 ? (
          <div className="p-6 text-center text-sm" style={{ color: TEXT_SECONDARY }}>Aucune activité récente.</div>
        ) : (
          <div>
            {entries.map((entry, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-6 py-4 border-b last:border-b-0"
                style={{ borderColor: BORDER }}
              >
                <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                  {entry.type === 'USER_CREATED' ? (
                    <UserPlus size={16} style={{ color: ACCENT }} />
                  ) : (
                    <RefreshCw size={16} style={{ color: ACCENT }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-theme-text">{entry.message}</p>
                  <p className="text-xs mt-1" style={{ ...mono, color: TEXT_SECONDARY }}>
                    {new Date(entry.date).toLocaleString('fr-FR', { hour12: false })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default function AdminActivity() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/statistics/activity')
      .then((res) => setEntries(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const adminEntries = entries.filter((e) => e.role === 'ADMIN');
  const agentEntries = entries.filter((e) => e.role !== 'ADMIN');

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-theme-bg px-8 py-10" style={inter}>
      <div className="mb-8">
        <h1 className="text-4xl font-medium tracking-tight text-theme-text">Journal d'activité</h1>
        <p className="mt-2 text-sm" style={{ color: TEXT_SECONDARY }}>
          Derniers changements de statut et créations de compte, classés par rôle.
        </p>
      </div>

      {loading ? (
        <div className="rounded-[15px] border p-8 text-center text-sm" style={{ backgroundColor: SURFACE, borderColor: BORDER, color: TEXT_SECONDARY }}>
          Chargement des données...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <ActivitySection
            title="Activités Administrateur"
            icon={<ShieldCheck size={16} style={{ color: ACCENT }} />}
            entries={adminEntries}
          />
          <ActivitySection
            title="Activités Agent"
            icon={<Headset size={16} style={{ color: ACCENT }} />}
            entries={agentEntries}
          />
        </div>
      )}
    </div>
  );
}
