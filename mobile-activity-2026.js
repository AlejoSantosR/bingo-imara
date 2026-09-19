/* Bingo IMARA · actividad manual de cartón móvil · 2026 */
(function(){
'use strict';
if(!location.hash.startsWith('#mobile='))return;
if(window.__imaraMobileActivity2026)return;window.__imaraMobileActivity2026=true;

const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-activity';
let data=null,busy=false;

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
async function ping(event,probeId=''){
 if(!data?.id||!Array.isArray(data.grid)||busy)return;
 busy=true;
 try{
  await fetch(API,{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   cache:'no-store',
   body:JSON.stringify({
     action:'ping',
     card_id:data.id,
     grid:data.grid,
     client_id:clientId(data.id),
     event,
     probe_id:probeId||undefined
   })
  });
 }catch(e){/* La actividad nunca debe interrumpir el cartón. */}
 finally{busy=false;}
}
data=decode();
if(!data?.id||!Array.isArray(data.grid))return;

ping('open');

window.addEventListener('imara-activity-probe',e=>{
 if(document.hidden||!navigator.onLine)return;
 const probeId=String(e.detail?.probe_id||'');
 if(probeId)ping('probe',probeId);
});
})();