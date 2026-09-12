/* Bingo IMARA · puente estable de recuperación de contraseña */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(document.getElementById('imaraPasswordRecoverySafe2026'))return;
const s=document.createElement('script');
s.id='imaraPasswordRecoverySafe2026';
s.src='password-recovery-safe-2026.js?v=20260912-STABLE-2';
s.defer=true;
document.body.appendChild(s);
})();
