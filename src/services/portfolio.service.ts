import { Injectable, computed, inject, signal } from '@angular/core';
import { SheetService, Asset } from './sheet.service';

@Injectable({providedIn: 'root'})
export class PortfolioService {
  private sheet = inject(SheetService);
  holdings = signal<Asset[]>([]);

  constructor(){ this.load(); }

  load(){
    this.sheet.getHoldings().subscribe(data => this.holdings.set(data));
  }

kpis = computed(() => {
  const assets = this.holdings();
  const totalValue = assets.reduce((s,a)=> s + (a.total || a.quantity * a.currentPrice), 0);
  const totalBuy = assets.reduce((s,a)=> s + a.quantity * a.buyPrice, 0);
  const byTypeMap = assets.reduce((acc: Record<string, number>, a) => {
    acc[a.type] = (acc[a.type]??0) + (a.total || 0);
    return acc;
  }, {});
  return {
    totalValue,
    perfValue: totalValue - totalBuy,
    perfPercent: totalBuy? ((totalValue-totalBuy)/totalBuy)*100 : 0,
    exposureByType: Object.entries(byTypeMap).map(([type,value])=>({type,value})),
    assets
  };
});
}