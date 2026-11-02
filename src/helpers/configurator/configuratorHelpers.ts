import { DoorConfigItem, StudioGeneralInfo } from '../../types/configurator';
import { DoorProduct } from '../../types/database';
import { formatDoorId } from '../../utils/formatters';

export const STORAGE_KEY_DOORS = 'nasaq_dashboard_doors_state';
export const STORAGE_KEY_INFO = 'nasaq_dashboard_info_state';

export const DEFAULT_STUDIO_INFO: StudioGeneralInfo = {
  clientName: '',
  docRef: '',
  docDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
  paidAmount: 0,
  isPromoEnabled: false,
  isPoseEnabled: true,
  isTransportEnabled: true,
  scale: 0.60,
  gridGap: 20
};

export interface StudioFinancialTotals {
  subtotal: number;
  poseCost: number;
  transportCost: number;
  grandTotal: number;
}

/**
 * Calculates subtotal, installation, transport and grand total for the current studio configuration
 */
export function calculateStudioTotals(
  doors: DoorConfigItem[],
  isPromoEnabled: boolean,
  isPoseEnabled: boolean,
  isTransportEnabled: boolean
): StudioFinancialTotals {
  let subtotal = 0;
  doors.forEach(d => {
    subtotal += (isPromoEnabled ? d.pricePromo : d.priceNormal);
  });

  const poseCost = isPoseEnabled 
    ? doors.reduce((acc, d) => acc + (d.doorStructure === 'double' ? 6000 : 5000), 0) 
    : 0;

  const transportCost = isTransportEnabled && doors.length > 0 ? 3000 : 0;
  const grandTotal = subtotal + poseCost + transportCost;

  return {
    subtotal,
    poseCost,
    transportCost,
    grandTotal
  };
}

/**
 * Builds a fresh default door config item
 */
export function buildDefaultDoor(
  index: number,
  orderCode: string,
  defaultProd?: DoorProduct | null
): DoorConfigItem {
  return {
    id: formatDoorId(index, orderCode),
    productId: defaultProd?.id,
    productReference: defaultProd?.reference,
    heightCm: Number(defaultProd?.height) || 210,
    widthCm: Number(defaultProd?.width) || 85,
    designation: defaultProd?.name || "Porte d'intérieur WPC",
    priceNormal: 39800,
    pricePromo: 37000,
    colorId: "chene_bois",
    patternId: "none",
    doorStructure: "single",
    leftLeafPercent: 28,
    hardwareColor: "black",
    glassPanes: [],
    hasRevetment: false,
    revetmentHeightCm: 110
  };
}

/**
 * Reconstructs studio door items from Supabase database order_items records
 */
export function reconstructDoorsFromDbItems(
  dbItems: any[],
  orderCode: string
): DoorConfigItem[] {
  return (dbItems || []).map((item: any, idx: number) => {
    const cfg = item.configuration || {};
    const doorId = cfg.id ? formatDoorId(cfg.id, orderCode) : formatDoorId(idx + 1, orderCode);
    return {
      id: doorId,
      productId: item.product_id || cfg.productId || item.door_products?.id,
      productReference: item.door_products?.reference || cfg.productReference,
      heightCm: Number(item.height) || Number(cfg.heightCm) || 210,
      widthCm: Number(item.width) || Number(cfg.widthCm) || 85,
      designation: cfg.designation || item.door_products?.name || "Porte d'intérieur WPC",
      priceNormal: Number(cfg.priceNormal) || Number(item.unit_price) || 39800,
      pricePromo: Number(cfg.pricePromo) || (cfg.priceNormal ? Number(cfg.priceNormal) - 2800 : Number(item.unit_price)) || 37000,
      colorId: item.color || cfg.colorId || "chene_bois",
      patternId: cfg.patternId || "none",
      doorStructure: (cfg.doorStructure === 'double' ? 'double' : 'single'),
      leftLeafPercent: cfg.leftLeafPercent ?? 28,
      hardwareColor: (cfg.hardwareColor === 'chrome' ? 'chrome' : 'black'),
      glassPanes: Array.isArray(cfg.glassPanes) ? cfg.glassPanes : [],
      hasRevetment: Boolean(cfg.hasRevetment),
      revetmentHeightCm: Number(cfg.revetmentHeightCm) || 110,
    };
  });
}

/**
 * Calculates next order sequence number e.g. ORD-2026-0105
 */
export function calculateNextOrderSequence(
  existingOrders: { order_number?: string }[],
  currentYear: number
): string {
  let maxSeq = 100; // so next initial order is 0101

  if (existingOrders && existingOrders.length > 0) {
    for (const row of existingOrders) {
      if (!row.order_number) continue;
      const match = row.order_number.match(/(\d{4,5})$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  const nextVal = maxSeq + 1;
  return `ORD-${currentYear}-${String(nextVal).padStart(4, '0')}`;
}
