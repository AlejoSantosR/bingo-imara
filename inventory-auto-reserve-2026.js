/* Bingo IMARA · Inventario automático por lotes de 20 · 2026
   Mantiene un lote activo + un lote de reserva para que el POS avance solo.
   Solo Admin genera/sincroniza inventario; Miembro y Finanzas únicamente consumen el lote activo.
   Sin MutationObserver. Revisión ligera y acotada durante la jornada. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraAutoReserve2026)return;window.__imaraAutoReserve2026=true;

const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const SESSION_KEY='imaraPrivateSessionV1';
const LOCAL_KEY='bingoImaraStateV2';
const LOCK_KEY='imaraAutoReserveLock2026';
const BATCH_SIZE=20;
const CHECK_MS=45000;
const MAX_CHECKS=480; // máximo ~6 horas por carga
let busy=false,checks=0;

function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
function num(id){const m=String(id||'').match(/(\d+)$/);return m?Number(m[1]):NaN;}
function sortCards(a,b){const na=num(a.id),nb=num(b.id);if(Number.isFinite(na)&&Number.isFinite(nb)&&na!==nb)return na-nb;return String(a.id).localeCompare(String(b.id),undefined,{numeric:true});}
function chunks(list){const s=[...(list||[])].sort(sortCards),out=[];for(let i=0;i<s.length;i+=BATCH_SIZE)out.push(s.slice(i,i+BATCH_SIZE));return out;}
async function api(action,payload={}){if(!token())throw new Error('Sesión no disponible.');const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),15000);try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});let d={};try{d=await r.json();}catch(e){}if(!r.ok)throw new Error(d.error||'No fue posible sincronizar el inventario.');return d;}finally{clearTimeout(tm);}}
function lock(){const now=Date.now(),old=Number(localStorage.getItem(LOCK_KEY)||0);if(old&&now-old<15000)return false;localStorage.setItem(LOCK_KEY,String(now));return true;}
function unlock(){localStorage.removeItem(LOCK_KEY);}

function syncCloudIntoLocal(cloud){
 if(typeof state==='undefined'||!Array.isArray(state.cards))return;
 const map=new Map(state.cards.map(c=>[String(c.id),c]));
 for(const c of cloud||[]){const old=map.get(String(c.id))||{};map.set(String(c.id),{...old,id:c.id,grid:Array.isArray(c.grid)?c.grid:old.grid,ballMax:c.ball_max||old.ballMax||state.settings?.ballMax||99,status:c.status==='Pendiente'?'Emitido':(c.status||old.status||'Disponible'),createdAt:c.created_at||old.createdAt||new Date().toISOString()});}
 state.cards=[...map.values()].sort(sortCards);
 try{localStorage.setItem(LOCAL_KEY,JSON.stringify(state));}catch(e){}
}
function nextNumber(cloud){const local=(typeof state!=='undefined'&&Array.isArray(state.cards))?state.cards:[];const nums=[...(cloud||[]),...local].map(c=>num(c.id)).filter(Number.isFinite);return (nums.length?Math.max(...nums):0)+1;}
async function generateBatch(cloud){
 if(typeof generateCards!=='function')throw new Error('El generador de cartones no está disponible.');
 syncCloudIntoLocal(cloud);
 const next=nextNumber(cloud),created=generateCards(BATCH_SIZE,'IMARA',next)||[];
 if(created.length!==BATCH_SIZE)throw new Error('No se pudo completar el lote automático de 20 cartones.');
 await api('cards-sync',{cards:created.map(c=>({id:c.id,grid:c.grid,ballMax:c.ballMax||state?.settings?.ballMax||99}))});
 const d=await api('cards');return (d.cards||[]).sort(sortCards);
}

async function ensureReserve(){
 if(busy||!isAdmin()||!token()||!lock())return false;
 busy=true;
 try{
   let d=await api('cards'),cloud=(d.cards||[]).sort(sortCards);syncCloudIntoLocal(cloud);
   let all=chunks(cloud),active=all.findIndex(b=>b.some(c=>String(c.status)==='Disponible'));
   let need=0;
   if(!all.length||active<0)need=2; // primer lote activo + uno de reserva
   else{
     const reserve=all.slice(active+1).flat().filter(c=>String(c.status)==='Disponible').length;
     if(reserve<BATCH_SIZE)need=1;
   }
   while(need-->0)cloud=await generateBatch(cloud);
   return true;
 }catch(e){console.warn('Inventario automático:',e.message||e);return false;}
 finally{busy=false;unlock();}
}
function schedule(){[500,1800,4200].forEach(ms=>setTimeout(()=>ensureReserve(),ms));}
function heartbeat(){
 if(checks++>=MAX_CHECKS)return;
 setTimeout(async()=>{if(!document.hidden)await ensureReserve();heartbeat();},CHECK_MS);
}
document.addEventListener('click',e=>{
 const t=e.target;
 if(t.closest?.('#imaraLoginBtn')||t.closest?.('.nav [data-view="pos"]')||t.closest?.('.nav [data-view="cards"]')||t.closest?.('#posRefresh')||t.closest?.('#cardsV3Refresh'))schedule();
 if(t.closest?.('#posCreate'))[1400,3200].forEach(ms=>setTimeout(()=>ensureReserve(),ms));
},true);
window.addEventListener('focus',()=>ensureReserve());
schedule();heartbeat();
window.IMARA_AUTO_RESERVE={ensure:ensureReserve};
})();