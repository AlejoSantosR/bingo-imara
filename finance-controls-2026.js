/* Bingo IMARA · Controles financieros extendidos 2026
   Capa aditiva. No modifica login, juego ni generación de cartones. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-finance';
const SESSION_KEY='imaraPrivateSessionV1';
let busy=false;

async function api(action,payload={}){
  const token=sessionStorage.getItem(SESSION_KEY)||'';
  if(!token)throw new Error('Sesión no disponible. Vuelve a iniciar sesión.');
  const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),12000);
  try{
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});
    let d={};try{d=await r.json()}catch(e){}
    if(!r.ok)throw new Error(d.error||'No fue posible completar la operación.');
    return d;
  }finally{clearTimeout(tm);}
}
function toastSafe(msg){if(typeof toast==='function')toast(msg);else alert(msg);}
function refreshFinance(){document.getElementById('financeRefresh')?.click();}
function cardStatusFromRow(tr){return (tr?.querySelector('td:first-child small')?.textContent||'').trim();}
function saleIdFromRow(tr){return tr?.querySelector('[data-paid]')?.dataset.paid||tr?.querySelector('[data-edit]')?.dataset.edit||'';}

async function rejectPayment(id,btn){
  if(busy)return;
  const reason=prompt('Motivo para rechazar/desaprobar este pago:','');
  if(!reason?.trim())return;
  if(!confirm('¿Confirmas que el pago será RECHAZADO y el cartón quedará liberado?'))return;
  busy=true;const old=btn.textContent;btn.disabled=true;btn.textContent='Procesando…';
  try{const d=await api('finance-update',{sale_id:id,payment_status:'rejected',note:reason.trim()});toastSafe(`❌ ${d.card_id||'Cartón'} · pago rechazado`);refreshFinance();}
  catch(e){alert(e.message);}finally{busy=false;btn.disabled=false;btn.textContent=old;}
}
async function controlCard(id,operation,btn){
  if(busy)return;
  const verb=operation==='annul'?'ANULAR':'REACTIVAR';
  const reason=prompt(`Motivo para ${verb.toLowerCase()} el cartón:`,operation==='annul'?'Cartón no habilitado para jugar':'Reactivación autorizada');
  if(!reason?.trim())return;
  const warning=operation==='annul'?'Anular el cartón lo saca del juego, pero NO devuelve el dinero automáticamente. Si corresponde devolver el pago, usa también “Devuelto”.':'El cartón recuperará el estado que corresponda a su pago actual.';
  if(!confirm(`${warning}\n\n¿Confirmas ${verb} el cartón?`))return;
  busy=true;const old=btn.textContent;btn.disabled=true;btn.textContent='Procesando…';
  try{const d=await api('finance-card-status',{sale_id:id,operation,note:reason.trim()});toastSafe(`${operation==='annul'?'🚫':'♻️'} ${d.card_id||'Cartón'} · ${d.card_status}`);refreshFinance();}
  catch(e){alert(e.message);}finally{busy=false;btn.disabled=false;btn.textContent=old;}
}
function enhanceRows(){
  document.querySelectorAll('#financeRows tbody tr').forEach(tr=>{
    const actions=tr.querySelector('.finance-actions');if(!actions)return;
    const id=saleIdFromRow(tr);if(!id)return;
    const paid=actions.querySelector('[data-paid]');if(paid)paid.textContent='✅ Aprobar pago';
    const refund=actions.querySelector('[data-refund]');if(refund)refund.textContent='↩ Devolver pago';
    const edit=actions.querySelector('[data-edit]');if(edit)edit.textContent='✏️ Corregir';
    if(!actions.querySelector('[data-fin-reject]')){
      const b=document.createElement('button');b.className='mini';b.dataset.finReject=id;b.textContent='❌ Rechazar pago';b.onclick=()=>rejectPayment(id,b);actions.insertBefore(b,edit||null);
    }
    const status=cardStatusFromRow(tr);
    let cardBtn=actions.querySelector('[data-fin-card]');
    if(status==='Ganador'){
      if(cardBtn)cardBtn.remove();
      if(!actions.querySelector('.finance-winner-lock')){const s=document.createElement('span');s.className='finance-winner-lock';s.textContent='🏆 Cartón cerrado';s.style.cssText='font-size:10px;color:var(--muted);padding:6px 4px';actions.appendChild(s);}
      return;
    }
    actions.querySelector('.finance-winner-lock')?.remove();
    const operation=status==='Anulado'?'reactivate':'annul';
    if(!cardBtn){cardBtn=document.createElement('button');cardBtn.className='mini';cardBtn.dataset.finCard='1';actions.appendChild(cardBtn);}
    cardBtn.textContent=operation==='annul'?'🚫 Anular cartón':'♻️ Reactivar cartón';
    cardBtn.onclick=()=>controlCard(id,operation,cardBtn);
  });
  const info=document.querySelector('#financeAdminBox .success');
  if(info&&document.body.classList.contains('imara-finance'))info.innerHTML='✅ <strong>Control financiero completo:</strong> puedes aprobar, rechazar, devolver y corregir pagos, además de anular o reactivar cartones. Todas las acciones quedan auditadas. No tienes acceso a juego, rondas ni usuarios.';
}
function addLegend(){
  const host=document.querySelector('#view-finance .finance-view');if(!host||document.getElementById('financeControlLegend'))return;
  const d=document.createElement('div');d.id='financeControlLegend';d.className='notice';d.innerHTML='<strong>Control compartido Admin + Finanzas:</strong> ✅ Aprobar pago habilita el cartón · ❌ Rechazar pago libera el cartón · ↩ Devolver descuenta recaudo · 🚫 Anular cartón lo saca del juego sin modificar el dinero · ♻️ Reactivar recupera su estado según el pago.';
  host.querySelector('.card')?.after(d);
}
function enhance(){addLegend();enhanceRows();}
const observer=new MutationObserver(()=>enhance());observer.observe(document.body,{childList:true,subtree:true});
setInterval(enhance,1200);enhance();
})();