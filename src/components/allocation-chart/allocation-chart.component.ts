import { Component, Input, ElementRef, ViewChild, OnChanges, AfterViewInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import * as d3 from 'd3';

interface AllocationDatum { label: string; value: number; }

@Component({
    selector: 'app-allocation-chart',
    standalone: true,
    imports: [DecimalPipe],
    template: `
        <div #chart class="w-full h-[260px]"></div>
        <div class="mt-5 border-t border-[#F1F5F9] pt-4 grid grid-cols-1 gap-2">
            @for (item of data; track item.label; let i = $index) {
            <div class="flex items-center justify-between text-[13px]">
                <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-[3px] inline-block" [style.background]="color(i)"></span>
                <span class="text-[#334155] capitalize">{{ item.label }}</span>
                </div>
                <span class="font-mono text-[#64748B]">
                {{ item.value | number:'1.0-0' }} € ({{ (total ? item.value/total*100 : 0) | number:'1.0-0' }}%)
                </span>
            </div>
            }
        </div>
    `
})
export class AllocationChartComponent implements OnChanges, AfterViewInit {
  @Input() data: AllocationDatum[] = [];
  @Input() total: number = 0;
  @ViewChild('chart', {static: true}) chartEl!: ElementRef;

  private colors = d3.scaleOrdinal(d3.schemeCategory10);
  color = (i: number) => this.colors(i.toString());

  ngAfterViewInit(){ this.draw(); }
  ngOnChanges(){ this.draw(); }

  private draw(){
    if(!this.data?.length ||!this.chartEl) return;
    const element = this.chartEl.nativeElement;
    d3.select(element).selectAll('*').remove();

    const width = element.clientWidth;
    const height = 260;
    const radius = Math.min(width, height) / 2 - 10;

    const svg = d3.select(element).append('svg')
    .attr('width', width).attr('height', height)
    .append('g').attr('transform', `translate(${width/2},${height/2})`);

    const pie = d3.pie<AllocationDatum>().value((d: AllocationDatum) => d.value).sort(null);
    const arc = d3.arc<d3.PieArcDatum<AllocationDatum>>().innerRadius(radius*0.55).outerRadius(radius);

    svg.selectAll('path')
    .data(pie(this.data))
    .enter().append('path')
    .attr('d', arc as any)
    .attr('fill', (d, i) => this.color(i))
    .attr('stroke', 'white')
    .attr('stroke-width', 2);
  }
}