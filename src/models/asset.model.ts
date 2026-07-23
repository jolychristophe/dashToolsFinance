export type AssetType = 'ACTION' | 'CRYPTO' | 'BANQUE' | 'IMMOBILIER' | 'DEVISE' | 'AUTRE';

export interface Asset {
  id: string;
  type: AssetType;
  name: string; // ex: AIR.PA, BTC, Livret A, Appart Lyon
  symbol?: string; // ticker
  quantity: number;
  buyPrice: number; // PRU
  currentPrice: number; // valorisé via API
  currency: string; // EUR, USD
  category?: string;
  updatedAt: Date;
}

export interface PortfolioKPI {
  totalValue: number;
  totalInvested: number;
  perfValue: number;
  perfPercent: number;
  exposureByType: { type: AssetType, value: number }[];
}