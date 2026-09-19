/* Bingo IMARA · actividad ligera de cartón móvil · 2026 */
(function(){
'use strict';
if(!location.hash.startsWith('#mobile='))return;
if(window.__imaraMobileActivity2026)return;window.__imaraMobileActivity2026=true;

const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-activity';
const HEARTBEAT_MS=60000;
let timer=null,busy=false,data=null;

function decode(){
 try{
  let s=location.hash.slice('#mobile='.length).replace(/-/g,'+').replace(/_/g,'/');
  while(s.length%4)s+='=';
  const bin=atob(s),bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
 }catch{return null;}
}
function clientId(cardId){
 const key='imaraActivityClient:'+cardId;
 let id=sessionStorage.getItem(key)||'';
 if(!id){id=crypto.randomUUID();sessionStorage.setItem(key,id);}
 return id;
}
async function ping(event,keepalive=false){
 if(!data?.id||!Array.isArray(data.grid)||busy&&event==='heartbeat')return;
 if(event==='heartbeat')busy=true;
 try{
  await fetch(API,{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   cache:'no-store',
   keepalive,
   body:JSON.stringify({action:'ping',card_id:data.id,grid:data.grid,client_id:clientId(data.id),event})
  });
 }catch(e){/* La actividad nunca debe interrumpir el cartón. */}
 finally{if(event==='heartbeat')busy=false;}
}
function start(){
 clearInterval(timer);
 timer=setInterval(()=>{if(!document.hidden&&navigator.onLine)ping('heartbeat');},HEARTBEAT_MS);
}
data=decode();
if(!data?.id||!Array.isArray(data.grid))return;
ping('open');
start();
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){ping('hidden',true);return;}
 ping('visible');start();
});
window.addEventListener('online',()=>{if(!document.hidden)ping('visible');});
window.addEventListener('pagehide',()=>{clearInterval(timer);ping('hidden',true);});
})();