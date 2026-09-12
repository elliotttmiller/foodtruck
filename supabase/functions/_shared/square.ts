export const SQUARE_VERSION='2026-08-19';

export type NormalizedOrder={square_order_id:string;square_payment_id:string|null;location_id:string|null;customer_name:string|null;square_state:string|null;payment_status:string|null;total_cents:number;currency:string;items:Array<{uid:string|null;name:string;variation:string|null;quantity:number;modifiers:string[];note:string|null}>;raw_order:unknown;source_created_at:string|null;last_square_event_at:string};

export function normalizeSquareOrder(order:any,payment:any=null):NormalizedOrder{
  const recipient=order?.fulfillments?.map((f:any)=>f?.pickup_details?.recipient||f?.delivery_details?.recipient||f?.shipment_details?.recipient).find(Boolean);
  const items=(order?.line_items||[]).map((line:any)=>({
    uid:line.uid||null,
    name:line.name||'Item',
    variation:line.variation_name||null,
    quantity:Number.parseFloat(line.quantity||'1')||1,
    modifiers:(line.modifiers||[]).map((m:any)=>m.name).filter(Boolean),
    note:line.note||null,
  }));
  return{
    square_order_id:order.id,
    square_payment_id:payment?.id||null,
    location_id:order.location_id||payment?.location_id||null,
    customer_name:order.ticket_name||recipient?.display_name||null,
    square_state:order.state||null,
    payment_status:payment?.status||null,
    total_cents:Number(order?.total_money?.amount||payment?.total_money?.amount||0),
    currency:order?.total_money?.currency||payment?.total_money?.currency||'USD',
    items,
    raw_order:order,
    source_created_at:order.created_at||payment?.created_at||null,
    last_square_event_at:new Date().toISOString(),
  };
}

export async function squareFetch(path:string,init:RequestInit={}){
  const token=Deno.env.get('SQUARE_ACCESS_TOKEN');
  if(!token)throw new Error('SQUARE_ACCESS_TOKEN is not configured');
  const response=await fetch(`https://connect.squareup.com${path}`,{...init,headers:{Authorization:`Bearer ${token}`,'Square-Version':SQUARE_VERSION,'Content-Type':'application/json',...(init.headers||{})}});
  const json=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(`Square ${response.status}: ${json?.errors?.[0]?.detail||'request failed'}`);
  return json;
}

function decodeBase64(value:string){const raw=atob(value);return Uint8Array.from(raw,c=>c.charCodeAt(0));}
function timingSafeEqual(a:Uint8Array,b:Uint8Array){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;}
export async function verifySquareSignature(rawBody:string,signature:string|null){
  const key=Deno.env.get('SQUARE_WEBHOOK_SIGNATURE_KEY');
  const notificationUrl=Deno.env.get('SQUARE_WEBHOOK_NOTIFICATION_URL');
  if(!key||!notificationUrl||!signature)return false;
  const cryptoKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signed=new Uint8Array(await crypto.subtle.sign('HMAC',cryptoKey,new TextEncoder().encode(notificationUrl+rawBody)));
  let supplied:Uint8Array;try{supplied=decodeBase64(signature);}catch{return false;}
  return timingSafeEqual(signed,supplied);
}
