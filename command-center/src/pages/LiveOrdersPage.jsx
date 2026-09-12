import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { clearLiveSession, ensureSession, fetchLiveOrders, loadLiveSession, requestSquareSync, setOrderStatus, signInStaff, signOutStaff, staffStatus, subscribeToOrders } from '../lib/liveOrders.js';

function elapsed(from){if(!from)return'--:--';const sec=Math.max(0,Math.floor((Date.now()-new Date(from).getTime())/1000));const m=Math.floor(sec/60);return`${m}:${String(sec%60).padStart(2,'0')}`;}
function urgency(order){const age=(Date.now()-new Date(order.source_created_at||order.created_at).getTime())/60000;return age>=8?'overdue':age>=5?'warning':'';}
function itemCount(items=[]){return items.reduce((sum,item)=>sum+Number(item.quantity||1),0);}
function OrderItems({items=[]}){return <div className="live-items">{items.map((item,index)=><div className="live-line" key={item.uid||`${item.name}-${index}`}><div className="live-line-main"><strong>{item.quantity||1} ×</strong><span>{item.name||'Item'}</span></div>{item.variation?<div className="live-modifier">{item.variation}</div>:null}{(item.modifiers||[]).map((modifier,i)=><div className="live-modifier" key={`${modifier}-${i}`}>{modifier}</div>)}{item.note?<div className="live-note">{item.note}</div>:null}</div>)}</div>}

// Preview tickets never touch Supabase or Square. They exist in browser memory only.
function previewOrder(number, status='active') { const now=new Date().toISOString(); return {id:`preview-${number}`,ticket_number:number,customer_name:number===42?'MIKE':number===43?'SARAH':'GUEST',status,created_at:now,source_created_at:now,ready_at:status==='ready'?now:null,items:number===42?[{name:'DOUBLE SMASH',quantity:2,modifiers:['NO ONION']},{name:'LOADED FRIES',quantity:1,note:'Extra sauce on side'}]:[{name:'SMASH BURGER',quantity:1,modifiers:['ADD CHEESE']},{name:'WINGS',quantity:1,variation:'Garlic Parmesan'}]}; }

export function LiveOrdersPage({demo=false}){
  const [session,setSession]=useState(()=>demo?null:loadLiveSession());
  const [authorized,setAuthorized]=useState(demo);
  const [username,setUsername]=useState('staff');
  const [password,setPassword]=useState('');
  const [orders,setOrders]=useState(()=>demo?[previewOrder(42),previewOrder(43,'ready')]:[]);
  const [connection,setConnection]=useState(demo?'connected':navigator.onLine?'connecting':'offline');
  const [lastUpdated,setLastUpdated]=useState(null);
  const [error,setError]=useState('');
  const [busyId,setBusyId]=useState('');
  const [syncing,setSyncing]=useState(false);
  const [,tick]=useState(0);
  const sessionRef=useRef(session);
  const nextPreview=useRef(44);
  sessionRef.current=session;

  const load=useCallback(async(token)=>{try{const data=await fetchLiveOrders(token);setOrders(data);setAuthorized(true);setLastUpdated(new Date());setError('');return true;}catch(err){if(err.code==='AUTH'){setAuthorized(false);return false;}setError(err.message);return false;}},[]);

  useEffect(()=>{if(demo)return;let cancelled=false;(async()=>{if(!session)return;try{const fresh=await ensureSession(session);if(cancelled)return;if(fresh.accessToken!==session.accessToken)setSession(fresh);if(await staffStatus(fresh.accessToken))await load(fresh.accessToken);else{clearLiveSession();setSession(null);setAuthorized(false);}}catch(err){if(!cancelled){setAuthorized(false);setError(err.message);}}})();return()=>{cancelled=true;};},[demo,session?.accessToken,load]);
  useEffect(()=>{if(demo||!authorized||!session?.accessToken)return;let cancelled=false;const token=session.accessToken;const reconcile=async(windowMinutes)=>{try{await requestSquareSync(token,windowMinutes);if(!cancelled)await load(token);}catch(err){if(!cancelled)setError(`Square reconciliation failed: ${err.message}. Use backup tickets until verified.`);}};const stop=subscribeToOrders(token,()=>load(token),state=>{setConnection(state);if(state==='connected')load(token);});reconcile();const syncTimer=setInterval(()=>reconcile(30),5*60*1000);const poll=setInterval(async()=>{const ok=await load(token);if(!ok)setConnection(navigator.onLine?'reconnecting':'offline');},15000);const timer=setInterval(()=>tick(v=>v+1),1000);return()=>{cancelled=true;stop();clearInterval(syncTimer);clearInterval(poll);clearInterval(timer);};},[demo,authorized,session?.accessToken,load]);
  useEffect(()=>{if(demo||!session)return;const timer=setInterval(async()=>{try{const fresh=await ensureSession(sessionRef.current);if(fresh.accessToken!==sessionRef.current?.accessToken)setSession(fresh);}catch(err){setAuthorized(false);setError(err.message);}},30000);return()=>clearInterval(timer);},[demo,Boolean(session)]);
  useEffect(()=>{if(demo)return;const online=()=>{setConnection('connecting');if(sessionRef.current?.accessToken)load(sessionRef.current.accessToken);};const offline=()=>setConnection('offline');addEventListener('online',online);addEventListener('offline',offline);return()=>{removeEventListener('online',online);removeEventListener('offline',offline);};},[demo,load]);
  useEffect(()=>{if(!demo)return;const timer=setInterval(()=>tick(v=>v+1),1000);return()=>clearInterval(timer);},[demo]);

  const login=async event=>{event.preventDefault();setError('');try{const fresh=await signInStaff(username,password);setPassword('');setSession(fresh);await load(fresh.accessToken);}catch(err){setError(err.message);}};
  const move=async(order,status)=>{if(demo){setOrders(current=>current.map(item=>item.id===order.id?{...item,status,ready_at:status==='ready'?new Date().toISOString():item.ready_at}:item));return;}setBusyId(order.id);setError('');try{await setOrderStatus(session.accessToken,order.id,status,order.status);await load(session.accessToken);}catch(err){await load(session.accessToken);setError(err.message);}finally{setBusyId('');}};
  const sync=async()=>{if(demo){setOrders(current=>[...current,previewOrder(nextPreview.current++)]);return;}setSyncing(true);setError('');try{await requestSquareSync(session.accessToken);await load(session.accessToken);}catch(err){setError(err.message);}finally{setSyncing(false);}};
  const logout=()=>{if(demo){location.hash='#/live-orders';return;}const current=session;setSession(null);setAuthorized(false);setOrders([]);clearLiveSession();if(current)signOutStaff(current).catch(()=>{});};

  const active=useMemo(()=>orders.filter(o=>o.status==='active'),[orders]);
  const ready=useMemo(()=>orders.filter(o=>o.status==='ready'),[orders]);

  if(!authorized)return <section className="live-auth"><div className="live-auth-card"><img src="./brand/uff-da-logo-white.webp" alt="Uff-Da Eats"/><h1>Staff Sign In</h1><p>Sign in to open the Square-synchronized service board.</p><form onSubmit={login}><label htmlFor="live-username">Username</label><input id="live-username" type="text" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} autoFocus required/><label htmlFor="live-password">Password</label><input id="live-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="submit" className="live-primary">Open Live Orders</button></form><a href="#/live-orders-demo">Preview sample orders</a>{error?<div className="live-error"><AlertTriangle size={16}/>{error}</div>:null}</div></section>;

  return <section className="live-board" aria-live="polite">
    <header className="live-header"><img className="live-logo" src="./brand/uff-da-logo-white.webp" alt="Uff-Da Eats"/><div className={`live-connection ${connection}`}><span className="status-dot"/>{demo?<Check size={16}/>:connection==='connected'?<Wifi size={16}/>:<WifiOff size={16}/>}<div><strong>{demo?'Preview only':connection==='connected'?'Live board':connection==='offline'?'Offline — use backup tickets':'Reconnecting — check tickets'}</strong><span>{demo?'Sample tickets · no Square connection':lastUpdated?`Last database update ${elapsed(lastUpdated)} ago`:'Waiting for first update'}</span></div></div><div className="live-tools">{!demo?<a className="live-quiet" href="#/live-orders-demo">Preview sample orders</a>:null}<button type="button" className="live-quiet" onClick={sync} disabled={syncing}><RefreshCw size={16} className={syncing?'spin':''}/>{demo?'Add test order':syncing?'Syncing':'Refresh from Square'}</button><button type="button" className="live-quiet" onClick={logout}>{demo?'Exit preview':'Lock'}</button></div></header>
    {demo?<div className="live-banner" role="status"><AlertTriangle size={18}/><span>PREVIEW ONLY — Sample tickets stay in this browser tab. They are not Square sales and are never saved.</span></div>:null}
    {error?<div className="live-banner"><AlertTriangle size={18}/><span>{error}</span></div>:null}
    <div className="live-section-heading"><div><h1>Active Orders <span>{active.length}</span></h1><p>Oldest first. Tap Ready when the full order is complete.</p></div></div>
    <div className="active-grid">{active.length?active.map(order=><article className={`order-card ${urgency(order)}`} key={order.id}><div className="order-top"><div><strong className="ticket">#{order.ticket_number}</strong><h2>{order.customer_name||'Walk-up'}</h2><span>{itemCount(order.items)} {itemCount(order.items)===1?'item':'items'}</span></div><time>{elapsed(order.source_created_at||order.created_at)}</time></div><OrderItems items={order.items}/><button type="button" className="ready-button" disabled={busyId===order.id} onClick={()=>move(order,'ready')}>{busyId===order.id?<RefreshCw className="spin" size={18}/>:null}Ready</button></article>):<div className="live-empty">No active orders.</div>}</div>
    <div className="live-section-heading ready-heading"><div><h1>Ready for Pickup <span>{ready.length}</span></h1><p>Hand out the order, then tap Complete.</p></div></div>
    <div className="ready-grid">{ready.length?ready.map(order=><article className="pickup-card" key={order.id}><div><div className="pickup-ticket"><strong>#{order.ticket_number}</strong><time>Ready {elapsed(order.ready_at)}</time></div><h2>{order.customer_name||'Walk-up'}</h2><span>{itemCount(order.items)} {itemCount(order.items)===1?'item':'items'}</span></div><button type="button" className="complete-button" disabled={busyId===order.id} onClick={()=>move(order,'complete')}><Check size={18}/>Complete</button></article>):<div className="live-empty compact">Nothing waiting for pickup.</div>}</div>
  </section>;
}
