import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, LogOut, User, Bell, Tag, BarChart3, Users, UserCheck, History, SlidersHorizontal } from 'lucide-react';
import api from '../lib/axios';
import { ACCENT, BACKGROUND, SURFACE, BORDER, TEXT, TEXT_SECONDARY, mono, inter } from '../lib/theme';
import { ToggleTheme } from '../components/ToggleTheme';

type NavChild = { to: string | ((userId: number) => string); label: string; icon: typeof Tag };

const navLinks = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, adminOnly: false, children: [] as NavChild[] },
  {
    to: '/complaints', label: 'Réclamations', icon: FileText, adminOnly: false,
    children: [
      { to: (userId: number) => `/complaints?agent_assigne_id=${userId}`, label: 'Mes réclamations', icon: UserCheck },
    ] as NavChild[],
  },
  {
    to: '/admin', label: 'Administration', icon: Settings, adminOnly: true,
    children: [
      { to: '/admin/users', label: 'Utilisateurs', icon: Users },
      { to: '/admin/categories', label: 'Catégories', icon: Tag },
      { to: '/admin/agents', label: 'Agents', icon: BarChart3 },
      { to: '/admin/activity', label: 'Activité', icon: History },
      { to: '/admin/settings', label: 'Paramètres', icon: SlidersHorizontal },
    ] as NavChild[],
  },
];

interface Notification {
  id: number;
  message: string;
  lu: boolean;
  created_at: string;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'ADMIN';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.lu).length;

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (n.lu) return;
    try {
      await api.patch(`/notifications/${n.id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: BACKGROUND, ...inter }}>
      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
        <div className="h-32 flex items-center justify-center border-b mb-4 bg-blue-600 overflow-hidden" style={{ borderColor: BORDER }}>
          <img src="/moov-africa-logo.png" alt="Moov Africa" className="h-full w-full object-cover scale-125" />
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navLinks.filter(l => !l.adminOnly || isAdmin).map(({ to, label, icon: Icon, children }) => {
            const resolvedChildren = children.map((child) => {
              const childTo = typeof child.to === 'function' ? child.to(currentUser.id) : child.to;
              const [childPath, childQuery] = childTo.split('?');
              const childActive = location.pathname === childPath && (!childQuery || location.search === `?${childQuery}`);
              return { ...child, childTo, childActive };
            });
            const anyChildActive = resolvedChildren.some((c) => c.childActive);
            const active = !anyChildActive && (
              location.pathname === to || (to !== '/dashboard' && to !== '/admin' && location.pathname.startsWith(to))
            );
            return (
              <div key={to}>
                <Link
                  to={to}
                  className="flex items-center space-x-3 px-3 py-2 rounded-[8px] transition-colors"
                  style={active
                    ? { backgroundColor: 'rgba(16,185,129,0.1)', color: ACCENT }
                    : { color: TEXT_SECONDARY }}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
                {resolvedChildren.length > 0 && (
                  <div className="mt-1 ml-4 pl-4 border-l space-y-1" style={{ borderColor: BORDER }}>
                    {resolvedChildren.map((child) => (
                      <Link
                        key={child.childTo}
                        to={child.childTo}
                        className="flex items-center space-x-2.5 px-3 py-1.5 rounded-[8px] transition-colors"
                        style={child.childActive
                          ? { backgroundColor: 'rgba(16,185,129,0.1)', color: ACCENT }
                          : { color: TEXT_SECONDARY }}
                      >
                        <child.icon size={16} />
                        <span className="text-sm">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: BORDER }}>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="flex items-center space-x-3 px-3 py-2 w-full rounded-[8px] hover:bg-rose-500/10 text-rose-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b flex items-center px-6 justify-between" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
          <h2 className="text-lg font-semibold" style={{ color: TEXT }}>Système de Gestion Réclamations</h2>
          <div className="flex items-center space-x-4">
            <ToggleTheme />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsOpen(o => !o)}
                className="relative w-10 h-10 rounded-full transition-colors flex items-center justify-center hover:brightness-125"
                style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: ACCENT }}
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {isOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-[15px] border shadow-2xl z-50 overflow-hidden"
                  style={{ backgroundColor: SURFACE, borderColor: BORDER, ...inter }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: BORDER }}>
                    <h3 className="text-xs uppercase tracking-[0.15em] font-semibold" style={{ ...mono, color: TEXT_SECONDARY }}>Notifications</h3>
                    <button
                      onClick={handleMarkAllRead}
                      disabled={unreadCount === 0}
                      className="text-xs font-medium hover:underline disabled:no-underline disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ color: ACCENT }}
                    >
                      Tout marquer comme lu
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-center" style={{ color: TEXT_SECONDARY }}>Aucune notification.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className="px-4 py-3 text-sm border-b last:border-b-0 cursor-pointer transition-colors hover:bg-theme-hover"
                          style={{ borderColor: BORDER, color: n.lu ? TEXT_SECONDARY : TEXT, fontWeight: n.lu ? 400 : 600 }}
                        >
                          <p>{n.message}</p>
                          <p className="text-xs mt-1" style={{ ...mono, color: TEXT_SECONDARY }}>{new Date(n.created_at).toLocaleString('fr-FR', { hour12: false })}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full transition-colors flex items-center justify-center hover:brightness-125"
              style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: ACCENT }}
              title="Mon Profil"
            >
              <User size={20} />
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: BACKGROUND }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
