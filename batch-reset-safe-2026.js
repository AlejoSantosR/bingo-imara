/* Bingo IMARA · Restablecer lote SAFE 2026
   Admin: limpia cartones NO VENDIDOS de un lote de 20 y los devuelve a Disponible · Sin asignar.
   Protege Pagados/Ganadores y libera pedidos POS completos si una promo cruza de lote.
   Sin MutationObserver ni polling permanente. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;

const PRIVATE_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const FIN_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-finance';
const SESSION_KEY='imaraPrivateSessionV1';
const LOCAL_KEY='bingoImaraStateV2';
const BATCH_SIZE=20;
let wired=false,busy=false,lastCards=[];

function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
function role(){const c=document.querySelector('#imaraUserChip .imara-role');if(!c)return '';if(c.classList.contains('admin'))return 'admin';if(c.classList.contains('finance'))return 'finance';if(c.classList.contains('member'))return 'member';return '';}
function num(id){const m=String(id||'').match(/(\d+)$/);return m?Number(m[1]):NaN;}
function sortCards(a,b){const na=num(a.id),nb=num(b.id);if(Number.isFinite(na)&&Number.isFinite(nb)&&na!==nb)return na-nb;return String(a.id).localeCompare(String(b.id),undefined,{numeric:true});}
function parsePos(raw){const m=String(raw||'').match(/^POS:([A-Z0-9]{6}):(P|S):([A-Z]{2})$/);return m?{code:m[1],kind:m[2]}:null;}
async function call(url,action,payload={}){if(!token())throw new Error('Sesión no disponible.');const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),12000);try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});let d={};try{d=await r.json()}catch(e){}if(!r.ok)throw new Error(d.error||'No fue posible completar la operación.');return d;}finally{clearTimeout(tm);}}
const pApi=(a,p={})=>call(PRIVATE_API,a,p),fApi=(a,p={})=>call(FIN_API,a,p);
function chunks(cards){const s=[...(cards||[])].sort(sortCards),out=[];for(let i=0;i<s.length;i+=BATCH_SIZE)out.push(s.slice(i,i+BATCH_SIZE));return out;}
function protectedCard(c){return !['disponible','pendiente','emitido'].includes(String(c?.status||'').toLowerCase());}
function css(){if(document.getElementById('imaraBatchResetCss'))return;const s=document.createElement('style');s.id='imaraBatchResetCss';s.textContent=`.batch-reset-panel{margin-top:10px;padding:12px;border:1px solid rgba(255,191,71,.28);border-radius:15px;background:rgba(255,191,71,.055)}.batch-reset-row{display:flex;gap:8px;align-items:end;flex-wrap:wrap}.batch-reset-row label{display:grid;gap:4px;min-width:230px;font-size:10px;color:var(--muted)}.batch-reset-note{margin-top:7px;font-size:10px;color:var(--muted)}`;document.head.appendChild(s);}

async function loadCards(){if(role()!=='admin'||!token())return [];const d=await pApi('cards');lastCards=d.cards||[];return lastCards;}
function renderPanel(cards=lastCards){if(role()!=='admin')return;const banner=document.getElementById('cardsBatchBanner'),view=document.getElementById('view-cards');if(!banner||!view)return;let panel=document.getElementById('batchResetSafePanel');if(!panel){panel=document.createElement('div');panel.id='batchResetSafePanel';panel.className='batch-reset-panel';banner.after(panel);}const batches=chunks(cards);if(!batches.length){panel.innerHTML='<strong>♻️ Restablecer lote</strong><div class="batch-reset-note">Primero genera cartones.</div>';return;}const old=Number(panel.querySelector('#batchResetSelect')?.value||0);const options=batches.map((b,i)=>{const first=b[0]?.id||'—',last=b.at(-1)?.id||'—',pending=b.filter(c=>String(c.status).toLowerCase()==='pendiente').length,available=b.filter(c=>String(c.status).toLowerCase()==='disponible').length,protectedN=b.filter(protectedCard).length;return `<option value="${i}">Lote ${i+1} · ${first} → ${last} · ${available} disponibles${pending?` · ${pending} emitidos/preventa`:''}${protectedN?` · ${protectedN} protegidos`:''}</option>`;}).join('');panel.innerHTML=`<div class="batch-reset-row"><label>Lote a corregir<select class="input" id="batchResetSelect">${options}</select></label><button class="btn" id="batchResetBtn">♻️ Restablecer no vendidos del lote</button></div><div class="batch-reset-note">Devuelve Disponible/Emitido/Preventa a <strong>Disponible · Sin asignar</strong>. Los Pagados, Ganadores u otros estados finales no se tocan. El precio se definirá después únicamente desde POS: 30K individual o 25K en promo.</div>`;const sel=panel.querySelector('#batchResetSelect');if(sel&&old<batches.length)sel.value=String(old);panel.querySelector('#batchResetBtn')?.addEventListener('click',resetSelectedBatch);}
async function refreshPanel(showError=false){if(role()!=='admin'||!token())return;try{renderPanel(await loadCards());}catch(e){if(showError)alert(e.name==='AbortError'?'El servidor tardó demasiado. Intenta otra vez.':e.message);}}

function resetLocal(ids,protectedIds){if(typeof state==='undefined'||!Array.isArray(state.cards))return;let changed=false;for(const c of state.cards){if(!ids.has(c.id)||protectedIds.has(c.id))continue;c.status='Disponible';c.buyer='';c.phone='';c.paidAt='';changed=true;}if(changed){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(state));}catch(e){}if(typeof renderAll==='function')renderAll();}}
async function getAllSales(){try{return (await fApi('finance-list')).sales||[];}catch(e){return (await pApi('sales')).sales||[];}}
async function releasePendingRow(row){try{await pApi('sale-release',{sale_id:row.id});return 'released';}catch(first){await fApi('finance-update',{sale_id:row.id,payment_status:'rejected',amount:Number(row.amount)||0,note:'Restablecimiento de lote por error de asignación'});return 'rejected';}}

async function resetSelectedBatch(){if(role()!=='admin'||busy)return;const idx=Number(document.getElementById('batchResetSelect')?.value||0);busy=true;const btn=document.getElementById('batchResetBtn'),old=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='Revisando…';}try{
 const cards=await loadCards(),batches=chunks(cards),batch=batches[idx];if(!batch?.length)throw new Error('No se encontró ese lote.');
 const batchIds=new Set(batch.map(c=>c.id)),protectedRows=batch.filter(protectedCard),protectedIds=new Set(protectedRows.map(c=>c.id));
 const sales=await getAllSales(),pending=sales.filter(s=>s.payment_status==='pending');
 const direct=pending.filter(s=>batchIds.has(s.card_id)),codes=new Set(direct.map(s=>parsePos(s.payment_method)?.code).filter(Boolean));
 const targets=pending.filter(s=>batchIds.has(s.card_id)||(parsePos(s.payment_method)?.code&&codes.has(parsePos(s.payment_method).code)));
 const resetIds=new Set([...batchIds,...targets.map(s=>s.card_id)]);
 const first=batch[0]?.id||'—',last=batch.at(-1)?.id||'—';
 const protectedMsg=protectedRows.length?`\n\nSe conservarán ${protectedRows.length} cartón(es) protegidos: ${protectedRows.slice(0,8).map(c=>`${c.id} (${c.status})`).join(', ')}${protectedRows.length>8?'…':''}`:'';
 const cross=targets.filter(s=>!batchIds.has(s.card_id)).length;
 if(!confirm(`¿Restablecer los cartones NO VENDIDOS del Lote ${idx+1} (${first} → ${last})?\n\n${targets.length} asignación(es)/preventa(s) serán liberadas. Los cartones volverán a Disponible · Sin asignar y dejarán de heredar $30.000.${cross?`\nSe liberarán además ${cross} cartón(es) fuera del lote porque pertenecen al mismo pedido/promoción.`:''}${protectedMsg}`))return;
 if(btn)btn.textContent='Liberando…';
 let released=0;for(const row of targets){await releasePendingRow(row);released++;}
 resetLocal(resetIds,protectedIds);
 const fresh=await loadCards();renderPanel(fresh);
 document.getElementById('posRefresh')?.click();
 const still=fresh.filter(c=>resetIds.has(c.id)&&String(c.status).toLowerCase()==='pendiente');
 if(still.length)alert(`⚠️ Se procesaron ${released} asignaciones, pero ${still.length} cartón(es) siguen pendientes en nube: ${still.slice(0,8).map(c=>c.id).join(', ')}. Actualiza e intenta nuevamente.`);else alert(`✅ Lote ${idx+1} corregido.\nLos cartones no vendidos quedaron Disponible · Sin asignar.\nA partir de ahora POS definirá 30K individual o 25K promo.`);
 }catch(e){alert(e.name==='AbortError'?'El servidor tardó demasiado. Intenta otra vez.':e.message);}finally{busy=false;if(btn){btn.disabled=false;btn.textContent=old||'♻️ Restablecer no vendidos del lote';}}}

function schedule(){[150,750,1700].forEach(ms=>setTimeout(()=>refreshPanel(false),ms));}
function wire(){if(wired)return;wired=true;document.addEventListener('click',e=>{const t=e.target;if(t.closest?.('.nav [data-view="cards"]')||t.closest?.('#confirmGenerateBtn')||t.closest?.('#generateNextBatch20')||t.closest?.('[data-release-order]')||t.closest?.('[data-safe-release-order]')||t.closest?.('[data-reject-order]')||t.closest?.('[data-approve-order]'))schedule();if(t.closest?.('#imaraLoginBtn'))[1100,2700].forEach(ms=>setTimeout(()=>refreshPanel(false),ms));},true);}
function boot(){css();wire();[1200,3000].forEach(ms=>setTimeout(()=>refreshPanel(false),ms));}
boot();
})();
