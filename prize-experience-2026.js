
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
    #imaraPrizeExperience{grid-column:1/-1;margin:0 0 18px;min-width:0}
    .imara-prize-hero{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(220px,32%) 1fr;gap:26px;align-items:center;min-height:300px;padding:24px;border-radius:30px;border:1px solid rgba(255,213,91,.42);background:radial-gradient(circle at 16% 30%,rgba(255,211,80,.18),transparent 30%),linear-gradient(135deg,rgba(34,27,18,.98),rgba(35,24,52,.98));box-shadow:0 24px 70px rgba(0,0,0,.34),0 0 60px rgba(255,197,50,.08)}
    .imara-prize-hero::after{content:"";position:absolute;inset:-100% -25%;background:linear-gradient(110deg,transparent 43%,rgba(255,248,210,.12) 50%,transparent 57%);animation:imaraPrizeSweep 5.8s ease-in-out infinite;pointer-events:none}
    .imara-prize-media{position:relative;z-index:1;display:grid;place-items:center;height:250px;border-radius:24px;background:radial-gradient(circle at 50% 42%,rgba(255,225,120,.18),rgba(0,0,0,.22));border:1px solid rgba(255,218,101,.25);overflow:hidden}.imara-prize-media img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 18px 24px rgba(0,0,0,.28));animation:imaraPrizeFloat 3.8s ease-in-out infinite}.imara-prize-media .fallback{font-size:86px;animation:imaraPrizeFloat 3.8s ease-in-out infinite}
    .imara-prize-copy{position:relative;z-index:1;text-align:left}.imara-prize-kicker{font-size:11px;font-weight:1000;letter-spacing:2.8px;color:#ffd765}.imara-prize-title{margin:9px 0 8px;font-size:clamp(34px,5vw,66px);line-height:.96;font-weight:1000;color:#fff5cf;text-shadow:0 8px 30px rgba(0,0,0,.35)}.imara-prize-desc{max-width:760px;font-size:clamp(14px,1.7vw,21px);line-height:1.35;color:#dcd5c6}.imara-prize-round{display:inline-flex;margin-top:15px;padding:7px 11px;border-radius:999px;background:rgba(255,211,84,.1);border:1px solid rgba(255,211,84,.26);font-size:11px;font-weight:900;color:#ffe89b}
    .imara-prize-delivered{margin-top:16px;padding:16px 0 2px;overflow:hidden}.imara-prize-delivered-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:0 4px 10px}.imara-prize-delivered-head strong{font-size:16px;color:#ffe39b}.imara-prize-delivered-head span{font-size:11px;color:var(--muted)}
    .imara-prize-carousel{overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent)}.imara-prize-track{display:flex;gap:12px;width:max-content;will-change:transform}.imara-prize-track.marquee{animation:imaraPrizeMarquee var(--marquee-time,36s) linear infinite}.imara-prize-carousel:hover .imara-prize-track{animation-play-state:paused}
    .imara-prize-win{width:280px;display:grid;grid-template-columns:78px 1fr;gap:11px;align-items:center;padding:11px;border-radius:18px;background:linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,214,90,.055));border:1px solid rgba(255,255,255,.12)}.imara-prize-win img,.imara-prize-win .fallback{width:78px;height:78px;border-radius:14px;object-fit:cover;background:#19150d}.imara-prize-win .fallback{display:grid;place-items:center;font-size:30px}.imara-prize-win b{display:block;color:#ffe49a;font-size:13px}.imara-prize-win strong{display:block;margin-top:4px;font-size:14px}.imara-prize-win small{display:block;margin-top:3px;color:var(--muted);font-size:11px}
    @keyframes imaraPrizeSweep{0%,58%{transform:translateX(-55%)}85%,100%{transform:translateX(55%)}}@keyframes imaraPrizeFloat{0%,100%{transform:translateY(0) scale(.98)}50%{transform:translateY(-7px) scale(1.01)}}@keyframes imaraPrizeMarquee{to{transform:translateX(-50%)}}
    @media(max-width:900px){.imara-prize-hero{grid-template-columns:180px 1fr;min-height:230px}.imara-prize-media{height:190px}.imara-prize-title{font-size:clamp(28px,6vw,48px)}}@media(max-width:620px){.imara-prize-hero{grid-template-columns:1fr;text-align:center;padding:18px}.imara-prize-media{height:180px}.imara-prize-copy{text-align:center}.imara-prize-desc{font-size:14px}}
    @media(prefers-reduced-motion:reduce){.imara-prize-hero::after,.imara-prize-media img,.imara-prize-media .fallback,.imara-prize-track.marquee{animation:none!important}}
  `;document.head.appendChild(s);
}

function ensurePublicUi(){
  if(IS_MOBILE)return null;
  const main=document.querySelector('#view-public .public-main');if(!main)return null;
  let root=document.getElementById('imaraPrizeExperience');
  if(!root){root=document.createElement('section');root.id='imaraPrizeExperience';main.prepend(root);}
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
function renderPublic(data){
  if(IS_MOBILE)return;
  latestPublic=data||latestPublic||{};
  const root=ensurePublicUi();if(!root)return;
  const g=latestPublic?.game||{},round=g.round||state?.round||{},show=g.show_state||{},wins=Array.isArray(latestPublic?.winners)?latestPublic.winners:[];
  const next=latestPublic?.next_prize||localNextPrize();
  const delivered=wins.filter(w=>String(w?.prize||w?.prize_title||'').trim()).slice(0,20);
  const currentRoundHasWinner=delivered.some(w=>String(w?.round_name||'')===String(round.name||''));
  const useNext=(show.type==='winner'||currentRoundHasWinner)&&next;
  const hero=useNext?{title:next.title||'Próximo premio',description:next.description||'',image:next.image_url||'',kicker:'✨ PRÓXIMO PREMIO',round:'La siguiente ronda'}:{title:round.prizeTitle||String(round.prize||'').split(' · ')[1]||round.prize||'Premio de la ronda',description:round.prizeDescription||'',image:round.prizeImage||'',kicker:'🎁 PREMIO DE ESTA RONDA',round:round.name||'Ronda actual'};
  const sig=JSON.stringify([hero.title,hero.description,hero.image,hero.kicker,hero.round,delivered.map(w=>[w.card_id,w.buyer_alias,w.prize_title,w.prize_image]),next?.id||'']);
  if(sig===lastPublicSig)return;lastPublicSig=sig;
  const image=hero.image?`<img src="${esc(hero.image)}" alt="${esc(hero.title)}">`:'<div class="fallback">🎁</div>';
  let carousel='';
  if(delivered.length){
    const cards=delivered.map(w=>{const p=winnerPrize(w),img=p.image?`<img src="${esc(p.image)}" alt="">`:'<div class="fallback">🏆</div>';return `<article class="imara-prize-win">${img}<div><b>${esc(p.title)}</b><strong>${esc(w.buyer_alias||'Ganador')}</strong><small>${esc(w.card_id||'')}${w.round_name?' · '+esc(w.round_name):''}</small></div></article>`;}).join('');
    const marquee=delivered.length>2;
    carousel=`<div class="imara-prize-delivered"><div class="imara-prize-delivered-head"><strong>🏆 Premios entregados</strong><span>Ganadores del evento</span></div><div class="imara-prize-carousel"><div class="imara-prize-track ${marquee?'marquee':''}" style="--marquee-time:${Math.max(28,delivered.length*7)}s">${cards}${marquee?cards:''}</div></div></div>`;
  }
  root.innerHTML=`<div class="imara-prize-hero"><div class="imara-prize-media">${image}</div><div class="imara-prize-copy"><div class="imara-prize-kicker">${esc(hero.kicker)}</div><div class="imara-prize-title">${esc(hero.title)}</div>${hero.description?`<div class="imara-prize-desc">${esc(hero.description)}</div>`:''}<div class="imara-prize-round">${esc(hero.round)}</div></div></div>${carousel}`;
  const old=document.querySelector('#view-public .public-hero .public-prize');if(old)old.style.display='none';
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
