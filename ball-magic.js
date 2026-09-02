/* BINGO IMARA · Balotas mágicas letra + número */
(function(){
  function install(){
    if(document.getElementById('imaraBallMagicCss'))return;
    const s=document.createElement('style');s.id='imaraBallMagicCss';s.textContent=`
      /* Quita el canal/barra superior anterior */
      .dual-ball-stage{position:relative!important;width:min(330px,96%)!important;height:275px!important;display:grid!important;place-items:center!important;gap:0!important;margin:12px auto!important;padding:0!important;overflow:visible!important;isolation:isolate}
      .dual-ball-stage::before,.dual-ball-stage::after{content:none!important;display:none!important}

      /* Balota principal */
      .dual-ball-stage .bingo-number-ball{
        position:relative!important;z-index:4!important;margin:0!important;width:205px!important;height:205px!important;font-size:72px!important;
        border-radius:50%!important;color:#101522!important;
        background:radial-gradient(circle at 31% 24%,#ffffff 0 12%,#fff8df 23%,#f6d46d 55%,#c89425 82%,#715016 100%)!important;
        box-shadow:0 14px 34px rgba(0,0,0,.38),inset 0 -18px 28px rgba(84,56,3,.22),0 0 0 5px rgba(255,218,112,.16),0 0 18px rgba(255,216,100,.28)!important;
        overflow:visible!important;
      }
      .dual-ball-stage .bingo-number-ball::before{
        content:""!important;position:absolute!important;inset:-7px!important;border-radius:50%!important;
        border:2px solid rgba(255,226,145,.34)!important;box-shadow:none!important;opacity:.95!important;pointer-events:none!important;
      }
      .dual-ball-stage .bingo-number-ball::after{
        content:""!important;position:absolute!important;width:30%!important;height:15%!important;left:24%!important;top:15%!important;border-radius:50%!important;
        background:rgba(255,255,255,.58)!important;filter:blur(1px)!important;pointer-events:none!important;
      }

      /* Letra tipo exponente */
      .dual-ball-stage .bingo-letter-ball{
        position:absolute!important;z-index:7!important;top:14px!important;right:21px!important;width:83px!important;height:83px!important;
        display:grid!important;place-items:center!important;border-radius:50%!important;font-size:39px!important;font-weight:1000!important;color:white!important;
        background:radial-gradient(circle at 30% 23%,#ffd7e5 0 10%,#ff79a6 34%,#c13d76 66%,#672345 100%)!important;
        box-shadow:0 10px 25px rgba(0,0,0,.34),inset 0 -10px 17px rgba(70,12,40,.2),0 0 0 4px rgba(255,105,157,.14),0 0 15px rgba(255,91,143,.28)!important;
        transform-origin:-78px 105px!important;overflow:visible!important;
      }
      .dual-ball-stage .bingo-letter-ball::before{
        content:"";position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(255,174,205,.3);pointer-events:none
      }
      .dual-ball-stage .bingo-letter-ball::after{
        content:""!important;position:absolute!important;width:28%!important;height:15%!important;left:22%!important;top:15%!important;border-radius:50%!important;
        background:rgba(255,255,255,.62)!important;filter:blur(.5px)!important;pointer-events:none!important;
      }

      /* Polvo de hadas: capa independiente para que los halos de las dos balotas no se mezclen */
      .imara-fairy-dust{position:absolute;inset:-8px;z-index:2;pointer-events:none;opacity:0;transition:opacity .18s ease}
      body.roulette-active .imara-fairy-dust{opacity:1}
      .imara-fairy-dust i{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);border-radius:50%;background:radial-gradient(circle,#fff 0 22%,#ffe8a4 35%,rgba(255,154,204,.7) 58%,transparent 72%);box-shadow:0 0 7px rgba(255,231,154,.75);animation:imaraFairyDust var(--d) ease-in-out infinite alternate;animation-delay:var(--delay);transform:translate(-50%,-50%)}

      body.roulette-active .dual-ball-stage{animation:imaraStageBreath 1.05s ease-in-out infinite alternate}
      body.roulette-active .dual-ball-stage .bingo-number-ball.roulette-spinning{
        animation:imaraNumberOrbit 1.02s cubic-bezier(.5,.05,.5,.95) infinite!important;
      }
      body.roulette-active .dual-ball-stage .bingo-letter-ball.roulette-spinning{
        animation:imaraLetterOrbit 1.02s linear infinite!important;
      }
      .dual-ball-stage .bingo-number-ball.roulette-reveal{animation:imaraMagicReveal .72s cubic-bezier(.16,1.32,.3,1)!important}
      .dual-ball-stage .bingo-letter-ball.roulette-reveal{animation:imaraMagicLetterReveal .72s cubic-bezier(.16,1.32,.3,1)!important}

      @keyframes imaraNumberOrbit{
        0%{transform:translate(-9px,2px) rotate(-4deg) scale(.985)}
        25%{transform:translate(-2px,-9px) rotate(2deg) scale(1.015)}
        50%{transform:translate(9px,-1px) rotate(5deg) scale(.99)}
        75%{transform:translate(2px,9px) rotate(-2deg) scale(1.015)}
        100%{transform:translate(-9px,2px) rotate(-4deg) scale(.985)}
      }
      @keyframes imaraLetterOrbit{
        0%{transform:rotate(0deg) translateZ(0)}
        25%{transform:rotate(90deg) translateZ(0)}
        50%{transform:rotate(180deg) translateZ(0)}
        75%{transform:rotate(270deg) translateZ(0)}
        100%{transform:rotate(360deg) translateZ(0)}
      }
      @keyframes imaraFairyDust{
        from{opacity:.18;transform:translate(-50%,-50%) scale(.35) rotate(0deg);filter:brightness(.9)}
        55%{opacity:1;filter:brightness(1.35)}
        to{opacity:.28;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.45) rotate(95deg);filter:brightness(1.08)}
      }
      @keyframes imaraStageBreath{from{filter:saturate(1)}to{filter:saturate(1.1) brightness(1.035)}}
      @keyframes imaraMagicReveal{0%{opacity:.2;transform:scale(.55) rotate(-20deg)}62%{opacity:1;transform:scale(1.12) rotate(4deg)}100%{transform:scale(1) rotate(0)}}
      @keyframes imaraMagicLetterReveal{0%{opacity:.15;transform:scale(.35) rotate(-40deg)}65%{opacity:1;transform:scale(1.18) rotate(8deg)}100%{transform:scale(1) rotate(0)}}

      /* Público: escala mayor, misma relación de exponente */
      .public-last .dual-ball-stage{width:min(430px,100%)!important;height:350px!important;margin:0 auto!important}
      .public-last .dual-ball-stage .bingo-number-ball{width:270px!important;height:270px!important;font-size:96px!important}
      .public-last .dual-ball-stage .bingo-letter-ball{width:108px!important;height:108px!important;font-size:54px!important;top:8px!important;right:24px!important;transform-origin:-103px 138px!important}

      @media(max-width:650px){
        .dual-ball-stage{width:260px!important;height:220px!important}
        .dual-ball-stage .bingo-number-ball{width:165px!important;height:165px!important;font-size:58px!important}
        .dual-ball-stage .bingo-letter-ball{width:68px!important;height:68px!important;font-size:32px!important;top:12px!important;right:17px!important;transform-origin:-63px 84px!important}
        .public-last .dual-ball-stage{width:300px!important;height:250px!important}
        .public-last .dual-ball-stage .bingo-number-ball{width:190px!important;height:190px!important;font-size:68px!important}
        .public-last .dual-ball-stage .bingo-letter-ball{width:78px!important;height:78px!important;font-size:38px!important;top:9px!important;right:16px!important;transform-origin:-73px 98px!important}
      }
      @media(prefers-reduced-motion:reduce){body.roulette-active .dual-ball-stage,body.roulette-active .dual-ball-stage .bingo-number-ball.roulette-spinning,body.roulette-active .dual-ball-stage .bingo-letter-ball.roulette-spinning,.imara-fairy-dust i{animation:none!important}}
    `;document.head.appendChild(s);
  }

  function decorate(stage){
    if(!stage||stage.querySelector('.imara-fairy-dust'))return;
    const dust=document.createElement('div');dust.className='imara-fairy-dust';
    const points=[
      [11,30,4,9,-7],[18,72,3,8,9],[31,12,4,-8,7],[42,88,3,7,-10],[56,8,3,10,8],[69,88,4,-9,-8],[82,18,3,-8,10],[91,54,4,-10,-4],
      [8,52,2,10,4],[25,91,3,8,-9],[48,4,2,-7,11],[63,95,3,10,-7],[76,8,2,8,8],[94,76,3,-9,-6],[36,94,2,-6,-9],[88,33,2,-9,7]
    ];
    points.forEach((p,i)=>{const dot=document.createElement('i');dot.style.setProperty('--x',p[0]+'%');dot.style.setProperty('--y',p[1]+'%');dot.style.setProperty('--s',p[2]+'px');dot.style.setProperty('--dx',p[3]+'px');dot.style.setProperty('--dy',p[4]+'px');dot.style.setProperty('--d',(0.7+(i%5)*0.11)+'s');dot.style.setProperty('--delay',(-i*.09)+'s');dust.appendChild(dot)});
    stage.insertBefore(dust,stage.firstChild);
  }
  function scan(){document.querySelectorAll('.dual-ball-stage').forEach(decorate)}
  install();scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();