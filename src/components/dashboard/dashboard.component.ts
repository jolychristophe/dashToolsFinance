import { Component, computed, inject } from '@angular/core';
import { PortfolioService } from '../../services/portfolio.service';
import { DecimalPipe } from '@angular/common';
import { AllocationChartComponent } from '../allocation-chart/allocation-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AllocationChartComponent, DecimalPipe],
template: `
<div class="p-6 max-w-6xl mx-auto">
  <p class="text-xs tracking-[0.18em] uppercase text-[#94A3B8]">Pilotage patrimonial temps réel</p>

    <div class="border border-[#E2E8F0] p-5 bg-white">
      <div class="text-xs uppercase text-[#94A3B8]">Valeur totale</div>
      <div class="text-2xl font-['Instrument_Serif'] mt-1">{{ kpis().totalValue | number:'1.0-0' }} €</div>
      <div class="text-sm mt-1" [class.text-green-600]="kpis().perfValue>=0" [class.text-red-600]="kpis().perfValue<0">
        {{ kpis().perfValue | number:'1.0-0' }} € ({{ kpis().perfPercent | number:'1.1-1' }}%)
      </div>
  </div>

 
<div class="grid md:grid-cols-[1.1fr_0.9fr] gap-6 mt-6">
    <div class="border border-[#E2E8F0] bg-white p-6">
        <div class="text-xs uppercase text-[#94A3B8] mb-4">Allocation</div>
        <app-allocation-chart [data]="allocationData()" [total]="kpis().totalValue" />
    </div>
    <div class="border border-[#E2E8F0] bg-white p-6">
        <div class="text-xs uppercase text-[#94A3B8] mb-4">Actifs</div>
        <div class="space-y-2">
            @for (a of portfolio.holdings(); track a.symbol) {
            <div class="flex justify-between text-sm py-2 border-b border-[#F1F5F9]">
                <span class="capitalize">{{ a.name }} <span class="text-[#94A3B8]">({{ a.type }})</span></span>
                <span class="font-mono">{{ a.total | number:'1.0-0' }} {{ a.currency }}</span>
            </div>
            }
        </div>
    </div>
</div>
`
})
export class DashboardComponent {
    portfolio = inject(PortfolioService);
    kpis = this.portfolio.kpis;
    allocationData = computed(() =>
        this.kpis().exposureByType.map(e => ({ label: e.type, value: e.value }))
    );
}