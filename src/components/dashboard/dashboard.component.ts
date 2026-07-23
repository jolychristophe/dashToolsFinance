import { Component, inject } from '@angular/core';
import { PortfolioService } from '../../services/portfolio.service';
import { AllocationChartComponent } from '../allocation-chart/allocation-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AllocationChartComponent],
  template: `
  <div class="p-6 max-w-6xl mx-auto">
    <p class="text- tracking-[0.18em] uppercase text-[#94A3B8]">Pilotage patrimonial temps réel</p>

    <div class="grid grid-cols-3 gap-4 mt-6">
      <div class="border border-[#E2E8F0] p-5 bg-white">
        <div class="text- uppercase text-[#94A3B8]">Valeur totale</div>
        <div class="text- font-['Instrument_Serif'] mt-1">{{ kpis().totalValue | number:'1.0-0' }} €</div>
        <div class="text- mt-1" [class.text-green-600]="kpis().perfValue>=0" [class.text-red-600]="kpis().perfValue<0">
          {{ kpis().perfValue | number:'1.0-0' }} € ({{ kpis().perfPercent | number:'1.1-1' }}%)
        </div>
      </div>
      <div class="border border-[#E2E8F0] p-5 bg-[#FAFAF8]">
        <div class="text- uppercase text-[#94A3B8]">Exposition par classe</div>
        <div class="mt-2 space-y-1 text- font-['Inter']">
          @for (exp of kpis().exposureByType; track exp.type) {
            <div class="flex justify-between"><span>{{ exp.type }}</span><span>{{ exp.value | number:'1.0-0' }} €</span></div>
          }
        </div>
      </div>
      <div class="border border-[#E2E8F0] p-5 bg-white">
        <div class="text- uppercase text-[#94A3B8]">Qualité données</div>
        <div class="text- mt-2 leading-[1.6] text-[#334155]">Contrôles cohérence PRU, détection cas limites, fiabilité couverture. Dernier refresh : temps réel.</div>
      </div>
    </div>

    <div class="grid md:grid-cols-[1.1fr_0.9fr] gap-6 mt-6">
      <div class="border border-[#E2E8F0] bg-white p-6">
        <div class="text- uppercase text-[#94A3B8] mb-4">Allocation</div>
        <app-allocation-chart [data]="kpis().exposureByType" />
      </div>
      <div class="border border-[#E2E8F0] bg-white p-6">
        <div class="text- uppercase text-[#94A3B8] mb-4">Actifs</div>
        <div class="space-y-2">
          @for (a of portfolio.assets(); track a.id) {
            <div class="flex justify-between text- py-2 border-b border-[#F1F5F9]">
              <span>{{ a.name }} ({{ a.type }})</span>
              <span class="font-mono">{{ a.quantity * a.currentPrice | number:'1.0-0' }} {{ a.currency }}</span>
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
}