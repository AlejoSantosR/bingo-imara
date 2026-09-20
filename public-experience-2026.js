(function(){
'use strict';
if(window.__imaraPublicExperience2026)return;
window.__imaraPublicExperience2026=true;
if(location.hash.startsWith('#mobile='))return;

const VIEW=document.getElementById('view-public');
if(!VIEW)return;

let latest=null,lastGuideSig='',lastStatusSig='';
const esc=s=>typeof escapeHtml==='function'?escapeHtml(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

const LABELS={
 line:'Línea cualquiera',row:'Fila horizontal',column:'Columna vertical',
 col_b:'Columna B',col_i:'Columna I',col_n:'Columna N',col_g:'Columna G',col_o:'Columna O',
 diagonal:'Diagonal',corners:'4 esquinas',l_left:'L izquierda',l_right:'L derecha',
 x:'X completa',plus:'Cruz (+)',t:'Letra T',h:'Letra H',u:'Letra U',
 frame:'Marco exterior',full:'Cartón lleno'
};
const HELP={
 line:'Completa una línea horizontal, vertical o diagonal.',
 row:'Completa una fila horizontal de extremo a extremo.',
 column:'Completa una columna vertical de arriba abajo.',
 col_b:'Completa toda la columna B.',col_i:'Completa toda la columna I.',
 col_n:'Completa toda la columna N.',col_g:'Completa toda la columna G.',col_o:'Completa toda la columna O.',
 diagonal:'Completa una diagonal de esquina a esquina.',
 corners:'Marca las cuatro esquinas del cartón.',
 l_left:'Forma una L usando la columna izquierda y la fila inferior.',
 l_right:'Forma una L usando la columna derecha y la fila inferior.',
 x:'Completa las dos diagonales formando una X.',
 plus:'Completa la fila central y la columna central.',
 t:'Completa la fila superior y la columna central.',
 h:'Completa las dos columnas laterales y la fila central.',
 u:'Completa las dos columnas laterales y la fila inferior.',
 frame:'Completa todo el borde exterior del cartón.',
 full:'Marca todo el cartón. El centro libre ya cuenta.'
};

function targetCells(pattern){
 const s=new Set(),add=(r,c)=>s.add(r+'-'+c);
 const row=r=>{for(let c=0;c<5;c++)add(r,c);};
 const col=c=>{for(let r=0;r<5;r++)add(r,c);};
 switch(String(pattern||'line')){
   case 'row':case 'line': row(2); break;
   case 'column': col(2); break;
   case 'col_b': col(0); break; case 'col_i': col(1); break; case 'col_n': col(2); break; case 'col_g': col(3); break; case 'col_o': col(4); break;
   case 'diagonal': for(let i=0;i<5;i++)add(i,i); break;
   case 'corners': [[0,0],[0,4],[4,0],[4,4]].forEach(([r,c])=>add(r,c)); break;
   case 'l_left': col(0);row(4);break;
   case 'l_right': col(4);row(4);break;
   case 'x': for(let i=0;i<5;i++){add(i,i);add(i,4-i);}break;
   case 'plus': row(2);col(2);break;
   case 't': row(0);col(2);break;
   case 'h': col(0);col(4);row(2);break;
   case 'u': col(0);col(4);row(4);break;
   case 'frame': for(let r=0;r<5;r++)for(let c=0;c<5;c++)if(r===0||r===4||c===0||c===4)add(r,c);break;
   case 'full': for(let r=0;r<5;r++)for(let c=0;c<5;c++)add(r,c);break;
   default: row(2);
 }
 return s;
}

function installCss(){
 if(document.getElementById('imaraPublicExperienceCss'))return;
 const s=document.createElement('style');s.id='imaraPublicExperienceCss';s.textContent=`
 .imara-public-prices{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:18px 0 4px}.imara-public-price-card{padding:11px 8px;border-radius:16px;background:rgba(8,14,27,.46);border:1px solid rgba(255,255,255,.10);text-align:center}.imara-public-price-card.promo{background:linear-gradient(145deg,rgba(255,211,84,.11),rgba(141,107,255,.10));border-color:rgba(255,211,84,.26)}.imara-public-price-card span{display:block;font-size:8px;font-weight:1000;letter-spacing:1px;color:#9eabc0;text-transform:uppercase}.imara-public-price-card strong{display:block;margin-top:4px;font-size:21px;line-height:1;color:#fff5d2}.imara-public-price-card small{display:block;margin-top:5px;font-size:9px;color:#aeb8ca}.imara-public-price-card.promo strong{color:#ffe07d}
 #imaraPublicGuide{margin-top:22px;padding:17px;border-radius:22px;background:linear-gradient(145deg,rgba(8,14,27,.58),rgba(141,107,255,.08));border:1px solid rgba(164,147,255,.22);text-align:left;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}
 .ipg-kicker{font-size:10px;font-weight:1000;letter-spacing:2px;color:#ffd96f;text-transform:uppercase}
 .ipg-title{font-size:20px;font-weight:1000;margin-top:5px;color:#fff3cf;line-height:1.05}
 .ipg-desc{font-size:12px;color:#bdc7db;line-height:1.35;margin-top:7px}
 .ipg-card{margin:14px auto 0;max-width:255px;padding:9px;border-radius:16px;background:#0b1220;border:1px solid rgba(255,255,255,.10);box-shadow:0 12px 30px rgba(0,0,0,.24)}
 .ipg-head{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-bottom:4px}
 .ipg-head b{height:25px;border-radius:7px;display:grid;place-items:center;font-size:12px;color:#fff;background:linear-gradient(135deg,rgba(255,91,143,.28),rgba(141,107,255,.28))}
 .ipg-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
 .ipg-cell{aspect-ratio:1;border-radius:7px;display:grid;place-items:center;background:#121c30;border:1px solid #2c3a58;color:#65738c;font-size:9px;font-weight:900;transition:all .3s ease}
 .ipg-cell.target{color:#271700;background:linear-gradient(145deg,#fff0a7,#e6ad2d);border-color:#ffd75c;box-shadow:0 0 14px rgba(255,205,74,.22);animation:ipgTarget 2.2s ease-in-out infinite alternate}
 .ipg-cell.free{font-size:8px}
 .ipg-note{margin-top:9px;text-align:center;font-size:10px;color:#8f9cb3}
 #imaraPublicLiveStatus{margin-top:12px;padding:12px 13px;border-radius:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);text-align:left;transition:border-color .25s ease,background .25s ease}
 #imaraPublicLiveStatus[data-type="claim"],#imaraPublicLiveStatus[data-type="countdown"]{background:rgba(255,191,71,.08);border-color:rgba(255,191,71,.3)}
 #imaraPublicLiveStatus[data-type="tie"]{background:rgba(141,107,255,.10);border-color:rgba(177,158,255,.34)}
 #imaraPublicLiveStatus[data-type="winner"]{background:rgba(43,212,167,.09);border-color:rgba(43,212,167,.32)}
 .ipl-label{font-size:9px;font-weight:1000;letter-spacing:1.5px;text-transform:uppercase;color:#98a6be}.ipl-main{font-size:13px;font-weight:900;color:#f7f3e9;margin-top:4px;line-height:1.25}.ipl-sub{font-size:10px;color:#aeb8ca;margin-top:4px;line-height:1.3}
 #publicBoard{cursor:zoom-in;transition:transform .2s ease,filter .2s ease,box-shadow .2s ease}
 #publicBoard:hover{transform:translateY(-2px);filter:brightness(1.035);box-shadow:0 0 0 1px rgba(255,216,104,.16),0 18px 42px rgba(0,0,0,.22)}
 #publicBoard::after{content:"🔍 Clic para ampliar tablero";grid-column:1/-1;display:block;margin-top:4px;text-align:center;font-size:10px;font-weight:900;letter-spacing:.8px;color:#8f9cb3;opacity:.82}
 #imaraBoardFocus{position:fixed;inset:0;z-index:2147483100;display:grid;place-items:center;padding:24px;background:rgba(4,7,14,.52);backdrop-filter:blur(16px) saturate(.7);-webkit-backdrop-filter:blur(16px) saturate(.7);opacity:0;pointer-events:none;transition:opacity .22s ease}
 #imaraBoardFocus.open{opacity:1;pointer-events:auto}
 .iboard-stage{width:min(1540px,96vw);max-height:94vh;overflow:auto;padding:22px;border-radius:30px;background:linear-gradient(160deg,rgba(17,25,43,.98),rgba(18,22,38,.98));border:1px solid rgba(255,216,104,.28);box-shadow:0 36px 110px rgba(0,0,0,.68);animation:iboardIn .32s cubic-bezier(.16,1.1,.3,1)}
 .iboard-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:15px}
 .iboard-kicker{font-size:11px;letter-spacing:2.4px;font-weight:1000;color:#ffe18b;text-transform:uppercase}
 .iboard-title{font-size:clamp(22px,3vw,38px);font-weight:1000;color:#fff3cf;margin-top:3px}
 .iboard-meta{font-size:11px;color:#aeb8ca;margin-top:4px}
 .iboard-close{border:1px solid rgba(255,255,255,.15);background:#1c2740;color:#fff;border-radius:999px;padding:9px 14px;font-weight:900}
 .iboard-clone{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:14px!important;align-items:start!important}
 .iboard-clone .letter-zone{padding:12px!important;border-radius:18px!important;background:rgba(7,12,22,.48)!important;border:1px solid rgba(91,111,151,.55)!important}
 .iboard-clone .letter-zone-title{padding:10px 12px!important;margin-bottom:10px!important;border-radius:12px!important}
 .iboard-clone .letter-zone-title strong{font-size:clamp(22px,2vw,32px)!important}
 .iboard-clone .letter-zone-title small{font-size:11px!important}
 .iboard-clone .letter-zone-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:7px!important}
 .iboard-clone .num{min-height:clamp(48px,4.7vw,72px)!important;aspect-ratio:auto!important;border-radius:12px!important;padding:5px!important;cursor:default!important}
 .iboard-clone .num .ball-letter{font-size:clamp(9px,.8vw,12px)!important}
 .iboard-clone .num .ball-number{font-size:clamp(17px,1.55vw,25px)!important;line-height:1.05!important}
 .iboard-clone .num.hit{box-shadow:0 0 0 2px rgba(255,255,255,.08),0 0 28px rgba(255,91,143,.28)!important}
 .iboard-hint{text-align:center;margin-top:13px;font-size:11px;color:#b4bfd2}
 @keyframes iboardIn{from{opacity:0;transform:scale(.8) translateY(18px)}to{opacity:1;transform:none}}
 @media(max-width:980px){.iboard-stage{padding:15px}.iboard-clone{grid-template-columns:repeat(2,minmax(0,1fr))!important}.iboard-clone .num{min-height:52px!important}}
 @media(max-width:620px){.iboard-clone{grid-template-columns:1fr!important}.iboard-top{align-items:flex-start}.iboard-stage{max-height:92vh}}
 @keyframes ipgTarget{from{filter:brightness(.94);box-shadow:0 0 8px rgba(255,205,74,.12)}to{filter:brightness(1.07);box-shadow:0 0 20px rgba(255,205,74,.32)}}@keyframes ibfIn{from{opacity:0;transform:scale(.72) translateY(15px)}to{opacity:1;transform:none}}
 @media(max-width:1100px){#imaraPublicGuide{max-width:620px;margin:20px auto 0}.ipg-card{max-width:300px}}
 @media(prefers-reduced-motion:reduce){.ipg-cell.target,.iboard-stage{animation:none!important}}
 `;document.head.appendChild(s);
}

function moneyPublic(v){
 const n=Math.max(0,Number(v)||0);
 try{return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n).replace('COP','$');}catch(_){return '$ '+n.toLocaleString('es-CO');}
}
function ensurePublicPricing(){
 const hero=VIEW.querySelector('.public-hero');if(!hero)return;
 const oldPrice=document.getElementById('publicPrice');
 if(oldPrice){oldPrice.style.display='none';const lab=oldPrice.nextElementSibling;if(lab&&String(lab.textContent||'').toLowerCase().includes('por cart'))lab.style.display='none';}
 let box=document.getElementById('imaraPublicPricing');
 if(!box){
   box=document.createElement('div');box.id='imaraPublicPricing';box.className='imara-public-prices';
   const anchor=hero.querySelector('[style*="margin-top:16px"]')||document.getElementById('imaraPublicGuide');
   if(anchor)hero.insertBefore(box,anchor);else hero.appendChild(box);
 }
 const single=Number(state?.settings?.publicSinglePrice||state?.settings?.price||30000);
 const combo=Number(state?.settings?.publicComboPrice||50000);
 box.innerHTML=`<div class="imara-public-price-card"><span>Individual</span><strong>${esc(moneyPublic(single))}</strong><small>1 cartón</small></div><div class="imara-public-price-card promo"><span>Promo</span><strong>${esc(moneyPublic(combo))}</strong><small>2 cartones</small></div>`;
}
function guideRoot(){
 const hero=VIEW.querySelector('.public-hero');if(!hero)return null;
 let root=document.getElementById('imaraPublicGuide');
 if(!root){root=document.createElement('section');root.id='imaraPublicGuide';hero.appendChild(root);}
 return root;
}
function liveRoot(){
 const guide=guideRoot();if(!guide)return null;
 let el=document.getElementById('imaraPublicLiveStatus');
 if(!el){el=document.createElement('div');el.id='imaraPublicLiveStatus';guide.insertAdjacentElement('afterend',el);}
 return el;
}
function renderGuide(round){
 const root=guideRoot();if(!root)return;
 const pattern=String(round?.pattern||'line'),sig=pattern+'|'+String(round?.name||'');
 if(sig===lastGuideSig)return;lastGuideSig=sig;
 const target=targetCells(pattern),heads=['B','I','N','G','O'];
 const cells=[];
 for(let r=0;r<5;r++)for(let c=0;c<5;c++){
   const key=r+'-'+c,free=r===2&&c===2;
   cells.push(`<div class="ipg-cell ${target.has(key)?'target ':''}${free?'free':''}">${free?'LIBRE':'•'}</div>`);
 }
 root.innerHTML=`<div class="ipg-kicker">🎯 Así ganas esta ronda</div><div class="ipg-title">${esc(LABELS[pattern]||pattern)}</div><div class="ipg-desc">${esc(HELP[pattern]||'Completa la figura resaltada para ganar.')}</div><div class="ipg-card"><div class="ipg-head">${heads.map(x=>'<b>'+x+'</b>').join('')}</div><div class="ipg-grid">${cells.join('')}</div></div><div class="ipg-note">La figura se actualiza automáticamente con cada ronda.</div>`;
 liveRoot();
}
function displayName(c){return String(c?.buyer_alias||c?.buyer||c?.card_id||'Participante');}
function renderLive(show,round){
 const el=liveRoot();if(!el)return;
 const type=String(show?.type||'idle'),cands=Array.isArray(show?.candidates)?show.candidates:[],w=show?.winner||{};
 let kind='idle',label='ESTADO EN VIVO',main='🎱 Ronda en juego',sub='Cuando haya un BINGO, aquí verás su estado.';
 if(type==='bingo_live_claim'){
   kind='claim';label='📣 BINGO SOLICITADO';
   main=cands.length===1?displayName(cands[0]):`${cands.length} solicitudes de BINGO`;
   sub=cands.length===1?`${cands[0]?.card_id||''} · Validación en curso`:'Los presentadores están revisando los cartones.';
 }else if(type==='bingo_countdown'){
   kind='countdown';label='🎙️ VALIDACIÓN OFICIAL';main='BINGO a la 1, 2 y 3…';sub='El resultado está siendo confirmado.';
 }else if(type==='tie'){
   kind='tie';label='🔥 DESEMPATE';main=`${cands.length||2} BINGOS válidos`;sub='Los cartones válidos pasan a la ruleta de desempate.';
 }else if(type==='winner'){
   kind='winner';label='🏆 GANADOR CONFIRMADO';main=displayName(w);
   const raw=String(w.prize||round?.prize||''),pt=String(w.prize_title||round?.prizeTitle||'').trim()||raw.split(' · ')[1]||raw;
   sub=[w.card_id,pt&&('🎁 '+pt)].filter(Boolean).join(' · ');
 }else if(String(round?.status||'')==='closed'){
   kind='idle';main='⏸️ Ronda cerrada';sub='Esperando la siguiente ronda.';
 }
 const sig=[kind,label,main,sub].join('|');if(sig===lastStatusSig)return;lastStatusSig=sig;
 el.dataset.type=kind;el.innerHTML=`<div class="ipl-label">${esc(label)}</div><div class="ipl-main">${esc(main)}</div><div class="ipl-sub">${esc(sub)}</div>`;
}

function boardFocusOverlay(){
 let o=document.getElementById('imaraBoardFocus');if(o)return o;
 o=document.createElement('div');o.id='imaraBoardFocus';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Tablero de balotas ampliado');
 o.innerHTML='<div class="iboard-stage"><div class="iboard-top"><div><div class="iboard-kicker">🔎 TABLERO AMPLIADO</div><div class="iboard-title">Balotas de la ronda</div><div class="iboard-meta"></div></div><button type="button" class="iboard-close">✕ Cerrar</button></div><div class="iboard-clone"></div><div class="iboard-hint">Los números resaltados son los que ya salieron · Clic fuera del tablero o Esc para volver</div></div>';
 document.body.appendChild(o);
 o.addEventListener('click',e=>{if(e.target===o||e.target.closest('.iboard-close'))closeBoardFocus();});
 return o;
}
function openBoardFocus(){
 const source=document.getElementById('publicBoard');if(!source)return;
 const o=boardFocusOverlay(),clone=o.querySelector('.iboard-clone');
 clone.innerHTML=source.innerHTML;
 const round=latest?.game?.round||state?.round||{},drawn=latest?.game?.drawn||state?.drawn||[];
 o.querySelector('.iboard-title').textContent=round.name||'Ronda actual';
 o.querySelector('.iboard-meta').textContent=(LABELS[round.pattern]||round.pattern||'')+' · '+(Array.isArray(drawn)?drawn.length:0)+' balotas llamadas';
 requestAnimationFrame(()=>o.classList.add('open'));
}
function closeBoardFocus(){document.getElementById('imaraBoardFocus')?.classList.remove('open');}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeBoardFocus();});
VIEW.addEventListener('click',e=>{
 const board=e.target.closest?.('#publicBoard');
 if(board){e.preventDefault();openBoardFocus();}
});

function apply(data){
 latest=data||latest||{};
 const game=latest?.game||{},round=game.round||state?.round||{},show=game.show_state||{type:'idle'};
 ensurePublicPricing();renderGuide(round);renderLive(show,round);
}

installCss();
ensurePublicPricing();
renderGuide(state?.round||{});
renderLive({type:'idle'},state?.round||{});
window.addEventListener('imara-public-game-state',e=>apply(e.detail||{}));
window.addEventListener('imara-game-realtime',e=>apply(e.detail||{}));
setInterval(()=>{if(!location.hash.startsWith('#mobile='))apply(latest||{game:{round:state?.round||{},show_state:{type:'idle'}}});},2500);
})();