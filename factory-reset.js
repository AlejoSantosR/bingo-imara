/* BINGO IMARA · Reinicio de fábrica estable 2026
   Borra la operación; conserva el código y la cuenta Admin actual.
   Sin MutationObserver ni polling permanente de DOM. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraFactoryResetStable)return;window.__imaraFactoryResetStable=true;

const RESET_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-reset';
const SESSION_KEY='imaraPrivateSessionV1';
let busy=false;

function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
function bingoLocalKeys(){
  const keys=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i)||'';
    if(k==='bingoImaraStateV2'||k==='bingoImaraPlayableDemoV1'||k==='imaraPublicSound'||k.startsWith('imaraMobileMarks:'))keys.push(k);
  }
  return keys;
}
function cleanLocalBingo(){bingoLocalKeys().forEach(k=>localStorage.removeItem(k));}

async function factoryReset(button){
  if(busy)return;
  if(!isAdmin()){alert('Solo Admin puede reiniciar la aplicación.');return;}
  if(!confirm('♻️ RESTABLECER BINGO IMARA\n\nSe eliminarán cartones, ventas, pagos, ganadores, balotas y usuarios Miembro de la operación.\n\nEl sistema, su diseño, precios, módulos y la cuenta Admin actual NO se eliminan.\n\n¿Continuar?'))return;
  const typed=prompt('Para confirmar, escribe exactamente: REINICIAR','');
  if(typed!=='REINICIAR'){alert('Reinicio cancelado.');return;}
  if(!confirm('Última confirmación: los datos operativos se borrarán de la nube. ¿Restablecer ahora?'))return;

  const auth=token();
  if(!auth){alert('Tu sesión Admin no está disponible. Vuelve a iniciar sesión.');return;}
  const old=button.textContent;busy=true;button.disabled=true;button.textContent='♻️ Restableciendo…';
  try{
    const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),20000);
    let r,d={};
    try{
      r=await fetch(RESET_API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+auth},cache:'no-store',signal:ctl.signal,body:JSON.stringify({confirmation:'REINICIAR'})});
      try{d=await r.json();}catch(e){}
    }finally{clearTimeout(tm);}
    if(!r.ok)throw new Error(d.error||'No fue posible restablecer la aplicación.');
    cleanLocalBingo();
    try{if(typeof bc!=='undefined'&&bc)bc.postMessage({type:'sync',t:Date.now()});}catch(e){}
    alert('✅ Bingo IMARA fue restablecido.\n\nSe eliminó la operación anterior y se conservó tu cuenta Admin. Al volver a cargar, el inventario automático preparará el primer lote y su lote de reserva.');
    location.reload();
  }catch(e){
    alert(e.name==='AbortError'?'El servidor tardó demasiado. Intenta nuevamente.':(e.message||'No fue posible restablecer la aplicación.'));
    busy=false;button.disabled=false;button.textContent=old;
  }
}

function mount(){
  const localWipe=document.getElementById('wipeBtn');
  if(localWipe){localWipe.textContent='🧹 Borrar solo datos locales';localWipe.title='Limpia únicamente este navegador; no borra la operación de la nube.';}
  const settings=document.querySelector('#view-settings .grid.two');
  if(!settings)return false;
  let card=document.getElementById('factoryResetCard');
  if(!isAdmin()){card?.remove();return false;}
  if(card)return true;
  card=document.createElement('div');card.id='factoryResetCard';card.className='card';card.style.gridColumn='1 / -1';
  card.innerHTML=`<div class="section-title"><div><h3>♻️ Restablecer Bingo IMARA</h3><div class="muted" style="margin-top:4px">Limpia la operación y deja el sistema listo para comenzar de nuevo.</div></div></div><div class="danger" style="margin-bottom:12px"><strong>Operación:</strong> elimina cartones, ventas, pagos, ganadores, balotas y usuarios Miembro. Conserva el sistema y tu cuenta Admin.</div><div class="notice" style="margin-bottom:12px">💡 Descarga un Backup JSON antes si quieres conservar los datos actuales.</div><button class="btn bad" id="factoryResetBtn" type="button">♻️ Restablecer de fábrica</button>`;
  settings.appendChild(card);
  card.querySelector('#factoryResetBtn').onclick=e=>factoryReset(e.currentTarget);
  return true;
}

function scheduleMount(){[0,400,1000,2200,4500].forEach(ms=>setTimeout(mount,ms));}
document.addEventListener('click',e=>{
  if(e.target.closest?.('.nav [data-view="settings"]')||e.target.closest?.('#imaraLoginBtn'))scheduleMount();
  if(e.target.closest?.('#imaraLogout'))setTimeout(()=>document.getElementById('factoryResetCard')?.remove(),0);
},true);
window.addEventListener('focus',()=>{if(!document.getElementById('view-settings')?.classList.contains('hidden'))mount();});
scheduleMount();
})();