import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Order, OrderStatus } from '../../types/database';
import { formatMoney, formatDate, getOrderStatusMeta, getPaymentBadge } from '../../utils/formatters';
import { 
  Search, 
  Filter, 
  Eye, 
  CreditCard, 
  Plus, 
  RefreshCw, 
  ShoppingBag,
  Clock,
  Sliders,
  ReceiptText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { OrderPaymentsHistoryModal } from './OrderPaymentsHistoryModal';

interface OrdersListViewProps {
  onOpenConfigurator: () => void;
  onEditOrderInStudio?: (order: Order) => void;
  onSelectOrder: (order: Order) => void;
  onRecordPayment: (order: Order) => void;
}

export const OrdersListView: React.FC<OrdersListViewProps> = ({
  onOpenConfigurator,
  onEditOrderInStudio,
  onSelectOrder,
  onRecordPayment
}) => {
  const { hasPermission } = useAuth();
  const { t, isRtl } = useLanguage();
  const canViewFinancials = hasPermission('canViewFinancials');
  const canRecordPayments = hasPermission('canRecordPayments');
  const canCreateOrders = hasPermission('canCreateOrders');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrderForPayments, setSelectedOrderForPayments] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          clients (name, phone, address),
          users (name)
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const s = searchTerm.toLowerCase();
    const matchSearch = 
      (o.order_number && o.order_number.toLowerCase().includes(s)) ||
      (o.clients?.name && o.clients.name.toLowerCase().includes(s)) ||
      (o.clients?.phone && o.clients.phone.includes(s));

    if (!matchSearch) return false;

    if (statusFilter !== 'all' && o.status !== statusFilter) {
      return false;
    }

    if (paymentFilter !== 'all') {
      const isPaid = o.paid_amount >= o.total_amount && o.total_amount > 0;
      const isPartial = o.paid_amount > 0 && o.paid_amount < o.total_amount;
      const isUnpaid = o.paid_amount <= 0;

      if (paymentFilter === 'paid' && !isPaid) return false;
      if (paymentFilter === 'partial' && !isPartial) return false;
      if (paymentFilter === 'unpaid' && !isUnpaid) return false;
    }

    return true;
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-xl md:text-2xl font-bold text-nasaq-teal-dark">
            {t('orders.title', 'Commandes & Suivi de Fabrication')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('orders.subtitle', 'Historique complet, états d\'avancement atelier et gestion des règlements')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh', 'Actualiser')}</span>
          </button>

          {canCreateOrders && (
            <button
              type="button"
              onClick={onOpenConfigurator}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t('orders.newOrder', 'Nouveau Devis / Commande')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5`} />
            <input 
              type="text"
              placeholder={t('common.search', 'Rechercher par N° commande, client, tél...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-nasaq-teal transition`}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-nasaq-teal"
            >
              <option value="all">Tous les Statuts (9 étapes)</option>
              <option value="draft">1. Brouillon (draft)</option>
              <option value="confirmed">2. Confirmée (confirmed)</option>
              <option value="manufacturing">3. En Fabrication (manufacturing)</option>
              <option value="ready_for_dispatch">4. Prête Expédition (ready_for_dispatch)</option>
              <option value="in_transit">5. En Livraison (in_transit)</option>
              <option value="delivered">6. Livrée (delivered)</option>
              <option value="installation">7. En Pose (installation)</option>
              <option value="completed">8. Terminée (completed)</option>
              <option value="cancelled">9. Annulée (cancelled)</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div className="flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-nasaq-teal"
            >
              <option value="all">Tous les Paiements</option>
              <option value="paid">Payé Intégralement</option>
              <option value="partial">Acompte Versé (Partiel)</option>
              <option value="unpaid">Non Payé (En Attente)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} text-xs border-collapse`}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px] tracking-wider">
                <th className="py-3 px-4">{t('orders.number', 'N° Commande')}</th>
                <th className="py-3 px-4">{t('common.client', 'Client')}</th>
                <th className="py-3 px-4">{t('common.date', 'Date')}</th>
                <th className="py-3 px-4">{t('common.status', 'Statut')}</th>
                <th className={`py-3 px-4 ${isRtl ? 'text-left' : 'text-right'}`}>{t('common.total', 'Total')}</th>
                <th className={`py-3 px-4 ${isRtl ? 'text-left' : 'text-right'}`}>{t('common.paid', 'Paiement')}</th>
                <th className="py-3 px-4 text-center">{t('common.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Chargement des commandes depuis Supabase...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    Aucune commande trouvée correspondant aux critères.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const statusMeta = getOrderStatusMeta(order.status);
                  const paymentMeta = getPaymentBadge(order.paid_amount, order.total_amount);
                  const remaining = Math.max(0, order.total_amount - order.paid_amount);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition">
                      {/* Order Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-nasaq-teal">
                        {order.order_number}
                        {order.is_promo_enabled && (
                          <span className="block text-[9px] text-amber-700 font-sans font-bold">
                            Promo Active
                          </span>
                        )}
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {order.clients?.name || 'Client sans nom'}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                          {order.clients?.phone || 'N/A'}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDate(order.created_at)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold ${statusMeta.bg} ${statusMeta.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}></span>
                          {t('status.' + order.status, statusMeta.label)}
                        </span>
                      </td>

                      {/* Total */}
                      <td className={`py-3.5 px-4 ${isRtl ? 'text-left' : 'text-right'} font-mono font-bold text-slate-900 text-xs`}>
                        {canViewFinancials ? (
                          formatMoney(order.total_amount)
                        ) : (
                          <span className="text-[10.5px] text-slate-400 font-sans italic">{t('orders.workshopMode', 'Mode Atelier (0 DA)')}</span>
                        )}
                      </td>

                      {/* Payment */}
                      <td className={`py-3.5 px-4 ${isRtl ? 'text-left' : 'text-right'}`}>
                        {canViewFinancials ? (
                          <>
                            <span 
                              onClick={() => setSelectedOrderForPayments(order)}
                              className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer hover:opacity-80 transition ${paymentMeta.bg} ${paymentMeta.text}`}
                              title={t('orders.viewPaymentHistory', 'Cliquer pour voir l\'historique des versements')}
                            >
                              {paymentMeta.label}
                            </span>
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                              {t('common.paid', 'Versé')} : {formatMoney(order.paid_amount)}
                            </div>
                            {remaining > 0 && (
                              <div className="font-mono text-[10px] text-rose-600 font-semibold">
                                {t('common.remaining', 'Reste')} : {formatMoney(remaining)}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">
                            Non Chiffré
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {canCreateOrders && onEditOrderInStudio && (
                            <button
                              type="button"
                              onClick={() => onEditOrderInStudio(order)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title={t('orders.editInStudio', 'Modifier dans le Studio 2D')}
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectOrder(order)}
                            className="p-1.5 text-slate-500 hover:text-nasaq-teal hover:bg-nasaq-teal-subtle rounded-lg transition"
                            title={t('orders.viewDetails', 'Ouvrir détails de la commande')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canViewFinancials && (
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForPayments(order)}
                              className="p-1.5 text-slate-500 hover:text-nasaq-teal hover:bg-nasaq-teal-subtle rounded-lg transition"
                              title={t('orders.paymentHistory', 'Historique des versements')}
                            >
                              <ReceiptText className="w-4 h-4" />
                            </button>
                          )}
                          {canRecordPayments && (
                            <button
                              type="button"
                              onClick={() => onRecordPayment(order)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title={t('orders.recordPayment', 'Encaisser un paiement')}
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

      {/* Order Payments History Modal */}
      {selectedOrderForPayments && (
        <OrderPaymentsHistoryModal
          order={selectedOrderForPayments}
          onClose={() => setSelectedOrderForPayments(null)}
          onRecordPayment={onRecordPayment}
          onRefreshOrders={fetchOrders}
        />
      )}
    </div>
  );
};
