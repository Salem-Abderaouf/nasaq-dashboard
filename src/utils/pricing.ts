import { DoorConfigItem } from '../types/configurator';

/**
 * Calculates standard unit price according to NASAQ WPC specifications:
 * P_door = P_structure + S_pattern + S_glass + S_cladding
 */
export function calculateDoorUnitPrice(door: Partial<DoorConfigItem>): number {
  const isDouble = door.doorStructure === 'double';
  const baseStructure = isDouble ? 59800 : 39800;

  // Pattern surcharge
  const patternId = door.patternId || 'none';
  const patternSurcharge = (patternId && patternId !== 'none') ? 4000 : 0;

  // Glass panes surcharge
  const glassCount = door.glassPanes?.length || 0;
  let glassSurcharge = 0;
  if (glassCount === 1) {
    glassSurcharge = 4000;
  } else if (glassCount > 1) {
    glassSurcharge = 4000 + (glassCount - 1) * 2000;
  }

  // Cladding / Transom (Imposte) surcharge
  const claddingSurcharge = door.hasRevetment ? 13000 : 0;

  return baseStructure + patternSurcharge + glassSurcharge + claddingSurcharge;
}

/**
 * Suggests default promotional price with commercial discount
 */
export function calculateDefaultPromoPrice(door: Partial<DoorConfigItem>): number {
  const normalPrice = calculateDoorUnitPrice(door);
  const isDouble = door.doorStructure === 'double';
  const defaultDiscount = isDouble ? 5800 : 2800;
  return Math.max(0, normalPrice - defaultDiscount);
}

/**
 * Calculates complete order totals including optional services
 */
export interface OrderCalculationSummary {
  singleCount: number;
  doubleCount: number;
  totalDoorsCount: number;
  subtotalDoorsNormal: number;
  subtotalDoorsPromo: number;
  totalDiscount: number;
  poseCost: number;
  transportCost: number;
  grandTotalNormal: number;
  grandTotalPromo: number;
  remainingBalanceNormal: number;
  remainingBalancePromo: number;
}

export function calculateOrderSummary(
  doors: DoorConfigItem[],
  isPromoEnabled: boolean,
  isPoseEnabled: boolean,
  isTransportEnabled: boolean,
  paidAmount: number = 0
): OrderCalculationSummary {
  let singleCount = 0;
  let doubleCount = 0;
  let subtotalDoorsNormal = 0;
  let subtotalDoorsPromo = 0;

  doors.forEach(d => {
    if (d.doorStructure === 'double') {
      doubleCount++;
    } else {
      singleCount++;
    }
    const norm = d.priceNormal || 0;
    const prom = d.pricePromo || 0;
    subtotalDoorsNormal += norm;
    subtotalDoorsPromo += prom;
  });

  const totalDoorsCount = doors.length;

  const poseCost = isPoseEnabled
    ? (singleCount * 5000 + doubleCount * 6000)
    : 0;

  const transportCost = (isTransportEnabled && totalDoorsCount > 0)
    ? 3000
    : 0;

  const grandTotalNormal = subtotalDoorsNormal + poseCost + transportCost;
  const grandTotalPromo = subtotalDoorsPromo + poseCost + transportCost;
  const totalDiscount = Math.max(0, subtotalDoorsNormal - subtotalDoorsPromo);

  const remainingBalanceNormal = Math.max(0, grandTotalNormal - paidAmount);
  const remainingBalancePromo = Math.max(0, grandTotalPromo - paidAmount);

  return {
    singleCount,
    doubleCount,
    totalDoorsCount,
    subtotalDoorsNormal,
    subtotalDoorsPromo,
    totalDiscount,
    poseCost,
    transportCost,
    grandTotalNormal,
    grandTotalPromo,
    remainingBalanceNormal,
    remainingBalancePromo
  };
}
