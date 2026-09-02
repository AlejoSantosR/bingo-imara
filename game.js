/* =========================================================
   BINGO IMARA · Motor de juego + experiencia animada
   PL4 · Tribu IMARA
   ========================================================= */

let rouletteRunning = false;
let rouletteTimer = null;

function installMotionStyles(){
  if(document.getElementById('imaraMotionStyles')) return;
  const style = document.createElement('style');
  style.id = 'imaraMotionStyles';
  style.textContent = `
    :root{
      --spinPink:#ff5b8f;
      --spinPurple:#8d6bff;
      --spinMint:#2bd4a7;
      --spinGold:#ffbf47;
    }

    body{
      background-size:135% 135%;
      animation:imaraAmbient 16s ease-in-out infinite alternate;
    }
    body::before{
      content:"";
      position:fixed;
      inset:0;
      pointer-events:none;
      z-index:-1;
      background:
        radial-gradient(circle at 18% 30%,rgba(255,91,143,.08),transparent 22%),
        radial-gradient(circle at 82% 68%,rgba(141,107,255,.09),transparent 24%);
      animation:ambientOrbs 11s ease-in-out infinite alternate;
    }

    .sidebar{animation:sidebarEnter .55s cubic-bezier(.2,.8,.25,1) both}
    .topbar{animation:topbarEnter .5s .08s cubic-bezier(.2,.8,.25,1) both}
    .brand-logo{box-shadow:0 0 0 0 rgba(141,107,255,.22);animation:logoFloat 3.4s ease-in-out infinite,logoAura 2.7s ease-in-out infinite}
    .nav button{position:relative;overflow:hidden}
    .nav button::after{
      content:"";
      position:absolute;
      width:5px;height:5px;border-radius:50%;
      right:11px;top:50%;transform:translateY(-50%) scale(0);
      background:var(--spinPink);
      box-shadow:0 0 14px var(--spinPink);
      transition:transform .2s ease;
    }
    .nav button.active::after{transform:translateY(-50%) scale(1);animation:navDot 1.5s ease-in-out infinite}

    .view:not(.hidden) .card{animation:panelEntrance .48s cubic-bezier(.2,.85,.28,1)}
    .view:not(.hidden) .card:nth-of-type(2){animation-delay:.05s}
    .view:not(.hidden) .card:nth-of-type(3){animation-delay:.1s}
    .view:not(.hidden) .card:nth-of-type(4){animation-delay:.15s}
    .kpi{overflow:hidden;position:relative}
    .kpi::before{
      content:"";position:absolute;inset:auto -20% -70% -20%;height:95%;
      background:radial-gradient(circle,rgba(141,107,255,.13),transparent 68%);
      animation:kpiAura 3.6s ease-in-out infinite alternate;pointer-events:none;
    }
    .kpi .value{
      position:relative;
      text-shadow:0 0 22px rgba(141,107,255,.16);
      animation:kpiNumber 2.6s ease-in-out infinite alternate;
    }

    .btn,.mini{position:relative;overflow:hidden}
    .btn.primary::after,.btn.good::after{
      content:"";position:absolute;top:-60%;bottom:-60%;width:38px;left:-70px;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,.32),transparent);
      transform:rotate(18deg);
      animation:buttonShine 3.4s ease-in-out infinite;
      pointer-events:none;
    }
    .btn:disabled,.mini:disabled{opacity:.48;cursor:not-allowed;transform:none!important;filter:none!important}
    .input{transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease}
    .input:focus{box-shadow:0 0 0 3px rgba(141,107,255,.12),0 8px 24px rgba(0,0,0,.16);transform:translateY(-1px)}
    .badge{transition:transform .18s ease,filter .18s ease}
    .badge:hover{transform:scale(1.06)}
    tbody tr{transition:transform .18s ease,background .18s ease}
    tbody tr:hover{transform:translateX(3px)}
    .history .chip{transition:transform .18s ease,border-color .18s ease}
    .history .chip:hover{transform:translateY(-2px) scale(1.04);border-color:#536993}
    .bingo-card{animation:bingoCardEnter .5s cubic-bezier(.18,.86,.28,1)}
    .bingo-grid .called{animation:calledCell .45s cubic-bezier(.2,1.3,.32,1)}
    .success,.notice,.danger{animation:alertEnter .32s ease}
    dialog[open]{animation:dialogEnter .3s cubic-bezier(.2,.88,.28,1)}
    dialog[open]::backdrop{animation:backdropIn .25s ease}

    /* Balotera / ruleta */
    .last-ball{
      position:relative;
      overflow:visible;
      isolation:isolate;
      transition:filter .25s ease,box-shadow .25s ease,transform .25s ease;
    }
    .last-ball::before{
      content:"";
      position:absolute;
      inset:-15px;
      border-radius:50%;
      border:4px dashed rgba(255,255,255,.0);
      opacity:0;
      pointer-events:none;
      z-index:-1;
    }
    .last-ball::after{
      content:"";
      position:absolute;
      inset:9% 18% auto 18%;
      height:24%;
      border-radius:50%;
      background:linear-gradient(180deg,rgba(255,255,255,.56),rgba(255,255,255,0));
      opacity:.55;
      pointer-events:none;
    }
    .last-ball.roulette-spinning{
      animation:ballRoulette .3s ease-in-out infinite alternate;
      filter:saturate(1.12) brightness(1.03);
      box-shadow:
        0 0 0 7px rgba(141,107,255,.08),
        0 0 46px rgba(255,91,143,.34),
        0 24px 65px rgba(0,0,0,.48),
        inset 0 -16px 30px rgba(0,0,0,.18);
    }
    .last-ball.roulette-spinning::before{
      opacity:1;
      border-color:rgba(255,255,255,.26);
      border-top-color:var(--spinPink);
      border-right-color:var(--spinPurple);
      animation:ringSpin .58s linear infinite;
      box-shadow:0 0 25px rgba(141,107,255,.2);
    }
    .last-ball.roulette-reveal{
      animation:ballReveal .78s cubic-bezier(.16,1.35,.25,1);
      box-shadow:
        0 0 0 8px rgba(255,191,71,.1),
        0 0 58px rgba(255,191,71,.42),
        0 24px 65px rgba(0,0,0,.48),
        inset 0 -16px 30px rgba(0,0,0,.18);
    }
    .draw-box.roulette-live,.public-main.roulette-live{
      border-color:rgba(141,107,255,.72)!important;
      animation:roulettePanel 1s ease-in-out infinite alternate!important;
    }

    .roulette-status{
      width:min(430px,100%);
      margin:0 auto 14px;
      padding:0 12px;
      max-height:0;
      opacity:0;
      overflow:hidden;
      transform:translateY(-8px) scale(.98);
      transition:max-height .3s ease,opacity .25s ease,transform .3s ease,padding .3s ease;
      text-align:center;
    }
    .roulette-status.active{
      max-height:105px;
      opacity:1;
      padding:9px 12px 12px;
      transform:none;
    }
    .roulette-label{
      font-size:10px;
      font-weight:1000;
      letter-spacing:2px;
      color:#c8d2e7;
      margin-bottom:7px;
      text-transform:uppercase;
    }
    .roulette-reel{
      display:flex;
      justify-content:center;
      align-items:center;
      gap:7px;
      min-height:37px;
    }
    .roulette-reel span{
      width:33px;height:33px;border-radius:50%;
      display:grid;place-items:center;
      color:#11182a;
      font-weight:1000;
      font-size:11px;
      background:radial-gradient(circle at 32% 25%,#fff,#edf0f7 47%,#adb8cf);
      box-shadow:0 7px 16px rgba(0,0,0,.26);
      transition:transform .08s linear;
    }
    .roulette-reel span:nth-child(3){
      width:42px;height:42px;font-size:14px;
      outline:3px solid rgba(255,91,143,.32);
      box-shadow:0 0 22px rgba(255,91,143,.25),0 8px 18px rgba(0,0,0,.28);
    }
    .roulette-status.active .roulette-reel span{animation:miniBallDance .52s ease-in-out infinite alternate}
    .roulette-status.active .roulette-reel span:nth-child(2){animation-delay:.07s}
    .roulette-status.active .roulette-reel span:nth-child(3){animation-delay:.14s}
    .roulette-status.active .roulette-reel span:nth-child(4){animation-delay:.21s}
    .roulette-status.active .roulette-reel span:nth-child(5){animation-delay:.28s}
    .roulette-status.reveal .roulette-label{color:#ffe39c;animation:revealText .65s ease}

    /* Pantalla pública */
    body.public-only .public{animation:publicStageEnter .6s cubic-bezier(.18,.88,.28,1)}
    .public-hero{background-size:180% 180%!important;animation:publicHeroBreath 7s ease-in-out infinite alternate!important}
    .public-main{position:relative;overflow:hidden;animation:publicPanelGlow 4.5s ease-in-out infinite alternate}
    .public-main::before{
      content:"";position:absolute;width:270px;height:270px;border-radius:50%;right:-120px;top:-130px;
      background:radial-gradient(circle,rgba(141,107,255,.12),transparent 70%);pointer-events:none;
      animation:publicOrb 7s ease-in-out infinite alternate;
    }
    .public h1{
      background:linear-gradient(90deg,#fff,#ffb8d0,#cabdff,#fff);
      background-size:240% auto;
      -webkit-background-clip:text;background-clip:text;color:transparent;
      animation:titleSweep 5.5s linear infinite;
    }
    .public .price{animation:priceFloat 2.7s ease-in-out infinite}
    .public-round h2{animation:roundPulse 2.8s ease-in-out infinite alternate}
    .public-last .last-ball{width:250px!important;height:250px!important;font-size:88px!important;animation:publicBallIdle 2.8s ease-in-out infinite}
    .public-last .last-ball.roulette-spinning{animation:ballRoulette .28s ease-in-out infinite alternate!important}
    .public-last .last-ball.roulette-reveal{animation:ballReveal .85s cubic-bezier(.16,1.35,.25,1)!important}
    .public-board .num.hit{box-shadow:0 0 15px rgba(141,107,255,.18)}
    .public-board .num.latest{animation:latestPublic 1s ease-in-out infinite!important}
    .winner-banner{position:relative;overflow:hidden}
    .winner-banner::after{
      content:"";position:absolute;inset:-80% -20%;
      background:linear-gradient(110deg,transparent 38%,rgba(255,255,255,.26) 50%,transparent 62%);
      animation:winnerSweep 2.2s ease-in-out infinite;
    }

    @keyframes imaraAmbient{0%{background-position:0% 0%,100% 15%,center}100%{background-position:14% 9%,88% 24%,center}}
    @keyframes ambientOrbs{from{opacity:.65;transform:scale(1)}to{opacity:1;transform:scale(1.08)}}
    @keyframes sidebarEnter{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:none}}
    @keyframes topbarEnter{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:none}}
    @keyframes navDot{0%,100%{opacity:.55;box-shadow:0 0 6px var(--spinPink)}50%{opacity:1;box-shadow:0 0 18px var(--spinPink)}}
    @keyframes panelEntrance{from{opacity:0;transform:translateY(13px) scale(.992)}to{opacity:1;transform:none}}
    @keyframes kpiAura{from{transform:translateY(8px) scale(.9);opacity:.55}to{transform:translateY(-3px) scale(1.08);opacity:1}}
    @keyframes kpiNumber{from{filter:brightness(.96)}to{filter:brightness(1.1)}}
    @keyframes buttonShine{0%,58%{left:-70px}76%,100%{left:calc(100% + 70px)}}
    @keyframes logoAura{0%,100%{box-shadow:0 0 0 0 rgba(141,107,255,.08)}50%{box-shadow:0 0 0 7px rgba(141,107,255,.07),0 0 26px rgba(255,91,143,.16)}}
    @keyframes bingoCardEnter{from{opacity:0;transform:scale(.94) rotateX(8deg)}to{opacity:1;transform:none}}
    @keyframes calledCell{0%{transform:scale(.65);opacity:.35}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
    @keyframes alertEnter{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    @keyframes dialogEnter{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}
    @keyframes backdropIn{from{opacity:0}to{opacity:1}}
    @keyframes ringSpin{to{transform:rotate(360deg)}}
    @keyframes ballRoulette{from{transform:translate3d(-3px,-2px,0) rotate(-3deg) scale(.98)}to{transform:translate3d(3px,2px,0) rotate(3deg) scale(1.03)}}
    @keyframes ballReveal{0%{opacity:.25;transform:scale(.48) rotate(-20deg)}55%{opacity:1;transform:scale(1.2) rotate(7deg)}75%{transform:scale(.94) rotate(-2deg)}100%{transform:scale(1) rotate(0)}}
    @keyframes roulettePanel{from{box-shadow:var(--shadow),0 0 0 rgba(141,107,255,0)}to{box-shadow:var(--shadow),0 0 42px rgba(141,107,255,.18)}}
    @keyframes miniBallDance{from{transform:translateY(4px) rotate(-5deg)}to{transform:translateY(-5px) rotate(5deg)}}
    @keyframes revealText{0%{transform:scale(.8);opacity:.3}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
    @keyframes publicStageEnter{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}
    @keyframes publicHeroBreath{from{background-position:0% 20%;box-shadow:var(--shadow)}to{background-position:100% 80%;box-shadow:var(--shadow),0 0 34px rgba(255,91,143,.1)}}
    @keyframes publicPanelGlow{from{border-color:var(--line)}to{border-color:rgba(141,107,255,.42)}}
    @keyframes publicOrb{from{transform:translate(0,0) scale(.9)}to{transform:translate(-35px,35px) scale(1.16)}}
    @keyframes titleSweep{to{background-position:240% center}}
    @keyframes priceFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
    @keyframes roundPulse{from{opacity:.88}to{opacity:1;text-shadow:0 0 20px rgba(141,107,255,.26)}}
    @keyframes publicBallIdle{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-6px) rotate(1deg)}}
    @keyframes latestPublic{0%,100%{transform:scale(1);box-shadow:0 0 13px rgba(255,91,143,.32)}50%{transform:scale(1.17);box-shadow:0 0 30px rgba(255,91,143,.62)}}
    @keyframes winnerSweep{0%,45%{transform:translateX(-110%)}75%,100%{transform:translateX(110%)}}

    @media(max-width:760px){
      .public-last .last-ball{width:190px!important;height:190px!important;font-size:68px!important}
      .roulette-status{width:100%}
      .roulette-reel span{width:29px;height:29px}
      .roulette-reel span:nth-child(3){width:37px;height:37px}
    }
    @media(prefers-reduced-motion:reduce){
      body,.sidebar,.topbar,.brand-logo,.public-hero,.public-main,.public h1,.public .price,.public-round h2,
      .public-last .last-ball,.kpi .value,.kpi::before,.nav button.active::after{animation:none!important}
      .last-ball.roulette-spinning{animation:none!important}
      .roulette-status.active .roulette-reel span{animation:none!important}
    }
  `;
  document.head.appendChild(style);
  requestAnimationFrame(()=>document.body.classList.add('motion-ready'));
}

function ensureRouletteUi(){
  installMotionStyles();

  const adminBall = document.getElementById('lastBall');
  if(adminBall && !document.getElementById('adminRouletteStatus')){
    const box = document.createElement('div');
    box.id = 'adminRouletteStatus';
    box.className = 'roulette-status';
    box.setAttribute('aria-live','polite');
    box.innerHTML = `
      <div class="roulette-label">Balotera lista</div>
      <div class="roulette-reel" aria-hidden="true">
        <span>•</span><span>•</span><span>•</span><span>•</span><span>•</span>
      </div>`;
    adminBall.insertAdjacentElement('afterend',box);
  }

  const publicRound = document.querySelector('.public-round');
  if(publicRound && !document.getElementById('publicRouletteStatus')){
    const box = document.createElement('div');
    box.id = 'publicRouletteStatus';
    box.className = 'roulette-status';
    box.setAttribute('aria-live','polite');
    box.style.margin = '12px 0 0';
    box.innerHTML = `
      <div class="roulette-label">Balotera lista</div>
      <div class="roulette-reel" aria-hidden="true">
        <span>•</span><span>•</span><span>•</span><span>•</span><span>•</span>
      </div>`;
    publicRound.appendChild(box);
  }
}

function randomSpinNumber(finalNumber){
  const max = Number(state.settings.ballMax) || 99;
  if(max <= 1) return 1;
  let n = 1 + Math.floor(Math.random()*max);
  if(n === finalNumber) n = (n % max) + 1;
  return n;
}

function updateRouletteReels(currentNumber){
  const max = Number(state.settings.ballMax) || 99;
  ['adminRouletteStatus','publicRouletteStatus'].forEach(id=>{
    const box = document.getElementById(id);
    if(!box) return;
    const balls = box.querySelectorAll('.roulette-reel span');
    balls.forEach((el,i)=>{
      let value;
      if(i===2) value = currentNumber;
      else {
        value = 1 + Math.floor(Math.random()*max);
        if(value === currentNumber && max > 1) value = (value % max) + 1;
      }
      el.textContent = value;
    });
  });
}

function setRouletteLabel(text,reveal=false){
  ['adminRouletteStatus','publicRouletteStatus'].forEach(id=>{
    const box = document.getElementById(id);
    if(!box) return;
    box.classList.add('active');
    box.classList.toggle('reveal',reveal);
    const label = box.querySelector('.roulette-label');
    if(label) label.textContent = text;
  });
}

function setRouletteScene(active){
  ensureRouletteUi();
  ['lastBall','publicLastBall'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.classList.toggle('roulette-spinning',active);
    if(active) el.classList.remove('roulette-reveal','ball-pop');
  });
  document.querySelector('.draw-box')?.classList.toggle('roulette-live',active);
  document.querySelector('.public-main')?.classList.toggle('roulette-live',active);
  document.body.classList.toggle('roulette-active',active);

  ['drawBtn','manualBtn','undoDrawBtn','resetDrawBtn'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.disabled=active;
  });
  const draw=document.getElementById('drawBtn');
  if(draw) draw.textContent=active?'🎡 Girando...':'🎱 Sacar balota';
}

function showRouletteNumber(number){
  ['lastBall','publicLastBall'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.textContent=number;
  });
  updateRouletteReels(number);
}

function finishRouletteVisual(finalNumber,onComplete){
  if(rouletteTimer){ clearTimeout(rouletteTimer); rouletteTimer=null; }
  showRouletteNumber(finalNumber);
  setRouletteLabel(`¡BALOTA ${finalNumber}!`,true);

  ['lastBall','publicLastBall'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.classList.remove('roulette-spinning');
    el.classList.add('roulette-reveal');
  });
  document.querySelector('.draw-box')?.classList.remove('roulette-live');
  document.querySelector('.public-main')?.classList.remove('roulette-live');
  document.body.classList.remove('roulette-active');

  setTimeout(()=>{
    ['adminRouletteStatus','publicRouletteStatus'].forEach(id=>{
      const box=document.getElementById(id);
      if(box) box.classList.remove('active','reveal');
    });
    ['lastBall','publicLastBall'].forEach(id=>document.getElementById(id)?.classList.remove('roulette-reveal'));
    rouletteRunning=false;
    ['drawBtn','manualBtn','undoDrawBtn','resetDrawBtn'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.disabled=false;
    });
    const draw=document.getElementById('drawBtn'); if(draw) draw.textContent='🎱 Sacar balota';
  },850);

  if(typeof onComplete==='function') onComplete();
}

function runRouletteAnimation(finalNumber,duration=2300,{broadcast=false,onComplete=null}={}){
  if(rouletteRunning) return false;
  rouletteRunning=true;
  ensureRouletteUi();

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const effectiveDuration = reduced ? Math.min(320,duration) : duration;

  setRouletteScene(true);
  setRouletteLabel('🎡 Balotera girando...',false);

  if(broadcast && bc){
    bc.postMessage({type:'spin-start',finalNumber:Number(finalNumber),duration:effectiveDuration,t:Date.now()});
  }

  const started = performance.now();
  let frameCount=0;

  const tick=()=>{
    const elapsed=performance.now()-started;
    const progress=Math.min(1,elapsed/effectiveDuration);

    if(progress>=1){
      finishRouletteVisual(finalNumber,onComplete);
      return;
    }

    frameCount++;
    const candidate=randomSpinNumber(finalNumber);
    showRouletteNumber(candidate);

    if(progress>.8) setRouletteLabel('✨ Ya casi...',false);
    else if(progress>.52) setRouletteLabel('🎱 Mezclando balotas...',false);
    else setRouletteLabel('🎡 Balotera girando...',false);

    const wait = reduced ? 120 : Math.round(58 + progress*105 + (frameCount%3)*6);
    rouletteTimer=setTimeout(tick,wait);
  };

  tick();
  return true;
}

function syncFromStorage(){
  state=loadState();
  renderAll();
  ensureRouletteUi();
}

if(bc){
  bc.onmessage=(event)=>{
    const data=event?.data||{};
    if(data.type==='spin-start'){
      runRouletteAnimation(Number(data.finalNumber),Number(data.duration)||2300,{broadcast:false});
      return;
    }
    if(data.type==='sync') syncFromStorage();
  };
}

installMotionStyles();
ensureRouletteUi();

/* Sorteo aleatorio */
document.getElementById('drawBtn').addEventListener('click',()=>{
  if(rouletteRunning) return;
  if(state.round.status!=='open'){alert('La ronda está cerrada. Ábrela antes de continuar.');return;}
  const max=Number(state.settings.ballMax)||99;
  if(state.drawn.length>=max){alert(`Ya salieron las ${max} balotas.`);return;}

  const left=[];
  for(let i=1;i<=max;i++) if(!state.drawn.includes(i)) left.push(i);
  const n=left[Math.floor(Math.random()*left.length)];

  runRouletteAnimation(n,2400,{
    broadcast:true,
    onComplete:()=>{
      state.drawn.push(n);
      addActivity(`Salió la balota ${n}.`);
      saveState();
      animateBall();
    }
  });
});

/* Marcación manual con reveal animado */
document.getElementById('manualBtn').addEventListener('click',()=>{
  if(rouletteRunning) return;
  const n=Number(document.getElementById('manualBall').value);
  const max=Number(state.settings.ballMax)||99;
  if(n<1||n>max||!Number.isInteger(n)){alert(`Ingresa un número entero entre 1 y ${max}.`);return;}
  if(state.drawn.includes(n)){alert('Esa balota ya fue llamada.');return;}

  document.getElementById('manualBall').value='';
  runRouletteAnimation(n,1450,{
    broadcast:true,
    onComplete:()=>{
      state.drawn.push(n);
      addActivity(`Se marcó manualmente la balota ${n}.`);
      saveState();
      animateBall();
    }
  });
});

document.getElementById('undoDrawBtn').addEventListener('click',()=>{
  if(rouletteRunning){toast('Espera a que termine la ruleta');return;}
  if(!state.drawn.length)return;
  const n=state.drawn.pop();
  addActivity(`Se deshizo la balota ${n}.`);
  saveState();
  toast(`↩ Balota ${n} retirada`);
});

document.getElementById('resetDrawBtn').addEventListener('click',()=>{
  if(rouletteRunning){toast('Espera a que termine la ruleta');return;}
  if(!confirm('¿Reiniciar todas las balotas llamadas de esta ronda?'))return;
  state.drawn=[];
  addActivity('Se reinició el tablero de balotas.');
  saveState();
  toast('Tablero reiniciado');
});

document.getElementById('saveRoundBtn').addEventListener('click',()=>{
  state.round={
    name:document.getElementById('roundName').value.trim()||'Ronda',
    pattern:document.getElementById('roundPattern').value,
    prize:document.getElementById('roundPrize').value.trim(),
    reveal:document.getElementById('prizeReveal').value==='yes',
    status:document.getElementById('roundStatus').value
  };
  addActivity(`Ronda configurada: ${state.round.name} (${patternName(state.round.pattern)}).`);
  saveState();
  toast('Ronda guardada');
});

document.getElementById('validateBtn').addEventListener('click',()=>{
  const q=document.getElementById('winnerInput').value;
  const c=findCard(q), result=document.getElementById('validationResult'), preview=document.getElementById('winnerCardPreview');
  if(!c){
    result.innerHTML='<div class="danger">❌ No existe ese número de cartón.</div>';
    preview.innerHTML='';
    return;
  }
  renderBingoCard(c,preview,true);
  if(!['Pagado','Ganador'].includes(c.status)){
    result.innerHTML=`<div class="danger">⛔ ${escapeHtml(c.id)} no puede ganar porque su estado es <strong>${c.status}</strong>. Debe estar Pagado.</div>`;
    return;
  }
  const ok=validatePattern(c);
  if(!ok){
    result.innerHTML=`<div class="danger">❌ Todavía NO cumple <strong>${patternName(state.round.pattern)}</strong> con las balotas llamadas.</div>`;
    return;
  }
  result.innerHTML=`<div class="success">✅ ¡BINGO VÁLIDO! ${escapeHtml(c.id)} cumple <strong>${patternName(state.round.pattern)}</strong>. <button class="mini" onclick="registerWinner('${c.id}')">Registrar ganador</button></div>`;
});

window.registerWinner=function(id){
  const c=findCard(id); if(!c)return;
  if(!validatePattern(c)){alert('Este cartón ya no cumple la validación actual.');return;}
  if(!['Pagado','Ganador'].includes(c.status)){alert('El cartón debe estar pagado.');return;}
  c.status='Ganador';
  state.winners.unshift({cardId:c.id,buyer:c.buyer,roundName:state.round.name,pattern:state.round.pattern,prize:state.round.prize,at:new Date().toISOString()});
  addActivity(`🏆 Ganador registrado: ${c.id} en ${state.round.name}.`);
  saveState();
  celebrate();
  toast(`🏆 ${c.id} registrado como ganador`);
  document.getElementById('validationResult').innerHTML=`<div class="success">🏆 Ganador registrado: <strong>${escapeHtml(c.id)}</strong>.</div>`;
};