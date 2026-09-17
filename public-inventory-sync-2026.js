/* Bingo IMARA · acceso al inventario público · SAFE 2026
   El inventario ya es calculado directamente por Supabase.
   Esta capa conserva únicamente el botón de acceso del Admin.
   No escribe show_state ni depende de una sesión Admin para publicar estados. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraPublicInventorySync2026)return;
window.__imaraPublicInventorySync2026=true;

function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
function inventoryUrl(){return new URL('inventario.html',location.href).href;}
function mountPublicInventoryButton(){
 if(!isAdmin())return;
 const actions=document.querySelector('#view-cards .section-title .actions');
 if(!actions||document.getElementById('openPublicInventoryBtn'))return;
 const btn=document.createElement('button');
 btn.type='button';
 btn.className='btn';
 btn.id='openPublicInventoryBtn';
 btn.textContent='🌐 Ver inventario público';
 btn.title='Abrir el inventario oficial que ven los participantes';
 btn.addEventListener('click',()=>window.open(inventoryUrl(),'_blank','noopener'));
 actions.appendChild(btn);
}
function boot(attempt=0){
 mountPublicInventoryButton();
 if(!document.getElementById('openPublicInventoryBtn')&&attempt<60)setTimeout(()=>boot(attempt+1),500);
}
document.addEventListener('click',e=>{
 if(e.target.closest?.('.nav [data-view="cards"]'))setTimeout(mountPublicInventoryButton,60);
 if(e.target.closest?.('#imaraLoginBtn'))setTimeout(mountPublicInventoryButton,1800);
},true);
window.addEventListener('focus',mountPublicInventoryButton);
window.IMARA_PUBLIC_INVENTORY_SYNC={
 publish:async()=>true,
 url:inventoryUrl,
 open:()=>window.open(inventoryUrl(),'_blank','noopener')
};
boot();
})();