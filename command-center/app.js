import {
  SCHEMA_VERSION,
  UNIT_DEFS,
  dollarsToCents,
  formatMoney,
  buildUsageSnapshot,
  calculateDailyReport,
  activeCostForDate,
  costPerBaseUnitMicros,
} from './core.js';

const STORE_KEY = 'ftcc.live.v3';
const LEGACY_KEYS = ['ftcc.live.v2', 'ftcc.v1'];
const ACTIVE_KEY = 'ftcc.active.v3';
const CHANNEL = 'ftcc-live-v3';
const CLIENT_ID = crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const GENERIC_MODULES = {
  sales: { title:'Sales', subtitle:'Service revenue records.', action:'Add sale', cols:['date','type','location','gross','payment'], fields:[['date','Date','date',true],['type','Service type','select',true,['Lunch','Dinner','Festival','Private Event','Catering','Pop-up','Other']],['location','Location','text'],['gross','Gross sales','money',true],['tax','Sales tax collected','money'],['discounts','Discounts','money'],['refunds','Refunds','money'],['payment','Payment','select',false,['Card','Cash','Mixed','Online','Invoice','Other']],['notes','Notes','textarea']] },
  customers: { title:'CRM', subtitle:'Customers, leads and follow-up.', action:'Add contact', cols:['name','type','status','phone','email','followUp'], fields:[['name','Name / organization','text',true],['type','Type','select',true,['Walk-up','Catering Lead','Corporate','Event Organizer','Repeat Customer','Referral','Other']],['status','Status','select',true,['New Lead','Contacted','Quoted','Booked','Completed','Active','Lost']],['phone','Phone','tel'],['email','Email','email'],['followUp','Next follow-up','date'],['notes','Notes','textarea']] },
  events: { title:'Events', subtitle:'Bookings and catering pipeline.', action:'Add event', cols:['date','name','status','guests','location','quote'], fields:[['name','Event name','text',true],['date','Event date','datetime-local',true],['status','Status','select',true,['Inquiry','Quoted','Booked','Prep Needed','Completed','Cancelled','Lost']],['eventType','Type','select',false,['Catering','Festival','Corporate Lunch','Private Party','Market','Pop-up','Other']],['location','Location','text'],['contact','Contact','text'],['guests','Guests','number'],['quote','Quote','money'],['deposit','Deposit','money'],['notes','Notes','textarea']] },
  inventory: { title:'Inventory', subtitle:'On-hand quantities and reorder points.', action:'Add item', cols:['item','category','qty','unit','reorder','unitCost','vendor'], fields:[['item','Item','text',true],['category','Category','select',true,['Protein','Produce','Dairy','Dry Goods','Sauces','Beverages','Packaging','Cleaning','Fuel / Propane','Other']],['qty','On hand','number',true],['unit','Unit','text',true],['reorder','Reorder point','number'],['unitCost','Unit cost','money'],['vendor','Vendor','text'],['expires','Expires','date'],['notes','Notes','textarea']] },
  menu: { title:'Menu Costing', subtitle:'Menu price and estimated per-item margin.', action:'Add menu item', cols:['name','category','price','cost','profit','margin'], fields:[['name','Menu item','text',true],['category','Category','select',true,['Entree','Side','Drink','Dessert','Combo','Special','Catering Package']],['price','Sell price','money',true],['cost','Estimated item cost','money',true],['active','Status','select',false,['Yes','No','Seasonal']],['notes','Recipe / notes','textarea']] },
  purchases: { title:'Purchases', subtitle:'Vendor purchase and receipt log.', action:'Add purchase', cols:['date','vendor','category','item','qty','total'], fields:[['date','Date','date',true],['vendor','Vendor','text',true],['category','Category','select',true,['Food Inventory','Packaging','Cleaning','Repairs','Fuel / Propane','Smallwares','Marketing','Other']],['item','Item / description','text',true],['qty','Quantity','number'],['unit','Unit','text'],['total','Total','money',true],['notes','Notes','textarea']] },
  vendors: { title:'Vendors', subtitle:'Supplier contacts and ordering notes.', action:'Add vendor', cols:['name','category','contact','phone','email','terms'], fields:[['name','Vendor','text',true],['category','Category','select',true,['Food Supplier','Commissary','Packaging','Repair','Fuel / Propane','Marketing','Insurance','Accounting','Other']],['contact','Contact','text'],['phone','Phone','tel'],['email','Email','email'],['terms','Terms','text'],['notes','Notes','textarea']] },
  labor: { title:'Labor', subtitle:'Shift hours and labor cost.', action:'Add shift', cols:['date','employee','role','hours','rate','laborCost'], fields:[['date','Date','date',true],['employee','Employee','text',true],['role','Role','select',true,['Owner','Cook','Cashier','Prep','Driver','Event Staff','Manager','Other']],['hours','Hours','number',true],['rate','Hourly rate','money',true],['service','Service / event','text'],['notes','Notes','textarea']] },
  expenses: { title:'Expenses', subtitle:'Operating expenses and overhead.', action:'Add expense', cols:['date','category','vendor','amount','payment'], fields:[['date','Date','date',true],['category','Category','select',true,['Fuel','Propane','Commissary Kitchen','Insurance','Permit / License','Truck Repair','Marketing','Software','Professional Services','Supplies','Other']],['vendor','Vendor / payee','text'],['amount','Amount','money',true],['payment','Payment','select',false,['Card','Cash','ACH','Check','Auto-pay','Other']],['notes','Notes','textarea']] },
};

const NAV = [
  ['Operate', ['dashboard','daily','costs','reports']],
  ['Revenue', ['sales','events','customers']],
  ['Costs', ['inventory','menu','purchases','labor','expenses','vendors']],
  ['System', ['settings']],
];

const LABELS = { dashboard:'Dashboard', daily:'Daily Profit', costs:'Cost Library', reports:'Reports', settings:'Settings', ...Object.fromEntries(Object.entries(GENERIC_MODULES).map(([k,v])=>[k,v.title])) };
const MONEY_FIELDS = new Set(['gross','tax','discounts','refunds','quote','deposit','unitCost','price','cost','total','rate','amount']);

let state = normalize(loadState());
let active = localStorage.getItem(ACTIVE_KEY) || 'dashboard';
let search = '';
let dailyDraft = makeDailyDraft(today());
let navOpen = false;
const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL) : null;

if (!loadState()) saveState(state, false);
window.addEventListener('storage', e => { if (e.key === STORE_KEY && e.newValue) syncExternal(e.newValue); });
if (channel) channel.onmessage = e => { if (e.data?.clientId !== CLIENT_ID && e.data?.state) applyExternal(e.data.state); };

render();
registerSW();

function emptyState(){
  return {
    meta:{ schemaVersion:SCHEMA_VERSION, revision:0, updatedAt:null },
    settings:{ businessName:'Uff-Da Eats', currency:'USD', defaultProcessingPct:'0', defaultProcessingFixed:'0', defaultOverhead:'0' },
    ingredients:[], dailyReports:[],
    sales:[], customers:[], events:[], inventory:[], menu:[], purchases:[], vendors:[], labor:[], expenses:[],
  };
}

function normalize(input){
  const base = emptyState();
  const next = { ...base, ...(input||{}), meta:{...base.meta,...(input?.meta||{})}, settings:{...base.settings,...(input?.settings||{})} };
  [...Object.keys(GENERIC_MODULES),'ingredients','dailyReports'].forEach(k => { if (!Array.isArray(next[k])) next[k]=[]; });
  next.meta.schemaVersion = SCHEMA_VERSION;
  return next;
}

function loadState(){
  try {
    const current = localStorage.getItem(STORE_KEY);
    if (current) return JSON.parse(current);
    for (const key of LEGACY_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) return migrate(JSON.parse(raw));
    }
  } catch {}
  return null;
}

function migrate(old){
  const next = normalize(old);
  next.meta = { schemaVersion:SCHEMA_VERSION, revision:Number(old?.meta?.revision)||0, updatedAt:new Date().toISOString() };
  return next;
}

function saveState(next=state, announce=true){
  state = normalize(next);
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  if (announce && channel) channel.postMessage({ clientId:CLIENT_ID, state });
}

function commit(mutator){
  const draft = structuredClone(state);
  mutator(draft);
  draft.meta.revision = (Number(draft.meta.revision)||0)+1;
  draft.meta.updatedAt = new Date().toISOString();
  saveState(draft, true);
  render();
}

function syncExternal(raw){ try { applyExternal(JSON.parse(raw)); } catch {} }
function applyExternal(incoming){ const next=normalize(incoming); if ((next.meta.revision||0) > (state.meta.revision||0)) { state=next; render(); } }
function id(){ return crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function today(){ const d=new Date(); const offset=d.getTimezoneOffset(); return new Date(d.getTime()-offset*60000).toISOString().slice(0,10); }
function row(values){ return { id:id(), createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), ...values }; }
function moneyInputToCents(v){ try { return dollarsToCents(v||'0'); } catch { return 0; } }
function cashFromDollars(v){ return formatMoney(moneyInputToCents(v), state.settings.currency); }
function num(v){ const n=Number(v||0); return Number.isFinite(n)?n:0; }
function esc(v){ return String(v??'').replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }
function fmtDate(v){ if(!v)return '—'; const d=new Date(`${String(v).slice(0,10)}T12:00:00`); return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d); }
function pct(v){ return `${Number(v||0).toFixed(1)}%`; }

function setActive(key){ active=key; search=''; navOpen=false; localStorage.setItem(ACTIVE_KEY,key); render(); }
function titleFor(){
  if (active==='dashboard') return ['Command Center','Operational truth, not estimates.'];
  if (active==='daily') return ['Daily Profit','Measure what was actually consumed and what the service actually earned.'];
  if (active==='costs') return ['Cost Library','Effective-dated ingredient and packaging cost basis.'];
  if (active==='reports') return ['Reports','Saved service-day profitability and operating trends.'];
  if (active==='settings') return ['Settings','Business defaults, data portability and system controls.'];
  const m=GENERIC_MODULES[active]; return [m.title,m.subtitle];
}

function render(){
  const [title,subtitle]=titleFor();
  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      <aside class="sidebar ${navOpen?'open':''}">
        <div class="brand-row"><div class="brand-mark">U</div><div><strong>${esc(state.settings.businessName)}</strong><span>Command Center</span></div></div>
        <nav>${NAV.map(([group,keys])=>`<div class="nav-group"><div class="nav-caption">${group}</div>${keys.map(k=>`<button class="nav-item ${active===k?'active':''}" data-nav="${k}"><span>${LABELS[k]}</span><span class="nav-dot"></span></button>`).join('')}</div>`).join('')}</nav>
        <div class="sidebar-foot"><span class="status-dot"></span><span>Local-first · offline ready</span></div>
      </aside>
      <main class="main-shell">
        <header class="topbar">
          <button class="icon-btn mobile-only" data-action="menu" aria-label="Toggle navigation">☰</button>
          <div class="page-heading"><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>
          <div class="top-actions"><button class="btn ghost" data-action="backup">Backup</button>${active==='daily'?'<button class="btn primary" data-action="save-day">Save day</button>':''}</div>
        </header>
        <section class="content">${page()}</section>
      </main>
    </div>`;
  bind();
}

function page(){
  if(active==='dashboard') return dashboardPage();
  if(active==='daily') return dailyPage();
  if(active==='costs') return costsPage();
  if(active==='reports') return reportsPage();
  if(active==='settings') return settingsPage();
  return genericPage(active);
}

function metrics(){
  const reports=state.dailyReports;
  const month=today().slice(0,7);
  const monthRows=reports.filter(r=>r.date?.startsWith(month));
  const todayRow=reports.find(r=>r.date===today());
  const sum=(rows,key)=>rows.reduce((s,r)=>s+Number(r.summary?.[key]||0),0);
  const revenue=sum(monthRows,'revenueCents');
  const profit=sum(monthRows,'operatingProfitCents');
  return { todayProfit:todayRow?.summary?.operatingProfitCents||0, revenue, profit, margin:revenue?profit/revenue*100:0, services:monthRows.length };
}

function dashboardPage(){
  const m=metrics();
  const recent=[...state.dailyReports].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const low=state.inventory.filter(x=>num(x.qty)<=num(x.reorder)).slice(0,5);
  return `
    <div class="metric-grid">
      ${metric('Today profit',formatMoney(m.todayProfit,state.settings.currency),'From saved daily ledger',m.todayProfit>=0?'positive':'negative')}
      ${metric('Month revenue',formatMoney(m.revenue,state.settings.currency),`${m.services} saved service day${m.services===1?'':'s'}`)}
      ${metric('Month profit',formatMoney(m.profit,state.settings.currency),`${pct(m.margin)} operating margin`,m.profit>=0?'positive':'negative')}
      ${metric('Cost library',String(state.ingredients.filter(x=>x.active!==false).length),'Active costed inputs')}
    </div>
    <div class="dashboard-grid">
      <section class="surface span-2"><div class="section-head"><div><h2>Recent service days</h2><p>Immutable cost snapshots from finalized entries.</p></div><button class="text-btn" data-nav="daily">New daily entry →</button></div>
        ${recent.length?`<div class="ledger-list">${recent.map(reportRow).join('')}</div>`:empty('No daily reports yet','Configure your cost library, then save your first service day.')}
      </section>
      <section class="surface"><div class="section-head"><div><h2>Attention</h2><p>Operational exceptions.</p></div></div>
        <div class="stack">${low.length?low.map(x=>noticeRow(x.item,`${x.qty} ${x.unit||''} on hand · reorder at ${x.reorder}`,'warning')).join(''):noticeRow('Inventory levels','No reorder alerts right now.','good')}${state.ingredients.length?noticeRow('Cost basis',`${state.ingredients.filter(x=>x.active!==false).length} active inputs configured.`,'good'):noticeRow('Cost basis','Add ingredients before relying on daily profitability.','warning')}</div>
      </section>
    </div>`;
}

function metric(label,value,note,tone=''){ return `<div class="metric ${tone}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></div>`; }
function noticeRow(title,body,tone=''){ return `<div class="notice-row ${tone}"><span></span><div><strong>${esc(title)}</strong><p>${esc(body)}</p></div></div>`; }
function reportRow(r){ return `<button class="ledger-row" data-report="${r.id}"><div><strong>${fmtDate(r.date)}</strong><span>${esc(r.location||'Service day')}</span></div><div class="ledger-numbers"><span>${formatMoney(r.summary?.revenueCents||0,state.settings.currency)}</span><strong class="${(r.summary?.operatingProfitCents||0)>=0?'profit':'loss'}">${formatMoney(r.summary?.operatingProfitCents||0,state.settings.currency)}</strong></div></button>`; }

function makeDailyDraft(date){
  return { date, location:'', gross:'', tax:'', discounts:'', refunds:'', labor:'', processing:'', direct:'', overhead:state?.settings?.defaultOverhead||'', usages:{} };
}

function ingredientsForDate(date){
  return state.ingredients.filter(i=>i.active!==false).map(i=>{
    const cost=activeCostForDate(i.costHistory||[],date);
    return cost?{...i,...cost}:null;
  }).filter(Boolean);
}

function currentDailySnapshot(){
  const ingredients=ingredientsForDate(dailyDraft.date);
  const usages=[];
  for(const ingredient of ingredients){
    const u=dailyDraft.usages[ingredient.id];
    if(!u) continue;
    if(!num(u.soldQty)&&!num(u.wasteQty)&&!num(u.compQty)) continue;
    try { usages.push(buildUsageSnapshot(ingredient,u)); } catch {}
  }
  const data={
    grossSalesCents:moneyInputToCents(dailyDraft.gross), salesTaxCents:moneyInputToCents(dailyDraft.tax), discountsCents:moneyInputToCents(dailyDraft.discounts), refundsCents:moneyInputToCents(dailyDraft.refunds),
    laborCostCents:moneyInputToCents(dailyDraft.labor), processingFeesCents:moneyInputToCents(dailyDraft.processing), directExpensesCents:moneyInputToCents(dailyDraft.direct), allocatedOverheadCents:moneyInputToCents(dailyDraft.overhead), usages,
  };
  return { usages, summary:calculateDailyReport(data), raw:data };
}

function dailyPage(){
  const ingredients=ingredientsForDate(dailyDraft.date);
  const snap=currentDailySnapshot();
  return `<div class="daily-layout">
    <div class="daily-main">
      <section class="surface"><div class="section-head"><div><h2>Service</h2><p>Revenue and direct costs for one operating day.</p></div></div>
        <div class="form-grid compact">
          ${field('daily-date','Date','date',dailyDraft.date,true)}${field('daily-location','Location / event','text',dailyDraft.location)}
          ${field('daily-gross','Gross sales','money',dailyDraft.gross)}${field('daily-tax','Sales tax collected','money',dailyDraft.tax)}
          ${field('daily-discounts','Discounts','money',dailyDraft.discounts)}${field('daily-refunds','Refunds','money',dailyDraft.refunds)}
          ${field('daily-labor','Labor cost','money',dailyDraft.labor)}${field('daily-processing','Processing fees','money',dailyDraft.processing)}
          ${field('daily-direct','Other direct costs','money',dailyDraft.direct)}${field('daily-overhead','Allocated overhead','money',dailyDraft.overhead)}
        </div>
      </section>
      <section class="surface"><div class="section-head"><div><h2>Measured usage</h2><p>Enter exact sold, waste and comp quantities. Costs use the rate effective on ${fmtDate(dailyDraft.date)}.</p></div><button class="text-btn" data-nav="costs">Manage costs →</button></div>
        ${ingredients.length?`<div class="usage-table"><div class="usage-head"><span>Ingredient</span><span>Sold</span><span>Waste</span><span>Comp</span><span>Cost</span></div>${ingredients.map(usageRow).join('')}</div>`:empty('Cost library is empty','Add ingredients and packaging with purchase quantities and prices before saving a day.')}
      </section>
    </div>
    <aside class="profit-rail"><section class="summary-card"><span class="summary-label">Operating profit</span><strong class="summary-profit ${(snap.summary.operatingProfitCents||0)>=0?'profit':'loss'}">${formatMoney(snap.summary.operatingProfitCents,state.settings.currency)}</strong><span class="summary-margin">${pct(snap.summary.marginPct)} margin</span><div class="summary-lines">${summaryLine('Net revenue',snap.summary.revenueCents)}${summaryLine('Food',snap.summary.foodCostCents)}${summaryLine('Packaging',snap.summary.packagingCostCents)}${summaryLine('Labor',snap.summary.laborCostCents)}${summaryLine('Processing',snap.summary.processingFeesCents)}${summaryLine('Other direct',snap.summary.directExpensesCents)}${summaryLine('Overhead',snap.summary.allocatedOverheadCents)}<div class="summary-total">${summaryLine('Total cost',snap.summary.totalCostCents,true)}</div></div><p class="fine-print">Sales tax is excluded from net revenue. Saved reports retain cost snapshots even after future price changes.</p></section></aside>
  </div>`;
}

function field(id,label,type,value,required=false){ const inputType=type==='money'?'number':type; const step=type==='money'?'0.01':type==='number'?'any':undefined; return `<label class="field"><span>${esc(label)}${required?' *':''}</span><input id="${id}" type="${inputType}" ${step?`step="${step}"`:''} value="${esc(value)}" /></label>`; }
function usageRow(ingredient){
  const u=dailyDraft.usages[ingredient.id]||{unit:baseUsageUnit(ingredient.purchaseUnit),soldQty:'',wasteQty:'',compQty:''};
  dailyDraft.usages[ingredient.id]=u;
  let cost=0; try { cost=buildUsageSnapshot(ingredient,u).totalCostCents; } catch {}
  return `<div class="usage-row" data-ingredient="${ingredient.id}"><div class="ingredient-cell"><strong>${esc(ingredient.name)}</strong><span>${esc(ingredient.category)} · ${formatCostBasis(ingredient)}</span></div><div class="qty-input"><input data-usage="soldQty" type="number" step="any" min="0" value="${esc(u.soldQty)}"><span>${esc(unitLabel(u.unit))}</span></div><div class="qty-input"><input data-usage="wasteQty" type="number" step="any" min="0" value="${esc(u.wasteQty)}"><span>${esc(unitLabel(u.unit))}</span></div><div class="qty-input"><input data-usage="compQty" type="number" step="any" min="0" value="${esc(u.compQty)}"><span>${esc(unitLabel(u.unit))}</span></div><strong class="usage-cost">${formatMoney(cost,state.settings.currency)}</strong></div>`;
}
function baseUsageUnit(unit){ if(unit==='lb')return 'oz'; if(unit==='gallon'||unit==='quart'||unit==='pint'||unit==='cup')return 'floz'; return unit; }
function unitLabel(u){ return UNIT_DEFS[u]?.label||u; }
function formatCostBasis(i){ return `${formatMoney(i.purchaseCostCents,state.settings.currency)} / ${i.purchaseQuantity} ${unitLabel(i.purchaseUnit)}`; }
function summaryLine(label,cents,strong=false){ return `<div class="summary-line ${strong?'strong':''}"><span>${esc(label)}</span><b>${formatMoney(cents,state.settings.currency)}</b></div>`; }

function costsPage(){
  const rows=[...state.ingredients].sort((a,b)=>a.name.localeCompare(b.name));
  return `<section class="surface"><div class="section-head"><div><h2>Ingredient & packaging costs</h2><p>Each price update creates a new effective-dated cost record. Historical service days never recalculate.</p></div><button class="btn primary" data-action="add-ingredient">Add cost item</button></div>
    ${rows.length?`<div class="cost-list">${rows.map(costRow).join('')}</div>`:empty('No cost items','Add every ingredient, sauce, seasoning, oil and packaging item used during service.')}
  </section>`;
}
function costRow(i){
  const history=[...(i.costHistory||[])].sort((a,b)=>b.effectiveDate.localeCompare(a.effectiveDate)); const latest=history[0];
  if(latest) costPerBaseUnitMicros({...i,...latest});
  return `<div class="cost-row"><div><strong>${esc(i.name)}</strong><span>${esc(i.category)} · ${i.active===false?'Inactive':'Active'}</span></div><div><span>Current purchase cost</span><strong>${latest?formatCostBasis({...i,...latest}):'—'}</strong></div><div><span>Effective</span><strong>${latest?fmtDate(latest.effectiveDate):'—'}</strong></div><div class="row-actions"><button class="btn ghost small" data-edit-ingredient="${i.id}">Update cost</button><button class="icon-btn" data-toggle-ingredient="${i.id}" title="${i.active===false?'Activate':'Deactivate'}">${i.active===false?'＋':'×'}</button></div></div>`;
}

function reportsPage(){
  const rows=[...state.dailyReports].sort((a,b)=>b.date.localeCompare(a.date));
  const revenue=rows.reduce((s,r)=>s+Number(r.summary?.revenueCents||0),0); const profit=rows.reduce((s,r)=>s+Number(r.summary?.operatingProfitCents||0),0);
  return `<div class="metric-grid three">${metric('Saved revenue',formatMoney(revenue,state.settings.currency),'All finalized service days')}${metric('Saved operating profit',formatMoney(profit,state.settings.currency),revenue?`${pct(profit/revenue*100)} margin`:'No revenue yet',profit>=0?'positive':'negative')}${metric('Service days',String(rows.length),'Auditable daily ledgers')}</div>
    <section class="surface"><div class="section-head"><div><h2>Daily history</h2><p>Open any day for the complete saved cost breakdown.</p></div><button class="btn ghost" data-action="export-reports">Export CSV</button></div>${rows.length?`<div class="ledger-list">${rows.map(reportRow).join('')}</div>`:empty('No reports','Save a daily profit report to build history.')}</section>`;
}

function genericPage(key){
  const def=GENERIC_MODULES[key]; const rows=filterRows(state[key]||[]);
  return `<section class="surface"><div class="section-head"><div><h2>${esc(def.title)}</h2><p>${state[key].length} record${state[key].length===1?'':'s'}.</p></div><button class="btn primary" data-generic-add="${key}">${esc(def.action)}</button></div>
    <div class="table-toolbar"><input id="module-search" class="search" placeholder="Search ${esc(def.title.toLowerCase())}…" value="${esc(search)}"><button class="btn ghost small" data-export="${key}">Export CSV</button></div>
    ${rows.length?tableFor(key,rows):empty(`No ${def.title.toLowerCase()} records`,`Use “${def.action}” to create the first record.`)}
  </section>`;
}
function filterRows(rows){ if(!search)return rows; const q=search.toLowerCase(); return rows.filter(r=>Object.values(r).some(v=>String(v??'').toLowerCase().includes(q))); }
function displayValue(key,row,col){
  if(col==='laborCost') return cashFromDollars(num(row.hours)*num(row.rate));
  if(col==='profit') return cashFromDollars(num(row.price)-num(row.cost));
  if(col==='margin') return num(row.price)?pct((num(row.price)-num(row.cost))/num(row.price)*100):'0.0%';
  if(MONEY_FIELDS.has(col)) return cashFromDollars(row[col]);
  if(col==='date') return fmtDate(row[col]);
  return row[col]??'—';
}
function tableFor(key,rows){ const def=GENERIC_MODULES[key]; return `<div class="table-wrap"><table><thead><tr>${def.cols.map(c=>`<th>${esc(human(c))}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map(r=>`<tr>${def.cols.map(c=>`<td>${esc(displayValue(key,r,c))}</td>`).join('')}<td class="cell-actions"><button class="text-btn" data-generic-edit="${key}:${r.id}">Edit</button></td></tr>`).join('')}</tbody></table></div>`; }
function human(v){ return v.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase()); }

function settingsPage(){
  return `<div class="settings-grid"><section class="surface"><div class="section-head"><div><h2>Business defaults</h2><p>Used by the command center only.</p></div></div><form id="settings-form" class="form-grid compact">${field('setting-business','Business name','text',state.settings.businessName)}${field('setting-overhead','Default daily overhead','money',state.settings.defaultOverhead)}<div class="form-actions full"><button class="btn primary" type="submit">Save settings</button></div></form></section>
  <section class="surface danger-zone"><div class="section-head"><div><h2>Data controls</h2><p>Local-first storage requires deliberate backups.</p></div></div><div class="stack"><button class="btn ghost" data-action="backup">Download JSON backup</button><label class="btn ghost file-btn">Restore backup<input id="restore-input" type="file" accept="application/json"></label><button class="btn danger" data-action="reset">Reset command center</button></div><p class="fine-print">A reset permanently removes local command-center records from this browser. Download a backup first.</p></section></div>`;
}

function empty(title,body){ return `<div class="empty-state"><strong>${esc(title)}</strong><p>${esc(body)}</p></div>`; }

function bind(){
  document.querySelectorAll('[data-nav]').forEach(el=>el.onclick=()=>setActive(el.dataset.nav));
  document.querySelector('[data-action="menu"]')?.addEventListener('click',()=>{navOpen=!navOpen;render();});
  document.querySelectorAll('[data-action="backup"]').forEach(el=>el.onclick=backup);
  document.querySelector('[data-action="save-day"]')?.addEventListener('click',saveDay);
  document.querySelector('[data-action="add-ingredient"]')?.addEventListener('click',()=>ingredientModal());
  document.querySelectorAll('[data-edit-ingredient]').forEach(el=>el.onclick=()=>ingredientModal(el.dataset.editIngredient));
  document.querySelectorAll('[data-toggle-ingredient]').forEach(el=>el.onclick=()=>toggleIngredient(el.dataset.toggleIngredient));
  document.querySelectorAll('[data-report]').forEach(el=>el.onclick=()=>reportModal(el.dataset.report));
  document.querySelectorAll('[data-generic-add]').forEach(el=>el.onclick=()=>genericModal(el.dataset.genericAdd));
  document.querySelectorAll('[data-generic-edit]').forEach(el=>el.onclick=()=>{ const [k,id]=el.dataset.genericEdit.split(':'); genericModal(k,id); });
  document.querySelectorAll('[data-export]').forEach(el=>el.onclick=()=>exportGeneric(el.dataset.export));
  document.querySelector('[data-action="export-reports"]')?.addEventListener('click',exportReports);
  document.querySelector('#module-search')?.addEventListener('input',e=>{search=e.target.value; render(); document.querySelector('#module-search')?.focus();});
  bindDaily();
  document.querySelector('#settings-form')?.addEventListener('submit',saveSettings);
  document.querySelector('#restore-input')?.addEventListener('change',restoreBackup);
  document.querySelector('[data-action="reset"]')?.addEventListener('click',resetAll);
}

function bindDaily(){
  const map={ 'daily-date':'date','daily-location':'location','daily-gross':'gross','daily-tax':'tax','daily-discounts':'discounts','daily-refunds':'refunds','daily-labor':'labor','daily-processing':'processing','daily-direct':'direct','daily-overhead':'overhead' };
  Object.entries(map).forEach(([id,key])=>document.getElementById(id)?.addEventListener('input',e=>{ dailyDraft[key]=e.target.value; if(key==='date') dailyDraft.usages={}; render(); }));
  document.querySelectorAll('.usage-row').forEach(rowEl=>rowEl.querySelectorAll('[data-usage]').forEach(input=>input.addEventListener('input',e=>{ const u=dailyDraft.usages[rowEl.dataset.ingredient]; u[e.target.dataset.usage]=e.target.value; render(); })));
}

function saveDay(){
  if(!dailyDraft.date){ alert('Date is required.'); return; }
  if(!dailyDraft.gross){ alert('Gross sales are required.'); return; }
  const snap=currentDailySnapshot();
  const report=row({ date:dailyDraft.date, location:dailyDraft.location.trim(), source:{ gross:dailyDraft.gross,tax:dailyDraft.tax,discounts:dailyDraft.discounts,refunds:dailyDraft.refunds,labor:dailyDraft.labor,processing:dailyDraft.processing,direct:dailyDraft.direct,overhead:dailyDraft.overhead }, usages:snap.usages, summary:snap.summary, finalizedAt:new Date().toISOString() });
  commit(d=>{ const idx=d.dailyReports.findIndex(r=>r.date===report.date); if(idx>=0)d.dailyReports[idx]=report; else d.dailyReports.push(report); });
  dailyDraft=makeDailyDraft(today());
  setActive('reports');
}

function ingredientModal(ingredientId=null){
  const ingredient=state.ingredients.find(x=>x.id===ingredientId);
  const latest=ingredient?[...(ingredient.costHistory||[])].sort((a,b)=>b.effectiveDate.localeCompare(a.effectiveDate))[0]:null;
  showModal(ingredient?'Update cost item':'Add cost item',`<form id="ingredient-form" class="form-grid">${field('ing-name','Name','text',ingredient?.name||'',true)}<label class="field"><span>Category *</span><select id="ing-category"><option>Food</option><option>Packaging</option><option>Beverage</option><option>Other</option></select></label>${field('ing-qty','Purchase quantity','number',latest?.purchaseQuantity||'',true)}<label class="field"><span>Purchase unit *</span><select id="ing-unit">${Object.entries(UNIT_DEFS).map(([k,v])=>`<option value="${k}" ${latest?.purchaseUnit===k?'selected':''}>${v.label}</option>`).join('')}</select></label>${field('ing-cost','Purchase cost','money',latest?String(latest.purchaseCostCents/100):'',true)}${field('ing-effective','Effective date','date',latest?.effectiveDate||today(),true)}<label class="field full"><span>Notes</span><textarea id="ing-notes">${esc(ingredient?.notes||'')}</textarea></label></form>`, `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" data-save-ingredient>Save cost</button>`);
  document.getElementById('ing-category').value=ingredient?.category||'Food';
  document.querySelector('[data-save-ingredient]').onclick=()=>{
    const name=document.getElementById('ing-name').value.trim(); const category=document.getElementById('ing-category').value; const purchaseQuantity=document.getElementById('ing-qty').value; const purchaseUnit=document.getElementById('ing-unit').value; const purchaseCostCents=moneyInputToCents(document.getElementById('ing-cost').value); const effectiveDate=document.getElementById('ing-effective').value; const notes=document.getElementById('ing-notes').value.trim();
    if(!name||!purchaseQuantity||!effectiveDate){alert('Name, purchase quantity, cost and effective date are required.');return;}
    commit(d=>{ if(ingredient){ const item=d.ingredients.find(x=>x.id===ingredient.id); item.name=name;item.category=category;item.notes=notes;item.updatedAt=new Date().toISOString(); const existing=item.costHistory.findIndex(c=>c.effectiveDate===effectiveDate); const cost={purchaseQuantity,purchaseUnit,purchaseCostCents,effectiveDate}; if(existing>=0)item.costHistory[existing]=cost;else item.costHistory.push(cost); } else d.ingredients.push(row({name,category,notes,active:true,costHistory:[{purchaseQuantity,purchaseUnit,purchaseCostCents,effectiveDate}]})); });
    closeModal();
  };
}

function toggleIngredient(id){ commit(d=>{ const item=d.ingredients.find(x=>x.id===id); if(item)item.active=item.active===false; }); }

function genericModal(key,recordId=null){
  const def=GENERIC_MODULES[key]; const current=state[key].find(x=>x.id===recordId)||{};
  showModal(recordId?`Edit ${def.title}`:def.action,`<form id="generic-form" class="form-grid">${def.fields.map(f=>genericField(f,current[f[0]])).join('')}</form>`,`<button class="btn ghost" data-close>Cancel</button>${recordId?'<button class="btn danger" data-delete-record>Delete</button>':''}<button class="btn primary" data-save-record>Save</button>`);
  document.querySelector('[data-save-record]').onclick=()=>{
    const values={}; for(const [name] of def.fields) values[name]=document.getElementById(`gf-${name}`).value;
    for(const f of def.fields) if(f[3]&&!String(values[f[0]]||'').trim()){alert(`${f[1]} is required.`);return;}
    commit(d=>{ if(recordId){ const idx=d[key].findIndex(x=>x.id===recordId); d[key][idx]={...d[key][idx],...values,updatedAt:new Date().toISOString()}; } else d[key].push(row(values)); }); closeModal();
  };
  document.querySelector('[data-delete-record]')?.addEventListener('click',()=>{ if(confirm('Delete this record?')){commit(d=>{d[key]=d[key].filter(x=>x.id!==recordId);});closeModal();} });
}

function genericField(f,value=''){ const [name,label,type,required,options]=f; const id=`gf-${name}`; if(type==='select')return `<label class="field"><span>${esc(label)}${required?' *':''}</span><select id="${id}">${options.map(o=>`<option ${o===value?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`; if(type==='textarea')return `<label class="field full"><span>${esc(label)}</span><textarea id="${id}">${esc(value)}</textarea></label>`; return field(id,label,type,value,required); }

function reportModal(reportId){
  const r=state.dailyReports.find(x=>x.id===reportId); if(!r)return;
  showModal(`${fmtDate(r.date)} · ${r.location||'Service day'}`,`<div class="report-detail"><div class="report-kpis">${metric('Net revenue',formatMoney(r.summary.revenueCents,state.settings.currency),'')}${metric('Operating profit',formatMoney(r.summary.operatingProfitCents,state.settings.currency),`${pct(r.summary.marginPct)} margin`,r.summary.operatingProfitCents>=0?'positive':'negative')}</div><div class="summary-lines">${summaryLine('Food',r.summary.foodCostCents)}${summaryLine('Packaging',r.summary.packagingCostCents)}${summaryLine('Labor',r.summary.laborCostCents)}${summaryLine('Processing',r.summary.processingFeesCents)}${summaryLine('Other direct',r.summary.directExpensesCents)}${summaryLine('Overhead',r.summary.allocatedOverheadCents)}${summaryLine('Total cost',r.summary.totalCostCents,true)}</div><h3>Usage snapshots</h3>${r.usages?.length?`<div class="snapshot-list">${r.usages.map(u=>`<div><strong>${esc(u.name)}</strong><span>${esc(u.soldQty)} ${esc(unitLabel(u.unit))} sold · ${esc(u.wasteQty)} waste · ${esc(u.compQty)} comp</span><b>${formatMoney(u.totalCostCents,state.settings.currency)}</b></div>`).join('')}</div>`:'<p class="muted">No measured usage was saved.</p>'}</div>`,`<button class="btn ghost" data-close>Close</button><button class="btn danger" data-delete-report>Delete report</button>`);
  document.querySelector('[data-delete-report]').onclick=()=>{if(confirm('Delete this finalized report?')){commit(d=>{d.dailyReports=d.dailyReports.filter(x=>x.id!==reportId);});closeModal();}};
}

function showModal(title,body,footer=''){ const host=document.createElement('div'); host.className='modal-backdrop'; host.id='modal-host'; host.innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>${esc(title)}</h2></div><button class="icon-btn" data-close aria-label="Close">×</button></div><div class="modal-body">${body}</div><div class="modal-foot">${footer}</div></div>`; document.body.appendChild(host); host.querySelectorAll('[data-close]').forEach(x=>x.onclick=closeModal); host.onclick=e=>{if(e.target===host)closeModal();}; }
function closeModal(){ document.getElementById('modal-host')?.remove(); }

function saveSettings(e){ e.preventDefault(); commit(d=>{ d.settings.businessName=document.getElementById('setting-business').value.trim()||'Food Truck'; d.settings.defaultOverhead=document.getElementById('setting-overhead').value||'0'; }); }
function backup(){ download(`foodtruck-command-center-${today()}.json`,JSON.stringify(state,null,2),'application/json'); }
function restoreBackup(e){ const file=e.target.files?.[0]; if(!file)return; const reader=new FileReader(); reader.onload=()=>{ try{ const parsed=JSON.parse(reader.result); saveState(normalize(parsed),true); render(); alert('Backup restored.'); } catch { alert('That backup file is invalid.'); } }; reader.readAsText(file); }
function resetAll(){ if(!confirm('Reset all command-center data in this browser? This cannot be undone without a backup.'))return; localStorage.removeItem(STORE_KEY); state=emptyState(); dailyDraft=makeDailyDraft(today()); saveState(state,true); render(); }

function csvCell(v){ const s=String(v??''); return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s; }
function exportGeneric(key){ const rows=state[key]; if(!rows.length)return; const headers=[...new Set(rows.flatMap(r=>Object.keys(r).filter(k=>!['id','createdAt','updatedAt'].includes(k))))]; const csv=[headers.join(','),...rows.map(r=>headers.map(h=>csvCell(r[h])).join(','))].join('\n'); download(`${key}-${today()}.csv`,csv,'text/csv'); }
function exportReports(){ const headers=['date','location','netRevenue','food','packaging','labor','processing','direct','overhead','totalCost','operatingProfit','marginPct']; const rows=state.dailyReports.map(r=>[r.date,r.location,r.summary.revenueCents/100,r.summary.foodCostCents/100,r.summary.packagingCostCents/100,r.summary.laborCostCents/100,r.summary.processingFeesCents/100,r.summary.directExpensesCents/100,r.summary.allocatedOverheadCents/100,r.summary.totalCostCents/100,r.summary.operatingProfitCents/100,r.summary.marginPct.toFixed(2)]); download(`daily-profit-${today()}.csv`,[headers.join(','),...rows.map(r=>r.map(csvCell).join(','))].join('\n'),'text/csv'); }
function download(name,content,type){ const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000); }

function registerSW(){ if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{}); }
