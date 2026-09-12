const units={minutes:60000,hours:3600000,days:86400000};

export function ordersOlderThan(orders,amount,unit,now=Date.now()){
  const duration=Number(amount)*units[unit];
  if(!Number.isFinite(duration)||duration<=0)return [];
  return orders.filter(order=>{
    const time=Date.parse(order.source_created_at||order.created_at||'');
    return Number.isFinite(time)&&time<=now-duration;
  });
}
