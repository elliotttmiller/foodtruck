import { existingOrder, rest, serviceHeaders, upsertNormalizedOrder } from '../_shared/db.ts';
import { normalizeSquareOrder, squareFetch, verifySquareSignature } from '../_shared/square.ts';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});

Deno.serve(async request=>{
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  const rawBody=await request.text();
  const signature=request.headers.get('x-square-hmacsha256-signature');
  if(!(await verifySquareSignature(rawBody,signature)))return json({error:'Invalid signature'},403);
  let event:any;try{event=JSON.parse(rawBody);}catch{return json({error:'Invalid JSON'},400);}
  if(!event?.event_id||!event?.type)return json({error:'Malformed Square event'},400);

  const duplicate=await rest(`processed_square_events?event_id=eq.${encodeURIComponent(event.event_id)}&select=event_id&limit=1`);
  if(duplicate?.length)return json({ok:true,duplicate:true});

  let orderId:string|null=null;
  let payment:any=null;
  if(event.type==='payment.created'||event.type==='payment.updated'){
    payment=event?.data?.object?.payment||null;
    orderId=payment?.order_id||null;
    if(!orderId){
      await rest('processed_square_events',{method:'POST',headers:serviceHeaders({Prefer:'return=minimal'}),body:JSON.stringify({event_id:event.event_id,event_type:event.type,square_order_id:null})});
      return json({ok:true,ignored:'payment without order_id'});
    }
    if(payment?.status!=='COMPLETED'){
      await rest('processed_square_events',{method:'POST',headers:serviceHeaders({Prefer:'return=minimal'}),body:JSON.stringify({event_id:event.event_id,event_type:event.type,square_order_id:orderId})});
      return json({ok:true,ignored:`payment status ${payment?.status||'unknown'}`});
    }
  }else if(event.type==='order.updated'){
    orderId=event?.data?.object?.order_updated?.order_id||null;
  }else{
    await rest('processed_square_events',{method:'POST',headers:serviceHeaders({Prefer:'return=minimal'}),body:JSON.stringify({event_id:event.event_id,event_type:event.type,square_order_id:null})});
    return json({ok:true,ignored:'unsupported event'});
  }

  if(!orderId)return json({ok:true,ignored:'no order id'});
  try{
    const square=await squareFetch(`/v2/orders/${encodeURIComponent(orderId)}`);
    const order=square.order;
    if(!order?.id)throw new Error('Square order was not returned');
    const normalized=normalizeSquareOrder(order,payment);
    const current=await existingOrder(order.id);
    if(current?.status==='complete')normalized.last_square_event_at=new Date().toISOString();
    const saved=await upsertNormalizedOrder(normalized);
    await rest('processed_square_events',{method:'POST',headers:serviceHeaders({Prefer:'return=minimal'}),body:JSON.stringify({event_id:event.event_id,event_type:event.type,square_order_id:order.id})});
    return json({ok:true,order_id:saved?.square_order_id||order.id});
  }catch(error){
    console.error('square-webhook failed',error);
    return json({error:error instanceof Error?error.message:'Webhook processing failed'},500);
  }
});
