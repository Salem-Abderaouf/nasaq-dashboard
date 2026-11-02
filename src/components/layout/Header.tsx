import React from 'react';
import { NavView } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { Plus } from 'lucide-react';

interface HeaderProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate
}) => {
  const { hasPermission } = useAuth();
  const { t } = useLanguage();

  const titleKey = `header.${currentView}.title`;
  const subtitleKey = `header.${currentView}.subtitle`;

  const title = t(titleKey, 'Tableau de Bord');
  const subtitle = t(subtitleKey, 'Vue d\'ensemble');

  return (
    <header className="h-14 md:h-16 bg-white border-b border-slate-200 px-3 md:px-6 flex items-center justify-between no-print z-10 shrink-0 shadow-2xs">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="truncate">
          <h1 className="text-xs md:text-base font-bold text-slate-900 flex items-center gap-2 truncate">
            {title}
          </h1>
          <p className="text-[10px] md:text-[11px] text-slate-500 hidden sm:block truncate">
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
      </div>
    </header>
  );
};
