import React from 'react';
import { Order } from '../../types/database';
import { formatDate, formatMoney, getOrderStatusMeta, getPaymentBadge } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import { ShoppingBag, ArrowRight, Eye, CreditCard } from 'lucide-react';

interface RecentOrdersTableProps {
  orders: Order[];
  onViewAllOrders: () => void;
  onSelectOrder: (order: Order) => void;
  onRecordPayment?: (order: Order) => void;
}

export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({
  orders,
  onViewAllOrders,
  onSelectOrder,
  onRecordPayment
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-nasaq-teal-subtle text-nasaq-teal flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            {t('dashboard.recentOrders', 'Commandes Récentes')}
          </h2>
        </div>
        <button
          type="button"
          onClick={onViewAllOrders}
          className="text-xs text-nasaq-teal font-bold hover:underline flex items-center gap-1"
        >
          <span>{t('dashboard.viewAllOrders', 'Toutes les commandes')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <th className="py-2.5 px-3">{t('orders.table.orderNumber', 'N° Commande')}</th>
              <th className="py-2.5 px-3">{t('orders.table.client', 'Client')}</th>
              <th className="py-2.5 px-3">{t('orders.table.date', 'Date')}</th>
              <th className="py-2.5 px-3">{t('orders.table.status', 'Statut')}</th>
              <th className="py-2.5 px-3 text-right">{t('orders.table.total', 'Montant Total')}</th>
              <th className="py-2.5 px-3 text-right">{t('orders.table.payment', 'Paiement')}</th>
              <th className="py-2.5 px-3 text-center">{t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                  {t('dashboard.noRecentOrders', 'Aucune commande enregistrée. Créez-en une depuis le Studio de Configuration.')}
                </td>
              </tr>
            ) : (
              orders.slice(0, 6).map(order => {
                const statusMeta = getOrderStatusMeta(order.status, t);
                const paymentMeta = getPaymentBadge(order.paid_amount, order.total_amount, t);

                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-nasaq-teal">
                      {order.order_number || 'N/A'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {order.clients?.name || 'Client sans nom'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${statusMeta.bg} ${statusMeta.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}></span>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatMoney(order.total_amount)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold ${paymentMeta.bg} ${paymentMeta.text}`}>
                        {paymentMeta.label}
                      </span>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        {t('dashboard.deposit', 'Versé :')} {formatMoney(order.paid_amount)}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectOrder(order)}
                          className="p-1 text-slate-500 hover:text-nasaq-teal hover:bg-nasaq-teal-subtle rounded transition"
                          title={t('orders.viewDetails', 'Voir détails & Factures')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {onRecordPayment && (
                          <button
                            type="button"
                            onClick={() => onRecordPayment(order)}
                            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                            title={t('orders.recordPayment', 'Encaisser paiement / acompte')}
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
