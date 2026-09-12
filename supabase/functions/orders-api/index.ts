import { rest, serviceHeaders, sessionAuthorized, upsertNormalizedOrder } from '../_shared/db.ts';
import { normalizeSquareOrder, squareFetch } from '../_shared/square.ts';

function allowedOrigin(request:Request){const configured=(Deno.env.get('ALLOWED_ORIGIN')||'*').split(',').map(v=>v.trim());const origin=request.headers.get('origin')||'';return configured.includes('*')?'*':configured.includes(origin)?origin:configured[0]||'';}
function cors(request:Request){return{'Access-Control-Allow-Origin':allowedOrigin(request),'Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};}
function json(request:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors(request),'Content-Type':'application/json','Cache-Control':'no-store'}});}
function tokenSub(request:Request){const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');if(!token)return null;try{const part=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');const payload=JSON.parse(atob(part.padEnd(Math.ceil(part.length/4)*4,'=')));return typeof payload.sub==='string'?payload.sub:null;}catch{return null;}}
async function sha256(value:string){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');}
function constantTime(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
async function squareLocationId(){const configured=Deno.env.get('SQUARE_LOCATION_ID');if(configured)return configured;const data=await squareFetch('/v2/locations');const active=(data.locations||[]).find((location:any)=>location.status==='ACTIVE')||data.locations?.[0];if(!active?.id)throw new Error('No Square location found');return active.id;}

Deno.serve(async request=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:cors(request)});
  if(request.method!=='POST')return json(request,{error:'Method not allowed'},405);
  const userId=tokenSub(request);
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

  if(!(await sessionAuthorized(userId)))return json(request,{error:'Kiosk authorization expired'},403);

  if(action==='sync'){
    try{
      const locationId=await squareLocationId();
      const startAt=new Date(Date.now()-18*60*60*1000).toISOString();
      const data=await squareFetch('/v2/orders/search',{method:'POST',body:JSON.stringify({location_ids:[locationId],query:{filter:{date_time_filter:{created_at:{start_at:startAt}},state_filter:{states:['COMPLETED']}},sort:{sort_field:'CREATED_AT',sort_order:'DESC'}},limit:100})});
      let synced=0;
      for(const order of data.orders||[]){if(!order?.id||!(order.line_items||[]).length)continue;await upsertNormalizedOrder(normalizeSquareOrder(order,{status:'COMPLETED',location_id:order.location_id}));synced++;}
      return json(request,{ok:true,synced});
    }catch(error){console.error('orders sync failed',error);return json(request,{error:error instanceof Error?error.message:'Square sync failed'},502);}
  }

  return json(request,{error:'Unknown action'},404);
});
