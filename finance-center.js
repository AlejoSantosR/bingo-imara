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
if(!document.getElementById('imaraReleaseAssignmentSafe2026')){
 const r=document.createElement('script');
 r.id='imaraReleaseAssignmentSafe2026';
 r.src='release-assignment-safe-2026.js?v=20260912-RELEASE-1';
 r.defer=true;
 document.body.appendChild(r);
}
if(!document.getElementById('imaraCardsAdminStable2026')){
 const c=document.createElement('script');
 c.id='imaraCardsAdminStable2026';
 c.src='cards-admin-stable-2026.js?v=20260912-CARDS-STABLE-1';
 c.defer=true;
 document.body.appendChild(c);
}
})();
