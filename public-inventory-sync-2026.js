/* Bingo IMARA · sincronización pública de inventario 2026
   Publica únicamente número + estado. No expone nombres, teléfonos, pagos ni datos privados.
   Solo opera con Admin, fuera de una ronda activa y cuando show_state está idle. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraPublicInventorySync2026)return;
window.__imaraPublicInventorySync2026=true;

const PRIVATE_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const FIN_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-finance';
const SESSION_KEY='imaraPrivateSessionV1';
const POLL_MS=7000;
let busy=false,lastSignature='',timer=null;

function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
function num(id){const m=String(id||'').match(/(\d+)$/);return m?Number(m[1]):Number.MAX_SAFE_INTEGER;}
function sortCards(a,b){const d=num(a.id)-num(b.id);return d||String(a.id).localeCompare(String(b.id),undefined,{numeric:true});}
async function post(url,action,payload={},auth=true){
 const headers={'Content-Type':'application/json'};
 if(auth&&token())headers.Authorization='Bearer '+token();
 const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),10000);
 try{
  const r=await fetch(url,{method:'POST',headers,cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});
  let d={};try{d=await r.json();}catch(e){}
  if(!r.ok)throw new Error(d.error||'No fue posible sincronizar inventario.');
  return d;
 }finally{clearTimeout(tm);}
}
const pApi=(a,p={},auth=true)=>post(PRIVATE_API,a,p,auth);
const fApi=(a,p={})=>post(FIN_API,a,p,true);
function activeSale(sales,id){return [...sales].reverse().find(s=>String(s.card_id)===String(id)&&['pending','approved'].includes(String(s.payment_status||'').toLowerCase()))||null;}
function publicState(card,sales){
 const sale=activeSale(sales,card.id),cs=String(card.status||'Disponible').toLowerCase();
 if(String(sale?.payment_status||'').toLowerCase()==='pending')return 'r';
 if(String(sale?.payment_status||'').toLowerCase()==='approved')return 's';
 if(cs==='pendiente'||cs==='emitido')return 'r';
 if(cs==='pagado'||cs==='ganador')return 's';
 if(cs==='anulado')return 'x';
 return 'a';
}
async function loadPrivate(){
 const c=await pApi('cards');
 let sales=[];
 try{const f=await fApi('finance-list');sales=f.sales||[];}
 catch(_){try{const s=await pApi('sales');sales=s.sales||[];}catch(__){sales=[];}}
 const cards=(c.cards||[]).sort(sortCards);
 const items=cards.map(card=>[String(card.id),publicState(card,sales)]);
 const counts={a:0,r:0,s:0,x:0};items.forEach(([,st])=>{counts[st]=(counts[st]||0)+1;});
 return {items,counts};
}
function signatureOf(items){return items.map(([id,st])=>`${id}:${st}`).join('|');}
function remoteSignature(inv){return Array.isArray(inv?.items)?signatureOf(inv.items):'';}
async function publish(force=false){
 if(busy||!isAdmin()||!token()||document.hidden)return false;
 busy=true;
 try{
  const overview=await pApi('overview',{},false);
  const game=overview.game||{},round=game.round||{},show=game.show_state||{type:'idle'};
  if(String(round.status||'closed').toLowerCase()==='open')return false;
  if((show.type||'idle')!=='idle')return false;
  const snap=await loadPrivate(),sig=signatureOf(snap.items),remoteSig=remoteSignature(show.public_inventory);
  if(!force&&sig===lastSignature&&sig===remoteSig)return true;
  const next={...show,type:'idle',public_inventory:{v:1,at:new Date().toISOString(),items:snap.items,counts:snap.counts}};
  await pApi('show-set',{show_state:next});
  lastSignature=sig;
  return true;
 }catch(e){console.warn('Inventario público:',e.message||e);return false;}
 finally{busy=false;}
}
function schedule(){setTimeout(()=>publish(false),450);setTimeout(()=>publish(false),1700);}
function wire(){
 document.addEventListener('click',e=>{
  const t=e.target;
  if(t.closest?.('#posCreate,[data-approve-order],[data-pending-order],[data-refund-order],[data-reject-order],[data-release-order],[data-safe-release-order],[data-cv3-release],#cardsV3Generate,#cardsV3ReleaseBatch,#manualCardActivationBtn,[data-manual-off]'))schedule();
  if(t.closest?.('#imaraLoginBtn')){setTimeout(()=>publish(true),1800);setTimeout(()=>publish(false),3600);}
 },true);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>publish(false),300);});
}
function boot(attempt=0){
 if(isAdmin()&&token()){
  publish(true);
  timer=setInterval(()=>publish(false),POLL_MS);
  return;
 }
 if(attempt<30)setTimeout(()=>boot(attempt+1),500);
}
window.IMARA_PUBLIC_INVENTORY_SYNC={publish,url:()=>new URL('inventario.html',location.href).href};
wire();boot();
})();