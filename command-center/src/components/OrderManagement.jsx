import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { clearOrders, fetchClearedOrders, setOrderStatus } from '../lib/liveOrders.js';
import { ordersOlderThan } from '../lib/orderClearing.js';

function ManageSelect({label,value,options,onChange,disabled=false}){
  const [open,setOpen]=useState(false);
  const root=useRef(null);
  const trigger=useRef(null);
  const optionRefs=useRef([]);
  const labelId=useId();
  const selectedIndex=Math.max(0,options.findIndex(option=>option.value===value));
  useEffect(()=>{if(!open)return;optionRefs.current[selectedIndex]?.focus();const outside=event=>{if(!root.current?.contains(event.target))setOpen(false);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[open,selectedIndex]);
  const choose=next=>{onChange(next);setOpen(false);requestAnimationFrame(()=>trigger.current?.focus());};
  const keyDown=event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);trigger.current?.focus();return;}
    if(event.key==='Tab'){setOpen(false);return;}
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    event.preventDefault();
    if(!open){setOpen(true);return;}
    const focused=optionRefs.current.indexOf(document.activeElement);
    const next=event.key==='Home'?0:event.key==='End'?options.length-1:event.key==='ArrowDown'?Math.min(options.length-1,focused+1):Math.max(0,focused-1);
    optionRefs.current[next]?.focus();
  };
  return <div className={`manage-field manage-select ${open?'is-open':''}`} ref={root} onKeyDown={keyDown}>
    <span id={labelId}>{label}</span>
    <button ref={trigger} type="button" className="manage-select-trigger" aria-labelledby={labelId} aria-haspopup="listbox" aria-expanded={open} disabled={disabled} onClick={()=>setOpen(current=>!current)}><strong>{options[selectedIndex]?.label}</strong><ChevronDown size={16} aria-hidden="true"/></button>
    {open?<div className="manage-select-menu" role="listbox" aria-labelledby={labelId}>{options.map((option,index)=><button key={option.value} ref={element=>{optionRefs.current[index]=element;}} type="button" role="option" aria-selected={option.value===value} className={option.value===value?'is-selected':''} onClick={()=>choose(option.value)}>{option.label}</button>)}</div>:null}
  </div>;
}

const scopeOptions=[{value:'both',label:'Active and ready'},{value:'active',label:'Active only'},{value:'ready',label:'Ready only'}];
const modeOptions=[{value:'older',label:'Older than'},{value:'all',label:'All visible tickets'}];
const unitOptions=[{value:'minutes',label:'Minutes'},{value:'hours',label:'Hours'},{value:'days',label:'Days'}];

export function OrderManagement({orders,token,onClose,onChanged}){
  const [mode,setMode]=useState('older');
  const [amount,setAmount]=useState(2);
  const [unit,setUnit]=useState('hours');
  const [scope,setScope]=useState('both');
  const [confirm,setConfirm]=useState(false);
  const [reviewed,setReviewed]=useState([]);
  const [busy,setBusy]=useState(false);
  const [recent,setRecent]=useState([]);
  const [message,setMessage]=useState('');
  const dialog=useRef(null);
  const close=useRef(null);
  const now=useRef(Date.now());
  const eligible=useMemo(()=>{const inScope=orders.filter(o=>scope==='both'||o.status===scope);return mode==='all'?inScope:ordersOlderThan(inScope,amount,unit,now.current);},[orders,scope,mode,amount,unit]);
  const refresh=async()=>{try{setRecent(await fetchClearedOrders(token));}catch(err){setMessage(err.message);}};
  useEffect(()=>{refresh();},[token]);
  useEffect(()=>{const previous=document.activeElement;close.current?.focus();return()=>previous?.focus?.();},[]);
  useEffect(()=>{const key=event=>{if(event.key==='Escape'){event.preventDefault();if(confirm)setConfirm(false);else if(!busy)onClose();}if(event.key==='Tab'){const controls=[...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled)')];const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[onClose,confirm,busy]);
  const clear=async()=>{setBusy(true);setMessage('');try{const count=await clearOrders(token,reviewed);setConfirm(false);setMessage(`${count} ${count===1?'ticket':'tickets'} cleared from the board.${count<reviewed.length?' Some tickets changed on another device.':''}`);await Promise.all([onChanged(),refresh()]);}catch(err){setMessage(`${err.message}${err.cleared?` ${err.cleared} tickets cleared before the error.`:''} Refresh the board and review the remaining tickets.`);await onChanged();await refresh();}finally{setBusy(false);}};
  const restore=async order=>{setBusy(true);setMessage('');try{await setOrderStatus(token,order.id,order.cleared_from_status,'cleared');setMessage(`Ticket #${order.ticket_number} returned to ${order.cleared_from_status}.`);await Promise.all([onChanged(),refresh()]);}catch(err){setMessage(err.message);await refresh();}finally{setBusy(false);}};
  return <div className="order-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}><section className="manage-dialog" role="dialog" aria-modal="true" aria-labelledby="manage-title" ref={dialog}>
    <header><div><span className="manage-eyebrow">BOARD TOOLS</span><h2 id="manage-title">Manage orders</h2></div><button type="button" className="order-dialog-x" onClick={onClose} disabled={busy} aria-label="Close order management" ref={close}>×</button></header>
    <div className="manage-body"><p className="manage-intro">Clear tickets from the working board without deleting their records or marking them complete. This updates every connected screen.</p>
      <div className="manage-options"><ManageSelect label="Which orders" value={scope} options={scopeOptions} disabled={busy||confirm} onChange={value=>{setScope(value);setConfirm(false);}}/><ManageSelect label="Clear" value={mode} options={modeOptions} disabled={busy||confirm} onChange={value=>{setMode(value);setConfirm(false);}}/>{mode==='older'?<div className="manage-age"><label><span>Age</span><input type="number" min="1" max="10080" value={amount} disabled={busy||confirm} onChange={e=>{setAmount(e.target.value);setConfirm(false);}}/></label><ManageSelect label="Unit" value={unit} options={unitOptions} disabled={busy||confirm} onChange={value=>{setUnit(value);setConfirm(false);}}/></div>:null}</div>
      <div className="manage-review"><strong>{eligible.length} {eligible.length===1?'ticket':'tickets'} selected</strong><span>{eligible.length?eligible.slice(0,12).map(o=>`#${o.ticket_number}`).join(' · ')+(eligible.length>12?' · …':''):'No matching tickets on the board.'}</span></div>
      {confirm?<div className="manage-confirm" role="group" aria-label="Confirm clearing tickets"><strong>Clear {reviewed.length} {reviewed.length===1?'ticket':'tickets'}?</strong><p>They will disappear from all live boards. They will remain in order history and can be restored below. Square is unaffected.</p><div><button type="button" className="live-quiet" onClick={()=>setConfirm(false)} disabled={busy}>Cancel</button><button type="button" className="manage-danger" disabled={busy} onClick={clear}>{busy?'Clearing…':`Clear ${reviewed.length} ${reviewed.length===1?'ticket':'tickets'}`}</button></div></div>:<button type="button" className="manage-danger" disabled={!eligible.length||busy} onClick={()=>{setReviewed(eligible);setConfirm(true);}}>Review clear</button>}
      {message?<p className="manage-message" role="status">{message}</p>:null}
      <div className="manage-history"><h3>Recently cleared</h3><p>Restore a ticket to its previous lane if it was cleared by mistake.</p><div className="manage-history-list">{recent.length?recent.map(o=><div className="manage-history-row" key={o.id}><div><strong>#{o.ticket_number} · {o.customer_name||'Walk-up'}</strong><small>{o.cleared_at?new Date(o.cleared_at).toLocaleString():''} · {o.cleared_from_status}</small></div><button type="button" disabled={busy||!o.cleared_from_status} className="live-quiet" onClick={()=>restore(o)}>Restore</button></div>):<div className="manage-history-empty">No recently cleared tickets.</div>}</div></div>
    </div></section></div>;
}
