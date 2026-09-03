/* Bingo IMARA · Sincronización Admin → Finanzas 2026
   Capa aditiva. No modifica login ni ventas de Miembros. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-finance';
const SESSION_KEY='imaraPrivateSessionV1';
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
async function api(action,payload){const token=sessionStorage.getItem(SESSION_KEY)||'';if(!token)throw new Error('Sesión no disponible');const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),12000);try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});let d={};try{d=await r.json()}catch(e){}if(!r.ok)throw new Error(d.error||'No fue posible sincronizar Finanzas');return d;}finally{clearTimeout(tm);}}
function cardFor(id){return typeof findCard==='function'?findCard(id):null;}
async function syncCard(c,target){if(!c||!isAdmin())return null;const d=await api('admin-sale-record',{card_id:c.id,payment_status:target,buyer_alias:c.buyer||'',buyer_phone:c.phone||'',payment_method:'Admin directo',amount:Number(state?.settings?.price)||30000,grid:c.grid,ball_max:c.ballMax||state?.settings?.ballMax||99});if(typeof toast==='function')toast(target==='approved'?`💰 ${c.id} registrado como Pagado en Finanzas`:`💰 ${c.id} registrado como Pendiente en Finanzas`);return d;}
function installQuickStatus(){if(typeof window.quickStatus!=='function'||window.quickStatus.__imaraFinanceSync)return;const base=window.quickStatus;const wrapped=async function(id,status){if(!isAdmin()||!['Pagado','Emitido'].includes(status))return base(id,status);const c=cardFor(id);if(!c)return base(id,status);const target=status==='Pagado'?'approved':'pending';try{await syncCard(c,target);return base(id,status);}catch(e){alert(`No se cambió el cartón porque Finanzas no pudo sincronizarse.\n\n${e.message}`);}};wrapped.__imaraFinanceSync=true;window.quickStatus=wrapped;}
function installSaveHook(){const b=document.getElementById('saveCardBtn');if(!b||b.dataset.financeSync)return;b.dataset.financeSync='1';b.addEventListener('click',()=>{if(!isAdmin())return;const id=document.getElementById('editCardId')?.value||'';setTimeout(async()=>{const c=cardFor(id);if(!c||!['Pagado','Emitido'].includes(c.status))return;try{await syncCard(c,c.status==='Pagado'?'approved':'pending');}catch(e){alert(`El cartón se guardó localmente, pero no pudo reflejarse en Finanzas.\n\n${e.message}`);}},120);});}
function install(){installQuickStatus();installSaveHook();}
const mo=new MutationObserver(install);mo.observe(document.body,{childList:true,subtree:true});setInterval(install,1200);install();
})();