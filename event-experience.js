/* BINGO IMARA · Experiencia de evento */
(function(){
  let countdownActive=false;

  function installStyles(){
    if(document.getElementById('imaraEventExperienceStyles'))return;
    const style=document.createElement('style');
    style.id='imaraEventExperienceStyles';
    style.textContent=`
      .dual-ball-stage{position:relative;padding-top:0!important}
      .dual-ball-stage::before,
      .dual-ball-stage::after{
        display:none!important;
        content:none!important;
        animation:none!important
      }
      body.roulette-active .bingo-letter-ball,
      body.roulette-active .bingo-number-ball{filter:saturate(1.12) brightness(1.04)}

      .winner-countdown-overlay{
        position:fixed;inset:0;z-index:999999;display:grid;place-items:center;padding:24px;
        background:rgba(6,10,18,.78);backdrop-filter:blur(10px);
        opacity:0;pointer-events:none;transition:opacity .18s ease
      }
      .winner-countdown-overlay.show{opacity:1;pointer-events:auto}
      .winner-countdown-card{
        width:min(720px,94vw);text-align:center;padding:32px 24px;border-radius:30px;
        border:1px solid rgba(255,255,255,.18);
        background:linear-gradient(145deg,#171f35,#28204a);
        box-shadow:0 30px 100px rgba(0,0,0,.52),0 0 60px rgba(141,107,255,.22);
        animation:imaraWinnerCard .42s cubic-bezier(.18,1.15,.32,1)
      }
      .winner-countdown-kicker{font-size:13px;letter-spacing:3px;font-weight:1000;color:#c9d2e7;text-transform:uppercase}
      .winner-countdown-step{font-size:clamp(42px,8vw,86px);font-weight:1000;margin:10px 0;line-height:1;color:#fff;text-shadow:0 0 38px rgba(255,91,143,.32)}
      .winner-countdown-name{font-size:clamp(18px,3vw,30px);font-weight:900;color:#ffd8e5}
      .winner-countdown-sub{margin-top:10px;color:#b9c4d8;font-size:14px}
      .winner-countdown-card.pulse{animation:imaraWinnerPulse .38s cubic-bezier(.18,1.3,.3,1)}

      @keyframes imaraWinnerCard{from{opacity:0;transform:scale(.82) translateY(18px)}to{opacity:1;transform:none}}
      @keyframes imaraWinnerPulse{0%{transform:scale(.94)}65%{transform:scale(1.035)}100%{transform:none}}
      @media(prefers-reduced-motion:reduce){.winner-countdown-card{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  if(typeof runRouletteAnimation==='function'){
    const originalRunRoulette=runRouletteAnimation;
    runRouletteAnimation=function(finalNumber,duration,opts){
      let d=Number(duration)||2300;
      if(d>=2200)d=1350;
      else if(d>=1400&&d<=1500)d=800;
      return originalRunRoulette(finalNumber,d,opts||{});
    };
  }

  function ensureCountdownOverlay(){
    let overlay=document.getElementById('winnerCountdownOverlay');
    if(overlay)return overlay;
    overlay=document.createElement('div');
    overlay.id='winnerCountdownOverlay';
    overlay.className='winner-countdown-overlay';
    overlay.innerHTML=`<div class="winner-countdown-card">
      <div class="winner-countdown-kicker">Bingo IMARA</div>
      <div class="winner-countdown-step">¡BINGO!</div>
      <div class="winner-countdown-name"></div>
      <div class="winner-countdown-sub">Validando el cartón antes de confirmar el ganador…</div>
    </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function setCountdownStep(step,cardId,buyer,sub){
    const overlay=ensureCountdownOverlay();
    const card=overlay.querySelector('.winner-countdown-card');
    overlay.querySelector('.winner-countdown-step').textContent=step;
    overlay.querySelector('.winner-countdown-name').textContent=`${cardId}${buyer?' · '+buyer:''}`;
    overlay.querySelector('.winner-countdown-sub').textContent=sub||'Validando el cartón antes de confirmar el ganador…';
    card.classList.remove('pulse');void card.offsetWidth;card.classList.add('pulse');
    overlay.classList.add('show');
  }

  function hideCountdown(){document.getElementById('winnerCountdownOverlay')?.classList.remove('show');}

  function runCountdown(cardId,buyer,onComplete,broadcast){
    if(countdownActive)return false;
    countdownActive=true;
    if(broadcast&&bc)bc.postMessage({type:'winner-countdown',cardId,buyer,t:Date.now()});
    setCountdownStep('¡BINGO!',cardId,buyer,'Tenemos un cartón válido. Preparando el anuncio…');
    const steps=[
      [560,'A LA UNA…','Confirmando letra, número y figura…'],
      [1220,'A LAS DOS…','Última validación del cartón…'],
      [1900,'¡A LAS TRES!','Resultado confirmado.'],
      [2580,'🏆 ¡GANADOR!','¡Bingo confirmado por el sistema!']
    ];
    steps.forEach(([ms,text,sub])=>setTimeout(()=>setCountdownStep(text,cardId,buyer,sub),ms));
    setTimeout(()=>{if(typeof onComplete==='function')onComplete();},2600);
    setTimeout(()=>{hideCountdown();countdownActive=false;},3800);
    return true;
  }

  window.imaraWinnerCountdown=function(cardId,buyer,onComplete){return runCountdown(cardId,buyer,onComplete,true);};

  if(bc&&typeof bc.addEventListener==='function'){
    bc.addEventListener('message',event=>{
      const d=event?.data||{};
      if(d.type==='winner-countdown'&&!countdownActive)runCountdown(String(d.cardId||''),String(d.buyer||''),null,false);
    });
  }

  function installWinnerWrapper(attempt=0){
    if(typeof window.registerWinner!=='function'){
      if(attempt<30)setTimeout(()=>installWinnerWrapper(attempt+1),100);
      return;
    }
    if(typeof window.startPlayableDemo!=='function'&&attempt<30){setTimeout(()=>installWinnerWrapper(attempt+1),100);return;}
    if(window.registerWinner.__imaraCountdownWrapped)return;
    const target=window.registerWinner;
    const wrapped=function(id){
      const c=typeof findCard==='function'?findCard(id):null;
      if(!c||typeof validatePattern!=='function'||!validatePattern(c)||!['Pagado','Ganador'].includes(c.status))return target(id);
      if(countdownActive){if(typeof toast==='function')toast('El anuncio de Bingo ya está en curso');return;}
      return runCountdown(c.id,c.buyer||'',()=>target(id),true);
    };
    wrapped.__imaraCountdownWrapped=true;
    window.registerWinner=wrapped;
  }

  installStyles();
  installWinnerWrapper();
})();

/* Soundscape 2026: se carga exclusivamente en la pantalla pública.
   Mantiene completamente aislados login, Admin y sincronización. */
(function(){
  if(!location.hash.startsWith('#public'))return;
  if(document.getElementById('imaraSoundscape2026'))return;
  const s=document.createElement('script');
  s.id='imaraSoundscape2026';
  s.src='soundscape-2026.js?v=20260902-SOUND-1';
  s.defer=true;
  document.body.appendChild(s);
})();

/* Estabilidad del formulario de creación de Miembros.
   Se carga solo en la zona privada y no modifica el login. */
(function(){
  if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
  if(document.getElementById('imaraMemberStability'))return;
  const s=document.createElement('script');
  s.id='imaraMemberStability';
  s.src='admin-member-stability.js?v=20260902-MEMBER-1';
  s.defer=true;
  document.body.appendChild(s);
})();

/* Finanzas: módulo privado e independiente del login. */
(function(){
  if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
  if(document.getElementById('imaraFinanceCenter'))return;
  const s=document.createElement('script');
  s.id='imaraFinanceCenter';
  s.src='finance-center.js?v=20260902-FIN-1';
  s.defer=true;
  document.body.appendChild(s);
})();

/* Controles extendidos de Finanzas. Solo complementan el módulo financiero. */
(function(){
  if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
  if(document.getElementById('imaraFinanceControls2026'))return;
  const s=document.createElement('script');
  s.id='imaraFinanceControls2026';
  s.src='finance-controls-2026.js?v=20260902-FIN-2';
  s.defer=true;
  document.body.appendChild(s);
})();