/* Bingo IMARA · agrupación móvil de cartones por participante 2026
   Capa adicional: no cambia enlaces existentes, ventas, pagos ni lógica de BINGO. */
(function(){
'use strict';

if(!location.hash.startsWith('#mobile='))return;
if(window.__imaraPlayerCards2026)return;
window.__imaraPlayerCards2026=true;

const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-player-cards';
const LETTERS=['B','I','N','G','O'];

function esc(s){
  return String(s??'').replace(/[&<>"']/g,m=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}

function decodePayload(){
  try{
    let s=location.hash.slice('#mobile='.length).replace(/-/g,'+').replace(/_/g,'/');
    while(s.length%4)s+='=';
    const binary=atob(s),bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    const data=JSON.parse(new TextDecoder().decode(bytes));
    if(!data||!data.id||!Array.isArray(data.grid))return null;
    return data;
  }catch(e){return null;}
}

function encodePayload(obj){
  const bytes=new TextEncoder().encode(JSON.stringify(obj));
  let binary='';
  bytes.forEach(b=>binary+=String.fromCharCode(b));
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function marksKey(id){return `imaraMobileMarks:${id}`;}
function loadMarks(id){
  try{return new Set(JSON.parse(localStorage.getItem(marksKey(id))||'[]'));}catch(e){return new Set();}
}
function saveMarks(id,set){
  try{localStorage.setItem(marksKey(id),JSON.stringify([...set]));}catch(e){}
}
function codeFor(value,col){
  if(value==='FREE')return '★';
  return `${LETTERS[col]}-${String(Number(value)).padStart(2,'0')}`;
}
function statusLabel(card){
  if(String(card.card_status||'').toLowerCase()==='ganador')return '🏆 Ganador';
  if(card.enabled)return '✅ En juego';
  if(String(card.payment_status||'').toLowerCase()==='pending')return '⏳ Pendiente';
  return card.card_status||'Asignado';
}
function switchToCard(card,base){
  const payload={
    v:1,
    id:card.id,
    buyer:card.buyer||base.buyer||'',
    status:card.card_status||'',
    grid:card.grid,
    ballMax:Number(card.ballMax||base.ballMax||99),
    title:base.title||'BINGO IMARA',
    organizer:base.organizer||'PL4 Tribu IMARA'
  };
  const url=`${location.origin}${location.pathname}#mobile=${encodePayload(payload)}`;
  history.replaceState(null,'',url);
  location.reload();
}

function buildMiniCard(card,base){
  const marks=loadMarks(card.id);
  const box=document.createElement('article');
  box.className='imara-player-card';
  box.innerHTML=`
    <div class="imara-player-card-head">
      <div><span>Cartón</span><strong>${esc(card.id)}</strong></div>
      <span class="imara-player-card-state">${esc(statusLabel(card))}</span>
    </div>
    <div class="imara-player-mini-grid" data-grid></div>
    <div class="imara-player-card-actions">
      <button type="button" data-clear>↩ Limpiar marcas</button>
      <button type="button" class="primary" data-open>🎟️ Abrir este cartón</button>
    </div>`;

  const grid=box.querySelector('[data-grid]');
  LETTERS.forEach(letter=>{
    const h=document.createElement('div');
    h.className='imara-player-mini-cell head';
    h.textContent=letter;
    grid.appendChild(h);
  });

  for(let r=0;r<5;r++)for(let c=0;c<5;c++){
    const v=card.grid?.[r]?.[c],key=`${r}-${c}`;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='imara-player-mini-cell'+(v==='FREE'?' free':'')+(marks.has(key)?' marked':'');
    btn.textContent=codeFor(v,c);
    btn.setAttribute('aria-pressed',marks.has(key)?'true':'false');
    if(v!=='FREE')btn.addEventListener('click',()=>{
      if(marks.has(key))marks.delete(key);else marks.add(key);
      saveMarks(card.id,marks);
      btn.classList.toggle('marked',marks.has(key));
      btn.setAttribute('aria-pressed',marks.has(key)?'true':'false');
    });
    grid.appendChild(btn);
  }

  box.querySelector('[data-clear]').addEventListener('click',()=>{
    if(!confirm(`¿Desmarcar todas las casillas de ${card.id}?`))return;
    marks.clear();
    saveMarks(card.id,marks);
    box.querySelectorAll('.imara-player-mini-cell.marked').forEach(x=>{
      x.classList.remove('marked');
      x.setAttribute('aria-pressed','false');
    });
  });

  box.querySelector('[data-open]').addEventListener('click',()=>switchToCard(card,base));
  return box;
}

function readViewPrefs(){
  const fallback={layout:matchMedia('(max-width:640px)').matches?'vertical':'horizontal',fit:true,focus:false,zoom:1};
  try{
    const x=JSON.parse(localStorage.getItem('imaraPlayerCardsView:v2')||'{}');
    return {
      layout:x.layout==='vertical'?'vertical':'horizontal',
      fit:x.fit!==false,
      focus:!!x.focus,
      zoom:Math.min(1.35,Math.max(.78,Number(x.zoom)||1))
    };
  }catch(e){return fallback;}
}
function saveViewPrefs(p){
  try{localStorage.setItem('imaraPlayerCardsView:v2',JSON.stringify(p));}catch(e){}
}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}

function mount(data,base){
  const cards=Array.isArray(data.cards)?data.cards:[];
  if(cards.length<=1)return;

  const shell=document.querySelector('.mobile-card-shell');
  if(!shell||document.getElementById('imaraPlayerCards2026'))return;

  const others=cards.filter(c=>String(c.id)!==String(base.id));
  if(!others.length)return;

  document.body.classList.add('imara-has-player-cards');
  const prefs=readViewPrefs();

  const wrap=document.createElement('section');
  wrap.id='imaraPlayerCards2026';
  wrap.className='imara-player-cards';
  wrap.innerHTML=`
    <div class="imara-player-workspace">
      <aside class="imara-player-side">
        <div class="imara-player-cards-title">
          <div>
            <span>VISTA DE JUEGO</span>
            <h2>🎟️ Mis cartones · ${cards.length}</h2>
          </div>
          <strong>${esc(data.player_name||base.buyer||'Participante')}</strong>
        </div>

        <div class="imara-player-control-block">
          <span class="imara-control-label">Distribución</span>
          <div class="imara-layout-toggle">
            <button type="button" data-layout="horizontal">↔ Horizontal</button>
            <button type="button" data-layout="vertical">↕ Vertical</button>
          </div>
        </div>

        <div class="imara-player-control-block">
          <span class="imara-control-label">Tamaño</span>
          <div class="imara-zoom-row">
            <button type="button" data-zoom="-1" aria-label="Reducir cartones">−</button>
            <strong data-zoom-label>100%</strong>
            <button type="button" data-zoom="1" aria-label="Ampliar cartones">+</button>
          </div>
          <button type="button" class="imara-side-action" data-fit>▦ Ajustar todos</button>
        </div>

        <div class="imara-player-control-block">
          <button type="button" class="imara-side-action primary" data-focus>⤢ Vista juego</button>
          <button type="button" class="imara-side-action" data-scroll-top>↑ Cartón principal</button>
        </div>

        <p class="imara-player-cards-help">
          Puedes marcar cualquiera de tus cartones aquí. En PC la vista se reorganiza sola si reduces la ventana para dejar YouTube al lado.
        </p>
      </aside>

      <div class="imara-player-stage" data-stage>
        <div class="imara-player-stage-meta">
          <span data-view-status></span>
          <small>Las marcas se guardan por cartón en este dispositivo.</small>
        </div>
        <div class="imara-player-cards-grid" data-cards></div>
      </div>
    </div>`;

  const style=document.createElement('style');
  style.id='imaraPlayerCards2026Style';
  style.textContent=`
    html{height:auto!important;min-height:100%!important;overflow-y:auto!important;overflow-x:hidden!important}
    body.imara-mobile-body.imara-has-player-cards{
      height:auto!important;
      min-height:100dvh!important;
      overflow-y:auto!important;
      overflow-x:hidden!important;
      overscroll-behavior-y:auto!important;
      -webkit-overflow-scrolling:touch!important;
      padding-bottom:max(28px,env(safe-area-inset-bottom))!important;
    }
    body.imara-mobile-body.imara-has-player-cards .mobile-card-shell{
      height:auto!important;
      min-height:calc(100dvh - 16px)!important;
      overflow:visible!important;
      display:flex!important;
      flex-direction:column!important;
      grid-template-columns:none!important;
      grid-template-rows:none!important;
    }
    body.imara-mobile-body.imara-has-player-cards .mobile-card-top,
    body.imara-mobile-body.imara-has-player-cards .mobile-person,
    body.imara-mobile-body.imara-has-player-cards #mobileRoundLive,
    body.imara-mobile-body.imara-has-player-cards .mobile-round-live,
    body.imara-mobile-body.imara-has-player-cards .mobile-actions,
    body.imara-mobile-body.imara-has-player-cards .mobile-bingo-btn,
    body.imara-mobile-body.imara-has-player-cards #mobileBingoBtn,
    body.imara-mobile-body.imara-has-player-cards .mobile-note,
    body.imara-mobile-body.imara-has-player-cards #imaraPushBell,
    body.imara-mobile-body.imara-has-player-cards .imara-push-bell{
      grid-column:auto!important;
      grid-row:auto!important;
    }
    body.imara-mobile-body.imara-has-player-cards .mobile-grid{
      flex:0 0 auto!important;
      height:auto!important;
      min-height:0!important;
      grid-column:auto!important;
      grid-row:auto!important;
      grid-template-rows:repeat(6,minmax(38px,48px))!important;
      overflow:visible!important;
    }

    .imara-player-cards{
      --ui-scale:1;
      --card-cols:2;
      flex:0 0 auto!important;
      width:100%;
      margin-top:18px;
      padding-top:18px;
      padding-bottom:18px;
      border-top:1px solid #34415f;
    }
    .imara-player-workspace{
      display:grid;
      grid-template-columns:190px minmax(0,1fr);
      gap:12px;
      align-items:start;
      width:100%;
      min-width:0;
    }
    .imara-player-side{
      position:sticky;
      top:8px;
      align-self:start;
      min-width:0;
      padding:12px;
      border:1px solid #34415f;
      border-radius:16px;
      background:linear-gradient(180deg,#141e33,#10182a);
      box-shadow:0 14px 35px rgba(0,0,0,.16);
    }
    .imara-player-cards-title{
      display:grid;
      gap:4px;
      margin-bottom:12px;
    }
    .imara-player-cards-title span{
      display:block;
      font-size:9px;
      letter-spacing:1.2px;
      color:#aeb8ca;
      font-weight:900;
    }
    .imara-player-cards-title h2{
      font-size:18px;
      line-height:1.05;
      margin:1px 0 0;
    }
    .imara-player-cards-title>strong{
      font-size:11px;
      color:#d8def0;
      line-height:1.25;
    }
    .imara-player-control-block{
      display:grid;
      gap:7px;
      padding:10px 0;
      border-top:1px solid rgba(75,90,125,.38);
    }
    .imara-control-label{
      font-size:9px;
      letter-spacing:.8px;
      text-transform:uppercase;
      color:#9eabc2;
      font-weight:900;
    }
    .imara-layout-toggle{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:5px;
    }
    .imara-layout-toggle button,
    .imara-side-action,
    .imara-zoom-row button{
      min-height:34px;
      border:1px solid #3a4768;
      border-radius:10px;
      background:#1a2540;
      color:#fff;
      font-weight:900;
      font-size:10px;
      cursor:pointer;
    }
    .imara-layout-toggle button.active{
      background:linear-gradient(135deg,#ff5b8f,#8d6bff);
      border-color:transparent;
    }
    .imara-side-action{
      width:100%;
    }
    .imara-side-action.primary{
      background:linear-gradient(135deg,#ff5b8f,#8d6bff);
      border-color:transparent;
    }
    .imara-side-action.active{
      box-shadow:0 0 0 2px rgba(141,107,255,.25);
      border-color:#8d6bff;
    }
    .imara-zoom-row{
      display:grid;
      grid-template-columns:36px 1fr 36px;
      gap:5px;
      align-items:center;
    }
    .imara-zoom-row strong{
      text-align:center;
      font-size:11px;
      color:#e7eafe;
    }
    .imara-zoom-row button{
      min-height:32px;
      font-size:18px;
      line-height:1;
    }
    .imara-player-cards-help{
      margin:8px 0 0;
      padding:9px 10px;
      border-radius:11px;
      background:rgba(141,107,255,.10);
      border:1px solid rgba(141,107,255,.22);
      font-size:10px;
      line-height:1.4;
      color:#dce2ee;
    }
    .imara-player-stage{
      min-width:0;
      width:100%;
      overflow:visible;
    }
    .imara-player-stage-meta{
      display:flex;
      justify-content:space-between;
      gap:10px;
      align-items:center;
      min-height:28px;
      margin-bottom:7px;
      color:#b9c3d6;
      font-size:10px;
    }
    .imara-player-stage-meta>span{
      font-weight:900;
      color:#e7eafe;
    }
    .imara-player-stage-meta small{
      text-align:right;
      font-size:9px;
      color:#99a5bc;
    }
    .imara-player-cards-grid{
      display:grid;
      gap:10px;
      align-items:start;
      min-width:0;
    }
    .imara-player-cards.layout-horizontal .imara-player-cards-grid{
      grid-template-columns:repeat(var(--card-cols),minmax(0,1fr));
    }
    .imara-player-cards.layout-vertical .imara-player-cards-grid{
      grid-template-columns:minmax(0,min(520px,100%));
      justify-content:center;
    }
    .imara-player-card{
      min-width:0;
      padding:calc(10px * var(--ui-scale));
      border-radius:calc(15px * var(--ui-scale));
      background:#141e33;
      border:1px solid #34415f;
      container-type:inline-size;
    }
    .imara-player-card.current{
      border-color:#9a78ff;
      box-shadow:0 0 0 2px rgba(141,107,255,.16);
    }
    .imara-player-card-head{
      display:flex;
      justify-content:space-between;
      gap:6px;
      align-items:center;
      margin-bottom:calc(7px * var(--ui-scale));
    }
    .imara-player-card-head>div span{
      display:block;
      font-size:calc(8px * var(--ui-scale));
      letter-spacing:.8px;
      color:#aeb8ca;
      text-transform:uppercase;
    }
    .imara-player-card-head>div strong{
      display:block;
      font-size:calc(14px * var(--ui-scale));
      margin-top:2px;
    }
    .imara-player-card-state{
      font-size:calc(9px * var(--ui-scale));
      font-weight:900;
      color:#dce2ee;
      background:#202c47;
      border-radius:999px;
      padding:calc(4px * var(--ui-scale)) calc(7px * var(--ui-scale));
      white-space:nowrap;
    }
    .imara-player-mini-grid{
      display:grid;
      grid-template-columns:repeat(5,minmax(0,1fr));
      gap:calc(3px * var(--ui-scale));
    }
    .imara-player-mini-cell{
      aspect-ratio:1.25;
      min-width:0;
      border-radius:calc(6px * var(--ui-scale));
      border:1px solid #d6ddec;
      background:#fff;
      color:#111827;
      display:grid;
      place-items:center;
      position:relative;
      padding:1px;
      font-size:clamp(9px,calc(12px * var(--ui-scale)),16px);
      font-weight:1000;
      line-height:1;
      touch-action:manipulation;
      cursor:pointer;
    }
    .imara-player-mini-cell.head{
      background:#151d2f;
      color:#fff;
      border-color:#36415c;
      font-size:clamp(10px,calc(13px * var(--ui-scale)),17px);
    }
    .imara-player-mini-cell.free{
      background:#e7ddff;
      color:#5b42aa;
    }
    .imara-player-mini-cell.marked{
      background:#ffd4e2;
      border-color:#ff729e;
      color:#701e46;
    }
    .imara-player-mini-cell.marked::after{
      content:"✕";
      position:absolute;
      font-size:clamp(18px,calc(28px * var(--ui-scale)),38px);
      line-height:1;
      color:rgba(176,20,77,.62);
      transform:rotate(-9deg);
    }
    .imara-player-mini-cell.free::after{display:none}
    .imara-player-card-actions{
      display:grid;
      grid-template-columns:1fr 1.1fr;
      gap:5px;
      margin-top:calc(7px * var(--ui-scale));
    }
    .imara-player-card-actions button{
      min-height:calc(31px * var(--ui-scale));
      border:1px solid #3a4768;
      border-radius:9px;
      background:#1a2540;
      color:#fff;
      font-weight:900;
      font-size:clamp(8px,calc(9px * var(--ui-scale)),11px);
      cursor:pointer;
    }
    .imara-player-card-actions button.primary{
      background:linear-gradient(135deg,#ff5b8f,#8d6bff);
      border:0;
    }
    .imara-player-card-actions button:disabled{
      opacity:.72;
      cursor:default;
      background:#27324b!important;
      border:1px solid #3a4768!important;
    }

    body.imara-mobile-body.imara-multi-focus{
      height:100dvh!important;
      min-height:100dvh!important;
      overflow:hidden!important;
      padding:
        max(6px,env(safe-area-inset-top))
        max(7px,env(safe-area-inset-right))
        max(6px,env(safe-area-inset-bottom))
        max(7px,env(safe-area-inset-left))!important;
    }
    body.imara-mobile-body.imara-multi-focus .mobile-card-shell{
      width:100%!important;
      max-width:none!important;
      height:calc(100dvh - 12px)!important;
      min-height:0!important;
      overflow:hidden!important;
      margin:0!important;
      display:block!important;
    }
    body.imara-mobile-body.imara-multi-focus .mobile-card-shell>:not(#imaraPlayerCards2026){
      display:none!important;
    }
    body.imara-mobile-body.imara-multi-focus #imaraPlayerCards2026{
      height:100%!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
    }
    body.imara-mobile-body.imara-multi-focus .imara-player-workspace{
      height:100%;
      min-height:0;
    }
    body.imara-mobile-body.imara-multi-focus .imara-player-side{
      top:0;
      max-height:100%;
      overflow:auto;
    }
    body.imara-mobile-body.imara-multi-focus .imara-player-stage{
      min-height:0;
      height:100%;
      overflow:auto;
      padding-right:2px;
      overscroll-behavior:contain;
      -webkit-overflow-scrolling:touch;
    }

    @media(max-width:900px){
      .imara-player-workspace{grid-template-columns:160px minmax(0,1fr)}
      .imara-player-side{padding:10px}
      .imara-layout-toggle{grid-template-columns:1fr}
      .imara-player-cards-title h2{font-size:16px}
    }

    @media(max-width:640px){
      body.imara-mobile-body.imara-has-player-cards .mobile-grid{
        grid-template-rows:repeat(6,minmax(34px,44px))!important;
      }
      .imara-player-workspace{
        grid-template-columns:1fr;
        gap:8px;
      }
      .imara-player-side{
        position:static;
        display:grid;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr);
        gap:7px 8px;
        padding:9px;
      }
      .imara-player-cards-title{
        grid-column:1/-1;
        margin:0;
      }
      .imara-player-control-block{
        padding:6px 0 0;
        border-top:1px solid rgba(75,90,125,.28);
      }
      .imara-player-cards-help{
        grid-column:1/-1;
        margin:0;
      }
      .imara-player-stage-meta small{display:none}
      .imara-player-cards.layout-vertical .imara-player-cards-grid{
        grid-template-columns:1fr;
      }
      .imara-player-cards.layout-horizontal .imara-player-stage{
        overflow-x:auto;
        padding-bottom:5px;
        scroll-snap-type:x proximity;
      }
      .imara-player-cards.layout-horizontal .imara-player-cards-grid{
        display:grid;
        grid-auto-flow:column;
        grid-auto-columns:minmax(270px,86vw);
        grid-template-columns:none!important;
        width:max-content;
      }
      .imara-player-cards.layout-horizontal .imara-player-card{
        scroll-snap-align:start;
      }
      .imara-player-card{
        --ui-scale:1!important;
      }
      body.imara-mobile-body.imara-multi-focus .imara-player-workspace{
        grid-template-rows:auto minmax(0,1fr);
      }
      body.imara-mobile-body.imara-multi-focus .imara-player-side{
        max-height:none;
        overflow:visible;
      }
      body.imara-mobile-body.imara-multi-focus .imara-player-stage{
        min-height:0;
      }
    }

    @media(orientation:landscape) and (max-height:620px) and (max-width:960px){
      body.imara-mobile-body.imara-has-player-cards .imara-player-workspace{
        grid-template-columns:150px minmax(0,1fr)!important;
        grid-template-rows:1fr!important;
      }
      body.imara-mobile-body.imara-has-player-cards .imara-player-side{
        display:block!important;
        position:sticky!important;
        top:0!important;
      }
      body.imara-mobile-body.imara-has-player-cards .imara-player-stage{
        min-height:0!important;
      }
      body.imara-mobile-body.imara-has-player-cards .imara-player-cards-help{
        display:none;
      }
      body.imara-mobile-body.imara-has-player-cards .imara-layout-toggle{
        grid-template-columns:1fr!important;
      }
    }
  `;
  document.head.appendChild(style);

  const host=wrap.querySelector('[data-cards]');
  cards.forEach(card=>{
    const node=buildMiniCard(card,base);
    if(String(card.id)===String(base.id)){
      node.classList.add('current');
      const state=node.querySelector('.imara-player-card-state');
      if(state)state.textContent='👁 Abierto';
      const open=node.querySelector('[data-open]');
      if(open){open.disabled=true;open.textContent='✓ Cartón actual';}
    }
    host.appendChild(node);
  });
  shell.appendChild(wrap);

  const stage=wrap.querySelector('[data-stage]');
  const zoomLabel=wrap.querySelector('[data-zoom-label]');
  const viewStatus=wrap.querySelector('[data-view-status]');
  const focusBtn=wrap.querySelector('[data-focus]');
  const fitBtn=wrap.querySelector('[data-fit]');

  function computeDesktopFit(){
    const width=Math.max(280,stage.clientWidth||window.innerWidth-220);
    const gap=10;
    const count=cards.length;
    if(prefs.layout==='vertical'||matchMedia('(max-width:640px)').matches){
      wrap.style.setProperty('--card-cols','1');
      wrap.style.setProperty('--ui-scale',String(prefs.zoom));
      return;
    }

    if(!prefs.fit){
      const target=clamp(300*prefs.zoom,230,420);
      const cols=clamp(Math.floor((width+gap)/(target+gap)),1,Math.min(count,5));
      wrap.style.setProperty('--card-cols',String(cols));
      wrap.style.setProperty('--ui-scale',String(prefs.zoom));
      return;
    }

    const availH=prefs.focus
      ? Math.max(360,stage.clientHeight-34)
      : Math.max(520,Math.min(window.innerHeight*.88,900));

    let best={cols:1,scale:.78,score:-Infinity};
    const maxCols=Math.min(count,width>1450?5:width>1050?4:width>760?3:2);
    for(let cols=1;cols<=maxCols;cols++){
      const rows=Math.ceil(count/cols);
      const cardW=(width-gap*(cols-1))/cols;
      const byW=cardW/300;
      const byH=(availH-gap*(rows-1))/(rows*245);
      const scale=clamp(Math.min(byW,byH)*prefs.zoom,.68,1.28);
      const readable=scale>=.78?1:0;
      const fitPenalty=Math.max(0,(rows*245*scale+gap*(rows-1))-availH);
      const score=readable*100+scale*25+cols-fitPenalty/100;
      if(score>best.score)best={cols,scale,score};
    }
    wrap.style.setProperty('--card-cols',String(best.cols));
    wrap.style.setProperty('--ui-scale',String(best.scale));
  }

  function applyView(){
    wrap.classList.toggle('layout-horizontal',prefs.layout==='horizontal');
    wrap.classList.toggle('layout-vertical',prefs.layout==='vertical');
    document.body.classList.toggle('imara-multi-focus',prefs.focus);
    wrap.querySelectorAll('[data-layout]').forEach(b=>b.classList.toggle('active',b.dataset.layout===prefs.layout));
    fitBtn.classList.toggle('active',prefs.fit);
    fitBtn.textContent=prefs.fit?'✓ Ajustando todos':'▦ Ajustar todos';
    focusBtn.textContent=prefs.focus?'↩ Salir de vista juego':'⤢ Vista juego';
    zoomLabel.textContent=`${Math.round(prefs.zoom*100)}%`;
    viewStatus.textContent=prefs.layout==='horizontal'
      ? (matchMedia('(max-width:640px)').matches?'Desliza ↔ para ver tus cartones':(prefs.fit?'Vista horizontal · ajustando todos':'Vista horizontal'))
      : 'Vista vertical · cartones grandes';
    saveViewPrefs(prefs);
    requestAnimationFrame(computeDesktopFit);
  }

  wrap.querySelectorAll('[data-layout]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      prefs.layout=btn.dataset.layout==='vertical'?'vertical':'horizontal';
      applyView();
    });
  });
  wrap.querySelectorAll('[data-zoom]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      prefs.zoom=clamp(Math.round((prefs.zoom+(btn.dataset.zoom==='1'?.1:-.1))*100)/100,.78,1.35);
      prefs.fit=false;
      applyView();
    });
  });
  fitBtn.addEventListener('click',()=>{
    prefs.fit=!prefs.fit;
    if(prefs.fit)prefs.zoom=1;
    applyView();
  });
  focusBtn.addEventListener('click',()=>{
    prefs.focus=!prefs.focus;
    applyView();
    if(prefs.focus)wrap.scrollIntoView({block:'start'});
  });
  wrap.querySelector('[data-scroll-top]').addEventListener('click',()=>{
    if(prefs.focus){
      prefs.focus=false;
      applyView();
    }
    window.scrollTo({top:0,behavior:'smooth'});
  });

  let raf=0;
  const recalc=()=>{
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(computeDesktopFit);
  };
  window.addEventListener('resize',recalc,{passive:true});
  if('ResizeObserver' in window){
    const ro=new ResizeObserver(recalc);
    ro.observe(stage);
  }

  applyView();
}

async function load(){
  const base=decodePayload();
  if(!base)return;

  const ctl=new AbortController();
  const tm=setTimeout(()=>ctl.abort(),9000);
  try{
    const r=await fetch(API,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      cache:'no-store',
      signal:ctl.signal,
      body:JSON.stringify({
        action:'list-player-cards',
        proof:{id:String(base.id),grid:base.grid}
      })
    });
    const data=await r.json().catch(()=>({}));
    if(r.ok&&data?.ok)mount(data,base);
  }catch(e){
    console.warn('Mis cartones:',e?.message||e);
  }finally{
    clearTimeout(tm);
  }
}

setTimeout(load,0);
})();