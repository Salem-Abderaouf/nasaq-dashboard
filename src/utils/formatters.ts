import { OrderStatus, ProspectStatus } from '../types/database';

export function formatMoney(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0;
  return num.toLocaleString('fr-FR').replace(/\u202F/g, ' ') + ' DA';
}

export function formatDiff(amount: number | string | null | undefined): string {
  const num = Math.abs(Number(amount) || 0);
  return '− ' + num.toLocaleString('fr-FR').replace(/\u202F/g, ' ') + ' DA';
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function getOrderStatusMeta(
  status: OrderStatus,
  t?: (key: string, fallback?: string) => string
): { label: string; bg: string; text: string; dot: string } {
  const tr = (k: string, fb: string) => (t ? t(k, fb) : fb);
  switch (status) {
    case 'draft':
      return { label: tr('status.draft', 'Brouillon'), bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };
    case 'confirmed':
      return { label: tr('status.confirmed', 'Confirmée'), bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' };
    case 'manufacturing':
      return { label: tr('status.manufacturing', 'En Fabrication'), bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' };
    case 'ready_for_dispatch':
      return { label: tr('status.ready_for_dispatch', 'Prête Expédition'), bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' };
    case 'in_transit':
      return { label: tr('status.in_transit', 'En Livraison'), bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' };
    case 'delivered':
      return { label: tr('status.delivered', 'Livrée'), bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' };
    case 'installation':
      return { label: tr('status.installation', 'En Pose'), bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' };
    case 'completed':
      return { label: tr('status.completed', 'Terminée'), bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' };
    case 'cancelled':
      return { label: tr('status.cancelled', 'Annulée'), bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' };
    default:
      return { label: status, bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };
  }
}

export function getProspectStatusMeta(
  status: ProspectStatus,
  t?: (key: string, fallback?: string) => string
): { label: string; bg: string; text: string } {
  const tr = (k: string, fb: string) => (t ? t(k, fb) : fb);
  switch (status) {
    case 'new':
      return { label: tr('prospects.status.new', 'Nouveau'), bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700' };
    case 'contacted':
      return { label: tr('prospects.status.contacted', 'Contacté'), bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700' };
    case 'interested':
      return { label: tr('prospects.status.interested', 'Intéressé'), bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700' };
    case 'negotiation':
      return { label: tr('prospects.status.negotiation', 'Négociation'), bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'text-indigo-700' };
    case 'converted':
      return { label: tr('prospects.status.converted', 'Converti en Client'), bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700' };
    case 'lost':
      return { label: tr('prospects.status.lost', 'Perdu / Abandonné'), bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700' };
    default:
      return { label: status, bg: 'bg-slate-50 text-slate-700 border-slate-200', text: 'text-slate-700' };
  }
}

export function getPaymentBadge(
  paidAmount: number,
  totalAmount: number,
  t?: (key: string, fallback?: string) => string
): { label: string; bg: string; text: string } {
  const tr = (k: string, fb: string) => (t ? t(k, fb) : fb);
  if (paidAmount <= 0) {
    return { label: tr('status.paid_unpaid', 'Non Payé'), bg: 'bg-rose-50', text: 'text-rose-700' };
  }
  if (paidAmount < totalAmount) {
    return { label: tr('status.paid_partial', 'Acompte Versé'), bg: 'bg-amber-50', text: 'text-amber-700' };
  }
  if (paidAmount === totalAmount) {
    return { label: tr('status.paid_full', 'Payé Intégral'), bg: 'bg-emerald-50', text: 'text-emerald-700' };
  }
  return { label: tr('status.paid_overpaid', 'Trop-Perçu'), bg: 'bg-blue-50', text: 'text-blue-700' };
}
