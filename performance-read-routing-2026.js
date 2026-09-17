/* Bingo IMARA · rutas rápidas de lectura · SAFE 2026
   Solo optimiza lecturas pesadas. No cambia ventas, estados, cartones, juego ni diseño. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraPerformanceReadRouting2026)return;
window.__imaraPerformanceReadRouting2026=true;

const FAST='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-read-fast';
const previousFetch=window.fetch.bind(window);
const previousSetInterval=window.setInterval.bind(window);

/* El panel seguro consultaba toda la operación cada 15 s. Conservamos la actualización
   automática, pero a 30 s. Se limita exclusivamente al timer `refresh` creado por
   secure-access.js; los demás temporizadores del Bingo quedan intactos. */
window.setInterval=function(handler,delay,...args){
  let nextDelay=delay;
  try{
    const stack=String(new Error().stack||'');
    if(Number(delay)===15000&&typeof handler==='function'&&handler.name==='refresh'&&stack.includes('secure-access.js'))nextDelay=30000;
  }catch(e){}
  return previousSetInterval(handler,nextDelay,...args);
};

window.fetch=function(input,init){
  try{
    const url=typeof input==='string'?input:(input?.url||'');
    if(!init?.body)return previousFetch(input,init);
    const body=JSON.parse(String(init.body));
    const action=String(body?.action||'');
    const isPrivate=url.includes('/functions/v1/bingo-private');
    const isFinance=url.includes('/functions/v1/bingo-finance');
    if((isPrivate&&(action==='sales'||action==='overview'))||(isFinance&&action==='finance-list')){
      return previousFetch(FAST,init);
    }
  }catch(e){}
  return previousFetch(input,init);
};
})();