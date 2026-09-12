/* Bingo IMARA · puente estable de Finanzas 2026 */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(document.getElementById('imaraFinanceSafe2026'))return;
const s=document.createElement('script');
s.id='imaraFinanceSafe2026';
s.src='finance-center-safe-2026.js?v=20260912-STABLE-2';
s.defer=true;
document.body.appendChild(s);
})();
