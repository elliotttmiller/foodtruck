import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { authorizeKiosk, clearLiveSession, ensureSession, fetchLiveOrders, kioskStatus, loadLiveSession, requestSquareSync, setOrderStatus, subscribeToOrders } from '../lib/liveOrders.js';

function elapsed(from){if(!from)return'--:--';const sec=Math.max(0,Math.floor((Date.now()-new Date(from).getTime())/1000));const m=Math.floor(sec/60);return`${m}:${String(sec%60).padStart(2,'0')}`;}
function urgency(order){const age=(Date.now()-new Date(order.source_created_at||order.created_at).getTime())/60000;return age>=8?'overdue':age>=5?'warning':'';}
function itemCount(items=[]){return items.reduce((sum,item)=>sum+Number(item.quantity||1),0);}
function OrderItems({items=[]}){return <div className="live-items">{items.map((item,index)=><div className="live-line" key={item.uid||`${item.name}-${index}`}><div className="live-line-main"><strong>{item.quantity||1} ×</strong><span>{item.name||'Item'}</span></div>{item.variation?<div className="live-modifier">{item.variation}</div>:null}{(item.modifiers||[]).map((modifier,i)=><div className="live-modifier" key={`${modifier}-${i}`}>{modifier}</div>)}{item.note?<div className="live-note">{item.note}</div>:null}</div>)}</div>}

export function LiveOrdersPage(){
  const [session,setSession]=useState(()=>loadLiveSession());
  const [authorized,setAuthorized]=useState(false);
  const [pin,setPin]=useState('');
  const [orders,setOrders]=useState([]);
  const [connection,setConnection]=useState(navigator.onLine?'connecting':'offline');
  const [lastUpdated,setLastUpdated]=useState(null);
  const [error,setError]=useState('');
  const [busyId,setBusyId]=useState('');
  const [syncing,setSyncing]=useState(false);
  const [,tick]=useState(0);
  const sessionRef=useRef(session);
  sessionRef.current=session;

  const load=useCallback(async(token)=>{try{const data=await fetchLiveOrders(token);setOrders(data);setAuthorized(true);setLastUpdated(new Date());setError('');return true;}catch(err){if(err.code==='AUTH'){setAuthorized(false);return false;}setError(err.message);return false;}},[]);

  useEffect(()=>{let cancelled=false;(async()=>{if(!session)return;try{const fresh=await ensureSession(session);if(cancelled)return;if(fresh.accessToken!==session.accessToken)setSession(fresh);if(await kioskStatus(fresh.accessToken))await load(fresh.accessToken);else setAuthorized(false);}catch(err){if(!cancelled){setAuthorized(false);setError(err.message);}}})();return()=>{cancelled=true;};},[session?.accessToken,load]);
  useEffect(()=>{if(!authorized||!session?.accessToken)return;let cancelled=false;const token=session.accessToken;const reconcile=async(windowMinutes)=>{try{await requestSquareSync(token,windowMinutes);if(!cancelled)await load(token);}catch(err){if(!cancelled)setError(`Square reconciliation failed: ${err.message}. Use backup tickets until verified.`);}};const stop=subscribeToOrders(token,()=>load(token),state=>{setConnection(state);if(state==='connected')load(token);});reconcile();const syncTimer=setInterval(()=>reconcile(30),5*60*1000);const poll=setInterval(async()=>{const ok=await load(token);if(!ok)setConnection(navigator.onLine?'reconnecting':'offline');},15000);const timer=setInterval(()=>tick(v=>v+1),1000);return()=>{cancelled=true;stop();clearInterval(syncTimer);clearInterval(poll);clearInterval(timer);};},[authorized,session?.accessToken,load]);
  useEffect(()=>{if(!session)return;const timer=setInterval(async()=>{try{const fresh=await ensureSession(sessionRef.current);if(fresh.accessToken!==sessionRef.current?.accessToken)setSession(fresh);}catch(err){setAuthorized(false);setError(err.message);}},30000);return()=>clearInterval(timer);},[Boolean(session)]);
  useEffect(()=>{const online=()=>{setConnection('connecting');if(sessionRef.current?.accessToken)load(sessionRef.current.accessToken);};const offline=()=>setConnection('offline');addEventListener('online',online);addEventListener('offline',offline);return()=>{removeEventListener('online',online);removeEventListener('offline',offline);};},[load]);

  const login=async event=>{event.preventDefault();setError('');try{const fresh=await ensureSession(session);setSession(fresh);await authorizeKiosk(fresh.accessToken,pin);setPin('');await load(fresh.accessToken);}catch(err){setError(err.message);}};
  const move=async(order,status)=>{setBusyId(order.id);setError('');try{await setOrderStatus(session.accessToken,order.id,status,order.status);await load(session.accessToken);}catch(err){await load(session.accessToken);setError(err.message);}finally{setBusyId('');}};
  const sync=async()=>{setSyncing(true);setError('');try{await requestSquareSync(session.accessToken);await load(session.accessToken);}catch(err){setError(err.message);}finally{setSyncing(false);}};
  const logout=()=>{clearLiveSession();setSession(null);setAuthorized(false);setOrders([]);};

  const active=useMemo(()=>orders.filter(o=>o.status==='active'),[orders]);
  const ready=useMemo(()=>orders.filter(o=>o.status==='ready'),[orders]);

  if(!authorized)return <section className="live-auth"><div className="live-auth-card"><img src="./brand/uff-da-logo-white.webp" alt="Uff-Da Eats"/><h1>Live Orders</h1><p>Enter the truck PIN to open the Square-synchronized service board.</p><form onSubmit={login}><label htmlFor="live-pin">Truck PIN</label><input id="live-pin" type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={e=>setPin(e.target.value)} autoFocus required/><button type="submit" className="live-primary">Open Live Orders</button></form>{error?<div className="live-error"><AlertTriangle size={16}/>{error}</div>:null}</div></section>;

  return <section className="live-board" aria-live="polite">
    <header className="live-header"><img className="live-logo" src="./brand/uff-da-logo-white.webp" alt="Uff-Da Eats"/><div className={`live-connection ${connection}`}><span className="status-dot"/>{connection==='connected'?<Wifi size={16}/>:<WifiOff size={16}/>}<div><strong>{connection==='connected'?'Live board':connection==='offline'?'Offline — use backup tickets':'Reconnecting — check tickets'}</strong><span>{lastUpdated?`Last database update ${elapsed(lastUpdated)} ago`:'Waiting for first update'}</span></div></div><div className="live-tools"><button type="button" className="live-quiet" onClick={sync} disabled={syncing}><RefreshCw size={16} className={syncing?'spin':''}/>{syncing?'Syncing':'Refresh from Square'}</button><button type="button" className="live-quiet" onClick={logout}>Lock</button></div></header>
    {error?<div className="live-banner"><AlertTriangle size={18}/><span>{error}</span></div>:null}
    <div className="live-section-heading"><div><h1>Active Orders <span>{active.length}</span></h1><p>Oldest first. Tap Ready when the full order is complete.</p></div></div>
    <div className="active-grid">{active.length?active.map(order=><article className={`order-card ${urgency(order)}`} key={order.id}><div className="order-top"><div><strong className="ticket">#{order.ticket_number}</strong><h2>{order.customer_name||'Walk-up'}</h2><span>{itemCount(order.items)} {itemCount(order.items)===1?'item':'items'}</span></div><time>{elapsed(order.source_created_at||order.created_at)}</time></div><OrderItems items={order.items}/><button type="button" className="ready-button" disabled={busyId===order.id} onClick={()=>move(order,'ready')}>{busyId===order.id?<RefreshCw className="spin" size={18}/>:null}Ready</button></article>):<div className="live-empty">No active orders.</div>}</div>
    <div className="live-section-heading ready-heading"><div><h1>Ready for Pickup <span>{ready.length}</span></h1><p>Hand out the order, then tap Complete.</p></div></div>
    <div className="ready-grid">{ready.length?ready.map(order=><article className="pickup-card" key={order.id}><div><div className="pickup-ticket"><strong>#{order.ticket_number}</strong><time>Ready {elapsed(order.ready_at)}</time></div><h2>{order.customer_name||'Walk-up'}</h2><span>{itemCount(order.items)} {itemCount(order.items)===1?'item':'items'}</span></div><button type="button" className="complete-button" disabled={busyId===order.id} onClick={()=>move(order,'complete')}><Check size={18}/>Complete</button></article>):<div className="live-empty compact">Nothing waiting for pickup.</div>}</div>
  </section>;
}
