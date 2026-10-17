import React from 'react';
import { NavView } from './Sidebar';
import { UserRole } from '../../types/database';
import { Phone, Plus, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  userRole: UserRole;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  userRole
}) => {
  const titles: Record<NavView, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Tableau de Bord Exécutif',
      subtitle: 'Vue d\'ensemble financière, pipeline des commandes & indicateurs clés'
    },
    configurator: {
      title: 'Studio de Configuration Portes WPC',
      subtitle: 'Génération de devis, calculs de remises, fiches atelier & plans 2D'
    },
    orders: {
      title: 'Gestion des Commandes',
      subtitle: 'Suivi des 9 étapes du cycle de fabrication, livraisons et paiements'
    },
    clients: {
      title: 'Répertoire Clients & CRM',
      subtitle: 'Gestion des comptes clients, historique des commandes & créances'
    },
    prospects: {
      title: 'Pipeline des Prospects & Leads',
      subtitle: 'Négociation commerciale et conversion des opportunités en clients'
    },
    products: {
      title: 'Catalogue des Modèles Portes WPC',
      subtitle: 'Références certifiées (Cuisine, Chambre, Bain) et fiches produits'
    },
    workers: {
      title: 'Gestion des Ressources Humaines & Paie',
      subtitle: 'Fiches artisans, avances sur salaire, primes, retenues et virement net'
    }
  };

  const currentMeta = titles[currentView] || titles.dashboard;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between no-print z-10 shrink-0 shadow-2xs">
      <div>
        <h1 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
          {currentMeta.title}
        </h1>
        <p className="text-[11px] text-slate-500 hidden sm:block">
          {currentMeta.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Workshop Contact */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
          <Phone className="w-3.5 h-3.5 text-nasaq-teal" />
          <span>Atelier : +213 660 99 60 97</span>
        </div>

        {/* Currency badge */}
        <div className="px-2.5 py-1 rounded-lg bg-nasaq-gold-subtle border border-nasaq-gold/30 text-nasaq-gold-dark font-mono text-xs font-bold">
          DZD (DA)
        </div>

        {/* Quick Launch Configurator */}
        {currentView !== 'configurator' && (
          <button
            type="button"
            onClick={() => onNavigate('configurator')}
            className="flex items-center gap-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Studio Devis 2D</span>
          </button>
        )}

        {/* User Role Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs">
            {userRole === 'admin' ? <ShieldCheck className="w-4 h-4 text-nasaq-teal" /> : <User className="w-4 h-4 text-slate-600" />}
          </div>
          <div className="hidden md:block leading-tight text-left">
            <div className="text-xs font-bold text-slate-800">Directeur NASAQ</div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
