import { Component, Input, ElementRef, effect } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-allocation-chart',
  standalone: true,
  template: `<div class="w-full h-"></div>`
})
export class AllocationChartComponent {
  @Input() data: { type: string, value: number }[] = [];
  constructor(private el: ElementRef) {
    effect(() => {
      if (this.data.length) this.draw();
    });
  }
  draw() {
    const container = this.el.nativeElement.firstChild;
    d3.select(container).selectAll('*').remove();
    const width = container.clientWidth, height = 260, radius = Math.min(width, height) / 2;
    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height).append('g').attr('transform', `translate(${width/2},${height/2})`);
    const pie = d3.pie<any>().value(d => d.value);
    const arc = d3.arc().innerRadius(60).outerRadius(radius - 10);
    const color = d3.scaleOrdinal(d3.schemeTableau10);
    svg.selectAll('path').data(pie(this.data)).enter().append('path').attr('d', arc as any).attr('fill', (d: any) => color(d.data.type)).attr('stroke', 'white');
  }
}