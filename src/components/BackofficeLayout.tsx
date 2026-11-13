import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  CheckCheck,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  Globe2,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  Users,
  Wifi,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ROLES } from '@/config/roles';
import { Logo } from '@/components/ui/Logo';
import { Permission } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: Permission;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, permission: 'view_dashboard', end: true },
  { to: '/app/gis', label: 'Mapa GIS', icon: Globe2, permission: 'view_gis' },
  { to: '/app/infrastructures', label: 'Infra-estruturas', icon: Database, permission: 'view_infrastructures' },
  { to: '/app/inspections', label: 'Inspecções', icon: ClipboardCheck, permission: 'view_inspections' },
  { to: '/app/occurrences', label: 'Ocorrências', icon: AlertTriangle, permission: 'view_occurrences' },
  { to: '/app/risk-zones', label: 'Zonas de risco', icon: ShieldAlert, permission: 'view_gis' },
  { to: '/app/maintenance', label: 'Manutenção', icon: Wrench, permission: 'view_maintenance' },
  { to: '/app/meal', label: 'Monitoria MEAL', icon: BarChart3, permission: 'view_meal' },
  { to: '/app/reports', label: 'Relatórios', icon: FileSpreadsheet, permission: 'view_reports' },
  { to: '/app/users', label: 'Utilizadores', icon: Users, permission: 'manage_users' },
  { to: '/app/docs', label: 'Documentação', icon: BookOpen, permission: 'view_dashboard' },
  { to: '/app/settings', label: 'Configurações', icon: Settings, permission: 'view_dashboard' },
];

export const BackofficeLayout: React.FC = () => {
  const {
    currentUser,
    can,
    logout,
    isOnline,
    simulatedOffline,
    toggleSimulatedOffline,
    pendingOfflineCount,
    syncOfflineInspections,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    infrastructures,
    occurrences,
    workOrders,
  } = useApp();

  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const searchResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: { label: string; sub: string; path: string }[] = [];

    infrastructures
      .filter((i) => i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q) || i.neighborhoodName.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((i) =>
        results.push({ label: `${i.code} - ${i.name}`, sub: `Infra-estrutura • ${i.neighborhoodName}`, path: '/app/infrastructures' })
      );

    occurrences
      .filter((o) => o.code.toLowerCase().includes(q) || o.neighborhoodName.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((o) =>
        results.push({ label: `${o.code} - ${o.occurrenceType}`, sub: `Ocorrência • ${o.neighborhoodName}`, path: '/app/occurrences' })
      );

    workOrders
      .filter((w) => w.code.toLowerCase().includes(q) || w.title.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((w) =>
        results.push({ label: `${w.code} - ${w.title}`, sub: `Manutenção • ${w.status}`, path: '/app/maintenance' })
      );

    return results;
  }, [globalQuery, infrastructures, occurrences, workOrders]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 h-16 bg-white border-b border-neutral-200 px-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden p-2 rounded-md hover:bg-[#F4F4F4] text-[#171717]"
            aria-label="Menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Logo />
        </div>

        {/* Global Search */}
        <div className="relative flex-1 max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder="Pesquisa global (código, bairro, ocorrência, ordem)..."
            className="w-full pl-9 pr-4 py-1.5 rounded-md bg-[#F4F4F4] border border-transparent focus:bg-white focus:border-neutral-300 text-xs focus:outline-none"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden z-50">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  onClick={() => {
                    navigate(res.path);
                    setGlobalQuery('');
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-[#F4F4F4] border-b last:border-b-0 border-neutral-100"
                >
                  <div className="text-xs font-medium text-[#171717]">{res.label}</div>
                  <div className="text-[11px] text-[#777777]">{res.sub}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Online/Offline & Sync Control */}
          <button
            onClick={toggleSimulatedOffline}
            title="Alternar modo offline para testes de campo"
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              isOnline
                ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-300'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isOnline ? 'Online' : simulatedOffline ? 'Offline (Simulado)' : 'Offline'}
          </button>

          {pendingOfflineCount > 0 && (
            <button
              onClick={() => syncOfflineInspections()}
              disabled={!isOnline}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sincronizar ({pendingOfflineCount})
            </button>
          )}

          {/* Notification Center */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-2 rounded-md hover:bg-[#F4F4F4] text-[#171717]"
              aria-label="Notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#171717]">
                    Centro de Notificações ({unreadCount} por ler)
                  </span>
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Marcar todas
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.linkPath) navigate(n.linkPath);
                        setNotifOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-[#F4F4F4] transition-colors ${
                        !n.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#171717]">{n.title}</span>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            n.severity === 'critical'
                              ? 'bg-[#DC2626]'
                              : n.severity === 'warning'
                              ? 'bg-[#EAB308]'
                              : n.severity === 'success'
                              ? 'bg-[#16A34A]'
                              : 'bg-[#2563EB]'
                          }`}
                        />
                      </div>
                      <p className="text-[11px] text-[#777777] mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="text-[10px] text-[#777777] mt-1">
                        {n.category} • {new Date(n.createdAt).toLocaleDateString('pt-PT')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-neutral-200">
            <div className="text-right leading-tight">
              <div className="text-xs font-semibold text-[#171717]">{currentUser?.fullName}</div>
              <div className="text-[10px] text-[#2563EB] font-medium">
                {currentUser ? ROLES[currentUser.role].name : ''}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Terminar sessão"
              className="p-2 rounded-md hover:bg-red-50 text-[#777777] hover:text-[#DC2626] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-60 bg-white border-r border-neutral-200 pt-16 lg:pt-4 pb-6 px-3 flex flex-col justify-between transform transition-transform lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="space-y-1">
            {NAV_ITEMS.filter((item) => can(item.permission)).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                      isActive
                        ? 'bg-[#142B4A] text-white'
                        : 'text-[#555555] hover:bg-[#F4F4F4] hover:text-[#171717]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-6 pt-4 border-t border-neutral-100 px-2 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[#777777]">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Município da Matola</span>
            </div>
            <button
              onClick={handleLogout}
              className="sm:hidden w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-[#DC2626] bg-red-50"
            >
              <LogOut className="w-3.5 h-3.5" /> Terminar Sessão
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

