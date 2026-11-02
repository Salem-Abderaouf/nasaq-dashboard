import { Client } from '../../types/database';

export interface ClientFinancialStats {
  totalOrders: number;
  totalValue: number;
  totalPaid: number;
  outstanding: number;
}

/**
 * Extracts initials for client avatar display (e.g. "Mohamed Amine" -> "MA")
 */
export function getInitials(name: string): string {
  if (!name) return 'CL';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Pure calculation of a client's cumulative financial ledger
 */
export function calculateClientFinancials(orders: any[]): ClientFinancialStats {
  const ordersList = orders || [];
  const totalOrders = ordersList.length;
  let totalValue = 0;
  let totalPaid = 0;
  let outstanding = 0;

  ordersList.forEach(o => {
    const tot = Number(o.total_amount) || 0;
    const paid = Number(o.paid_amount) || 0;
    if (o.status !== 'cancelled') {
      totalValue += tot;
      totalPaid += paid;
      if (tot > paid) {
        outstanding += (tot - paid);
      }
    }
  });

  return {
    totalOrders,
    totalValue,
    totalPaid,
    outstanding
  };
}

/**
 * Filters clients in-memory by name or phone
 */
export function filterClients(clients: Client[], query: string): Client[] {
  if (!query.trim()) return clients;
  const q = query.toLowerCase().trim();
  return clients.filter(c => 
    (c.name && c.name.toLowerCase().includes(q)) ||
    (c.phone && c.phone.toLowerCase().includes(q)) ||
    (c.address && c.address.toLowerCase().includes(q))
  );
}
