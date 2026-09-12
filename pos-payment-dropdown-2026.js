/* Bingo IMARA · POS payment dropdown 2026
   Único objetivo: simplificar el desplegable Medio de pago.
   No modifica precios, ventas, aprobaciones, finanzas ni configuración. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;

function patchPaymentDropdown(){
  const select=document.getElementById('posMethod');
  if(!select)return false;
  const current=select.value||'';
  select.innerHTML=[
    ['Efectivo','Efectivo'],
    ['Nequi','Nequi / Daviplata / Bre-B'],
    ['Link de pago · RappiPay','Link de pago']
  ].map(([value,label])=>`<option value="${value}">${label}</option>`).join('');

  if(['Nequi','Daviplata','Bre-B'].includes(current))select.value='Nequi';
  else if(current==='Link de pago · RappiPay')select.value='Link de pago · RappiPay';
  else select.value='Efectivo';
  return true;
}

function schedule(){[0,250,700,1500,3000,5500].forEach(ms=>setTimeout(patchPaymentDropdown,ms));}

document.addEventListener('click',e=>{
  if(e.target.closest?.('.nav [data-view="pos"]')||
     e.target.closest?.('#posRefresh')||
     e.target.closest?.('#posCreate')||
     e.target.closest?.('#imaraLoginBtn'))schedule();
},true);

schedule();
})();
