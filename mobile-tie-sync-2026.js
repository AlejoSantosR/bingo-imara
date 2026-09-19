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
let raf=0,currentKey='',lockedShell=null,prevInert=false,confettiRaf=0,audioCtx=null,lastTieCandidates=[];

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const person=c=>String(c?.buyer_alias||c?.card_id||'Participante').trim()||'Participante';
const mod=(n,m)=>((n%m)+m)%m;
function ensureAudio(){try{if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;audioCtx=new AC();}if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});return true;}catch(_){return false;}}
function tone(freq,dur=.08,vol=.03,type='triangle',delay=0){if(!audioCtx||audioCtx.state!=='running')return;const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.03);}
function fanfare(){if(!audioCtx||audioCtx.state!=='running')return;[[523.25,0],[659.25,.13],[783.99,.26],[1046.5,.43]].forEach(([f,d],i)=>tone(f,.34,i===3?.055:.038,'triangle',d));tone(130.81,.7,.022,'sine',.02);}
function launchConfetti(){cancelAnimationFrame(confettiRaf);const canvas=overlay().querySelector('.imara-mobile-confetti');if(!canvas||window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return;const ctx=canvas.getContext('2d'),dpr=Math.min(2,devicePixelRatio||1);let w=canvas.clientWidth,h=canvas.clientHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);const colors=['#ffd45b','#fff1b8','#ff6f9f','#8d6bff','#57d8b5','#ffffff'],p=[];for(let i=0;i<100;i++)p.push({x:w/2+(Math.random()-.5)*90,y:h*.2,vx:(Math.random()-.5)*7,vy:-4-Math.random()*7,g:.13+Math.random()*.08,r:Math.random()*Math.PI,s:4+Math.random()*6,c:colors[i%colors.length],spin:(Math.random()-.5)*.24});const st=performance.now();function frame(now){ctx.clearRect(0,0,w,h);for(const a of p){a.vy+=a.g;a.x+=a.vx;a.y+=a.vy;a.r+=a.spin;ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.r);ctx.fillStyle=a.c;ctx.fillRect(-a.s/2,-a.s/3,a.s,a.s*.66);ctx.restore();}if(now-st<4500)confettiRaf=requestAnimationFrame(frame);}confettiRaf=requestAnimationFrame(frame);}
document.addEventListener('pointerdown',()=>ensureAudio(),{capture:true,once:true});

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
 .imara-mobile-casino{position:relative;width:min(455px,94vw);height:142px;margin:5px auto 8px;padding:13px 16px;border-radius:25px;background:linear-gradient(180deg,#4d3b27 0%,#1e1711 15%,#0f0d0c 50%,#261b10 86%,#5d4726 100%);border:2px solid #d9a93b;box-shadow:0 14px 34px #0009,0 0 35px rgba(255,191,55,.24),inset 0 2px 0 rgba(255,244,197,.22)}
 .imara-mobile-casino::before,.imara-mobile-casino::after{content:"";position:absolute;top:50%;width:16px;height:82px;transform:translateY(-50%);border-radius:10px;background:linear-gradient(90deg,#6b4b21,#f0c45f 45%,#6b4b21);box-shadow:0 0 12px rgba(255,206,85,.35)}
 .imara-mobile-casino::before{left:5px}.imara-mobile-casino::after{right:5px}
 .imara-mobile-reel-window{position:relative;width:100%;height:100%;overflow:hidden;border-radius:18px;background:linear-gradient(180deg,#111 0%,#23201c 18%,#090909 50%,#24201b 82%,#111 100%);border:2px solid rgba(255,224,143,.62);box-shadow:inset 0 0 28px #000,0 0 14px rgba(255,211,93,.18);mask-image:linear-gradient(90deg,transparent 0,#000 15%,#000 85%,transparent 100%);-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 15%,#000 85%,transparent 100%)}
 .imara-mobile-reel-window::before,.imara-mobile-reel-window::after{content:"";position:absolute;left:0;right:0;height:22%;z-index:4;pointer-events:none}
 .imara-mobile-reel-window::before{top:0;background:linear-gradient(#000b,transparent)}
 .imara-mobile-reel-window::after{bottom:0;background:linear-gradient(transparent,#000b)}
 .imara-mobile-reel-track{position:absolute;left:50%;top:50%;display:flex;align-items:center;gap:8px;will-change:transform;white-space:nowrap}
 .imara-mobile-reel-item{flex:0 0 clamp(96px,25vw,126px);height:76px;display:grid;place-items:center;text-align:center;padding:8px 7px;border-radius:15px;background:linear-gradient(180deg,#3b3024,#15110d 48%,#2c2117);border:1px solid rgba(255,215,118,.26);color:#fff0bd;font-size:clamp(11px,3.5vw,15px);font-weight:1000;line-height:1.05;box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 6px 14px #0008;transform:scale(.82);opacity:.38;filter:blur(.35px)}
 .imara-mobile-reel-item small{display:block;margin-top:4px;color:#d8ae58;font-size:7px}
 .imara-mobile-reel-item.near{opacity:.7;transform:scale(.91);filter:none}
 .imara-mobile-reel-item.current{opacity:1;transform:scale(1.08);filter:none;color:#fff8d9;border-color:#ffd66f;box-shadow:0 0 24px rgba(255,204,80,.34),inset 0 0 18px rgba(255,203,73,.09)}
 .imara-mobile-reel-marker{position:absolute;z-index:6;left:50%;top:5px;bottom:5px;width:clamp(102px,27vw,134px);transform:translateX(-50%);border:2px solid #ffd45d;border-radius:17px;box-shadow:0 0 16px rgba(255,205,76,.48),inset 0 0 14px rgba(255,205,76,.1);pointer-events:none}
 .imara-mobile-reel-marker::before{content:"▼";position:absolute;left:50%;top:-19px;transform:translateX(-50%);color:#ffe697;font-size:16px;filter:drop-shadow(0 2px 3px #0008)}
 .imara-mobile-casino-lights{position:absolute;left:36px;right:36px;top:4px;height:5px;background:radial-gradient(circle,#ffe8a1 0 2px,transparent 3px) 0 0/18px 5px repeat-x;opacity:.8;animation:imaraCasinoLights .7s linear infinite}
 @keyframes imaraCasinoLights{50%{opacity:.25}}
 @media(max-height:700px){.imara-mobile-casino{height:116px;padding:10px 14px}.imara-mobile-reel-item{height:62px}.imara-mobile-reel-marker{top:4px;bottom:4px}}
 .imara-mobile-tie-list{width:100%;display:flex;gap:5px;justify-content:center;flex-wrap:wrap;max-height:80px;overflow:auto;-webkit-overflow-scrolling:touch;padding:2px 0}
 .imara-mobile-tie-chip{max-width:46%;padding:5px 7px;border-radius:10px;background:#17100c;border:1px solid rgba(255,211,118,.24);font-size:9px;color:#fff1c9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .imara-mobile-tie-chip small{display:block;color:#ffc963;font-size:7px;margin-top:1px}
 .imara-mobile-tie-sub{margin-top:8px;color:#ead6ba;font-size:10px;line-height:1.25}
 .imara-mobile-tie-demo{margin-bottom:5px;padding:4px 8px;border-radius:999px;background:#6747c8;color:#fff;font-size:8px;font-weight:1000;letter-spacing:1px}
 .imara-mobile-winner-icon{font-size:46px;line-height:1;margin:8px 0}
 .imara-mobile-winner-name{font-size:clamp(25px,8vw,40px);font-weight:1000;color:#fff3c8;line-height:1.04;overflow-wrap:anywhere}
 .imara-mobile-winner-card{margin-top:7px;font-size:13px;font-weight:900;color:#ffd26f}
 .imara-mobile-winner-prize{margin-top:8px;padding:8px 10px;border-radius:12px;background:rgba(255,211,86,.09);border:1px solid rgba(255,211,86,.22);color:#ffe8a8;font-size:11px} .imara-mobile-winner-halo{position:absolute;width:min(420px,90vw);aspect-ratio:1;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,221,118,.16) 0 5deg,transparent 5deg 12deg);animation:imaraWinnerHalo 18s linear infinite;pointer-events:none} .imara-mobile-winner-ribbon{position:relative;width:min(430px,92%);margin:7px auto 10px;padding:10px 22px;background:linear-gradient(180deg,#ffe38a,#d99b22 52%,#a9660b);color:#291704;font-size:clamp(18px,5.7vw,27px);font-weight:1000;letter-spacing:.8px;text-shadow:0 1px 0 #fff8;box-shadow:0 8px 24px #0006,0 0 30px rgba(255,206,75,.3);clip-path:polygon(0 15%,8% 15%,12% 0,18% 15%,82% 15%,88% 0,92% 15%,100% 15%,96% 50%,100% 85%,92% 85%,88% 100%,82% 85%,18% 85%,12% 100%,8% 85%,0 85%,4% 50%)} .imara-mobile-confetti{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:20} .imara-mobile-sound{position:relative;margin-top:8px;border:1px solid rgba(255,224,141,.25);background:rgba(255,255,255,.06);color:#ffe9af;border-radius:999px;padding:7px 11px;font:800 10px/1 system-ui} @keyframes imaraTieGlow{to{box-shadow:0 0 31px rgba(255,205,77,.85),inset 0 0 23px rgba(255,205,77,.34)}}@keyframes imaraTiePointer{to{transform:translateX(-50%) rotate(4deg)}}@keyframes imaraWinnerHalo{to{transform:rotate(360deg)}}
 body.imara-mobile-tie-active .mobile-card-shell{user-select:none;-webkit-user-select:none}}
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
 cancelAnimationFrame(raf);raf=0;cancelAnimationFrame(confettiRaf);confettiRaf=0;currentKey='';
 overlay().classList.add('hidden');
 overlay().innerHTML='';
 unlock();
}

function tieFrame(s){
 const list=Array.isArray(s.candidates)?s.candidates.filter(x=>x?.card_id):[];
 const start=new Date(s.started_at||s.at||Date.now()).getTime();
 const dur=Math.max(DEFAULT_TIE_MS,Number(s.duration_ms)||0);
 if(list.length<2||!Number.isFinite(start)){hide();return;}
 lastTieCandidates=list;const key=`${start}|${dur}|${list.map(x=>x.card_id).join('|')}`;
 lock();
 const o=overlay();o.classList.remove('hidden');
 if(currentKey!==key){
   currentKey=key;
   const slice=360/list.length;
   o.innerHTML=`<div class="imara-mobile-tie-card">
     ${DEMO?'<div class="imara-mobile-tie-demo">DEMO · NO AFECTA EL JUEGO REAL</div>':''}
     <div class="imara-mobile-tie-kicker">🔥 EMPATE · ${list.length} BINGOS 🔥</div>
     <div class="imara-mobile-tie-title">RULETA DE DESEMPATE</div>
     <div class="imara-mobile-tie-timer" data-imara-tie-timer>10s</div>
     <div class="imara-mobile-casino">
       <div class="imara-mobile-casino-lights"></div>
       <div class="imara-mobile-reel-window">
         <div class="imara-mobile-reel-track" data-imara-reel></div>
         <div class="imara-mobile-reel-marker"></div>
       </div>
     </div>
     <div class="imara-mobile-tie-list">${list.map(x=>`<div class="imara-mobile-tie-chip"><b>${esc(person(x))}</b><small>${esc(x.card_id||'')}</small></div>`).join('')}</div>
     <div class="imara-mobile-tie-sub" data-imara-tie-sub>Tu cartón está bloqueado mientras la ruleta gira.</div>
   </div>`;
 }
 const timer=o.querySelector('[data-imara-tie-timer]');
 const reel=o.querySelector('[data-imara-reel]');
 const sub=o.querySelector('[data-imara-tie-sub]');
 let lastIdx=-1;
 function frame(){
   if(currentKey!==key)return;
   const elapsed=Math.max(0,Date.now()-start);
   const left=Math.max(0,Math.ceil((dur-elapsed)/1000));
   if(timer)timer.textContent=`${left}s`;
   if(reel){
     if(!reel.dataset.ready){
       const copies=14,items=[];for(let r=0;r<copies;r++)for(const x of list)items.push(`<div class="imara-mobile-reel-item"><b>${esc(person(x))}</b><small>${esc(x.card_id||'')}</small></div>`);reel.innerHTML=items.join('');reel.dataset.ready='1';
     }
     const first=reel.firstElementChild,step=(first?.getBoundingClientRect().width||110)+8,base=list.length*4,progress=elapsed/155,pos=base+progress;
     reel.dataset.pos=String(pos);reel.dataset.step=String(step);
     reel.style.transform=`translate3d(${-(pos*step+step/2)}px,-50%,0)`;
     const idx=Math.round(pos)%list.length;
     reel.querySelectorAll('.imara-mobile-reel-item').forEach((el,i)=>{const d=Math.abs(i-pos);el.classList.toggle('current',d<.5);el.classList.toggle('near',d>=.5&&d<1.55);});
     lastIdx=idx;
   }
   if(sub&&elapsed>=dur)sub.textContent='✨ Tiempo cumplido · esperando el resultado oficial…';
   raf=requestAnimationFrame(frame);
 }
 cancelAnimationFrame(raf);frame();
}
function renderWinner(s){
 cancelAnimationFrame(raf);raf=0;currentKey='winner';lock();const w=s?.winner||{},o=overlay();o.classList.remove('hidden');
 o.innerHTML=`<canvas class="imara-mobile-confetti"></canvas><div class="imara-mobile-tie-card" style="background:radial-gradient(circle at 50% 20%,rgba(255,211,91,.2),transparent 36%),linear-gradient(155deg,#24190d,#513116 55%,#21150a)"><div class="imara-mobile-winner-halo"></div>${DEMO?'<div class="imara-mobile-tie-demo">DEMO · NO AFECTA EL JUEGO REAL</div>':''}<div class="imara-mobile-tie-kicker">BINGO IMARA · RESULTADO OFICIAL</div><div class="imara-mobile-winner-icon">🏆</div><div class="imara-mobile-winner-ribbon">✨ GANADOR ✨</div><div class="imara-mobile-winner-name">${esc(w.buyer_alias||w.card_id||'Ganador')}</div><div class="imara-mobile-winner-card">${esc(w.card_id||'')}</div>${w.prize?`<div class="imara-mobile-winner-prize">🎁 ${esc(w.prize)}</div>`:''}<div class="imara-mobile-tie-sub">Resultado confirmado por Bingo IMARA. La ronda quedó cerrada.</div><button type="button" class="imara-mobile-sound" id="imaraWinnerSound">🔊 ${audioCtx?.state==='running'?'Sonido activo':'Activar sonido'}</button></div>`;
 o.querySelector('#imaraWinnerSound')?.addEventListener('click',()=>{ensureAudio();fanfare();});fanfare();launchConfetti();
}
function winner(s){
 cancelAnimationFrame(raf);raf=0;currentKey='winner';lock();const w=s?.winner||{},idx=lastTieCandidates.findIndex(x=>String(x.card_id)===String(w.card_id)),reel=overlay().querySelector('[data-imara-reel]');
 if(reel&&idx>=0&&lastTieCandidates.length){
   const step=Number(reel.dataset.step)||((reel.firstElementChild?.getBoundingClientRect().width||110)+8),cur=Number(reel.dataset.pos)||0,curIdx=mod(Math.round(cur),lastTieCandidates.length),delta=mod(idx-curIdx,lastTieCandidates.length),target=Math.round(cur)+lastTieCandidates.length*3+delta;
   const from=-(cur*step+step/2),to=-(target*step+step/2),sub=overlay().querySelector('.imara-mobile-tie-sub');
   if(sub)sub.textContent='✨ Los rodillos están frenando sobre el ganador…';
   const an=reel.animate([{transform:'translate3d('+from+'px,-50%,0)'},{transform:'translate3d('+to+'px,-50%,0)'}],{duration:2300,easing:'cubic-bezier(.08,.82,.17,1)',fill:'forwards'});
   const items=[...reel.querySelectorAll('.imara-mobile-reel-item')];items.forEach(x=>x.classList.remove('current','near'));const targetEl=items[Math.round(target)];if(targetEl)targetEl.classList.add('current');
   an.onfinish=()=>{tone(980,.16,.04);setTimeout(()=>renderWinner(s),250);};return;
 }
 renderWinner(s);
}
function applyGame(payload){
 const s=payload?.game?.show_state||{type:'idle'};
 if(s.type==='tie'){tieFrame(s);return;}
 if(s.type==='winner'){winner(s);return;}
 hide();
}

css();
window.addEventListener('imara-mobile-game-state',e=>applyGame(e.detail));
window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);cancelAnimationFrame(confettiRaf);raf=0;confettiRaf=0;});
if(DEMO)window.IMARA_MOBILE_TIE_DEMO={applyGame,hide};
})();