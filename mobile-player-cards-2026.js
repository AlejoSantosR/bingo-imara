/* Bingo IMARA · agrupación móvil de cartones por participante 2026
   Capa adicional: no cambia enlaces existentes, ventas, pagos ni lógica de BINGO. */
(function(){
'use strict';

if(!location.hash.startsWith('#mobile='))return;
if(window.__imaraPlayerCards2026)return;
window.__imaraPlayerCards2026=true;

document.body.classList.add('imara-player-resolving');
(function(){
  const s=document.createElement('style');
  s.id='imaraPlayerResolveCss';
  s.textContent=`
    body.imara-player-resolving .mobile-card-shell{visibility:hidden!important;opacity:0!important}
    body.imara-player-resolving::after{
      content:"Preparando tus cartones…";
      position:fixed;inset:0;z-index:2147481500;
      display:grid;place-items:center;
      background:radial-gradient(circle at 18% 0%,#302450,#111827 48%,#0d1320);
      color:#e9edff;font:800 14px/1.2 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
      letter-spacing:.2px
    }
  `;
  document.head.appendChild(s);
})();

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
      <div class="imara-player-card-id"><span>Cartón</span><strong>${esc(card.id)}</strong></div>
      <div class="imara-player-card-tools">
        <span class="imara-player-card-state">${esc(statusLabel(card))}</span>
        <button type="button" class="imara-card-open" data-open>↗ Abrir</button>
      </div>
    </div>
    <div class="imara-player-mini-grid" data-grid></div>
    <div class="imara-player-card-foot">
      <button type="button" data-clear>↩ Limpiar marcas</button>
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
  return {layout:'horizontal',fit:true,focus:true,zoom:1};
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
    
        </div>

        <div class="imara-player-original-controls" data-original-controls></div>


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
      width:100%!important;
      max-width:none!important;
      overflow-y:auto!important;
      overflow-x:hidden!important;
      overscroll-behavior-y:auto!important;
      -webkit-overflow-scrolling:touch!important;
      padding:
        max(8px,env(safe-area-inset-top))
        max(10px,env(safe-area-inset-right))
        max(24px,env(safe-area-inset-bottom))
        max(10px,env(safe-area-inset-left))!important;
    }
    body.imara-mobile-body.imara-has-player-cards .mobile-card-shell{
      width:min(1760px,100%)!important;
      max-width:none!important;
      height:auto!important;
      min-height:calc(100dvh - 16px)!important;
      overflow:visible!important;
      margin:0 auto!important;
      display:block!important;
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
      grid-template-columns:clamp(220px,18vw,285px) minmax(0,1fr);
      gap:14px;
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
    .imara-player-original-controls{
      display:grid;
      gap:6px;
      width:100%;
      min-width:0;
      margin:2px 0 8px;
    }
    .imara-player-original-controls>*{
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      margin:0!important;
    }
    .imara-player-original-controls .mobile-card-top{
      display:flex!important;
      align-items:center!important;
      gap:8px!important;
      padding-bottom:3px!important;
    }
    .imara-player-original-controls .mobile-person{
      display:grid!important;
      grid-template-columns:1fr!important;
      gap:5px!important;
    }
    .imara-player-original-controls .mobile-person>div:first-child{
      display:none!important;
    }
    .imara-player-original-controls .mobile-person>div{
      padding:7px 8px!important;
    }
    .imara-player-original-controls .mobile-person>div:last-child strong{
      white-space:normal!important;
      overflow:visible!important;
      text-overflow:clip!important;
      word-break:break-word!important;
      overflow-wrap:anywhere!important;
      line-height:1.2!important;
      font-size:12px!important;
    }
    .imara-player-original-controls #mobileRoundLive,
    .imara-player-original-controls .mobile-round-live{
      padding:7px!important;
    }
    .imara-player-original-controls .mobile-actions{
      display:grid!important;
      grid-template-columns:1fr 1fr!important;
      gap:5px!important;
    }
    .imara-player-original-controls .mobile-actions button{
      min-height:32px!important;
      height:auto!important;
      font-size:9px!important;
    }
    .imara-player-original-controls .mobile-help,
    .imara-player-original-controls .mobile-note{
      font-size:8px!important;
      line-height:1.25!important;
      padding:6px 7px!important;
    }
    .imara-player-original-controls .mobile-bingo-btn,
    .imara-player-original-controls #mobileBingoBtn,
    .imara-player-original-controls #imaraPushBell,
    .imara-player-original-controls .imara-push-bell{
      min-height:34px!important;
      height:auto!important;
      font-size:10px!important;
    }
    .imara-player-side-note{
      padding-top:8px!important;
    }
    .imara-side-participant{
      display:block;
      font-size:12px;
      line-height:1.25;
      color:#fff;
      overflow-wrap:anywhere;
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
    .imara-player-card-id span{
      display:block;
      font-size:calc(8px * var(--ui-scale));
      letter-spacing:.8px;
      color:#aeb8ca;
      text-transform:uppercase;
    }
    .imara-player-card-id strong{
      display:block;
      font-size:calc(14px * var(--ui-scale));
      margin-top:2px;
    }
    .imara-player-card-tools{
      display:flex;
      align-items:center;
      justify-content:flex-end;
      gap:5px;
      min-width:0;
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
    .imara-card-open,
    .imara-player-card-foot button{
      border:1px solid #3a4768;
      border-radius:8px;
      background:#1a2540;
      color:#fff;
      font-weight:900;
      cursor:pointer;
    }
    .imara-card-open{
      min-height:25px;
      padding:3px 7px;
      font-size:calc(8px * var(--ui-scale));
      background:linear-gradient(135deg,#ff5b8f,#8d6bff);
      border-color:transparent;
      white-space:nowrap;
    }
    .imara-card-open:disabled{
      opacity:.72;
      cursor:default;
      background:#27324b!important;
      border:1px solid #3a4768!important;
    }
    .imara-player-card-foot{
      display:flex;
      justify-content:flex-end;
      margin-top:calc(5px * var(--ui-scale));
    }
    .imara-player-card-foot button{
      min-height:24px;
      padding:3px 7px;
      font-size:calc(8px * var(--ui-scale));
      color:#cbd4e5;
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

    @media(max-width:1100px){
      .imara-player-workspace{grid-template-columns:210px minmax(0,1fr);gap:10px}
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
      .imara-player-original-controls{
        grid-column:1/-1;
        grid-template-columns:1fr;
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
      if(open){open.disabled=true;open.textContent='✓ Actual';}
    }
    host.appendChild(node);
  });
  shell.appendChild(wrap);

  const originalSlot=wrap.querySelector('[data-original-controls]');
  Array.from(shell.children).forEach(node=>{
    if(node===wrap)return;
    if(node.classList?.contains('mobile-grid')){
      node.style.setProperty('display','none','important');
      node.setAttribute('aria-hidden','true');
      return;
    }
    originalSlot.appendChild(node);
  });

  const stage=wrap.querySelector('[data-stage]');
  const viewStatus=wrap.querySelector('[data-view-status]');

  function cleanupSide(){
    const person=document.querySelector('.imara-player-original-controls .mobile-person');
    if(person){
      const first=person.children?.[0];
      if(first)first.style.setProperty('display','none','important');
    }

    const warning=/si completas la figura de la ronda.*pulsa bingo/i;
    const nodes=[...originalSlot.querySelectorAll('*')];
    for(const el of nodes){
      const txt=String(el.textContent||'').replace(/\s+/g,' ').trim();
      if(!warning.test(txt))continue;
      const childMatches=[...el.children].some(ch=>warning.test(String(ch.textContent||'').replace(/\s+/g,' ').trim()));
      if(!childMatches)el.style.setProperty('display','none','important');
    }

    const push=document.getElementById('imaraPushBell');
    if(push&&/recordatorios activos/i.test(String(push.textContent||''))){
      push.style.setProperty('display','none','important');
    }
  }

  function computeDesktopFit(){
    const width=Math.max(280,stage.clientWidth||window.innerWidth-240);
    const gap=10;
    const count=cards.length;

    wrap.classList.add('layout-horizontal');
    wrap.classList.remove('layout-vertical');
    document.body.classList.add('imara-multi-focus');

    if(matchMedia('(max-width:640px)').matches){
      wrap.style.setProperty('--ui-scale','1');
      wrap.style.setProperty('--card-cols','1');
      if(viewStatus)viewStatus.textContent='Desliza ↔ para ver todos tus cartones';
      return;
    }

    const availH=Math.max(360,stage.clientHeight-34);
    let best={cols:1,scale:.78,score:-Infinity};
    const maxCols=Math.min(count,width>1500?5:width>1120?4:width>820?3:2);

    for(let cols=1;cols<=maxCols;cols++){
      const rows=Math.ceil(count/cols);
      const cardW=(width-gap*(cols-1))/cols;
      const byW=cardW/300;
      const byH=(availH-gap*(rows-1))/(rows*245);
      const scale=clamp(Math.min(byW,byH),.74,1.22);
      const readable=scale>=.82?1:0;
      const fitPenalty=Math.max(0,(rows*245*scale+gap*(rows-1))-availH);
      const score=readable*100+scale*25+cols-fitPenalty/100;
      if(score>best.score)best={cols,scale,score};
    }

    wrap.style.setProperty('--card-cols',String(best.cols));
    wrap.style.setProperty('--ui-scale',String(best.scale));
    if(viewStatus)viewStatus.textContent='Tus cartones de juego';
  }

  cleanupSide();
  const sideObserver=new MutationObserver(()=>cleanupSide());
  sideObserver.observe(originalSlot,{subtree:true,childList:true,characterData:true});

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

  computeDesktopFit();
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
    document.body.classList.remove('imara-player-resolving');
  }
}

setTimeout(load,0);
})();