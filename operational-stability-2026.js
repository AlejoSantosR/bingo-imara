/* Bingo IMARA · Estabilidad operativa 2026
   Capa aditiva: sincronización recuperable, renovación de sesión y backup completo.
   No modifica POS, precios, cartones, premios ni lógica visual del juego. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraOperationalStability2026)return;
window.__imaraOperationalStability2026=true;

const PRIVATE_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const STABILITY_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-stability';
const SESSION_KEY='imaraPrivateSessionV1';
const PENDING_KEY='imaraGamePendingSyncV1';
let flushing=false,installed=false,lastSig='',syncWarned=false,flushTimer=null,renewTimer=null;

function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
function snap(){return {drawn:Array.isArray(state?.drawn)?state.drawn.map(Number):[],round:state?.round&&typeof state.round==='object'?state.round:{}};}
function signature(v){try{return JSON.stringify([v?.drawn||[],v?.round||{}]);}catch{return '';}}
function readPending(){try{return JSON.parse(localStorage.getItem(PENDING_KEY)||'null');}catch{return null;}}
function writeLocal(){try{if(typeof KEY!=='undefined')localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
function mapWinners(rows){return (rows||[]).map(w=>({cardId:w.card_id,buyer:w.buyer_alias||'',roundName:w.round_name,pattern:w.pattern,prize:w.prize,position:w.position,at:w.created_at}));}
function notify(msg){try{if(typeof toast==='function')toast(msg);else console.info(msg);}catch(e){console.info(msg);}}

async function post(url,action,payload={},auth=true){
 const h={'Content-Type':'application/json'};
 if(auth&&token())h.Authorization='Bearer '+token();
 const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),12000);
 try{
  const r=await fetch(url,{method:'POST',headers:h,cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});
  let d={};try{d=await r.json();}catch(e){}
  if(!r.ok)throw new Error(d.error||'No fue posible completar la operación.');
  return d;
 }finally{clearTimeout(tm);}
}
const pApi=(a,p={},auth=true)=>post(PRIVATE_API,a,p,auth);
const sApi=(a,p={})=>post(STABILITY_API,a,p,true);

function applyCloud(game,winners){
 if(typeof state==='undefined'||!game)return;
 state.drawn=Array.isArray(game.drawn)?game.drawn.map(Number):state.drawn;
 state.round=game.round&&typeof game.round==='object'?game.round:state.round;
 if(Array.isArray(winners))state.winners=mapWinners(winners);
 lastSig=signature(snap());
 writeLocal();
 try{if(typeof renderAll==='function')renderAll();}catch(e){}
}

function markCommitted(game,winners){
 if(game)applyCloud(game,winners);
 localStorage.removeItem(PENDING_KEY);
 syncWarned=false;
}

function rememberOperationalChange(){
 if(!isAdmin()||!token()||typeof state==='undefined')return;
 const s=snap(),nextSig=signature(s);
 if(!nextSig||nextSig===lastSig)return;
 localStorage.setItem(PENDING_KEY,JSON.stringify({...s,at:new Date().toISOString()}));
 scheduleFlush(180);
}

function installSaveGuard(){
 if(installed||typeof saveState!=='function')return;
 installed=true;
 lastSig=signature(snap());
 const base=saveState;
 const wrapped=function(){const r=base.apply(this,arguments);rememberOperationalChange();return r;};
 wrapped.__imaraOperationalStability=true;
 saveState=wrapped;
}

function scheduleFlush(ms=350){clearTimeout(flushTimer);flushTimer=setTimeout(flushPending,ms);}
async function flushPending(){
 if(flushing||!isAdmin()||!token())return false;
 const p=readPending();if(!p)return true;
 flushing=true;
 try{
  const d=await sApi('game-sync',{drawn:p.drawn||[],round:p.round||{}});
  markCommitted(d.game,d.winners);
  if(syncWarned)notify('☁️ Sincronización con la nube recuperada');
  syncWarned=false;
  return true;
 }catch(e){
  if(!syncWarned){syncWarned=true;notify('☁️ Cambio guardado; sincronización pendiente');}
  console.warn('Estabilidad IMARA · sync:',e.message||e);
  return false;
 }finally{flushing=false;}
}

async function hydrateFromCloud(){
 if(!isAdmin()||!token()||readPending())return;
 try{const o=await pApi('overview',{},false);applyCloud(o.game,o.winners);}catch(e){console.warn('Estabilidad IMARA · hydrate:',e.message||e);}
}

async function renewSession(){
 if(!token())return;
 try{await sApi('session-renew');}catch(e){console.warn('Estabilidad IMARA · sesión:',e.message||e);}
}

function downloadJson(name,obj){
 const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
async function fullBackup(button){
 const old=button.textContent;button.disabled=true;button.textContent='☁️ Preparando backup…';
 try{
  await flushPending();
  const d=await sApi('backup-export');
  const payload={...state,backup_format:'BINGO_IMARA_FULL_BACKUP_V1',backup_created_at:new Date().toISOString(),cloud_backup:d.backup};
  downloadJson(`Backup_COMPLETO_Bingo_IMARA_${new Date().toISOString().slice(0,10)}.json`,payload);
  notify('✅ Backup completo descargado');
 }catch(e){
  alert('No se pudo crear el backup completo. No se descargó un respaldo parcial.\n\n'+(e.message||'Intenta nuevamente.'));
 }finally{button.disabled=false;button.textContent=old;}
}

function wireBackup(){
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('#backupBtn,#exportBtn');
  if(!b||!isAdmin()||!token())return;
  e.preventDefault();e.stopImmediatePropagation();fullBackup(b);
 },true);
}

function activate(){
 installSaveGuard();
 renewSession();
 if(readPending())scheduleFlush(50);else hydrateFromCloud();
 if(!renewTimer)renewTimer=setInterval(renewSession,20*60*1000);
 window.addEventListener('online',()=>{scheduleFlush(80);setTimeout(hydrateFromCloud,800);});
 window.addEventListener('focus',()=>{scheduleFlush(80);setTimeout(hydrateFromCloud,900);});
}
function boot(attempt=0){
 if(typeof state!=='undefined'&&isAdmin()&&token()){activate();return;}
 if(attempt<120)setTimeout(()=>boot(attempt+1),500);
}

window.IMARA_STABILITY={flush:flushPending,hydrate:hydrateFromCloud,renew:renewSession,markCommitted};
wireBackup();boot();
})();