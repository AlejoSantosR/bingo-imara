/* Bingo IMARA · POS payment dropdown 2026
   Ajustes visuales mínimos del selector y tarjeta RappiPay.
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

function patchRappiPayCard(){
  const cards=[...document.querySelectorAll('#view-pos .pay-option')];
  const card=cards.find(x=>(x.querySelector('strong')?.textContent||'').includes('RappiPay'));
  if(!card)return false;

  const small=card.querySelector('small');
  if(small){
    const configured=!/pendiente/i.test(small.textContent||'');
    small.textContent=configured?'Enlace de pago disponible':'Enlace pendiente de configurar';
    small.style.display='block';
    small.style.maxWidth='100%';
    small.style.overflow='hidden';
    small.style.textOverflow='ellipsis';
    small.style.whiteSpace='nowrap';
  }

  const share=card.querySelector('[data-pay-share="Link de pago · RappiPay"]');
  if(share)share.textContent='Compartir enlace';
  return true;
}

function patch(){patchPaymentDropdown();patchRappiPayCard();}
function schedule(){[0,250,700,1500,3000,5500].forEach(ms=>setTimeout(patch,ms));}

document.addEventListener('click',e=>{
  if(e.target.closest?.('.nav [data-view="pos"]')||
     e.target.closest?.('#posRefresh')||
     e.target.closest?.('#posCreate')||
     e.target.closest?.('#imaraLoginBtn'))schedule();
},true);

schedule();
})();
