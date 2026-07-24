import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, switchMap } from 'rxjs';

export interface Asset {
  symbol: string;
  name: string;
  type: string; // bank, crypto, action, immobilier
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  currency: string;
  account: string;
  broker: string;
  total: number;
  buyTotalEur: number;
  perfValue: number;
  perfPercent: number;
  reward: number;
  annualGain: number;
}

@Injectable({ providedIn: 'root' })
export class SheetService {
  private DEFAULT_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDFy2-JJCsjgN6-akgR366zI9PmWafZzHIJaVuwum9VBbhGlhJ7SZX7FXeKgj8XcAU4DOuppaLe3sa/pub?output=csv';

  private sheetUrl$ = new BehaviorSubject<string>(this.getInitialUrl());
  url$ = this.sheetUrl$.asObservable();
  get currentUrl(){ return this.sheetUrl$.value; }

  constructor(private http: HttpClient){
    const p = new URLSearchParams(window.location.search).get('sheet');
    if(p) this.setUrl(p);
  }

  private getInitialUrl(){
    if(typeof window==='undefined') return this.DEFAULT_URL;
    const param = new URLSearchParams(window.location.search).get('sheet');
    if(param) return decodeURIComponent(param);
    return localStorage.getItem('dash_sheet_url') || this.DEFAULT_URL;
  }

  setUrl(url: string){
    let clean = url.trim();
    if(clean.includes('/spreadsheets/d/') &&!clean.includes('/d/e/') &&!clean.includes('output=csv')){
      const m = clean.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if(m) clean = `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv`;
    }
    if(clean.includes('/pub') &&!clean.includes('output=csv')){
      clean += (clean.includes('?')?'&':'?') + 'output=csv';
    }
    localStorage.setItem('dash_sheet_url', clean);
    this.sheetUrl$.next(clean);
  }

  loadAssets(): Observable<Asset[]>{
    return this.sheetUrl$.pipe(
      switchMap(url => this.http.get(url, {responseType: 'text'})),
      map(csv => this.parse(csv))
    );
  }

  private parse(csv: string): Asset[] {
    const rows: string[][] = []; let row:string[]=[]; let f=''; let q=false;
    for(let i=0;i<csv.length;i++){
      const c=csv[i], n=csv[i+1];
      if(c==='"'){ if(q && n==='"'){ f+='"'; i++; } else q=!q; }
      else if(c===',' &&!q){ row.push(f); f=''; }
      else if((c==='\n'||c==='\r') &&!q){
        if(f||row.length){ row.push(f); rows.push(row); }
        row=[]; f=''; if(c==='\r'&&n==='\n') i++;
      } else f+=c;
    }
    if(f||row.length){ row.push(f); rows.push(row); }

    const header = rows[0].map(h=>h.trim().toLowerCase());
    const I = (k:string) => header.indexOf(k);
    const iSym=I('symbol'), iName=I('name'), iType=I('type'), iQ=I('quantity'), iBuy=I('buypriceunit'), iCur=I('currency'), iRew=I('reward'), iAcc=I('account'), iBrok=I('broker'), iCurP=I('currentprice');

    const toNum = (v:string)=>{
      if(!v) return 0;
      if(v.includes('#N/A')) return 0;
      return parseFloat(v.replace(/\s/g,'').replace(',', '.').replace(/[^0-9.\-]/g,''))||0;
    };

    return rows.slice(1).map(p=>{
      if(!p || p.every(x=>!x.trim())) return null;
      const typeRaw = (p[iType]||'').toLowerCase().trim();
      const assetType = typeRaw.split(' ')[0] || 'bank';
      const finalType = assetType==='bank'?'cash':assetType;

      const name = (p[iName]||'').replace(/\n/g,' ').trim();
      if(!name) return null;

      const qty = toNum(p[iQ]||'');
      const buyU = toNum(p[iBuy]||'');
      const curU = toNum(p[iCurP]||'') || buyU || 1;
      const reward = toNum(p[iRew]||'');
      const curr = (p[iCur]||'EUR').trim().toUpperCase()||'EUR';

      const buyTotalEur = qty * buyU;
      const totalEur = qty * curU;
      const perfValue = totalEur - buyTotalEur;
      const perfPercent = buyTotalEur? perfValue/buyTotalEur*100 : 0;

      return {
        symbol: (p[iSym]||name).trim(),
        name,
        type: finalType,
        quantity: qty,
        buyPrice: buyU,
        currentPrice: curU,
        currency: curr,
        account: (p[iAcc]||'').trim(),
        broker: (p[iBrok]||'').trim(),
        total: totalEur,
        buyTotalEur,
        perfValue,
        perfPercent,
        reward,
        annualGain: totalEur * reward / 100
      } as Asset;
    }).filter(Boolean) as Asset[];
  }
}