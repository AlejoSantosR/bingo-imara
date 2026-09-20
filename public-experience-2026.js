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
 #publicBoard .num.hit{cursor:zoom-in;position:relative}
 #publicBoard .num.hit:hover{transform:translateY(-2px) scale(1.05);filter:brightness(1.14);z-index:2}
 #publicLastBall:not(:empty){cursor:zoom-in}
 #imaraBallFocus{position:fixed;inset:0;z-index:2147483100;display:grid;place-items:center;padding:24px;background:rgba(4,7,14,.46);backdrop-filter:blur(15px) saturate(.72);-webkit-backdrop-filter:blur(15px) saturate(.72);opacity:0;pointer-events:none;transition:opacity .22s ease}
 #imaraBallFocus.open{opacity:1;pointer-events:auto}
 .ibf-stage{position:relative;width:min(520px,88vw);display:grid;justify-items:center;gap:14px;animation:ibfIn .35s cubic-bezier(.16,1.15,.3,1)}
 .ibf-kicker{font-size:11px;letter-spacing:3px;font-weight:1000;color:#ffe18b;text-transform:uppercase;text-shadow:0 3px 12px #000}
 .ibf-ball{width:min(320px,68vw);aspect-ratio:1;border-radius:50%;display:grid;place-items:center;position:relative;background:radial-gradient(circle at 32% 25%,#fff,#edf0f8 47%,#aab6cf 75%,#737f99);color:#10182a;box-shadow:0 34px 90px rgba(0,0,0,.55),inset 0 -26px 46px rgba(0,0,0,.18),0 0 0 9px rgba(255,255,255,.05)}
 .ibf-ball::after{content:"";position:absolute;left:20%;top:13%;width:29%;height:15%;border-radius:50%;background:rgba(255,255,255,.66);filter:blur(2px);transform:rotate(-18deg)}
 .ibf-code{position:relative;z-index:1;text-align:center}.ibf-letter{display:block;font-size:clamp(28px,6vw,48px);font-weight:1000;color:#8d6bff;line-height:1}.ibf-number{display:block;font-size:clamp(92px,20vw,150px);font-weight:1000;line-height:.83;letter-spacing:-7px}
 .ibf-hint{font-size:11px;color:#d1d7e4;text-align:center}.ibf-close{border:1px solid rgba(255,255,255,.16);background:rgba(15,23,40,.78);color:#fff;padding:8px 13px;border-radius:999px;font-size:11px;font-weight:800}
 @keyframes ipgTarget{from{filter:brightness(.94);box-shadow:0 0 8px rgba(255,205,74,.12)}to{filter:brightness(1.07);box-shadow:0 0 20px rgba(255,205,74,.32)}}@keyframes ibfIn{from{opacity:0;transform:scale(.72) translateY(15px)}to{opacity:1;transform:none}}
 @media(max-width:1100px){#imaraPublicGuide{max-width:620px;margin:20px auto 0}.ipg-card{max-width:300px}}
 @media(prefers-reduced-motion:reduce){.ipg-cell.target,.ibf-stage{animation:none!important}}
 `;document.head.appendChild(s);
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

function ballLetter(n,max){
 n=Number(n);max=Number(max)||99;if(!n)return '';
 if(max===75){return ['B','I','N','G','O'][Math.min(4,Math.floor((n-1)/15))];}
 const size=Math.ceil(max/5);return ['B','I','N','G','O'][Math.min(4,Math.floor((n-1)/size))];
}
function focusOverlay(){
 let o=document.getElementById('imaraBallFocus');if(o)return o;
 o=document.createElement('div');o.id='imaraBallFocus';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Balota ampliada');
 o.innerHTML='<div class="ibf-stage"><div class="ibf-kicker">BALOTA LLAMADA</div><div class="ibf-ball"><div class="ibf-code"><span class="ibf-letter"></span><span class="ibf-number"></span></div></div><div class="ibf-hint">Clic fuera de la balota o presiona Esc para volver</div><button type="button" class="ibf-close">Cerrar</button></div>';
 document.body.appendChild(o);
 o.addEventListener('click',e=>{if(e.target===o||e.target.closest('.ibf-close'))closeFocus();});
 return o;
}
function openFocus(n){
 n=Number(String(n).replace(/\D/g,''));if(!n)return;
 const o=focusOverlay(),max=latest?.game?.round?.ballMax||state?.settings?.ballMax||99;
 o.querySelector('.ibf-letter').textContent=ballLetter(n,max);
 o.querySelector('.ibf-number').textContent=String(n).padStart(2,'0');
 requestAnimationFrame(()=>o.classList.add('open'));
}
function closeFocus(){document.getElementById('imaraBallFocus')?.classList.remove('open');}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeFocus();});
VIEW.addEventListener('click',e=>{
 const hit=e.target.closest?.('#publicBoard .num.hit');
 if(hit){e.preventDefault();openFocus(hit.textContent);return;}
 const last=e.target.closest?.('#publicLastBall');
 if(last&&String(last.textContent||'').trim()!=='—'){e.preventDefault();openFocus(last.textContent);}
});

function apply(data){
 latest=data||latest||{};
 const game=latest?.game||{},round=game.round||state?.round||{},show=game.show_state||{type:'idle'};
 renderGuide(round);renderLive(show,round);
}

installCss();
renderGuide(state?.round||{});
renderLive({type:'idle'},state?.round||{});
window.addEventListener('imara-public-game-state',e=>apply(e.detail||{}));
window.addEventListener('imara-game-realtime',e=>apply(e.detail||{}));
setInterval(()=>{if(!location.hash.startsWith('#mobile='))apply(latest||{game:{round:state?.round||{},show_state:{type:'idle'}}});},2500);
})();