export function orderSearchText(order){
  const items=(order.items||[]).flatMap(item=>[item.name,item.variation,item.note,...(item.modifiers||[])]);
  return [order.ticket_number,order.customer_name,order.status,...items].filter(Boolean).join(' ').toLocaleLowerCase();
}

export function findOrders(orders,query,limit=8){
  const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if(!terms.length)return[];
  return orders.filter(order=>{const text=orderSearchText(order);return terms.every(term=>text.includes(term.replace(/^#/u,'')));}).slice(0,limit);
}
