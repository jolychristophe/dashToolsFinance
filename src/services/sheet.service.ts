import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface Asset {
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  currency: string;
  account: string;
  broker: string;
  total: number;
}

@Injectable({providedIn: 'root'})
export class SheetService {
  private http = inject(HttpClient);
  private CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDFy2-JJCsjgN6-akgR366zI9PmWafZzHIJaVuwum9VBbhGlhJ7SZX7FXeKgj8XcAU4DOuppaLe3sa/pub?output=csv';

  getHoldings(): Observable<Asset[]> {
    return this.http.get(this.CSV_URL, { responseType: 'text' }).pipe(
      map(csv => this.parse(csv))
    );
  }

  private toNumber(v: string): number {
    if (!v) return 0;
    if (v.includes('#N/A') || v.includes('#ERROR')) return NaN;
    // enlève espaces, remplace virgule FR par point
    const clean = v.replace(/\s/g,'').replace(',', '.').replace(/[^0-9.\-]/g,'');
    const n = parseFloat(clean);
    return isNaN(n)? 0 : n;
  }

  private splitLine(line: string): string[] {
    const res: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i=0; i<line.length; i++) {
      const c = line[i];
      if (c === '"') { inQuotes =!inQuotes; continue; }
      if (c === ',' &&!inQuotes) { res.push(cur); cur=''; continue; }
      cur+=c;
    }
    res.push(cur);
    return res.map(s=>s.trim());
  }

private parse(csv: string): Asset[] {
  // Parser CSV qui supporte guillemets + virgules FR + sauts de ligne dans cellules
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQ = false;

  for(let i=0;i<csv.length;i++){
    const c = csv[i];
    const n = csv[i+1];
    if(c === '"'){
      if(inQ && n === '"'){ field+='"'; i++; }
      else inQ=!inQ;
    } else if(c === ',' &&!inQ){ row.push(field); field=''; }
    else if((c === '\n' || c === '\r') &&!inQ){
      if(field || row.length){ row.push(field); rows.push(row); }
      row=[]; field='';
      if(c==='\r' && n==='\n') i++;
    } else { field+=c; }
  }
  if(field || row.length){ row.push(field); rows.push(row); }

  const header = rows[0].map(h=>h.trim().toLowerCase());
  const idx = (k:string) => header.indexOf(k);

  const iName = idx('name');
  const iType = idx('type');
  const iQ = idx('quantity');
  const iBuy = idx('buypriceunit');
  const iCur = idx('currency');
  const iAcc = idx('account');
  const iBrok = idx('broker');
  const iCurP = idx('currentprice');
  const iTot = idx('total');
  const iSym = idx('symbol');

  return rows.slice(1).map(p=>{
    if(!p.length || p.every(v=>!v.trim())) return null;
    const toNum = (v:string) => {
      if(!v) return 0;
      if(v.includes('#N/A') || v.includes('#ERROR')) return 0;
      return parseFloat(v.replace(/\s/g,'').replace(',', '.').replace(/[^0-9.\-]/g,'')) || 0;
    };

    const nameRaw = (p[iName] || '').replace(/\n/g,' ').trim();
    const type = (p[iType] || 'cash').toLowerCase();
    const quantity = toNum(p[iQ] || '');
    const buy = toNum(p[iBuy] || '');
    const currency = (p[iCur] || 'EUR').trim() || 'EUR';
    const account = (p[iAcc] || '').trim();
    const broker = (p[iBrok] || '').trim();
    const curPrice = toNum(p[iCurP] || '');
    const total = toNum(p[iTot] || '');
    const symbol = (p[iSym] || '').trim();

    if(type === 'bank'){
      const solde = total || curPrice || quantity;
      return {
        symbol: nameRaw || account || 'CASH',
        name: nameRaw || account, // <--- ON AFFICHE NAME
        type: 'cash',
        quantity: 1,
        buyPrice: solde,
        currentPrice: solde,
        currency, account, broker, total: solde
      };
    }

    if(type === 'immobilier'){
      return {
        symbol: nameRaw,
        name: nameRaw,
        type: 'immobilier',
        quantity: 1,
        buyPrice: buy || total || quantity,
        currentPrice: total || quantity,
        currency, account, broker, total: total || quantity
      };
    }

    return {
      symbol: symbol || nameRaw,
      name: nameRaw || symbol, // <--- NAME en priorité
      type,
      quantity,
      buyPrice: buy,
      currentPrice: curPrice || buy,
      currency, account, broker,
      total: total || quantity * (curPrice || buy)
    };
  }).filter(Boolean) as Asset[];
}
}