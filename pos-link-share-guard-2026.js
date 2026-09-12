/* Bingo IMARA · bloqueo de envío de link antes de aprobación */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
document.addEventListener('click',function(e){
  const btn=e.target.closest?.('#posSharePayment');
  if(!btn)return;
  const method=document.getElementById('posMethod')?.value||'';
  if(!method.includes('Link de pago'))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  alert('Primero registra la preventa y solicita el link de pago. Cuando Admin o Finanzas lo aprueben aparecerá el botón “📤 Enviar link”.');
},true);
})();