/* Bingo IMARA · bienvenida + Web Push · aislado del juego */
(function(){
'use strict';
if(!location.hash.startsWith('#mobile='))return;
if(window.__imaraMobilePushOnboarding2026)return;window.__imaraMobilePushOnboarding2026=true;

const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-push-register';
let data=null,statusData=null,overlay=null;

function decode(){
 try{
  let s=location.hash.slice('#mobile='.length).replace(/-/g,'+').replace(/_/g,'/');
  while(s.length%4)s+='=';
  const bin=atob(s),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
 }catch{return null;}
}
function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);}
function standalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}
function b64Key(s){const pad='='.repeat((4-s.length%4)%4),base=(s+pad).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(base),a=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);return a;}
async function api(action,payload={}){
 const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),8000);
 try{
  const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,card_id:data.id,grid:data.grid,...payload})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||'No fue posible completar el proceso.');return d;
 }finally{clearTimeout(tm);}
}
async function sw(){
 if(!('serviceWorker' in navigator))return null;
 try{await navigator.serviceWorker.register('./sw.js?v=20260919-PUSH-1',{scope:'./'});return await navigator.serviceWorker.ready;}catch{return null;}
}
function css(){
 if(document.getElementById('imaraPushWelcomeCss'))return;
 const s=document.createElement('style');s.id='imaraPushWelcomeCss';s.textContent=`
 .imara-push-bell{width:100%;margin:10px 0 0;min-height:46px;border-radius:14px;border:1px solid rgba(141,107,255,.42);background:rgba(141,107,255,.12);color:#fff;font-weight:900;font-size:14px}
 .imara-welcome{position:fixed;inset:0;z-index:99999;background:rgba(4,8,18,.88);backdrop-filter:blur(10px);display:grid;place-items:center;padding:18px}
 .imara-welcome-card{width:min(520px,100%);max-height:92vh;overflow:auto;background:#121b2f;border:1px solid #354363;border-radius:24px;padding:22px;color:#fff;box-shadow:0 28px 80px rgba(0,0,0,.45)}
 .imara-welcome-logo{width:64px;height:64px;border-radius:19px;display:grid;place-items:center;background:linear-gradient(135deg,#ff5b8f,#8d6bff);font-weight:1000;font-size:22px;margin-bottom:14px}
 .imara-welcome h2{margin:0 0 8px;font-size:25px}.imara-welcome p{color:#d3daea;line-height:1.45}.imara-welcome ul{padding-left:20px;color:#d3daea;line-height:1.55}
 .imara-welcome-check{display:flex;gap:10px;align-items:flex-start;background:#18243d;border:1px solid #354363;border-radius:14px;padding:12px;margin:14px 0}
 .imara-welcome-check input{margin-top:3px;transform:scale(1.15)}
 .imara-welcome-actions{display:grid;gap:9px;margin-top:14px}.imara-welcome-actions button{min-height:50px;border:0;border-radius:14px;font-weight:900;font-size:15px}
 .imara-welcome-primary{background:linear-gradient(135deg,#ff5b8f,#8d6bff);color:#fff}.imara-welcome-secondary{background:#26334f;color:#fff}
 .imara-welcome-note{font-size:12px;color:#9ca9bf;margin-top:10px}.imara-welcome-success{text-align:center;font-size:42px;margin:8px 0}
 .imara-ios-steps{display:grid;gap:10px;margin:14px 0}
 .imara-ios-step{display:grid;grid-template-columns:34px 1fr;gap:10px;align-items:start;background:#18243d;border:1px solid #354363;border-radius:14px;padding:12px}
 .imara-ios-step b{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#ff5b8f,#8d6bff);color:#fff}
 .imara-ios-step strong{display:block;margin-bottom:3px}.imara-ios-step span{display:block;color:#cfd7e7;font-size:13px;line-height:1.4}
 .imara-apple-link{display:block;text-align:center;margin-top:10px;color:#bdaeff;font-weight:800;text-decoration:none}
 `;document.head.appendChild(s);
}
function shell(html){
 css();overlay?.remove();overlay=document.createElement('div');overlay.className='imara-welcome';overlay.innerHTML='<div class="imara-welcome-card">'+html+'</div>';document.body.appendChild(overlay);return overlay;
}
function close(){overlay?.remove();overlay=null;mountBell();}
async function markPermission(st){try{await api('permission',{status:st});}catch(_){}}
async function subscribePush(){
 const reg=await sw();if(!reg||!('PushManager' in window))throw new Error('Este navegador no permite notificaciones web.');
 let sub=await reg.pushManager.getSubscription();
 if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64Key(statusData.vapid_public_key)});
 const j=sub.toJSON();
 await api('subscribe',{subscription:j,target_url:location.href});
 statusData={...(statusData||{}),notification_status:'granted',active_subscriptions:1};
 document.getElementById('imaraPushBell')?.remove();
}
function showDone(){
 const h=shell(`<div class="imara-welcome-success">✅</div><h2>Todo listo</h2><p>Tu cartón sigue listo para jugar y este dispositivo quedó preparado para recibir recordatorios de Bingo IMARA.</p><div class="imara-welcome-actions"><button class="imara-welcome-primary" id="imaraDone">Entrar a mi cartón</button></div>`);
 h.querySelector('#imaraDone').onclick=close;
}
function showIOS(){
 markPermission('ios_install_required');
 const h=shell(`<div class="imara-welcome-logo">IM</div>
 <h2>Instala Bingo IMARA en tu iPhone 🍎</h2>
 <p>Tu ingreso ya quedó confirmado. Para que el iPhone pueda recibir los recordatorios del Bingo, Apple requiere abrir Bingo IMARA como una app desde la pantalla de inicio.</p>
 <div class="imara-ios-steps">
  <div class="imara-ios-step"><b>1</b><div><strong>Quédate en Safari</strong><span>Si abriste el enlace desde WhatsApp, Instagram u otra app, usa la opción para abrirlo en Safari.</span></div></div>
  <div class="imara-ios-step"><b>2</b><div><strong>Toca Compartir ⬆️</strong><span>Busca el botón de compartir de Safari. Puede aparecer en la barra inferior o superior, según tu configuración.</span></div></div>
  <div class="imara-ios-step"><b>3</b><div><strong>Busca “Agregar a Inicio”</strong><span>Desliza la lista de opciones hacia abajo y toca <strong>Agregar a Inicio</strong>.</span></div></div>
  <div class="imara-ios-step"><b>4</b><div><strong>Si no aparece</strong><span>Ve hasta el final, toca <strong>Editar acciones</strong> y agrega <strong>Agregar a Inicio</strong>.</span></div></div>
  <div class="imara-ios-step"><b>5</b><div><strong>Activa “Abrir como app web”</strong><span>Déjalo activado para que Bingo IMARA se abra como una app independiente.</span></div></div>
  <div class="imara-ios-step"><b>6</b><div><strong>Toca “Agregar”</strong><span>El icono de Bingo IMARA aparecerá en tu pantalla de inicio.</span></div></div>
  <div class="imara-ios-step"><b>7</b><div><strong>Abre Bingo IMARA desde el nuevo icono</strong><span>No vuelvas a Safari para este paso. Al abrir el icono, detectaremos automáticamente que ya quedó instalado.</span></div></div>
  <div class="imara-ios-step"><b>8</b><div><strong>Activa las notificaciones</strong><span>Te mostraremos inmediatamente el botón <strong>Activar notificaciones</strong>. Tócalo y luego elige <strong>Permitir</strong> en el aviso oficial del iPhone.</span></div></div>
 </div>
 <p class="imara-welcome-note">Tu cartón ya está pago y válido. Instalar Bingo IMARA solo permite usarlo como app y recibir recordatorios del evento.</p>
 <a class="imara-apple-link" href="https://support.apple.com/es-lamr/guide/iphone/iphea86e5236/ios" target="_blank" rel="noopener"> Ver instrucciones oficiales de Apple</a>
 <div class="imara-welcome-actions"><button class="imara-welcome-primary" id="imaraIOSOk">Ya entendí los pasos</button></div>`);
 h.querySelector('#imaraIOSOk').onclick=close;
}
async function notificationStep(){
 if(isIOS()&&!standalone()){showIOS();return;}
 if(!('Notification' in window)||!('PushManager' in window)||!('serviceWorker' in navigator)){
   await markPermission('unsupported');
   const h=shell(`<div class="imara-welcome-logo">IM</div><h2>Ingreso confirmado ✅</h2><p>Este navegador no ofrece notificaciones web, pero tu cartón funciona normalmente y ya quedó confirmado.</p><div class="imara-welcome-actions"><button class="imara-welcome-primary" id="imaraUnsupported">Entrar al cartón</button></div>`);
   h.querySelector('#imaraUnsupported').onclick=close;return;
 }
 if(Notification.permission==='granted'){
   try{await subscribePush();showDone();}catch(e){close();}return;
 }
 if(Notification.permission==='denied'){
   await markPermission('denied');
   const h=shell(`<div class="imara-welcome-logo">IM</div><h2>Ingreso confirmado</h2><p>Las notificaciones están bloqueadas en este navegador. No pasa nada: tu cartón continúa listo para jugar.</p><div class="imara-welcome-actions"><button class="imara-welcome-primary" id="imaraDenied">Entrar al cartón</button></div>`);
   h.querySelector('#imaraDenied').onclick=close;return;
 }
 const h=shell(`<div class="imara-welcome-logo">IM</div><h2>Activa tus recordatorios 🔔</h2><p>Podremos avisarte cuando se acerque el Bingo o cuando haya información importante del evento. Al activarlos desde cualquiera de tus cartones, quedarán habilitados para todos los cartones asociados a tu nombre en este dispositivo. Solo enviaremos comunicaciones relacionadas con Bingo IMARA.</p><div class="imara-welcome-actions"><button class="imara-welcome-primary" id="imaraAllowPush">Permitir notificaciones</button><button class="imara-welcome-secondary" id="imaraNotNow">Ahora no</button></div><p class="imara-welcome-note">Las notificaciones son opcionales, aplican a todo tu grupo de cartones y no cambian la validez de ninguno.</p>`);
 h.querySelector('#imaraAllowPush').onclick=async()=>{
  const b=h.querySelector('#imaraAllowPush');b.disabled=true;b.textContent='Preparando…';
  try{
   const p=await Notification.requestPermission();
   if(p==='granted'){await subscribePush();showDone();}else{await markPermission('denied');close();}
  }catch(e){close();}
 };
 h.querySelector('#imaraNotNow').onclick=async()=>{await markPermission('pending');close();};
}
function firstWelcome(){
 const h=shell(`<div class="imara-welcome-logo">IM</div><h2>Bienvenido a Bingo IMARA 🎉</h2><p><strong>${String(data.buyer||'Participante')}</strong>, tu cartón <strong>${String(data.id)}</strong> ya está asignado y listo para jugar.</p><ul><li>Esta confirmación <strong>no activa ni modifica</strong> el pago o la validez del cartón.</li><li>El enlace identifica tu cartón digital; evita compartirlo con otras personas.</li><li>Los recordatorios son opcionales y estarán relacionados únicamente con el evento.</li></ul><label class="imara-welcome-check"><input type="checkbox" id="imaraTerms"><span>Confirmo mi ingreso a Bingo IMARA y acepto estas condiciones de acceso y el uso de este canal para gestionar recordatorios del evento.</span></label><div class="imara-welcome-actions"><button class="imara-welcome-primary" id="imaraConfirmEntry" disabled>Confirmar mi ingreso</button></div><p class="imara-welcome-note">Si no activas notificaciones, podrás jugar normalmente.</p>`);
 const ck=h.querySelector('#imaraTerms'),bt=h.querySelector('#imaraConfirmEntry');ck.onchange=()=>bt.disabled=!ck.checked;
 bt.onclick=async()=>{bt.disabled=true;bt.textContent='Confirmando…';try{await api('confirm');statusData={...(statusData||{}),confirmed:true};await notificationStep();}catch(e){bt.disabled=false;bt.textContent='Confirmar mi ingreso';alert(e.message||'No fue posible confirmar. Tu cartón sigue disponible.');}};
}
function mountBell(){
 if(statusData?.notification_status==='granted'){
   document.getElementById('imaraPushBell')?.remove();
   return;
 }
 if(document.getElementById('imaraPushBell'))return;
 const note=document.querySelector('.mobile-note');if(!note)return;
 const b=document.createElement('button');b.type='button';b.id='imaraPushBell';b.className='imara-push-bell';b.textContent='🔔 Recordatorios';
 b.onclick=async()=>{if(!statusData){try{statusData=await api('status');}catch{return;}}await notificationStep();};
 note.insertAdjacentElement('afterend',b);
}
async function init(){
 data=decode();if(!data?.id||!Array.isArray(data.grid))return;css();sw();
 try{statusData=await api('status');}catch(_){mountBell();return;}
 mountBell();
 if(!statusData.confirmed){firstWelcome();return;}
 if(isIOS()&&standalone()&&statusData.notification_status==='ios_install_required'){
   await notificationStep();
 }
}
setTimeout(init,0);
})();