/* Bingo IMARA · Desempate sincronizado en cartón móvil · 2026
   Reutiliza el estado game-state ya recibido por mobile-round-live.
   No abre conexiones Realtime, no consulta Supabase y no decide ganadores. */
(function(){
'use strict';
const DEMO=document.documentElement.hasAttribute('data-imara-tie-demo');
if(!location.hash.startsWith('#mobile=')&&!DEMO)return;
if(window.__imaraMobileTieSync2026)return;
window.__imaraMobileTieSync2026=true;

const DEFAULT_TIE_MS=10000;
let raf=0,currentKey='',lockedShell=null,prevInert=false;

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const person=c=>String(c?.buyer_alias||c?.card_id||'Participante').trim()||'Participante';

function css(){
 if(document.getElementById('imaraMobileTieSyncCss'))return;
 const s=document.createElement('style');
 s.id='imaraMobileTieSyncCss';
 s.textContent=`
 .imara-mobile-tie-overlay{position:fixed;inset:0;z-index:2147483200;display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));background:radial-gradient(circle at 50% 38%,rgba(99,57,12,.52),rgba(4,7,13,.97) 68%);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:#fff;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;overflow:hidden}
 .imara-mobile-tie-overlay.hidden{display:none!important}
 .imara-mobile-tie-card{width:min(520px,100%);max-height:100%;overflow:hidden;text-align:center;padding:18px 14px;border-radius:26px;border:1px solid rgba(255,207,84,.48);background:linear-gradient(150deg,rgba(31,22,13,.995),rgba(54,31,17,.99));box-shadow:0 30px 100px #000c,0 0 70px rgba(255,170,34,.18);display:flex;flex-direction:column;align-items:center}
 .imara-mobile-tie-kicker{font-size:10px;letter-spacing:2.1px;font-weight:1000;color:#ffdda0;text-transform:uppercase}
 .imara-mobile-tie-title{margin:5px 0 2px;font-size:clamp(25px,8vw,42px);font-weight:1000;line-height:.98;color:#fff0bc}
 .imara-mobile-tie-timer{width:56px;height:56px;flex:0 0 56px;margin:8px auto;border-radius:50%;display:grid;place-items:center;border:3px solid #ffc94f;background:#140d07;color:#fff2bf;font-size:22px;font-weight:1000;box-shadow:0 0 28px rgba(255,190,38,.2)}
 .imara-mobile-tie-wheel-wrap{position:relative;width:min(245px,58vw,31vh);aspect-ratio:1;margin:3px auto 7px;flex:0 1 auto}
 .imara-mobile-tie-wheel{position:absolute;inset:0;border-radius:50%;border:8px solid #e4b33e;background:conic-gradient(#f7cf56 0 25%,#754bd1 25% 50%,#ef8c38 50% 75%,#d64c79 75% 100%);box-shadow:0 0 0 4px #4a320c,0 0 48px rgba(255,184,45,.22);animation:imaraTieSpin .7s linear infinite}
 .imara-mobile-tie-wheel::after{content:"";position:absolute;inset:20%;border-radius:50%;background:#15100b;border:3px solid #ffe08a}
 .imara-mobile-tie-pointer{position:absolute;z-index:4;left:50%;top:-5px;transform:translateX(-50%);width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-bottom:26px solid #fff0b8;filter:drop-shadow(0 3px 4px #0008)}
 .imara-mobile-tie-person{position:absolute;z-index:5;inset:31%;display:grid;place-items:center;text-align:center;font-size:clamp(13px,4vw,20px);font-weight:1000;line-height:1.05;color:#fff2c4;overflow-wrap:anywhere}
 .imara-mobile-tie-person small{display:block;margin-top:3px;color:#ffc85e;font-size:8px}
 .imara-mobile-tie-list{width:100%;display:flex;gap:5px;justify-content:center;flex-wrap:wrap;max-height:80px;overflow:auto;-webkit-overflow-scrolling:touch;padding:2px 0}
 .imara-mobile-tie-chip{max-width:46%;padding:5px 7px;border-radius:10px;background:#17100c;border:1px solid rgba(255,211,118,.24);font-size:9px;color:#fff1c9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .imara-mobile-tie-chip small{display:block;color:#ffc963;font-size:7px;margin-top:1px}
 .imara-mobile-tie-sub{margin-top:8px;color:#ead6ba;font-size:10px;line-height:1.25}
 .imara-mobile-tie-demo{margin-bottom:5px;padding:4px 8px;border-radius:999px;background:#6747c8;color:#fff;font-size:8px;font-weight:1000;letter-spacing:1px}
 .imara-mobile-winner-icon{font-size:46px;line-height:1;margin:8px 0}
 .imara-mobile-winner-name{font-size:clamp(25px,8vw,40px);font-weight:1000;color:#fff3c8;line-height:1.04;overflow-wrap:anywhere}
 .imara-mobile-winner-card{margin-top:7px;font-size:13px;font-weight:900;color:#ffd26f}
 .imara-mobile-winner-prize{margin-top:8px;padding:8px 10px;border-radius:12px;background:rgba(255,211,86,.09);border:1px solid rgba(255,211,86,.22);color:#ffe8a8;font-size:11px}
 body.imara-mobile-tie-active .mobile-card-shell{user-select:none;-webkit-user-select:none}
 @keyframes imaraTieSpin{to{transform:rotate(360deg)}}
 @media(max-height:700px){.imara-mobile-tie-card{padding:12px 11px;border-radius:20px}.imara-mobile-tie-title{font-size:26px}.imara-mobile-tie-timer{width:46px;height:46px;flex-basis:46px;font-size:19px;margin:5px auto}.imara-mobile-tie-wheel-wrap{width:min(190px,45vw,29vh)}.imara-mobile-tie-list{max-height:58px}.imara-mobile-tie-sub{margin-top:5px}}
 `;
 document.head.appendChild(s);
}

function overlay(){
 let o=document.getElementById('imaraMobileTieOverlay');
 if(!o){
   o=document.createElement('div');
   o.id='imaraMobileTieOverlay';
   o.className='imara-mobile-tie-overlay hidden';
   o.setAttribute('role','dialog');
   o.setAttribute('aria-modal','true');
   document.body.appendChild(o);
 }
 return o;
}

function lock(){
 const shell=document.querySelector('.mobile-card-shell');
 if(!shell||lockedShell===shell)return;
 unlock();
 lockedShell=shell;
 prevInert=!!shell.inert;
 shell.inert=true;
 shell.setAttribute('aria-busy','true');
 document.body.classList.add('imara-mobile-tie-active');
}

function unlock(){
 if(lockedShell){
   lockedShell.inert=prevInert;
   lockedShell.removeAttribute('aria-busy');
 }
 lockedShell=null;
 prevInert=false;
 document.body.classList.remove('imara-mobile-tie-active');
}

function hide(){
 cancelAnimationFrame(raf);raf=0;currentKey='';
 overlay().classList.add('hidden');
 overlay().innerHTML='';
 unlock();
}

function tieFrame(s){
 const list=Array.isArray(s.candidates)?s.candidates.filter(x=>x?.card_id):[];
 const start=new Date(s.started_at||s.at||Date.now()).getTime();
 const dur=Math.max(DEFAULT_TIE_MS,Number(s.duration_ms)||0);
 if(list.length<2||!Number.isFinite(start)){hide();return;}
 const key=`${start}|${dur}|${list.map(x=>x.card_id).join('|')}`;
 currentKey=key;
 lock();
 const o=overlay();o.classList.remove('hidden');

 function frame(){
   if(currentKey!==key)return;
   const elapsed=Math.max(0,Date.now()-start);
   const left=Math.max(0,Math.ceil((dur-elapsed)/1000));
   const c=list[Math.floor(elapsed/180)%list.length]||list[0];
   o.innerHTML=`<div class="imara-mobile-tie-card">
     ${DEMO?'<div class="imara-mobile-tie-demo">DEMO · NO AFECTA EL JUEGO REAL</div>':''}
     <div class="imara-mobile-tie-kicker">🔥 EMPATE · ${list.length} BINGOS 🔥</div>
     <div class="imara-mobile-tie-title">RULETA DE DESEMPATE</div>
     <div class="imara-mobile-tie-timer">${left}s</div>
     <div class="imara-mobile-tie-wheel-wrap">
       <div class="imara-mobile-tie-pointer"></div>
       <div class="imara-mobile-tie-wheel"></div>
       <div class="imara-mobile-tie-person">${esc(person(c))}<small>${esc(c.card_id||'')}</small></div>
     </div>
     <div class="imara-mobile-tie-list">${list.map(x=>`<div class="imara-mobile-tie-chip"><b>${esc(person(x))}</b><small>${esc(x.card_id||'')}</small></div>`).join('')}</div>
     <div class="imara-mobile-tie-sub">${elapsed<dur?'Tu cartón está bloqueado mientras se define el desempate.':'✨ Ruleta terminada · esperando confirmación oficial…'}</div>
   </div>`;
   raf=requestAnimationFrame(frame);
 }
 cancelAnimationFrame(raf);frame();
}

function winner(s){
 cancelAnimationFrame(raf);raf=0;currentKey='winner';
 lock();
 const w=s?.winner||{},o=overlay();
 o.classList.remove('hidden');
 o.innerHTML=`<div class="imara-mobile-tie-card">
   ${DEMO?'<div class="imara-mobile-tie-demo">DEMO · NO AFECTA EL JUEGO REAL</div>':''}
   <div class="imara-mobile-tie-kicker">BINGO IMARA</div>
   <div class="imara-mobile-winner-icon">🏆</div>
   <div class="imara-mobile-tie-title">GANADOR CONFIRMADO</div>
   <div class="imara-mobile-winner-name">${esc(w.buyer_alias||w.card_id||'Ganador')}</div>
   <div class="imara-mobile-winner-card">${esc(w.card_id||'')}</div>
   ${w.prize?`<div class="imara-mobile-winner-prize">🎁 ${esc(w.prize)}</div>`:''}
   <div class="imara-mobile-tie-sub">La ronda quedó cerrada. Tu cartón volverá a estar disponible cuando se abra la siguiente ronda.</div>
 </div>`;
}

function applyGame(payload){
 const s=payload?.game?.show_state||{type:'idle'};
 if(s.type==='tie'){tieFrame(s);return;}
 if(s.type==='winner'){winner(s);return;}
 hide();
}

css();
window.addEventListener('imara-mobile-game-state',e=>applyGame(e.detail));
window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;});
if(DEMO)window.IMARA_MOBILE_TIE_DEMO={applyGame,hide};
})();