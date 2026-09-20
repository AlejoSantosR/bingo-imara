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

function mount(data,base){
  const cards=Array.isArray(data.cards)?data.cards:[];
  if(cards.length<=1)return;

  const shell=document.querySelector('.mobile-card-shell');
  if(!shell||document.getElementById('imaraPlayerCards2026'))return;

  const others=cards.filter(c=>String(c.id)!==String(base.id));
  if(!others.length)return;

  document.body.classList.add('imara-has-player-cards');

  const wrap=document.createElement('section');
  wrap.id='imaraPlayerCards2026';
  wrap.className='imara-player-cards';
  wrap.innerHTML=`
    <div class="imara-player-cards-title">
      <div>
        <span>TUS CARTONES</span>
        <h2>🎟️ Mis cartones · ${cards.length}</h2>
      </div>
      <strong>${esc(data.player_name||base.buyer||'Participante')}</strong>
    </div>
    <p class="imara-player-cards-help">
      El cartón de arriba es el que abriste con tu enlace. Abajo puedes ver todos tus cartones, incluido el actual, y marcarlos sin salir de esta pantalla.
    </p>
    <div class="imara-player-cards-grid" data-cards></div>`;

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
    .imara-player-cards{flex:0 0 auto!important;width:100%;margin-top:18px;padding-top:18px;padding-bottom:18px;border-top:1px solid #34415f}
    .imara-player-cards-title{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:8px}
    .imara-player-cards-title span{display:block;font-size:10px;letter-spacing:1.2px;color:#aeb8ca;font-weight:900}
    .imara-player-cards-title h2{font-size:20px;margin:3px 0 0}
    .imara-player-cards-title>strong{font-size:13px;color:#d8def0;text-align:right}
    .imara-player-cards-help{margin:0 0 12px;padding:10px 12px;border-radius:13px;background:rgba(141,107,255,.10);border:1px solid rgba(141,107,255,.24);font-size:12px;line-height:1.45;color:#dce2ee}
    .imara-player-cards-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .imara-player-card{padding:12px;border-radius:16px;background:#141e33;border:1px solid #34415f}\n    .imara-player-card.current{border-color:#9a78ff;box-shadow:0 0 0 2px rgba(141,107,255,.16)}
    .imara-player-card-head{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:9px}
    .imara-player-card-head>div span{display:block;font-size:9px;letter-spacing:1px;color:#aeb8ca;text-transform:uppercase}
    .imara-player-card-head>div strong{display:block;font-size:15px;margin-top:2px}
    .imara-player-card-state{font-size:10px;font-weight:900;color:#dce2ee;background:#202c47;border-radius:999px;padding:5px 8px;white-space:nowrap}
    .imara-player-mini-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:3px}
    .imara-player-mini-cell{aspect-ratio:1;border-radius:7px;border:1px solid #d6ddec;background:#fff;color:#111827;display:grid;place-items:center;position:relative;padding:1px;font-size:clamp(8px,2.5vw,11px);font-weight:1000;touch-action:manipulation}
    .imara-player-mini-cell.head{background:#151d2f;color:#fff;border-color:#36415c;font-size:12px}
    .imara-player-mini-cell.free{background:#e7ddff;color:#5b42aa}
    .imara-player-mini-cell.marked{background:#ffd4e2;border-color:#ff729e;color:#701e46}
    .imara-player-mini-cell.marked::after{content:"✕";position:absolute;font-size:clamp(18px,6vw,30px);line-height:1;color:rgba(176,20,77,.62);transform:rotate(-9deg)}
    .imara-player-mini-cell.free::after{display:none}
    .imara-player-card-actions{display:grid;grid-template-columns:1fr 1.1fr;gap:6px;margin-top:9px}
    .imara-player-card-actions button{min-height:36px;border:1px solid #3a4768;border-radius:10px;background:#1a2540;color:#fff;font-weight:900;font-size:10px}
    .imara-player-card-actions button.primary{background:linear-gradient(135deg,#ff5b8f,#8d6bff);border:0}\n    .imara-player-card-actions button:disabled{opacity:.72;cursor:default;background:#27324b!important;border:1px solid #3a4768!important}
    @media(min-width:521px){
      .imara-player-cards-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
    @media(max-width:520px){
      body.imara-mobile-body.imara-has-player-cards .mobile-grid{
        grid-template-rows:repeat(6,minmax(34px,44px))!important;
      }
      .imara-player-cards-grid{grid-template-columns:1fr}
      .imara-player-cards-title{align-items:flex-start;flex-direction:column}
      .imara-player-cards-title>strong{text-align:left}
      .imara-player-mini-cell{font-size:11px}
    }`;
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