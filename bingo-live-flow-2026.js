/* Bingo IMARA · BINGO en vivo 2026 · V1.2
   Reclamo móvil -> aviso público -> dashboard -> conteo 1/2/3 -> confirmar/continuar/desempatar.
   Capa aditiva: conserva motor, ganador y desempate existentes. */
(function(){
'use strict';
if(location.hash.startsWith('#mobile='))return;

const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const SESSION_KEY='imaraPrivateSessionV1';
const IS_PUBLIC=location.hash.startsWith('#public');
const POLL_MS=850;
const COUNT_MS=3000;
let claims=[],candidates=[],liveShow={type:'idle'},lastClaimSig='',publishing=false,watchClaims=true;

const esc=s=>typeof escapeHtml==='function'?escapeHtml(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
async function api(action,payload={},auth=true){
 const headers={'Content-Type':'application/json'};if(auth&&token())headers.Authorization='Bearer '+token();
 const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),10000);
 try{const r=await fetch(API,{method:'POST',headers,cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});let d={};try{d=await r.json();}catch(e){}if(!r.ok)throw new Error(d.error||'No fue posible completar la operación.');return d;}finally{clearTimeout(tm);}
}
function installCss(){if(document.getElementById('bingoLiveFlowCss'))return;const s=document.createElement('style');s.id='bingoLiveFlowCss';s.textContent=`
 .bingo-live-overlay{position:fixed;inset:0;z-index:1000010;display:grid;place-items:center;padding:22px;background:radial-gradient(circle at 50% 44%,rgba(78,55,12,.38),rgba(5,8,15,.94) 66%);backdrop-filter:blur(10px);pointer-events:none}.bingo-live-overlay.hidden{display:none!important}.bingo-live-card{width:min(920px,94vw);padding:36px 24px;border-radius:34px;text-align:center;border:1px solid rgba(255,215,102,.45);background:linear-gradient(150deg,rgba(25,23,31,.98),rgba(48,35,13,.98));box-shadow:0 35px 120px #000c,0 0 90px rgba(255,194,55,.22);position:relative;overflow:hidden}.bingo-live-card::before{content:"";position:absolute;inset:-60% -20%;background:linear-gradient(105deg,transparent 40%,rgba(255,241,176,.18) 50%,transparent 60%);animation:bingoGoldSweep 2.4s ease-in-out infinite;pointer-events:none}.bingo-live-kicker{font-size:12px;letter-spacing:3px;font-weight:1000;color:#ffe7a8;text-transform:uppercase}.bingo-live-main{font-size:clamp(58px,11vw,128px);font-weight:1000;line-height:.92;margin:16px 0;background:linear-gradient(180deg,#fff8d7,#ffd65a 48%,#b97808);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 12px 45px rgba(255,188,32,.14)}.bingo-live-name{font-size:clamp(24px,4.7vw,52px);font-weight:1000;color:#fff5cf}.bingo-live-sub{margin-top:10px;color:#d9d3c4;font-size:clamp(13px,2vw,20px)}.bingo-live-clock{width:86px;height:86px;margin:18px auto 4px;border-radius:50%;display:grid;place-items:center;border:4px solid #ffd65a;background:#17140c;color:#fff4c7;font-size:36px;font-weight:1000;box-shadow:0 0 32px rgba(255,198,45,.22)}.bingo-live-actions{pointer-events:auto;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px}
 .bingo-live-dashboard{margin:14px 0;padding:15px;border:1px solid rgba(255,202,58,.42);border-radius:20px;background:linear-gradient(145deg,rgba(255,202,58,.10),rgba(141,107,255,.055));box-shadow:0 14px 38px rgba(0,0,0,.18)}.bingo-live-dashboard-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}.bingo-live-dashboard-title{font-size:16px;font-weight:1000;color:#ffe49a}.bingo-live-dashboard-list{display:grid;gap:8px;margin-top:10px}.bingo-live-row{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 11px;border-radius:14px;border:1px solid var(--line);background:#10182a}.bingo-live-row small{color:var(--muted)}
 .bingo-live-call123{margin-left:8px}
 @keyframes bingoGoldSweep{0%,55%{transform:translateX(-50%)}85%,100%{transform:translateX(50%)}}
 @media(max-width:620px){.bingo-live-card{padding:28px 16px}.bingo-live-row{align-items:flex-start;flex-direction:column}.bingo-live-clock{width:72px;height:72px;font-size:30px}.bingo-live-call123{margin-left:0;margin-top:8px}}
 `;document.head.appendChild(s);}
function unionCandidates(){const m=new Map();(candidates||[]).forEach(c=>m.set(String(c.card_id),{card_id:c.card_id,buyer_alias:c.buyer_alias||'',claim:false}));(claims||[]).filter(c=>c.valid).forEach(c=>m.set(String(c.card_id),{card_id:c.card_id,buyer_alias:c.buyer_alias||'',claim:true}));return [...m.values()];}
function validClaims(){return (claims||[]).filter(c=>c.valid).map(c=>({card_id:c.card_id,buyer_alias:c.buyer_alias||''}));}
function claimSig(list=validClaims()){return (list||[]).map(c=>String(c.card_id)).sort().join('|');}
function mergeCandidates(a,b){const m=new Map();[...(a||[]),...(b||[])].forEach(c=>{if(c?.card_id)m.set(String(c.card_id),{card_id:c.card_id,buyer_alias:c.buyer_alias||''});});return [...m.values()];}
function publicName(c){return String(c?.buyer_alias||'Participante').trim()||'Participante';}

function ensureOverlay(){let o=document.getElementById('bingoLiveOverlay');if(o)return o;o=document.createElement('div');o.id='bingoLiveOverlay';o.className='bingo-live-overlay hidden';document.body.appendChild(o);return o;}
function renderLive(){
 const o=ensureOverlay(),show=liveShow||{type:'idle'};
 if(show.type==='bingo_live_claim'){
   if(!IS_PUBLIC){o.classList.add('hidden');return;}
   const cs=Array.isArray(show.candidates)?show.candidates:[],names=cs.map(publicName);
   const who=names.length===1?`BINGO DE ${esc(names[0])}`:names.length===2?`BINGO DE ${esc(names[0])} Y ${esc(names[1])}`:`${names.length} BINGOS REPORTADOS`;
   o.classList.remove('hidden');o.innerHTML=`<div class="bingo-live-card"><div class="bingo-live-kicker">BINGO IMARA</div><div class="bingo-live-main">¡BINGO!</div><div class="bingo-live-name">${who}</div></div>`;return;
 }
 if(show.type==='bingo_countdown'){
   const start=new Date(show.started_at||0).getTime(),elapsed=Math.max(0,Date.now()-start),cs=Array.isArray(show.candidates)?show.candidates:[],stage=Math.min(2,Math.floor(elapsed/COUNT_MS)),ready=elapsed>=COUNT_MS*3,within=elapsed%COUNT_MS,remaining=ready?0:Math.max(1,3-Math.floor(within/1000));
   const labels=['BINGO A LA 1','BINGO A LAS 2','BINGO A LAS 3'];
   const names=cs.map(publicName),who=names.length===1?`Bingo de ${esc(names[0])}`:names.length>1?`${names.length} BINGOS válidos`:'';
   let adminActions='';
   if(ready&&!IS_PUBLIC&&isAdmin()){
     if(cs.length===1)adminActions=`<button class="btn good" data-live-confirm="${esc(cs[0].card_id)}">✅ Confirmar BINGO</button>`;
     else if(cs.length>1)adminActions=`<button class="btn warn" id="bingoLiveTie">🔥 Desempatar ${cs.length} BINGOS</button>`;
     adminActions+=`<button class="btn bad" id="bingoLiveContinue">▶ Continuar juego</button>`;
   }
   o.classList.remove('hidden');o.innerHTML=`<div class="bingo-live-card"><div class="bingo-live-kicker">BINGO IMARA · LLAMADO DE RONDA</div><div class="bingo-live-main" style="font-size:clamp(46px,8vw,94px)">${labels[stage]}</div>${who?`<div class="bingo-live-name" style="font-size:clamp(20px,3.5vw,38px)">${who}</div>`:''}<div class="bingo-live-clock">${remaining}</div><div class="bingo-live-sub">${ready?(cs.length?'Conteo terminado · decide confirmar, desempatar o continuar':'Nadie anunció BINGO · puedes continuar el juego'):'3 segundos para anunciar BINGO'}</div>${adminActions?`<div class="bingo-live-actions">${adminActions}</div>`:''}</div>`;return;
 }
 o.classList.add('hidden');
}

function dashboardHost(){return document.getElementById('view-dashboard');}
function renderDashboard(){
 if(IS_PUBLIC||!isAdmin())return;const host=dashboardHost();if(!host)return;const list=unionCandidates();let box=document.getElementById('bingoLiveDashboardAlert');
 if(!list.length){box?.remove();return;}
 if(!box){box=document.createElement('div');box.id='bingoLiveDashboardAlert';box.className='bingo-live-dashboard';const k=host.querySelector('.grid.kpis');k?.after(box);}
 box.innerHTML=`<div class="bingo-live-dashboard-head"><div><div class="bingo-live-dashboard-title">📣 ${list.length===1?'BINGO para revisar':`${list.length} BINGOS para revisar`}</div><div class="muted" style="margin-top:3px">El sistema detectó un cartón válido. Revísalo antes de confirmar al ganador.</div></div><button class="btn primary" id="bingoLiveStart123">🎙️ BINGO · 1, 2 y 3</button></div><div class="bingo-live-dashboard-list">${list.map(c=>`<div class="bingo-live-row"><div><strong>${c.claim?'📱':'✨'} ${esc(c.buyer_alias||c.card_id)}</strong><br><small>${esc(c.card_id)} · ${c.claim?'Avisado desde cartón digital':'Detectado automáticamente'}</small></div><button class="mini" data-bingo-live-review="${esc(c.card_id)}">🔎 Revisar cartón</button></div>`).join('')}</div>`;
}
function reviewCard(id){
 const nav=document.querySelector('.nav [data-view="validate"]');if(nav)nav.click();else if(typeof showView==='function')showView('validate');
 setTimeout(()=>{const input=document.getElementById('winnerInput');if(input)input.value=id;document.getElementById('validateBtn')?.click();},80);
}
function patchOldCenter(){
 const center=document.getElementById('bingoControl2026');if(!center)return;
 const f=center.querySelector('.footer-note');if(f)f.textContent='El llamado BINGO 1, 2 y 3 dura 3 segundos por paso. Si alguien anuncia BINGO, la pantalla pública cambia de inmediato; si nadie lo hace, puedes continuar el juego.';
 const head=center.querySelector('.section-title');if(head&&!head.querySelector('#bingoLiveCall123')){const b=document.createElement('button');b.id='bingoLiveCall123';b.type='button';b.className='btn primary bingo-live-call123';b.textContent='🎙️ Anunciar BINGO · 1, 2 y 3';head.appendChild(b);}
}

async function setShow(show){const d=await api('show-set',{show_state:show});liveShow=d.show_state||show;renderLive();return liveShow;}
async function publishValidClaims(){
 const vc=validClaims(),sig=claimSig(vc);
 if(!sig){lastClaimSig='';return;}if(sig===lastClaimSig||publishing)return;lastClaimSig=sig;publishing=true;
 try{
   const o=await api('overview',{},false),current=o.game?.show_state||{type:'idle'};
   if(current.type==='winner'||current.type==='tie')return;
   const merged=current.type==='bingo_live_claim'?mergeCandidates(current.candidates,vc):vc;
   await setShow({type:'bingo_live_claim',at:new Date().toISOString(),round_name:o.game?.round?.name||'Ronda',candidates:merged});
 }catch(e){console.warn('BINGO en vivo:',e.message);}finally{publishing=false;}
}
async function refreshClaims(){
 if(!token()||!watchClaims)return;
 try{const b=await api('bingo-claims');claims=b.claims||[];candidates=b.candidates||[];renderDashboard();patchOldCenter();await publishValidClaims();}
 catch(e){if(IS_PUBLIC)watchClaims=false;else console.warn('BINGO claims:',e.message);}
}
async function refreshPublicShow(){if(!IS_PUBLIC)return;try{const o=await api('overview',{},false);liveShow=o.game?.show_state||{type:'idle'};renderLive();}catch(e){console.warn('BINGO público:',e.message);}}
async function start123(){
 try{const b=await api('bingo-claims');claims=b.claims||[];candidates=b.candidates||[];}catch(e){}
 const cs=unionCandidates();lastClaimSig=claimSig();
 try{await setShow({type:'bingo_countdown',started_at:new Date().toISOString(),interval_ms:COUNT_MS,round_name:(typeof state!=='undefined'&&state.round?.name)||'Ronda',candidates:cs.map(c=>({card_id:c.card_id,buyer_alias:c.buyer_alias||''}))});document.getElementById('refreshBingo2026')?.click();}
 catch(e){alert(e.message);}
}
async function continueGame(){const cs=Array.isArray(liveShow?.candidates)?liveShow.candidates:unionCandidates();try{if(cs.length)await api('bingo-reject',{card_ids:cs.map(c=>c.card_id)});await setShow({type:'idle'});claims=[];candidates=[];lastClaimSig='';renderDashboard();document.getElementById('refreshBingo2026')?.click();}catch(e){alert(e.message);}}
async function confirmWinner(id){try{await api('winner-confirm',{card_id:id});const o=await api('overview',{},false);liveShow=o.game?.show_state||{type:'idle'};renderLive();document.getElementById('refreshBingo2026')?.click();}catch(e){alert(e.message);}}
async function startTie(){const cs=Array.isArray(liveShow?.candidates)?liveShow.candidates:unionCandidates();if(cs.length<2)return;try{await setShow({type:'tie',started_at:new Date().toISOString(),duration_ms:7000,round_name:(typeof state!=='undefined'&&state.round?.name)||'Ronda',candidates:cs});document.getElementById('refreshBingo2026')?.click();}catch(e){alert(e.message);}}

function wire(){document.addEventListener('click',e=>{
 const t=e.target;
 const oldStart=t.closest?.('#startBingoCountdown');if(oldStart){e.preventDefault();e.stopImmediatePropagation();start123();return;}
 if(t.closest?.('#bingoLiveStart123')||t.closest?.('#bingoLiveCall123')){e.preventDefault();e.stopImmediatePropagation();start123();return;}
 const rev=t.closest?.('[data-bingo-live-review]');if(rev){e.preventDefault();reviewCard(rev.dataset.bingoLiveReview);return;}
 const conf=t.closest?.('[data-live-confirm]');if(conf){e.preventDefault();confirmWinner(conf.dataset.liveConfirm);return;}
 if(t.closest?.('#bingoLiveContinue')){e.preventDefault();continueGame();return;}
 if(t.closest?.('#bingoLiveTie')){e.preventDefault();startTie();return;}
},true);}
function startAdminWatcher(){if(window.__imaraBingoAdminWatcher)return;window.__imaraBingoAdminWatcher=true;refreshClaims();setInterval(refreshClaims,POLL_MS);}
function startPublic(){refreshPublicShow();setInterval(refreshPublicShow,POLL_MS);}
function waitAdmin(n=0){if(isAdmin()&&token()){startAdminWatcher();renderDashboard();patchOldCenter();return;}if(n<40)setTimeout(()=>waitAdmin(n+1),500);}

installCss();wire();setInterval(renderLive,160);
if(IS_PUBLIC)startPublic();else waitAdmin();
})();