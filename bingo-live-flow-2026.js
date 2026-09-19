/* Bingo IMARA · BINGO LIVE V3 · controlador único de avisos y desempate
   Cartón móvil -> Admin/Juego/Inicio -> pantalla pública -> 1/2/3 -> ruleta de empate.
   No modifica POS, precios, inventario ni reglas del sorteo. */
(function(){
'use strict';
if(location.hash.startsWith('#mobile='))return;
if(window.__imaraBingoLiveV3)return;window.__imaraBingoLiveV3=true;

const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const SESSION_KEY='imaraPrivateSessionV1';
const IS_PUBLIC=location.hash.startsWith('#public');
const PUBLIC_POLL=800;
const COUNT_MS=3000;
const TIE_MS=7000;
let claims=[],candidates=[],show={type:'idle'};
let lastClaimSig='',publishing=false,tieStarting=false,tieResolving=false;
let publicTimer=null,paintTimer=null,lastRealtimeShowSig='';

const esc=s=>typeof escapeHtml==='function'?escapeHtml(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
async function api(action,payload={},auth=true){
  const headers={'Content-Type':'application/json'};
  if(auth&&token())headers.Authorization='Bearer '+token();
  const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),10000);
  try{
    const r=await fetch(API,{method:'POST',headers,cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});
    let d={};try{d=await r.json();}catch(e){}
    if(!r.ok)throw new Error(d.error||'No fue posible completar la operación.');
    return d;
  }finally{clearTimeout(tm);}
}
function uniq(list){const m=new Map();for(const c of list||[]){if(!c?.card_id)continue;const k=String(c.card_id);const old=m.get(k)||{};m.set(k,{...old,...c,card_id:k,buyer_alias:String(c.buyer_alias||old.buyer_alias||'')});}return [...m.values()];}
function announced(){return uniq(claims.map(c=>({card_id:c.card_id,buyer_alias:c.buyer_alias||'',valid:c.valid===true,claim:true})));}
function valid(){
  return uniq([
    ...(candidates||[]).map(c=>({card_id:c.card_id,buyer_alias:c.buyer_alias||'',valid:true})),
    ...(claims||[]).filter(c=>c.valid===true).map(c=>({card_id:c.card_id,buyer_alias:c.buyer_alias||'',valid:true}))
  ]);
}
function allVisible(){return uniq([...announced(),...valid()]);}
function signature(list){return uniq(list).map(c=>String(c.card_id)).sort().join('|');}
function person(c){return String(c?.buyer_alias||c?.card_id||'Participante').trim()||'Participante';}

function css(){
 if(document.getElementById('bingoLiveV3Css'))return;
 const s=document.createElement('style');s.id='bingoLiveV3Css';s.textContent=`
 #bingoControl2026{display:none!important}
 body.imara-bingo-v3-private #imaraShowOverlay,body.imara-bingo-v3-private #winnerCountdownOverlay{display:none!important}
 .b3-panel{margin-top:16px;padding:16px;border:1px solid rgba(255,208,73,.38);border-radius:20px;background:linear-gradient(145deg,rgba(255,208,73,.08),rgba(141,107,255,.05));box-shadow:0 14px 38px rgba(0,0,0,.16)}
 .b3-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}.b3-title{font-weight:1000;font-size:17px;color:#ffe39a}.b3-list{display:grid;gap:8px;margin-top:11px}.b3-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 11px;border:1px solid var(--line);border-radius:14px;background:#10182a}.b3-row small{color:var(--muted)}.b3-actions{display:flex;gap:8px;flex-wrap:wrap}.b3-tie{margin-top:10px;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,179,71,.42);background:rgba(255,179,71,.08);font-weight:900;color:#ffd792}
 .b3-overlay{position:fixed;inset:0;z-index:2147482000;display:grid;place-items:center;padding:20px;background:radial-gradient(circle at 50% 42%,rgba(92,66,16,.36),rgba(4,7,13,.95) 68%);backdrop-filter:blur(10px)}.b3-overlay.hidden{display:none!important}.b3-overlay.public{pointer-events:none}.b3-overlay.admin{pointer-events:auto}
 .b3-card{width:min(940px,95vw);text-align:center;padding:36px 24px;border-radius:34px;border:1px solid rgba(255,218,102,.5);background:linear-gradient(150deg,rgba(24,22,28,.99),rgba(52,37,12,.98));box-shadow:0 35px 120px #000c,0 0 90px rgba(255,194,55,.2);overflow:hidden;position:relative}.b3-card::before{content:"";position:absolute;inset:-80% -30%;background:linear-gradient(105deg,transparent 42%,rgba(255,245,190,.17) 50%,transparent 58%);animation:b3Sweep 2.3s ease-in-out infinite;pointer-events:none}
 .b3-kicker{position:relative;font-size:12px;letter-spacing:3px;font-weight:1000;color:#ffe5a1}.b3-main{position:relative;font-size:clamp(58px,11vw,128px);font-weight:1000;line-height:.92;margin:16px 0;background:linear-gradient(180deg,#fff9d9,#ffd559 48%,#ae7207);-webkit-background-clip:text;background-clip:text;color:transparent}.b3-name{position:relative;font-size:clamp(25px,4.8vw,54px);font-weight:1000;color:#fff3c8}.b3-sub{position:relative;margin-top:10px;color:#d8d1c2;font-size:clamp(13px,2vw,20px)}.b3-clock{position:relative;width:88px;height:88px;margin:18px auto 4px;border-radius:50%;display:grid;place-items:center;border:4px solid #ffd559;background:#171309;color:#fff1be;font-size:36px;font-weight:1000;box-shadow:0 0 34px rgba(255,198,45,.22)}.b3-overlay-actions{position:relative;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:20px}
 .b3-wheel-wrap{position:relative;width:min(420px,74vw);aspect-ratio:1;margin:22px auto 8px}.b3-wheel{position:absolute;inset:0;border-radius:50%;border:10px solid #e5b93e;box-shadow:0 0 0 5px #4d390d,0 0 70px rgba(255,192,43,.28);background:conic-gradient(#f7cf56 0 25%,#7b4ddb 25% 50%,#f39b3d 50% 75%,#d94a7d 75% 100%);animation:b3Spin .55s linear infinite}.b3-wheel::after{content:"";position:absolute;inset:22%;border-radius:50%;background:#15110a;border:4px solid #ffe18b}.b3-pointer{position:absolute;z-index:3;left:50%;top:-8px;transform:translateX(-50%);width:0;height:0;border-left:18px solid transparent;border-right:18px solid transparent;border-top:0;border-bottom:34px solid #fff0b8;filter:drop-shadow(0 3px 4px #0008)}.b3-wheel-name{position:absolute;z-index:4;inset:34%;display:grid;place-items:center;text-align:center;font-size:clamp(18px,4vw,34px);font-weight:1000;color:#fff2bf;line-height:1.05}.b3-tie-list{position:relative;font-weight:900;color:#ffdca1}
 @keyframes b3Sweep{0%,55%{transform:translateX(-52%)}88%,100%{transform:translateX(52%)}}@keyframes b3Spin{to{transform:rotate(360deg)}}
 @media(max-width:640px){.b3-card{padding:27px 15px}.b3-row{align-items:flex-start;flex-direction:column}.b3-clock{width:72px;height:72px;font-size:30px}}
 `;document.head.appendChild(s);
}
function overlay(){let o=document.getElementById('bingoLiveV3Overlay');if(!o){o=document.createElement('div');o.id='bingoLiveV3Overlay';o.className='b3-overlay hidden';document.body.appendChild(o);}o.classList.toggle('public',IS_PUBLIC);o.classList.toggle('admin',!IS_PUBLIC);return o;}
function hideOverlay(){overlay().classList.add('hidden');}

function mountPanels(){
 if(IS_PUBLIC||!isAdmin())return;
 const list=allVisible(),wins=valid();
 const dash=document.getElementById('view-dashboard');
 if(dash){let p=document.getElementById('bingoV3Dash');if(!p){p=document.createElement('div');p.id='bingoV3Dash';p.className='b3-panel';dash.querySelector('.grid.kpis')?.after(p);}renderPanel(p,list,wins,'Inicio');}
 const game=document.getElementById('view-game');
 if(game){let p=document.getElementById('bingoV3Game');if(!p){p=document.createElement('div');p.id='bingoV3Game';p.className='b3-panel';const auto=document.getElementById('autoWinnerStatus')?.closest('.card');(auto||game.firstElementChild)?.after(p);}renderPanel(p,list,wins,'Juego');}
}
function renderPanel(p,list,wins,where){
 const claimIds=new Set(announced().map(c=>String(c.card_id)));
 p.innerHTML=`<div class="b3-head"><div><div class="b3-title">📣 Centro de BINGO · ${where}</div><div class="muted" style="margin-top:3px">Avisos del cartón digital y ganadores detectados por el sistema.</div></div><div class="b3-actions"><button class="btn" data-b3-refresh>↻ Actualizar</button><button class="btn primary" data-b3-count>🎙️ BINGO · 1, 2 y 3</button></div></div>${wins.length>1?`<div class="b3-tie">🔥 Empate válido detectado entre ${wins.length} cartones. La ruleta se abrirá automáticamente.</div>`:''}<div class="b3-list">${list.length?list.map(c=>`<div class="b3-row"><div><strong>${claimIds.has(String(c.card_id))?'📱':'✨'} ${esc(person(c))}</strong><br><small>${esc(c.card_id)} · ${c.valid===true?'BINGO válido':'BINGO anunciado · pendiente de validación'}</small></div><button class="mini" data-b3-review="${esc(c.card_id)}">🔎 Revisar cartón</button></div>`).join(''):'<div class="muted">Todavía no hay avisos de BINGO. Puedes usar “BINGO · 1, 2 y 3” para hacer el llamado final.</div>'}</div>`;
}
function review(id){const nav=document.querySelector('.nav [data-view="validate"]');if(nav)nav.click();else if(typeof showView==='function')showView('validate');setTimeout(()=>{const i=document.getElementById('winnerInput');if(i)i.value=id;document.getElementById('validateBtn')?.click();},100);}

async function setShow(next){const d=await api('show-set',{show_state:next});show=d.show_state||next;paint();return show;}
async function refreshOverview(){const o=await api('overview',{},false);show=o.game?.show_state||{type:'idle'};return o;}
async function refreshClaims(){
 const b=await api('bingo-claims');claims=Array.isArray(b.claims)?b.claims:[];candidates=Array.isArray(b.candidates)?b.candidates:[];mountPanels();
 const a=announced(),sig=signature(a),v=valid();
 if(a.length&&sig&&sig!==lastClaimSig&&!publishing){
   lastClaimSig=sig;await publishClaim(a);
   if(v.length>=2)setTimeout(()=>maybeAutoTie(v),1600);
   return;
 }
 if(v.length>=2){await maybeAutoTie(v);return;}
 if(!a.length)lastClaimSig='';
}
async function publishClaim(list){
 if(publishing)return;publishing=true;
 try{
   const o=await refreshOverview(),cur=o.game?.show_state||{type:'idle'};
   if(['winner','tie'].includes(cur.type))return;
   const merged=uniq([...(cur.type==='bingo_live_claim'?(cur.candidates||[]):[]),...list]);
   await setShow({type:'bingo_live_claim',at:new Date().toISOString(),round_name:o.game?.round?.name||'Ronda',candidates:merged});
 }catch(e){console.warn('BINGO V3 aviso:',e.message||e);}finally{publishing=false;}
}
async function startCountdown(){
 try{await refreshClaims();}catch(e){}
 const list=allVisible();
 try{await setShow({type:'bingo_countdown',started_at:new Date().toISOString(),interval_ms:COUNT_MS,round_name:(typeof state!=='undefined'&&state.round?.name)||'Ronda',candidates:list.map(c=>({card_id:c.card_id,buyer_alias:c.buyer_alias||''}))});}
 catch(e){alert(e.message);}
}
async function continueGame(){
 const ids=uniq([...(show.candidates||[]),...announced()]).map(c=>c.card_id);
 try{if(ids.length)await api('bingo-reject',{card_ids:ids});await setShow({type:'idle'});claims=[];candidates=[];lastClaimSig='';mountPanels();}
 catch(e){alert(e.message);}
}
async function confirmOne(id){try{await api('winner-confirm',{card_id:id});await refreshOverview();paint();}catch(e){alert(e.message);}}
async function maybeAutoTie(v=valid()){
 if(v.length<2||tieStarting||tieResolving)return;
 if(['tie','winner'].includes(show?.type))return;
 tieStarting=true;
 try{await setShow({type:'tie',started_at:new Date().toISOString(),duration_ms:TIE_MS,round_name:(typeof state!=='undefined'&&state.round?.name)||'Ronda',candidates:v.map(c=>({card_id:c.card_id,buyer_alias:c.buyer_alias||''}))});}
 catch(e){console.warn('BINGO V3 empate:',e.message||e);}finally{tieStarting=false;}
}
async function resolveTieIfNeeded(){
 if(show?.type!=='tie'||tieResolving||!isAdmin())return;
 const start=new Date(show.started_at||0).getTime(),dur=Number(show.duration_ms)||TIE_MS;
 if(!start||Date.now()-start<dur)return;
 const list=uniq(show.candidates||[]);if(list.length<2)return;
 tieResolving=true;
 try{await api('tie-resolve',{card_ids:list.map(c=>c.card_id)});await refreshOverview();paint();}
 catch(e){console.warn('BINGO V3 resolución:',e.message||e);tieResolving=false;}
}

function countdownInfo(s){const start=new Date(s.started_at||0).getTime(),elapsed=Math.max(0,Date.now()-start),interval=Number(s.interval_ms)||COUNT_MS;return {elapsed,stage:Math.min(2,Math.floor(elapsed/interval)),ready:elapsed>=interval*3,remaining:elapsed>=interval*3?0:Math.max(1,3-Math.floor((elapsed%interval)/1000))};}
function paint(){
 const o=overlay(),s=show||{type:'idle'};
 if(s.type==='idle'||!s.type){hideOverlay();return;}
 if(s.type==='bingo_live_claim'){
   const list=uniq(s.candidates||[]),names=list.map(person);
   const who=names.length===1?`BINGO DE ${esc(names[0])}`:names.length===2?`BINGO DE ${esc(names[0])} Y ${esc(names[1])}`:`${names.length} PERSONAS ANUNCIAN BINGO`;
   if(!IS_PUBLIC){o.classList.add('hidden');return;}
   o.classList.remove('hidden');o.innerHTML=`<div class="b3-card"><div class="b3-kicker">BINGO IMARA</div><div class="b3-main">¡BINGO!</div><div class="b3-name">${who}</div></div>`;return;
 }
 if(s.type==='bingo_countdown'){
   const inf=countdownInfo(s),labels=['BINGO A LA 1','BINGO A LAS 2','BINGO A LAS 3'],list=uniq(s.candidates||[]),v=valid();
   if(inf.ready&&v.length>=2&&!IS_PUBLIC)maybeAutoTie(v);
   let actions='';if(inf.ready&&!IS_PUBLIC&&isAdmin()){
     if(v.length===1)actions+=`<button class="btn good" data-b3-confirm="${esc(v[0].card_id)}">✅ Confirmar BINGO</button>`;
     if(v.length>=2)actions+=`<button class="btn warn" data-b3-tie>🔥 Abrir ruleta</button>`;
     actions+=`<button class="btn bad" data-b3-continue>▶ Continuar juego</button>`;
   }
   const name=list.length===1?`Bingo de ${esc(person(list[0]))}`:list.length>1?`${list.length} avisos de BINGO`:'';
   o.classList.remove('hidden');o.innerHTML=`<div class="b3-card"><div class="b3-kicker">BINGO IMARA · LLAMADO DE RONDA</div><div class="b3-main" style="font-size:clamp(44px,8vw,94px)">${labels[inf.stage]}</div>${name?`<div class="b3-name" style="font-size:clamp(20px,3.6vw,38px)">${name}</div>`:''}<div class="b3-clock">${inf.remaining}</div><div class="b3-sub">${inf.ready?'Conteo terminado · valida el resultado o continúa la partida':'3 segundos por llamado'}</div>${actions?`<div class="b3-overlay-actions">${actions}</div>`:''}</div>`;return;
 }
 if(s.type==='tie'){
   const list=uniq(s.candidates||[]),start=new Date(s.started_at||0).getTime(),elapsed=Math.max(0,Date.now()-start),idx=list.length?Math.floor(elapsed/160)%list.length:0,c=list[idx]||{};
   o.classList.remove('hidden');o.innerHTML=`<div class="b3-card"><div class="b3-kicker">🔥 EMPATE · RULETA IMARA 🔥</div><div class="b3-wheel-wrap"><div class="b3-pointer"></div><div class="b3-wheel"></div><div class="b3-wheel-name">${esc(person(c))}</div></div><div class="b3-tie-list">${list.map(x=>esc(person(x))).join(' · ')}</div><div class="b3-sub">La ruleta está definiendo el ganador del desempate…</div></div>`;
   if(!IS_PUBLIC)resolveTieIfNeeded();return;
 }
 if(s.type==='winner'){
   if(!IS_PUBLIC){o.classList.add('hidden');document.getElementById('imaraShowOverlay')?.classList.add('hidden');document.getElementById('winnerCountdownOverlay')?.classList.remove('show');return;}
   const w=s.winner||{};o.classList.remove('hidden');o.innerHTML=`<div class="b3-card"><div class="b3-kicker">🏆 GANADOR CONFIRMADO</div><div class="b3-main">¡BINGO!</div><div class="b3-name">${esc(w.buyer_alias||w.card_id||'GANADOR')}</div><div class="b3-sub">${esc(w.card_id||'')}${w.prize?' · '+esc(w.prize):''}</div></div>`;return;
 }
 hideOverlay();
}

function wire(){
 document.addEventListener('click',e=>{
   const t=e.target;
   if(t.closest?.('[data-b3-refresh]')){e.preventDefault();refreshClaims().catch(err=>alert(err.message));return;}
   if(t.closest?.('[data-b3-count]')){e.preventDefault();startCountdown();return;}
   const r=t.closest?.('[data-b3-review]');if(r){e.preventDefault();review(r.dataset.b3Review);return;}
   const c=t.closest?.('[data-b3-confirm]');if(c){e.preventDefault();confirmOne(c.dataset.b3Confirm);return;}
   if(t.closest?.('[data-b3-continue]')){e.preventDefault();continueGame();return;}
   if(t.closest?.('[data-b3-tie]')){e.preventDefault();maybeAutoTie(valid());return;}
 },true);
}
async function adminTick(){if(!isAdmin()||!token())return;try{await refreshClaims();await refreshOverview();mountPanels();paint();await resolveTieIfNeeded();}catch(e){console.warn('BINGO V3:',e.message||e);}}
function applyRealtime(payload){
 if(!isAdmin()||!payload?.game)return;
 const next=payload.game.show_state||{type:'idle'},sig=JSON.stringify(next);
 show=next;mountPanels();paint();resolveTieIfNeeded();
 if(sig!==lastRealtimeShowSig){
   lastRealtimeShowSig=sig;
   if(['bingo_live_claim','bingo_countdown','tie','winner'].includes(String(next.type||'')))refreshClaims().catch(e=>console.warn('BINGO V3 claims:',e.message||e));
 }
}
async function publicTick(){try{const o=await refreshOverview();window.dispatchEvent(new CustomEvent('imara-public-game-state',{detail:o}));paint();}catch(e){console.warn('BINGO pública V3:',e.message||e);}}
function start(){
 css();wire();
 if(!IS_PUBLIC)document.body.classList.add('imara-bingo-v3-private');
 paintTimer=setInterval(paint,160);
 if(IS_PUBLIC){publicTick();publicTimer=setInterval(publicTick,PUBLIC_POLL);return;}
 window.addEventListener('imara-game-realtime',e=>applyRealtime(e.detail));
 const wait=()=>{if(isAdmin()&&token()){adminTick();return;}setTimeout(wait,500);};wait();
}
start();
})();