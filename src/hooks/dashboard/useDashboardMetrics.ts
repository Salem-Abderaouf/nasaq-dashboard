import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../api/supabase';
import { Order } from '../../types/database';
import {
  calculateDashboardFinancials,
  aggregateTopDoors,
  TopDoorItem
} from '../../helpers/dashboard/metricHelpers';

export function useDashboardMetrics() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clientsCount, setClientsCount] = useState(0);
  const [prospectsCount, setProspectsCount] = useState(0);
  const [workersCount, setWorkersCount] = useState(0);
  const [topDoors, setTopDoors] = useState<TopDoorItem[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders with clients and users
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

      // 2. Fetch counts in parallel
      const [cRes, pRes, wRes, itemsRes] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('prospects').select('*', { count: 'exact', head: true }),
        supabase.from('workers').select('*', { count: 'exact', head: true }),
        supabase.from('order_items').select(`
          product_id,
          quantity,
          total_price,
          door_products (reference, name, category)
        `)
      ]);

      setClientsCount(cRes.count || 0);
      setProspectsCount(pRes.count || 0);
      setWorkersCount(wRes.count || 0);

      if (itemsRes.data) {
        setTopDoors(aggregateTopDoors(itemsRes.data));
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Compute live aggregates from orders
  const financials = useMemo(() => {
    return calculateDashboardFinancials(orders);
  }, [orders]);

  return {
    loading,
    orders,
    clientsCount,
    prospectsCount,
    workersCount,
    topDoors,
    financials,
    fetchDashboardData
  };
}
