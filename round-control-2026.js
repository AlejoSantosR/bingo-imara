/* BINGO IMARA · Control de ronda 2026
   Capa aditiva: no modifica login ni arranque base. */
(function(){
'use strict';
const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const RESET_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-reset';
const SESSION_KEY='imaraPrivateSessionV1';
const IS_PUBLIC=location.hash.startsWith('#public');
const IS_MOBILE=location.hash.startsWith('#mobile=');
let adminStarted=false;
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
 .round-winners-panel{padding:16px;border-radius:20px;background:linear-gradient(160deg,rgba(33,27,59,.96),rgba(18,25,43,.96));border:1px solid rgba(255,255,255,.15);box-shadow:0 18px 50px rgba(0,0,0,.35);animation:winnersSlide .5s cubic-bezier(.2,.9,.25,1)}.round-winners-panel h3{margin:0 0 12px}.round-winner-row{padding:10px 0;border-bottom:1px solid var(--line)}.round-winner-row:last-child{border-bottom:0}.round-winner-row strong{display:block}.round-winner-row small{color:var(--muted)}
 .public-main.imara-round-closed{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:18px;align-items:start}.public-main.imara-round-closed>.public-last,.public-main.imara-round-closed>.public-board,.public-main.imara-round-closed>#publicWinner{grid-column:1}.public-main.imara-round-closed>#roundWinnersPanel{grid-column:2;grid-row:1/span 3}
 .mobile-bingo-btn{background:linear-gradient(135deg,#ff3d71,#ff8a25)!important;border:0!important;box-shadow:0 12px 36px rgba(255,61,113,.28)!important;font-size:18px!important}.mobile-bingo-status{margin:10px 0;padding:11px 13px;border-radius:14px;background:rgba(255,91,143,.12);border:1px solid rgba(255,91,143,.25);font-size:13px;text-align:center}
 .factory-pin-card{grid-column:1/-1}.factory-pin-card .danger strong{color:#fff}
 @keyframes winnersSlide{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:none}}
 @media(max-width:1100px){.public-main.imara-round-closed{grid-template-columns:1fr}.public-main.imara-round-closed>#roundWinnersPanel{grid-column:1;grid-row:auto}}
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
 const st=document.createElement('div');st.id='mobileBingoStatus';st.className='mobile-bingo-status';st.textContent='';st.style.display='none';actions.after(st);
 btn.onclick=async()=>{const id=document.querySelector('.mobile-person>div:first-child strong')?.textContent.trim();if(!id)return;btn.disabled=true;btn.textContent='📣 Enviando…';try{const d=await api('bingo-claim',{card_id:id},false);st.style.display='block';st.innerHTML=`✅ <strong>¡BINGO enviado!</strong><br>Los presentadores ya recibieron tu aviso. Espera la validación oficial.`;btn.textContent=d.already?'✅ BINGO ya enviado':'✅ BINGO enviado';navigator.vibrate?.([120,70,160]);}catch(e){st.style.display='block';st.innerHTML=`⚠️ ${esc(e.message)}`;btn.disabled=false;btn.textContent='📣 ¡BINGO!';}};
}

/* ---------- Sincronización de estado de ronda ---------- */
function syncCloudGame(o){
 if(!o?.game||typeof state==='undefined')return;
 const nextDrawn=Array.isArray(o.game.drawn)?o.game.drawn.map(Number):state.drawn;
 const nextRound=o.game.round||state.round;
 const nextWinners=Array.isArray(o.winners)?o.winners.map(w=>({cardId:w.card_id,buyer:w.buyer_alias||'',roundName:w.round_name,pattern:w.pattern,prize:w.prize,position:w.position,at:w.created_at})):state.winners;
 const changed=JSON.stringify(state.drawn||[])!==JSON.stringify(nextDrawn||[])||JSON.stringify(state.round||{})!==JSON.stringify(nextRound||{})||(Array.isArray(o.winners)&&JSON.stringify(state.winners||[])!==JSON.stringify(nextWinners||[]));
 if(!changed)return;
 state.drawn=nextDrawn;state.round=nextRound;state.winners=nextWinners;
 if(typeof renderAll==='function')renderAll();
}

/* ---------- Reset de fábrica ---------- */
function mountFactoryReset(){
 if(!isAdmin()||IS_PUBLIC||IS_MOBILE)return;const grid=document.querySelector('#view-settings .grid.two');if(!grid||document.getElementById('factoryReset2026'))return;const card=document.createElement('div');card.id='factoryReset2026';card.className='card factory-pin-card';card.innerHTML=`<div class="section-title"><div><h3>♻️ Reset de fábrica</h3><div class="muted">Deja el sistema limpio para una nueva entrega sin perder tu Admin actual.</div></div></div><div class="danger" style="margin-bottom:12px"><strong>Elimina:</strong> cartones, ventas, pagos, solicitudes de BINGO, ganadores, balotas y usuarios Miembro. Conserva únicamente el Admin conectado.</div><div class="notice" style="margin-bottom:12px">🔐 Solo Admin + PIN de reset. PIN configurado: <strong>0000</strong>.</div><button class="btn bad" id="factoryReset2026Btn">♻️ Reiniciar desde fábrica</button>`;grid.appendChild(card);card.querySelector('button').onclick=async e=>{const pin=prompt('Ingresa el PIN de reset:','');if(pin!=='0000'){alert('PIN incorrecto. Reset cancelado.');return;}if(!confirm('¿Seguro? Se eliminará toda la operación y los usuarios Miembro. Esta acción es irreversible sin backup.'))return;const token=sessionStorage.getItem(SESSION_KEY)||'';if(!token){alert('Inicia sesión nuevamente como Admin.');return;}const b=e.currentTarget,old=b.textContent;b.disabled=true;b.textContent='♻️ Reiniciando…';try{const r=await fetch(RESET_API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},cache:'no-store',body:JSON.stringify({confirmation:'REINICIAR'})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'No fue posible reiniciar.');const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';if(k==='bingoImaraStateV2'||k.startsWith('imaraMobileMarks:')||k.startsWith('imaraSound')||k.startsWith('bingoImara'))keys.push(k);}keys.forEach(k=>localStorage.removeItem(k));alert('✅ Bingo IMARA quedó limpio de fábrica. Tu cuenta Admin se conservó.');location.reload();}catch(err){alert(err.message);b.disabled=false;b.textContent=old;}};}

function startAdmin(){if(adminStarted)return;adminStarted=true;mountFactoryReset();ensurePrizeSelector();}
function init(){
 installStyles();mountMobileBingo();ensurePrizeSelector();
 if(IS_PUBLIC){
   window.addEventListener('imara-public-game-state',e=>syncCloudGame(e.detail||{}));
 } else if(!IS_MOBILE){
   window.addEventListener('imara-game-realtime',e=>syncCloudGame(e.detail||{}));
   const wait=setInterval(()=>{if(isAdmin()){clearInterval(wait);startAdmin();}},700);
 }
 if(typeof renderAll==='function')renderAll();
}
init();
})();