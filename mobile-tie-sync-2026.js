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
function wheelGradient(n){const colors=['#f7cf56','#754bd1','#ef8c38','#d64c78','#4fc9b0','#5d8de6'],step=360/Math.max(1,n),p=[];for(let i=0;i<n;i++)p.push(colors[i%colors.length]+' '+(i*step)+'deg '+((i+1)*step)+'deg');return 'conic-gradient(from -90deg,'+p.join(',')+')';}
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
 .imara-mobile-tie-wheel-wrap{position:relative;width:min(245px,58vw,31vh);aspect-ratio:1;margin:3px auto 7px;flex:0 1 auto}
 .imara-mobile-tie-wheel{position:absolute;inset:0;border-radius:50%;border:8px solid #e4b33e;background:conic-gradient(#f7cf56 0 25%,#754bd1 25% 50%,#ef8c38 50% 75%,#d64c79 75% 100%);box-shadow:0 0 0 4px #4a320c,0 0 48px rgba(255,184,45,.22);will-change:transform}
 .imara-mobile-tie-wheel::after{content:"";position:absolute;inset:20%;border-radius:50%;background:#15100b;border:3px solid #ffe08a} .imara-mobile-wheel-name{position:absolute;z-index:2;left:50%;top:50%;width:43%;transform-origin:0 50%;font-size:clamp(7px,2.25vw,10px);font-weight:1000;color:#211406;text-shadow:0 1px 0 rgba(255,255,255,.48);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right;padding-right:4px;pointer-events:none} .imara-mobile-wheel-name small{display:block;font-size:6px;opacity:.72}
 .imara-mobile-tie-pointer{position:absolute;z-index:4;left:50%;top:-5px;transform:translateX(-50%);width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-bottom:26px solid #fff0b8;filter:drop-shadow(0 3px 4px #0008)}
 .imara-mobile-tie-person{position:absolute;z-index:5;inset:31%;display:grid;place-items:center;text-align:center;font-size:clamp(13px,4vw,20px);font-weight:1000;line-height:1.05;color:#fff2c4;overflow-wrap:anywhere}
 .imara-mobile-tie-person small{display:block;margin-top:3px;color:#ffc85e;font-size:8px} .imara-mobile-slot{position:absolute;z-index:5;inset:29%;overflow:hidden;border-radius:999px;background:radial-gradient(circle at 38% 28%,#2b1b0c,#120b07 72%);border:3px solid #ffe08a;box-shadow:inset 0 0 18px #0009,0 0 15px rgba(255,214,100,.28)} .imara-mobile-slot-track{position:absolute;left:0;right:0;top:-100%;height:300%;display:grid;grid-template-rows:repeat(3,minmax(0,1fr));align-items:center;text-align:center;color:#fff2c4;font-size:clamp(11px,3.5vw,17px);font-weight:1000;line-height:1.05;will-change:transform,filter} .imara-mobile-slot-track.roll{animation:imaraMobileSlotRoll .15s cubic-bezier(.2,.85,.35,1)} .imara-mobile-slot-row{display:grid;place-items:center;min-width:0;padding:0 3px;opacity:.38;transform:scale(.78)} .imara-mobile-slot-row.current{opacity:1;transform:scale(1);text-shadow:0 0 9px rgba(255,210,90,.34)} .imara-mobile-slot-row small{display:block;margin-top:2px;color:#ffc85e;font-size:7px} @keyframes imaraMobileSlotRoll{from{transform:translateY(18%);filter:blur(1.4px)}to{transform:translateY(0);filter:blur(0)}}
 .imara-mobile-tie-list{width:100%;display:flex;gap:5px;justify-content:center;flex-wrap:wrap;max-height:80px;overflow:auto;-webkit-overflow-scrolling:touch;padding:2px 0}
 .imara-mobile-tie-chip{max-width:46%;padding:5px 7px;border-radius:10px;background:#17100c;border:1px solid rgba(255,211,118,.24);font-size:9px;color:#fff1c9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .imara-mobile-tie-chip small{display:block;color:#ffc963;font-size:7px;margin-top:1px}
 .imara-mobile-tie-sub{margin-top:8px;color:#ead6ba;font-size:10px;line-height:1.25}
 .imara-mobile-tie-demo{margin-bottom:5px;padding:4px 8px;border-radius:999px;background:#6747c8;color:#fff;font-size:8px;font-weight:1000;letter-spacing:1px}
 .imara-mobile-winner-icon{font-size:46px;line-height:1;margin:8px 0}
 .imara-mobile-winner-name{font-size:clamp(25px,8vw,40px);font-weight:1000;color:#fff3c8;line-height:1.04;overflow-wrap:anywhere}
 .imara-mobile-winner-card{margin-top:7px;font-size:13px;font-weight:900;color:#ffd26f}
 .imara-mobile-winner-prize{margin-top:8px;padding:8px 10px;border-radius:12px;background:rgba(255,211,86,.09);border:1px solid rgba(255,211,86,.22);color:#ffe8a8;font-size:11px} .imara-mobile-tie-wheel-wrap::before{content:"";position:absolute;inset:-7px;border-radius:50%;border:2px solid rgba(255,225,137,.78);box-shadow:0 0 18px rgba(255,205,77,.55),inset 0 0 16px rgba(255,205,77,.24);animation:imaraTieGlow .75s ease-in-out infinite alternate;pointer-events:none} .imara-mobile-tie-pointer{animation:imaraTiePointer .16s ease-in-out infinite alternate} .imara-mobile-winner-halo{position:absolute;width:min(420px,90vw);aspect-ratio:1;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,221,118,.16) 0 5deg,transparent 5deg 12deg);animation:imaraWinnerHalo 18s linear infinite;pointer-events:none} .imara-mobile-winner-ribbon{position:relative;width:min(430px,92%);margin:7px auto 10px;padding:10px 22px;background:linear-gradient(180deg,#ffe38a,#d99b22 52%,#a9660b);color:#291704;font-size:clamp(18px,5.7vw,27px);font-weight:1000;letter-spacing:.8px;text-shadow:0 1px 0 #fff8;box-shadow:0 8px 24px #0006,0 0 30px rgba(255,206,75,.3);clip-path:polygon(0 15%,8% 15%,12% 0,18% 15%,82% 15%,88% 0,92% 15%,100% 15%,96% 50%,100% 85%,92% 85%,88% 100%,82% 85%,18% 85%,12% 100%,8% 85%,0 85%,4% 50%)} .imara-mobile-confetti{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:20} .imara-mobile-sound{position:relative;margin-top:8px;border:1px solid rgba(255,224,141,.25);background:rgba(255,255,255,.06);color:#ffe9af;border-radius:999px;padding:7px 11px;font:800 10px/1 system-ui} @keyframes imaraTieGlow{to{box-shadow:0 0 31px rgba(255,205,77,.85),inset 0 0 23px rgba(255,205,77,.34)}}@keyframes imaraTiePointer{to{transform:translateX(-50%) rotate(4deg)}}@keyframes imaraWinnerHalo{to{transform:rotate(360deg)}}
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
   const labels=list.map((x,i)=>{
     const a=(i+.5)*slice-90;
     const short=person(x).length>13?person(x).slice(0,12)+'…':person(x);
     return `<div class="imara-mobile-wheel-name" style="transform:rotate(${a}deg) translateX(62%) rotate(${-a}deg)"><b>${esc(short)}</b><small>${esc(x.card_id||'')}</small></div>`;
   }).join('');
   o.innerHTML=`<div class="imara-mobile-tie-card">
     ${DEMO?'<div class="imara-mobile-tie-demo">DEMO · NO AFECTA EL JUEGO REAL</div>':''}
     <div class="imara-mobile-tie-kicker">🔥 EMPATE · ${list.length} BINGOS 🔥</div>
     <div class="imara-mobile-tie-title">RULETA DE DESEMPATE</div>
     <div class="imara-mobile-tie-timer" data-imara-tie-timer>10s</div>
     <div class="imara-mobile-tie-wheel-wrap">
       <div class="imara-mobile-tie-pointer"></div>
       <div class="imara-mobile-tie-wheel" data-imara-wheel style="background:${wheelGradient(list.length)}">${labels}</div>
       <div class="imara-mobile-slot"><div class="imara-mobile-slot-track" data-imara-tie-person></div></div>
     </div>
     <div class="imara-mobile-tie-list">${list.map(x=>`<div class="imara-mobile-tie-chip"><b>${esc(person(x))}</b><small>${esc(x.card_id||'')}</small></div>`).join('')}</div>
     <div class="imara-mobile-tie-sub" data-imara-tie-sub>Tu cartón está bloqueado mientras la ruleta gira.</div>
   </div>`;
 }
 const timer=o.querySelector('[data-imara-tie-timer]');
 const center=o.querySelector('[data-imara-tie-person]');
 const sub=o.querySelector('[data-imara-tie-sub]');
 let lastIdx=-1;
 function frame(){
   if(currentKey!==key)return;
   const elapsed=Math.max(0,Date.now()-start);
   const left=Math.max(0,Math.ceil((dur-elapsed)/1000));
   if(timer)timer.textContent=`${left}s`;
   const rotation=(elapsed/700*360)%360;
   const wheel=o.querySelector('[data-imara-wheel]');
   if(wheel){wheel.style.animation='none';wheel.style.transform=`rotate(${rotation}deg)`;}
   const slice=360/list.length;
   const idx=Math.floor(mod(-rotation+slice/2,360)/slice)%list.length;
   if(center&&idx!==lastIdx){
     lastIdx=idx;
     const prev=list[mod(idx-1,list.length)]||list[0],x=list[idx]||list[0],next=list[(idx+1)%list.length]||list[0];
     center.innerHTML=`<div class="imara-mobile-slot-row">${esc(person(prev))}</div><div class="imara-mobile-slot-row current">${esc(person(x))}<small>${esc(x.card_id||'')}</small></div><div class="imara-mobile-slot-row">${esc(person(next))}</div>`;
     center.classList.remove('roll');void center.offsetWidth;center.classList.add('roll');
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
 cancelAnimationFrame(raf);raf=0;currentKey='winner';lock();const w=s?.winner||{},idx=lastTieCandidates.findIndex(x=>String(x.card_id)===String(w.card_id)),wheel=overlay().querySelector('[data-imara-wheel]');
 if(wheel&&idx>=0&&lastTieCandidates.length){const m=getComputedStyle(wheel).transform;let cur=0;if(m&&m!=='none'){const a=m.match(/matrix\(([^)]+)\)/);if(a){const v=a[1].split(',').map(Number);cur=Math.atan2(v[1],v[0])*180/Math.PI;}}wheel.style.animation='none';const slice=360/lastTieCandidates.length,target=-((idx+.5)*slice),end=cur+1440+mod(target-cur,360),center=overlay().querySelector('[data-imara-tie-person]'),sub=overlay().querySelector('.imara-mobile-tie-sub');if(center){const x=lastTieCandidates[idx];center.innerHTML='<div class="imara-mobile-slot-row">'+esc(person(x))+'</div><div class="imara-mobile-slot-row current">'+esc(person(x))+'<small>'+esc(w.card_id||'')+'</small></div><div class="imara-mobile-slot-row">'+esc(person(x))+'</div>';}if(sub)sub.textContent='✨ La ruleta está frenando sobre el ganador…';const an=wheel.animate([{transform:'rotate('+cur+'deg)'},{transform:'rotate('+end+'deg)'}],{duration:2200,easing:'cubic-bezier(.12,.8,.18,1)',fill:'forwards'});an.onfinish=()=>{tone(980,.16,.04);setTimeout(()=>renderWinner(s),250);};return;}
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