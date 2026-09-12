/* Bingo IMARA · Liberar asignación SAFE 2026
   Permite deshacer una PREVENTA por error de asignación sin borrar el cartón oficial.
   Libera el pedido completo para proteger promociones 2x50K y trazabilidad.
   Sin MutationObserver ni polling permanente. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;

const PRIVATE_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const FIN_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-finance';
const SESSION_KEY='imaraPrivateSessionV1';
let wired=false,busy=false;

function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
function currentRole(){const c=document.querySelector('#imaraUserChip .imara-role');if(!c)return '';if(c.classList.contains('admin'))return 'admin';if(c.classList.contains('finance'))return 'finance';if(c.classList.contains('member'))return 'member';return '';}
function parseMethod(raw){const m=String(raw||'').match(/^POS:([A-Z0-9]{6}):(P|S):([A-Z]{2})$/);return m?{code:m[1],kind:m[2]}:null;}
async function call(url,action,payload={}){if(!token())throw new Error('Sesión no disponible. Vuelve a iniciar sesión.');const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),12000);try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});let d={};try{d=await r.json()}catch(e){}if(!r.ok)throw new Error(d.error||'No fue posible completar la operación.');return d;}finally{clearTimeout(tm);}}
const pApi=(a,p={})=>call(PRIVATE_API,a,p),fApi=(a,p={})=>call(FIN_API,a,p);

function pendingCardIds(order){return [...order.querySelectorAll('.pos-chip')].map(x=>x.textContent||'').join(' ');}
function decorate(){
 document.querySelectorAll('.pos-order[data-order]').forEach(order=>{
   const status=(order.querySelector('.pos-status')?.textContent||'').trim().toUpperCase();
   if(status!=='PREVENTA')return;
   const actions=order.querySelector('.pos-order-actions');if(!actions)return;
   const legacy=order.querySelector('strong')?.textContent?.includes('Venta anterior');if(legacy)return;
   const existing=actions.querySelector('[data-release-order]');
   if(existing){existing.textContent='🗑️ Eliminar asignación';existing.title='Libera la preventa y devuelve sus cartones a Disponible';return;}
   if(actions.querySelector('[data-safe-release-order]'))return;
   const b=document.createElement('button');b.className='mini';b.dataset.safeReleaseOrder=order.dataset.order||'';b.textContent='🗑️ Eliminar asignación';b.title='Libera la preventa y devuelve sus cartones a Disponible';actions.appendChild(b);
 });
}
function schedule(){[120,650,1500].forEach(ms=>setTimeout(decorate,ms));}

async function release(code,button){
 if(!code||busy)return;
 const cardHint=button?.closest('.pos-order')?pendingCardIds(button.closest('.pos-order')):'';
 if(!confirm(`¿Eliminar la asignación del pedido ${code}?\n\nSe liberarán TODOS los cartones de esta PREVENTA y volverán a Disponible · Sin asignar.\nNo se elimina el número de cartón ni su matriz de juego.${cardHint?`\n\n${cardHint}`:''}`))return;
 busy=true;const old=button?.textContent;if(button){button.disabled=true;button.textContent='Liberando…';}
 try{
   const r=currentRole();
   const data=r==='member'?await pApi('sales'):await fApi('finance-list');
   const rows=(data.sales||[]).filter(x=>parseMethod(x.payment_method)?.code===code&&x.payment_status==='pending');
   if(!rows.length)throw new Error('La preventa ya no está pendiente o no se encontró. Actualiza el POS.');
   for(const row of rows)await pApi('sale-release',{sale_id:row.id});
   alert(`✅ Asignación ${code} eliminada.\n${rows.length} cartón${rows.length===1?'':'es'} vuelve${rows.length===1?'':'n'} a Disponible · Sin asignar.`);
   document.getElementById('posRefresh')?.click();
   setTimeout(()=>document.querySelector('.nav [data-view="pos"]')?.click(),250);
   schedule();
 }catch(e){alert(e.name==='AbortError'?'El servidor tardó demasiado. Intenta otra vez.':e.message);}finally{busy=false;if(button){button.disabled=false;button.textContent=old||'🗑️ Eliminar asignación';}}
}

function wire(){if(wired)return;wired=true;document.addEventListener('click',e=>{
 const t=e.target;
 const safe=t.closest?.('[data-safe-release-order]');if(safe){e.preventDefault();e.stopImmediatePropagation();release(safe.dataset.safeReleaseOrder,safe);return;}
 const native=t.closest?.('[data-release-order]');if(native){native.textContent='🗑️ Eliminar asignación';}
 if(t.closest?.('.nav [data-view="pos"]')||t.closest?.('.nav [data-view="finance"]')||t.closest?.('#posRefresh')||t.closest?.('#financeRefresh')||t.closest?.('#posCreate')||t.closest?.('[data-approve-order]')||t.closest?.('[data-reject-order]')||t.closest?.('[data-pending-order]')||t.closest?.('[data-refund-order]'))schedule();
 if(t.closest?.('#imaraLoginBtn'))[900,2200,4500].forEach(ms=>setTimeout(decorate,ms));
 },true);}
function boot(){wire();[800,2100,4300].forEach(ms=>setTimeout(decorate,ms));}
boot();
})();
