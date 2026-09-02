/* =========================================================
   BINGO IMARA · Sincronización letra + número
   La misma referencia se usa en ruleta, tablero y cartones.
   ========================================================= */
(function(){
  const BINGO_LETTERS=['B','I','N','G','O'];

  function letterForNumber(value,max){
    const n=Number(value);
    const ranges=columnRanges(Number(max)||Number(state.settings.ballMax)||99);
    const idx=ranges.findIndex(([a,b])=>n>=a&&n<=b);
    return idx>=0?BINGO_LETTERS[idx]:'?';
  }
  function ballCode(value,max){
    const n=Number(value);
    if(!Number.isInteger(n)||n<1)return '—';
    return `${letterForNumber(n,max)}-${String(n).padStart(2,'0')}`;
  }
  function cellCode(value,columnIndex){
    if(value==='FREE')return '★';
    return `${BINGO_LETTERS[columnIndex]}-${String(Number(value)).padStart(2,'0')}`;
  }

  window.bingoLetterForNumber=letterForNumber;
  window.bingoBallCode=ballCode;

  function installCodeStyles(){
    if(document.getElementById('imaraBallCodeStyles'))return;
    const style=document.createElement('style');
    style.id='imaraBallCodeStyles';
    style.textContent=`
      .dual-ball-stage{display:flex;align-items:center;justify-content:center;gap:16px;margin:16px auto;flex-wrap:nowrap}
      .dual-ball-stage .last-ball{margin:0!important}
      .bingo-letter-ball{
        width:128px;height:128px;border-radius:50%;display:grid;place-items:center;
        font-size:58px;font-weight:1000;color:#fff;
        background:radial-gradient(circle at 32% 24%,#ffb2cb,#ff5b8f 44%,#7b315d 100%);
        box-shadow:0 18px 46px rgba(0,0,0,.38),inset 0 -13px 24px rgba(0,0,0,.18),0 0 30px rgba(255,91,143,.16);
        position:relative;flex:none
      }
      .bingo-letter-ball::after,.dual-ball-stage .last-ball::after{
        content:"";position:absolute;width:26%;height:14%;left:23%;top:17%;border-radius:50%;
        background:rgba(255,255,255,.42);filter:blur(1px);pointer-events:none
      }
      .bingo-letter-ball.roulette-spinning{animation:ballRoulette .28s ease-in-out infinite alternate}
      .bingo-letter-ball.roulette-reveal{animation:ballReveal .85s cubic-bezier(.16,1.35,.25,1)!important}
      .public-last .dual-ball-stage{margin:0;gap:22px}
      .public-last .bingo-letter-ball{width:178px;height:178px;font-size:82px}
      .public-last .dual-ball-stage .last-ball{width:250px!important;height:250px!important;font-size:88px!important}

      .coded-master-board{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:10px!important;align-items:start}
      .letter-zone{min-width:0;border:1px solid var(--line);border-radius:14px;padding:8px;background:rgba(9,14,25,.28)}
      .letter-zone-title{
        display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:7px;
        padding:7px 8px;border-radius:10px;background:linear-gradient(135deg,rgba(255,91,143,.16),rgba(141,107,255,.16));
        font-weight:1000
      }
      .letter-zone-title strong{font-size:18px}.letter-zone-title small{font-size:9px;color:var(--muted);font-weight:800}
      .letter-zone-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}
      .coded-master-board .num{
        width:100%;aspect-ratio:1!important;border-radius:8px!important;display:flex!important;
        flex-direction:column;align-items:center;justify-content:center;gap:0!important;min-width:0;padding:2px
      }
      .coded-master-board .num .ball-letter{font-size:8px;font-weight:900;line-height:1;opacity:.76}
      .coded-master-board .num .ball-number{font-size:12px;font-weight:1000;line-height:1.15}
      .coded-master-board .num.hit .ball-letter{opacity:1}
      .coded-master-board .num.latest{z-index:2}

      .bingo-grid .cell.code-cell{font-size:14px!important;letter-spacing:-.2px}
      .history .chip.code-chip{display:inline-flex;align-items:center;gap:2px;letter-spacing:.2px}
      .history .chip.code-chip strong{font-size:13px}
      .history .chip.code-chip span{font-size:11px;opacity:.75}

      @media(max-width:1100px){
        .coded-master-board{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      }
      @media(max-width:650px){
        .coded-master-board{grid-template-columns:1fr!important}
        .dual-ball-stage{gap:10px}
        .bingo-letter-ball{width:96px;height:96px;font-size:44px}
        .dual-ball-stage .last-ball{width:140px!important;height:140px!important;font-size:52px!important}
        .public-last .bingo-letter-ball{width:120px;height:120px;font-size:55px}
        .public-last .dual-ball-stage .last-ball{width:165px!important;height:165px!important;font-size:62px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureDualBall(numberId,letterId){
    const numberBall=document.getElementById(numberId);
    if(!numberBall)return null;
    let letterBall=document.getElementById(letterId);
    if(letterBall)return letterBall;

    const stage=document.createElement('div');
    stage.className='dual-ball-stage';
    letterBall=document.createElement('div');
    letterBall.id=letterId;
    letterBall.className='bingo-letter-ball';
    letterBall.textContent='—';
    letterBall.setAttribute('aria-label','Letra de la balota');

    numberBall.parentNode.insertBefore(stage,numberBall);
    stage.appendChild(letterBall);
    stage.appendChild(numberBall);
    numberBall.classList.add('bingo-number-ball');
    return letterBall;
  }

  function ensureDualBalls(){
    installCodeStyles();
    ensureDualBall('lastBall','lastBallLetter');
    ensureDualBall('publicLastBall','publicLastBallLetter');
  }

  function setDualBall(number){
    ensureDualBalls();
    const n=Number(number);
    const valid=Number.isInteger(n)&&n>0;
    const letter=valid?letterForNumber(n):'—';
    const numText=valid?String(n).padStart(2,'0'):'—';
    const code=valid?ballCode(n):'—';
    [['lastBall','lastBallLetter'],['publicLastBall','publicLastBallLetter']].forEach(([numId,letterId])=>{
      const num=document.getElementById(numId), letEl=document.getElementById(letterId);
      if(num){num.textContent=numText;num.title=code;num.setAttribute('aria-label',valid?`Número ${n}`:'Sin balota');}
      if(letEl){letEl.textContent=letter;letEl.title=code;letEl.setAttribute('aria-label',valid?`Letra ${letter}`:'Sin letra');}
    });
  }

  /* TABLERO MAESTRO: organizado por B-I-N-G-O */
  renderBoard=function(targetId,cls='num'){
    const el=document.getElementById(targetId);if(!el)return;
    const max=Number(state.settings.ballMax)||99;
    const ranges=columnRanges(max);
    const latest=state.drawn.length?state.drawn[state.drawn.length-1]:null;
    el.classList.add('coded-master-board');
    el.innerHTML='';

    ranges.forEach(([start,end],idx)=>{
      const letter=BINGO_LETTERS[idx];
      const zone=document.createElement('section');
      zone.className='letter-zone';
      zone.innerHTML=`<div class="letter-zone-title"><strong>${letter}</strong><small>${start}–${end}</small></div><div class="letter-zone-grid"></div>`;
      const grid=zone.querySelector('.letter-zone-grid');
      for(let n=start;n<=end;n++){
        const d=document.createElement('div');
        d.className=cls+' code-num'+(state.drawn.includes(n)?' hit':'')+(n===latest?' latest':'');
        d.title=ballCode(n,max);
        d.setAttribute('aria-label',ballCode(n,max));
        d.innerHTML=`<span class="ball-letter">${letter}</span><strong class="ball-number">${String(n).padStart(2,'0')}</strong>`;
        grid.appendChild(d);
      }
      el.appendChild(zone);
    });
  };

  /* CARTÓN EN PANTALLA: cada casilla usa exactamente la misma referencia */
  renderBingoCard=function(card,target,highlight=true){
    if(!card){target.innerHTML='<div class="muted">Sin cartón.</div>';return;}
    const heads=BINGO_LETTERS;
    let html=`<div class="bingo-card"><div class="bingo-head"><div><strong>${escapeHtml(card.id)}</strong><div style="font-size:12px;color:#61708a">${escapeHtml(card.buyer||'Sin comprador')}</div></div><span class="badge ${card.status}">${card.status}</span></div><div class="bingo-grid">`;
    heads.forEach(h=>html+=`<div class="cell head">${h}</div>`);
    for(let r=0;r<5;r++)for(let c=0;c<5;c++){
      const v=card.grid[r][c],marked=cellMarked(v);
      html+=`<div class="cell code-cell ${v==='FREE'?'free':''} ${highlight&&marked?'called':''}" title="${v==='FREE'?'Centro libre':cellCode(v,c)}">${v==='FREE'?'★':cellCode(v,c)}</div>`;
    }
    html+='</div></div>';
    target.innerHTML=html;
  };

  /* CARTÓN IMPRESO / PDF: misma codificación que la ruleta y tablero */
  printableCardHtml=function(c,opts={}){
    const demo=!!opts.demo;
    const heads=BINGO_LETTERS;
    let cells=heads.map(h=>`<div class="ph">${h}</div>`).join('');
    for(let r=0;r<5;r++)for(let col=0;col<5;col++){
      const v=c.grid[r][col];
      cells+=`<div class="pcell ${v==='FREE'?'free':''}">${v==='FREE'?'★':cellCode(v,col)}</div>`;
    }
    const logo=state.settings.logo?`<img class="plogo" src="${state.settings.logo}" alt="Logo">`:`<div class="plogoText">IM</div>`;
    return `<article class="ticket ${demo?'demoTicket':''}">
      ${demo?'<div class="demoRibbon">DEMO · NO VÁLIDO</div>':''}
      <header class="ticketTop">
        <div class="identity">${logo}<div><div class="event">${escapeHtml(state.settings.title)}</div><div class="org">${escapeHtml(state.settings.organizer)}</div></div></div>
        <div class="numberBox"><span>${demo?'Prueba':'Cartón'}</span><strong>${escapeHtml(c.id)}</strong></div>
      </header>
      <div class="priceLine"><span>${demo?'Cartón de demostración':`Valor: <strong>${money(state.settings.price)}</strong>`}</span><span>B-I-N-G-O · Modo 1–${state.settings.ballMax}</span></div>
      <div class="pgrid">${cells}</div>
      <footer class="ticketFoot">
        <span>${demo?'No se registra en la base real':`Comprador: <b>${escapeHtml(c.buyer||'________________________')}</b>`}</span>
        <span>${demo?'NO VÁLIDO PARA PREMIOS':'Solo participa si está PAGADO'}</span>
      </footer>
      <div class="experiences">La balota cantada debe coincidir en LETRA + NÚMERO · Ejemplo: B-07 / I-27</div>
    </article>`;
  };

  /* HISTORIAL + títulos */
  const previousRenderGame=renderGame;
  renderGame=function(){
    previousRenderGame();
    const history=document.getElementById('drawHistory');
    if(history){
      history.innerHTML=state.drawn.length?[...state.drawn].reverse().map(n=>{
        const code=ballCode(n);
        const [letter,num]=code.split('-');
        return `<span class="chip code-chip" title="${code}"><strong>${letter}</strong><span>${num}</span></span>`;
      }).join(''):'<span class="muted">Aún no se han llamado balotas.</span>';
    }
    const title=document.getElementById('boardTitle');
    if(title)title.textContent=`Tablero B-I-N-G-O · 1–${state.settings.ballMax}`;
    setDualBall(state.drawn.length?state.drawn[state.drawn.length-1]:null);
  };

  const previousRenderPublic=renderPublic;
  renderPublic=function(){
    previousRenderPublic();
    setDualBall(state.drawn.length?state.drawn[state.drawn.length-1]:null);
  };

  /* RUleta: dos balotas sincronizadas durante todo el giro */
  const previousShowRouletteNumber=showRouletteNumber;
  showRouletteNumber=function(number){
    previousShowRouletteNumber(number);
    setDualBall(number);
  };

  const previousSetRouletteScene=setRouletteScene;
  setRouletteScene=function(active){
    previousSetRouletteScene(active);
    ensureDualBalls();
    ['lastBallLetter','publicLastBallLetter'].forEach(id=>document.getElementById(id)?.classList.toggle('roulette-spinning',active));
  };

  const previousSetRouletteLabel=setRouletteLabel;
  setRouletteLabel=function(text,reveal=false){
    let finalText=text;
    if(reveal){
      const n=Number(document.getElementById('lastBall')?.textContent);
      if(Number.isInteger(n)&&n>0)finalText=`¡BALOTA ${ballCode(n)}!`;
      ['lastBallLetter','publicLastBallLetter'].forEach(id=>{
        const el=document.getElementById(id);if(el){el.classList.remove('roulette-spinning');el.classList.add('roulette-reveal');setTimeout(()=>el.classList.remove('roulette-reveal'),900);}
      });
    }
    previousSetRouletteLabel(finalText,reveal);
  };

  const previousAnimateBall=animateBall;
  animateBall=function(){
    previousAnimateBall();
    ['lastBallLetter','publicLastBallLetter'].forEach(id=>{
      const el=document.getElementById(id);if(!el)return;
      el.classList.remove('ball-pop');void el.offsetWidth;el.classList.add('ball-pop');
    });
  };

  installCodeStyles();
  ensureDualBalls();
  renderAll();
  ensureDualBalls();
})();