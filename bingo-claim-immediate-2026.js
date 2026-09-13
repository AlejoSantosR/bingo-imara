/* Bingo IMARA · puente de aviso inmediato de BINGO móvil · SAFE 2026
   No agrega polling: reutiliza las respuestas bingo-claims del flujo existente. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraImmediateBingoClaim2026)return;window.__imaraImmediateBingoClaim2026=true;

const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const SESSION_KEY='imaraPrivateSessionV1';
const nativeFetch=window.fetch.bind(window);
let lastPendingSig='',publishing=false;
const esc=s=>typeof escapeHtml==='function'?escapeHtml(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
function sig(list){return (list||[]).map(x=>String(x.card_id||'')).filter(Boolean).sort().join('|');}
function pendingClaims(list){return (list||[]).filter(x=>x?.card_id&&x.valid!==true);}
async function directApi(action,payload={},auth=true){
 const headers={'Content-Type':'application/json'};if(auth&&token())headers.Authorization='Bearer '+token();
 const r=await nativeFetch(API,{method:'POST',headers,cache:'no-store',body:JSON.stringify({action,...payload})});
 let d={};try{d=await r.json();}catch(e){}if(!r.ok)throw new Error(d.error||'No fue posible publicar el aviso de BINGO.');return d;
}
function review(id){
 const nav=document.querySelector('.nav [data-view="validate"]');if(nav)nav.click();else if(typeof showView==='function')showView('validate');
 setTimeout(()=>{const input=document.getElementById('winnerInput');if(input)input.value=id;document.getElementById('validateBtn')?.click();},80);
}
function renderDashboard(list){
 if(!isAdmin())return;const host=document.getElementById('view-dashboard');if(!host)return;
 const pending=pendingClaims(list);let box=document.getElementById('bingoImmediateClaimAlert');
 if(!pending.length){box?.remove();return;}
 if(!box){box=document.createElement('div');box.id='bingoImmediateClaimAlert';box.style.cssText='margin:14px 0;padding:15px;border:1px solid rgba(255,202,58,.42);border-radius:20px;background:linear-gradient(145deg,rgba(255,202,58,.10),rgba(141,107,255,.055))';host.querySelector('.grid.kpis')?.after(box);}
 box.innerHTML=`<div style="font-size:16px;font-weight:1000;color:#ffe49a">📣 ${pending.length===1?'BINGO anunciado · revisar':`${pending.length} BINGOS anunciados · revisar`}</div><div class="muted" style="margin:4px 0 10px">El participante ya avisó BINGO. La pantalla pública fue notificada; falta la validación oficial del cartón.</div>${pending.map(c=>`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 11px;margin-top:7px;border-radius:14px;border:1px solid var(--line);background:#10182a"><div><strong>📱 ${esc(c.buyer_alias||c.card_id)}</strong><br><small class="muted">${esc(c.card_id)} · pendiente de validación</small></div><button class="mini" data-imara-immediate-review="${esc(c.card_id)}">🔎 Revisar cartón</button></div>`).join('')}`;
}
async function publishPending(list){
 renderDashboard(list);
 const pending=pendingClaims(list),nextSig=sig(pending);
 if(!nextSig){lastPendingSig='';return;}
 if(nextSig===lastPendingSig||publishing||!isAdmin()||!token())return;
 lastPendingSig=nextSig;publishing=true;
 try{
   const o=await directApi('overview',{},false),current=o.game?.show_state||{type:'idle'};
   if(current.type==='winner'||current.type==='tie')return;
   const merged=new Map();
   if(current.type==='bingo_live_claim')for(const c of current.candidates||[])if(c?.card_id)merged.set(String(c.card_id),c);
   for(const c of pending)merged.set(String(c.card_id),{card_id:c.card_id,buyer_alias:c.buyer_alias||'',valid:false});
   await directApi('show-set',{show_state:{type:'bingo_live_claim',at:new Date().toISOString(),round_name:o.game?.round?.name||'Ronda',candidates:[...merged.values()]}});
 }catch(e){console.warn('Aviso inmediato BINGO:',e.message||e);}finally{publishing=false;}
}
window.fetch=async function(input,init){
 const response=await nativeFetch(input,init);
 try{
   const url=typeof input==='string'?input:(input?.url||'');
   if(url.includes('/bingo-private')&&init?.body){
     const req=JSON.parse(String(init.body));
     if(req?.action==='bingo-claims')response.clone().json().then(d=>publishPending(d?.claims||[])).catch(()=>{});
   }
 }catch(e){}
 return response;
};
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-imara-immediate-review]');if(b){e.preventDefault();review(b.dataset.imaraImmediateReview);}},true);
})();