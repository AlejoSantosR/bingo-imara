/* Bingo IMARA · ronda en vivo para cartón móvil */
(function(){
'use strict';
if(!location.hash.startsWith('#mobile='))return;
const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-public';
const SUPABASE_URL='https://fpevaukkbtruplwptufu.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_Yol0FuWEAsM01Q75iOUggg_kYyNlknF';
const REALTIME_AUTH='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZXZhdWtrYnRydXBsd3B0dWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMjA1MTIsImV4cCI6MjEwMzg5NjUxMn0.zEfiiwIBigfCJcV4d_BOnZRp2Qx6SZRdiyfG5Kyp7UQ';
const TOPIC='imara:game:main';
let lastKey='',seenClaim=false,lastType='idle',busy=false,realtimeClient=null,realtimeChannel=null,reconnectTimer=null,fallbackTimer=null,connected=false,fallbackDelay=12000;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
const labels={line:'Línea cualquiera',row:'Fila horizontal',column:'Columna vertical',col_b:'Columna B',col_i:'Columna I',col_n:'Columna N',col_g:'Columna G',col_o:'Columna O',diagonal:'Diagonal',corners:'4 esquinas',l_left:'L izquierda',l_right:'L derecha',x:'X completa',plus:'Cruz (+)',t:'Letra T',h:'Letra H',u:'Letra U',frame:'Marco exterior',full:'Cartón lleno'};
function id(){return document.querySelector('.mobile-person>div:first-child strong')?.textContent.trim()||'';}
function key(r){return `${r?.name||''}|${r?.pattern||''}|${r?.startedAt||''}`;}
function hasCard(show,c){return Array.isArray(show?.candidates)&&show.candidates.some(x=>String(x?.card_id||'')===String(c));}
function css(){if(document.getElementById('mobileRoundLiveCss'))return;const s=document.createElement('style');s.id='mobileRoundLiveCss';s.textContent=`.mobile-round-live{margin:0 0 12px;padding:13px;border:1px solid rgba(255,214,90,.28);border-radius:16px;background:linear-gradient(145deg,rgba(255,214,90,.10),rgba(141,107,255,.08));display:grid;gap:9px}.mobile-round-top{display:flex;justify-content:space-between;gap:10px;align-items:center}.mobile-round-top strong{font-size:16px}.mobile-round-state{padding:5px 9px;border-radius:999px;font-size:10px;font-weight:1000}.mobile-round-state.open{background:#153d33;color:#aaf4dd}.mobile-round-state.closed{background:#3d2930;color:#ffc4ce}.mobile-round-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mobile-round-grid>div,.mobile-round-prize{padding:9px 10px;border-radius:12px;background:#151f35;border:1px solid #303c58}.mobile-round-grid span{display:block;font-size:9px;text-transform:uppercase;color:#9facc4}.mobile-round-grid b{display:block;margin-top:3px;font-size:13px}.mobile-round-prize{color:#ffe7a6}.mobile-round-ban{padding:10px;border-radius:12px;background:rgba(255,91,143,.12);border:1px solid rgba(255,91,143,.28);color:#ffd4e1;font-size:13px;font-weight:800}.mobile-bingo-btn:disabled{opacity:.48!important;box-shadow:none!important}@media(max-width:420px){.mobile-round-grid{grid-template-columns:1fr}}`;document.head.appendChild(s);}
function panel(){let p=document.getElementById('mobileRoundLive');if(p)return p;const host=document.querySelector('.mobile-person');if(!host)return null;p=document.createElement('section');p.id='mobileRoundLive';p.className='mobile-round-live';host.after(p);return p;}
function setButton(r,isPending=false){const b=document.getElementById('mobileBingoBtn');if(!b)return;const open=r?.status==='open';b.disabled=!open||isPending;if(isPending)b.textContent='⏳ BINGO en revisión';else if(!open)b.textContent='⏸️ Ronda cerrada';else b.textContent='📣 ¡BINGO!';}
function paint(o){const r=o?.game?.round||{},show=o?.game?.show_state||{type:'idle'},c=id();if(!c)return;window.dispatchEvent(new CustomEvent('imara-mobile-game-state',{detail:o}));const k=key(r);if(k!==lastKey){lastKey=k;seenClaim=false;lastType='idle';}const activeClaim=hasCard(show,c)&&['bingo_live_claim','bingo_countdown','tie'].includes(show.type);seenClaim=activeClaim;lastType=show.type||'idle';if(!activeClaim&&show.type==='idle'){const st=document.getElementById('mobileBingoStatus');if(st){st.textContent='';st.style.display='none';}}const p=panel();if(!p)return;const open=r.status==='open';const prize=r.prizeTitle||r.prize||r.prizeDescription||'Premio por confirmar';p.innerHTML=`<div class="mobile-round-top"><strong>🎯 ${esc(r.name||'Ronda')}</strong><span class="mobile-round-state ${open?'open':'closed'}">${open?'EN JUEGO':'CERRADA'}</span></div><div class="mobile-round-grid"><div><span>Figura</span><b>${esc(labels[r.pattern]||r.pattern||'Por definir')}</b></div><div><span>Balotas llamadas</span><b>${Array.isArray(o?.game?.drawn)?o.game.drawn.length:0}</b></div></div><div class="mobile-round-prize">🎁 <b>Premio:</b> ${esc(prize)}</div>`;setButton(r,activeClaim);}
async function syncOnce(){
 if(busy)return;
 busy=true;
 try{
  const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),7000);
  const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action:'mobile-live'})});
  clearTimeout(tm);
  const d=await r.json();
  if(!r.ok)throw new Error(d?.error||'No fue posible cargar la ronda');
  paint(d);
 }catch(e){console.warn('Ronda móvil · sincronización',e);}
 finally{busy=false;}
}
function scheduleFallback(delay=fallbackDelay){
 clearTimeout(fallbackTimer);
 if(document.hidden||connected||!navigator.onLine)return;
 fallbackTimer=setTimeout(async()=>{if(!connected&&!document.hidden){await syncOnce();fallbackDelay=Math.min(30000,Math.round(fallbackDelay*1.35));scheduleFallback();}},delay+Math.floor(Math.random()*1200));
}
function stopFallback(){clearTimeout(fallbackTimer);fallbackDelay=12000;}
function reconnect(delay=1800){
 clearTimeout(reconnectTimer);
 scheduleFallback();
 reconnectTimer=setTimeout(()=>{if(!document.hidden&&!connected)connectRealtime();},delay+Math.floor(Math.random()*700));
}
async function connectRealtime(){
 if(connected||document.hidden)return;
 try{
  if(!realtimeClient){
   const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm');
   realtimeClient=mod.createClient(SUPABASE_URL,PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:10}}});
   realtimeClient.realtime.setAuth(REALTIME_AUTH);
  }
  if(realtimeChannel){try{await realtimeClient.removeChannel(realtimeChannel);}catch(_){} realtimeChannel=null;}
  realtimeChannel=realtimeClient.channel(TOPIC,{config:{private:true}});
  realtimeChannel
   .on('broadcast',{event:'game-state'},msg=>{
     const payload=msg?.payload;
     if(payload?.game)paint(payload);
   })
   .on('broadcast',{event:'activity-probe'},msg=>{
     window.dispatchEvent(new CustomEvent('imara-activity-probe',{detail:msg?.payload||{}}));
   })
   .subscribe(status=>{
     if(status==='SUBSCRIBED'){
       connected=true;
       stopFallback();
       syncOnce();
       return;
     }
     if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
       connected=false;
       reconnect(status==='TIMED_OUT'?3200:1800);
     }
   });
 }catch(e){
  connected=false;
  console.warn('Ronda móvil · Realtime',e);
  reconnect(3500);
 }
}
async function sleepRealtime(){
 connected=false;clearTimeout(reconnectTimer);clearTimeout(fallbackTimer);
 if(realtimeClient&&realtimeChannel){try{await realtimeClient.removeChannel(realtimeChannel);}catch(_){}}
 realtimeChannel=null;
}
try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i)||'';if(k.startsWith('imaraRoundBan:'))localStorage.removeItem(k);}}catch(_){}
css();
syncOnce();
scheduleFallback(9000);
connectRealtime();
document.addEventListener('visibilitychange',()=>{if(document.hidden){sleepRealtime();return;}syncOnce();connectRealtime();});
window.addEventListener('online',()=>{syncOnce();connectRealtime();});
window.addEventListener('offline',()=>{connected=false;clearTimeout(fallbackTimer);});
window.addEventListener('pagehide',()=>{sleepRealtime();});
})();