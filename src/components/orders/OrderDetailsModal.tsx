import React, { useState, useEffect } from 'react';
import { Order, OrderItem, OrderPayment, OrderStatus } from '../../types/database';
import { supabase } from '../../api/supabase';
import { formatMoney, formatDate, getOrderStatusMeta, getPaymentBadge } from '../../utils/formatters';
import { DoorElevationSVG } from '../2d/DoorElevationSVG';
import { DoorConfigItem } from '../../types/configurator';
import { X, Printer, CheckCircle, Ban, Clock, ShoppingBag, Sliders, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onRefreshOrder: () => void;
  onRecordPayment: (order: Order) => void;
  onEditInStudio?: (order: Order) => void;
  onDeleteOrder?: (order: Order) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onRefreshOrder,
  onRecordPayment,
  onEditInStudio,
  onDeleteOrder
}) => {
  if (!order) return null;

  const { hasPermission, user } = useAuth();
  const { t, isRtl } = useLanguage();
  const canViewFinancials = hasPermission('canViewFinancials');
  const canRecordPayments = hasPermission('canRecordPayments');
  const canChangeOrderStatus = hasPermission('canChangeOrderStatus');
  const canCreateOrders = hasPermission('canCreateOrders');
  const isAdmin = user?.role === 'admin';
  const canDeleteOrders = isAdmin || canCreateOrders;

  const [items, setItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteOrder = async () => {
    if (!order) return;
    setDeleting(true);
    try {
      // 1. Delete associated payments
      await supabase.from('order_payments').delete().eq('order_id', order.id);
      // 2. Delete status history
      await supabase.from('order_status_history').delete().eq('order_id', order.id);
      // 3. Delete order items
      await supabase.from('order_items').delete().eq('order_id', order.id);
      // 4. Delete the order
      const { error } = await supabase.from('orders').delete().eq('id', order.id);
      if (error) throw error;

      if (onDeleteOrder) {
        onDeleteOrder(order);
      }
      onRefreshOrder();
      onClose();
    } catch (err: any) {
      console.error('Error deleting order:', err);
      alert(t('orders.deleteError', 'Erreur lors de la suppression de la commande.'));
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      try {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*, door_products (*)')
          .eq('order_id', order!.id);

        const { data: paymentsData } = await supabase
          .from('order_payments')
          .select('*')
          .eq('order_id', order!.id)
          .order('payment_date', { ascending: false });

        setItems(itemsData || []);
        setPayments(paymentsData || []);
      } catch (err) {
        console.error('Error loading order details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [order]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', order.id);

      if (error) throw error;
      onRefreshOrder();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(t('orderModal.updateStatusError', 'Erreur lors de la mise à jour du statut.'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleVoidPayment = async (paymentId: string) => {
    if (!confirm(t('orderPayments.confirmVoid', 'Voulez-vous annuler (void) cette transaction de paiement ?'))) return;
    try {
      const { error } = await supabase
        .from('order_payments')
        .update({ status: 'voided' })
        .eq('id', paymentId);

      if (error) throw error;
      onRefreshOrder();
      // refresh payments
      const { data } = await supabase
        .from('order_payments')
        .select('*')
        .eq('order_id', order.id)
        .order('payment_date', { ascending: false });
      setPayments(data || []);
    } catch (err) {
      console.error('Error voiding payment:', err);
      alert(t('orderPayments.voidError', 'Erreur lors de l\'annulation du paiement.'));
    }
  };

  const statusMeta = getOrderStatusMeta(order.status, t);
  const paymentMeta = getPaymentBadge(order.paid_amount, order.total_amount, t);
  const remaining = Math.max(0, order.total_amount - order.paid_amount);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs print:!static print:!p-0 print:!bg-white">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:!max-h-none print:!border-none print:!shadow-none print:!w-full print:!overflow-visible">
        
        {/* Header */}
        <div className="bg-nasaq-teal text-white p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-nasaq-gold text-slate-900 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-base font-extrabold">{order.order_number}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusMeta.bg} ${statusMeta.text}`}>
                  {t('status.' + order.status, statusMeta.label)}
                </span>
              </div>
              <span className="text-[11px] text-nasaq-gold-light">
                {t('orderModal.createdOn', 'Créée le')} {formatDate(order.created_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            {canCreateOrders && onEditInStudio && (
              <button
                type="button"
                onClick={() => {
                  onEditInStudio(order);
                  onClose();
                }}
                className="flex items-center gap-1.5 bg-nasaq-gold hover:bg-nasaq-gold-dark text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
                title={t('orderModal.editInStudio', 'Modifier les portes et dimensions de cette commande dans le Studio 2D')}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('orders.editInStudio', 'Modifier dans le Studio 2D')}</span>
                <span className="sm:hidden">Studio 2D</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
              title={t('common.print', 'Imprimer')}
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
              title={t('common.close', 'Fermer')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs print:!overflow-visible print:!p-0">
          
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Client Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('common.client', 'Client')}</span>
              <div className="font-bold text-slate-900 text-sm">{order.clients?.name || 'N/A'}</div>
              <div className="text-slate-500 font-mono text-xs">{order.clients?.phone || 'N/A'}</div>
              <div className="text-slate-500 text-[11px]">{order.clients?.address || 'Pas d\'adresse spécifiée'}</div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {t('orderModal.financials', 'Finances & Paiement')}
              </span>
              {canViewFinancials ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">{t('common.total', 'Total')} :</span>
                    <span className="font-mono font-bold text-sm text-slate-900">{formatMoney(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">{t('common.paid', 'Encaissé')} :</span>
                    <span className="font-mono font-bold text-xs text-emerald-600">{formatMoney(order.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="font-bold text-slate-700">{t('common.remaining', 'Reste dû')} :</span>
                    <span className="font-mono font-extrabold text-xs text-rose-600">{formatMoney(remaining)}</span>
                  </div>
                </>
              ) : (
                <div className="py-2 text-center text-slate-400 italic text-[11px]">
                  {t('orders.workshopMode', 'Mode Atelier (0 DA)')}
                </div>
              )}
            </div>

            {/* Workflow Control */}
            <div className="bg-nasaq-teal-subtle border border-nasaq-teal/20 rounded-xl p-3.5 space-y-2">
              <span className="text-[10px] uppercase font-bold text-nasaq-teal">{t('orderModal.changeStatus', 'Changer le Statut')}</span>
              <select
                value={order.status}
                disabled={updatingStatus || !canChangeOrderStatus}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                className="w-full px-2.5 py-1.5 text-xs font-bold border border-nasaq-teal/40 rounded-lg bg-white text-nasaq-teal-dark focus:outline-none disabled:opacity-60"
                title={!canChangeOrderStatus ? "Permission de mise à jour des statuts non accordée." : undefined}
              >
                <option value="draft">1. {t('status.draft', 'Brouillon')}</option>
                <option value="confirmed">2. {t('status.confirmed', 'Confirmée')}</option>
                <option value="manufacturing">3. {t('status.manufacturing', 'En Fabrication')}</option>
                <option value="ready_for_dispatch">4. {t('status.ready_for_dispatch', 'Prête Expédition')}</option>
                <option value="in_transit">5. {t('status.in_transit', 'En Livraison')}</option>
                <option value="delivered">6. {t('status.delivered', 'Livrée')}</option>
                <option value="installation">7. {t('status.installation', 'En Pose')}</option>
                <option value="completed">8. {t('status.completed', 'Terminée')}</option>
                <option value="cancelled">9. {t('status.cancelled', 'Annulée')}</option>
              </select>
              <div className="text-[10px] text-slate-500">
                {canChangeOrderStatus 
                  ? t('orderModal.statusHistoryNote', "L'historique des changements de statut est conservé pour l'audit d'atelier.") 
                  : t('orderModal.noPermissionStatus', "Seuls les opérateurs autorisés peuvent faire avancer le statut.")}
              </div>
            </div>
          </div>

          {/* Order Items Table with 2D Visual Previews */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              {t('orderModal.orderedItems', 'Articles & Portes Commandées')} ({items.length})
            </h3>

            {loading ? (
              <div className="py-8 text-center text-slate-400">
                {t('orderModal.loadingDoors', 'Chargement des portes...')}
              </div>
            ) : items.length === 0 ? (
              <div className="py-6 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                {t('orderModal.noItems', 'Aucun article associé à cette commande.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((it, idx) => {
                  const config = (it.configuration || {}) as Partial<DoorConfigItem>;
                  const doorItemConfig: DoorConfigItem = {
                    id: `P${idx + 1}`,
                    heightCm: it.height || 210,
                    widthCm: it.width || 85,
                    designation: it.door_products?.name || it.door_products?.reference || "Porte WPC",
                    priceNormal: it.unit_price || 0,
                    pricePromo: config.pricePromo || it.unit_price || 0,
                    colorId: it.color || config.colorId || "chene_bois",
                    patternId: config.patternId || "none",
                    doorStructure: config.doorStructure || "single",
                    leftLeafPercent: config.leftLeafPercent || 28,
                    hardwareColor: config.hardwareColor || "black",
                    glassPanes: config.glassPanes || [],
                    hasRevetment: Boolean(config.hasRevetment),
                    revetmentHeightCm: config.revetmentHeightCm || 110
                  };

                  return (
                    <div 
                      key={it.id || idx}
                      className="bg-white border border-slate-200 rounded-xl p-3 flex gap-3 shadow-2xs hover:shadow-xs transition"
                    >
                      {/* Mini 2D SVG preview */}
                      <div className="w-24 h-36 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-1 shrink-0">
                        <DoorElevationSVG door={doorItemConfig} scale={0.35} showDimensions={false} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col justify-between overflow-hidden">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs text-nasaq-teal">P{idx + 1}</span>
                            <span className="font-mono text-xs font-bold text-slate-900">{formatMoney(it.unit_price)}</span>
                          </div>
                          <div className="font-bold text-slate-800 text-xs truncate mt-0.5">
                            {it.door_products?.name || "Porte d'intérieur WPC"}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {it.height} × {it.width} cm • Épaisseur: {it.thickness || 4} cm
                          </div>
                          <div className="text-[10.5px] text-slate-500 mt-1">
                            Couleur: <strong className="text-slate-700 capitalize">{it.color}</strong> • Ouvrant: {doorItemConfig.doorStructure === 'double' ? '2 Vantaux' : '1 Vantail'}
                          </div>
                          {doorItemConfig.patternId && doorItemConfig.patternId !== 'none' && (
                            <div className="text-[10px] text-amber-700 font-bold">
                              Motif: {doorItemConfig.patternId}
                            </div>
                          )}
                          {doorItemConfig.glassPanes.length > 0 && (
                            <div className="text-[10px] text-sky-700 font-medium">
                              Vitrages: {doorItemConfig.glassPanes.length} découpe(s)
                            </div>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono text-right">
                          Qté : {it.quantity} • Total : {formatMoney(it.total_price || (it.quantity * it.unit_price))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Transactions Ledger (Only visible if canViewFinancials) */}
          {canViewFinancials && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-nasaq-teal" />
                  {t('orderModal.paymentsHistory', 'Historique des Versements')} ({payments.length})
                </h3>
                {canRecordPayments && remaining > 0 && (
                  <button
                    type="button"
                    onClick={() => onRecordPayment(order)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                  >
                    {t('orderModal.recordNewPayment', '+ Encaisser Versement')}
                  </button>
                )}
              </div>

              {payments.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-slate-200">
                  {t('orderModal.noPayments', 'Aucun versement enregistré pour cette commande.')}
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">
                      <tr>
                        <th className="py-2 px-3">{t('orderPayments.tableDate', 'Date')}</th>
                        <th className="py-2 px-3">{t('orderPayments.tableAmount', 'Montant')}</th>
                        <th className="py-2 px-3">{t('orderPayments.tableNotes', 'Remarques')}</th>
                        <th className="py-2 px-3">{t('orderPayments.tableStatus', 'Statut')}</th>
                        <th className="py-2 px-3 text-right">{t('orderPayments.tableAction', 'Action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map(p => {
                        const isVoided = p.status === 'voided';
                        return (
                          <tr key={p.id} className={isVoided ? 'bg-rose-50/40 opacity-70' : 'hover:bg-slate-50'}>
                            <td className="py-2 px-3 font-mono text-slate-600">{formatDate(p.payment_date)}</td>
                            <td className={`py-2 px-3 font-mono font-bold ${isVoided ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {formatMoney(p.amount)}
                            </td>
                            <td className="py-2 px-3 text-slate-600 truncate max-w-xs">{p.notes || '-'}</td>
                            <td className="py-2 px-3">
                              {isVoided ? (
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                                  {t('orderPayments.voided', 'Annulé')}
                                </span>
                              ) : (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                                  {t('orderPayments.validated', 'Validé')}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {!isVoided && isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleVoidPayment(p.id)}
                                  className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold"
                                  title={t('orderModal.voidTooltip', 'Annuler cette transaction (Void - Réservé Admin)')}
                                >
                                  {t('orderModal.voidPayment', 'Annuler')}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 px-6 flex items-center justify-between">
          <div>
            {canDeleteOrders && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg text-xs font-bold transition"
                title={t('orders.deleteOrder', 'Supprimer la commande')}
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('orders.deleteOrder', 'Supprimer la commande')}</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition"
          >
            {t('common.close', 'Fermer')}
          </button>
        </div>
      </div>
    </div>

      {/* Delete Order Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-sm">
                  {t('orders.deleteConfirmTitle', 'Supprimer la Commande')}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t('orders.deleteConfirmPrompt', 'Êtes-vous sûr de vouloir supprimer définitivement la commande')}{' '}
                  <strong className="text-slate-800 font-bold font-mono">{order.order_number}</strong> ?
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-600">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11.5px] leading-relaxed">
                  {t('orders.deleteWarning', 'Cette action est irréversible. Toutes les portes configurées, fiches de débit d\'atelier et versements liés à cette commande seront définitivement effacés.')}
                </p>
              </div>

              {order.paid_amount > 0 && (
                <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[11.5px] leading-relaxed">
                    {t('orders.deleteWarningPaid', 'Cette commande comprend un montant encaissé de')}{' '}
                    <strong className="font-mono font-bold">{formatMoney(order.paid_amount)}</strong>.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition text-xs"
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition text-xs shadow-xs disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('orders.deleting', 'Suppression en cours...')}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('orders.confirmDeleteBtn', 'Supprimer Définitivement')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
