/* Bingo IMARA · puente estable de Finanzas 2026 */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(!document.getElementById('imaraFinanceSafe2026')){
 const s=document.createElement('script');
 s.id='imaraFinanceSafe2026';
 s.src='finance-center-safe-2026.js?v=20260912-STABLE-2';
 s.defer=true;
 document.body.appendChild(s);
}
if(!document.getElementById('imaraPricingConsistencySafe2026')){
 const p=document.createElement('script');
 p.id='imaraPricingConsistencySafe2026';
 p.src='pricing-consistency-safe-2026.js?v=20260912-PRICE-SAFE-2';
 p.defer=true;
 document.body.appendChild(p);
}
if(!document.getElementById('imaraUnassignedPriceSafe2026')){
 const u=document.createElement('script');
 u.id='imaraUnassignedPriceSafe2026';
 u.src='unassigned-price-safe-2026.js?v=20260912-UNASSIGNED-1';
 u.defer=true;
 document.body.appendChild(u);
}
})();
