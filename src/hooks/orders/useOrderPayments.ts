import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../api/supabase';
import { Order, OrderPayment } from '../../types/database';

interface UseOrderPaymentsProps {
  order: Order;
  onRefreshOrders?: () => void;
}

export function useOrderPayments({ order, onRefreshOrders }: UseOrderPaymentsProps) {
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentOrder, setCurrentOrder] = useState<Order>(order);

  const fetchPayments = useCallback(async () => {
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
      let { data, error } = await supabase
        .from('order_payments')
        .select('*')
        .eq('order_id', order.id)
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Auto-heal / backfill check
      const currentPaidAmount = Number(ordData ? ordData.paid_amount : order.paid_amount) || 0;
      const activePayments = (data || []).filter((p) => p.status !== 'voided');
      if (activePayments.length === 0 && currentPaidAmount > 0) {
        const orderCreatedAt = (ordData || order).created_at;
        const dateCreated = orderCreatedAt
          ? orderCreatedAt.split('T')[0]
          : new Date().toISOString().split('T')[0];
        const orderNum = (ordData || order).order_number || '';
        const { data: insertedPayment, error: insertErr } = await supabase
          .from('order_payments')
          .insert({
            order_id: order.id,
            amount: currentPaidAmount,
            payment_date: dateCreated,
            notes: `Acompte initial versé à la commande (${orderNum})`,
            status: 'successful',
          })
          .select()
          .single();

        if (!insertErr && insertedPayment) {
          data = [insertedPayment, ...(data || [])];
          if (onRefreshOrders) onRefreshOrders();
        }
      }

      setPayments(data || []);
    } catch (err) {
      console.error('Error fetching order payments:', err);
    } finally {
      setLoading(false);
    }
  }, [order, onRefreshOrders]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleVoidPayment = async (paymentId: string): Promise<boolean> => {
    try {
      const paymentToVoid = payments.find((p) => p.id === paymentId);
      const { error } = await supabase
        .from('order_payments')
        .update({ status: 'voided' })
        .eq('id', paymentId);

      if (error) throw error;

      // Adjust orders.paid_amount
      if (paymentToVoid && paymentToVoid.status !== 'voided') {
        const newPaidAmount = Math.max(0, (Number(currentOrder.paid_amount) || 0) - Number(paymentToVoid.amount));
        await supabase
          .from('orders')
          .update({ paid_amount: newPaidAmount, updated_at: new Date().toISOString() })
          .eq('id', currentOrder.id);
      }

      await fetchPayments();
      if (onRefreshOrders) onRefreshOrders();
      return true;
    } catch (err: any) {
      console.error('Error voiding payment:', err);
      return false;
    }
  };

  return {
    payments,
    loading,
    currentOrder,
    fetchPayments,
    handleVoidPayment,
  };
}
