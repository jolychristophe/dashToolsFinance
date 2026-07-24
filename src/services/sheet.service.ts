import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, switchMap } from 'rxjs';

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
  reward: number;
  annualGain: number;
}

@Injectable({providedIn: 'root'})
export class SheetService {
  private DEFAULT_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTNvoWTZT_I0qmx8VXtB9jzjvhXAfcjXUCuh03uxiPLwZ_7jYv1BAJR7k0j8HFWYhDutLyH2MYxKqXB/pub?output=csv'; // google sheet de demo

  private sheetUrl$ = new BehaviorSubject<string>(this.getInitialUrl());

  constructor(private http: HttpClient){
    // écoute?sheet= dans l'url
    if(typeof window!== 'undefined'){
      const p = new URLSearchParams(window.location.search).get('sheet');
      if(p) this.setUrl(p);
    }
  }

  private getInitialUrl(){
    if(typeof window === 'undefined') return this.DEFAULT_URL;
    const param = new URLSearchParams(window.location.search).get('sheet');
    if(param) return decodeURIComponent(param);
    return localStorage.getItem('dash_sheet_url') || this.DEFAULT_URL;
  }

  get currentUrl(){ return this.sheetUrl$.value; }
  get url$(){ return this.sheetUrl$.asObservable(); }

  setUrl(url: string){
    let clean = url.trim();
    // si l'utilisateur colle un lien /edit, on le convertit en pub csv
    // https://docs.google.com/spreadsheets/d/1AbC.../edit ->.../export?format=csv
    if(clean.includes('/spreadsheets/d/') &&!clean.includes('/d/e/') &&!clean.includes('output=csv')){
      const m = clean.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if(m) clean = `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv`;
    }
    // si c'est un /pub sans output=csv, on l'ajoute
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
  // parser CSV qui gère guillemets + retours ligne dans cellule
  const rows: string[][] = []; let row: string[]=[]; let f=''; let q=false;
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
  const iSym=I('symbol'), iName=I('name'), iType=I('type'), iQ=I('quantity'), iBuy=I('buypriceunit'), iCur=I('currency'), iAcc=I('account'), iBrok=I('broker'), iCurP=I('currentprice'), iTot=I('total'), iRew=I('reward');

  const toNum = (v:string) => {
    if(!v) return 0;
    if(v.includes('#N/A')||v.includes('#ERROR')) return 0;
    return parseFloat(v.replace(/\s/g,'').replace(',', '.').replace(/[^0-9.\-]/g,''))||0;
  };

  const toReward = (v:string) => {
    if(!v) return 0;
    return toNum(v); // directement le % 
  };

 return rows.slice(1).map(p=>{
    const toNum = (v:string)=> parseFloat(v.replace(/\s/g,'').replace(',', '.').replace(/[^0-9.\-]/g,''))||0;
    const toReward = (v:string)=> toNum(v);

    const name = (p[iName]||'').replace(/\n/g,' ').trim();
    if(!name) return null;

    const qty = toNum(p[iQ]||'');
    const buyU = toNum(p[iBuy]||'');
    const curU = toNum(p[iCurP]||'') || buyU || 1;
    const reward = toReward(p[iRew]||'');

    const totalEur = qty * curU; // <--- FORMULE UNIQUE POUR TOUT
    const buyTotalEur = qty * buyU;

    return {
      symbol: (p[iSym]||name).trim(),
      name,
      type: (p[iType]||'cash').toLowerCase(),
      quantity: qty,
      buyPrice: buyU,
      currentPrice: curU,
      currency: (p[iCur]||'EUR').trim()||'EUR',
      account: (p[iAcc]||'').trim(),
      broker: (p[iBrok]||'').trim(),
      total: totalEur,
      reward,
      annualGain: totalEur * reward / 100,
      buyTotalEur
    };
  }).filter(Boolean) as Asset[];
}
}