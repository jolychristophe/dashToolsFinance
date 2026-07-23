import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PriceService {
  // Ici tu branchera tes vraies API REST
  async fetchPrice(symbol: string, type: AssetType): Promise<number> {
    // MOCK - remplace par tes webservices
    const mocks: Record<string, number> = {
      'AIR.PA': 182.5, 'BTC': 61200, 'ETH': 3200, 'EUR/USD': 1.08
    };
    return mocks[symbol]?? Math.random() * 100;
  }

  async aggregatePrices(assets: {symbol: string, type: AssetType}[]) {
    const results = await Promise.all(
      assets.map(a => this.fetchPrice(a.symbol, a.type).then(price => ({...a, price })))
    );
    return results; // normalisation + fiabilisation ici
  }
}