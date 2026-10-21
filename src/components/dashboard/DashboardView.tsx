import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Order, OrderStatus } from '../../types/database';
import { useLanguage } from '../../context/LanguageContext';
import { MetricsGrid } from './MetricsGrid';
import { PipelineDistribution } from './PipelineDistribution';
import { RecentOrdersTable } from './RecentOrdersTable';
import { TopDoorsLeaderboard } from './TopDoorsLeaderboard';
import { NavView } from '../layout/Sidebar';
import { RefreshCw, Plus, Sparkles } from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: NavView) => void;
  onSelectOrder: (order: Order) => void;
  onRecordPayment: (order: Order) => void;
  onSeedData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectOrder,
  onRecordPayment,
  onSeedData
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clientsCount, setClientsCount] = useState(0);
  const [prospectsCount, setProspectsCount] = useState(0);
  const [workersCount, setWorkersCount] = useState(0);
  const [topDoors, setTopDoors] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders with clients and items
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select(`
          *,
          clients (name, phone, address),
          users (name)
        `)
        .order('created_at', { ascending: false });

      if (ordersErr) console.warn('Fetch orders error:', ordersErr);
      setOrders(ordersData || []);

      // 2. Fetch clients count
      const { count: cCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });
      setClientsCount(cCount || 0);

      // 3. Fetch prospects count
      const { count: pCount } = await supabase
        .from('prospects')
        .select('*', { count: 'exact', head: true });
      setProspectsCount(pCount || 0);

      // 4. Fetch workers count
      const { count: wCount } = await supabase
        .from('workers')
        .select('*', { count: 'exact', head: true });
      setWorkersCount(wCount || 0);

      // 5. Fetch items for top doors
      const { data: itemsData } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          total_price,
          door_products (reference, name, category)
        `);

      if (itemsData && itemsData.length > 0) {
        const stats: Record<string, any> = {};
        itemsData.forEach((it: any) => {
          const prod = it.door_products;
          const key = it.product_id || prod?.reference || 'Unknown';
          if (!stats[key]) {
            stats[key] = {
              reference: prod?.reference || 'WPC',
              name: prod?.name || 'Modèle Personnalisé',
              category: prod?.category || 'Porte WPC',
              quantity: 0,
              revenue: 0
            };
          }
          stats[key].quantity += Number(it.quantity || 1);
          stats[key].revenue += Number(it.total_price || 0);
        });

        const sorted = Object.values(stats).sort((a: any, b: any) => b.quantity - a.quantity);
        setTopDoors(sorted);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute live aggregates from orders
  const totalOrdersCount = orders.length;
  let totalOrdersValue = 0;
  let totalPaidCash = 0;
  let realizedRevenue = 0;
  let outstandingDebt = 0;

  const statusCounts: Record<OrderStatus, number> = {
    draft: 0,
    confirmed: 0,
    manufacturing: 0,
    ready_for_dispatch: 0,
    in_transit: 0,
    delivered: 0,
    installation: 0,
    completed: 0,
    cancelled: 0
  };

  orders.forEach(o => {
    const tot = Number(o.total_amount) || 0;
    const paid = Number(o.paid_amount) || 0;
    totalOrdersValue += tot;
    totalPaidCash += paid;

    if (['delivered', 'installation', 'completed'].includes(o.status)) {
      realizedRevenue += tot;
    }
    if (o.status !== 'cancelled' && tot > paid) {
      outstandingDebt += (tot - paid);
    }

    if (statusCounts[o.status] !== undefined) {
      statusCounts[o.status] += 1;
    }
  });

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
            {t('dashboard.welcomeMessage', 'Votre base de données Supabase est actuellement vide. Vous pouvez initialiser un jeu de données de démonstration pour tester toutes les fonctionnalités ou ouvrir directement le Studio de Configuration.')}
          </p>
          <div className="flex justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={onSeedData}
              className="px-4 py-2 bg-nasaq-gold hover:bg-nasaq-gold-dark text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t('dashboard.initDemo', 'Initialiser Démo Supabase')}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('configurator')}
              className="px-4 py-2 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('dashboard.createFirstQuote', 'Créer Premier Devis')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
