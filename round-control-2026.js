/* BINGO IMARA · Control de ronda 2026
   Capa aditiva: no modifica login ni arranque base. */
(function(){
'use strict';
const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const RESET_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-reset';
const SESSION_KEY='imaraPrivateSessionV1';
const IS_PUBLIC=location.hash.startsWith('#public');
const IS_MOBILE=location.hash.startsWith('#mobile=');
let adminPoll=null,showTick=null,currentShow={type:'idle'},latestCandidates=[],latestClaims=[],lastShowSound='',tieResolving=false,lastCelebratedWinner='';
const esc=s=>typeof escapeHtml==='function'?escapeHtml(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

async function api(action,payload={},auth=true){
  const headers={'Content-Type':'application/json'};
  const token=sessionStorage.getItem(SESSION_KEY)||'';
  if(auth&&token)headers.Authorization='Bearer '+token;
  const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),12000);
  try{
    const r=await fetch(API,{method:'POST',headers,cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});
    let d={};try{d=await r.json()}catch(e){}
    if(!r.ok)throw new Error(d.error||'No fue posible completar la operación');
    return d;
  }finally{clearTimeout(tm);}
}
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
function installStyles(){
 if(document.getElementById('roundControl2026Css'))return;
 const s=document.createElement('style');s.id='roundControl2026Css';s.textContent=`
 .round-prize-select-wrap{margin-top:10px;padding:12px;border-radius:14px;background:rgba(141,107,255,.08);border:1px solid rgba(141,107,255,.2)}
 .round-prize-preview{margin-top:8px;font-size:12px;color:var(--muted)}
 .bingo-control-grid{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:start}.bingo-candidates{display:flex;gap:7px;flex-wrap:wrap}.bingo-candidate{padding:8px 10px;border-radius:12px;border:1px solid var(--line);background:#10182a;font-size:12px}.bingo-candidate.claim{border-color:rgba(255,91,143,.55);box-shadow:0 0 18px rgba(255,91,143,.1)}
 .imara-show-overlay{position:fixed;inset:0;z-index:999980;display:grid;place-items:center;padding:22px;background:radial-gradient(circle at 50% 45%,rgba(51,31,82,.8),rgba(5,9,17,.94) 62%);backdrop-filter:blur(12px);pointer-events:none}
 .imara-show-card{width:min(900px,94vw);text-align:center;padding:34px 24px;border-radius:34px;border:1px solid rgba(255,255,255,.2);background:linear-gradient(145deg,rgba(21,29,47,.96),rgba(45,30,78,.96));box-shadow:0 35px 120px rgba(0,0,0,.6),0 0 80px rgba(255,91,143,.18);overflow:hidden;position:relative}
 .imara-show-kicker{font-size:12px;letter-spacing:3px;font-weight:1000;color:#cbd4e5}.imara-show-main{font-size:clamp(48px,9vw,110px);font-weight:1000;line-height:.95;margin:16px 0;text-shadow:0 0 45px rgba(255,91,143,.32)}.imara-show-sub{font-size:clamp(14px,2vw,22px);color:#d3dbea}.imara-show-actions{pointer-events:auto;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:22px}
 .tie-fire{background:radial-gradient(circle at 50% 65%,rgba(255,116,31,.35),transparent 45%),linear-gradient(145deg,#1c1723,#3a1824)!important;box-shadow:0 35px 120px #000b,0 0 90px rgba(255,78,38,.38)!important}.tie-flames{position:absolute;inset:auto 0 0;height:34%;pointer-events:none;background:radial-gradient(ellipse at 15% 100%,rgba(255,191,71,.7),transparent 35%),radial-gradient(ellipse at 45% 100%,rgba(255,78,38,.65),transparent 40%),radial-gradient(ellipse at 78% 100%,rgba(255,191,71,.65),transparent 34%);filter:blur(3px);animation:firePulse .42s ease-in-out infinite alternate}.tie-name{font-size:clamp(34px,7vw,82px);font-weight:1000;color:#fff5d7;text-shadow:0 0 35px #ff6d24,0 0 70px #ff2d55;animation:tiePop .18s ease}.tie-list{position:relative;z-index:2;color:#ffd9b0;font-weight:900;letter-spacing:1px}
 .round-winners-panel{padding:16px;border-radius:20px;background:linear-gradient(160deg,rgba(33,27,59,.96),rgba(18,25,43,.96));border:1px solid rgba(255,255,255,.15);box-shadow:0 18px 50px rgba(0,0,0,.35);animation:winnersSlide .5s cubic-bezier(.2,.9,.25,1)}.round-winners-panel h3{margin:0 0 12px}.round-winner-row{padding:10px 0;border-bottom:1px solid var(--line)}.round-winner-row:last-child{border-bottom:0}.round-winner-row strong{display:block}.round-winner-row small{color:var(--muted)}
 .public-main.imara-round-closed{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:18px;align-items:start}.public-main.imara-round-closed>.public-last,.public-main.imara-round-closed>.public-board,.public-main.imara-round-closed>#publicWinner{grid-column:1}.public-main.imara-round-closed>#roundWinnersPanel{grid-column:2;grid-row:1/span 3}
 .mobile-bingo-btn{background:linear-gradient(135deg,#ff3d71,#ff8a25)!important;border:0!important;box-shadow:0 12px 36px rgba(255,61,113,.28)!important;font-size:18px!important}.mobile-bingo-status{margin:10px 0;padding:11px 13px;border-radius:14px;background:rgba(255,91,143,.12);border:1px solid rgba(255,91,143,.25);font-size:13px;text-align:center}
 .factory-pin-card{grid-column:1/-1}.factory-pin-card .danger strong{color:#fff}
 @keyframes firePulse{from{transform:scaleY(.9);opacity:.68}to{transform:scaleY(1.08);opacity:1}}@keyframes tiePop{from{transform:scale(.82);opacity:.3}to{transform:none;opacity:1}}@keyframes winnersSlide{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:none}}
 @media(max-width:1100px){.public-main.imara-round-closed{grid-template-columns:1fr}.public-main.imara-round-closed>#roundWinnersPanel{grid-column:1;grid-row:auto}.bingo-control-grid{grid-template-columns:1fr}}
 `;document.head.appendChild(s);
}

/* ---------- Premio único por ronda ---------- */
function prizeById(id){return Array.isArray(state?.prizes)?state.prizes.find(p=>p.id===id):null;}
function prizeText(p){if(!p)return '';const idx=(state.prizes||[]).findIndex(x=>x.id===p.id);const order=typeof ordinalPrizeLabel==='function'?ordinalPrizeLabel(idx):`Premio ${idx+1}`;return [order,p.title,p.description].filter(Boolean).join(' · ');}
function ensurePrizeSelector(){
 if(IS_PUBLIC||IS_MOBILE||typeof state==='undefined')return;
 const input=document.getElementById('roundPrize');if(!input)return;
 let wrap=document.getElementById('roundPrizeSelectorWrap');
 if(!wrap){wrap=document.createElement('div');wrap.id='roundPrizeSelectorWrap';wrap.className='round-prize-select-wrap full';input.closest('label')?.before(wrap);}
 const prizes=Array.isArray(state.prizes)?state.prizes:[];
 const selected=state.round?.prizeId||'';
 wrap.innerHTML=`<label style="display:grid;gap:6px;color:var(--muted);font-size:12px">🎁 Premio de esta ronda<select class="input" id="roundPrizeSelect"><option value="">— Premio manual / sin asignar —</option>${prizes.map((p,i)=>`<option value="${esc(p.id)}" ${p.id===selected?'selected':''}>${esc((typeof ordinalPrizeLabel==='function'?ordinalPrizeLabel(i):`Premio ${i+1}`)+(p.title?' · '+p.title:''))}</option>`).join('')}</select></label><div class="round-prize-preview" id="roundPrizePreview"></div>`;
 const sel=wrap.querySelector('#roundPrizeSelect');
 const paint=()=>{const p=prizeById(sel.value),prev=wrap.querySelector('#roundPrizePreview');if(!p){prev.textContent='Puedes seguir escribiendo un premio manual en el campo de abajo.';return;}prev.innerHTML=`<strong>${esc(p.title||'Premio')}</strong>${p.description?' · '+esc(p.description):''} · ${document.getElementById('prizeReveal')?.value==='yes'?'Visible al público':'Sorpresa hasta que decidas revelarlo'}`;};
 sel.onchange=()=>{const p=prizeById(sel.value);state.round.prizeId=p?.id||'';if(p){state.round.prize=prizeText(p);state.round.prizeTitle=p.title||'';state.round.prizeDescription=p.description||'';input.value=state.round.prize;}paint();};paint();
}
if(typeof window.usePrizeInRound==='function'){
 const baseUse=window.usePrizeInRound;window.usePrizeInRound=function(id){const r=baseUse(id),p=prizeById(id);if(p){state.round.prizeId=id;state.round.prizeTitle=p.title||'';state.round.prizeDescription=p.description||'';saveState();ensurePrizeSelector();}return r;};
}
document.getElementById('saveRoundBtn')?.addEventListener('click',()=>setTimeout(()=>{
 const id=document.getElementById('roundPrizeSelect')?.value||'';const p=prizeById(id);state.round.prizeId=id;if(p){state.round.prize=prizeText(p);state.round.prizeTitle=p.title||'';state.round.prizeDescription=p.description||'';}saveState();
},0));

function renderCurrentRoundPrize(){
 const wrap=document.getElementById('publicPrizeGallery');if(!wrap)return;
 const p=prizeById(state.round?.prizeId);const reveal=!!state.round?.reveal;
 if(!reveal){wrap.innerHTML='';wrap.classList.add('hidden');return;}
 const title=p?.title||state.round?.prizeTitle||state.round?.prize||'Premio de la ronda';
 const desc=p?.description||state.round?.prizeDescription||'';
 wrap.classList.remove('hidden');wrap.innerHTML=`<div class="public-prize"><div class="muted">PREMIO · ${esc(state.round?.name||'RONDA')}</div><div style="display:grid;grid-template-columns:${p?.image?'74px ':''}1fr;gap:10px;align-items:center;text-align:left;margin-top:10px">${p?.image?`<img src="${p.image}" alt="" style="width:74px;height:74px;object-fit:cover;border-radius:14px">`:''}<div><strong style="font-size:17px">${esc(title)}</strong>${desc?`<div class="muted" style="font-size:12px;margin-top:4px">${esc(desc)}</div>`:''}</div></div></div>`;
 const pub=document.getElementById('publicPrize');if(pub)pub.textContent=`🎁 ${title}`;
}
if(typeof renderPublicPrizeGallery==='function')renderPublicPrizeGallery=renderCurrentRoundPrize;

/* ---------- Ganador no vuelve a jugar ---------- */
if(typeof currentWinningCards==='function'){
 const baseCandidates=currentWinningCards;currentWinningCards=function(){const won=new Set((state.winners||[]).map(w=>w.cardId));return baseCandidates().filter(c=>c.status==='Pagado'&&!won.has(c.id));};
}
if(typeof window.registerWinner==='function'){
 const baseRegister=window.registerWinner;window.registerWinner=function(id){if((state.winners||[]).some(w=>w.cardId===id)){alert('Este cartón ya fue ganador y no puede volver a participar.');return;}const c=findCard(id);if(c?.status==='Ganador'){alert('Este cartón ya ganó anteriormente.');return;}return baseRegister(id);};
}
document.getElementById('validateBtn')?.addEventListener('click',e=>{const c=findCard(document.getElementById('winnerInput')?.value);if(c&&(state.winners||[]).some(w=>w.cardId===c.id)){e.stopImmediatePropagation();document.getElementById('validationResult').innerHTML=`<div class="danger">⛔ <strong>${esc(c.id)}</strong> ya fue ganador y quedó retirado de las rondas siguientes.</div>`;}},true);

/* ---------- Ganadores a la derecha al cerrar ---------- */
function renderRoundWinners(){
 if(IS_MOBILE)return;const main=document.querySelector('#view-public .public-main');if(!main)return;
 let panel=document.getElementById('roundWinnersPanel');if(!panel){panel=document.createElement('aside');panel.id='roundWinnersPanel';panel.className='round-winners-panel hidden';main.appendChild(panel);}
 const wins=(state.winners||[]).filter(w=>w.roundName===state.round?.name).sort((a,b)=>(a.position||999)-(b.position||999));
 const closed=state.round?.status==='closed'&&wins.length>0;main.classList.toggle('imara-round-closed',closed);panel.classList.toggle('hidden',!closed);if(!closed)return;
 panel.innerHTML=`<h3>🏆 Ganadores · ${esc(state.round.name)}</h3>${wins.map((w,i)=>`<div class="round-winner-row"><strong>${w.position?`${w.position}.º `:''}${esc(w.buyer||w.cardId)}</strong><small>${esc(w.cardId)}${w.prize?' · '+esc(w.prize):''}</small></div>`).join('')}`;
}
if(typeof renderPublic==='function'){const basePublic=renderPublic;renderPublic=function(){basePublic();renderCurrentRoundPrize();renderRoundWinners();};}

/* ---------- BINGO desde cartón móvil ---------- */
function mountMobileBingo(){
 if(!IS_MOBILE)return;const actions=document.querySelector('.mobile-actions');if(!actions||document.getElementById('mobileBingoBtn'))return;
 const btn=document.createElement('button');btn.id='mobileBingoBtn';btn.className='mobile-bingo-btn';btn.type='button';btn.textContent='📣 ¡BINGO!';actions.appendChild(btn);
 const st=document.createElement('div');st.id='mobileBingoStatus';st.className='mobile-bingo-status';st.textContent='Si completas la figura de la ronda, pulsa BINGO para avisar a los presentadores.';actions.after(st);
 btn.onclick=async()=>{const id=document.querySelector('.mobile-person>div:first-child strong')?.textContent.trim();if(!id)return;btn.disabled=true;btn.textContent='📣 Enviando…';try{const d=await api('bingo-claim',{card_id:id},false);st.innerHTML=`✅ <strong>¡BINGO enviado!</strong><br>Los presentadores ya recibieron tu aviso. Espera la validación oficial.`;btn.textContent=d.already?'✅ BINGO ya enviado':'✅ BINGO enviado';navigator.vibrate?.([120,70,160]);}catch(e){st.innerHTML=`⚠️ ${esc(e.message)}`;btn.disabled=false;btn.textContent='📣 ¡BINGO!';}};
}

/* ---------- Centro de BINGO del presentador ---------- */
function candidateUnion(){const m=new Map();latestCandidates.forEach(c=>m.set(c.card_id,{...c,claim:false}));latestClaims.forEach(c=>{if(c.valid)m.set(c.card_id,{card_id:c.card_id,buyer_alias:c.buyer_alias||'',claim:true});});return [...m.values()];}
function mountAdminCenter(){
 if(!isAdmin())return;const view=document.getElementById('view-game');if(!view)return;let card=document.getElementById('bingoControl2026');if(card)return;
 card=document.createElement('div');card.id='bingoControl2026';card.className='card';card.style.marginTop='16px';const auto=document.getElementById('autoWinnerStatus')?.closest('.card');auto?.after(card);renderAdminCenter();
}
function renderAdminCenter(){
 const card=document.getElementById('bingoControl2026');if(!card)return;const candidates=candidateUnion();
 card.innerHTML=`<div class="section-title"><div><h3>📣 Centro de BINGO</h3><div class="muted">Recibe avisos desde los cartones y también detecta BINGO aunque nadie pulse el botón.</div></div><button class="btn" id="refreshBingo2026">↻ Actualizar</button></div><div class="bingo-control-grid"><div><div class="bingo-candidates">${candidates.length?candidates.map(c=>`<div class="bingo-candidate ${c.claim?'claim':''}">${c.claim?'📱 ': '✨ '}<strong>${esc(c.card_id)}</strong>${c.buyer_alias?' · '+esc(c.buyer_alias):''}</div>`).join(''):'<span class="muted">Sin BINGO válido todavía.</span>'}</div>${latestClaims.length?`<div class="muted" style="margin-top:9px">${latestClaims.length} aviso${latestClaims.length===1?'':'s'} recibido${latestClaims.length===1?'':'s'} desde cartones móviles.</div>`:''}</div><div class="actions">${candidates.length?`<button class="btn primary" id="startBingoCountdown">🎙️ BINGO · a la 1, 2 y 3</button>`:''}</div></div><div class="footer-note">Cada paso dura 4,5 segundos. A “las tres” tú decides: confirmar, continuar la partida o iniciar desempate si hay más de un cartón válido.</div>`;
 card.querySelector('#refreshBingo2026')?.addEventListener('click',refreshAdminBingo);card.querySelector('#startBingoCountdown')?.addEventListener('click',()=>startBingoCountdown(candidates));
}
async function refreshAdminBingo(){if(!isAdmin())return;try{const [b,o]=await Promise.all([api('bingo-claims'),api('overview',{},false)]);latestClaims=b.claims||[];latestCandidates=b.candidates||[];currentShow=o.game?.show_state||{type:'idle'};syncCloudGame(o);renderAdminCenter();renderShow();}catch(e){console.warn('BINGO center:',e.message);}}
async function startBingoCountdown(candidates){if(!candidates.length)return;const show={type:'bingo_countdown',started_at:new Date().toISOString(),interval_ms:4500,round_name:state.round?.name||'Ronda',candidates:candidates.map(c=>({card_id:c.card_id,buyer_alias:c.buyer_alias||''}))};try{const d=await api('show-set',{show_state:show});currentShow=d.show_state||show;renderShow();}catch(e){alert(e.message);}}
async function rejectBingo(cands){try{await api('bingo-reject',{card_ids:cands.map(c=>c.card_id)});currentShow={type:'idle'};await refreshAdminBingo();}catch(e){alert(e.message);}}
async function confirmWinner(c){try{await api('winner-confirm',{card_id:c.card_id});await refreshAdminBingo();}catch(e){alert(e.message);}}
async function startTie(cands){const show={type:'tie',started_at:new Date().toISOString(),duration_ms:7000,round_name:state.round?.name||'Ronda',candidates:cands};try{const d=await api('show-set',{show_state:show});currentShow=d.show_state||show;tieResolving=false;renderShow();}catch(e){alert(e.message);}}
async function resolveTie(cands){if(tieResolving)return;tieResolving=true;try{await api('tie-resolve',{card_ids:cands.map(c=>c.card_id)});await refreshAdminBingo();}catch(e){tieResolving=false;alert(e.message);}}

/* ---------- Show público + sincronización nube ---------- */
function syncCloudGame(o){if(!o?.game||typeof state==='undefined')return;state.drawn=Array.isArray(o.game.drawn)?o.game.drawn.map(Number):state.drawn;state.round=o.game.round||state.round;state.winners=(o.winners||[]).map(w=>({cardId:w.card_id,buyer:w.buyer_alias||'',roundName:w.round_name,pattern:w.pattern,prize:w.prize,position:w.position,at:w.created_at}));if(typeof renderAll==='function')renderAll();}
async function refreshPublic(){try{const o=await api('overview',{},false);currentShow=o.game?.show_state||{type:'idle'};syncCloudGame(o);renderShow();}catch(e){console.warn('IMARA pública:',e.message);}}
function ensureShowOverlay(){let o=document.getElementById('imaraShowOverlay');if(o)return o;o=document.createElement('div');o.id='imaraShowOverlay';o.className='imara-show-overlay hidden';document.body.appendChild(o);return o;}
function stageFor(show){const interval=Number(show.interval_ms)||4500,started=new Date(show.started_at||0).getTime();if(!started)return 0;return Math.max(0,Math.min(3,Math.floor((Date.now()-started)/interval)));}
function announceSound(key,detail){if(key===lastShowSound)return;lastShowSound=key;window.dispatchEvent(new CustomEvent('imara-round-show-sound',{detail}));}
function renderShow(){
 const show=currentShow||{type:'idle'},overlay=ensureShowOverlay();if(show.type==='idle'||!show.type){overlay.classList.add('hidden');return;}
 if(show.type==='bingo_countdown'){
   const stage=stageFor(show),texts=['¡BINGO!','A LA UNA…','A LAS DOS…','¡A LAS TRES!'],cands=Array.isArray(show.candidates)?show.candidates:[];announceSound(`count-${show.started_at}-${stage}`,{type:'countdown',stage});
   const ready=stage===3&&Date.now()-new Date(show.started_at).getTime()>=(Number(show.interval_ms)||4500)*3;
   overlay.classList.remove('hidden');overlay.innerHTML=`<div class="imara-show-card"><div class="imara-show-kicker">BINGO IMARA · VALIDACIÓN DE RONDA</div><div class="imara-show-main">${texts[stage]}</div><div class="imara-show-sub">${cands.length===1?`${esc(cands[0].card_id)}${cands[0].buyer_alias?' · '+esc(cands[0].buyer_alias):''}`:`${cands.length} cartones con BINGO válido`}</div>${ready&&isAdmin()?`<div class="imara-show-actions">${cands.length===1?`<button class="btn good" id="confirmBingo2026">✅ Confirmar BINGO</button>`:`<button class="btn warn" id="tieBingo2026">🔥 Desempatar ${cands.length} cartones</button>`}<button class="btn bad" id="rejectBingo2026">❌ No confirmar · seguir jugando</button></div>`:''}</div>`;
   overlay.querySelector('#confirmBingo2026')?.addEventListener('click',()=>confirmWinner(cands[0]));overlay.querySelector('#tieBingo2026')?.addEventListener('click',()=>startTie(cands));overlay.querySelector('#rejectBingo2026')?.addEventListener('click',()=>rejectBingo(cands));return;
 }
 if(show.type==='tie'){
   const cands=Array.isArray(show.candidates)?show.candidates:[],duration=Number(show.duration_ms)||7000,elapsed=Math.max(0,Date.now()-new Date(show.started_at||0).getTime()),idx=cands.length?Math.floor(elapsed/145)%cands.length:0,c=cands[idx]||{};announceSound(`tie-${show.started_at}`,{type:'tie'});
   overlay.classList.remove('hidden');overlay.innerHTML=`<div class="imara-show-card tie-fire"><div class="tie-flames"></div><div class="imara-show-kicker">🔥 DESEMPATE IMARA 🔥</div><div class="tie-name">${esc(c.buyer_alias||c.card_id||'')}</div><div class="imara-show-sub">${esc(c.card_id||'')} · La suerte decide el premio</div><div class="tie-list" style="margin-top:18px">${cands.map(x=>esc(x.card_id)).join(' · ')}</div></div>`;
   if(isAdmin()&&elapsed>=duration)resolveTie(cands);return;
 }
 if(show.type==='winner'){
   const w=show.winner||{},age=Date.now()-new Date(show.at||Date.now()).getTime();if(w.card_id&&lastCelebratedWinner!==w.card_id){lastCelebratedWinner=w.card_id;if(IS_PUBLIC&&typeof celebrate==='function')celebrate();announceSound(`winner-${w.card_id}`,{type:'winner'});}
   if(age>10000){overlay.classList.add('hidden');return;}overlay.classList.remove('hidden');overlay.innerHTML=`<div class="imara-show-card"><div class="imara-show-kicker">🏆 GANADOR CONFIRMADO · ${esc(w.round_name||'RONDA')}</div><div class="imara-show-main">¡GANADOR!</div><div class="imara-show-sub" style="font-size:clamp(22px,4vw,42px);font-weight:1000">${esc(w.buyer_alias||w.card_id||'')}</div><div class="imara-show-sub">${esc(w.card_id||'')}${w.prize?' · '+esc(w.prize):''}</div></div>`;return;
 }
 overlay.classList.add('hidden');
}

/* ---------- Reset de fábrica ---------- */
function mountFactoryReset(){
 if(!isAdmin()||IS_PUBLIC||IS_MOBILE)return;const grid=document.querySelector('#view-settings .grid.two');if(!grid||document.getElementById('factoryReset2026'))return;const card=document.createElement('div');card.id='factoryReset2026';card.className='card factory-pin-card';card.innerHTML=`<div class="section-title"><div><h3>♻️ Reset de fábrica</h3><div class="muted">Deja el sistema limpio para una nueva entrega sin perder tu Admin actual.</div></div></div><div class="danger" style="margin-bottom:12px"><strong>Elimina:</strong> cartones, ventas, pagos, solicitudes de BINGO, ganadores, balotas y usuarios Miembro. Conserva únicamente el Admin conectado.</div><div class="notice" style="margin-bottom:12px">🔐 Solo Admin + PIN de reset. PIN configurado: <strong>0000</strong>.</div><button class="btn bad" id="factoryReset2026Btn">♻️ Reiniciar desde fábrica</button>`;grid.appendChild(card);card.querySelector('button').onclick=async e=>{const pin=prompt('Ingresa el PIN de reset:','');if(pin!=='0000'){alert('PIN incorrecto. Reset cancelado.');return;}if(!confirm('¿Seguro? Se eliminará toda la operación y los usuarios Miembro. Esta acción es irreversible sin backup.'))return;const token=sessionStorage.getItem(SESSION_KEY)||'';if(!token){alert('Inicia sesión nuevamente como Admin.');return;}const b=e.currentTarget,old=b.textContent;b.disabled=true;b.textContent='♻️ Reiniciando…';try{const r=await fetch(RESET_API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},cache:'no-store',body:JSON.stringify({confirmation:'REINICIAR'})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'No fue posible reiniciar.');const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';if(k==='bingoImaraStateV2'||k.startsWith('imaraMobileMarks:')||k.startsWith('imaraSound')||k.startsWith('bingoImara'))keys.push(k);}keys.forEach(k=>localStorage.removeItem(k));alert('✅ Bingo IMARA quedó limpio de fábrica. Tu cuenta Admin se conservó.');location.reload();}catch(err){alert(err.message);b.disabled=false;b.textContent=old;}};}

function startAdmin(){if(adminPoll)return;mountAdminCenter();mountFactoryReset();ensurePrizeSelector();refreshAdminBingo();adminPoll=setInterval(()=>{mountAdminCenter();mountFactoryReset();ensurePrizeSelector();refreshAdminBingo();},5000);}
function init(){installStyles();mountMobileBingo();ensurePrizeSelector();if(IS_PUBLIC){refreshPublic();setInterval(refreshPublic,1800);}else if(!IS_MOBILE){const wait=setInterval(()=>{if(isAdmin()){clearInterval(wait);startAdmin();}},700);}showTick=setInterval(renderShow,220);if(typeof renderAll==='function')renderAll();}
init();
})();