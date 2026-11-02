import { DoorProduct } from '../../types/database';

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
    // 1. Text search matching reference, name, or description
    if (q) {
      const matchRef = prod.reference.toLowerCase().includes(q);
      const matchName = prod.name.toLowerCase().includes(q);
      const matchDesc = prod.description?.toLowerCase().includes(q);
      if (!matchRef && !matchName && !matchDesc) return false;
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
