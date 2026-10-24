import React from 'react';
import { 
  LayoutDashboard, 
  DoorOpen, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Layers, 
  BadgeDollarSign, 
  Database,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  LogOut,
  Hammer,
  Key,
  Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { WorkerPermissions } from '../../types/database';

export type NavView = 
  | 'dashboard' 
  | 'configurator' 
  | 'orders' 
  | 'clients' 
  | 'prospects' 
  | 'products' 
  | 'workers'
  | 'store';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSeedData: () => void;
  isSeeding?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onSeedData,
  isSeeding = false
}) => {
  const { user, logout, hasPermission } = useAuth();
  const { t, isRtl } = useLanguage();

  const allNavItems: { 
    id: NavView; 
    labelKey: string;
    defaultLabel: string;
    icon: React.FC<{ className?: string }>; 
    badge?: string;
    permission?: keyof WorkerPermissions;
  }[] = [
    { id: 'dashboard', labelKey: 'nav.dashboard', defaultLabel: 'Tableau de Bord', icon: LayoutDashboard, permission: 'canViewDashboard' },
    { id: 'configurator', labelKey: 'nav.configurator', defaultLabel: 'Studio Configuration (2D)', icon: DoorOpen, badge: 'CAD', permission: 'canCreateOrders' },
    { id: 'orders', labelKey: 'nav.orders', defaultLabel: 'Commandes & Suivi', icon: ShoppingBag, permission: 'canViewOrders' },
    { id: 'clients', labelKey: 'nav.clients', defaultLabel: 'Clients & CRM', icon: Users, permission: 'canManageClients' },
    { id: 'prospects', labelKey: 'nav.prospects', defaultLabel: 'Pipeline Prospects', icon: TrendingUp, permission: 'canManageProspects' },
    { id: 'products', labelKey: 'nav.products', defaultLabel: 'Catalogue Portes WPC', icon: Layers },
    { id: 'workers', labelKey: 'nav.workers', defaultLabel: 'Équipe & Paie (RH)', icon: BadgeDollarSign, permission: 'canAccessPayroll' },
    { id: 'store', labelKey: 'nav.store', defaultLabel: 'Boutique & Atelier', icon: Store },
  ];

  // Filter navigation items by active user permissions
  const navItems = allNavItems.filter(item => {
    if (!item.permission) return true;
    if (user?.role === 'admin') return true;
    return hasPermission(item.permission);
  });

  return (
    <aside 
      className={`hidden md:flex bg-nasaq-teal-dark text-white flex-col h-screen ${isRtl ? 'border-l' : 'border-r'} border-slate-700/60 z-30 transition-all duration-300 ease-in-out shrink-0 select-none sidebar no-print ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Brand Block */}
      <div className={`h-16 flex items-center border-b border-white/10 ${collapsed ? 'justify-center px-1' : 'justify-between px-4'}`}>
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="bg-white rounded-lg p-1 px-2 flex items-center justify-center shadow-xs shrink-0">
                <img src="/nasaq-logo-cropped.png" alt="NASAQ WPC" className="h-8 w-auto object-contain" />
              </div>
              <div className="leading-tight">
                <span className="font-cinzel font-bold text-xs tracking-wider text-white block">
                  NASAQ <span className="text-nasaq-gold font-normal">WPC</span>
                </span>
                <span className="text-[9.5px] text-nasaq-gold-light tracking-wide uppercase font-semibold">
                  {t('nav.brandSubtitle', 'Portes & Menuiserie')}
                </span>
              </div>
            </div>
            <button 
              type="button"
              onClick={onToggleCollapse}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
              title={t('nav.collapse', 'Réduire la barre latérale')}
            >
              {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </>
        ) : (
          <button 
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center justify-center p-1.5 rounded-xl hover:bg-white/10 transition group"
            title={t('nav.expand', 'Agrandir la barre latérale')}
          >
            <div className="bg-white rounded-md p-1 flex items-center justify-center shadow-xs">
              <img src="/nasaq-logo-cropped.png" alt="NASAQ" className="h-6 w-auto object-contain" />
            </div>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 py-4 ${collapsed ? 'px-1.5' : 'px-2'} space-y-1.5 overflow-y-auto`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const itemLabel = t(item.labelKey, item.defaultLabel);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center transition group relative ${
                collapsed 
                  ? 'justify-center py-2.5 px-0 rounded-xl' 
                  : 'gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold'
              } ${
                isActive
                  ? collapsed
                    ? 'bg-nasaq-teal text-white shadow-md ring-1 ring-nasaq-gold/50'
                    : `bg-nasaq-teal text-white shadow-md ${isRtl ? 'border-r-4' : 'border-l-4'} border-nasaq-gold`
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={collapsed ? itemLabel : undefined}
            >
              <Icon className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} shrink-0 ${isActive ? 'text-nasaq-gold-light' : 'text-slate-400 group-hover:text-white'}`} />
              
              {!collapsed && (
                <div className={`flex-1 flex items-center justify-between overflow-hidden ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span className="truncate">{itemLabel}</span>
                  {item.badge && (
                    <span className="text-[9px] bg-nasaq-gold text-slate-900 font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Controls / Supabase Info */}
      <div className={`${collapsed ? 'p-1.5 space-y-2' : 'p-3 space-y-2'} border-t border-white/10 bg-black/20 text-xs`}>
        {/* Supabase Status Pill */}
        <div 
          className={`flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 ${
            collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'px-2.5 py-1.5'
          }`}
          title="Supabase Connecté (hqgburjxfuyvyeotmqae)"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
          {!collapsed && (
            <div className="overflow-hidden leading-tight">
              <div className="text-[10px] text-slate-400 font-mono truncate">hqgburjxfuyvyeotmqae</div>
              <div className="text-[10px] text-emerald-400 font-bold">{t('nav.supabaseConnected', 'Supabase Connecté')}</div>
            </div>
          )}
        </div>

        {/* User Session Profile & Logout */}
        {!collapsed ? (
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                user?.role === 'admin' ? 'bg-nasaq-gold text-slate-900 font-bold' : 'bg-nasaq-teal text-white'
              }`}>
                {user?.role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <Hammer className="w-4 h-4" />}
              </div>
              <div className="overflow-hidden leading-tight flex-1">
                <div className="text-xs font-bold text-white truncate">{user?.name || 'Utilisateur'}</div>
                <div className="text-[10px] text-nasaq-gold-light truncate font-medium">
                  {user?.position || (user?.role === 'admin' ? t('header.role.admin', 'Administrateur') : t('header.role.worker', 'Employé'))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white transition text-[11px] font-bold border border-rose-500/30"
              title={t('nav.logout', 'Déconnexion')}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('nav.logout', 'Déconnexion')}</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={logout}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white transition mx-auto border border-rose-500/30"
            title={`${user?.name || ''} - ${t('nav.logout', 'Déconnexion')}`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

        {/* Seed Database Button (for Admin) */}
        {user?.role === 'admin' && (
          !collapsed ? (
            <button
              type="button"
              onClick={onSeedData}
              disabled={isSeeding}
              className="w-full py-1.5 px-2 bg-nasaq-gold/20 hover:bg-nasaq-gold/30 text-nasaq-gold-light border border-nasaq-gold/40 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              title={t('nav.seedTooltip', "Injecter des données d'exemples dans Supabase (Clients, Portes, RH)")}
            >
              <Sparkles className="w-3 h-3 text-nasaq-gold" />
              {isSeeding ? t('nav.seeding', 'Injection...') : t('nav.seedData', 'Initialiser Démo Supabase')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSeedData}
              disabled={isSeeding}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-nasaq-gold/20 hover:bg-nasaq-gold/30 text-nasaq-gold mx-auto transition"
              title={t('nav.seedData', 'Initialiser Démo Supabase')}
            >
              <Database className="w-4 h-4" />
            </button>
          )
        )}
      </div>
    </aside>
  );
};
