import { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Shell } from './components/Shell.jsx';
import { GENERIC_MODULES } from './config/modules.js';
import { downloadFile } from './lib/format.js';
import { useAppStore } from './lib/store.jsx';
import { CostLibraryPage } from './pages/CostLibraryPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { GenericModulePage } from './pages/GenericModulePage.jsx';
import { JobReconciliationPage } from './pages/JobReconciliationPage.jsx';
import { LiveOrdersPage } from './pages/LiveOrdersPage.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';

const ROUTES = new Set(['dashboard','orders','daily','costs','reports','settings',...Object.keys(GENERIC_MODULES)]);
function routeFromHash(){const value=location.hash.replace(/^#\/?/,'');return ROUTES.has(value)?value:'dashboard';}
const TITLES={dashboard:['Command Center','Operational truth, not estimates.'],orders:['Live Orders','Square-synchronized service queue.'],daily:['Job Reconciliation','Count inventory before and after every service to reconcile exact depletion, cost and profit.'],costs:['Cost Library','Effective-dated ingredient and packaging cost basis.'],reports:['Reports','Saved service-day profitability and operating trends.'],settings:['Settings','Business defaults, data portability and system controls.']};
export default function App(){const{state}=useAppStore();const[route,setRoute]=useState(routeFromHash);useEffect(()=>{const handler=()=>setRoute(routeFromHash());addEventListener('hashchange',handler);return()=>removeEventListener('hashchange',handler);},[]);useEffect(()=>{if(!location.hash)history.replaceState(null,'',`#/${route}`);},[route]);const navigate=useCallback(key=>{if(ROUTES.has(key))location.hash=`#/${key}`;},[]);const backup=useCallback(()=>downloadFile(`uffda-command-center-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(state,null,2),'application/json'),[state]);if(route==='orders')return <LiveOrdersPage/>;const[title,subtitle]=TITLES[route]||[GENERIC_MODULES[route]?.title||'Command Center',GENERIC_MODULES[route]?.subtitle||''];const page=route==='dashboard'?<DashboardPage onNavigate={navigate}/>:route==='daily'?<JobReconciliationPage/>:route==='costs'?<CostLibraryPage/>:route==='reports'?<ReportsPage/>:route==='settings'?<SettingsPage/>:<GenericModulePage moduleKey={route}/>;const primaryAction=<button className="button secondary" type="button" onClick={backup}><Download size={16}/> Backup</button>;return <Shell route={route} onNavigate={navigate} title={title} subtitle={subtitle} primaryAction={primaryAction}>{page}</Shell>;}
