/* Bingo IMARA · ciclo de ronda 2026
   Controles claros para preparar, abrir y cerrar una ronda.
   Estabilidad: la nube confirma antes de modificar el estado local. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraRoundLifecycle2026)return;window.__imaraRoundLifecycle2026=true;
const STABILITY_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-stability';
const SESSION='imaraPrivateSessionV1';
let busy=false,wiredCapture=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
function token(){return sessionStorage.getItem(SESSION)||'';}
function nextName(name){const m=String(name||'').match(/^(.*?)(\d+)\s*$/);return m?`${m[1]}${Number(m[2])+1}`:'Ronda 2';}
function orderedPrizes(){return Array.isArray(state?.prizes)?state.prizes:[];}
function nextPrize(){const used=(state.winners||[]).map(w=>String(w.prize||'').toLowerCase());return orderedPrizes().find(p=>p.title&&!used.some(t=>t.includes(String(p.title).toLowerCase())))||orderedPrizes()[0]||null;}
function prizePayload(p){if(!p)return {prize:'',prizeTitle:'',prizeDescription:'',prizeImage:'',prizeId:'',reveal:false};const i=orderedPrizes().findIndex(x=>x.id===p.id),ord=typeof ordinalPrizeLabel==='function'?ordinalPrizeLabel(i):`Premio ${i+1}`;return {prize:[ord,p.title,p.description].filter(Boolean).join(' · '),prizeTitle:p.title||'',prizeDescription:p.description||'',prizeImage:p.image||'',prizeId:p.id,reveal:p.showPublic!==false};}
async function stability(action,payload){
 const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),12000);
 try{
  const r=await fetch(STABILITY_API,{method:'POST',headers:{'Content-Type':'application/json',...(token()?{Authorization:'Bearer '+token()}:{})},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'No fue posible sincronizar la ronda.');return d;
 }finally{clearTimeout(tm);}
}
function readForm(){return {name:document.getElementById('roundName')?.value.trim()||state.round?.name||'Ronda',pattern:document.getElementById('roundPattern')?.value||state.round?.pattern||'line',prize:document.getElementById('roundPrize')?.value.trim()||state.round?.prize||'',reveal:document.getElementById('prizeReveal')?.value==='yes'};}
function syncForm(){const r=state.round||{};const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v;};set('roundName',r.name||'Ronda');set('roundPattern',r.pattern||'line');set('roundPrize',r.prize||'');set('prizeReveal',r.reveal?'yes':'no');set('roundStatus',r.status||'closed');const sel=document.getElementById('roundPrizeSelect');if(sel&&r.prizeId)sel.value=r.prizeId;}
function labelPattern(p){return typeof patternName==='function'?patternName(p):p;}
function panel(){let p=document.getElementById('roundLifecycle2026');if(p)return p;const game=document.getElementById('view-game');if(!game)return null;p=document.createElement('div');p.id='roundLifecycle2026';p.className='card';p.style.marginBottom='16px';game.prepend(p);return p;}
function render(){if(!isAdmin()||typeof state==='undefined')return;const p=panel();if(!p)return;const r=state.round||{},open=r.status==='open',prize=r.prizeTitle||r.prize||'Premio por definir';p.innerHTML=`<div class="section-title"><div><h3>🎮 Control de la ronda</h3><div class="muted">Flujo recomendado: preparar → elegir figura/premio → abrir → jugar → cerrar.</div></div><span class="badge ${open?'Pagado':'Anulado'}">${open?'EN JUEGO':'CERRADA / PREPARADA'}</span></div><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0"><div class="notice"><strong>${esc(r.name||'Ronda')}</strong><br><small>${esc(labelPattern(r.pattern||'line'))}</small></div><div class="notice"><strong>🎁 Premio</strong><br><small>${esc(prize)}</small></div><div class="notice"><strong>🎱 Balotas</strong><br><small>${Array.isArray(state.drawn)?state.drawn.length:0} llamadas</small></div></div><div class="actions"><button class="btn primary" id="roundOpen2026" ${open||busy?'disabled':''}>▶ Abrir ronda</button><button class="btn bad" id="roundClose2026" ${!open||busy?'disabled':''}>⏹ Cerrar ronda</button><button class="btn" id="roundPrepare2026" ${busy?'disabled':''}>✨ Preparar siguiente ronda</button></div><div class="footer-note">La siguiente ronda toma automáticamente el próximo premio disponible según el orden definido en Configuración. Puedes cambiarlo antes de abrir la ronda.</div>`;p.querySelector('#roundOpen2026')?.addEventListener('click',openRound);p.querySelector('#roundClose2026')?.addEventListener('click',closeRound);p.querySelector('#roundPrepare2026')?.addEventListener('click',prepareNext);}
function applyServer(d,fallbackDrawn,fallbackRound){
 state.drawn=Array.isArray(d?.game?.drawn)?d.game.drawn.map(Number):fallbackDrawn;
 state.round=d?.game?.round&&typeof d.game.round==='object'?d.game.round:fallbackRound;
 window.IMARA_STABILITY?.markCommitted?.(d?.game,d?.winners);
 syncForm();
 if(typeof saveState==='function')saveState();
 render();
}
async function commit(action,nextDrawn,nextRound,successText){
 if(busy)return false;busy=true;render();
 try{
  const d=await stability(action,{drawn:nextDrawn,round:nextRound});
  applyServer(d,nextDrawn,nextRound);
  toast?.(successText);
  return true;
 }catch(e){
  syncForm();render();
  alert(`⚠️ No se cambió la ronda. La nube no confirmó la operación.\n\n${e.name==='AbortError'?'El servidor tardó demasiado. Intenta nuevamente.':e.message}`);
  return false;
 }finally{busy=false;render();}
}
async function openRound(){const f=readForm(),next={...(state.round||{}),...f,status:'open',startedAt:new Date().toISOString(),endedAt:null,bannedCards:[]};await commit('round-commit',[...(state.drawn||[])],next,`▶ ${next.name} abierta`);}
async function closeRound(){const next={...(state.round||{}),status:'closed',endedAt:new Date().toISOString()};await commit('round-commit',[...(state.drawn||[])],next,`⏹ ${next.name} cerrada`);}
async function prepareNext(){if(state.round?.status==='open'&&!confirm('La ronda actual está abierta. ¿Quieres cerrarla y preparar la siguiente?'))return;const p=nextPrize(),next={name:nextName(state.round?.name),pattern:state.round?.pattern||'line',...prizePayload(p),status:'closed',startedAt:null,endedAt:null,bannedCards:[]};await commit('round-commit',[],next,`✨ ${next.name} preparada${p?.title?' · '+p.title:''}`);}
async function saveConfiguredRound(){
 const f=readForm(),status=document.getElementById('roundStatus')?.value||state.round?.status||'closed';
 const next={...(state.round||{}),...f,status};
 await commit('game-sync',[...(state.drawn||[])],next,`✅ ${next.name} guardada`);
}
function wire(){
 document.querySelector('[data-view="game"]')?.addEventListener('click',()=>setTimeout(()=>{syncForm();render();},80));
 if(!wiredCapture){wiredCapture=true;document.addEventListener('click',e=>{const b=e.target.closest?.('#saveRoundBtn');if(!b||!isAdmin())return;e.preventDefault();e.stopImmediatePropagation();saveConfiguredRound();},true);}
}
function wait(){if(isAdmin()&&typeof state!=='undefined'){wire();render();return;}setTimeout(wait,450);}wait();
})();