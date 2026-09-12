import { rest, serviceHeaders, sessionAuthorized, upsertNormalizedOrder } from '../_shared/db.ts';
import { normalizeSquareOrder, squareFetch } from '../_shared/square.ts';

function allowedOrigin(request:Request){const configured=(Deno.env.get('ALLOWED_ORIGIN')||'*').split(',').map(v=>v.trim());const origin=request.headers.get('origin')||'';return configured.includes('*')?'*':configured.includes(origin)?origin:configured[0]||'';}
function cors(request:Request){return{'Access-Control-Allow-Origin':allowedOrigin(request),'Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};}
function json(request:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors(request),'Content-Type':'application/json','Cache-Control':'no-store'}});}
async function tokenSub(request:Request){const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');if(!token)return null;const response=await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`,{headers:{Authorization:`Bearer ${token}`,apikey:Deno.env.get('SUPABASE_ANON_KEY')||''}});if(!response.ok)return null;const user=await response.json();return typeof user?.id==='string'?user.id:null;}
async function sha256(value:string){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');}
function constantTime(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
async function squareLocationId(){const configured=Deno.env.get('SQUARE_LOCATION_ID');if(configured)return configured;const data=await squareFetch('/v2/locations');const active=(data.locations||[]).find((location:any)=>location.status==='ACTIVE')||data.locations?.[0];if(!active?.id)throw new Error('No Square location found');return active.id;}

Deno.serve(async request=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:cors(request)});
  if(request.method!=='POST')return json(request,{error:'Method not allowed'},405);
  const userId=await tokenSub(request);
  if(!userId)return json(request,{error:'Missing authenticated kiosk session'},401);
  const action=new URL(request.url).pathname.split('/').filter(Boolean).pop();

  if(action==='authorize'){
    const body=await request.json().catch(()=>({}));
    const supplied=String(body.pin||'');
    const expected=(Deno.env.get('KIOSK_PIN_SHA256')||'').toLowerCase();
    if(!expected)return json(request,{error:'KIOSK_PIN_SHA256 is not configured'},500);
    const suppliedHash=await sha256(supplied);
    if(!constantTime(suppliedHash,expected))return json(request,{error:'Incorrect truck PIN'},403);
    const authorizedUntil=new Date(Date.now()+14*60*60*1000).toISOString();
    await rest('kiosk_sessions?on_conflict=user_id',{method:'POST',headers:serviceHeaders({Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify({user_id:userId,label:'Truck laptop',authorized_until:authorizedUntil})});
    return json(request,{ok:true,authorized_until:authorizedUntil});
  }

  const permitted=await sessionAuthorized(userId);
  if(action==='status')return json(request,{authorized:permitted});
  if(!permitted)return json(request,{error:'Kiosk authorization expired'},403);

  if(action==='sync'){
    try{
      const locationId=await squareLocationId();
      const body=await request.json().catch(()=>({}));
      const minutes=body.windowMinutes===30?30:18*60;
      const startAt=new Date(Date.now()-minutes*60*1000).toISOString();
      let synced=0;
      let cursor:string|undefined;
      let pages=0;
      do {
        const params=new URLSearchParams({begin_time:startAt,location_id:locationId,limit:'100'});
        if(cursor)params.set('cursor',cursor);
        const data=await squareFetch(`/v2/payments?${params}`);
        for(const payment of data.payments||[]){
          if(payment.status!=='COMPLETED'||!payment.order_id)continue;
          const {order}=await squareFetch(`/v2/orders/${encodeURIComponent(payment.order_id)}`);
          if(!order?.id||!(order.line_items||[]).length)continue;
          await upsertNormalizedOrder(normalizeSquareOrder(order,payment));synced++;
        }
        cursor=data.cursor;
        pages++;
      } while(cursor&&pages<10);
      if(cursor)throw new Error('Reconciliation exceeded 1,000 recent payments; narrow the service window');
      return json(request,{ok:true,synced});
    }catch(error){console.error('orders sync failed',error);return json(request,{error:error instanceof Error?error.message:'Square sync failed'},502);}
  }

  return json(request,{error:'Unknown action'},404);
});
