/* Bingo IMARA · POS PRICE ORIGIN V4
   La venta nace con el precio real: individual 30K; promo 2x50K = 25K por cartón.
   Intercepta únicamente Registrar venta/preventa. Sin polling ni MutationObserver. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraPosPriceOriginV4)return;window.__imaraPosPriceOriginV4=true;

const PRIVATE_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const FIN_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-finance';
const SESSION_KEY='imaraPrivateSessionV1';
const SINGLE=30000,PROMO_TOTAL=50000,PROMO_UNIT=25000;
const METHOD_CODES={'Efectivo':'EF','Nequi':'NQ','Daviplata':'DP','Bre-B':'BR','Link de pago · RappiPay':'RP','Otro':'OT'};
let busy=false;

const money=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);
const digits=s=>String(s??'').replace(/\D/g,'');
function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
function role(){const c=document.querySelector('#imaraUserChip .imara-role');if(!c)return '';if(c.classList.contains('admin'))return 'admin';if(c.classList.contains('finance'))return 'finance';if(c.classList.contains('member'))return 'member';return '';}
function call(url,action,payload={}){if(!token())return Promise.reject(new Error('Sesión no disponible.'));const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),12000);return fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})}).then(async r=>{let d={};try{d=await r.json()}catch(e){}if(!r.ok)throw new Error(d.error||'No fue posible completar la operación.');return d;}).finally(()=>clearTimeout(tm));}
const pApi=(a,p={})=>call(PRIVATE_API,a,p),fApi=(a,p={})=>call(FIN_API,a,p);
function parsePos(raw){const m=String(raw||'').match(/^POS:([A-Z0-9]{6}):(P|S):([A-Z]{2})$/);return m?{code:m[1],kind:m[2]}:null;}
function orderCode(){const a=new Uint32Array(2);crypto.getRandomValues(a);return (a[0].toString(36)+a[1].toString(36)).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6).padEnd(6,'X');}
function quantities(){const promos=Math.max(0,Number(document.getElementById('posPromos')?.value)||0),singles=Math.max(0,Number(document.getElementById('posSingles')?.value)||0);return {promos,singles,units:promos*2+singles,total:promos*PROMO_TOTAL+singles*SINGLE};}
function collect(){const q=quantities(),rows=[...document.querySelectorAll('#posPeople .pos-person')];if(q.units<1)throw new Error('Selecciona al menos un cartón o una promoción.');if(rows.length!==q.units)throw new Error('La cantidad de personas/cartones no coincide con la venta.');const used=new Set();return {q,people:rows.map((row,i)=>{const kind=row.classList.contains('promo')?'P':'S',card=row.querySelector('[data-p-card]')?.value||'',buyer=(row.querySelector('[data-p-name]')?.value||'').trim(),phone=(row.querySelector('[data-p-phone]')?.value||'').trim(),price=kind==='P'?PROMO_UNIT:SINGLE;if(!card)throw new Error(`Selecciona un cartón para la fila ${i+1}.`);if(used.has(card))throw new Error(`El cartón ${card} está repetido.`);used.add(card);if(digits(phone).length<7)throw new Error(`Escribe un celular válido para ${kind==='P'?'la promoción':'el individual'} ${i+1}.`);return {kind,card,buyer,phone,price};})};}
function encode(code,kind,method){return `POS:${code}:${kind}:${METHOD_CODES[method]||'OT'}`;}
async function rollback(code){try{const d=await pApi('sales'),rows=(d.sales||[]).filter(r=>parsePos(r.payment_method)?.code===code&&r.payment_status==='pending');for(const r of rows)await pApi('sale-release',{sale_id:r.id});}catch(e){}}
async function reconcile(code,forceApprove=false){const r=role();if(!['admin','finance'].includes(r))return;const d=await fApi('finance-list'),rows=(d.sales||[]).filter(x=>parsePos(x.payment_method)?.code===code);for(const row of rows){const p=parsePos(row.payment_method),amount=p?.kind==='P'?PROMO_UNIT:SINGLE,target=forceApprove?'approved':row.payment_status;if(Number(row.amount)!==amount||target!==row.payment_status)await fApi('finance-update',{sale_id:row.id,payment_status:target,amount,note:`Precio POS ${code}: ${p?.kind==='P'?'promo 25K por cartón':'individual 30K'}`});}}
async function createPriced(){if(busy)return;let data;try{data=collect();}catch(e){alert(e.message);return;}const {q,people}=data,method=document.getElementById('posMethod')?.value||'Otro',code=orderCode(),summary=`${q.promos?`${q.promos} promo(s) 2×50K`:''}${q.promos&&q.singles?' + ':''}${q.singles?`${q.singles} individual(es) 30K`:''}\nTotal: ${money(q.total)}\n\n${people.map(p=>`${p.kind==='P'?'Promo':'Individual'} · ${p.card} · ${money(p.price)} · ${p.buyer||'Sin nombre'}`).join('\n')}`;if(!confirm(`Registrar pedido ${code}?\n\n${summary}`))return;
 const btn=document.getElementById('posCreate'),old=btn?.textContent||'Registrar venta';busy=true;if(btn){btn.disabled=true;btn.textContent='Registrando…';}
 let created=0;
 try{
   for(const p of people){await pApi('sale-create',{card_id:p.card,buyer_phone:p.phone,buyer_alias:p.buyer,payment_method:encode(code,p.kind,method),amount:p.price});created++;}
   const approve=['admin','finance'].includes(role())&&document.getElementById('posApproveNow')?.checked;
   await reconcile(code,approve);
   alert(approve?`✅ Venta ${code} aprobada por ${money(q.total)}.\n${q.promos?`Promo: ${money(PROMO_UNIT)} por cada cartón.\n`:''}Los cartones ya pueden jugar.`:`✅ Preventa ${code} registrada por ${money(q.total)}.\n${q.promos?`Promo: ${money(PROMO_UNIT)} por cada cartón.\n`:''}Queda pendiente de aprobación.`);
   setTimeout(()=>document.getElementById('posRefresh')?.click(),100);
 }catch(e){if(created)await rollback(code);alert(`No se completó la venta. Se liberó cualquier cartón reservado.\n\n${e.message}`);}finally{busy=false;if(btn){btn.disabled=false;btn.textContent=old;}}
}

document.addEventListener('click',e=>{const b=e.target.closest?.('#posCreate');if(!b)return;e.preventDefault();e.stopImmediatePropagation();createPriced();},true);
})();
