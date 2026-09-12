/* Bingo IMARA · Mobile Private Optimization 2026
   Capa unica para Admin / Miembro / Finanzas en pantallas pequenas.
   Conserva estetica y funcionalidad; reduce efectos costosos y mejora proporciones/touch.
   Sin polling, MutationObserver ni cambios de datos. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(document.getElementById('imaraMobilePrivateOptimization2026'))return;
const s=document.createElement('style');
s.id='imaraMobilePrivateOptimization2026';
s.textContent=`
@media (max-width:820px){
  /* Rendimiento general privado */
  html{scroll-behavior:auto!important}
  body{overflow-x:hidden}
  body .view:not(.hidden),
  body .view:not(.hidden) *,
  body .view:not(.hidden) *::before,
  body .view:not(.hidden) *::after{
    animation:none!important;
    transition:none!important;
  }
  body .card,
  body .card:hover{
    transform:none!important;
    box-shadow:0 8px 24px rgba(0,0,0,.20)!important;
  }
  body .btn,body .mini,body button,
  body .btn:hover,body .mini:hover,body button:hover,
  body .btn:active,body .mini:active,body button:active{
    transform:none!important;
    filter:none!important;
  }
  body .sidebar{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}

  /* Estructura movil comun */
  body .app{display:block!important;min-width:0!important}
  body .sidebar{position:static!important;height:auto!important;padding:14px 12px!important;border-right:0!important;border-bottom:1px solid var(--line)!important}
  body .brand{margin-bottom:12px!important;gap:9px!important}
  body .brand-logo{width:40px!important;height:40px!important;border-radius:13px!important;animation:none!important}
  body .brand h1{font-size:16px!important}
  body .nav{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
  body .nav button{min-height:44px!important;padding:10px 11px!important;font-size:12px!important;line-height:1.2!important;white-space:normal!important}
  body .sidebar-footer{display:none!important}
  body .content{padding:12px!important;width:100%!important;min-width:0!important}
  body .topbar{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;margin-bottom:14px!important}
  body .topbar h2{font-size:23px!important;line-height:1.1!important}
  body .topbar p{font-size:12px!important;line-height:1.35!important}
  body .topbar>.actions{width:100%!important}
  body .topbar>.actions .btn{flex:1 1 140px!important}
  body .card{padding:13px!important;border-radius:16px!important}
  body .section-title{align-items:flex-start!important;gap:8px!important;flex-wrap:wrap!important}
  body .section-title h3{font-size:16px!important;line-height:1.25!important}
  body .actions{gap:6px!important}
  body .btn{min-height:42px!important;padding:9px 11px!important;border-radius:11px!important;font-size:12px!important}
  body .mini{min-height:36px!important;padding:7px 9px!important;font-size:10px!important}
  body .input,body input,body select,body textarea{font-size:16px!important;max-width:100%!important}
  body .filters{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}
  body .filters .input{width:100%!important;min-width:0!important}
  body dialog{width:calc(100% - 18px)!important;max-height:92dvh!important;overflow:auto!important;border-radius:18px!important}
  body .modal-head,body .modal-body,body .modal-foot{padding:13px!important}
  body .modal-foot{flex-wrap:wrap!important}
  body .modal-foot .btn{flex:1 1 120px!important}

  /* Tablas: scroll horizontal estable y primera columna visible */
  body .table-wrap,body .finance-table{
    overflow:auto!important;
    -webkit-overflow-scrolling:touch!important;
    overscroll-behavior-inline:contain!important;
    border-radius:13px!important;
  }
  body table{font-size:11px!important}
  body th,body td{padding:9px 8px!important;font-size:11px!important;vertical-align:top!important}
  body #view-cards table{min-width:760px!important}
  body .finance-table table{min-width:920px!important}
  body #view-cards th:first-child,body #view-cards td:first-child,
  body .finance-table th:first-child,body .finance-table td:first-child{
    position:sticky!important;
    left:0!important;
    z-index:3!important;
    background:#151f35!important;
  }
  body #view-cards th:first-child,body .finance-table th:first-child{z-index:5!important;background:#18223a!important}

  /* Inicio / resumen personal */
  body .grid.kpis,body .personal-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
  body .kpi .value,body .personal-kpi strong{font-size:21px!important}
  body .personal-grid{grid-template-columns:1fr!important;gap:10px!important}
  body .personal-row,body .personal-winner{padding:10px!important;border-radius:13px!important;content-visibility:auto;contain-intrinsic-size:90px}
  body .personal-row-top{gap:7px!important}

  /* POS / Caja: ligero y proporcionado */
  body #view-pos .pos-wrap{gap:10px!important}
  body #view-pos .pos-grid{grid-template-columns:1fr!important;gap:10px!important}
  body #view-pos .pos-head{align-items:flex-start!important}
  body #view-pos .pos-price-strip{display:grid!important;grid-template-columns:1fr 1fr!important;width:100%!important;gap:7px!important}
  body #view-pos .pos-price{padding:9px!important;border-radius:12px!important}
  body #view-pos .pos-price strong{font-size:17px!important}
  body #view-pos .pos-form{grid-template-columns:1fr!important;gap:8px!important}
  body #view-pos .pos-form .full{grid-column:auto!important}
  body #view-pos .pos-total{padding:11px!important;border-radius:13px!important;align-items:center!important}
  body #view-pos .pos-total strong{font-size:24px!important}
  body #view-pos .pos-person{grid-template-columns:1fr!important;gap:7px!important;padding:9px!important;border-radius:12px!important}
  body #view-pos .pos-person label:last-child{grid-column:auto!important}
  body #view-pos .pos-person .tag{padding-bottom:2px!important}
  body #view-pos .pay-option{grid-template-columns:40px minmax(0,1fr)!important;padding:9px!important;border-radius:12px!important}
  body #view-pos .pay-option .actions{grid-column:1/-1!important;width:100%!important}
  body #view-pos .pay-option .actions .mini{flex:1 1 100px!important}
  body #view-pos .pos-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
  body #view-pos .pos-kpi{padding:10px!important;border-radius:12px!important}
  body #view-pos .pos-kpi strong{font-size:18px!important}
  body #view-pos .pos-order{
    padding:11px!important;
    border-radius:14px!important;
    box-shadow:none!important;
    content-visibility:auto;
    contain-intrinsic-size:210px;
  }
  body #view-pos .pos-order.approved::after{display:none!important;content:none!important}
  body #view-pos .pos-order-top{display:block!important}
  body #view-pos .pos-status{display:inline-flex!important;margin-top:6px!important}
  body #view-pos .pos-order-actions{gap:5px!important}
  body #view-pos .pos-order-actions .mini{flex:1 1 118px!important}
  body #view-pos .pos-lines{gap:5px!important}
  body #view-pos .pos-chip{font-size:9px!important;padding:4px 7px!important}
  body #view-pos .pos-batch-v3{padding:10px!important;border-radius:12px!important}
  body #view-pos .pos-batch-v3-chips{max-height:82px!important;overflow:auto!important}
  body #view-pos .pos-bars{display:none!important}
  body #view-pos .pos-config-grid{grid-template-columns:1fr!important}
  body #view-pos .pos-config-grid .full{grid-column:auto!important}

  /* Finanzas */
  body #view-finance .finance-view{gap:10px!important}
  body #view-finance .finance-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
  body #view-finance .finance-kpi{padding:10px!important;border-radius:13px!important}
  body #view-finance .finance-kpi strong{font-size:20px!important}
  body #view-finance .finance-toolbar{display:grid!important;grid-template-columns:1fr!important;width:100%!important}
  body #view-finance .finance-toolbar .input{width:100%!important;min-width:0!important}
  body #view-finance .finance-actions{min-width:150px!important}
  body #view-finance .finance-actions .mini{width:100%!important;justify-content:flex-start!important}
  body #view-finance .finance-event{content-visibility:auto;contain-intrinsic-size:80px;padding:9px!important}

  /* Usuarios */
  body #view-users .users-layout{grid-template-columns:1fr!important;gap:10px!important}
  body #view-users .users-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
  body #view-users .users-kpi{padding:10px!important;border-radius:13px!important}
  body #view-users .users-kpi strong{font-size:20px!important}
  body #view-users .users-row{grid-template-columns:1fr!important;gap:8px!important;padding:10px!important;content-visibility:auto;contain-intrinsic-size:95px}
  body #view-users .users-row>.actions{width:100%!important}
  body #view-users .users-row>.actions .mini{flex:1 1 110px!important}
  body #view-users .users-toolbar .input{width:100%!important}

  /* Cartones: mantiene controles estaticos y accesibles */
  body #view-cards .cards-v3-top{display:grid!important;grid-template-columns:1fr!important}
  body #view-cards .cards-v3-kpis{gap:5px!important}
  body #view-cards .cards-v3-actions{display:grid!important;grid-template-columns:1fr!important;width:100%!important}
  body #view-cards .cards-v3-actions label{min-width:0!important;width:100%!important}
  body #view-cards .cards-v3-actions .btn{width:100%!important}
  body #view-cards td:last-child,body #view-cards th:last-child{min-width:175px!important}
  body #view-cards .mini-actions{display:grid!important;grid-template-columns:1fr!important}
  body #view-cards .mini-actions .mini{width:100%!important}

  /* Juego/validacion: proporcional sin tocar la logica */
  body .game-layout,body .two{grid-template-columns:1fr!important}
  body .last-ball{width:140px!important;height:140px!important;font-size:48px!important}
  body .board{grid-template-columns:repeat(10,minmax(0,1fr))!important;gap:4px!important}
  body .num{border-radius:8px!important;font-size:11px!important}
}
@media (max-width:430px){
  body .content{padding:9px!important}
  body .nav{grid-template-columns:1fr 1fr!important}
  body .grid.kpis,body .personal-kpis,body #view-pos .pos-kpis,body #view-finance .finance-kpis,body #view-users .users-kpis{grid-template-columns:1fr 1fr!important}
  body #view-pos .pos-price-strip{grid-template-columns:1fr 1fr!important}
  body .card{padding:11px!important}
  body .topbar h2{font-size:21px!important}
}
`;
document.head.appendChild(s);
})();
