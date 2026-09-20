/* Bingo IMARA · enrutador financiero atómico · SAFE 2026
   Solo redirige operaciones financieras de escritura críticas.
   Lecturas y el resto del sistema siguen usando bingo-finance sin cambios. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraFinanceAtomicRouting2026)return;window.__imaraFinanceAtomicRouting2026=true;
const OLD='/functions/v1/bingo-finance';
const NEW='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-finance-atomic';
const ATOMIC=new Set(['finance-update','finance-card-status','admin-sale-record','finance-payment-add','finance-order-payment-add','finance-contact-update','finance-bulk-correct']);
const previousFetch=window.fetch.bind(window);
window.fetch=function(input,init){
 try{
   const url=typeof input==='string'?input:(input?.url||'');
   if(url.includes(OLD)&&init?.body){
     const body=JSON.parse(String(init.body));
     if(ATOMIC.has(String(body?.action||'')))return previousFetch(NEW,init);
   }
 }catch(e){}
 return previousFetch(input,init);
};
})();