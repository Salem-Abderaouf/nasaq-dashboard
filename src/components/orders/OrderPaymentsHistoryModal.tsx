import React, { useState, useEffect } from 'react';
import { Order, OrderPayment } from '../../types/database';
import { supabase } from '../../api/supabase';
import { formatMoney, formatDate, getPaymentBadge } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  ReceiptText, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  Plus, 
  RefreshCw,
  Ban
} from 'lucide-react';

interface OrderPaymentsHistoryModalProps {
  order: Order;
  onClose: () => void;
  onRecordPayment?: (order: Order) => void;
  onRefreshOrders?: () => void;
}

export const OrderPaymentsHistoryModal: React.FC<OrderPaymentsHistoryModalProps> = ({
  order,
  onClose,
  onRecordPayment,
  onRefreshOrders
}) => {
  const { hasPermission, user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === 'admin';
  const canRecordPayments = hasPermission('canRecordPayments');

  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentOrder, setCurrentOrder] = useState<Order>(order);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      // 1. Fetch updated order state
      const { data: ordData } = await supabase
        .from('orders')
        .select('*, clients (name, phone, address)')
        .eq('id', order.id)
        .single();

      if (ordData) setCurrentOrder(ordData);

      // 2. Fetch payments history
      const { data, error } = await supabase
        .from('order_payments')
        .select('*')
        .eq('order_id', order.id)
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Error fetching order payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [order.id]);

  const handleVoidPayment = async (paymentId: string) => {
    if (!confirm(t('orderPayments.confirmVoid', 'Are you sure you want to void this transaction?'))) return;

    try {
      const { error } = await supabase
        .from('order_payments')
        .update({ status: 'voided' })
        .eq('id', paymentId);

      if (error) throw error;
      await fetchPayments();
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      console.error('Error voiding payment:', err);
      alert(err.message || t('orderPayments.voidError', 'Error voiding payment.'));
    }
  };

  const remaining = Math.max(0, currentOrder.total_amount - currentOrder.paid_amount);
  const paymentMeta = getPaymentBadge(currentOrder.paid_amount, currentOrder.total_amount, t);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-nasaq-teal/30 border border-nasaq-teal/40 flex items-center justify-center text-nasaq-gold">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <span>{t('orderPayments.title', 'Historique des Versements')}</span>
                <span className="font-mono text-nasaq-gold text-xs px-2 py-0.5 bg-white/10 rounded-md">
                  {currentOrder.order_number}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t('common.client', 'Client')} : <strong className="text-slate-200">{currentOrder.clients?.name || 'N/A'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchPayments}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title={t('common.refresh', 'Actualiser')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* KPI Balance Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                {t('orderPayments.totalInvoiced', 'Total Facturé')}
              </span>
              <div className="font-mono text-sm font-extrabold text-slate-800">
                {formatMoney(currentOrder.total_amount)}
              </div>
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
              <span className="text-[10px] text-emerald-700 uppercase font-bold block mb-0.5">
                {t('orderPayments.totalPaid', 'Total Versé')}
              </span>
              <div className="font-mono text-sm font-extrabold text-emerald-700">
                {formatMoney(currentOrder.paid_amount)}
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-center ${
              remaining > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className={`text-[10px] uppercase font-bold block mb-0.5 ${
                remaining > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                {t('orderPayments.balanceDue', 'Reste à Payer')}
              </span>
              <div className={`font-mono text-sm font-extrabold ${
                remaining > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                {formatMoney(remaining)}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                {t('orderPayments.paymentStatus', 'Statut Règlement')}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${paymentMeta.bg} ${paymentMeta.text}`}>
                {paymentMeta.label}
              </span>
            </div>
          </div>

          {/* Payments Table */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-nasaq-teal" />
                {t('orderPayments.recordedPayments', 'Versements Enregistrés')} ({payments.length})
              </h4>
              {canRecordPayments && remaining > 0 && onRecordPayment && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRecordPayment(currentOrder);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('orderPayments.recordNew', '+ Encaisser un Versement')}</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-nasaq-teal" />
                <span>{t('orderPayments.loading', 'Chargement de l\'historique des paiements...')}</span>
              </div>
            ) : payments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <CreditCard className="w-8 h-8 mx-auto text-slate-300" />
                <p>{t('orderPayments.noPayments', 'Aucun versement n\'a encore été enregistré pour cette commande.')}</p>
                {canRecordPayments && remaining > 0 && onRecordPayment && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRecordPayment(currentOrder);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-nasaq-teal hover:bg-nasaq-teal-dark text-white rounded-lg text-xs font-bold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('orderPayments.recordFirst', 'Enregistrer le premier acompte')}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-500 text-[10.5px] uppercase font-bold">
                    <tr>
                      <th className="py-2.5 px-3">{t('orderPayments.tableDate', 'Date')}</th>
                      <th className="py-2.5 px-3">{t('orderPayments.tableAmount', 'Montant Encaissé')}</th>
                      <th className="py-2.5 px-3">{t('orderPayments.tableNotes', 'Remarques / Mode')}</th>
                      <th className="py-2.5 px-3">{t('orderPayments.tableStatus', 'Statut')}</th>
                      {isAdmin && <th className="py-2.5 px-3 text-right">{t('orderPayments.tableAction', 'Action')}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {payments.map(p => {
                      const isVoided = p.status === 'voided';
                      return (
                        <tr 
                          key={p.id} 
                          className={isVoided ? 'bg-rose-50/40 opacity-70' : 'hover:bg-slate-50/80 transition'}
                        >
                          {/* Date */}
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {formatDate(p.payment_date)}
                          </td>

                          {/* Amount */}
                          <td className={`py-2.5 px-3 font-mono font-bold ${
                            isVoided ? 'line-through text-slate-400' : 'text-emerald-700 font-extrabold text-sm'
                          }`}>
                            {formatMoney(p.amount)}
                          </td>

                          {/* Notes */}
                          <td className="py-2.5 px-3 text-slate-600">
                            {p.notes || <span className="text-slate-400 italic">{t('orderPayments.standardNote', 'Règlement standard')}</span>}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3">
                            {isVoided ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                                <Ban className="w-3 h-3" />
                                {t('orderPayments.voided', 'Annulé (Void)')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                {t('orderPayments.validated', 'Validé')}
                              </span>
                            )}
                          </td>

                          {/* Admin void action */}
                          {isAdmin && (
                            <td className="py-2.5 px-3 text-right">
                              {!isVoided ? (
                                <button
                                  type="button"
                                  onClick={() => handleVoidPayment(p.id)}
                                  className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline font-semibold"
                                  title="Void this payment transaction"
                                >
                                  {t('common.cancel', 'Annuler')}
                                </button>
                              ) : (
                                <span className="text-slate-300 text-[10px] italic">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {payments.filter(p => p.status !== 'voided').length} {t('orderPayments.activeCount', 'versement(s) actif(s)')}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
            >
              {t('common.close', 'Fermer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
