/* Bingo IMARA · seguridad del canto BINGO móvil 2026
   Usa la matriz ya incluida en el enlace existente como prueba del cartón.
   No cambia URLs, matrices, compradores ni estados. */
(function(){
'use strict';
if(!location.hash.startsWith('#mobile='))return;
if(window.__imaraMobileBingoSecurity2026)return;window.__imaraMobileBingoSecurity2026=true;

const PRIVATE_FRAGMENT='/functions/v1/bingo-private';
const STABILITY_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-stability';
const nativeFetch=window.fetch.bind(window);
let proof=null;

function decodePayload(){
 try{
  let s=location.hash.slice('#mobile='.length).replace(/-/g,'+').replace(/_/g,'/');
  while(s.length%4)s+='=';
  const binary=atob(s),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  const data=JSON.parse(new TextDecoder().decode(bytes));
  if(!data||!data.id||!Array.isArray(data.grid))return null;
  return {id:String(data.id),grid:data.grid,ballMax:Number(data.ballMax)||99};
 }catch(e){return null;}
}
proof=decodePayload();

window.fetch=async function(input,init){
 try{
  const url=typeof input==='string'?input:(input?.url||'');
  if(proof&&url.includes(PRIVATE_FRAGMENT)&&init?.method==='POST'&&init?.body){
   const body=JSON.parse(String(init.body));
   if(body?.action==='bingo-claim'&&String(body.card_id||'')===proof.id){
    const next={...init,headers:{...(init.headers||{}),'Content-Type':'application/json'},body:JSON.stringify({action:'bingo-claim-proof',card_id:proof.id,proof})};
    return nativeFetch(STABILITY_API,next);
   }
  }
 }catch(e){console.warn('Seguridad BINGO móvil:',e.message||e);}
 return nativeFetch(input,init);
};
})();