/* Bingo IMARA · Cartones sin animaciones invasivas
   Conserva estética, colores, bordes y jerarquía visual; elimina movimiento que pueda ocultar controles. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(document.getElementById('cardsNoMotionCss'))return;
const s=document.createElement('style');s.id='cardsNoMotionCss';s.textContent=`
#view-cards,#view-cards *,#view-cards *::before,#view-cards *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
#view-cards .btn,#view-cards .mini,#view-cards .btn:hover,#view-cards .mini:hover{transform:none!important;opacity:1!important;visibility:visible!important}
#view-cards .actions,#view-cards .mini-actions{position:relative;z-index:2}
#view-cards .table-wrap{overflow:auto!important}
#view-cards table{position:relative;z-index:1}
`;
document.head.appendChild(s);
})();
