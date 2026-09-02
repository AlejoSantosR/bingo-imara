/* =========================================================
   BINGO IMARA · Modo prueba jugable
   Permite probar cartones DEMO sin contaminar operación real.
   ========================================================= */
(function(){
  const DEMO_KEY='bingoImaraPlayableDemoV1';

  function defaultDemo(){
    return {
      active:false,
      cards:[],
      winners:[],
      savedDrawn:[],
      savedRound:null,
      savedActivity:[],
      startedAt:null
    };
  }

  function loadDemo(){
    try{
      const raw=localStorage.getItem(DEMO_KEY);
      if(!raw)return defaultDemo();
      return Object.assign(defaultDemo(),JSON.parse(raw));
    }catch(e){return defaultDemo();}
  }
  let demo=loadDemo();

  function saveDemo(){
    localStorage.setItem(DEMO_KEY,JSON.stringify(demo));
    if(bc)bc.postMessage({type:'demo-sync',t:Date.now()});
  }

  function isDemoCard(card){
    return !!card && /^DEMO-\d+$/i.test(card.id||'');
  }

  function findDemoCard(q){
    if(!demo.active)return null;
    let s=String(q||'').trim().toUpperCase();
    if(/^\d+$/.test(s))s=`DEMO-${String(Number(s)).padStart(3,'0')}`;
    return demo.cards.find(c=>String(c.id).toUpperCase()===s)||null;
  }

  function createDemoCards(count){
    count=Math.max(1,Math.min(20,Number(count)||4));
    const cards=[],seen=new Set();
    let guard=0;
    while(cards.length<count && guard<count*150){
      guard++;
      const grid=generateGrid(state.settings.ballMax),sig=signature(grid);
      if(seen.has(sig))continue;
      seen.add(sig);
      cards.push({
        id:`DEMO-${String(cards.length+1).padStart(3,'0')}`,
        buyer:`Participante demo ${cards.length+1}`,
        phone:'',
        status:'Pagado',
        paidAt:nowLocalInput(),
        notes:'Cartón exclusivo para prueba',
        image:'',
        grid,
        ballMax:state.settings.ballMax,
        createdAt:new Date().toISOString(),
        demo:true
      });
    }
    return cards;
  }

  const realFindCard=findCard;
  findCard=function(q){
    const d=findDemoCard(q);
    return d||realFindCard(q);
  };

  const realWinningCards=currentWinningCards;
  currentWinningCards=function(){
    if(!demo.active)return realWinningCards();
    const roundName=state.round.name,pattern=state.round.pattern;
    return demo.cards.filter(c=>{
      if(!['Pagado','Ganador'].includes(c.status))return false;
      if(!validatePattern(c))return false;
      return !demo.winners.some(w=>w.cardId===c.id&&w.roundName===roundName&&w.pattern===pattern);
    });
  };

  function renderDemoBanner(){
    const game=document.getElementById('view-game');
    if(!game)return;
    let panel=document.getElementById('demoPlayPanel');
    if(!panel){
      panel=document.createElement('div');
      panel.id='demoPlayPanel';
      panel.className='card';
      panel.style.marginBottom='16px';
      game.insertBefore(panel,game.firstChild);
    }

    if(!demo.active){
      panel.innerHTML=`
        <div class="section-title">
          <div><h3>🧪 Modo prueba jugable</h3><div class="muted" style="margin-top:4px">Prueba el Bingo completo sin mezclar cartones, recaudo ni ganadores reales.</div></div>
        </div>
        <div class="form-grid">
          <label>Cantidad de cartones DEMO<input class="input" id="demoPlayCount" type="number" min="1" max="20" value="4"></label>
          <label>Cartones por hoja<select class="input" id="demoPlayPerPage"><option value="1">1 por hoja</option><option value="2" selected>2 por hoja</option><option value="4">4 por hoja</option></select></label>
        </div>
        <div style="margin-top:12px"><button class="btn primary" id="startDemoPlayBtn">▶️ Iniciar prueba e imprimir</button></div>`;
      panel.querySelector('#startDemoPlayBtn')?.addEventListener('click',()=>{
        const count=Number(panel.querySelector('#demoPlayCount')?.value)||4;
        const per=Number(panel.querySelector('#demoPlayPerPage')?.value)||2;
        startPlayableDemo(count,per,true);
      });
      return;
    }

    panel.innerHTML=`
      <div class="section-title">
        <div><h3>🧪 MODO PRUEBA ACTIVO</h3><div class="muted" style="margin-top:4px">Todo lo que hagas con balotas y ronda es temporal hasta finalizar la prueba.</div></div>
        <div class="actions"><button class="btn" id="reprintDemoBtn">🖨️ Reimprimir DEMO</button><button class="btn bad" id="finishDemoBtn">⏹ Finalizar prueba</button></div>
      </div>
      <div class="success">✅ ${demo.cards.length} cartones de prueba activos · No suman recaudo · No cambian estados de cartones reales · Los ganadores DEMO quedan fuera del historial real.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${demo.cards.map(c=>`<button class="mini" data-demo-card="${c.id}">🎟️ ${c.id}${c.status==='Ganador'?' 🏆':''}</button>`).join('')}</div>
      <div id="demoWinnerSummary" style="margin-top:12px">${demo.winners.length?`<div class="notice">🏆 Ganadores de prueba: ${demo.winners.map(w=>escapeHtml(w.cardId)).join(', ')}</div>`:'<div class="muted">Aún no hay ganador DEMO registrado.</div>'}</div>`;

    panel.querySelector('#reprintDemoBtn')?.addEventListener('click',()=>openPrintCards(demo.cards,2,null,{demo:true}));
    panel.querySelector('#finishDemoBtn')?.addEventListener('click',finishPlayableDemo);
    panel.querySelectorAll('[data-demo-card]').forEach(btn=>btn.addEventListener('click',()=>{
      showView('validate');
      const input=document.getElementById('winnerInput');
      if(input)input.value=btn.dataset.demoCard;
      document.getElementById('validateBtn')?.click();
    }));
  }

  function updateSettingsDemoCopy(){
    const card=document.getElementById('demoCardsCard');
    if(!card)return;
    const title=card.querySelector('h3');
    if(title)title.textContent='🧪 Cartones de prueba / demo jugables';
    const muted=card.querySelector('.muted');
    if(muted)muted.textContent='Puedes imprimirlos y usarlos para probar ruleta, figuras, detector automático y validación de ganador sin afectar la operación real.';
    const success=card.querySelector('.success');
    if(success)success.innerHTML='✅ Los cartones DEMO llevan marca “NO VÁLIDO”, pero <strong>sí son jugables dentro del Modo Prueba</strong>. No suman recaudo ni se mezclan con cartones reales.';
    const btn=card.querySelector('#printDemoBtn');
    if(btn)btn.textContent=demo.active?'🖨️ Reimprimir cartones DEMO':'▶️ Iniciar prueba + imprimir DEMO';
  }

  window.startPlayableDemo=function(count=4,perPage=2,autoPrint=true){
    count=Math.max(1,Math.min(20,Number(count)||4));
    perPage=[1,2,4].includes(Number(perPage))?Number(perPage):2;

    if(demo.active){
      if(autoPrint)openPrintCards(demo.cards,perPage,null,{demo:true});
      renderDemoBanner();
      return;
    }

    demo={
      active:true,
      cards:createDemoCards(count),
      winners:[],
      savedDrawn:Array.isArray(state.drawn)?[...state.drawn]:[],
      savedRound:JSON.parse(JSON.stringify(state.round||{})),
      savedActivity:JSON.parse(JSON.stringify(state.activity||[])),
      startedAt:new Date().toISOString()
    };

    state.drawn=[];
    state.round={name:'Ronda DEMO',pattern:'line',prize:'Premio de prueba',reveal:true,status:'open'};
    saveDemo();
    saveState();
    renderDemoBanner();
    updateSettingsDemoCopy();
    toast('🧪 Modo prueba activado');
    if(autoPrint)openPrintCards(demo.cards,perPage,null,{demo:true});
  };

  window.finishPlayableDemo=function(){
    if(!demo.active)return;
    if(!confirm('¿Finalizar la prueba y restaurar el tablero/ronda que tenías antes?'))return;
    state.drawn=Array.isArray(demo.savedDrawn)?[...demo.savedDrawn]:[];
    if(demo.savedRound)state.round=JSON.parse(JSON.stringify(demo.savedRound));
    state.activity=Array.isArray(demo.savedActivity)?JSON.parse(JSON.stringify(demo.savedActivity)):[];
    demo=defaultDemo();
    localStorage.removeItem(DEMO_KEY);
    saveState();
    renderDemoBanner();
    updateSettingsDemoCopy();
    toast('✅ Prueba finalizada · datos reales restaurados');
  };

  /* El botón existente en Configuración ahora inicia/reimprime una sesión jugable. */
  window.openDemoPrint=function(count=4,perPage=2){
    if(demo.active)openPrintCards(demo.cards,perPage,null,{demo:true});
    else startPlayableDemo(count,perPage,true);
  };

  const realRegisterWinner=window.registerWinner;
  window.registerWinner=function(id){
    const c=findDemoCard(id);
    if(!demo.active||!c)return realRegisterWinner(id);
    if(!validatePattern(c)){alert('Este cartón DEMO todavía no cumple la figura actual.');return;}
    if(!['Pagado','Ganador'].includes(c.status)){alert('El cartón DEMO no está habilitado.');return;}
    const exists=demo.winners.some(w=>w.cardId===c.id&&w.roundName===state.round.name&&w.pattern===state.round.pattern);
    if(exists){toast('Este ganador DEMO ya fue registrado en esta ronda');return;}
    c.status='Ganador';
    demo.winners.unshift({cardId:c.id,buyer:c.buyer,roundName:state.round.name,pattern:state.round.pattern,prize:state.round.prize,at:new Date().toISOString()});
    saveDemo();
    celebrate();
    toast(`🧪🏆 ${c.id} ganador DEMO`);
    const result=document.getElementById('validationResult');
    if(result)result.innerHTML=`<div class="success">🧪🏆 Ganador de prueba registrado: <strong>${escapeHtml(c.id)}</strong>. No afecta resultados reales.</div>`;
    renderDemoBanner();
    renderAll();
  };

  const realRenderPublic=renderPublic;
  renderPublic=function(){
    realRenderPublic();
    if(!demo.active)return;
    const latest=demo.winners[0];
    const winner=document.getElementById('publicWinner');
    if(winner){
      winner.innerHTML=latest?`<div class="winner-banner">🧪🏆 GANADOR DEMO · ${escapeHtml(latest.cardId)} · PRUEBA</div>`:'<div style="text-align:center;margin-top:12px" class="muted">🧪 MODO PRUEBA ACTIVO</div>';
    }
  };

  const realRenderWinners=renderWinners;
  renderWinners=function(){
    realRenderWinners();
    if(!demo.active)return;
    const el=document.getElementById('winnersList');
    if(!el)return;
    el.innerHTML=demo.winners.length?demo.winners.map(w=>`<div style="padding:11px 0;border-bottom:1px solid var(--line)"><strong>🧪🏆 ${escapeHtml(w.cardId)}</strong> · ganador de prueba<div class="muted">${escapeHtml(w.roundName)} · ${patternName(w.pattern)} · NO AFECTA RESULTADOS REALES</div></div>`).join(''):'<div class="muted">🧪 Modo prueba: aún no hay ganadores DEMO.</div>';
  };

  const realRenderAll=renderAll;
  renderAll=function(){
    realRenderAll();
    renderDemoBanner();
    updateSettingsDemoCopy();
  };

  if(bc){
    const priorHandler=bc.onmessage;
    bc.onmessage=(event)=>{
      if(event?.data?.type==='demo-sync'){
        demo=loadDemo();
        renderAll();
        return;
      }
      if(typeof priorHandler==='function')priorHandler(event);
    };
  }

  /* Si el navegador se cerró en plena prueba, la sesión sigue marcada claramente. */
  renderDemoBanner();
  updateSettingsDemoCopy();
  if(demo.active){
    toast('🧪 Modo prueba continúa activo');
    renderAll();
  }
})();