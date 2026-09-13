import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { findOrders } from '../lib/orderSearch.js';

function resultSummary(order){const names=(order.items||[]).slice(0,2).map(item=>item.name).filter(Boolean);return names.length?names.join(' · '):order.status==='ready'?'Ready for pickup':'Active order';}

export function QueueNavigator({active,ready,urgentCount,onJump,onOpenOrder}){
  const [query,setQuery]=useState('');
  const [highlighted,setHighlighted]=useState(0);
  const root=useRef(null);
  const input=useRef(null);
  const listId=useId();
  const all=useMemo(()=>[...active,...ready],[active,ready]);
  const results=useMemo(()=>findOrders(all,query),[all,query]);
  useEffect(()=>setHighlighted(0),[query]);
  useEffect(()=>{if(!query)return;const outside=event=>{if(!root.current?.contains(event.target))setQuery('');};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[query]);
  const choose=order=>{setQuery('');onOpenOrder(order);};
  const keyDown=event=>{if(event.key==='Escape'){event.preventDefault();setQuery('');return;}if(!results.length)return;if(event.key==='ArrowDown'){event.preventDefault();setHighlighted(index=>(index+1)%results.length);}else if(event.key==='ArrowUp'){event.preventDefault();setHighlighted(index=>(index-1+results.length)%results.length);}else if(event.key==='Enter'){event.preventDefault();choose(results[highlighted]);}};
  return <nav className="queue-navigator" aria-label="Order queue navigation">
    <div className="queue-lane-links"><button type="button" className="queue-lane-link is-active" onClick={()=>onJump('active')}><span>Active</span><strong>{active.length}</strong>{urgentCount?<em>{urgentCount} urgent</em>:null}</button><button type="button" className="queue-lane-link is-ready" onClick={()=>onJump('ready')}><span>Ready</span><strong>{ready.length}</strong></button></div>
    <div className="queue-finder" ref={root}><Search size={16} aria-hidden="true"/><input ref={input} type="search" value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={keyDown} role="combobox" aria-label="Find an order" aria-controls={listId} aria-expanded={Boolean(query)} aria-activedescendant={results.length?`${listId}-${highlighted}`:undefined} autoComplete="off" placeholder="Find ticket, customer, or item"/>{query?<button type="button" className="queue-search-clear" onClick={()=>{setQuery('');input.current?.focus();}} aria-label="Clear order search"><X size={15} aria-hidden="true"/></button>:<span className="queue-search-hint">Press /</span>}{query?<div className="queue-search-results" id={listId} role="listbox" aria-label="Matching orders">{results.length?results.map((order,index)=><button id={`${listId}-${index}`} role="option" aria-selected={index===highlighted} className={index===highlighted?'is-highlighted':''} type="button" key={order.id} onPointerMove={()=>setHighlighted(index)} onClick={()=>choose(order)}><strong>#{order.ticket_number}</strong><span>{order.customer_name||'Walk-up'}</span><small>{resultSummary(order)}</small><em className={order.status}>{order.status==='ready'?'Ready':'Active'}</em></button>):<p>No matching orders</p>}</div>:null}</div>
    <span className="queue-ordering">Oldest tickets first</span>
  </nav>;
}
