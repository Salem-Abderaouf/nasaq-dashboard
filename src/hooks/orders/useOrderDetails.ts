import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../api/supabase';
import { Order, OrderItem, OrderPayment, OrderStatus } from '../../types/database';
import { deleteOrderCascade } from '../../helpers/orders/orderHelpers';

interface UseOrderDetailsProps {
  order: Order | null;
  onRefreshOrder?: () => void;
  onDeleteOrder?: (order: Order) => void;
  onClose?: () => void;
}

export function useOrderDetails({
  order,
  onRefreshOrder,
  onDeleteOrder,
  onClose,
}: UseOrderDetailsProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const loadDetails = useCallback(async () => {
    if (!order) return;
    setLoading(true);
    try {
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*, door_products (*)')
        .eq('order_id', order.id);

      let { data: paymentsData } = await supabase
        .from('order_payments')
        .select('*')
        .eq('order_id', order.id)
        .order('payment_date', { ascending: false });

      // Auto-heal / backfill missing initial deposit if paid_amount > 0 and 0 active payments
      const paidAmountNum = Number(order.paid_amount) || 0;
      const activePayments = (paymentsData || []).filter((p) => p.status !== 'voided');
      if (activePayments.length === 0 && paidAmountNum > 0) {
        const dateCreated = order.created_at
          ? order.created_at.split('T')[0]
          : new Date().toISOString().split('T')[0];
        const { data: insertedPayment, error: insertErr } = await supabase
          .from('order_payments')
          .insert({
            order_id: order.id,
            amount: paidAmountNum,
            payment_date: dateCreated,
            notes: `Acompte initial versé à la commande (${order.order_number})`,
            status: 'successful',
          })
          .select()
          .single();

        if (!insertErr && insertedPayment) {
          paymentsData = [insertedPayment, ...(paymentsData || [])];
          if (onRefreshOrder) onRefreshOrder();
        }
      }

      setItems(itemsData || []);
      setPayments(paymentsData || []);
    } catch (err) {
      console.error('Error loading order details:', err);
    } finally {
      setLoading(false);
    }
  }, [order, onRefreshOrder]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // Handle order status change
  const handleStatusChange = async (newStatus: OrderStatus): Promise<boolean> => {
    if (!order) return false;
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', order.id);

      if (error) throw error;
      if (onRefreshOrder) onRefreshOrder();
      return true;
    } catch (err) {
      console.error('Error updating status:', err);
      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Void payment transaction with orders.paid_amount adjustment
  const handleVoidPayment = async (paymentId: string): Promise<boolean> => {
    if (!order) return false;
    try {
      const paymentToVoid = payments.find((p) => p.id === paymentId);
      const { error } = await supabase
        .from('order_payments')
        .update({ status: 'voided' })
        .eq('id', paymentId);

      if (error) throw error;

      // Adjust orders.paid_amount
      if (paymentToVoid && paymentToVoid.status !== 'voided') {
        const newPaidAmount = Math.max(0, (Number(order.paid_amount) || 0) - Number(paymentToVoid.amount));
        await supabase
          .from('orders')
          .update({ paid_amount: newPaidAmount, updated_at: new Date().toISOString() })
          .eq('id', order.id);
      }

      if (onRefreshOrder) onRefreshOrder();
      await loadDetails();
      return true;
    } catch (err) {
      console.error('Error voiding payment:', err);
      return false;
    }
  };

  // Delete current order
  const handleDeleteOrder = async (): Promise<boolean> => {
    if (!order) return false;
    setDeleting(true);
    try {
      await deleteOrderCascade(supabase, order.id);
      if (onDeleteOrder) onDeleteOrder(order);
      if (onRefreshOrder) onRefreshOrder();
      if (onClose) onClose();
      return true;
    } catch (err: any) {
      console.error('Error deleting order:', err);
      return false;
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return {
    items,
    payments,
    loading,
    updatingStatus,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleting,
    loadDetails,
    handleStatusChange,
    handleVoidPayment,
    handleDeleteOrder,
  };
}
