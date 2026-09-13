import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, RefreshCw, X } from 'lucide-react';
import { MenuQuickReference } from '../components/MenuQuickReference.jsx';
import { KitchenTimers } from '../components/KitchenTimers.jsx';
import { OrderManagement } from '../components/OrderManagement.jsx';
import { clearLiveSession, ensureSession, fetchLiveOrders, loadLiveSession, requestSquareSync, setOrderStatus, signInStaff, staffStatus, subscribeToOrders } from '../lib/liveOrders.js';
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
  const received=order.source_created_at||order.created_at;
  return <div className="order-dialog-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <section className={`order-dialog ${isActive?'':'is-ready'}`} role="dialog" aria-modal="true" aria-labelledby="order-dialog-title" ref={dialogRef}>
      <div className="order-dialog-header"><div className="order-dialog-top"><span className="order-dialog-state">{isActive?'ACTIVE ORDER':'READY FOR PICKUP'}</span><button className="order-dialog-x" type="button" aria-label="Close order details" onClick={onClose} ref={closeRef}><X size={22}/></button></div><div className="order-dialog-heading"><h2 id="order-dialog-title">#{order.ticket_number} <span>{order.customer_name||'Walk-up'}</span></h2><time dateTime={received}>{elapsed(received)}</time></div><p>Received {received?serviceTime.format(new Date(received)):'—'} <span aria-hidden="true">·</span> {itemCount(order.items)} {itemCount(order.items)===1?'item':'items'}</p></div>
      <div className="order-dialog-items">{(order.items||[]).map((item,index)=><div className="order-dialog-line" key={item.uid||`${item.name}-${index}`}><strong className="order-dialog-quantity">{item.quantity||1} ×</strong><div><h3>{item.name||'Item'}</h3>{item.variation?<p>{item.variation}</p>:null}{(item.modifiers||[]).map((modifier,i)=><p key={`${modifier}-${i}`}>{modifier}</p>)}{item.note?<p className="order-dialog-note">{item.note}</p>:null}</div></div>)}</div>
      <div className="order-dialog-footer"><button className="order-dialog-close" type="button" onClick={onClose}>Close</button><button className={isActive?'ready-button':'complete-button'} type="button" disabled={busy} onClick={()=>onMove(order,isActive?'ready':'complete')}>{busy?'Updating…':isActive?'Mark Ready':'Complete Order'}</button></div>
    </section>
  </div>;
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
  useEffect(()=>{if(!authorized||!session?.accessToken)return;let cancelled=false;const token=session.accessToken;const reconcile=async(windowMinutes)=>{try{await requestSquareSync(token,windowMinutes);if(!cancelled)await load(token);}catch(err){if(!cancelled)setError(`Square reconciliation failed: ${err.message}. Use backup tickets until verified.`);}};const stop=subscribeToOrders(token,()=>load(token),state=>{setConnection(state);if(state==='connected')load(token);});reconcile();const syncTimer=setInterval(()=>reconcile(30),5*60*1000);const poll=setInterval(async()=>{const ok=await load(token);if(!ok)setConnection(navigator.onLine?'reconnecting':'offline');},15000);const timer=setInterval(()=>tick(v=>v+1),1000);return()=>{cancelled=true;stop();clearInterval(syncTimer);clearInterval(poll);clearInterval(timer);};},[authorized,session?.accessToken,load]);
  useEffect(()=>{if(!session)return;const timer=setInterval(async()=>{try{const fresh=await ensureSession(sessionRef.current);if(fresh.accessToken!==sessionRef.current?.accessToken)setSession(fresh);}catch(err){setAuthorized(false);setError(err.message);}},30000);return()=>clearInterval(timer);},[Boolean(session)]);
  useEffect(()=>{const online=()=>{setConnection('connecting');if(sessionRef.current?.accessToken)load(sessionRef.current.accessToken);};const offline=()=>setConnection('offline');addEventListener('online',online);addEventListener('offline',offline);return()=>{removeEventListener('online',online);removeEventListener('offline',offline);};},[load]);

  const login=async event=>{event.preventDefault();setError('');try{const fresh=await signInStaff(username,password);setPassword('');setSession(fresh);await load(fresh.accessToken);}catch(err){setError(err.message);}};
  const move=async(order,status)=>{setBusyId(order.id);setError('');try{await setOrderStatus(session.accessToken,order.id,status,order.status);setSelectedId(null);await load(session.accessToken);}catch(err){await load(session.accessToken);setError(err.message);}finally{setBusyId('');}};
  const sync=async()=>{setSyncing(true);setError('');try{await requestSquareSync(session.accessToken);await load(session.accessToken);}catch(err){setError(err.message);}finally{setSyncing(false);}};

  const active=useMemo(()=>orders.filter(o=>o.status==='active'),[orders]);
  const ready=useMemo(()=>orders.filter(o=>o.status==='ready'),[orders]);
  const selectedOrder=orders.find(order=>order.id===selectedId);
  const closeDetail=useCallback(()=>setSelectedId(null),[]);
  const closeMenu=useCallback(()=>setMenuOpen(false),[]);
  const closeManage=useCallback(()=>setManageOpen(false),[]);
  const refreshOrders=useCallback(()=>load(sessionRef.current.accessToken),[load]);
  useEffect(()=>{if(selectedId&&!selectedOrder)setSelectedId(null);},[selectedId,selectedOrder]);

  if(!authorized)return <section className="live-auth"><div className="live-auth-card"><img src="./brand/uff-da-logo-white.webp" alt="Uff-Da Eats"/><h1>Staff Sign In</h1><p>Sign in to open the Square-synchronized service board.</p><form onSubmit={login}><label htmlFor="live-username">Username</label><input id="live-username" type="text" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} autoFocus required/><label htmlFor="live-password">Password</label><input id="live-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="submit" className="live-primary">Open Live Orders</button></form>{error?<div className="live-error"><AlertTriangle size={16}/>{error}</div>:null}</div></section>;

  return <main className="live-board">
    <header className="live-header">
      <div className="live-brand"><img className="live-logo" src="./brand/uff-da-logo-white.webp" alt="Uff-Da Eats"/><div className="live-brand-copy"><h1>LIVE ORDERS</h1><span>{serviceDate.format(new Date())}</span></div></div>
      <div className={`live-connection ${connection}`} role="status" aria-live="polite"><span className="status-dot"/><div><strong>{connection==='connected'?'Realtime connected':connection==='offline'?'Offline — use backup tickets':'Reconnecting'}</strong><span>{lastUpdated?`Database updated ${elapsed(lastUpdated)} ago`:'Waiting for database update'}</span></div></div>
      <div className="live-tools"><button type="button" className="live-quiet manage-tool" onClick={()=>setManageOpen(true)}>Manage orders</button><button type="button" className="live-quiet live-icon-tool" onClick={sync} disabled={syncing} aria-label={syncing?'Refreshing from Square':'Refresh from Square'} title={syncing?'Refreshing from Square':'Refresh from Square'}><RefreshCw size={18} aria-hidden="true" className={syncing?'is-spinning':''}/></button><button type="button" className="live-quiet live-icon-tool" aria-label="Open menu quick view" title="Menu quick view" onClick={()=>setMenuOpen(true)}><BookOpen size={18} aria-hidden="true"/></button><KitchenTimers/></div>
    </header>
    {error?<div className="live-banner error" role="alert"><AlertTriangle size={17}/><span>{error}</span></div>:null}
    <div className="live-lanes">
      <section className="live-lane active-lane" aria-labelledby="active-title"><div className="live-section-heading"><div><h2 id="active-title">Active Orders <span>{active.length}</span></h2><p>Oldest first. Select a ticket for details; mark Ready when finished.</p></div></div>
        <div className="live-lane-scroll"><div className="active-grid">{active.length?active.map(order=>{const urgency=orderUrgency(order);return <article className={`order-card ${urgency}`} key={order.id}><button className="order-card-open" type="button" onClick={()=>setSelectedId(order.id)} aria-label={`View full order #${order.ticket_number} for ${order.customer_name||'Walk-up'}${urgency==='overdue'?', urgent':''}`}><div className="order-top"><div><strong className="ticket">#{order.ticket_number}</strong><h3>{order.customer_name||'Walk-up'}</h3><span>{itemCount(order.items)} {itemCount(order.items)===1?'item':'items'}</span></div><div className="order-top-actions"><time dateTime={order.source_created_at||order.created_at}>{urgency==='overdue'?<span className="order-urgency-label">Urgent</span>:null}{elapsed(order.source_created_at||order.created_at)}</time></div></div><OrderItems items={order.items}/></button><button type="button" className="ready-button" disabled={busyId===order.id} onClick={()=>move(order,'ready')}>{busyId===order.id?'Updating…':'Mark Ready'}</button></article>}):<div className="live-empty">No active orders. New paid tickets will appear here.</div>}</div></div>
      </section>
      <section className="live-lane ready-lane" aria-labelledby="ready-title"><div className="live-section-heading"><div><h2 id="ready-title">Ready for Pickup <span>{ready.length}</span></h2><p>Select for details; complete after pickup.</p></div></div>
        <div className="live-lane-scroll"><div className="ready-grid">{ready.length?ready.map(order=><article className="pickup-card" key={order.id}><button className="pickup-card-open" type="button" onClick={()=>setSelectedId(order.id)} aria-label={`View full order #${order.ticket_number} for ${order.customer_name||'Walk-up'}`}><div className="pickup-ticket"><strong>#{order.ticket_number}</strong><time dateTime={order.ready_at||undefined}>Ready {elapsed(order.ready_at)}</time></div><h3>{order.customer_name||'Walk-up'}</h3><div className="pickup-summary">{order.items?.length?order.items.map((item,index)=><span key={item.uid||`${item.name}-${index}`}>{item.quantity||1} × {item.name||'Item'}</span>):<span>{itemCount(order.items)} items</span>}</div></button><button type="button" className="complete-button" disabled={busyId===order.id} onClick={()=>move(order,'complete')}>{busyId===order.id?'Updating…':'Complete'}</button></article>):<div className="live-empty compact">Nothing waiting for pickup.</div>}</div></div>
      </section>
    </div>
    {selectedOrder?<OrderDetail order={selectedOrder} busy={busyId===selectedOrder.id} onClose={closeDetail} onMove={move}/>:null}
    {menuOpen?<MenuQuickReference onClose={closeMenu}/>:null}
    {manageOpen?<OrderManagement orders={orders} token={session.accessToken} onClose={closeManage} onChanged={refreshOrders}/>:null}
  </main>;
}
