/* Bingo IMARA · Inventario POS V4 · lotes secuenciales de 20 */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraInventoryPosV4)return;window.__imaraInventoryPosV4=true;
const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const SESSION_KEY='imaraPrivateSessionV1',BATCH_SIZE=20;
let cards=[],loading=false,wired=false,replay=false,creating=false;
function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
async function api(action,payload={}){if(!token())throw new Error('Sesión no disponible.');const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),12000);try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});let d={};try{d=await r.json()}catch(e){}if(!r.ok)throw new Error(d.error||'No fue posible cargar el inventario.');return d;}finally{clearTimeout(tm);}}
function num(id){const m=String(id||'').match(/(\d+)$/);return m?Number(m[1]):NaN;}
function sortCards(a,b){const na=num(a.id),nb=num(b.id);if(Number.isFinite(na)&&Number.isFinite(nb)&&na!==nb)return na-nb;return String(a.id).localeCompare(String(b.id),undefined,{numeric:true});}
function quantities(){return Math.max(0,Number(document.getElementById('posPromos')?.value)||0)*2+Math.max(0,Number(document.getElementById('posSingles')?.value)||0)||1;}
function batches(){const s=[...cards].sort(sortCards),out=[];for(let i=0;i<s.length;i+=BATCH_SIZE)out.push(s.slice(i,i+BATCH_SIZE));return out;}
function available(){return cards.filter(c=>String(c.status)==='Disponible').sort(sortCards);}
function context(required=1){
 const all=batches(),free=available();
 let idx=all.findIndex(b=>b.some(c=>String(c.status)==='Disponible'));
 if(idx<0)return {all,idx:-1,batch:[],active:[],auto:[],saleFree:[],free,reserve:0};
 const batch=all[idx],active=batch.filter(c=>String(c.status)==='Disponible'),auto=[...active],spill=[];
 for(let i=idx+1;auto.length<required&&i<all.length;i++){
   const next=all[i].filter(c=>String(c.status)==='Disponible'),needed=Math.max(0,required-auto.length),take=next.slice(0,needed);
   spill.push(...take);auto.push(...take);
 }
 const seen=new Set(),saleFree=[...active,...spill].filter(c=>!seen.has(c.id)&&seen.add(c.id));
 const reserve=Math.max(0,free.length-active.length);
 return {all,idx,batch,active,auto,saleFree,free,reserve};
}
function css(){if(document.getElementById('inventoryPosV4Css'))return;const s=document.createElement('style');s.id='inventoryPosV4Css';s.textContent=`.pos-batch-v3{margin-top:12px;padding:12px;border-radius:15px;border:1px solid rgba(110,174,255,.27);background:linear-gradient(145deg,rgba(110,174,255,.09),rgba(141,107,255,.05));display:grid;gap:7px}.pos-batch-v3-top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.pos-batch-v3 small{color:var(--muted)}.pos-batch-v3 strong{font-weight:1000}.pos-batch-v3-chips{display:flex;gap:5px;flex-wrap:wrap}.pos-batch-v3-chip{padding:4px 7px;border-radius:999px;border:1px solid var(--line);background:#10182a;font-size:9px}`;document.head.appendChild(s);}
function paintBanner(ctx){
 const view=document.getElementById('view-pos'),head=view?.querySelector('.pos-head');if(!head)return;
 let b=document.getElementById('posBatchBannerV3');if(!b){b=document.createElement('div');b.id='posBatchBannerV3';b.className='pos-batch-v3';head.after(b);}
 if(ctx.idx<0){b.innerHTML='<strong>📦 Preparando inventario</strong><small>No hay cartones disponibles en este instante. Si Admin está conectado, el lote automático se preparará solo.</small>';return;}
 const remain=ctx.active;
 b.innerHTML=`<div class="pos-batch-v3-top"><div><strong>📦 Lote ${ctx.idx+1} activo · ${ctx.batch[0]?.id||'—'} → ${ctx.batch.at(-1)?.id||'—'}</strong><br><small>${remain.length} quedan en este lote · ${ctx.reserve} en reserva</small></div></div><div class="pos-batch-v3-chips">${remain.slice(0,20).map(c=>`<span class="pos-batch-v3-chip">${c.id}</span>`).join('')||'<small>Ninguno</small>'}</div><small>⚡ El siguiente lote se activa automáticamente cuando este se agota. Solo si una venta cruza el final del lote se toman los cartones necesarios del siguiente.</small>`;
}
function rebuild(ctx){
 const sels=[...document.querySelectorAll('#posPeople [data-p-card]')];if(!sels.length)return;
 const allowed=ctx.saleFree,allowedSet=new Set(allowed.map(c=>c.id)),activeSet=new Set(ctx.active.map(c=>c.id));
 sels.forEach(sel=>{const keep=allowedSet.has(sel.value)?sel.value:'';sel.innerHTML='<option value="">⚡ Automático · siguiente disponible</option>'+allowed.map(c=>`<option value="${c.id}">${c.id}${activeSet.has(c.id)?' · lote activo':' · cruce al siguiente lote'}</option>`).join('');sel.value=keep;});
 const used=sels.map(s=>s.value).filter(Boolean);sels.forEach(sel=>[...sel.options].forEach(o=>{if(o.value)o.disabled=used.includes(o.value)&&o.value!==sel.value;}));
 const h=document.getElementById('posAvailHint');if(h)h.textContent=ctx.idx>=0?`${ctx.active.length} cartón(es) disponibles en el lote activo.`:'Inventario temporalmente sin disponibles.';
}
function paint(){const ctx=context(quantities());paintBanner(ctx);rebuild(ctx);return ctx;}
async function load(showError=false){if(!token()||loading)return;loading=true;try{const d=await api('cards');cards=d.cards||[];paint();}catch(e){if(showError)alert(e.message);}finally{loading=false;}}
function fill(ctx,units){
 const sels=[...document.querySelectorAll('#posPeople [data-p-card]')];if(sels.length!==units)return {ok:false,msg:'La cantidad de participantes no coincide con la venta.'};
 const allowedSet=new Set(ctx.saleFree.map(c=>c.id)),used=new Set();
 for(const s of sels){if(s.value&&!allowedSet.has(s.value))s.value='';if(s.value){if(used.has(s.value))return {ok:false,msg:`El cartón ${s.value} está repetido.`};used.add(s.value);}}
 const pool=ctx.auto.map(c=>c.id).filter((id,i,a)=>a.indexOf(id)===i&&!used.has(id));
 for(const s of sels)if(!s.value)s.value=pool.shift()||'';
 if(sels.some(s=>!s.value))return {ok:false,msg:`No hay ${units} cartón(es) habilitados para completar esta venta.`};
 return {ok:true};
}
async function preflight(btn){
 if(creating)return;creating=true;
 try{
   await load(true);const units=quantities(),ctx=context(units);
   if(ctx.saleFree.length<units){window.IMARA_AUTO_RESERVE?.ensure?.();await new Promise(r=>setTimeout(r,900));await load(false);}
   const fresh=context(units);if(fresh.saleFree.length<units){alert(`No hay suficientes cartones habilitados para completar ${units} cartón(es). Intenta de nuevo en unos segundos.`);return;}
   const r=fill(fresh,units);if(!r.ok){alert(r.msg);return;}
   replay=true;setTimeout(()=>{btn.click();replay=false;},0);
 }finally{creating=false;}
}
function wire(){if(wired)return;wired=true;document.addEventListener('click',e=>{const t=e.target,create=t.closest?.('#posCreate');if(create&&!replay){e.preventDefault();e.stopImmediatePropagation();preflight(create);return;}if(t.closest?.('.nav [data-view="pos"]')||t.closest?.('#posRefresh'))setTimeout(()=>load(false),0);if(t.closest?.('[data-approve-order]')||t.closest?.('[data-pending-order]')||t.closest?.('[data-refund-order]')||t.closest?.('[data-reject-order]')||t.closest?.('[data-release-order]')||t.closest?.('[data-safe-release-order]'))setTimeout(()=>load(false),450);if(t.closest?.('#imaraLoginBtn')){setTimeout(()=>load(false),1400);setTimeout(()=>load(false),3000);}},true);document.addEventListener('input',e=>{if(e.target?.id==='posPromos'||e.target?.id==='posSingles')paint();},true);document.addEventListener('change',e=>{if(e.target?.matches?.('#posPeople [data-p-card]'))paint();},true);}
css();wire();setTimeout(()=>load(false),1400);
})();