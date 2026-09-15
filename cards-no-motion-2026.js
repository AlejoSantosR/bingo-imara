/* Bingo IMARA · Cartones completamente estables, sin animaciones/hover invasivo
   Conserva estética, colores, bordes y jerarquía visual. Todos los controles permanecen visibles. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(document.getElementById('cardsNoMotionCss'))return;
const s=document.createElement('style');s.id='cardsNoMotionCss';s.textContent=`
/* La sección Cartones no anima ni se desplaza. */
body #view-cards,
body #view-cards *,
body #view-cards *::before,
body #view-cards *::after{
  animation:none!important;
  transition:none!important;
  scroll-behavior:auto!important;
}

/* Anula el hover global de .card y cualquier transformación/filtro dentro de Cartones. */
body #view-cards .card,
body #view-cards .card:hover,
body #view-cards table,
body #view-cards thead,
body #view-cards tbody,
body #view-cards tr,
body #view-cards tr:hover,
body #view-cards td,
body #view-cards th,
body #view-cards .actions,
body #view-cards .mini-actions,
body #view-cards .btn,
body #view-cards .mini,
body #view-cards button,
body #view-cards button:hover,
body #view-cards button:focus,
body #view-cards button:active{
  transform:none!important;
  filter:none!important;
  opacity:1!important;
  visibility:visible!important;
}

/* Todos los botones y grupos de acciones permanecen renderizados y clicables. */
body #view-cards .actions,
body #view-cards .mini-actions{
  display:flex!important;
  gap:6px!important;
  flex-wrap:wrap!important;
  position:relative!important;
  z-index:20!important;
  opacity:1!important;
  visibility:visible!important;
  pointer-events:auto!important;
}
body #view-cards .btn,
body #view-cards .mini,
body #view-cards button{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  position:relative!important;
  z-index:21!important;
  opacity:1!important;
  visibility:visible!important;
  pointer-events:auto!important;
  will-change:auto!important;
}

/* Evita clipping/repaint extraño de la columna Acciones. */
body #view-cards .table-wrap{
  overflow:auto!important;
  isolation:isolate!important;
  transform:none!important;
}
body #view-cards table{
  position:relative!important;
  z-index:1!important;
}
body #view-cards td:last-child,
body #view-cards th:last-child{
  min-width:220px!important;
  overflow:visible!important;
}

/* Sin efecto visual de hover en filas o controles: estética fija y limpia. */
body #view-cards tr:hover td{background:inherit!important;}
body #view-cards .btn:hover,
body #view-cards .mini:hover,
body #view-cards button:hover{
  filter:none!important;
  transform:none!important;
}
`;
document.head.appendChild(s);
})();

/* Carga adaptativa de rendimiento solo para Android privado. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(!/Android/i.test(navigator.userAgent||''))return;
if(window.matchMedia&&!window.matchMedia('(max-width:820px)').matches)return;
if(document.getElementById('imaraAndroidPerformance2026'))return;
const s=document.createElement('script');
s.id='imaraAndroidPerformance2026';
s.src='android-performance-2026.js?v=20260912-ANDROID-PERF-1';
s.defer=true;
document.body.appendChild(s);
})();

/* Único ajuste POS: simplifica el desplegable Medio de pago y la tarjeta RappiPay. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(document.getElementById('imaraPosPaymentDropdown2026'))return;
const s=document.createElement('script');
s.id='imaraPosPaymentDropdown2026';
s.src='pos-payment-dropdown-2026.js?v=20260912-PAYMENT-DROPDOWN-2';
s.defer=true;
document.body.appendChild(s);
})();

/* Publica un inventario sanitizado para la página pública, sin tocar POS/Juego. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(document.getElementById('imaraPublicInventorySync2026'))return;
const s=document.createElement('script');
s.id='imaraPublicInventorySync2026';
s.src='public-inventory-sync-2026.js?v=20260914-PUBLIC-INVENTORY-1';
s.defer=true;
document.body.appendChild(s);
})();
