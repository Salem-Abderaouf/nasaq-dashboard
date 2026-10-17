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

export function getOrderStatusMeta(status: OrderStatus): { label: string; bg: string; text: string; dot: string } {
  switch (status) {
    case 'draft':
      return { label: 'Brouillon', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };
    case 'confirmed':
      return { label: 'Confirmée', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' };
    case 'manufacturing':
      return { label: 'En Fabrication', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' };
    case 'ready_for_dispatch':
      return { label: 'Prête Expédition', bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' };
    case 'in_transit':
      return { label: 'En Livraison', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' };
    case 'delivered':
      return { label: 'Livrée', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' };
    case 'installation':
      return { label: 'En Pose', bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' };
    case 'completed':
      return { label: 'Terminée', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' };
    case 'cancelled':
      return { label: 'Annulée', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' };
    default:
      return { label: status, bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };
  }
}

export function getProspectStatusMeta(status: ProspectStatus): { label: string; bg: string; text: string } {
  switch (status) {
    case 'new':
      return { label: 'Nouveau', bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700' };
    case 'contacted':
      return { label: 'Contacté', bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700' };
    case 'interested':
      return { label: 'Intéressé', bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700' };
    case 'negotiation':
      return { label: 'Négociation', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'text-indigo-700' };
    case 'converted':
      return { label: 'Converti en Client', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700' };
    case 'lost':
      return { label: 'Perdu / Abandonné', bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700' };
    default:
      return { label: status, bg: 'bg-slate-50 text-slate-700 border-slate-200', text: 'text-slate-700' };
  }
}

export function getPaymentBadge(paidAmount: number, totalAmount: number): { label: string; bg: string; text: string } {
  if (paidAmount <= 0) {
    return { label: 'Non Payé', bg: 'bg-rose-50', text: 'text-rose-700' };
  }
  if (paidAmount < totalAmount) {
    return { label: 'Acompte Versé', bg: 'bg-amber-50', text: 'text-amber-700' };
  }
  if (paidAmount === totalAmount) {
    return { label: 'Payé Intégral', bg: 'bg-emerald-50', text: 'text-emerald-700' };
  }
  return { label: 'Trop-Perçu', bg: 'bg-blue-50', text: 'text-blue-700' };
}
