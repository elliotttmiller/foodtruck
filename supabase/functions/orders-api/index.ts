import { rest, staffAuthorized, upsertNormalizedOrder } from '../_shared/db.ts';
import { normalizeSquareOrder, squareFetch } from '../_shared/square.ts';

function allowedOrigin(request:Request){const configured=(Deno.env.get('ALLOWED_ORIGIN')||'*').split(',').map(v=>v.trim());const origin=request.headers.get('origin')||'';return configured.includes('*')?'*':configured.includes(origin)?origin:configured[0]||'';}
function cors(request:Request){return{'Access-Control-Allow-Origin':allowedOrigin(request),'Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};}
function json(request:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors(request),'Content-Type':'application/json','Cache-Control':'no-store'}});}
async function tokenSub(request:Request){const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');if(!token)return null;const response=await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`,{headers:{Authorization:`Bearer ${token}`,apikey:Deno.env.get('SUPABASE_ANON_KEY')||''}});if(!response.ok)return null;const user=await response.json();return typeof user?.id==='string'?user.id:null;}
async function squareLocationId(){const configured=Deno.env.get('SQUARE_LOCATION_ID');if(configured)return configured;const data=await squareFetch('/v2/locations');const active=(data.locations||[]).find((location:any)=>location.status==='ACTIVE')||data.locations?.[0];if(!active?.id)throw new Error('No Square location found');return active.id;}

Deno.serve(async request=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:cors(request)});
  if(request.method!=='POST')return json(request,{error:'Method not allowed'},405);
  const action=new URL(request.url).pathname.split('/').filter(Boolean).pop();

  if(action==='login'){
    const body=await request.json().catch(()=>({}));
    const username=String(body.username||'').trim().toLowerCase();
    const password=String(body.password||'');
    if(!/^[a-z][a-z0-9_-]{2,31}$/.test(username)||!password||password.length>256)return json(request,{error:'Invalid username or password'},401);
    const rows=await rest(`staff_accounts?username=eq.${encodeURIComponent(username)}&select=email,user_id&limit=1`);
    if(!rows?.length)return json(request,{error:'Invalid username or password'},401);
    const key=Deno.env.get('SUPABASE_ANON_KEY')||JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default;
    if(!key)return json(request,{error:'Supabase Auth is not configured'},503);
    const response=await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/token?grant_type=password`,{
      method:'POST',headers:{apikey:key,'Content-Type':'application/json'},
      body:JSON.stringify({email:rows[0].email,password})
    });
    if(!response.ok)return json(request,{error:'Invalid username or password'},401);
    const session=await response.json();
    if(session?.user?.id!==rows[0].user_id)return json(request,{error:'Staff account mismatch'},403);
    return json(request,{access_token:session.access_token,refresh_token:session.refresh_token,expires_in:session.expires_in});
  }

  const userId=await tokenSub(request);
  if(!userId)return json(request,{error:'Missing staff session'},401);
  const permitted=await staffAuthorized(userId);
  if(action==='status')return json(request,{authorized:permitted});
  if(!permitted)return json(request,{error:'Staff account not authorized'},403);

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
