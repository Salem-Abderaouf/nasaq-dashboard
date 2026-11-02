import { Order, OrderStatus } from '../../types/database';
import { SupabaseClient } from '@supabase/supabase-js';

export type PaymentFilterType = 'all' | 'paid' | 'partial' | 'unpaid';

export interface OrderFilterOptions {
  searchTerm: string;
  statusFilter: OrderStatus | 'all';
  paymentFilter: PaymentFilterType;
}

export interface OrdersFinancialSummary {
  totalOrders: number;
  totalTurnover: number;
  totalPaid: number;
  totalRemaining: number;
}

/**
 * Filter list of orders based on search string, status and payment level.
 */
export function filterOrders(orders: Order[], options: OrderFilterOptions): Order[] {
  const { searchTerm, statusFilter, paymentFilter } = options;
  const s = searchTerm.trim().toLowerCase();

  return orders.filter((o) => {
    // 1. Text search
    if (s) {
      const matchNumber = o.order_number?.toLowerCase().includes(s);
      const matchClientName = o.clients?.name?.toLowerCase().includes(s);
      const matchClientPhone = o.clients?.phone?.includes(s);
      if (!matchNumber && !matchClientName && !matchClientPhone) return false;
    }

    // 2. Status filter
    if (statusFilter !== 'all' && o.status !== statusFilter) {
      return false;
    }

    // 3. Payment filter
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
}

/**
 * Computes financial metrics across a given set of orders.
 */
export function calculateOrdersFinancials(orders: Order[]): OrdersFinancialSummary {
  const totalOrders = orders.length;
  let totalTurnover = 0;
  let totalPaid = 0;

  for (const o of orders) {
    totalTurnover += Number(o.total_amount) || 0;
    totalPaid += Number(o.paid_amount) || 0;
  }

  const totalRemaining = Math.max(0, totalTurnover - totalPaid);

  return {
    totalOrders,
    totalTurnover,
    totalPaid,
    totalRemaining,
  };
}

/**
 * Record a payment transaction and update orders.paid_amount in sync.
 */
export async function recordOrderPayment(
  supabase: SupabaseClient,
  params: {
    orderId: string;
    currentPaidAmount: number;
    amount: number;
    paymentDate: string;
    notes?: string;
  }
): Promise<void> {
  const { orderId, currentPaidAmount, amount, paymentDate, notes } = params;

  // 1. Insert into order_payments
  const { error: payErr } = await supabase.from('order_payments').insert({
    order_id: orderId,
    amount: amount,
    payment_date: paymentDate,
    notes: notes || null,
    status: 'successful',
  });

  if (payErr) throw payErr;

  // 2. Synchronize orders.paid_amount
  const newPaidAmount = currentPaidAmount + amount;
  const { error: ordErr } = await supabase
    .from('orders')
    .update({ paid_amount: newPaidAmount, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (ordErr) {
    console.warn('Error updating order paid_amount after recording payment:', ordErr);
  }
}

export async function deleteOrderCascade(supabase: SupabaseClient, orderId: string): Promise<void> {
  // 1. Delete associated payments
  const { error: payErr } = await supabase
    .from('order_payments')
    .delete()
    .eq('order_id', orderId);
  if (payErr) console.warn('Error deleting payments:', payErr);

  // 2. Delete status history
  const { error: histErr } = await supabase
    .from('order_status_history')
    .delete()
    .eq('order_id', orderId);
  if (histErr) console.warn('Error deleting history:', histErr);

  // 3. Delete order items
  const { error: itemsErr } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId);
  if (itemsErr) console.warn('Error deleting items:', itemsErr);

  // 4. Delete the order
  const { error: orderErr } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);
  if (orderErr) throw orderErr;
}
