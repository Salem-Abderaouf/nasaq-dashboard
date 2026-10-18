import React from 'react';
import { NavView } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { Plus, ShieldCheck, Hammer } from 'lucide-react';

interface HeaderProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate
}) => {
  const { user, hasPermission } = useAuth();
  const { t, isRtl } = useLanguage();

  const titleKey = `header.${currentView}.title`;
  const subtitleKey = `header.${currentView}.subtitle`;

  const title = t(titleKey, 'Tableau de Bord');
  const subtitle = t(subtitleKey, 'Vue d\'ensemble');

  const roleLabel = user?.role === 'admin' 
    ? t('header.role.admin', 'Administrateur') 
    : t('header.role.worker', 'Artisan Atelier');

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between no-print z-10 shrink-0 shadow-2xs">
      <div className="flex items-center gap-3 overflow-hidden">
        <img src="/nasaq-logo-transparent.png" alt="NASAQ" className="h-8 w-auto object-contain hidden sm:block shrink-0" />
        <div className="truncate">
          <h1 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2 truncate">
            {title}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block truncate">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Language Selector */}
        <LanguageSelector variant="header" />

        {/* Quick Launch Configurator if permitted */}
        {currentView !== 'configurator' && hasPermission('canCreateOrders') && (
          <button
            type="button"
            onClick={() => onNavigate('configurator')}
            className="flex items-center gap-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white px-3 md:px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">{t('header.quickStudio', 'Studio Devis 2D')}</span>
          </button>
        )}

        {/* User Role Profile */}
        <div className={`flex items-center gap-2 ${isRtl ? 'pr-2 border-r' : 'pl-2 border-l'} border-slate-200`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            user?.role === 'admin' 
              ? 'bg-nasaq-gold/20 text-nasaq-gold-dark border border-nasaq-gold/40' 
              : 'bg-nasaq-teal-subtle text-nasaq-teal border border-nasaq-teal/30'
          }`}>
            {user?.role === 'admin' ? (
              <ShieldCheck className="w-4 h-4 text-nasaq-teal" />
            ) : (
              <Hammer className="w-4 h-4 text-nasaq-teal" />
            )}
          </div>
          <div className="hidden md:block leading-tight text-start">
            <div className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
              {user?.name || 'Utilisateur'}
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">
              {user?.position || roleLabel}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
