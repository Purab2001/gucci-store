export type StockStatus = "in" | "low" | "out";

export interface StockState {
  status: StockStatus;
  label: string;
  note: string;
  dotClass: string;
}

const LOW_STOCK_THRESHOLD = 3;

/**
 * Derive the UI stock state from a quantity.
 * Stock is stored as products.stock_quantity — never as a status string.
 */
export function stockState(stockQuantity: number): StockState {
  if (stockQuantity <= 0) {
    return {
      status: "out",
      label: "Out of stock",
      note: "Currently unavailable — please check back",
      dotClass: "bg-stone",
    };
  }
  if (stockQuantity <= LOW_STOCK_THRESHOLD) {
    return {
      status: "low",
      label: "Low stock",
      note: "Only a few pieces left in the atelier",
      dotClass: "bg-heritage",
    };
  }
  return {
    status: "in",
    label: "In stock",
    note: "Ships within 48 hours",
    dotClass: "bg-forest",
  };
}
