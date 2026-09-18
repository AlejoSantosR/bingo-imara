/* Bingo IMARA · ronda en vivo para cartón móvil */
(function(){
'use strict';
if(!location.hash.startsWith('#mobile='))return;
const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-public';
let lastKey='',seenClaim=false,lastType='idle',timer=null,busy=false,failures=0,lastRoundOpen=true;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
const labels={line:'Línea cualquiera',row:'Fila horizontal',column:'Columna vertical',col_b:'Columna B',col_i:'Columna I',col_n:'Columna N',col_g:'Columna G',col_o:'Columna O',diagonal:'Diagonal',corners:'4 esquinas',l_left:'L izquierda',l_right:'L derecha',x:'X completa',plus:'Cruz (+)',t:'Letra T',h:'Letra H',u:'Letra U',frame:'Marco exterior',full:'Cartón lleno'};
function id(){return document.querySelector('.mobile-person>div:first-child strong')?.textContent.trim()||'';}
function key(r){return `${r?.name||''}|${r?.pattern||''}|${r?.startedAt||''}`;}
function localBan(c,r){return localStorage.getItem(`imaraRoundBan:${c}:${key(r)}`)==='1';}
function banned(c,r){return (Array.isArray(r?.bannedCards)&&r.bannedCards.map(String).includes(String(c)))||localBan(c,r);}
function setBan(c,r){localStorage.setItem(`imaraRoundBan:${c}:${key(r)}`,'1');}
function hasCard(show,c){return Array.isArray(show?.candidates)&&show.candidates.some(x=>String(x?.card_id||'')===String(c));}
function css(){if(document.getElementById('mobileRoundLiveCss'))return;const s=document.createElement('style');s.id='mobileRoundLiveCss';s.textContent=`.mobile-round-live{margin:0 0 12px;padding:13px;border:1px solid rgba(255,214,90,.28);border-radius:16px;background:linear-gradient(145deg,rgba(255,214,90,.10),rgba(141,107,255,.08));display:grid;gap:9px}.mobile-round-top{display:flex;justify-content:space-between;gap:10px;align-items:center}.mobile-round-top strong{font-size:16px}.mobile-round-state{padding:5px 9px;border-radius:999px;font-size:10px;font-weight:1000}.mobile-round-state.open{background:#153d33;color:#aaf4dd}.mobile-round-state.closed{background:#3d2930;color:#ffc4ce}.mobile-round-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mobile-round-grid>div,.mobile-round-prize{padding:9px 10px;border-radius:12px;background:#151f35;border:1px solid #303c58}.mobile-round-grid span{display:block;font-size:9px;text-transform:uppercase;color:#9facc4}.mobile-round-grid b{display:block;margin-top:3px;font-size:13px}.mobile-round-prize{color:#ffe7a6}.mobile-round-ban{padding:10px;border-radius:12px;background:rgba(255,91,143,.12);border:1px solid rgba(255,91,143,.28);color:#ffd4e1;font-size:13px;font-weight:800}.mobile-bingo-btn:disabled{opacity:.48!important;box-shadow:none!important}@media(max-width:420px){.mobile-round-grid{grid-template-columns:1fr}}`;document.head.appendChild(s);}
function panel(){let p=document.getElementById('mobileRoundLive');if(p)return p;const host=document.querySelector('.mobile-person');if(!host)return null;p=document.createElement('section');p.id='mobileRoundLive';p.className='mobile-round-live';host.after(p);return p;}
function setButton(r,isBanned){const b=document.getElementById('mobileBingoBtn');if(!b)return;const open=r?.status==='open';b.disabled=!open||isBanned;if(isBanned)b.textContent='⛔ BINGO bloqueado en esta ronda';else if(!open)b.textContent='⏸️ Ronda cerrada';else if(!/enviado/i.test(b.textContent||''))b.textContent='📣 ¡BINGO!';}
function paint(o){const r=o?.game?.round||{},show=o?.game?.show_state||{type:'idle'},c=id();lastRoundOpen=r?.status==='open';if(!c)return;const k=key(r);if(k!==lastKey){lastKey=k;seenClaim=false;lastType='idle';}if(hasCard(show,c)&&['bingo_live_claim','bingo_countdown','tie'].includes(show.type))seenClaim=true;if(seenClaim&&lastType!=='idle'&&show.type==='idle'){setBan(c,r);seenClaim=false;}lastType=show.type||'idle';const isBanned=banned(c,r),p=panel();if(!p)return;const open=r.status==='open';const prize=r.prizeTitle||r.prize||r.prizeDescription||'Premio por confirmar';p.innerHTML=`<div class="mobile-round-top"><strong>🎯 ${esc(r.name||'Ronda')}</strong><span class="mobile-round-state ${open?'open':'closed'}">${open?'EN JUEGO':'CERRADA'}</span></div><div class="mobile-round-grid"><div><span>Figura</span><b>${esc(labels[r.pattern]||r.pattern||'Por definir')}</b></div><div><span>Balotas llamadas</span><b>${Array.isArray(o?.game?.drawn)?o.game.drawn.length:0}</b></div></div><div class="mobile-round-prize">🎁 <b>Premio:</b> ${esc(prize)}</div>${isBanned?'<div class="mobile-round-ban">⛔ Este cartón quedó bloqueado para anunciar otro BINGO en esta ronda. En la siguiente vuelve a participar.</div>':''}`;setButton(r,isBanned);}
function schedule(delay){clearTimeout(timer);if(document.hidden)return;const base=delay??(lastRoundOpen?2800:6500),backoff=Math.min(15000,base*Math.max(1,Math.pow(1.8,failures)));timer=setTimeout(tick,backoff+Math.floor(Math.random()*500));}
async function tick(){
 if(document.hidden||busy)return;
 busy=true;
 try{
  const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),7000);
  const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action:'mobile-live'})});
  clearTimeout(tm);
  const d=await r.json();
  if(!r.ok)throw new Error(d?.error||'No fue posible cargar la ronda');
  failures=0;paint(d);
 }catch(e){failures=Math.min(failures+1,4);console.warn('Ronda móvil',e);}
 finally{busy=false;schedule();}
}
css();schedule(250);
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);return;}failures=0;schedule(120);});
})();