import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  DoorOpen, 
  ShoppingBag, 
  Users, 
  Menu, 
  X,
  TrendingUp, 
  Layers, 
  BadgeDollarSign, 
  Store, 
  LogOut, 
  Sparkles, 
  ShieldCheck, 
  Hammer,
  Database
} from 'lucide-react';
import { NavView } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';

interface MobileBottomNavProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  onSeedData: () => void;
  isSeeding?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onSeedData,
  isSeeding = false
}) => {
  const { user, logout, hasPermission } = useAuth();
  const { t, isRtl } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check if active view is one of the secondary items in the drawer
  const isSecondaryActive = ['prospects', 'products', 'workers', 'store'].includes(currentView);

  const handleSelectTab = (view: NavView) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* FIXED BOTTOM NAVIGATION BAR */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-nasaq-teal-dark border-t border-slate-700/80 shadow-2xl select-none no-print"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      >
        <div className="grid grid-cols-5 items-center justify-around px-1 pt-1.5 pb-1">
          {/* 1. Dashboard */}
          {hasPermission('canViewDashboard') && (
            <button
              type="button"
              onClick={() => handleSelectTab('dashboard')}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition ${
                currentView === 'dashboard'
                  ? 'text-nasaq-gold font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <div className={`p-1 rounded-lg ${currentView === 'dashboard' ? 'bg-nasaq-teal shadow-xs' : ''}`}>
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                {t('nav.dashboard', 'Tableau')}
              </span>
            </button>
          )}

          {/* 2. Commandes */}
          {hasPermission('canViewOrders') && (
            <button
              type="button"
              onClick={() => handleSelectTab('orders')}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition ${
                currentView === 'orders'
                  ? 'text-nasaq-gold font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <div className={`p-1 rounded-lg ${currentView === 'orders' ? 'bg-nasaq-teal shadow-xs' : ''}`}>
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                {t('common.orders', 'Commandes')}
              </span>
            </button>
          )}

          {/* 3. Studio 2D (Center highlighted action) */}
          {hasPermission('canCreateOrders') && (
            <button
              type="button"
              onClick={() => handleSelectTab('configurator')}
              className="flex flex-col items-center justify-center -mt-3.5 group"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 border-2 ${
                currentView === 'configurator'
                  ? 'bg-nasaq-gold text-slate-900 border-white shadow-nasaq-gold/40'
                  : 'bg-nasaq-teal text-white border-nasaq-gold/60 hover:bg-nasaq-teal-light'
              }`}>
                <DoorOpen className="w-5 h-5" />
              </div>
              <span className={`text-[10px] mt-0.5 font-bold truncate max-w-full ${
                currentView === 'configurator' ? 'text-nasaq-gold' : 'text-slate-300'
              }`}>
                {t('header.quickStudio', 'Studio 2D')}
              </span>
            </button>
          )}

          {/* 4. Clients CRM */}
          {hasPermission('canManageClients') && (
            <button
              type="button"
              onClick={() => handleSelectTab('clients')}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition ${
                currentView === 'clients'
                  ? 'text-nasaq-gold font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <div className={`p-1 rounded-lg ${currentView === 'clients' ? 'bg-nasaq-teal shadow-xs' : ''}`}>
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                {t('common.clients', 'Clients')}
              </span>
            </button>
          )}

          {/* 5. Menu / Plus (Drawer Toggle) */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition relative ${
              isSecondaryActive || isMenuOpen
                ? 'text-nasaq-gold font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-lg relative ${isSecondaryActive || isMenuOpen ? 'bg-nasaq-teal shadow-xs' : ''}`}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              {isSecondaryActive && !isMenuOpen && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-nasaq-gold ring-2 ring-nasaq-teal-dark animate-pulse" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
              {t('common.menu', 'Menu')}
            </span>
          </button>
        </div>
      </nav>

      {/* MOBILE SLIDE-UP DRAWER */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end no-print animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div 
            className="relative bg-nasaq-teal-dark text-white rounded-t-3xl border-t-2 border-nasaq-gold/40 shadow-2xl p-5 max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto" />

            {/* Header: User Profile Card */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  user?.role === 'admin' ? 'bg-nasaq-gold text-slate-900 font-bold' : 'bg-nasaq-teal text-white'
                }`}>
                  {user?.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <Hammer className="w-5 h-5" />}
                </div>
                <div className="overflow-hidden leading-tight">
                  <div className="text-sm font-bold text-white truncate">{user?.name || 'Utilisateur'}</div>
                  <div className="text-[11px] text-nasaq-gold-light truncate font-semibold">
                    {user?.position || (user?.role === 'admin' ? t('header.role.admin', 'Administrateur') : t('header.role.worker', 'Employé'))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Secondary Modules Navigation Grid */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-nasaq-gold-light uppercase tracking-wider px-1">
                {t('common.navigation', 'Modules de Gestion')}
              </div>

              {/* Prospects Pipeline */}
              {hasPermission('canManageProspects') && (
                <button
                  type="button"
                  onClick={() => handleSelectTab('prospects')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition ${
                    currentView === 'prospects'
                      ? 'bg-nasaq-teal text-white border-l-4 border-nasaq-gold shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-slate-200'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-nasaq-gold-light" />
                  <span className="flex-1 text-left">{t('nav.prospects', 'Pipeline Prospects')}</span>
                </button>
              )}

              {/* Products Catalog */}
              <button
                type="button"
                onClick={() => handleSelectTab('products')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition ${
                  currentView === 'products'
                    ? 'bg-nasaq-teal text-white border-l-4 border-nasaq-gold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4 text-nasaq-gold-light" />
                <span className="flex-1 text-left">{t('nav.products', 'Catalogue Portes WPC')}</span>
              </button>

              {/* Workers & Payroll */}
              {hasPermission('canAccessPayroll') && (
                <button
                  type="button"
                  onClick={() => handleSelectTab('workers')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition ${
                    currentView === 'workers'
                      ? 'bg-nasaq-teal text-white border-l-4 border-nasaq-gold shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-slate-200'
                  }`}
                >
                  <BadgeDollarSign className="w-4 h-4 text-nasaq-gold-light" />
                  <span className="flex-1 text-left">{t('nav.workers', 'Équipe & Paie (RH)')}</span>
                </button>
              )}

              {/* Store & Workshop Info */}
              <button
                type="button"
                onClick={() => handleSelectTab('store')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition ${
                  currentView === 'store'
                    ? 'bg-nasaq-teal text-white border-l-4 border-nasaq-gold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-200'
                }`}
              >
                <Store className="w-4 h-4 text-nasaq-gold-light" />
                <span className="flex-1 text-left">{t('nav.store', 'Boutique & Atelier')}</span>
              </button>
            </div>

            {/* Language & Settings */}
            <div className="pt-2 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('common.language', 'Langue')}
                </span>
                <LanguageSelector variant="header" />
              </div>

              {/* Admin Seed Demo Button */}
              {user?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSeedData();
                  }}
                  disabled={isSeeding}
                  className="w-full py-2.5 px-3 bg-nasaq-gold/20 hover:bg-nasaq-gold/30 text-nasaq-gold-light border border-nasaq-gold/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-nasaq-gold" />
                  <span>{isSeeding ? t('nav.seeding', 'Injection...') : t('nav.seedData', 'Initialiser Démo Supabase')}</span>
                </button>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white transition text-xs font-bold border border-rose-500/40 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav.logout', 'Déconnexion')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
