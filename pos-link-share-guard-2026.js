/* Bingo IMARA · bloqueo de envío de link antes de aprobación */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;

document.addEventListener('click',function(e){
  const financeNav=e.target.closest?.('.nav [data-view="finance"]');
  if(financeNav){
    setTimeout(()=>document.getElementById('financeRefresh')?.click(),450);
  }

  const btn=e.target.closest?.('#posSharePayment');
  if(!btn)return;
  const method=document.getElementById('posMethod')?.value||'';
  if(!method.includes('Link de pago'))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  alert('Primero registra la preventa y solicita el link de pago. Cuando Admin o Finanzas lo aprueben aparecerá el botón “📤 Enviar link”.');
},true);

/* Si Finanzas abre directamente al iniciar sesión, hace una sola carga inicial. */
let tries=0;
const boot=setInterval(()=>{
  tries++;
  const chip=document.querySelector('#imaraUserChip .imara-role.finance');
  const view=document.getElementById('view-finance');
  if(chip&&view&&!view.classList.contains('hidden')){
    clearInterval(boot);
    document.getElementById('financeRefresh')?.click();
  }else if(tries>30)clearInterval(boot);
},500);
})();