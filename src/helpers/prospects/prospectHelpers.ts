import { Prospect, ProspectStatus } from '../../types/database';

export interface ProspectStageConfig {
  id: ProspectStatus;
  defaultLabel: string;
  color: string;
  badgeColor: string;
}

export const PROSPECT_STAGES: ProspectStageConfig[] = [
  { id: 'new', defaultLabel: '1. Nouveau', color: 'border-blue-300 bg-blue-50/40', badgeColor: 'bg-blue-100 text-blue-800' },
  { id: 'contacted', defaultLabel: '2. Contacté', color: 'border-purple-300 bg-purple-50/40', badgeColor: 'bg-purple-100 text-purple-800' },
  { id: 'interested', defaultLabel: '3. Intéressé', color: 'border-amber-300 bg-amber-50/40', badgeColor: 'bg-amber-100 text-amber-800' },
  { id: 'negotiation', defaultLabel: '4. Négociation', color: 'border-indigo-300 bg-indigo-50/40', badgeColor: 'bg-indigo-100 text-indigo-800' },
  { id: 'converted', defaultLabel: '5. Converti Client', color: 'border-emerald-300 bg-emerald-50/40', badgeColor: 'bg-emerald-100 text-emerald-800' },
  { id: 'lost', defaultLabel: '6. Perdu', color: 'border-rose-300 bg-rose-50/40', badgeColor: 'bg-rose-100 text-rose-800' }
];

/**
 * Filter prospects by search query (name, phone, address, notes)
 */
export function filterProspects(prospects: Prospect[], query: string): Prospect[] {
  if (!query.trim()) return prospects;
  const s = query.toLowerCase().trim();
  return prospects.filter(p => (
    p.name.toLowerCase().includes(s) ||
    p.phone.includes(s) ||
    (p.address && p.address.toLowerCase().includes(s)) ||
    (p.notes && p.notes.toLowerCase().includes(s))
  ));
}

/**
 * Group prospects by pipeline stage
 */
export function groupProspectsByStage(prospects: Prospect[]): Record<ProspectStatus, Prospect[]> {
  const groups: Record<ProspectStatus, Prospect[]> = {
    new: [],
    contacted: [],
    interested: [],
    negotiation: [],
    converted: [],
    lost: []
  };

  prospects.forEach(p => {
    if (groups[p.status]) {
      groups[p.status].push(p);
    }
  });

  return groups;
}

/**
 * Calculate pipeline metrics (total, converted, conversion rate)
 */
export function calculateProspectsMetrics(prospects: Prospect[]) {
  const total = prospects.length;
  const converted = prospects.filter(p => p.status === 'converted').length;
  const lost = prospects.filter(p => p.status === 'lost').length;
  const active = total - converted - lost;
  const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0';

  return {
    total,
    converted,
    lost,
    active,
    conversionRate
  };
}
