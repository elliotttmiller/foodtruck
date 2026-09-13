export const ORDER_WARNING_MINUTES=5;
export const ORDER_OVERDUE_MINUTES=10;

export function orderUrgency(order,now=Date.now()){
  const createdAt=Date.parse(order?.source_created_at||order?.created_at||'');
  if(!Number.isFinite(createdAt))return '';
  const ageMinutes=(now-createdAt)/60000;
  if(ageMinutes>=ORDER_OVERDUE_MINUTES)return'overdue';
  if(ageMinutes>=ORDER_WARNING_MINUTES)return'warning';
  return'';
}
