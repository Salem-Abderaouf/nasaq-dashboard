import React from 'react';
import { NavView } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
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
    },
    store: {
      title: 'Boutique & Atelier NASAQ WPC',
      subtitle: 'Coordonnées de l\'atelier de menuiserie, contacts showroom et horaires'
    }
  };

  const currentMeta = titles[currentView] || titles.dashboard;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between no-print z-10 shrink-0 shadow-2xs">
      <div className="flex items-center gap-3">
        <img src="/nasaq-logo-transparent.png" alt="NASAQ" className="h-8 w-auto object-contain hidden sm:block" />
        <div>
          <h1 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
            {currentMeta.title}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Launch Configurator if permitted */}
        {currentView !== 'configurator' && hasPermission('canCreateOrders') && (
          <button
            type="button"
            onClick={() => onNavigate('configurator')}
            className="flex items-center gap-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Studio Devis 2D</span>
          </button>
        )}

        {/* User Role Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
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
          <div className="hidden md:block leading-tight text-left">
            <div className="text-xs font-bold text-slate-800 truncate max-w-[160px]">
              {user?.name || 'Utilisateur'}
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[160px]">
              {user?.position || (user?.role === 'admin' ? 'Administrateur' : 'Artisan')}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
