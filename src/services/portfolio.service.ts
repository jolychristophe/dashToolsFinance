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
    const totalBuy = assets.reduce((s,a)=> s + (a.quantity * a.buyPrice), 0);
    const totalAnnualReward = assets.reduce((s,a)=> s + a.annualGain, 0);

    const byType = assets.reduce((acc: Record<string,number>, a)=>{
      acc[a.type] = (acc[a.type]??0) + a.total;
      return acc;
    },{});

    return {
      totalValue,
      perfValue: totalValue - totalBuy,
      perfPercent: totalBuy ? (totalValue-totalBuy)/totalBuy*100 : 0,
      totalAnnualReward,
      totalMensualReward: totalAnnualReward / 12,
      passiveYield: totalValue ? totalAnnualReward/totalValue*100 : 0,
      exposureByType: Object.entries(byType)
        .map(([type,value])=>({type,value}))
        .sort((a,b)=> b.value - a.value),
      assets: [...assets].sort((a,b)=> b.total - a.total)
    };
  });
}