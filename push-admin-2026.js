/* Bingo IMARA · Notificaciones Push Admin · manual */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraPushAdmin2026)return;window.__imaraPushAdmin2026=true;

const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-push-admin';
const SESSION_KEY='imaraPrivateSessionV1';
let data=null,loading=false,wired=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
function fmt(v){if(!v)return '—';try{return new Intl.DateTimeFormat('es-CO',{dateStyle:'short',timeStyle:'short'}).format(new Date(v));}catch{return '—';}}
async function api(action,payload={}){
 const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),20000);
 try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});const d=await r.json();if(!r.ok)throw new Error(d.error||'No fue posible completar la operación.');return d;}finally{clearTimeout(tm);}
}
function css(){
 if(document.getElementById('imaraPushAdminCss'))return;
 const s=document.createElement('style');s.id='imaraPushAdminCss';s.textContent=`
 #view-push .push-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:14px 0}
 #view-push .push-kpi{padding:14px;border:1px solid var(--line);border-radius:16px;background:#111a2d}.push-kpi small{display:block;color:var(--muted);margin-bottom:5px}.push-kpi strong{font-size:27px}
 #view-push .push-compose{display:grid;grid-template-columns:1fr 1fr;gap:12px}.push-compose .full{grid-column:1/-1}.push-compose textarea{min-height:96px;resize:vertical}
 #view-push .push-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
 @media(max-width:820px){#view-push .push-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}#view-push .push-compose{grid-template-columns:1fr}.push-compose .full{grid-column:auto}}
 `;document.head.appendChild(s);
}
function mount(){
 if(!isAdmin())return false;css();const nav=document.querySelector('.nav');if(!nav)return false;
 let btn=document.getElementById('imaraPushNav');if(!btn){btn=document.createElement('button');btn.id='imaraPushNav';btn.dataset.view='push';btn.textContent='🔔 Notificaciones';const act=document.getElementById('imaraActivityNav');(act||nav.querySelector('[data-view="cards"]'))?.insertAdjacentElement('afterend',btn);}
 let view=document.getElementById('view-push');
 if(!view){
  view=document.createElement('section');view.id='view-push';view.className='view hidden';view.innerHTML=`
  <div class="card">
   <div class="section-title"><div><h3>🔔 Recordatorios Push</h3><div class="muted">Envía avisos solo a dispositivos que aceptaron notificaciones de Bingo IMARA.</div></div><button class="btn" id="pushRefresh">🔄 Actualizar</button></div>
   <div class="push-kpis">
    <div class="push-kpi"><small>Cartones vendidos/asignados</small><strong id="pushSold">0</strong></div>
    <div class="push-kpi"><small>Ingreso confirmado</small><strong id="pushConfirmed">0</strong></div>
    <div class="push-kpi"><small>🔔 Dispositivos Push</small><strong id="pushActive">0</strong></div>
    <div class="push-kpi"><small>Notificaciones denegadas</small><strong id="pushDenied">0</strong></div>
    <div class="push-kpi"><small>iPhone pendiente instalación</small><strong id="pushIOS">0</strong></div>
   </div>
  </div>
  <div class="card" style="margin-top:14px">
   <h3 style="margin-top:0">Nuevo recordatorio</h3>
   <div class="push-compose">
    <label>Título<input class="input" id="pushTitle" maxlength="80" value="Bingo IMARA 🎉"></label>
    <label>Cartón específico (opcional)<input class="input" id="pushTarget" placeholder="Ej. IMARA-001"></label>
    <label class="full">Mensaje<textarea class="input" id="pushBody" maxlength="240" placeholder="Escribe el recordatorio que recibirán los participantes."></textarea></label>
   </div>
   <div class="push-actions"><button class="btn primary" id="pushSend">🔔 Enviar notificación</button><span class="muted" id="pushStatus">Nada se envía hasta que confirmes.</span></div>
  </div>
  <div class="card" style="margin-top:14px"><div class="section-title"><h3>Historial de envíos</h3></div><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Título</th><th>Destino</th><th>Intentados</th><th>Enviados</th><th>Fallidos</th></tr></thead><tbody id="pushHistory"><tr><td colspan="6" class="muted">Pulsa Actualizar para consultar.</td></tr></tbody></table></div></div>`;
  document.querySelector('main.content')?.appendChild(view);
 }
 if(btn.dataset.imaraPushWired!=='1'){btn.dataset.imaraPushWired='1';btn.onclick=show;}
 if(view.dataset.imaraPushWired!=='1'){
  view.dataset.imaraPushWired='1';
  view.querySelector('#pushRefresh').onclick=()=>refresh(true);
  view.querySelector('#pushSend').onclick=send;
 }
 wired=true;
 return true;
}
function show(){
 document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));document.getElementById('view-push')?.classList.remove('hidden');document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view==='push'));
 const t=document.getElementById('pageTitle'),s=document.getElementById('pageSubtitle');if(t)t.textContent='Notificaciones';if(s)s.textContent='Recordatorios manuales para participantes que aceptaron Push.';
}
function render(){
 if(!data)return;const s=data.summary||{},set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=String(v??0);};
 set('pushSold',s.sold);set('pushConfirmed',s.confirmed);set('pushActive',s.push_active);set('pushDenied',s.denied);set('pushIOS',s.ios_pending);
 const h=document.getElementById('pushHistory');if(h)h.innerHTML=(data.history||[]).length?(data.history||[]).map(x=>`<tr><td>${fmt(x.created_at)}</td><td><strong>${esc(x.title)}</strong><div class="muted">${esc(x.body)}</div></td><td>${esc(x.target_card_id||'Todos')}</td><td>${Number(x.attempted_count)||0}</td><td>${Number(x.sent_count)||0}</td><td>${Number(x.failed_count)||0}</td></tr>`).join(''):'<tr><td colspan="6" class="muted">Todavía no hay envíos.</td></tr>';
}
async function refresh(showError){
 if(loading||!isAdmin()||!token())return;loading=true;const b=document.getElementById('pushRefresh'),old=b?.textContent;if(b){b.disabled=true;b.textContent='⏳ Consultando…';}
 try{data=await api('overview');render();}catch(e){if(showError)alert(e.message);}finally{loading=false;if(b){b.disabled=false;b.textContent=old||'🔄 Actualizar';}}
}
async function send(){
 if(loading)return;const title=document.getElementById('pushTitle')?.value.trim()||'',body=document.getElementById('pushBody')?.value.trim()||'',target=document.getElementById('pushTarget')?.value.trim().toUpperCase()||'';
 if(!title||!body){alert('Escribe el título y el mensaje.');return;}
 const scope=target?`el cartón ${target}`:'todos los dispositivos suscritos';
 if(!confirm(`¿Enviar este recordatorio a ${scope}?\n\n${title}\n${body}`))return;
 loading=true;const b=document.getElementById('pushSend'),st=document.getElementById('pushStatus');b.disabled=true;b.textContent='⏳ Enviando…';if(st)st.textContent='Procesando envío…';
 try{
  const r=await api('send',{title,body,target_card_id:target||null});
  if(st)st.textContent=`Intentados: ${r.attempted} · enviados: ${r.sent} · fallidos: ${r.failed}`;
  alert(`✅ Envío terminado\nIntentados: ${r.attempted}\nEnviados: ${r.sent}\nFallidos: ${r.failed}`);
  data=await api('overview');render();
 }catch(e){if(st)st.textContent=e.message;alert(e.message);}finally{loading=false;b.disabled=false;b.textContent='🔔 Enviar notificación';}
}
function cleanup(){document.getElementById('imaraPushNav')?.remove();document.getElementById('view-push')?.remove();wired=false;loading=false;}
function onAuthReady(e){const r=String(e?.detail?.role||window.__IMARA_AUTH_READY__?.role||'');if(r==='admin')mount();else cleanup();}
window.addEventListener('imara-auth-ready',onAuthReady);
window.addEventListener('imara-auth-cleared',cleanup);
window.addEventListener('pageshow',()=>{if(isAdmin())mount();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isAdmin())mount();});
function boot(n=0){if(mount())return;if(n<20)setTimeout(()=>boot(n+1),400);}
if(window.__IMARA_AUTH_READY__)onAuthReady({detail:window.__IMARA_AUTH_READY__});else boot();
})();