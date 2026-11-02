import React from 'react';
import { Order } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { MetricsGrid } from './MetricsGrid';
import { PipelineDistribution } from './PipelineDistribution';
import { RecentOrdersTable } from './RecentOrdersTable';
import { TopDoorsLeaderboard } from './TopDoorsLeaderboard';
import { NavView } from '../layout/Sidebar';
import { RefreshCw, Plus } from 'lucide-react';
import { useDashboardMetrics } from '../../hooks/dashboard/useDashboardMetrics';

interface DashboardViewProps {
  onNavigate: (view: NavView) => void;
  onSelectOrder: (order: Order) => void;
  onRecordPayment: (order: Order) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectOrder,
  onRecordPayment
}) => {
  const { t } = useLanguage();
  
  const {
    loading,
    orders,
    clientsCount,
    prospectsCount,
    workersCount,
    topDoors,
    financials,
    fetchDashboardData
  } = useDashboardMetrics();

  const {
    totalOrdersCount,
    totalOrdersValue,
    totalPaidCash,
    realizedRevenue,
    outstandingDebt,
    statusCounts
  } = financials;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-xl md:text-2xl font-bold text-nasaq-teal-dark">
            {t('dashboard.bannerTitle', 'NASAQ WPC — Vue d\'Ensemble')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('dashboard.bannerSubtitle', 'Suivi des ventes showroom, fabrications atelier et recouvrements')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh', 'Actualiser')}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('configurator')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('dashboard.newQuote', 'Nouveau Devis / Portes')}</span>
          </button>
        </div>
      </div>

      {/* 1. Metrics Grid */}
      <MetricsGrid
        realizedRevenue={realizedRevenue}
        totalOrdersValue={totalOrdersValue}
        totalOrdersCount={totalOrdersCount}
        totalPaidCash={totalPaidCash}
        outstandingDebt={outstandingDebt}
        clientsCount={clientsCount}
        prospectsCount={prospectsCount}
        workersCount={workersCount}
      />

      {/* 2. Order Pipeline (9 Stages) */}
      <PipelineDistribution
        statusCounts={statusCounts}
        onSelectStatus={() => onNavigate('orders')}
      />

      {/* 3. Split: Recent Orders Table & Top Doors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersTable
            orders={orders}
            onViewAllOrders={() => onNavigate('orders')}
            onSelectOrder={onSelectOrder}
            onRecordPayment={onRecordPayment}
          />
        </div>
        <div className="lg:col-span-1">
          <TopDoorsLeaderboard
            items={topDoors}
            onViewCatalog={() => onNavigate('products')}
          />
        </div>
      </div>

      {/* Empty State Help Card if no data */}
      {orders.length === 0 && !loading && (
        <div className="bg-gradient-to-r from-nasaq-teal-subtle to-nasaq-gold-subtle border border-nasaq-teal/20 rounded-2xl p-6 text-center space-y-3">
          <h3 className="font-cinzel text-base font-bold text-nasaq-teal-dark">
            {t('dashboard.welcomeTitle', 'Bienvenue dans le Tableau de Bord NASAQ WPC')}
          </h3>
          <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
            {t('dashboard.welcomeMessage', 'Votre espace NASAQ WPC est opérationnel. Vous pouvez lancer directement le Studio de Configuration pour créer votre premier devis ou commande.')}
          </p>
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => onNavigate('configurator')}
              className="px-5 py-2.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {t('dashboard.createFirstQuote', 'Créer Premier Devis')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
