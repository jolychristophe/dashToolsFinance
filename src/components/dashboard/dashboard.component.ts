import { Component, computed, inject, signal } from '@angular/core';
import { PortfolioService } from '../../services/portfolio.service';
import { DecimalPipe } from '@angular/common';
import { AllocationChartComponent } from '../allocation-chart/allocation-chart.component';
import { Router } from '@angular/router';
import { SheetService } from '../../services/sheet.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [AllocationChartComponent, DecimalPipe],
    template: `
    <div class="p-6 max-w-6xl mx-auto">

        <div class="border bg-[#FAFAF8] p-3 mb-6 flex gap-2 items-center text-xs">
            <span class="text-[#94A3B8] uppercase">Google Sheet:</span>
            <input [value]="sheetUrl()" (input)="sheetUrl.set($any($event.target).value)" class="flex-1 bg-white border px-2 py-1 font-mono text-[11px]"/>
            <button (click)="loadNewSheet()" class="bg-black text-white px-3 py-1">Charger</button>
        </div>


        <div class="gap-4 mt-6">
            <div class="border p-5 bg-white grid md:grid-cols-2">
                <div>
                    <div class="text-xs uppercase text-[#94A3B8]">Valeur totale</div>
                    <div class="text-2xl font-['Instrument_Serif'] mt-1">{{ kpis().totalValue | number:'1.0-0' }} €</div>
                    <div class="text-sm mt-1" [class.text-green-600]="kpis().perfValue>=0" [class.text-red-600]="kpis().perfValue<0">
                        {{ kpis().perfValue | number:'1.0-0' }} € ({{ kpis().perfPercent | number:'1.0-0' }}%)
                    </div>
                </div>
                <div class="border p-5 bg-[#FAFAF8]">
                    <div class="text-xs uppercase text-[#94A3B8]">Rendement passif</div>
                    <div class="text-2xl font-['Instrument_Serif'] mt-1">{{ kpis().totalAnnualReward | number:'1.0-0' }} € / an</div>
                    <div class="text-2xl font-['Instrument_Serif'] mt-1">{{ kpis().totalMensualReward | number:'1.0-0' }} € / mois</div>
                    <div class="text-sm mt-1 text-[#334155]">{{ kpis().passiveYield | number:'1.1-1' }}% de la valeur</div>
                </div>
        </div>


    <div class="grid md:grid-cols-[1.1fr_0.9fr] gap-6 mt-6">
        <div class="border bg-white p-6">
            <div class="text-xs uppercase text-[#94A3B8] mb-4">Allocation</div>
            <app-allocation-chart [data]="allocationData()" [total]="kpis().totalValue" />
        </div>
        <div class="border bg-white p-6">
            <div class="text-xs uppercase text-[#94A3B8] mb-4">Actifs</div>
                @for (a of kpis().assets; track $index) {
                <div class="flex justify-between py-3 border-b border-[#F1F5F9] last:border-0">
                    <!-- GAUCHE : nom + reward -->
                    <div class="pr-4">
                    <div class="capitalize leading-tight text-sm">{{ a.name }}</div>
                    @if(a.reward>0){
                        <div class="text-[11px] text-green-600 mt-0.5">+{{ a.annualGain | number:'1.0-0' }} € / an ({{ a.reward | number:'1.1-1' }}%)</div>
                    }
                    </div>

                    <!-- DROITE : valeur + gain/perte -->
                    <div class="text-right">
                    <div class="font-mono text-[13px] leading-tight">{{ a.total | number:'1.0-0' }} {{ a.currency }}</div>
                    <div class="text-[11px] mt-0.5" [class.text-green-600]="a.perfValue>=0" [class.text-red-600]="a.perfValue<0">
                        {{ a.perfValue>=0?'+':'' }}{{ a.perfValue | number:'1.0-0' }} € ({{ a.perfPercent | number:'1.0-0' }}%)
                    </div>
                    </div>
                </div>
                }
        </div>
    </div>
    </div>
    `
})
export class DashboardComponent {
  private sheet = inject(SheetService);
  private router = inject(Router);

    portfolio = inject(PortfolioService);
    kpis = this.portfolio.kpis;
    allocationData = computed(() =>
        this.kpis().exposureByType.map(e => ({ label: e.type, value: e.value }))
    );

  sheetUrl = signal(this.sheet.currentUrl);
  shareLink = signal('');

  constructor(){
    this.updateShareLink();
    this.sheet.url$.subscribe(url=>{
      this.sheetUrl.set(url);
      this.updateShareLink();
    });
  }

  updateShareLink(){
    if(typeof window!== 'undefined'){
      this.shareLink.set(`${window.location.origin}${window.location.pathname}?sheet=${encodeURIComponent(this.sheet.currentUrl)}`);
    }
  }

  loadNewSheet(){
    this.sheet.setUrl(this.sheetUrl());
    // met à jour l'url du navigateur
    this.router.navigate([], { queryParams: { sheet: this.sheetUrl() } });
  }
}