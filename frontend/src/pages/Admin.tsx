import { useNavigate } from 'react-router-dom';
import { Users, Tag, ArrowRight, BarChart3, History, SlidersHorizontal } from 'lucide-react';
import { ACCENT, SURFACE, BORDER, TEXT_SECONDARY, inter } from '../lib/theme';

export default function Admin() {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Gestion des Utilisateurs',
      description: 'Gérez les comptes agents et administrateurs.',
      cta: 'Voir les utilisateurs',
      icon: <Users size={18} style={{ color: ACCENT }} />,
      path: '/admin/users',
    },
    {
      title: 'Gestion des Catégories',
      description: 'Configurez les types de réclamations et leurs SLA.',
      cta: 'Voir les catégories',
      icon: <Tag size={18} style={{ color: ACCENT }} />,
      path: '/admin/categories',
    },
    {
      title: 'Performance des Agents',
      description: 'Charge de travail et délais de résolution par agent.',
      cta: 'Voir les performances',
      icon: <BarChart3 size={18} style={{ color: ACCENT }} />,
      path: '/admin/agents',
    },
    {
      title: "Journal d'Activité",
      description: 'Changements de statut et créations de compte récents.',
      cta: "Voir l'activité",
      icon: <History size={18} style={{ color: ACCENT }} />,
      path: '/admin/activity',
    },
    {
      title: 'Paramètres',
      description: 'Configuration générale et statut des notifications email.',
      cta: 'Voir les paramètres',
      icon: <SlidersHorizontal size={18} style={{ color: ACCENT }} />,
      path: '/admin/settings',
    },
  ];

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-theme-bg px-8 py-10" style={inter}>
      <div className="mb-10">
        <h1 className="text-4xl font-medium tracking-tight text-theme-text">Administration</h1>
        <p className="mt-2 text-sm" style={{ color: TEXT_SECONDARY }}>
          Paramétrage et gestion globale de la plateforme.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.path}
            className="p-6 rounded-[15px] border transition-colors hover:border-emerald-800"
            style={{ backgroundColor: SURFACE, borderColor: BORDER }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-theme-text">{section.title}</h2>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                {section.icon}
              </div>
            </div>
            <p className="text-sm mb-6" style={{ color: TEXT_SECONDARY }}>{section.description}</p>
            <button
              onClick={() => navigate(section.path)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors"
              style={{ backgroundColor: ACCENT, color: '#031a12' }}
            >
              {section.cta}
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
