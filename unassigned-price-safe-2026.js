/* Bingo IMARA · Valor sin asignar para inventario SAFE 2026
   Los cartones disponibles no tienen precio hasta que el POS define Individual o Promo.
   Sin MutationObserver ni polling permanente. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
let wired=false;
function neutralize(){
  document.querySelectorAll('#cardsBody tr').forEach(tr=>{
    const status=(tr.querySelector('td:nth-child(4)')?.textContent||'').trim().toLowerCase();
    if(status!=='disponible')return;
    const td=tr.querySelector('td:nth-child(5)');
    if(td)td.innerHTML='<span class="muted">Sin asignar</span><br><small class="muted">Se define al vender en POS</small>';
  });
}
function schedule(){[160,800,1600].forEach(ms=>setTimeout(neutralize,ms));}
function wire(){if(wired)return;wired=true;document.addEventListener('click',e=>{const t=e.target;if(t.closest?.('.nav [data-view="cards"]')||t.closest?.('#confirmGenerateBtn')||t.closest?.('#posCreate')||t.closest?.('#posRefresh')||t.closest?.('[data-approve-order]')||t.closest?.('[data-pending-order]')||t.closest?.('[data-refund-order]')||t.closest?.('[data-reject-order]'))schedule();if(t.closest?.('#imaraLoginBtn'))[1000,2400,4700].forEach(ms=>setTimeout(neutralize,ms));},true);}
function boot(){wire();[900,2300,4600].forEach(ms=>setTimeout(neutralize,ms));}
boot();
})();
