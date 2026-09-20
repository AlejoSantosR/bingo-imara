/* Bingo IMARA · presentación visual del desempate y ganador.
   La lógica oficial vive en bingo-live-flow-2026.js; este archivo solo pinta la ruleta/resultado. */
(function(){
'use strict';
window.__imaraTieVisual2026=true;
if(location.hash.startsWith('#mobile='))return;
const TIE_MS=10000;
const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const SESSION_KEY='imaraPrivateSessionV1';
let current={type:'idle'},raf=0,lastTie='',confettiRaf=0,audioCtx=null,lastCandidates=[],lastWinner='',nextRoundBusy=false;
function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
async function api(action,payload={}){const t=token();if(!t)throw new Error('Sesión Admin no disponible.');const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),10000);try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'No fue posible continuar la ronda.');return d;}finally{clearTimeout(tm);}}
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
function person(c){return String(c?.buyer_alias||c?.card_id||'Participante').trim()||'Participante';}
const mod=(n,m)=>((n%m)+m)%m;
function ensureAudio(){try{if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;audioCtx=new AC();}if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});return true;}catch(_){return false;}}
function tone(freq,dur=.08,vol=.03,type='triangle',delay=0){if(!audioCtx||audioCtx.state!=='running')return;const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.03);}
function fanfare(){if(!audioCtx||audioCtx.state!=='running')return;[[523.25,0],[659.25,.13],[783.99,.26],[1046.5,.43]].forEach(([f,d],i)=>tone(f,.34,i===3?.055:.038,'triangle',d));tone(130.81,.7,.022,'sine',.02);}
function celebrate(){cancelAnimationFrame(confettiRaf);const canvas=overlay().querySelector('.tie10-confetti');if(!canvas||window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return;const ctx=canvas.getContext('2d'),dpr=Math.min(2,devicePixelRatio||1);let w=canvas.clientWidth,h=canvas.clientHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);const colors=['#ffd45b','#fff1b8','#ff6f9f','#8d6bff','#57d8b5','#ffffff'],p=[];for(let i=0;i<130;i++)p.push({x:w/2+(Math.random()-.5)*100,y:h*.18,vx:(Math.random()-.5)*8,vy:-5-Math.random()*8,g:.14+Math.random()*.08,r:Math.random()*Math.PI,s:4+Math.random()*7,c:colors[i%colors.length],spin:(Math.random()-.5)*.25});const st=performance.now();function frame(now){ctx.clearRect(0,0,w,h);for(const a of p){a.vy+=a.g;a.x+=a.vx;a.y+=a.vy;a.r+=a.spin;ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.r);ctx.fillStyle=a.c;ctx.fillRect(-a.s/2,-a.s/3,a.s,a.s*.66);ctx.restore();}if(now-st<5000)confettiRaf=requestAnimationFrame(frame);}confettiRaf=requestAnimationFrame(frame);}
document.addEventListener('pointerdown',()=>ensureAudio(),{capture:true,once:true});
function css(){if(document.getElementById('tie10Css'))return;const s=document.createElement('style');s.id='tie10Css';s.textContent=`.tie10{position:fixed;inset:0;z-index:2147482700;display:grid;place-items:center;padding:20px;background:radial-gradient(circle at 50% 40%,rgba(94,49,14,.48),rgba(4,7,13,.96) 70%);backdrop-filter:blur(10px)}.tie10.hidden{display:none!important}.tie10-card{width:min(1180px,98vw);padding:34px 24px;border-radius:34px;text-align:center;background:linear-gradient(150deg,#21160e,#361f15);border:1px solid rgba(255,201,75,.5);box-shadow:0 35px 120px #000d,0 0 80px rgba(255,151,37,.22)}.tie10-title{font-size:clamp(42px,6vw,76px);font-weight:1000;color:#fff0bd}.tie10-timer{width:90px;height:90px;margin:12px auto 18px;border-radius:50%;display:grid;place-items:center;border:4px solid #ffc94f;background:#130d08;font-size:28px;font-weight:1000;color:#fff0b5}.tie10-casino{position:relative;width:min(980px,94vw);height:270px;margin:12px auto 18px;padding:24px 34px;border-radius:34px;background:linear-gradient(180deg,#5a4630,#1f1812 16%,#0f0d0c 50%,#281c11 84%,#66502c);border:3px solid #d9a93b;box-shadow:0 20px 50px #000a,0 0 50px rgba(255,191,55,.22),inset 0 2px 0 rgba(255,244,197,.25)}.tie10-casino::before,.tie10-casino::after{content:"";position:absolute;top:50%;width:28px;height:172px;transform:translateY(-50%);border-radius:14px;background:linear-gradient(90deg,#60421e,#f0c45f 45%,#6b4b21);box-shadow:0 0 18px rgba(255,206,85,.35)}.tie10-casino::before{left:8px}.tie10-casino::after{right:8px}.tie10-casino-lights{position:absolute;left:70px;right:70px;top:8px;height:8px;background:radial-gradient(circle,#fff1b7 0 3px,transparent 4px) 0 0/28px 7px repeat-x;opacity:.85;animation:tie10CasinoLights .75s linear infinite}.tie10-reel-window{position:relative;width:100%;height:100%;overflow:hidden;border-radius:28px;background:linear-gradient(180deg,#111,#26221d 17%,#090909 50%,#26211c 83%,#111);border:3px solid rgba(255,224,143,.62);box-shadow:inset 0 0 42px #000,0 0 18px rgba(255,211,93,.18);-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}.tie10-reel-track{position:absolute;left:50%;top:50%;display:flex;align-items:center;gap:14px;will-change:transform;white-space:nowrap}.tie10-reel-item{flex:0 0 clamp(190px,21vw,260px);height:158px;display:grid;place-items:center;text-align:center;padding:14px 18px;border-radius:20px;background:linear-gradient(180deg,#403428,#16120e 48%,#302419);border:1px solid rgba(255,215,118,.28);color:#fff0bd;font-size:clamp(26px,2.7vw,38px);font-weight:1000;line-height:1.05;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 8px 18px #0008;transform:scale(.8);opacity:.34;filter:blur(.45px);transition:flex-basis .42s cubic-bezier(.2,.85,.25,1),transform .25s ease,opacity .2s ease}.tie10-reel-item b{display:block;white-space:normal;overflow-wrap:anywhere;word-break:normal}.tie10-reel-item small{display:block;margin-top:8px;color:#f0c76a;font-size:14px;font-weight:900;letter-spacing:.35px}.tie10-reel-item.near{opacity:.82;transform:scale(.92);filter:none}.tie10-reel-item.current{opacity:1;transform:scale(1.1);filter:none;color:#fff8d9;border-color:#ffd66f;box-shadow:0 0 34px rgba(255,204,80,.36),inset 0 0 24px rgba(255,203,73,.1)}.tie10-reel-marker{position:absolute;z-index:6;left:50%;top:12px;bottom:12px;width:clamp(206px,23vw,278px);transform:translateX(-50%);border:3px solid #ffd45d;border-radius:22px;box-shadow:0 0 22px rgba(255,205,76,.48),inset 0 0 18px rgba(255,205,76,.1);pointer-events:none;transition:width .42s cubic-bezier(.2,.85,.25,1)}@keyframes tie10CasinoLights{50%{opacity:.25}}@media(max-width:900px){.tie10-card{width:min(98vw,900px);padding:24px 16px}.tie10-title{font-size:clamp(34px,7vw,58px)}.tie10-casino{width:min(94vw,820px);height:220px;padding:20px 28px}.tie10-reel-item{flex-basis:clamp(165px,24vw,220px);height:132px;font-size:clamp(22px,3vw,31px)}.tie10-reel-marker{width:clamp(182px,26vw,238px)}}.tie10-list{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px}.tie10-chip{padding:10px 13px;border-radius:14px;font-size:13px;background:#17100c;border:1px solid rgba(255,211,118,.25);color:#fff1c9}.tie10-chip small{display:block;color:#ffc963;font-size:10px;margin-top:3px}.tie10-sub{margin-top:14px;color:#e4cfb5;font-size:14px;line-height:1.3}.tie10-confetti{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:8}.tie10-winner-card{position:relative;overflow:hidden;background:radial-gradient(circle at 50% 22%,rgba(255,211,91,.2),transparent 36%),linear-gradient(155deg,#24190d,#513116 55%,#21150a)}.tie10-halo{position:absolute;left:50%;top:50%;width:min(500px,88vw);aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,221,118,.15) 0 5deg,transparent 5deg 12deg);animation:tieHalo 18s linear infinite}.tie10-trophy{position:relative;font-size:60px;margin:10px 0 2px;filter:drop-shadow(0 0 16px rgba(255,210,78,.48))}.tie10-ribbon{position:relative;width:min(520px,92%);margin:10px auto 12px;padding:13px 26px;background:linear-gradient(180deg,#ffe38a,#d99b22 52%,#a9660b);color:#291704;font-size:clamp(22px,4.5vw,38px);font-weight:1000;letter-spacing:1px;text-shadow:0 1px 0 #fff8;box-shadow:0 8px 28px #0006,0 0 34px rgba(255,206,75,.3);clip-path:polygon(0 15%,8% 15%,12% 0,18% 15%,82% 15%,88% 0,92% 15%,100% 15%,96% 50%,100% 85%,92% 85%,88% 100%,82% 85%,18% 85%,12% 100%,8% 85%,0 85%,4% 50%)}.tie10-winner-name{position:relative;font-size:clamp(34px,6vw,64px);font-weight:1000;color:#fff8d7;text-shadow:0 0 28px rgba(255,214,99,.24)}.tie10-winner-cardid{position:relative;margin-top:7px;font-size:16px;font-weight:900;color:#ffd26f}.tie10-winner-prize{position:relative;margin:10px auto 0;padding:9px 13px;border-radius:13px;background:rgba(255,211,86,.09);border:1px solid rgba(255,211,86,.24);color:#ffe8a8;width:max-content;max-width:90%}.tie10-winner-prize-show{position:relative;display:grid;grid-template-columns:110px 1fr;gap:14px;align-items:center;width:min(620px,92%);margin:14px auto 0;padding:12px;border-radius:18px;background:rgba(255,211,86,.08);border:1px solid rgba(255,211,86,.24);text-align:left}.tie10-winner-prize-show img{width:110px;height:110px;object-fit:contain;border-radius:14px;background:rgba(0,0,0,.18)}.tie10-winner-prize-show b{display:block;color:#fff0b9;font-size:18px}.tie10-winner-prize-show small{display:block;margin-top:4px;color:#d9cfb2;font-size:12px;line-height:1.3}.tie10-sound{position:relative;margin-top:11px;border:1px solid rgba(255,224,141,.25);background:rgba(255,255,255,.06);color:#ffe9af;border-radius:999px;padding:8px 12px;font-weight:800}.tie10-next{position:relative;margin:14px 7px 0;border:1px solid rgba(111,255,190,.45);background:linear-gradient(135deg,#22b884,#159c70);color:#071d16;border-radius:999px;padding:12px 18px;font-weight:1000;font-size:15px;box-shadow:0 10px 28px rgba(34,184,132,.22);cursor:pointer}.tie10-next:disabled{opacity:.65;cursor:wait}@keyframes tieHalo{to{transform:translate(-50%,-50%) rotate(360deg)}}`;document.head.appendChild(s);}
function overlay(){let o=document.getElementById('tie10Overlay');if(!o){o=document.createElement('div');o.id='tie10Overlay';o.className='tie10 hidden';document.body.appendChild(o);}return o;}
function hide(){cancelAnimationFrame(raf);raf=0;cancelAnimationFrame(confettiRaf);confettiRaf=0;lastWinner='';const o=overlay();delete o.dataset.tieKey;o.classList.add('hidden');}
function draw(s){
 const list=Array.isArray(s.candidates)?s.candidates:[];lastCandidates=list;
 const start=new Date(s.started_at||0).getTime(),dur=Math.max(TIE_MS,Number(s.duration_ms)||0),key=`${s.started_at}|${list.map(x=>x.card_id).join('|')}`;
 if(!list.length||!start){hide();return;}
 lastTie=key;const o=overlay();o.classList.remove('hidden');
 if(o.dataset.tieKey!==key){
   o.dataset.tieKey=key;
   o.innerHTML=`<div class="tie10-card"><div style="font-size:12px;letter-spacing:3px;font-weight:1000;color:#ffdca0">🔥 EMPATE · ${list.length} BINGOS 🔥</div><div class="tie10-title">RULETA DE DESEMPATE</div><div class="tie10-timer" data-tie10-timer>10s</div><div class="tie10-casino"><div class="tie10-casino-lights"></div><div class="tie10-reel-window"><div class="tie10-reel-track" data-tie10-reel></div><div class="tie10-reel-marker"></div></div></div><div class="tie10-list">${list.map(x=>`<div class="tie10-chip"><b>${esc(person(x))}</b><small>${esc(x.card_id||'')}</small></div>`).join('')}</div><div class="tie10-sub" data-tie10-sub>La ruleta está girando con todos los cartones empatados.</div></div>`;
 }
 const timer=o.querySelector('[data-tie10-timer]'),reel=o.querySelector('[data-tie10-reel]'),sub=o.querySelector('[data-tie10-sub]');
 let lastIdx=-1;
 function frame(){
   if(lastTie!==key)return;
   const elapsed=Math.max(0,Date.now()-start),left=Math.max(0,Math.ceil((dur-elapsed)/1000));
   if(timer)timer.textContent=`${left}s`;
   if(reel){if(!reel.dataset.ready){const items=[];for(let r=0;r<14;r++)for(const x of list)items.push(`<div class="tie10-reel-item" data-card-id="${esc(x.card_id||'')}"><b>${esc(person(x))}</b><small>${esc(x.card_id||'')}</small></div>`);reel.innerHTML=items.join('');reel.dataset.ready='1';}const first=reel.firstElementChild,itemW=first?.getBoundingClientRect().width||225,step=itemW+14,base=list.length*4,progress=elapsed/155,pos=base+progress,x=-(pos*step+itemW/2);reel.dataset.pos=String(pos);reel.dataset.step=String(step);reel.dataset.x=String(x);reel.style.transform=`translate3d(${x}px,-50%,0)`;const idx=Math.round(pos)%list.length;reel.querySelectorAll('.tie10-reel-item').forEach((el,i)=>{const d=Math.abs(i-pos);el.classList.toggle('current',d<.5);el.classList.toggle('near',d>=.5&&d<1.55);});lastIdx=idx;}
   if(sub&&elapsed>=dur)sub.textContent='✨ Tiempo cumplido · esperando el resultado oficial…';
   raf=requestAnimationFrame(frame);
 }
 cancelAnimationFrame(raf);frame();
}

function renderTieWinner(s){
 const w=s?.winner||{},key=String(w.card_id||'')+'|'+String(s.at||'');
 if(lastWinner===key)return;lastWinner=key;
 const o=overlay(),raw=String(w.prize||''),title=String(w.prize_title||'').trim()||raw.split(' · ')[1]||raw,desc=String(w.prize_description||''),img=String(w.prize_image||'');
 const prizeBlock=(title||img)?`<div class="tie10-winner-prize-show">${img?`<img src="${esc(img)}" alt="">`:'<div style="font-size:52px;text-align:center">🎁</div>'}<div><b>🎁 ${esc(title||'Premio')}</b>${desc?`<small>${esc(desc)}</small>`:''}</div></div>`:'';
 o.classList.remove('hidden');
 o.innerHTML='<canvas class="tie10-confetti"></canvas><div class="tie10-card tie10-winner-card"><div class="tie10-halo"></div><div style="position:relative;font-size:12px;letter-spacing:3px;font-weight:1000;color:#ffdca0">BINGO IMARA · RESULTADO OFICIAL</div><div class="tie10-trophy">🏆</div><div class="tie10-ribbon">✨ GANADOR ✨</div><div class="tie10-winner-name">'+esc(w.buyer_alias||w.card_id||'GANADOR')+'</div><div class="tie10-winner-cardid">'+esc(w.card_id||'')+'</div>'+prizeBlock+'<div class="tie10-sub">Resultado confirmado. La ronda quedó cerrada.</div>'+(isAdmin()?'<button type="button" class="tie10-next" id="tie10NextRound">➡️ Continuar a siguiente ronda</button>':'')+'<button type="button" class="tie10-sound" id="tie10Sound">🔊 '+(audioCtx?.state==='running'?'Sonido activo':'Activar sonido')+'</button></div>';
 o.querySelector('#tie10Sound')?.addEventListener('click',()=>{ensureAudio();fanfare();});
 o.querySelector('#tie10NextRound')?.addEventListener('click',e=>continueAfterWinner(e.currentTarget));
 fanfare();celebrate();
}
async function continueAfterWinner(btn){
 if(nextRoundBusy||!isAdmin())return;
 nextRoundBusy=true;
 const old=btn?.textContent||'➡️ Continuar a siguiente ronda';
 if(btn){btn.disabled=true;btn.textContent='⏳ Preparando siguiente ronda…';}
 try{
   const b=await api('bingo-claims').catch(()=>({claims:[],candidates:[]}));
   const ids=[...(b.claims||[]),...(b.candidates||[]),current?.winner||{}].map(x=>String(x?.card_id||'')).filter(Boolean);
   const unique=[...new Set(ids)];
   if(unique.length)await api('bingo-reject',{card_ids:unique}).catch(()=>{});
   await api('show-set',{show_state:{type:'idle'}});
   current={type:'idle'};hide();
   const nav=document.querySelector('.nav [data-view="game"],[data-view="game"]');nav?.click();
   setTimeout(()=>{const next=document.getElementById('roundPrepare2026');if(next&&!next.disabled)next.click();else if(typeof toast==='function')toast('✅ Ganador cerrado. Prepara la siguiente ronda desde Juego.');},220);
 }catch(err){
   if(btn?.isConnected){btn.disabled=false;btn.textContent=old;}
   alert(err.message||'No fue posible continuar la ronda.');
 }finally{nextRoundBusy=false;}
}
function fitWinnerTarget(item,marker){
 if(!item||!marker)return 0;
 const label=item.querySelector('b'),win=item.closest('.tie10-reel-window');
 if(!label||!win)return 0;
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 if(!ctx)return 0;
 const style=getComputedStyle(label);
 ctx.font=style.font||(`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`);
 const textW=ctx.measureText((label.textContent||'').trim()).width;
 const maxW=Math.max(250,Math.min(720,(win.clientWidth||760)-72));
 const desired=Math.round(Math.max(230,Math.min(maxW,textW+96)));
 item.style.flex='0 0 '+desired+'px';
 marker.style.width=Math.min(maxW+24,desired+28)+'px';
 item.getBoundingClientRect();
 marker.getBoundingClientRect();
 return desired;
}
function showTieWinner(s){
 cancelAnimationFrame(raf);raf=0;
 const w=s?.winner||{},winnerId=String(w.card_id||''),reel=overlay().querySelector('[data-tie10-reel]');
 const winnerExists=lastCandidates.some(x=>String(x.card_id)===winnerId);
 if(reel&&winnerId&&winnerExists&&lastCandidates.length){
   const items=[...reel.querySelectorAll('.tie10-reel-item')],cur=Number(reel.dataset.pos)||0,minIndex=Math.ceil(cur)+lastCandidates.length*2;
   let pick=items.map((el,i)=>({el,i})).find(x=>x.i>=minIndex&&String(x.el.dataset.cardId||'')===winnerId);
   if(!pick)pick=items.map((el,i)=>({el,i})).find(x=>x.i>cur&&String(x.el.dataset.cardId||'')===winnerId);
   if(!pick)pick=items.map((el,i)=>({el,i})).find(x=>String(x.el.dataset.cardId||'')===winnerId);
   if(pick){
     const marker=overlay().querySelector('.tie10-reel-marker'),from=Number(reel.dataset.x)||0,sub=overlay().querySelector('.tie10-sub');
     if(reel.dataset.finalizing===winnerId)return;
     reel.dataset.finalizing=winnerId;
     if(sub)sub.textContent='✨ Ajustando el selector al ganador oficial…';
     items.forEach(x=>x.classList.remove('current','near'));
     fitWinnerTarget(pick.el,marker);

     setTimeout(()=>{
       requestAnimationFrame(()=>requestAnimationFrame(()=>{
         const to=-(pick.el.offsetLeft+pick.el.offsetWidth/2);
         if(sub)sub.textContent='✨ Los rodillos están frenando sobre el ganador oficial…';
         const an=reel.animate([{transform:'translate3d('+from+'px,-50%,0)'},{transform:'translate3d('+to+'px,-50%,0)'}],{duration:2300,easing:'cubic-bezier(.08,.82,.17,1)',fill:'forwards'});
         an.onfinish=()=>{
           reel.style.transform='translate3d('+to+'px,-50%,0)';
           reel.dataset.x=String(to);
           an.cancel();
           items.forEach(x=>x.classList.remove('current','near'));
           pick.el.classList.add('current');
           if(sub)sub.textContent='🎯 Seleccionado: '+person(w)+' · '+winnerId;
           tone(980,.16,.04);
           setTimeout(()=>renderTieWinner(s),1200);
         };
       }));
     },460);
     return;
   }
 }
 renderTieWinner(s);
}
async function applyGame(o){try{current=o?.game?.show_state||{type:'idle'};if(current.type==='tie'){lastWinner='';draw({...current,duration_ms:Math.max(TIE_MS,Number(current.duration_ms)||0)});}else if(current.type==='winner'){lastTie='';showTieWinner(current);}else{lastTie='';hide();}}catch(e){console.warn('Desempate',e);}}
window.addEventListener('imara-game-realtime',e=>applyGame(e.detail));
window.addEventListener('imara-public-game-state',e=>applyGame(e.detail));
css();
})();