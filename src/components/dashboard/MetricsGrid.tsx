import React from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Wallet, 
  Users, 
  AlertTriangle,
  BadgePercent
} from 'lucide-react';
import { formatMoney } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';

interface MetricsGridProps {
  realizedRevenue: number;
  totalOrdersValue: number;
  totalOrdersCount: number;
  totalPaidCash: number;
  outstandingDebt: number;
  clientsCount: number;
  prospectsCount: number;
  workersCount: number;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  realizedRevenue,
  totalOrdersValue,
  totalOrdersCount,
  totalPaidCash,
  outstandingDebt,
  clientsCount,
  prospectsCount,
  workersCount
}) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Realized Revenue */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('dashboard.metrics.realized', 'Chiffre Réalisé')}
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="font-mono text-xl font-extrabold text-slate-900">
          {formatMoney(realizedRevenue)}
        </div>
        <div className="text-[11px] text-emerald-600 font-semibold mt-1">
          {t('dashboard.metrics.realizedHint', '✓ Commandes livrées, posées ou terminées')}
        </div>
      </div>

      {/* 2. Total Invoiced Value & Count */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('dashboard.metrics.invoiced', 'Volume Commandes')}
          </span>
          <div className="w-8 h-8 rounded-xl bg-nasaq-teal-subtle text-nasaq-teal flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="font-mono text-xl font-extrabold text-nasaq-teal">
          {formatMoney(totalOrdersValue)}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 font-medium">
          {t('dashboard.metrics.totalCountHint', 'Total de {count} commande(s) enregistrée(s)').replace('{count}', String(totalOrdersCount))}
        </div>
      </div>

      {/* 3. Encaissements & Créances */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('dashboard.metrics.cash', 'Trésorerie Encaissée')}
          </span>
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="font-mono text-xl font-extrabold text-slate-900">
          {formatMoney(totalPaidCash)}
        </div>
        <div className="flex items-center justify-between text-[11px] mt-1">
          <span className="text-slate-400">{t('dashboard.metrics.debt', 'Reste à recouvrer :')}</span>
          <span className="font-mono font-bold text-rose-600">{formatMoney(outstandingDebt)}</span>
        </div>
      </div>

      {/* 4. CRM & Staff */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('dashboard.metrics.crm', 'Clients & Prospects')}
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <div className="text-xl font-extrabold text-slate-900">{clientsCount}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              {t('dashboard.metrics.activeClients', 'Clients Actifs')}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <div className="text-xl font-extrabold text-amber-700">{prospectsCount}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              {t('dashboard.metrics.leads', 'Prospects Leads')}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <div className="text-xl font-extrabold text-nasaq-teal">{workersCount}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              {t('dashboard.metrics.staff', 'Employés RH')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
