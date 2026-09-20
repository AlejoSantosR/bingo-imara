
(function(){
'use strict';
if(window.__imaraPrizeExperience2026)return;window.__imaraPrizeExperience2026=true;

const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-prizes';
const SESSION='imaraPrivateSessionV1';
const IS_PUBLIC=location.hash.startsWith('#public');
const IS_MOBILE=location.hash.startsWith('#mobile=');
let booted=false,lastPublicSig='',latestPublic=null;

const esc=s=>typeof escapeHtml==='function'?escapeHtml(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
function token(){return sessionStorage.getItem(SESSION)||'';}
async function api(action,payload={}){
  const t=token();if(!t)throw new Error('Sesión Admin no disponible.');
  const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),15000);
  try{
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'No fue posible sincronizar premios.');return d;
  }finally{clearTimeout(tm);}
}
function prizeText(p,index){
  const ord=typeof ordinalPrizeLabel==='function'?ordinalPrizeLabel(index):`Premio ${index+1}`;
  return [ord,p?.title,p?.description].filter(Boolean).join(' · ');
}
function normalizeCloud(p){
  return {id:String(p.id||''),title:String(p.title||''),description:String(p.description||''),image_url:String(p.image_url||''),image:String(p.image_url||''),sort_order:Number(p.sort_order)||0};
}
async function migrateLocalPrize(p){
  const x={...p};
  const img=String(x.image||x.image_url||'');
  if(img.startsWith('data:image/')){
    const d=await api('upload',{id:x.id,data_url:img});
    x.image_url=d.image_url||'';x.image=x.image_url||img;
  }else if(img){
    x.image_url=img;x.image=img;
  }
  return x;
}
async function syncCatalog(){
  if(IS_PUBLIC||IS_MOBILE||!token()||!isAdmin())return false;
  const d=await api('list'),cloud=(d.prizes||[]).map(normalizeCloud);
  const local=Array.isArray(state?.prizes)?state.prizes.filter(p=>String(p?.title||'').trim()):[];
  let merged=[];
  if(!cloud.length&&local.length){
    for(const p of local)merged.push(await migrateLocalPrize(p));
    await api('save',{prizes:merged.map((p,i)=>({id:p.id,title:p.title,description:p.description,image_url:p.image_url||p.image||'',sort_order:i}))});
  }else{
    const lm=new Map(local.map(p=>[String(p.id),p]));
    merged=cloud.map(p=>{const l=lm.get(p.id);return {...p,image:p.image_url||l?.image||''};});
    for(const p of local){
      if(merged.some(x=>x.id===String(p.id)))continue;
      merged.push(await migrateLocalPrize(p));
    }
    if(merged.length!==cloud.length){
      await api('save',{prizes:merged.map((p,i)=>({id:p.id,title:p.title,description:p.description,image_url:p.image_url||p.image||'',sort_order:i}))});
    }
  }
  state.prizes=merged.map((p,i)=>({...p,sort_order:i,image:p.image_url||p.image||''}));
  const current=state.prizes.find(p=>p.id===String(state.round?.prizeId||''));
  if(current){
    state.round.prizeTitle=current.title||'';
    state.round.prizeDescription=current.description||'';
    state.round.prizeImage=current.image_url||current.image||'';
    state.round.prize=prizeText(current,state.prizes.indexOf(current));
    state.round.reveal=true;
  }
  saveState?.();
  renderPrizeConfig?.();
  ensureRoundSelector();
  window.dispatchEvent(new CustomEvent('imara-prizes-cloud-ready',{detail:{prizes:state.prizes}}));
  return true;
}

function ensureRoundSelector(){
  if(IS_PUBLIC||IS_MOBILE||typeof state==='undefined')return;
  const input=document.getElementById('roundPrize');if(!input)return;
  input.closest('label')?.classList.add('imara-prize-manual-hidden');
  const reveal=document.getElementById('prizeReveal');reveal?.closest('label')?.classList.add('imara-prize-manual-hidden');
  let wrap=document.getElementById('roundPrizeSelectorWrap');
  if(!wrap){
    wrap=document.createElement('div');wrap.id='roundPrizeSelectorWrap';wrap.className='round-prize-select-wrap full';
    input.closest('label')?.before(wrap);
  }
  const prizes=Array.isArray(state.prizes)?state.prizes:[];
  const selected=String(state.round?.prizeId||'');
  wrap.innerHTML=`<label style="display:grid;gap:7px;color:var(--muted);font-size:12px"><strong style="color:var(--text);font-size:14px">🎁 Premio de esta ronda</strong><select class="input" id="roundPrizeSelect"><option value="">— Selecciona un premio —</option>${prizes.map((p,i)=>`<option value="${esc(p.id)}" ${String(p.id)===selected?'selected':''}>${esc((typeof ordinalPrizeLabel==='function'?ordinalPrizeLabel(i):`Premio ${i+1}`)+(p.title?' · '+p.title:''))}</option>`).join('')}</select></label><div class="round-prize-preview" id="roundPrizePreview"></div>`;
  const sel=wrap.querySelector('#roundPrizeSelect'),prev=wrap.querySelector('#roundPrizePreview');
  const paint=()=>{
    const p=prizes.find(x=>String(x.id)===String(sel.value));
    if(!p){prev.innerHTML='<span class="muted">Selecciona el premio que corresponde a esta ronda.</span>';return;}
    const img=p.image_url||p.image||'';
    prev.innerHTML=`<div class="imara-round-prize-preview">${img?`<img src="${esc(img)}" alt="">`:'<div class="imara-round-prize-fallback">🎁</div>'}<div><strong>${esc(p.title||'Premio')}</strong>${p.description?`<small>${esc(p.description)}</small>`:''}<span>Visible en cartones y pantalla pública</span></div></div>`;
  };
  sel.onchange=()=>{
    const p=prizes.find(x=>String(x.id)===String(sel.value));
    if(!p){paint();return;}
    window.usePrizeInRound?.(p.id);
    state.round.prizeImage=p.image_url||p.image||'';
    state.round.reveal=true;
    input.value=state.round.prize||prizeText(p,prizes.indexOf(p));
    if(reveal)reveal.value='yes';
    saveState?.();paint();
  };
  paint();
}


function installCss(){
  if(document.getElementById('imaraPrizeExperienceCss'))return;
  const s=document.createElement('style');s.id='imaraPrizeExperienceCss';s.textContent=`
    .imara-prize-manual-hidden{display:none!important}
    .round-prize-select-wrap{margin-top:10px;padding:14px;border-radius:18px;background:linear-gradient(145deg,rgba(255,205,73,.09),rgba(141,107,255,.07));border:1px solid rgba(255,205,73,.25)}
    .round-prize-preview{margin-top:10px}.imara-round-prize-preview{display:grid;grid-template-columns:82px 1fr;gap:12px;align-items:center}.imara-round-prize-preview img,.imara-round-prize-fallback{width:82px;height:82px;border-radius:16px;object-fit:cover;background:#19150d;border:1px solid rgba(255,215,105,.32);box-shadow:0 12px 28px #0005}.imara-round-prize-fallback{display:grid;place-items:center;font-size:34px}.imara-round-prize-preview strong{display:block;color:#ffe49a;font-size:17px}.imara-round-prize-preview small{display:block;margin-top:4px;color:var(--muted)}.imara-round-prize-preview span{display:block;margin-top:7px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#b9f7dc}

    #view-public .public{width:min(1800px,100%);grid-template-columns:minmax(270px,300px) minmax(560px,1fr) minmax(250px,290px);gap:18px;align-items:start}
    #view-public .public-hero,#view-public .public-main,#imaraPrizeHistory{min-width:0}
    #imaraPrizeExperience{grid-column:1/-1;margin:0 0 18px;min-width:0}

    .imara-prize-hero{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(210px,31%) 1fr;gap:24px;align-items:center;min-height:270px;padding:21px;border-radius:28px;border:1px solid rgba(255,213,91,.42);background:radial-gradient(circle at 16% 30%,rgba(255,211,80,.18),transparent 30%),linear-gradient(135deg,rgba(34,27,18,.98),rgba(35,24,52,.98));box-shadow:0 24px 70px rgba(0,0,0,.34),0 0 60px rgba(255,197,50,.08)}
    .imara-prize-hero::after{content:"";position:absolute;inset:-100% -25%;background:linear-gradient(110deg,transparent 43%,rgba(255,248,210,.12) 50%,transparent 57%);animation:imaraPrizeSweep 5.8s ease-in-out infinite;pointer-events:none}
    .imara-prize-media{position:relative;z-index:1;display:grid;place-items:center;height:225px;border-radius:22px;background:radial-gradient(circle at 50% 42%,rgba(255,225,120,.18),rgba(0,0,0,.22));border:1px solid rgba(255,218,101,.25);overflow:hidden}.imara-prize-media img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 18px 24px rgba(0,0,0,.28));animation:imaraPrizeFloat 3.8s ease-in-out infinite}.imara-prize-media .fallback{font-size:80px;animation:imaraPrizeFloat 3.8s ease-in-out infinite}
    .imara-prize-copy{position:relative;z-index:1;text-align:left}.imara-prize-kicker{font-size:10px;font-weight:1000;letter-spacing:2.6px;color:#ffd765}.imara-prize-title{margin:8px 0 8px;font-size:clamp(32px,4.2vw,58px);line-height:.96;font-weight:1000;color:#fff5cf;text-shadow:0 8px 30px rgba(0,0,0,.35)}.imara-prize-desc{max-width:760px;font-size:clamp(13px,1.5vw,19px);line-height:1.35;color:#dcd5c6}.imara-prize-round{display:inline-flex;margin-top:13px;padding:7px 11px;border-radius:999px;background:rgba(255,211,84,.1);border:1px solid rgba(255,211,84,.26);font-size:10px;font-weight:900;color:#ffe89b}

    #imaraPrizeHistory{position:sticky;top:20px;align-self:start;height:calc(100vh - 40px);min-height:680px;padding:16px;border-radius:28px;background:linear-gradient(160deg,rgba(23,30,50,.98),rgba(26,24,48,.98));border:1px solid var(--line);box-shadow:0 18px 50px rgba(0,0,0,.28);overflow:hidden}
    .iph-head{padding:3px 3px 12px;border-bottom:1px solid rgba(255,255,255,.08)}.iph-head strong{display:block;font-size:17px;color:#ffe6a2}.iph-head span{display:block;margin-top:4px;color:#94a0b7;font-size:10px;line-height:1.35}
    .iph-viewport{position:relative;height:calc(100% - 64px);overflow:hidden;margin-top:12px;mask-image:linear-gradient(180deg,transparent,#000 3%,#000 97%,transparent)}
    .iph-track{display:flex;flex-direction:column;gap:10px;will-change:transform;padding:8px 1px}
    .iph-track.scroll{animation:imaraPrizeVertical var(--iph-time,40s) linear infinite}.iph-viewport:hover .iph-track{animation-play-state:paused}
    .iph-slot{min-height:135px;padding:11px;border-radius:18px;border:1px solid rgba(255,255,255,.10);background:linear-gradient(145deg,rgba(255,255,255,.05),rgba(141,107,255,.045));display:grid;grid-template-columns:74px 1fr;gap:10px;align-items:center}
    .iph-slot.delivered{border-color:rgba(255,215,101,.25);background:linear-gradient(145deg,rgba(255,215,101,.08),rgba(43,212,167,.055))}
    .iph-slot.current{border-color:rgba(141,107,255,.38);box-shadow:inset 0 0 22px rgba(141,107,255,.07)}
    .iph-img,.iph-empty-icon{width:74px;height:74px;border-radius:14px;background:#0d1424;border:1px solid rgba(255,255,255,.08);object-fit:cover}.iph-empty-icon{display:grid;place-items:center;font-size:28px;opacity:.72}
    .iph-round{font-size:9px;letter-spacing:1.2px;font-weight:1000;color:#9aa7be;text-transform:uppercase}.iph-prize{display:block;margin-top:3px;font-size:12px;line-height:1.16;color:#ffe49a;font-weight:900}.iph-person{display:block;margin-top:5px;font-size:13px;line-height:1.15;color:#fff;font-weight:1000}.iph-card{display:block;margin-top:3px;font-size:10px;color:#aeb8ca}.iph-tag{display:inline-flex;margin-top:6px;padding:3px 6px;border-radius:999px;font-size:8px;font-weight:1000;background:rgba(43,212,167,.12);color:#8ef0d5}.iph-empty-copy{font-size:11px;line-height:1.35;color:#c0c8d7;margin-top:5px}.iph-wait{display:inline-flex;margin-top:6px;padding:3px 6px;border-radius:999px;font-size:8px;font-weight:1000;background:rgba(141,107,255,.13);color:#c8bcff}

    @keyframes imaraPrizeSweep{0%,58%{transform:translateX(-55%)}85%,100%{transform:translateX(55%)}}@keyframes imaraPrizeFloat{0%,100%{transform:translateY(0) scale(.98)}50%{transform:translateY(-7px) scale(1.01)}}@keyframes imaraPrizeVertical{0%,8%{transform:translateY(0)}92%,100%{transform:translateY(calc(-50% - 5px))}}
    @media(max-width:1180px){#view-public .public{grid-template-columns:minmax(260px,300px) minmax(0,1fr)}#imaraPrizeHistory{position:relative;top:auto;grid-column:1/-1;height:auto;min-height:0}.iph-viewport{height:auto;overflow:visible;mask-image:none}.iph-track,.iph-track.scroll{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));animation:none!important}.iph-slot{min-height:120px}}
    @media(max-width:900px){#view-public .public{grid-template-columns:1fr}.imara-prize-hero{grid-template-columns:180px 1fr;min-height:230px}.imara-prize-media{height:190px}.imara-prize-title{font-size:clamp(28px,6vw,48px)}#imaraPrizeHistory{grid-column:auto}}
    @media(max-width:620px){.imara-prize-hero{grid-template-columns:1fr;text-align:center;padding:18px}.imara-prize-media{height:180px}.imara-prize-copy{text-align:center}.imara-prize-desc{font-size:14px}.iph-track,.iph-track.scroll{grid-template-columns:1fr}}
    @media(prefers-reduced-motion:reduce){.imara-prize-hero::after,.imara-prize-media img,.imara-prize-media .fallback,.iph-track.scroll{animation:none!important}}
  `;document.head.appendChild(s);
}

function ensurePublicUi(){
  if(IS_MOBILE)return null;
  const main=document.querySelector('#view-public .public-main');if(!main)return null;
  let root=document.getElementById('imaraPrizeExperience');
  if(!root){root=document.createElement('section');root.id='imaraPrizeExperience';main.prepend(root);}
  return root;
}
function ensureHistoryUi(){
  if(IS_MOBILE)return null;
  const layout=document.querySelector('#view-public .public');if(!layout)return null;
  let root=document.getElementById('imaraPrizeHistory');
  if(!root){root=document.createElement('aside');root.id='imaraPrizeHistory';layout.appendChild(root);}
  return root;
}
function winnerPrize(w){
  const raw=String(w?.prize||'');
  const title=String(w?.prize_title||w?.prizeTitle||'').trim()||raw.split(' · ')[1]||'Premio entregado';
  return {title,description:String(w?.prize_description||w?.prizeDescription||''),image:String(w?.prize_image||w?.prizeImage||'')};
}
function localNextPrize(){
  const prizes=Array.isArray(state?.prizes)?state.prizes:[],wins=Array.isArray(state?.winners)?state.winners:[];
  const usedIds=new Set(wins.map(w=>String(w.prizeId||w.prize_id||'')).filter(Boolean));
  const usedText=wins.map(w=>String(w.prize||'').toLowerCase());
  const p=prizes.find(x=>x?.title&&!usedIds.has(String(x.id))&&!usedText.some(t=>t.includes(String(x.title).toLowerCase())));
  return p?{id:p.id,title:p.title,description:p.description||'',image_url:p.image_url||p.image||''}:null;
}
const MOTIVATION=[
  'Este premio puede ser tuyo ✨',
  'La próxima celebración puede llevar tu nombre 🎉',
  'Sigue atento: tu cartón puede ser el siguiente 🍀',
  'Cada balota te acerca un poquito más 🏆',
  'Tu momento de gritar ¡BINGO! puede estar cerca 💫',
  'La suerte sigue girando a tu favor 🌟',
  'No pierdas de vista tu cartón: aquí puede estar tu premio 🎁',
  'Una balota puede cambiarlo todo. ¡Vamos! 🔥'
];
function publicCatalog(data){
  const cloud=Array.isArray(data?.prizes)?data.prizes:[];
  if(cloud.length)return cloud.map(p=>({id:String(p.id||''),title:String(p.title||''),description:String(p.description||''),image_url:String(p.image_url||''),sort_order:Number(p.sort_order)||0}));
  return (Array.isArray(state?.prizes)?state.prizes:[]).map((p,i)=>({id:String(p.id||''),title:String(p.title||''),description:String(p.description||''),image_url:String(p.image_url||p.image||''),sort_order:i}));
}
function matchWinnerForPrize(prize,wins){
  const id=String(prize?.id||''),title=String(prize?.title||'').trim().toLowerCase();
  return (wins||[]).find(w=>String(w?.prize_id||w?.prizeId||'')===id)||(wins||[]).find(w=>{
    const wt=String(w?.prize_title||w?.prizeTitle||'').trim().toLowerCase();
    const raw=String(w?.prize||'').toLowerCase();
    return title&&(wt===title||raw.includes(title));
  })||null;
}
function historySlot(prize,index,winner,currentPrizeId){
  const roundLabel=`Ronda ${index+1}`;
  if(winner){
    const p=winnerPrize(winner),img=winner.prize_image||winner.prizeImage||prize.image_url||p.image||'';
    return `<article class="iph-slot delivered">${img?`<img class="iph-img" src="${esc(img)}" alt="">`:'<div class="iph-empty-icon">🏆</div>'}<div><div class="iph-round">${esc(winner.round_name||winner.roundName||roundLabel)}</div><span class="iph-prize">${esc(p.title||prize.title||'Premio')}</span><span class="iph-person">${esc(winner.buyer_alias||winner.buyer||'Ganador')}</span><span class="iph-card">${esc(winner.card_id||winner.cardId||'')}</span><span class="iph-tag">✓ ENTREGADO</span></div></article>`;
  }
  const current=String(prize.id||'')===String(currentPrizeId||'');
  return `<article class="iph-slot ${current?'current':''}"><div class="iph-empty-icon">${current?'🎁':'✨'}</div><div><div class="iph-round">${roundLabel} · ${current?'PREMIO EN JUEGO':'SIN GANADOR'}</div><span class="iph-prize">${current?esc(prize.title||'Premio de la ronda'):'Esperando ganador'}</span><div class="iph-empty-copy">${esc(MOTIVATION[index%MOTIVATION.length])}</div><span class="iph-wait">${current?'EN JUEGO':'POR DESCUBRIR'}</span></div></article>`;
}
function renderPublic(data){
  if(IS_MOBILE)return;
  latestPublic=data||latestPublic||{};
  const root=ensurePublicUi(),history=ensureHistoryUi();if(!root||!history)return;
  const g=latestPublic?.game||{},round=g.round||state?.round||{},show=g.show_state||{},wins=Array.isArray(latestPublic?.winners)?latestPublic.winners:[];
  const catalog=publicCatalog(latestPublic);
  const next=latestPublic?.next_prize||localNextPrize();
  const delivered=wins.filter(w=>String(w?.prize||w?.prize_title||w?.prizeTitle||'').trim()).slice(0,50);
  const currentRoundHasWinner=delivered.some(w=>String(w?.round_name||w?.roundName||'')===String(round.name||''));
  const useNext=(show.type==='winner'||currentRoundHasWinner)&&next;
  const hero=useNext?{title:next.title||'Próximo premio',description:next.description||'',image:next.image_url||'',kicker:'✨ PRÓXIMO PREMIO',round:'La siguiente ronda'}:{title:round.prizeTitle||String(round.prize||'').split(' · ')[1]||round.prize||'Premio de la ronda',description:round.prizeDescription||'',image:round.prizeImage||'',kicker:'🎁 PREMIO DE ESTA RONDA',round:round.name||'Ronda actual'};
  const currentPrizeId=useNext?String(next?.id||''):String(round.prizeId||'');
  const slotSig=catalog.map((p,i)=>{const w=matchWinnerForPrize(p,delivered);return [p.id,p.title,w?.card_id||w?.cardId||'',w?.buyer_alias||w?.buyer||''];});
  const sig=JSON.stringify([hero.title,hero.description,hero.image,hero.kicker,hero.round,currentPrizeId,slotSig]);
  if(sig===lastPublicSig)return;lastPublicSig=sig;

  const image=hero.image?`<img src="${esc(hero.image)}" alt="${esc(hero.title)}">`:'<div class="fallback">🎁</div>';
  root.innerHTML=`<div class="imara-prize-hero"><div class="imara-prize-media">${image}</div><div class="imara-prize-copy"><div class="imara-prize-kicker">${esc(hero.kicker)}</div><div class="imara-prize-title">${esc(hero.title)}</div>${hero.description?`<div class="imara-prize-desc">${esc(hero.description)}</div>`:''}<div class="imara-prize-round">${esc(hero.round)}</div></div></div>`;

  const slots=(catalog.length?catalog:Array.from({length:5},(_,i)=>({id:'placeholder-'+i,title:'',image_url:'',sort_order:i}))).map((p,i)=>historySlot(p,i,matchWinnerForPrize(p,delivered),currentPrizeId));
  const scroll=slots.length>4;
  const content=slots.join('');
  history.innerHTML=`<div class="iph-head"><strong>🏆 Rondas & premios</strong><span>Cada casilla se completa cuando confirmamos un ganador.</span></div><div class="iph-viewport"><div class="iph-track ${scroll?'scroll':''}" style="--iph-time:${Math.max(34,slots.length*9)}s">${content}${scroll?content:''}</div></div>`;
}
function startAdminBootstrap(){
  if(IS_PUBLIC||IS_MOBILE||booted)return;
  const tick=async()=>{
    if(booted)return;
    if(!token()||!isAdmin()){setTimeout(tick,600);return;}
    booted=true;
    try{await syncCatalog();}catch(e){console.warn('Premios nube:',e.message||e);}
    ensureRoundSelector();
  };
  tick();
}

installCss();
ensureRoundSelector();
startAdminBootstrap();
window.addEventListener('imara-prizes-updated',()=>{ensureRoundSelector();renderPublic({game:{round:state?.round||{},show_state:{type:'idle'}},winners:state?.winners||[],next_prize:localNextPrize()});});
window.addEventListener('imara-game-realtime',e=>{ensureRoundSelector();setTimeout(()=>renderPublic({game:{round:state?.round||e.detail?.game?.round||{},show_state:e.detail?.game?.show_state||{type:'idle'}},winners:state?.winners||[],next_prize:localNextPrize()}),0);});
window.addEventListener('imara-public-game-state',e=>renderPublic(e.detail||{}));
if(!IS_MOBILE){ensurePublicUi();setTimeout(()=>renderPublic({game:{round:state?.round||{},show_state:{type:'idle'}},winners:state?.winners||[],next_prize:localNextPrize()}),80);}
})();
