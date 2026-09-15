/* Bingo IMARA · Inventario POS V4 · lotes secuenciales de 20 + activación manual */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraInventoryPosV4)return;window.__imaraInventoryPosV4=true;
const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const SESSION_KEY='imaraPrivateSessionV1',BATCH_SIZE=20,MANUAL_KEY='imaraManualCardActivationV1';
let cards=[],loading=false,wired=false,replay=false,creating=false;
function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
async function api(action,payload={}){if(!token())throw new Error('Sesión no disponible.');const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),12000);try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});let d={};try{d=await r.json()}catch(e){}if(!r.ok)throw new Error(d.error||'No fue posible cargar el inventario.');return d;}finally{clearTimeout(tm);}}
function num(id){const m=String(id||'').match(/(\d+)$/);return m?Number(m[1]):NaN;}
function sortCards(a,b){const na=num(a.id),nb=num(b.id);if(Number.isFinite(na)&&Number.isFinite(nb)&&na!==nb)return na-nb;return String(a.id).localeCompare(String(b.id),undefined,{numeric:true});}
function quantities(){return Math.max(0,Number(document.getElementById('posPromos')?.value)||0)*2+Math.max(0,Number(document.getElementById('posSingles')?.value)||0)||1;}
function batches(){const s=[...cards].sort(sortCards),out=[];for(let i=0;i<s.length;i+=BATCH_SIZE)out.push(s.slice(i,i+BATCH_SIZE));return out;}
function available(){return cards.filter(c=>String(c.status)==='Disponible').sort(sortCards);}
function manualIds(){try{return new Set(JSON.parse(localStorage.getItem(MANUAL_KEY)||'[]').map(String));}catch(e){return new Set();}}
function saveManual(set){localStorage.setItem(MANUAL_KEY,JSON.stringify([...set]));}
function naturalContext(){const all=batches();const idx=all.findIndex(b=>b.some(c=>String(c.status)==='Disponible'));return {all,idx,batch:idx>=0?all[idx]:[]};}
function pruneManual(){const set=manualIds(),free=new Set(available().map(c=>String(c.id))),nat=naturalContext(),natural=new Set((nat.batch||[]).filter(c=>String(c.status)==='Disponible').map(c=>String(c.id)));let changed=false;for(const id of [...set])if(!free.has(id)||natural.has(id)){set.delete(id);changed=true;}if(changed)saveManual(set);return set;}
function manualAvailable(){const set=manualIds();return available().filter(c=>set.has(String(c.id)));
}
function context(required=1){
 const all=batches(),free=available();
 let idx=all.findIndex(b=>b.some(c=>String(c.status)==='Disponible'));
 if(idx<0)return {all,idx:-1,batch:[],active:[],manual:[],auto:[],saleFree:[],free,reserve:0};
 const batch=all[idx],active=batch.filter(c=>String(c.status)==='Disponible'),auto=[...active],spill=[];
 for(let i=idx+1;auto.length<required&&i<all.length;i++){
   const next=all[i].filter(c=>String(c.status)==='Disponible'),needed=Math.max(0,required-auto.length),take=next.slice(0,needed);
   spill.push(...take);auto.push(...take);
 }
 const activeSet=new Set(active.map(c=>String(c.id))),spillSet=new Set(spill.map(c=>String(c.id)));
 const manual=manualAvailable().filter(c=>!activeSet.has(String(c.id))&&!spillSet.has(String(c.id)));
 const seen=new Set(),saleFree=[...active,...spill,...manual].filter(c=>!seen.has(c.id)&&seen.add(c.id));
 const reserve=Math.max(0,free.length-active.length-manual.length);
 return {all,idx,batch,active,manual,auto,saleFree,free,reserve};
}
function normalizeCardId(raw){const t=String(raw||'').trim().toUpperCase();if(!t)return '';const exact=cards.find(c=>String(c.id).toUpperCase()===t);if(exact)return exact.id;const n=Number((t.match(/(\d+)$/)||[])[1]);if(Number.isFinite(n)){const byNum=cards.find(c=>num(c.id)===n);if(byNum)return byNum.id;}return t;}
function activateManual(raw,{silent=false}={}){const id=normalizeCardId(raw),card=cards.find(c=>String(c.id)===String(id));if(!card){if(!silent)alert('No encontré ese cartón en el inventario.');return false;}if(String(card.status)!=='Disponible'){if(!silent)alert(`${id} no está Disponible y no puede activarse manualmente.`);return false;}const nat=naturalContext(),natural=new Set((nat.batch||[]).filter(c=>String(c.status)==='Disponible').map(c=>String(c.id)));if(natural.has(String(id))){if(!silent)alert(`${id} ya está habilitado porque pertenece al lote activo.`);return true;}const set=manualIds();set.add(String(id));saveManual(set);paint();paintManualPanel();if(!silent)alert(`✅ ${id} quedó activado manualmente para POS.\n\nEl lote automático sigue funcionando igual.`);return true;}
function deactivateManual(id){const set=manualIds();set.delete(String(id));saveManual(set);paint();paintManualPanel();}
function css(){if(document.getElementById('inventoryPosV4Css'))return;const s=document.createElement('style');s.id='inventoryPosV4Css';s.textContent=`.pos-batch-v3{margin-top:12px;padding:12px;border-radius:15px;border:1px solid rgba(110,174,255,.27);background:linear-gradient(145deg,rgba(110,174,255,.09),rgba(141,107,255,.05));display:grid;gap:7px}.pos-batch-v3-top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.pos-batch-v3 small{color:var(--muted)}.pos-batch-v3 strong{font-weight:1000}.pos-batch-v3-chips{display:flex;gap:5px;flex-wrap:wrap}.pos-batch-v3-chip{padding:4px 7px;border-radius:999px;border:1px solid var(--line);background:#10182a;font-size:9px}.pos-batch-v3-chip.manual{border-color:rgba(255,199,78,.48);background:rgba(255,199,78,.09);color:#ffe6a3}.manual-card-panel{margin:0 0 14px;padding:12px;border-radius:16px;border:1px solid rgba(255,199,78,.28);background:linear-gradient(145deg,rgba(255,199,78,.08),rgba(141,107,255,.04));display:grid;gap:9px}.manual-card-row{display:flex;gap:8px;flex-wrap:wrap;align-items:end}.manual-card-row label{display:grid;gap:4px;min-width:220px;flex:1;font-size:10px;color:var(--muted)}.manual-card-list{display:flex;gap:6px;flex-wrap:wrap}.manual-card-tag{display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;border:1px solid rgba(255,199,78,.35);background:#171a25;font-size:10px}.manual-card-tag button{border:0;background:transparent;color:#ffb4bc;cursor:pointer;font-weight:900}`;document.head.appendChild(s);}
function paintBanner(ctx){
 const view=document.getElementById('view-pos'),head=view?.querySelector('.pos-head');if(!head)return;
 let b=document.getElementById('posBatchBannerV3');if(!b){b=document.createElement('div');b.id='posBatchBannerV3';b.className='pos-batch-v3';head.after(b);}
 if(ctx.idx<0){b.innerHTML='<strong>📦 Preparando inventario</strong><small>No hay cartones disponibles en este instante. Si Admin está conectado, el lote automático se preparará solo.</small>';return;}
 const remain=ctx.active;
 b.innerHTML=`<div class="pos-batch-v3-top"><div><strong>📦 Lote ${ctx.idx+1} activo · ${ctx.batch[0]?.id||'—'} → ${ctx.batch.at(-1)?.id||'—'}</strong><br><small>${remain.length} quedan en este lote · ${ctx.reserve} en reserva${ctx.manual.length?` · ${ctx.manual.length} activado(s) manualmente`:''}</small></div></div><div class="pos-batch-v3-chips">${remain.slice(0,20).map(c=>`<span class="pos-batch-v3-chip">${c.id}</span>`).join('')||'<small>Ninguno</small>'}${ctx.manual.map(c=>`<span class="pos-batch-v3-chip manual">⚡ ${c.id}</span>`).join('')}</div><small>⚡ La asignación automática sigue usando el lote actual. Los cartones activados manualmente solo se usan si los seleccionas expresamente.</small>`;
}
function rebuild(ctx){
 const sels=[...document.querySelectorAll('#posPeople [data-p-card]')];if(!sels.length)return;
 const allowed=ctx.saleFree,allowedSet=new Set(allowed.map(c=>c.id)),activeSet=new Set(ctx.active.map(c=>c.id)),manualSet=new Set(ctx.manual.map(c=>c.id));
 sels.forEach(sel=>{const keep=allowedSet.has(sel.value)?sel.value:'';sel.innerHTML='<option value="">⚡ Automático · siguiente disponible</option>'+allowed.map(c=>`<option value="${c.id}">${c.id}${activeSet.has(c.id)?' · lote activo':manualSet.has(c.id)?' · activado manualmente':' · cruce al siguiente lote'}</option>`).join('');sel.value=keep;});
 const used=sels.map(s=>s.value).filter(Boolean);sels.forEach(sel=>[...sel.options].forEach(o=>{if(o.value)o.disabled=used.includes(o.value)&&o.value!==sel.value;}));
 const h=document.getElementById('posAvailHint');if(h)h.textContent=ctx.idx>=0?`${ctx.active.length} cartón(es) en lote activo${ctx.manual.length?` + ${ctx.manual.length} manual(es)`:''}.`:'Inventario temporalmente sin disponibles.';
}
function paint(){const ctx=context(quantities());paintBanner(ctx);rebuild(ctx);return ctx;}
function paintManualPanel(){if(!isAdmin())return;const view=document.getElementById('view-cards'),base=view?.querySelector(':scope > .card');if(!base)return;let p=document.getElementById('manualCardActivationPanel');if(!p){p=document.createElement('div');p.id='manualCardActivationPanel';p.className='manual-card-panel';const anchor=document.getElementById('cardsAdminV3Panel')||base.querySelector('.success');anchor?.after(p);}const manual=manualAvailable();p.innerHTML=`<div><strong>⚡ Activación manual de cartones</strong><div class="muted" style="font-size:10px;margin-top:3px">Permite habilitar un cartón de un lote futuro sin esperar a que se agote el lote actual. No cambia precio, pago ni estado.</div></div><div class="manual-card-row"><label>Cartón a activar<input class="input" id="manualCardActivationInput" placeholder="Ej: 27 o IMARA-027"></label><button class="btn" id="manualCardActivationBtn">⚡ Activar para POS</button></div><div class="manual-card-list">${manual.length?manual.map(c=>`<span class="manual-card-tag">⚡ ${c.id}<button type="button" data-manual-off="${c.id}" title="Quitar activación">×</button></span>`).join(''):'<span class="muted" style="font-size:10px">No hay excepciones manuales activas.</span>'}</div>`;p.querySelector('#manualCardActivationBtn')?.addEventListener('click',()=>activateManual(p.querySelector('#manualCardActivationInput')?.value));p.querySelector('#manualCardActivationInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();activateManual(e.target.value);}});p.querySelectorAll('[data-manual-off]').forEach(b=>b.addEventListener('click',()=>deactivateManual(b.dataset.manualOff)));}
async function load(showError=false){if(!token()||loading)return;loading=true;try{const d=await api('cards');cards=d.cards||[];pruneManual();paint();paintManualPanel();}catch(e){if(showError)alert(e.message);}finally{loading=false;}}
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
function wire(){if(wired)return;wired=true;document.addEventListener('click',e=>{const t=e.target,create=t.closest?.('#posCreate');if(create&&!replay){e.preventDefault();e.stopImmediatePropagation();preflight(create);return;}const direct=t.closest?.('[data-cv3-pos]');if(direct){activateManual(direct.dataset.cv3Pos,{silent:true});setTimeout(()=>load(false),40);}if(t.closest?.('.nav [data-view="pos"]')||t.closest?.('#posRefresh'))setTimeout(()=>load(false),0);if(t.closest?.('.nav [data-view="cards"]'))setTimeout(()=>{load(false);paintManualPanel();},60);if(t.closest?.('[data-approve-order]')||t.closest?.('[data-pending-order]')||t.closest?.('[data-refund-order]')||t.closest?.('[data-reject-order]')||t.closest?.('[data-release-order]')||t.closest?.('[data-safe-release-order]'))setTimeout(()=>load(false),450);if(t.closest?.('#imaraLoginBtn')){setTimeout(()=>load(false),1400);setTimeout(()=>load(false),3000);}},true);document.addEventListener('input',e=>{if(e.target?.id==='posPromos'||e.target?.id==='posSingles')paint();},true);document.addEventListener('change',e=>{if(e.target?.matches?.('#posPeople [data-p-card]'))paint();},true);}
window.IMARA_INVENTORY_POS={load,activate:activateManual,deactivate:deactivateManual,manual:()=>[...manualIds()]};
css();wire();setTimeout(()=>load(false),1400);
})();