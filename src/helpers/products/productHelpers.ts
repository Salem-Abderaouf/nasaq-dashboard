import { DoorProduct, StockLogEntry } from '../../types/database';

export type StockFilterType = 'All' | 'in_stock' | 'low_stock' | 'out_of_stock';

export interface ProductFilterOptions {
  search: string;
  category: string;
  stockFilter: StockFilterType;
}

export interface InventoryStats {
  totalModels: number;
  totalStockUnits: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

const META_TAG_REGEX = /<!--\s*NASAQ_DATA:([\s\S]*?)\s*-->/;

/**
 * Parses color options and stock logs from native columns or description metadata
 */
export function parseProductMetadata(prod: Partial<DoorProduct>): {
  cleanDescription: string;
  colorOptions: string[];
  stockLogs: StockLogEntry[];
} {
  let cleanDescription = prod.description || '';
  let colorOptions: string[] = Array.isArray(prod.color_options) ? prod.color_options : [];
  let stockLogs: StockLogEntry[] = Array.isArray(prod.stock_logs) ? prod.stock_logs : [];

  if (cleanDescription) {
    const match = cleanDescription.match(META_TAG_REGEX);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.colors && Array.isArray(parsed.colors) && colorOptions.length === 0) {
          colorOptions = parsed.colors;
        }
        if (parsed.logs && Array.isArray(parsed.logs) && stockLogs.length === 0) {
          stockLogs = parsed.logs;
        }
      } catch (e) {
        console.warn('Could not parse NASAQ metadata from product description:', e);
      }
      cleanDescription = cleanDescription.replace(META_TAG_REGEX, '').trim();
    }
  }

  return {
    cleanDescription,
    colorOptions,
    stockLogs
  };
}

/**
 * Serializes clean description, color options, and stock logs for database storage
 */
export function serializeProductDescription(
  cleanDescription: string,
  colorOptions: string[],
  stockLogs: StockLogEntry[]
): string {
  const base = (cleanDescription || '').trim();
  const metaObj = {
    colors: colorOptions || [],
    logs: stockLogs || []
  };
  return `${base}\n\n<!-- NASAQ_DATA:${JSON.stringify(metaObj)} -->`.trim();
}

/**
 * Normalize and enrich product data with parsed color options and stock logs
 */
export function enrichProductWithMetadata(prod: DoorProduct): DoorProduct {
  const { cleanDescription, colorOptions, stockLogs } = parseProductMetadata(prod);
  return {
    ...prod,
    description: cleanDescription,
    color_options: colorOptions,
    stock_logs: stockLogs
  };
}

/**
 * Pure calculation of overall inventory statistics for WPC doors catalog.
 */
export function calculateInventoryStats(products: DoorProduct[]): InventoryStats {
  const totalModels = products.length;
  let totalStockUnits = 0;
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const prod of products) {
    const stock = prod.stock_quantity ?? 0;
    totalStockUnits += stock;
    if (stock > 5) {
      inStockCount++;
    } else if (stock > 0) {
      inStockCount++;
      lowStockCount++;
    } else {
      outOfStockCount++;
    }
  }

  return {
    totalModels,
    totalStockUnits,
    inStockCount,
    lowStockCount,
    outOfStockCount,
  };
}

/**
 * Pure filtering of products by search term, category and stock level.
 */
export function filterProducts(
  products: DoorProduct[],
  options: ProductFilterOptions
): DoorProduct[] {
  const { search, category, stockFilter } = options;
  const q = search.trim().toLowerCase();

  return products.filter((prod) => {
    // 1. Text search matching reference, name, description, or colors
    if (q) {
      const matchRef = prod.reference.toLowerCase().includes(q);
      const matchName = prod.name.toLowerCase().includes(q);
      const matchDesc = prod.description?.toLowerCase().includes(q);
      const matchColor = prod.color_options?.some(c => c.toLowerCase().includes(q));
      if (!matchRef && !matchName && !matchDesc && !matchColor) return false;
    }

    // 2. Category match
    if (category !== 'All' && prod.category !== category) {
      return false;
    }

    // 3. Stock filter match
    const stock = prod.stock_quantity ?? 0;
    if (stockFilter === 'in_stock' && stock <= 0) return false;
    if (stockFilter === 'low_stock' && (stock <= 0 || stock > 5)) return false;
    if (stockFilter === 'out_of_stock' && stock > 0) return false;

    return true;
  });
}
