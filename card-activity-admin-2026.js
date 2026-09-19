/* Bingo IMARA · Actividad de cartones · Admin manual · 2026 */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraCardActivityAdmin2026)return;window.__imaraCardActivityAdmin2026=true;

const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-activity';
const SESSION_KEY='imaraPrivateSessionV1';
let rows=[],summary={},generatedAt=null,wired=false,loading=false;

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function token(){return sessionStorage.getItem(SESSION_KEY)||'';}
function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
function fmt(v){if(!v)return '—';try{return new Intl.DateTimeFormat('es-CO',{dateStyle:'short',timeStyle:'medium'}).format(new Date(v));}catch{return '—';}}
function ago(v){if(!v)return '';const s=Math.max(0,Math.round((Date.now()-new Date(v).getTime())/1000));if(s<60)return 'hace menos de 1 min';if(s<3600)return 'hace '+Math.floor(s/60)+' min';return 'hace '+Math.floor(s/3600)+' h';}
function statusLabel(s){return s==='online'?'🟢 Viendo ahora':s==='opened'?'🟡 Abrió antes':'⚪ Nunca abrió';}
function statusClass(s){return s==='online'?'activity-online':s==='opened'?'activity-opened':'activity-never';}

function css(){
 if(document.getElementById('imaraCardActivityCss'))return;
 const s=document.createElement('style');s.id='imaraCardActivityCss';s.textContent=`
 #view-activity .activity-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
 #view-activity .activity-kpi{padding:14px;border:1px solid var(--line);border-radius:16px;background:#111a2d}
 #view-activity .activity-kpi small{display:block;color:var(--muted);margin-bottom:5px}.activity-kpi strong{font-size:27px}
 #view-activity .activity-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:14px 0}
 #view-activity .activity-toolbar .input{min-width:190px}
 .activity-dot{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:7px;vertical-align:-1px}
 .activity-online .activity-dot{background:#37d67a;box-shadow:0 0 12px rgba(55,214,122,.65)}
 .activity-opened .activity-dot{background:#f3bd48}.activity-never .activity-dot{background:#8791a6}
 #activityRows tr.activity-online td:first-child{border-left:3px solid #37d67a}
 #activityRows tr.activity-opened td:first-child{border-left:3px solid #f3bd48}
 #activityRows tr.activity-never td:first-child{border-left:3px solid #8791a6}
 .activity-meta{font-size:11px;color:var(--muted);margin-top:3px}
 @media(max-width:820px){#view-activity .activity-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}#view-activity .activity-toolbar{display:grid;grid-template-columns:1fr}#view-activity .activity-toolbar>*{width:100%!important}}
 `;document.head.appendChild(s);
}
function mount(){
 if(!isAdmin())return false;
 css();
 const nav=document.querySelector('.nav');
 if(!nav)return false;
 let btn=document.getElementById('imaraActivityNav');
 if(!btn){
   btn=document.createElement('button');btn.id='imaraActivityNav';btn.dataset.view='activity';btn.textContent='📡 Actividad';
   const cards=nav.querySelector('[data-view="cards"]');cards?.insertAdjacentElement('afterend',btn);
 }
 let view=document.getElementById('view-activity');
 if(!view){
   view=document.createElement('section');view.id='view-activity';view.className='view hidden';
   view.innerHTML=`
    <div class="card">
      <div class="section-title"><div><h3>📡 Actividad de cartones</h3><div class="muted">Foto manual de los cartones vendidos. No actualiza automáticamente el Dashboard.</div></div><button class="btn primary" id="activityRefresh">🔄 Actualizar</button></div>
      <div class="activity-kpis" style="margin-top:14px">
       <div class="activity-kpi"><small>Vendidos / asignados</small><strong id="activitySold">0</strong></div>
       <div class="activity-kpi"><small>🟢 Viendo ahora</small><strong id="activityOnline">0</strong></div>
       <div class="activity-kpi"><small>🟡 Abrieron antes</small><strong id="activityOpened">0</strong></div>
       <div class="activity-kpi"><small>⚪ Nunca abrieron</small><strong id="activityNever">0</strong></div>
       <div class="activity-kpi"><small>Abrieron alguna vez</small><strong id="activityOpenedTotal">0</strong></div>
      </div>
      <div class="activity-toolbar">
       <input class="input" id="activitySearch" placeholder="Buscar cartón, participante o pedido">
       <select class="input" id="activityFilter"><option value="">Todos</option><option value="online">🟢 Viendo ahora</option><option value="opened">🟡 Abrió antes</option><option value="never">⚪ Nunca abrió</option></select>
       <span class="muted" id="activityUpdated">Pulsa Actualizar para consultar.</span>
      </div>
      <div class="notice">🟢 = respondió al sondeo que acabas de lanzar · 🟡 = fue abierto alguna vez pero no respondió ahora · ⚪ = todavía no tenemos ninguna apertura registrada.</div>
      <div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Actividad</th><th>Cartón</th><th>Participante</th><th>Venta</th><th>Pedido</th><th>Primera apertura</th><th>Última vez visto</th><th>Sesiones</th></tr></thead><tbody id="activityRows"><tr><td colspan="8" class="muted">Pulsa Actualizar para ver la actividad.</td></tr></tbody></table></div>
    </div>`;
   document.querySelector('main.content')?.appendChild(view);
 }
 if(!wired){
   wired=true;
   btn.addEventListener('click',()=>showActivity());
   view.querySelector('#activityRefresh')?.addEventListener('click',()=>load(true));
   view.querySelector('#activitySearch')?.addEventListener('input',render);
   view.querySelector('#activityFilter')?.addEventListener('change',render);
 }
 return true;
}
function showActivity(){
 document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));
 document.getElementById('view-activity')?.classList.remove('hidden');
 document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view==='activity'));
 const t=document.getElementById('pageTitle'),s=document.getElementById('pageSubtitle');
 if(t)t.textContent='Actividad de cartones';if(s)s.textContent='Quién abrió su cartón, quién lo está viendo y quién aún no.';
 if(!generatedAt)load(false);
}
function render(){
 const q=(document.getElementById('activitySearch')?.value||'').trim().toLowerCase();
 const f=document.getElementById('activityFilter')?.value||'';
 const list=rows.filter(r=>(!f||r.activity_status===f)&&(!q||[r.card_id,r.buyer_alias,r.order_code].some(x=>String(x||'').toLowerCase().includes(q))));
 const body=document.getElementById('activityRows');if(!body)return;
 body.innerHTML=list.length?list.map(r=>`
  <tr class="${statusClass(r.activity_status)}">
   <td><span class="activity-dot"></span><strong>${esc(statusLabel(r.activity_status))}</strong></td>
   <td><strong>${esc(r.card_id)}</strong></td>
   <td>${esc(r.buyer_alias||'—')}</td>
   <td><span class="badge ${r.payment_status==='approved'?'Pagado':'Emitido'}">${r.payment_status==='approved'?'Pagado':'Pendiente'}</span></td>
   <td>${esc(r.order_code||'—')}</td>
   <td>${fmt(r.first_opened_at)}</td>
   <td>${r.last_seen_at?`${fmt(r.last_seen_at)}<div class="activity-meta">${esc(ago(r.last_seen_at))}</div>`:'—'}</td>
   <td>${Number(r.sessions)||0}</td>
  </tr>`).join(''):'<tr><td colspan="8" class="muted">No hay cartones que coincidan con el filtro.</td></tr>';
}
async function call(action,payload={},timeout=10000){
 const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),timeout);
 try{
  const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||'No fue posible consultar actividad.');return d;
 }finally{clearTimeout(tm);}
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function load(showError){
 if(loading||!isAdmin()||!token())return;loading=true;
 const b=document.getElementById('activityRefresh'),old=b?.textContent;if(b){b.disabled=true;b.textContent='📡 Consultando cartones…';}
 try{
  const p=await call('probe');
  if(!p?.probe_id)throw new Error('No fue posible iniciar el sondeo.');
  await wait(1800);
  const d=await call('list',{probe_id:p.probe_id});
  rows=Array.isArray(d.rows)?d.rows:[];summary=d.summary||{};generatedAt=d.generated_at||new Date().toISOString();
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=String(v??0);};
  set('activitySold',summary.sold);set('activityOnline',summary.online);set('activityOpened',summary.opened_offline);set('activityNever',summary.never);set('activityOpenedTotal',summary.opened_total);
  const up=document.getElementById('activityUpdated');if(up)up.textContent='Actualizado: '+fmt(generatedAt)+' · sondeo manual';
  render();
 }catch(e){if(showError)alert(e.name==='AbortError'?'El servidor tardó demasiado. Intenta nuevamente.':e.message);}
 finally{loading=false;if(b){b.disabled=false;b.textContent=old||'🔄 Actualizar';}}
}
function boot(n=0){if(mount())return;if(n<20)setTimeout(()=>boot(n+1),400);}
boot();
})();