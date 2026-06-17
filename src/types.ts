export interface Customer {
  id: string;
  name: string;
  region: string;
  category: string;
  revenue: string;
  period: number; // in days
  lastVisit: string;
  notes: string;
}

export interface Product {
  name: string;
  category: '프리미엄' | '데일리';
  cost: number;
  recommendedPrice: number;
  minMargin: number; // represented as fractional value e.g. 0.60
  alternative: string;
}

export interface SimulationState {
  clientName: string;
  productName: string;
  discountRate: number; // represented as fractional value, e.g. 0.15 (15%)
  finalPrice: number;
  marginRate: number;
  status: '🟢 안정' | '⚠️ 위험(경고)';
  alternative: string;
  script?: string;
}

export interface SimulationResult {
  parsed: SimulationState;
  guiText: string;
}
