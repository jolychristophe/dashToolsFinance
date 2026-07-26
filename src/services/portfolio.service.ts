import { Injectable, computed, inject, signal } from '@angular/core';
import { SheetService, Asset } from './sheet.service';

@Injectable({providedIn: 'root'})
export class PortfolioService {
  private sheet = inject(SheetService);
  
  holdings = signal<Asset[]>([]);

  constructor(){
    // se recharge auto quand tu changes de ?sheet=
    this.sheet.loadAssets().subscribe((data: Asset[]) => {
      this.holdings.set(data);
    });
  }

kpis = computed(()=>{
  const assets = this.holdings();
  const totalValue = assets.reduce((s,a)=> s + a.total, 0);
  const totalBuy = assets.reduce((s,a)=> s + a.buyTotalEur, 0);
  const totalAnnualReward = assets.reduce((s,a)=> s + a.annualGain, 0);

  const map = new Map<string, any>();
  for(const a of assets){
    if(!map.has(a.type)) map.set(a.type, { type: a.type, assets: [], totalValue:0, buyTotal:0, annualReward:0 });
    const g = map.get(a.type);
    g.assets.push(a);
    g.totalValue += a.total;
    g.buyTotal += a.buyTotalEur;
    g.annualReward += a.annualGain;
  }

  const groups = Array.from(map.values()).map(g=>{
    const perfValue = g.totalValue - g.buyTotal;
    return {
     ...g,
      assets: g.assets.sort((a:any,b:any)=> b.total - a.total),
      perfValue,
      perfPercent: g.buyTotal? perfValue/g.buyTotal*100 : 0,
      yield: g.totalValue? g.annualReward/g.totalValue*100 : 0
    };
  }).sort((a,b)=> b.totalValue - a.totalValue);

  return {
    totalValue,
    perfValue: totalValue - totalBuy,
    perfPercent: totalBuy? (totalValue-totalBuy)/totalBuy*100 : 0,
    totalAnnualReward,
    totalMensualReward: totalAnnualReward / 12,
    passiveYield: totalValue? totalAnnualReward/totalValue*100 : 0,
    groups,
    exposureByType: groups.map(g=>({label:g.type, value:g.totalValue})),
    assets: [...assets].sort((a,b)=> b.total - a.total)
  };
});
}