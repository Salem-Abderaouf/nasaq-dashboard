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
  Sparkles
} from 'lucide-react';
import { UserRole } from '../../types/database';

export type NavView = 
  | 'dashboard' 
  | 'configurator' 
  | 'orders' 
  | 'clients' 
  | 'prospects' 
  | 'products' 
  | 'workers';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  userRole: UserRole;
  onToggleRole: () => void;
  onSeedData: () => void;
  isSeeding?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  userRole,
  onToggleRole,
  onSeedData,
  isSeeding = false
}) => {
  const navItems: { id: NavView; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'configurator', label: 'Studio Configuration (2D)', icon: DoorOpen, badge: 'Nouveau' },
    { id: 'orders', label: 'Commandes & Suivi', icon: ShoppingBag },
    { id: 'clients', label: 'Clients & Comptes', icon: Users },
    { id: 'prospects', label: 'Pipeline Prospects', icon: TrendingUp },
    { id: 'products', label: 'Catalogue Portes WPC', icon: Layers },
    { id: 'workers', label: 'Équipe & Paie (RH)', icon: BadgeDollarSign },
  ];

  return (
    <aside 
      className={`bg-nasaq-teal-dark text-white flex flex-col h-screen border-r border-slate-700/60 z-30 transition-all duration-300 ease-in-out shrink-0 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Brand Block */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-nasaq-gold flex items-center justify-center font-cinzel font-extrabold text-white text-base shadow">
              N
            </div>
            <div className="leading-tight">
              <span className="font-cinzel font-bold text-sm tracking-wider text-white block">
                NASAQ <span className="text-nasaq-gold font-normal">نسق</span>
              </span>
              <span className="text-[10px] text-nasaq-gold-light tracking-wide uppercase font-semibold">
                Portes WPC Admin
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-10 h-10 rounded-lg bg-nasaq-gold flex items-center justify-center font-cinzel font-extrabold text-white text-lg mx-auto shadow">
            N
          </div>
        )}

        <button 
          type="button"
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition"
          title={collapsed ? 'Agrandir la barre latérale' : 'Réduire'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                isActive
                  ? 'bg-nasaq-teal text-white shadow-md border-l-4 border-nasaq-gold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-nasaq-gold-light' : 'text-slate-400 group-hover:text-white'}`} />
              
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between overflow-hidden">
                  <span className="truncate">{item.label}</span>
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
      <div className="p-3 border-t border-white/10 bg-black/20 space-y-2 text-xs">
        {/* Supabase Status Pill */}
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          {!collapsed && (
            <div className="overflow-hidden leading-tight">
              <div className="text-[10px] text-slate-400 font-mono truncate">hqgburjxfuyvyeotmqae</div>
              <div className="text-[10px] text-emerald-400 font-bold">Supabase Connecté</div>
            </div>
          )}
        </div>

        {/* Role Switcher */}
        {!collapsed ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-1.5">
              {userRole === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-nasaq-gold" />
              ) : (
                <UserCheck className="w-4 h-4 text-sky-400" />
              )}
              <span className="text-[11px] font-bold capitalize">{userRole}</span>
            </div>
            <button
              type="button"
              onClick={onToggleRole}
              className="text-[10px] bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white px-2 py-0.5 rounded transition"
            >
              Changer
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggleRole}
            className="w-full flex justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-nasaq-gold"
            title={`Rôle actuel: ${userRole}. Cliquer pour changer.`}
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        )}

        {/* Seed Database Button */}
        {!collapsed ? (
          <button
            type="button"
            onClick={onSeedData}
            disabled={isSeeding}
            className="w-full py-1.5 px-2 bg-nasaq-gold/20 hover:bg-nasaq-gold/30 text-nasaq-gold-light border border-nasaq-gold/40 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            title="Injecter des données d'exemples dans Supabase (Clients, Portes, RH)"
          >
            <Sparkles className="w-3 h-3 text-nasaq-gold" />
            {isSeeding ? 'Injection...' : 'Initialiser Démo Supabase'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSeedData}
            disabled={isSeeding}
            className="w-full flex justify-center p-2 rounded-lg bg-nasaq-gold/20 text-nasaq-gold"
            title="Initialiser Démo Supabase"
          >
            <Database className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
