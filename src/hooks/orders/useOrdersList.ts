import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../api/supabase';
import { Order, OrderStatus } from '../../types/database';
import {
  filterOrders,
  deleteOrderCascade,
  PaymentFilterType,
} from '../../helpers/orders/orderHelpers';

export function useOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterType>('all');

  // Deletion modal state
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          clients (name, phone, address),
          users (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Derived filtered orders
  const filteredOrders = useMemo(() => {
    return filterOrders(orders, { searchTerm, statusFilter, paymentFilter });
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  // Execute order deletion with cascading DB cleanup
  const handleDeleteOrder = async (onSuccessCallback?: (deletedOrder: Order) => void): Promise<boolean> => {
    if (!orderToDelete) return false;
    setDeleting(true);
    try {
      await deleteOrderCascade(supabase, orderToDelete.id);
      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      if (onSuccessCallback) onSuccessCallback(orderToDelete);
      showToast(`Commande "${orderToDelete.order_number}" supprimée avec succès.`, 'success');
      setOrderToDelete(null);
      return true;
    } catch (err: any) {
      console.error('Error deleting order:', err);
      showToast(err.message || 'Erreur lors de la suppression de la commande.', 'error');
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    orders,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    paymentFilter,
    setPaymentFilter,
    filteredOrders,

    // Delete state & actions
    orderToDelete,
    setOrderToDelete,
    deleting,
    handleDeleteOrder,

    // Toast
    toastMessage,
    showToast,

    // Actions
    fetchOrders,
  };
}
