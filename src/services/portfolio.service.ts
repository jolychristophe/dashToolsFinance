import { Injectable, signal, computed } from '@angular/core';
import { Asset, PortfolioKPI } from '../models/asset.model';
import { PriceService } from './price.service';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private _assets = signal<Asset[]>(this.load());
  assets = this._assets.asReadonly();

  kpis = computed<PortfolioKPI>(() => {
    const assets = this._assets();
    const totalValue = assets.reduce((s, a) => s + a.quantity * a.currentPrice, 0);
    const totalInvested = assets.reduce((s, a) => s + a.quantity * a.buyPrice, 0);
    const perfValue = totalValue - totalInvested;
    const perfPercent = totalInvested? (perfValue / totalInvested) * 100 : 0;

    const byType = Object.groupBy(assets, a => a.type) as Record<string, Asset[]>;
    const exposureByType = Object.entries(byType).map(([type, list]) => ({
      type: type as any,
      value: list.reduce((s, a) => s + a.quantity * a.currentPrice, 0)
    }));

    return { totalValue, totalInvested, perfValue, perfPercent, exposureByType };
  });

  constructor(private priceService: PriceService) {
    // refresh prix toutes les 60s
    setInterval(() => this.refreshPrices(), 60000);
  }

  addAsset(a: Asset) {
    this._assets.update(list => [...list, a]);
    this.save();
  }

  async refreshPrices() {
    const toFetch = this._assets().filter(a => a.symbol).map(a => ({ symbol: a.symbol!, type: a.type }));
    const prices = await this.priceService.aggregatePrices(toFetch);
    this._assets.update(list => list.map(asset => {
      const found = prices.find(p => p.symbol === asset.symbol);
      return found? {...asset, currentPrice: found.price, updatedAt: new Date() } : asset;
    }));
    this.save();
  }

  private save() { localStorage.setItem('portfolio', JSON.stringify(this._assets())); }
  private load(): Asset[] {
    const raw = localStorage.getItem('portfolio');
    return raw? JSON.parse(raw) : [
      { id: '1', type: 'ACTION', name: 'Airbus', symbol: 'AIR.PA', quantity: 20, buyPrice: 140, currentPrice: 182.5, currency: 'EUR', updatedAt: new Date() },
      { id: '2', type: 'CRYPTO', name: 'Bitcoin', symbol: 'BTC', quantity: 0.5, buyPrice: 40000, currentPrice: 61200, currency: 'USD', updatedAt: new Date() },
      { id: '3', type: 'IMMOBILIER', name: 'Appart Lyon', quantity: 1, buyPrice: 250000, currentPrice: 285000, currency: 'EUR', updatedAt: new Date() },
      { id: '4', type: 'BANQUE', name: 'Livret A', quantity: 1, buyPrice: 22950, currentPrice: 22950, currency: 'EUR', updatedAt: new Date() },
    ];
  }
}