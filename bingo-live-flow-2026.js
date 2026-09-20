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
const TIE_MS=10000;
let claims=[],candidates=[],show={type:'idle'};
let lastClaimSig='',lastAdminAlertSig='',publishing=false,tieStarting=false,tieResolving=false,continueBusy=false,refreshQueued=false;
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
 .b3-overlay{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;box-sizing:border-box!important;z-index:2147482000;display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr)!important;place-items:center!important;padding:20px!important;margin:0!important;background:radial-gradient(circle at 50% 42%,rgba(92,66,16,.36),rgba(4,7,13,.95) 68%);backdrop-filter:blur(10px)}.b3-overlay.hidden{display:none!important}.b3-overlay.b3-public{pointer-events:none}.b3-overlay.b3-admin{pointer-events:auto}
 .b3-card{width:min(940px,calc(100vw - 40px));max-width:940px;box-sizing:border-box;text-align:center;padding:36px 24px;border-radius:34px;border:1px solid rgba(255,218,102,.5);background:linear-gradient(150deg,rgba(24,22,28,.99),rgba(52,37,12,.98));box-shadow:0 35px 120px #000c,0 0 90px rgba(255,194,55,.2);overflow:hidden;position:relative}.b3-card::before{content:"";position:absolute;inset:-80% -30%;background:linear-gradient(105deg,transparent 42%,rgba(255,245,190,.17) 50%,transparent 58%);animation:b3Sweep 2.3s ease-in-out infinite;pointer-events:none}
 .b3-kicker{position:relative;font-size:12px;letter-spacing:3px;font-weight:1000;color:#ffe5a1}.b3-main{position:relative;font-size:clamp(58px,11vw,128px);font-weight:1000;line-height:.92;margin:16px 0;background:linear-gradient(180deg,#fff9d9,#ffd559 48%,#ae7207);-webkit-background-clip:text;background-clip:text;color:transparent}.b3-name{position:relative;font-size:clamp(25px,4.8vw,54px);font-weight:1000;color:#fff3c8}.b3-prize{position:relative;display:grid;grid-template-columns:100px 1fr;gap:12px;align-items:center;width:min(620px,92%);margin:16px auto 0;padding:12px;border-radius:18px;background:rgba(255,211,86,.08);border:1px solid rgba(255,211,86,.22);text-align:left}.b3-prize img{width:100px;height:100px;object-fit:contain;border-radius:14px;background:rgba(0,0,0,.18)}.b3-prize b{display:block;color:#ffe9a7;font-size:18px}.b3-prize small{display:block;margin-top:4px;color:#d5cfbf}.b3-sub{position:relative;margin-top:10px;color:#d8d1c2;font-size:clamp(13px,2vw,20px)}.b3-clock{position:relative;width:88px;height:88px;margin:18px auto 4px;border-radius:50%;display:grid;place-items:center;border:4px solid #ffd559;background:#171309;color:#fff1be;font-size:36px;font-weight:1000;box-shadow:0 0 34px rgba(255,198,45,.22)}.b3-overlay-actions{position:relative;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:20px}
 .b3-wheel-wrap{position:relative;width:min(420px,74vw);aspect-ratio:1;margin:22px auto 8px}.b3-wheel{position:absolute;inset:0;border-radius:50%;border:10px solid #e5b93e;box-shadow:0 0 0 5px #4d390d,0 0 70px rgba(255,192,43,.28);background:conic-gradient(#f7cf56 0 25%,#7b4ddb 25% 50%,#f39b3d 50% 75%,#d94a7d 75% 100%);animation:b3Spin .55s linear infinite}.b3-wheel::after{content:"";position:absolute;inset:22%;border-radius:50%;background:#15110a;border:4px solid #ffe18b}.b3-pointer{position:absolute;z-index:3;left:50%;top:-8px;transform:translateX(-50%);width:0;height:0;border-left:18px solid transparent;border-right:18px solid transparent;border-top:0;border-bottom:34px solid #fff0b8;filter:drop-shadow(0 3px 4px #0008)}.b3-wheel-name{position:absolute;z-index:4;inset:34%;display:grid;place-items:center;text-align:center;font-size:clamp(18px,4vw,34px);font-weight:1000;color:#fff2bf;line-height:1.05}.b3-tie-list{position:relative;font-weight:900;color:#ffdca1}
 @keyframes b3Sweep{0%,55%{transform:translateX(-52%)}88%,100%{transform:translateX(52%)}}@keyframes b3Spin{to{transform:rotate(360deg)}}
 @media(max-width:640px){.b3-card{padding:27px 15px}.b3-row{align-items:flex-start;flex-direction:column}.b3-clock{width:72px;height:72px;font-size:30px}}
 `;document.head.appendChild(s);
}
function overlay(){let o=document.getElementById('bingoLiveV3Overlay');if(!o){o=document.createElement('div');o.id='bingoLiveV3Overlay';o.className='b3-overlay hidden';document.body.appendChild(o);}o.classList.remove('public','admin');o.classList.toggle('b3-public',IS_PUBLIC);o.classList.toggle('b3-admin',!IS_PUBLIC);return o;}
function hideOverlay(){const o=overlay();o.classList.add('hidden');delete o.dataset.b3RenderKey;}

function mountPanels(){
 if(IS_PUBLIC||!isAdmin())return;
 const list=allVisible(),wins=valid();
 const dash=document.getElementById('view-dashboard');
 if(dash){
   let alertBox=document.getElementById('bingoV3AdminAlert');
   if(!alertBox){alertBox=document.createElement('div');alertBox.id='bingoV3AdminAlert';dash.querySelector('.grid.kpis')?.after(alertBox);}
   renderAdminAlert(alertBox,list,wins);
   let p=document.getElementById('bingoV3Dash');
   if(!p){p=document.createElement('div');p.id='bingoV3Dash';p.className='b3-panel';alertBox.after(p);}
   renderPanel(p,list,wins,'Inicio');
 }
 const game=document.getElementById('view-game');
 if(game){let p=document.getElementById('bingoV3Game');if(!p){p=document.createElement('div');p.id='bingoV3Game';p.className='b3-panel';const auto=document.getElementById('autoWinnerStatus')?.closest('.card');(auto||game.firstElementChild)?.after(p);}renderPanel(p,list,wins,'Juego');}
}
function renderAdminAlert(box,list,wins){
 if(show?.type==='winner'){
   const w=show.winner||{};
   box.className='b3-admin-alert';
   box.innerHTML=`<div class="b3-alert-top"><div><div class="b3-alert-title">🏆 Ganador confirmado</div><div class="b3-alert-sub">${esc(person(w))}${w.card_id?' · '+esc(w.card_id):''} · listo para continuar</div></div></div><div class="b3-alert-actions"><button class="btn good" data-b3-next-round>➡️ Continuar a siguiente ronda</button></div>`;
   return;
 }
 if(!list.length){box.innerHTML='';box.className='';return;}
 const manual=new Set(announced().map(c=>String(c.card_id)));
 const autoOnly=list.filter(c=>!manual.has(String(c.card_id))&&c.valid===true);
 const title=autoOnly.length&&manual.size===0
   ? `✨ BINGO detectado automáticamente`
   : `📣 Solicitud de BINGO recibida`;
 const detail=list.length===1
   ? `${person(list[0])} · ${list[0].card_id}`
   : `${list.length} cartones requieren revisión`;
 box.className='b3-admin-alert';
 box.innerHTML=`<div class="b3-alert-top"><div><div class="b3-alert-title">${title}</div><div class="b3-alert-sub">${esc(detail)}${wins.length?' · '+wins.length+' válido'+(wins.length===1?'':'s'):''}</div></div></div><div class="b3-alert-actions">${list.slice(0,4).map(c=>`<button class="btn primary" data-b3-review="${esc(c.card_id)}">🔎 Revisar ${esc(c.card_id)}</button>`).join('')}${wins.length>=2?'<button class="btn warn" data-b3-tie>🔥 Iniciar desempate</button>':''}<button class="btn bad" data-b3-resume>▶ Reanudar juego</button></div>`;
 const sig=(show?.source||'')+'|'+list.map(c=>c.card_id+':'+(c.valid===true?'1':'0')).sort().join('|');
 if(sig&&sig!==lastAdminAlertSig){
   lastAdminAlertSig=sig;
   if(typeof toast==='function')toast(autoOnly.length&&manual.size===0?'✨ BINGO detectado automáticamente':'📣 Nueva solicitud de BINGO');
 }
}
function renderPanel(p,list,wins,where){
 const claimIds=new Set(announced().map(c=>String(c.card_id)));
 p.innerHTML=`<div class="b3-head"><div><div class="b3-title">📣 Centro de BINGO · ${where}</div><div class="muted" style="margin-top:3px">Avisos del cartón digital y ganadores detectados por el sistema.</div></div><div class="b3-actions"><button class="btn" data-b3-refresh>↻ Actualizar</button><button class="btn primary" data-b3-count>🎙️ BINGO · 1, 2 y 3</button>${show?.type==='winner'?'<button class="btn good" data-b3-next-round>➡️ Continuar a siguiente ronda</button>':''}${wins.length>=2?'<button class="btn warn" data-b3-tie>🔥 Iniciar desempate</button>':''}${list.length?'<button class="btn bad" data-b3-resume>▶ Reanudar juego</button>':''}</div></div>${wins.length>1?`<div class="b3-tie">🔥 Empate válido detectado entre ${wins.length} cartones. Revísalos y, cuando estés listo, inicia el desempate manualmente.</div>`:''}<div class="b3-list">${list.length?list.map(c=>`<div class="b3-row"><div><strong>${claimIds.has(String(c.card_id))?'📱':'✨'} ${esc(person(c))}</strong><br><small>${esc(c.card_id)} · ${c.valid===true?'BINGO válido':'BINGO anunciado · pendiente de validación'}</small></div><button class="mini" data-b3-review="${esc(c.card_id)}">🔎 Revisar cartón</button></div>`).join(''):'<div class="muted">Todavía no hay avisos de BINGO. Puedes usar “BINGO · 1, 2 y 3” para hacer el llamado final.</div>'}</div>`;
}
function review(id){const nav=document.querySelector('.nav [data-view="validate"]');if(nav)nav.click();else if(typeof showView==='function')showView('validate');setTimeout(()=>{const i=document.getElementById('winnerInput');if(i)i.value=id;document.getElementById('validateBtn')?.click();},100);}

async function setShow(next){const d=await api('show-set',{show_state:next});show=d.show_state||next;paint();return show;}
async function refreshOverview(){const o=await api('overview',{},false);show=o.game?.show_state||{type:'idle'};return o;}
async function refreshClaims(){
 const b=await api('bingo-claims');
 claims=Array.isArray(b.claims)?b.claims:[];
 candidates=Array.isArray(b.candidates)?b.candidates:[];
 const a=announced(),v=valid(),list=allVisible();
 const manualIds=new Set(a.map(c=>String(c.card_id)));
 const source=a.length&&v.some(c=>!manualIds.has(String(c.card_id)))?'mixed':a.length?'manual':v.length?'automatic':'';
 const sig=source+'|'+list.map(c=>String(c.card_id)+':'+(c.valid===true?'1':'0')).sort().join('|');
 mountPanels();
 if(list.length&&sig!==lastClaimSig&&!publishing){
   lastClaimSig=sig;
   await publishClaim(list,source);
   return;
 }
 if(!list.length){lastClaimSig='';lastAdminAlertSig='';}
}
async function publishClaim(list,source='manual'){
 if(publishing)return;publishing=true;
 try{
   const o=await refreshOverview(),cur=o.game?.show_state||{type:'idle'};
   if(['winner','tie','bingo_countdown'].includes(cur.type))return;
   const merged=uniq([...(cur.type==='bingo_live_claim'?(cur.candidates||[]):[]),...list]);
   await setShow({type:'bingo_live_claim',source,at:new Date().toISOString(),round_name:o.game?.round?.name||'Ronda',candidates:merged});
 }catch(e){console.warn('BINGO V3 aviso:',e.message||e);}finally{publishing=false;}
}
async function startCountdown(){
 try{await refreshClaims();}catch(e){}
 const list=allVisible();
 try{await setShow({type:'bingo_countdown',started_at:new Date().toISOString(),interval_ms:COUNT_MS,round_name:(typeof state!=='undefined'&&state.round?.name)||'Ronda',candidates:list.map(c=>({card_id:c.card_id,buyer_alias:c.buyer_alias||''}))});}
 catch(e){alert(e.message);}
}
async function continueGame(btn){
 if(continueBusy)return;
 continueBusy=true;
 const ids=uniq([...(show.candidates||[]),...announced()]).map(c=>c.card_id);
 const oldText=btn?.textContent||'▶ Continuar juego';
 if(btn){btn.disabled=true;btn.textContent='⏳ Reanudando…';}
 try{
   if(ids.length)await api('bingo-reject',{card_ids:ids});
   await setShow({type:'idle'});
   show={type:'idle'};claims=[];candidates=[];lastClaimSig='';lastAdminAlertSig='';
   hideOverlay();mountPanels();
   window.dispatchEvent(new CustomEvent('imara-bingo-continue-complete',{detail:{card_ids:ids}}));
   return true;
 }catch(e){
   if(btn?.isConnected){btn.disabled=false;btn.textContent=oldText;}
   alert(e.message);
   return false;
 }finally{continueBusy=false;}
}
async function confirmOne(id){try{await api('winner-confirm',{card_id:id});await refreshOverview();mountPanels();paint();}catch(e){alert(e.message);}}
async function nextRoundAfterWinner(btn){
 const ok=await continueGame(btn);
 if(!ok)return;
 const nav=document.querySelector('.nav [data-view="game"],[data-view="game"]');
 nav?.click();
 setTimeout(()=>{
   const next=document.getElementById('roundPrepare2026');
   if(next&&!next.disabled){next.click();return;}
   if(typeof toast==='function')toast('✅ Ganador cerrado. Ve a Juego y prepara la siguiente ronda.');
 },180);
}
async function startTie(){
 if(tieStarting||tieResolving)return;
 if(['tie','winner'].includes(show?.type))return;
 tieStarting=true;
 try{
   const b=await api('bingo-claims');
   claims=Array.isArray(b.claims)?b.claims:[];
   candidates=Array.isArray(b.candidates)?b.candidates:[];
   const v=valid();
   mountPanels();
   if(v.length<2){alert('Ya no hay al menos dos BINGOS válidos para iniciar el desempate. Revisa nuevamente los cartones.');return;}
   const ok=confirm('Vas a iniciar el desempate entre '+v.length+' BINGOS válidos. ¿Continuar?');
   if(!ok)return;
   await setShow({type:'tie',started_at:new Date().toISOString(),duration_ms:TIE_MS,round_name:(typeof state!=='undefined'&&state.round?.name)||'Ronda',candidates:v.map(c=>({card_id:c.card_id,buyer_alias:c.buyer_alias||''}))});
 }catch(e){
   console.warn('BINGO V3 empate:',e.message||e);
   alert(e.message||'No fue posible iniciar el desempate.');
 }finally{tieStarting=false;}
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
   const list=uniq(s.candidates||[]),names=list.map(person),source=String(s.source||'manual');
   const who=names.length===1?esc(names[0]):names.length===2?`${esc(names[0])} Y ${esc(names[1])}`:`${names.length} CARTONES`;
   if(!IS_PUBLIC){o.classList.add('hidden');return;}
   const automatic=source==='automatic';
   const mixed=source==='mixed';
   o.classList.remove('hidden');
   o.innerHTML=`<div class="b3-card"><div class="b3-kicker">${automatic?'✨ BINGO DETECTADO POR EL SISTEMA':mixed?'📣 BINGO DETECTADO Y ANUNCIADO':'📣 ALGUIEN CANTÓ BINGO'}</div><div class="b3-main">${automatic?'¡HAY BINGO!':'¡BINGO!'}</div><div class="b3-name">${who}</div><div class="b3-sub">${automatic?'El sistema encontró un cartón ganador. Validación en curso.':'Los presentadores están revisando el cartón.'}</div></div>`;return;
 }
 if(s.type==='bingo_countdown'){
   const inf=countdownInfo(s),labels=['BINGO A LA 1','BINGO A LAS 2','BINGO A LAS 3'],list=uniq(s.candidates||[]),v=valid();
   let actions='';if(inf.ready&&!IS_PUBLIC&&isAdmin()){
     if(v.length===1)actions+=`<button class="btn good" data-b3-confirm="${esc(v[0].card_id)}">✅ Confirmar BINGO</button>`;
     if(v.length>=2)actions+=`<button class="btn warn" data-b3-tie>🔥 Iniciar desempate</button>`;
     actions+=`<button class="btn bad" data-b3-continue>▶ Continuar juego</button>`;
   }
   const name=list.length===1?`Bingo de ${esc(person(list[0]))}`:list.length>1?`${list.length} avisos de BINGO`:'';
   const renderKey=['countdown',inf.stage,inf.remaining,inf.ready?1:0,signature(list),signature(v),isAdmin()?1:0].join('|');
   o.classList.remove('hidden');
   if(o.dataset.b3RenderKey!==renderKey){
     o.dataset.b3RenderKey=renderKey;
     o.innerHTML=`<div class="b3-card"><div class="b3-kicker">BINGO IMARA · LLAMADO DE RONDA</div><div class="b3-main" style="font-size:clamp(44px,8vw,94px)">${labels[inf.stage]}</div>${name?`<div class="b3-name" style="font-size:clamp(20px,3.6vw,38px)">${name}</div>`:''}<div class="b3-clock">${inf.remaining}</div><div class="b3-sub">${inf.ready?'Conteo terminado · valida el resultado o continúa la partida':'3 segundos por llamado'}</div>${actions?`<div class="b3-overlay-actions">${actions}</div>`:''}</div>`;
   }
   return;
 }
 if(s.type==='tie'){
   if(window.__imaraTieVisual2026){hideOverlay();if(!IS_PUBLIC)resolveTieIfNeeded();return;}
   const list=uniq(s.candidates||[]),start=new Date(s.started_at||0).getTime(),elapsed=Math.max(0,Date.now()-start),idx=list.length?Math.floor(elapsed/160)%list.length:0,c=list[idx]||{};
   o.classList.remove('hidden');o.innerHTML=`<div class="b3-card"><div class="b3-kicker">🔥 EMPATE · RULETA IMARA 🔥</div><div class="b3-wheel-wrap"><div class="b3-pointer"></div><div class="b3-wheel"></div><div class="b3-wheel-name">${esc(person(c))}</div></div><div class="b3-tie-list">${list.map(x=>esc(person(x))).join(' · ')}</div><div class="b3-sub">La ruleta está definiendo el ganador del desempate…</div></div>`;
   if(!IS_PUBLIC)resolveTieIfNeeded();return;
 }
 if(s.type==='winner'){
   if(window.__imaraTieVisual2026){hideOverlay();document.getElementById('imaraShowOverlay')?.classList.add('hidden');document.getElementById('winnerCountdownOverlay')?.classList.remove('show');return;}
   if(!IS_PUBLIC){o.classList.add('hidden');document.getElementById('imaraShowOverlay')?.classList.add('hidden');document.getElementById('winnerCountdownOverlay')?.classList.remove('show');return;}
   const w=s.winner||{},raw=String(w.prize||''),pt=String(w.prize_title||'').trim()||raw.split(' · ')[1]||raw,pd=String(w.prize_description||''),pi=String(w.prize_image||'');o.classList.remove('hidden');o.innerHTML=`<div class="b3-card"><div class="b3-kicker">🏆 GANADOR CONFIRMADO</div><div class="b3-main">¡BINGO!</div><div class="b3-name">${esc(w.buyer_alias||w.card_id||'GANADOR')}</div><div class="b3-sub">${esc(w.card_id||'')}</div>${(pt||pi)?`<div class="b3-prize">${pi?`<img src="${esc(pi)}" alt="">`:'<div style="font-size:46px;text-align:center">🎁</div>'}<div><b>🎁 ${esc(pt||'Premio')}</b>${pd?`<small>${esc(pd)}</small>`:''}</div></div>`:''}</div>`;return;
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
   const cont=t.closest?.('[data-b3-continue]');if(cont){e.preventDefault();continueGame(cont);return;}
   const resume=t.closest?.('[data-b3-resume]');if(resume){e.preventDefault();continueGame(resume);return;}
   const next=t.closest?.('[data-b3-next-round]');if(next){e.preventDefault();nextRoundAfterWinner(next);return;}
   if(t.closest?.('[data-b3-tie]')){e.preventDefault();startTie();return;}
 },true);
}
async function adminTick(){if(!isAdmin()||!token())return;try{await refreshClaims();await refreshOverview();mountPanels();paint();await resolveTieIfNeeded();}catch(e){console.warn('BINGO V3:',e.message||e);}}
function queueClaimsRefresh(){
 if(refreshQueued)return;
 refreshQueued=true;
 setTimeout(()=>{refreshQueued=false;refreshClaims().catch(e=>console.warn('BINGO V3 claims:',e.message||e));},140);
}
function applyRealtime(payload){
 if(!isAdmin()||!payload?.game)return;
 const next=payload.game.show_state||{type:'idle'},sig=JSON.stringify(next);
 show=next;mountPanels();paint();resolveTieIfNeeded();
 if(sig!==lastRealtimeShowSig)lastRealtimeShowSig=sig;
 queueClaimsRefresh();
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