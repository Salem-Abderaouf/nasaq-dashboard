import { Order, OrderStatus } from '../../types/database';

export interface DashboardFinancials {
  totalOrdersCount: number;
  totalOrdersValue: number;
  totalPaidCash: number;
  realizedRevenue: number;
  outstandingDebt: number;
  statusCounts: Record<OrderStatus, number>;
}

export interface TopDoorItem {
  reference: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
}

/**
 * Calculates financial aggregates and pipeline status counts from orders
 */
export function calculateDashboardFinancials(orders: Order[]): DashboardFinancials {
  const totalOrdersCount = orders.length;
  let totalOrdersValue = 0;
  let totalPaidCash = 0;
  let realizedRevenue = 0;
  let outstandingDebt = 0;

  const statusCounts: Record<OrderStatus, number> = {
    draft: 0,
    confirmed: 0,
    manufacturing: 0,
    ready_for_dispatch: 0,
    in_transit: 0,
    delivered: 0,
    installation: 0,
    completed: 0,
    cancelled: 0
  };

  orders.forEach(o => {
    const tot = Number(o.total_amount) || 0;
    const paid = Number(o.paid_amount) || 0;
    totalOrdersValue += tot;
    totalPaidCash += paid;

    if (['delivered', 'installation', 'completed'].includes(o.status)) {
      realizedRevenue += tot;
    }
    if (o.status !== 'cancelled' && tot > paid) {
      outstandingDebt += (tot - paid);
    }

    if (statusCounts[o.status] !== undefined) {
      statusCounts[o.status] += 1;
    }
  });

  return {
    totalOrdersCount,
    totalOrdersValue,
    totalPaidCash,
    realizedRevenue,
    outstandingDebt,
    statusCounts
  };
}

/**
 * Aggregates order item door models by quantity and revenue
 */
export function aggregateTopDoors(itemsData: any[]): TopDoorItem[] {
  if (!itemsData || itemsData.length === 0) return [];

  const stats: Record<string, TopDoorItem> = {};

  itemsData.forEach((it: any) => {
    const prod = it.door_products;
    const key = it.product_id || prod?.reference || 'Unknown';
    if (!stats[key]) {
      stats[key] = {
        reference: prod?.reference || 'WPC',
        name: prod?.name || 'Modèle Personnalisé',
        category: prod?.category || 'Porte WPC',
        quantity: 0,
        revenue: 0
      };
    }
    stats[key].quantity += Number(it.quantity || 1);
    stats[key].revenue += Number(it.total_price || 0);
  });

  return Object.values(stats).sort((a, b) => b.quantity - a.quantity);
}
