import { dollarsToCents, formatMoney } from './finance.js';
export function today(){const d=new Date();const offset=d.getTimezoneOffset();return new Date(d.getTime()-offset*60000).toISOString().slice(0,10);}
export function createId(){return crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;}
export function createRow(values){const now=new Date().toISOString();return{id:createId(),createdAt:now,updatedAt:now,...values};}
export function moneyToCents(value){try{return dollarsToCents(value||'0');}catch{return 0;}}
export function dollars(value,currency='USD'){return formatMoney(moneyToCents(value),currency);}
export function numberValue(value){const n=Number(value||0);return Number.isFinite(n)?n:0;}
export function formatDate(value){if(!value)return'—';const date=new Date(`${String(value).slice(0,10)}T12:00:00`);return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(date);}
export function percent(value){return`${Number(value||0).toFixed(1)}%`;}
export function downloadFile(filename,content,type='text/plain;charset=utf-8'){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);}
