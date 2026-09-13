import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { MenuQuickReference } from '../components/MenuQuickReference.jsx';
import { KitchenTimers } from '../components/KitchenTimers.jsx';
import { OrderManagement } from '../components/OrderManagement.jsx';
import { QueueNavigator } from '../components/QueueNavigator.jsx';
import { autoCompleteExpiredOrders, clearLiveSession, ensureSession, fetchLiveOrders, loadLiveSession, requestSquareSync, setOrderStatus, signInStaff, staffStatus, subscribeToOrders } from '../lib/liveOrders.js';
import { orderUrgency } from '../lib/orderUrgency.js';

function elapsed(from){if(!from)return'--:--';const sec=Math.max(0,Math.floor((Date.now()-new Date(from).getTime())/1000));const m=Math.floor(sec/60);return`${m}:${String(sec%60).padStart(2,'0')}`;}
function itemCount(items=[]){return items.reduce((sum,item)=>sum+Number(item.quantity||1),0);}
const serviceDate=new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
const serviceTime=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'});
function OrderItems({items=[]}){return <div className="live-items">{items.map((item,index)=><div className="live-line" key={item.uid||`${item.name}-${index}`}><div className="live-line-main"><strong>{item.quantity||1} ×</strong><span>{item.name||'Item'}</span></div>{item.variation?<div className="live-modifier">{item.variation}</div>:null}{(item.modifiers||[]).map((modifier,i)=><div className="live-modifier" key={`${modifier}-${i}`}>{modifier}</div>)}{item.note?<div className="live-note">{item.note}</div>:null}</div>)}</div>}

function OrderDetail({order,busy,onClose,onMove}){
  const closeRef=useRef(null);
  const dialogRef=useRef(null);
  useEffect(()=>{const previous=document.activeElement;closeRef.current?.focus();const onKeyDown=event=>{if(event.key==='Escape'){event.preventDefault();onClose();}if(event.key==='Tab'){const controls=[...dialogRef.current.querySelectorAll('button:not(:disabled)')];const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};document.addEventListener('keydown',onKeyDown);return()=>{document.removeEventListener('keydown',onKeyDown);previous?.focus?.();};},[onClose]);
  const isActive=order.status==='active';
  const isReady=order.status==='ready';
  const received=order.source_created_at||order.created_at;
  return <div className="order-dialog-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <section className={`order-dialog ${isReady?'is-ready':order.status==='complete'?'is-complete':''}`} role="dialog" aria-modal="true" aria-labelledby="order-dialog-title" ref={dialogRef}>
      <div className="order-dialog-header"><div className="order-dialog-top"><span className="order-dialog-state">{isActive?'ACTIVE ORDER':isReady?'READY FOR PICKUP':'COMPLETED'}</span><button className="order-dialog-x" type="button" aria-label="Close order details" onClick={onClose} ref={closeRef}><X size={22}/></button></div><div className="order-dialog-heading"><h2 id="order-dialog-title">#{order.ticket_number}{order.customer_name?<span>{order.customer_name}</span>:null}</h2><time dateTime={received}>{order.status==='complete'&&order.completed_at?`Done ${elapsed(order.completed_at)}`:elapsed(received)}</time></div><p>Received {received?serviceTime.format(new Date(received)):'—'} <span aria-hidden="true">·</span> {itemCount(order.items)} {itemCount(order.items)===1?'item':'items'}</p></div>
      <div className="order-dialog-items">{(order.items||[]).map((item,index)=><div className="order-dialog-line" key={item.uid||`${item.name}-${index}`}><strong className="order-dialog-quantity">{item.quantity||1} ×</strong><div><h3>{item.name||'Item'}</h3>{item.variation?<p>{item.variation}</p>:null}{(item.modifiers||[]).map((modifier,i)=><p key={`${modifier}-${i}`}>{modifier}</p>)}{item.note?<p className="order-dialog-note">{item.note}</p>:null}</div></div>)}</div>
      <div className="order-dialog-footer"><button className="order-dialog-close" type="button" onClick={onClose}>Close</button>{order.status!=='complete'?<button className={isActive?'ready-button':'complete-button'} type="button" disabled={busy} onClick={()=>onMove(order,isActive?'ready':'complete')}>{busy?'Updating…':isActive?'Mark Ready':'Complete Order'}</button>:null}</div>
    </section>
  </div>;
}

function UnifiedOrderCard({order,busy,onOpen,onMove}){
  const count=itemCount(order.items);
  const urgency=order.status==='active'?orderUrgency(order):'normal';
  const isReady=order.status==='ready';
  return <article className={`unified-order-card ${order.status} ${urgency}`}>
    <button className="unified-order-open" type="button" onClick={()=>onOpen(order.id)} aria-label={`View order #${order.ticket_number}`}>
      <div className="unified-order-top"><div className="unified-order-id"><strong>#{order.ticket_number}</strong><span>{count} {count===1?'item':'items'}</span></div><time>{isReady?`Ready ${elapsed(order.ready_at)}`:elapsed(order.source_created_at||order.created_at)}</time></div>
      <OrderItems items={order.items}/>
    </button>
    <button type="button" className={isReady?'complete-button':'ready-button'} disabled={busy} onClick={()=>onMove(order,isReady?'complete':'ready')}>{busy?'Updating…':isReady?'Complete':'Mark Ready'}</button>
  </article>;
}

function CompletedOrderRow({order,onOpen}){
  const count=itemCount(order.items);
  return <button type="button" className="completed-order-row" onClick={()=>onOpen(order.id)} aria-label={`View completed order #${order.ticket_number}`}><span className="completed-check"><CheckCircle2 size={17}/></span><strong>#{order.ticket_number}</strong><span className="completed-order-items">{count} {count===1?'item':'items'}</span><time>{order.completed_at?serviceTime.format(new Date(order.completed_at)):'Completed'}</time></button>;
}

export function LiveOrdersPage(){
  const [session,setSession]=useState(loadLiveSession);
  const [authorized,setAuthorized]=useState(false);
  const [username,setUsername]=useState('staff');
  const [password,setPassword]=useState('');
  const [orders,setOrders]=useState([]);
  const [connection,setConnection]=useState(navigator.onLine?'connecting':'offline');
  const [lastUpdated,setLastUpdated]=useState(null);
  const [error,setError]=useState('');
  const [busyId,setBusyId]=useState('');
  const [selectedId,setSelectedId]=useState(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const [manageOpen,setManageOpen]=useState(false);
  const [syncing,setSyncing]=useState(false);
  const [,tick]=useState(0);
  const sessionRef=useRef(session);
  sessionRef.current=session;

  const load=useCallback(async(token)=>{try{const data=await fetchLiveOrders(token);setOrders(data);setAuthorized(true);setLastUpdated(new Date());setError('');return true;}catch(err){if(err.code==='AUTH'){setAuthorized(false);return false;}setError(err.message);return false;}},[]);

  useEffect(()=>{let cancelled=false;(async()=>{if(!session)return;try{const fresh=await ensureSession(session);if(cancelled)return;if(fresh.accessToken!==session.accessToken)setSession(fresh);if(await staffStatus(fresh.accessToken))await load(fresh.accessToken);else{clearLiveSession();setSession(null);setAuthorized(false);}}catch(err){if(!cancelled){setAuthorized(false);setError(err.message);}}})();return()=>{cancelled=true;};},[session?.accessToken,load]);
  useEffect(()=>{if(!authorized||!session?.accessToken)return;let cancelled=false;const token=session.accessToken;const reconcile=async(windowMinutes)=>{try{await requestSquareSync(token,windowMinutes);if(!cancelled)await load(token);}catch(err){if(!cancelled)setError(`Square reconciliation failed: ${err.message}. Use backup tickets until verified.`);}};const autoComplete=async()=>{try{const completed=await autoCompleteExpiredOrders(token,30);if(completed.length&&!cancelled)await load(token);}catch(err){if(!cancelled)setError(`Auto-complete failed: ${err.message}`);}};const stop=subscribeToOrders(token,()=>load(token),state=>{setConnection(state);if(state==='connected')load(token);});reconcile();autoComplete();const syncTimer=setInterval(()=>reconcile(30),5*60*1000);const autoCompleteTimer=setInterval(autoComplete,15000);const poll=setInterval(async()=>{const ok=await load(token);if(!ok)setConnection(navigator.onLine?'reconnecting':'offline');},15000);const timer=setInterval(()=>tick(v=>v+1),1000);return()=>{cancelled=true;stop();clearInterval(syncTimer);clearInterval(autoCompleteTimer);clearInterval(poll);clearInterval(timer);};},[authorized,session?.accessToken,load]);
  useEffect(()=>{if(!session)return;const timer=setInterval(async()=>{try{const fresh=await ensureSession(sessionRef.current);if(fresh.accessToken!==sessionRef.current?.accessToken)setSession(fresh);}catch(err){setAuthorized(false);setError(err.message);}},30000);return()=>clearInterval(timer);},[Boolean(session)]);
  useEffect(()=>{const online=()=>{setConnection('connecting');if(sessionRef.current?.accessToken)load(sessionRef.current.accessToken);};const offline=()=>setConnection('offline');addEventListener('online',online);addEventListener('offline',offline);return()=>{removeEventListener('online',online);removeEventListener('offline',offline);};},[load]);

  const login=async event=>{event.preventDefault();setError('');try{const fresh=await signInStaff(username,password);setPassword('');setSession(fresh);await load(fresh.accessToken);}catch(err){setError(err.message);}};
  const move=async(order,status)=>{setBusyId(order.id);setError('');try{await setOrderStatus(session.accessToken,order.id,status,order.status);setSelectedId(null);await load(session.accessToken);}catch(err){await load(session.accessToken);setError(err.message);}finally{setBusyId('');}};
  const sync=async()=>{setSyncing(true);setError('');try{await requestSquareSync(session.accessToken);await autoCompleteExpiredOrders(session.accessToken,30);await load(session.accessToken);}catch(err){setError(err.message);}finally{setSyncing(false);}};

  const active=useMemo(()=>orders.filter(o=>o.status==='active'),[orders]);
  const ready=useMemo(()=>orders.filter(o=>o.status==='ready'),[orders]);
  const completed=useMemo(()=>orders.filter(o=>o.status==='complete').toSorted((a,b)=>new Date(b.completed_at||b.updated_at)-new Date(a.completed_at||a.updated_at)),[orders]);
  const working=useMemo(()=>[...ready,...active],[ready,active]);
  const urgentCount=active.reduce((count,order)=>count+(orderUrgency(order)==='overdue'?1:0),0);
  const selectedOrder=orders.find(order=>order.id===selectedId);
  const closeDetail=useCallback(()=>setSelectedId(null),[]);
  const closeMenu=useCallback(()=>setMenuOpen(false),[]);
  const closeManage=useCallback(()=>setManageOpen(false),[]);
  const refreshOrders=useCallback(()=>load(sessionRef.current.accessToken),[load]);
  const jumpToLane=useCallback(()=>document.querySelector('.live-workspace-scroll')?.scrollTo({top:0,behavior:'smooth'}),[]);
  const openFoundOrder=useCallback(order=>setSelectedId(order.id),[]);
  useEffect(()=>{const findShortcut=event=>{if(event.key==='/'&&!event.metaKey&&!event.ctrlKey&&!event.altKey&&!document.querySelector('[aria-modal="true"]')&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)){event.preventDefault();document.querySelector('.queue-finder input')?.focus();}};document.addEventListener('keydown',findShortcut);return()=>document.removeEventListener('keydown',findShortcut);},[]);
  useEffect(()=>{if(selectedId&&!selectedOrder)setSelectedId(null);},[selectedId,selectedOrder]);

  if(!authorized)return <section className="live-auth"><div className="live-auth-card"><img src="./brand/uff-da-logo-white.webp" alt="Uff-Da Eats"/><h1>Staff Sign In</h1><p>Sign in to open the Square-synchronized service board.</p><form onSubmit={login}><label htmlFor="live-username">Username</label><input id="live-username" type="text" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} autoFocus required/><label htmlFor="live-password">Password</label><input id="live-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="submit" className="live-primary">Open Live Orders</button></form>{error?<div className="live-error"><AlertTriangle size={16}/>{error}</div>:null}</div></section>;

  return <main className="live-board">
    <header className="live-header">
      <div className="live-brand"><img className="live-logo" src="./brand/uff-da-logo-white.webp" alt="Uff-Da Eats"/><div className="live-brand-copy"><h1>LIVE ORDERS</h1><span>{serviceDate.format(new Date())}</span></div></div>
      <div className="live-center-status"><div className={`live-connection ${connection}`} role="status" aria-live="polite"><span className="status-dot"/><div><strong>{connection==='connected'?'Realtime connected':connection==='offline'?'Offline — use backup tickets':'Reconnecting'}</strong><span>{lastUpdated?`Database updated ${elapsed(lastUpdated)} ago`:'Waiting for database update'}</span></div></div><button type="button" className="live-quiet live-icon-tool live-refresh-tool" onClick={sync} disabled={syncing} aria-label={syncing?'Refreshing from Square':'Refresh from Square'} title={syncing?'Refreshing from Square':'Refresh from Square'}><RefreshCw size={17} aria-hidden="true" className={syncing?'is-spinning':''}/></button></div>
      <div className="live-tools"><button type="button" className="live-quiet manage-tool" onClick={()=>setManageOpen(true)}>Manage orders</button><button type="button" className="live-quiet live-labeled-tool" aria-label="Open menu quick view" title="Menu quick view" onClick={()=>setMenuOpen(true)}><BookOpen size={17} aria-hidden="true"/><span>Menu</span></button><KitchenTimers/></div>
    </header>
    {error?<div className="live-banner error" role="alert"><AlertTriangle size={17}/><span>{error}</span></div>:null}
    <QueueNavigator active={active} ready={ready} urgentCount={urgentCount} onJump={jumpToLane} onOpenOrder={openFoundOrder}/>
    <section className="live-workspace">
      <div className="live-workspace-head"><div><h2>Order Queue</h2><p>Ready orders stay first, then active tickets oldest-first.</p></div><div className="live-workspace-stats"><span className="is-ready">Ready <strong>{ready.length}</strong></span><span className="is-active">Active <strong>{active.length}</strong></span>{urgentCount?<span className="is-urgent">Urgent <strong>{urgentCount}</strong></span>:null}</div></div>
      <div className="live-workspace-body">
        <div className="live-workspace-scroll"><div className="unified-order-grid">{working.length?working.map(order=><UnifiedOrderCard key={order.id} order={order} busy={busyId===order.id} onOpen={setSelectedId} onMove={move}/>):<div className="live-empty live-workspace-empty">No open orders. New paid tickets will appear here.</div>}</div></div>
        <aside className="completed-rail"><div className="completed-rail-head"><div><span>History</span><h3>Completed</h3></div><strong>{completed.length}</strong></div><div className="completed-rail-list">{completed.length?completed.slice(0,30).map(order=><CompletedOrderRow key={order.id} order={order} onOpen={setSelectedId}/>):<div className="completed-rail-empty">Completed orders will appear here.</div>}</div></aside>
      </div>
    </section>
    {selectedOrder?<OrderDetail order={selectedOrder} busy={busyId===selectedOrder.id} onClose={closeDetail} onMove={move}/>:null}
    {menuOpen?<MenuQuickReference onClose={closeMenu}/>:null}
    {manageOpen?<OrderManagement orders={orders.filter(order=>order.status==='active'||order.status==='ready')} token={session.accessToken} onClose={closeManage} onChanged={refreshOrders}/>:null}
  </main>;
}
