/* Bingo IMARA · Estabilidad puntos 6–10 · SAFE 2026
   Capa aditiva: protege modo de balotas con operación real y refuerza redundancia Admin.
   No cambia POS, precios, cartones, premios, rondas, BINGO ni diseño base. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraStability610)return;window.__imaraStability610=true;

const PUBLIC_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-public';
const PRIVATE_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
const SESSION='imaraPrivateSessionV1';
let cloudCardCount=null,activeAdmins=null,loadingInventory=false,loadingAdmins=false;

function token(){return sessionStorage.getItem(SESSION)||'';}
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
function notify(msg){try{if(typeof toast==='function')toast(msg);else alert(msg);}catch(e){alert(msg);}}
async function post(url,action,payload={},auth=false){
 const h={'Content-Type':'application/json'};if(auth&&token())h.Authorization='Bearer '+token();
 const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),10000);
 try{const r=await fetch(url,{method:'POST',headers:h,cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'No fue posible consultar la protección.');return d;}finally{clearTimeout(tm);}
}
function localOperationExists(){
 try{return !!((state?.cards?.length||0)||(state?.drawn?.length||0)||(state?.winners?.length||0));}catch{return false;}
}
function protectedMode(){return cloudCardCount>0||localOperationExists();}
function ballModeValue(){try{return Number(state?.settings?.ballMax||99);}catch{return 99;}}
function guardNote(){
 const sel=document.getElementById('settingBallMax');if(!sel)return;
 let n=document.getElementById('ballModeSafety610');
 if(!n){n=document.createElement('div');n.id='ballModeSafety610';n.className='notice';n.style.marginTop='10px';const parent=sel.closest('label')?.parentElement||sel.parentElement;parent?.appendChild(n);}
 const locked=protectedMode();
 if(locked){
   sel.value=String(ballModeValue());
   sel.disabled=true;sel.dataset.imara610Locked='1';
   n.innerHTML='🔒 <strong>Modo de balotas protegido.</strong> Ya existe operación real, por lo que cambiar 75/90/99 queda bloqueado para evitar borrar o invalidar cartones, balotas o ganadores.';
   n.style.display='block';
 }else{
   if(sel.dataset.imara610Locked==='1'){sel.disabled=false;delete sel.dataset.imara610Locked;}
   n.style.display='none';
 }
}
async function refreshInventoryGuard(){
 if(loadingInventory)return;loadingInventory=true;
 try{const d=await post(PUBLIC_API,'public-inventory');cloudCardCount=Number(d?.inventory?.total??d?.inventory?.items?.length??0);}
 catch(e){console.warn('Protección modo balotas:',e.message||e);}
 finally{loadingInventory=false;guardNote();}
}
function adminNotice(){
 const host=document.getElementById('view-users');if(!host||!isAdmin())return;
 let n=document.getElementById('adminRedundancy610');
 if(!n){n=document.createElement('div');n.id='adminRedundancy610';n.style.margin='0 0 14px';const first=host.querySelector('.card');first?.insertAdjacentElement('afterend',n);}
 const count=Number(activeAdmins||0);
 if(count>=2){n.className='success';n.innerHTML=`✅ <strong>Redundancia Admin activa:</strong> hay ${count} administradores activos. La base también impide eliminar o desactivar accidentalmente al último Admin.`;}
 else{n.className='notice';n.innerHTML='🛡️ <strong>Protección del Admin principal activa.</strong> Actualmente hay 1 Admin activo. El último Admin ya no puede eliminarse ni desactivarse; para tener redundancia operativa crea un segundo usuario con rol <strong>Admin</strong> usando el formulario existente.';}
}
async function refreshAdminSafety(){
 if(!isAdmin()||!token()||loadingAdmins)return;loadingAdmins=true;
 try{const d=await post(PRIVATE_API,'users',{},true);activeAdmins=(d.users||[]).filter(u=>u.role==='admin'&&u.active).length;adminNotice();}
 catch(e){console.warn('Protección Admin:',e.message||e);}
 finally{loadingAdmins=false;}
}

document.addEventListener('click',e=>{
 const t=e.target;
 if(t.closest?.('.nav [data-view="settings"]'))setTimeout(()=>{guardNote();refreshInventoryGuard();},80);
 if(t.closest?.('.nav [data-view="users"]'))setTimeout(refreshAdminSafety,120);
 if(t.closest?.('#imaraLoginBtn')){setTimeout(refreshInventoryGuard,1700);setTimeout(refreshAdminSafety,1900);}
 const save=t.closest?.('#saveSettingsBtn');
 if(save&&protectedMode()){
   const sel=document.getElementById('settingBallMax'),current=ballModeValue(),chosen=Number(sel?.value||current);
   if(chosen!==current){e.preventDefault();e.stopImmediatePropagation();if(sel)sel.value=String(current);notify('🔒 No se cambió el modo de balotas porque ya existe operación real.');}
 }
},true);

document.addEventListener('change',e=>{
 if(e.target?.id==='settingBallMax'&&protectedMode()){
   e.preventDefault();e.stopImmediatePropagation();e.target.value=String(ballModeValue());notify('🔒 El modo de balotas está protegido mientras existan cartones u operación del evento.');
 }
},true);

window.addEventListener('focus',()=>{refreshInventoryGuard();if(document.getElementById('view-users')&&!document.getElementById('view-users').classList.contains('hidden'))refreshAdminSafety();});
window.addEventListener('online',refreshInventoryGuard);
setTimeout(refreshInventoryGuard,1200);
})();