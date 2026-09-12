/* Bingo IMARA · Android Performance 2026
   Optimización adaptativa para Android de gama media/baja.
   No cambia datos, reglas, permisos ni flujos. Sin polling ni MutationObserver. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
const isAndroid=/Android/i.test(navigator.userAgent||'');
const small=window.matchMedia&&window.matchMedia('(max-width:820px)').matches;
if(!isAndroid||!small)return;

const mem=Number(navigator.deviceMemory||0);
const cores=Number(navigator.hardwareConcurrency||0);
const low=(mem>0&&mem<=4)||(cores>0&&cores<=4);
const mid=low||(mem>0&&mem<=6)||(cores>0&&cores<=6)||(!mem&&!cores);
document.documentElement.classList.add('imara-android-perf');
if(mid)document.documentElement.classList.add('imara-android-mid');
if(low)document.documentElement.classList.add('imara-android-low');
window.__imaraAndroidPerformance={enabled:true,low,mid,memory:mem||null,cores:cores||null};

if(document.getElementById('imaraAndroidPerformanceCss'))return;
const s=document.createElement('style');
s.id='imaraAndroidPerformanceCss';
s.textContent=`
@media(max-width:820px){
  /* Base Android: menos composición, misma estética */
  html.imara-android-perf body{
    text-rendering:optimizeSpeed;
    -webkit-tap-highlight-color:transparent;
  }
  html.imara-android-perf body *,
  html.imara-android-perf body *::before,
  html.imara-android-perf body *::after{
    will-change:auto!important;
  }
  html.imara-android-perf body button,
  html.imara-android-perf body .btn,
  html.imara-android-perf body .mini,
  html.imara-android-perf body input,
  html.imara-android-perf body select{
    touch-action:manipulation;
  }
  html.imara-android-perf body .sidebar,
  html.imara-android-perf body dialog::backdrop{
    backdrop-filter:none!important;
    -webkit-backdrop-filter:none!important;
  }
  html.imara-android-perf body .view:not(.hidden),
  html.imara-android-perf body .view:not(.hidden) *,
  html.imara-android-perf body .view:not(.hidden) *::before,
  html.imara-android-perf body .view:not(.hidden) *::after{
    animation:none!important;
    transition:none!important;
  }

  /* Reduce sombras/efectos que disparan capas GPU en Chrome Android */
  html.imara-android-perf body .card,
  html.imara-android-perf body .pos-order,
  html.imara-android-perf body .pos-kpi,
  html.imara-android-perf body .finance-kpi,
  html.imara-android-perf body .users-kpi,
  html.imara-android-perf body .personal-kpi,
  html.imara-android-perf body .pay-option,
  html.imara-android-perf body .pos-batch-v3{
    box-shadow:none!important;
    filter:none!important;
  }

  /* Render diferido de bloques largos: mantiene toda la información */
  html.imara-android-perf body #view-pos .pos-order,
  html.imara-android-perf body #view-finance .finance-event,
  html.imara-android-perf body #view-users .users-row,
  html.imara-android-perf body .personal-row,
  html.imara-android-perf body .personal-winner{
    content-visibility:auto;
    contain:layout paint style;
  }
  html.imara-android-perf body #view-pos .pos-order{contain-intrinsic-size:220px;}
  html.imara-android-perf body #view-finance .finance-event{contain-intrinsic-size:82px;}
  html.imara-android-perf body #view-users .users-row{contain-intrinsic-size:96px;}
  html.imara-android-perf body .personal-row,
  html.imara-android-perf body .personal-winner{contain-intrinsic-size:92px;}

  /* POS: evita decoraciones costosas; conserva colores, badges y estructura */
  html.imara-android-perf body #view-pos .pos-order::before,
  html.imara-android-perf body #view-pos .pos-order::after,
  html.imara-android-perf body #view-pos .pos-price::before,
  html.imara-android-perf body #view-pos .pos-price::after{
    display:none!important;
    content:none!important;
  }
  html.imara-android-perf body #view-pos .pos-order,
  html.imara-android-perf body #view-pos .pos-person,
  html.imara-android-perf body #view-pos .pay-option,
  html.imara-android-perf body #view-pos .pos-batch-v3{
    transform:none!important;
  }

  /* Scroll: menos repaints de tablas grandes */
  html.imara-android-perf body .table-wrap,
  html.imara-android-perf body .finance-table{
    overscroll-behavior:contain!important;
    contain:paint;
  }
}

@media(max-width:820px){
  /* Gama media: fondo más simple, sin perder identidad */
  html.imara-android-mid body{
    background:linear-gradient(180deg,#0e1320,#11192a)!important;
  }
  html.imara-android-mid body .card{
    background:#151d2f!important;
  }
  html.imara-android-mid body .finance-kpi,
  html.imara-android-mid body .users-kpi,
  html.imara-android-mid body .personal-kpi{
    background:#10182a!important;
  }
}

@media(max-width:820px){
  /* Gama baja: prioridad absoluta a fluidez y tacto */
  html.imara-android-low body{
    background:#0e1320!important;
  }
  html.imara-android-low body .card,
  html.imara-android-low body .public-main,
  html.imara-android-low body .public-hero{
    box-shadow:none!important;
  }
  html.imara-android-low body th,
  html.imara-android-low body td,
  html.imara-android-low body #view-cards th:first-child,
  html.imara-android-low body #view-cards td:first-child,
  html.imara-android-low body .finance-table th:first-child,
  html.imara-android-low body .finance-table td:first-child{
    position:static!important;
    left:auto!important;
  }
  html.imara-android-low body dialog::backdrop{
    background:rgba(0,0,0,.72)!important;
    backdrop-filter:none!important;
    -webkit-backdrop-filter:none!important;
  }
  html.imara-android-low body .brand-logo,
  html.imara-android-low body .public-logo,
  html.imara-android-low body .winner-banner,
  html.imara-android-low body .public-prize,
  html.imara-android-low body .num.latest{
    animation:none!important;
    box-shadow:none!important;
  }
  html.imara-android-low body #view-pos .pos-batch-v3-chips{
    max-height:64px!important;
  }
  html.imara-android-low body #view-pos .pos-chip,
  html.imara-android-low body .badge,
  html.imara-android-low body .finance-status,
  html.imara-android-low body .users-role{
    box-shadow:none!important;
  }
}
`;
document.head.appendChild(s);
})();
