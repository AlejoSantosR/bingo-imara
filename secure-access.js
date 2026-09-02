/* Bingo IMARA · acceso seguro estable: Usuario + Contraseña */
(function(){
  'use strict';
  const API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-private';
  const SESSION_KEY='imaraPrivateSessionV1';
  const IS_PUBLIC=location.hash.startsWith('#public');
  const IS_MOBILE=location.hash.startsWith('#mobile=');
  if(IS_PUBLIC||IS_MOBILE) return;

  let token=sessionStorage.getItem(SESSION_KEY)||'';
  let me=null, cloudCards=[], sales=[], users=[], refreshTimer=null, syncingGame=false;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const money=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);

  function installStyles(){
    if(document.getElementById('imaraSecureCss')) return;
    const s=document.createElement('style');
    s.id='imaraSecureCss';
    s.textContent=`
      body.imara-secure-locked .app{filter:blur(3px);pointer-events:none;user-select:none}
      .imara-auth{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:20px;background:rgba(5,9,17,.94);backdrop-filter:blur(14px)}
      .imara-auth-card{width:min(490px,96vw);padding:26px;border-radius:28px;background:linear-gradient(150deg,#151e35,#292048);border:1px solid #3b4868;box-shadow:0 30px 100px #000b;color:#fff}
      .imara-auth-head{display:flex;align-items:center;gap:13px;margin-bottom:18px}.imara-auth-logo{width:62px;height:62px;border-radius:18px;display:grid;place-items:center;overflow:hidden;background:linear-gradient(135deg,#ff5b8f,#8d6bff);font-weight:1000}.imara-auth-logo img{width:100%;height:100%;object-fit:contain}.imara-auth-card h2{margin:0}.imara-auth-card p{margin:5px 0 0;color:#b9c4d8}.imara-auth-fields{display:grid;gap:10px}.imara-auth-actions{display:flex;gap:8px;margin-top:13px}.imara-auth-note{margin-top:13px;padding:10px 12px;border-radius:13px;background:#14352f;border:1px solid #27685b;color:#c9f4e7;font-size:12px}.imara-auth-error{min-height:18px;margin-top:8px;color:#ffabb8;font-size:13px}
      .imara-user-chip{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:7px 9px;border:1px solid var(--line);border-radius:13px;background:#111a2e}.imara-role{padding:4px 8px;border-radius:999px;font-size:10px;font-weight:1000}.imara-role.admin{background:#2b2353;color:#d8ceff}.imara-role.member{background:#123b36;color:#9bf4df}
      .imara-ops{margin-top:16px}.imara-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin:12px 0}.imara-metric{padding:12px;border:1px solid var(--line);border-radius:15px;background:#10182a}.imara-metric span{display:block;font-size:9px;color:var(--muted);text-transform:uppercase}.imara-metric strong{display:block;font-size:20px;margin-top:5px}.imara-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px}.imara-box{padding:14px;border:1px solid var(--line);border-radius:16px;background:#0f1728}.imara-form{display:grid;grid-template-columns:1fr 1fr;gap:9px}.imara-form label{display:grid;gap:4px;font-size:11px;color:var(--muted)}.imara-form .full{grid-column:1/-1}.imara-list{display:grid;gap:8px}.imara-row{padding:11px;border:1px solid var(--line);border-radius:13px;background:#111a2d;display:flex;justify-content:space-between;gap:10px;align-items:center}.imara-row small{color:var(--muted)}.imara-phone{font-family:ui-monospace,monospace}.imara-security-note{margin-top:12px;padding:10px 12px;border-radius:13px;background:rgba(43,212,167,.08);border:1px solid rgba(43,212,167,.22);color:#c9f4e7;font-size:12px}
      body.imara-member .nav button:not([data-view="dashboard"]){display:none!important}body.imara-member #backupBtn,body.imara-member #openPublicBtn{display:none!important}
      @media(max-width:900px){.imara-metrics{grid-template-columns:1fr 1fr}.imara-cols,.imara-form{grid-template-columns:1fr}.imara-form .full{grid-column:auto}}
      @media(max-width:620px){.imara-auth-card{padding:18px}.imara-row{align-items:flex-start;flex-direction:column}.imara-user-chip{width:100%}}
    `;
    document.head.appendChild(s);
  }

  async function api(action,payload={},auth=true){
    const headers={'Content-Type':'application/json'};
    if(auth&&token) headers.Authorization='Bearer '+token;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),12000);
    try{
      const r=await fetch(API,{method:'POST',headers,cache:'no-store',signal:controller.signal,body:JSON.stringify({action,...payload})});
      let data={}; try{data=await r.json()}catch(e){}
      if(r.status===401&&auth){ clearSession(); showLogin(true); throw new Error('Sesión vencida'); }
      if(!r.ok) throw new Error(data.error||'No fue posible completar la operación');
      return data;
    } finally { clearTimeout(timeout); }
  }

  function clearSession(){
    token=''; me=null; sessionStorage.removeItem(SESSION_KEY);
    if(refreshTimer){clearInterval(refreshTimer);refreshTimer=null;}
    document.getElementById('imaraUserChip')?.remove();
    document.getElementById('imaraOps')?.remove();
    document.body.classList.remove('imara-member');
  }

  function loginOverlay(initialized=true){
    installStyles();
    document.body.classList.add('imara-secure-locked');
    document.getElementById('imaraAuth')?.remove();
    const o=document.createElement('div');
    o.id='imaraAuth';o.className='imara-auth';
    o.innerHTML=`<div class="imara-auth-card">
      <div class="imara-auth-head"><div class="imara-auth-logo">${window.IMARA_LOGO?`<img src="${window.IMARA_LOGO}" alt="IMARA">`:'IM'}</div><div><h2>Bingo IMARA</h2><p>${initialized?'Acceso privado':'Crear administrador inicial'}</p></div></div>
      <div class="imara-auth-fields">${initialized?'':'<input class="input" id="imaraDisplay" placeholder="Nombre visible (opcional)">'}<input class="input" id="imaraUser" autocomplete="username" autocapitalize="none" placeholder="Usuario"><input class="input" id="imaraPass" type="password" autocomplete="current-password" minlength="8" placeholder="Contraseña"></div>
      <div class="imara-auth-actions"><button class="btn primary" id="imaraLoginBtn">${initialized?'Entrar':'Crear Admin'}</button></div>
      <div class="imara-auth-note">🔒 Acceso solo con usuario y contraseña. No usamos correo. Las contraseñas no se almacenan en texto legible.</div>
      <div class="imara-auth-error" id="imaraAuthError"></div>
    </div>`;
    document.body.appendChild(o);
    const submit=async()=>{
      const username=o.querySelector('#imaraUser').value.trim();
      const password=o.querySelector('#imaraPass').value;
      const display=o.querySelector('#imaraDisplay')?.value.trim()||username;
      const err=o.querySelector('#imaraAuthError');err.textContent='';
      if(!username||password.length<8){err.textContent='Escribe usuario y contraseña de mínimo 8 caracteres.';return;}
      const btn=o.querySelector('#imaraLoginBtn');btn.disabled=true;btn.textContent='Verificando…';
      try{
        const d=initialized?await api('login',{username,password},false):await api('bootstrap',{username,password,display_name:display},false);
        token=d.token;me=d.user;sessionStorage.setItem(SESSION_KEY,token);o.remove();document.body.classList.remove('imara-secure-locked');await afterLogin();
      }catch(e){err.textContent=e.name==='AbortError'?'El servidor tardó demasiado. Intenta otra vez.':e.message;btn.disabled=false;btn.textContent=initialized?'Entrar':'Crear Admin';}
    };
    o.querySelector('#imaraLoginBtn').onclick=submit;
    o.querySelector('#imaraPass').onkeydown=e=>{if(e.key==='Enter')submit();};
    setTimeout(()=>o.querySelector('#imaraUser')?.focus(),60);
  }

  async function showLogin(forceInitialized=null){
    document.body.classList.add('imara-secure-locked');
    if(forceInitialized!==null){loginOverlay(forceInitialized);return;}
    try{const s=await api('status',{},false);loginOverlay(!!s.initialized);}catch(e){loginOverlay(true);document.getElementById('imaraAuthError').textContent='No fue posible conectar con el servidor.';}
  }

  function mountChip(){
    const host=document.querySelector('.topbar .actions');if(!host||!me)return;
    let c=document.getElementById('imaraUserChip');if(!c){c=document.createElement('div');c.id='imaraUserChip';host.prepend(c);}
    c.className='imara-user-chip';
    c.innerHTML=`<strong>${esc(me.display_name||me.username)}</strong><span class="imara-role ${esc(me.role)}">${me.role==='admin'?'ADMIN':'MIEMBRO'}</span><span style="font-size:10px;color:#9db0ce">🔐 privado</span><button class="mini" id="imaraChangePass">Clave</button><button class="mini" id="imaraLogout">Salir</button>`;
    c.querySelector('#imaraLogout').onclick=logout;
    c.querySelector('#imaraChangePass').onclick=changeMyPassword;
    document.body.classList.toggle('imara-member',me.role==='member');
    if(me.role==='member'&&typeof showView==='function')showView('dashboard');
  }

  async function logout(){
    try{await api('logout')}catch(e){}
    clearSession();showLogin(true);
  }

  async function changeMyPassword(){
    const p=prompt('Nueva contraseña (mínimo 8 caracteres):','');if(!p)return;
    if(p.length<8){alert('La contraseña debe tener mínimo 8 caracteres.');return;}
    try{await api('user-password',{user_id:me.id,password:p});alert('✅ Contraseña cambiada. Por seguridad inicia sesión nuevamente.');clearSession();showLogin(true);}catch(e){alert(e.message);}
  }

  async function loadData(){
    if(!me)return;
    const jobs=[api('cards'),api('sales'),api('overview',{},false)];
    if(me.role==='admin')jobs.push(api('users'));
    const result=await Promise.all(jobs);
    cloudCards=result[0]?.cards||[];sales=result[1]?.sales||[];
    const overview=result[2]||{};users=me.role==='admin'?(result[3]?.users||[]):[];
    window.IMARA_CLOUD_METRICS={...(overview.metrics||{}),winners:overview.winners||[]};
    if(me.role==='admin')mergeCloudIntoLocal();
    renderOps();
  }

  function mergeCloudIntoLocal(){
    if(typeof state==='undefined'||!Array.isArray(state.cards))return;
    const current=new Map(state.cards.map(c=>[c.id,c]));
    const saleMap=new Map(sales.filter(s=>s.payment_status!=='rejected').map(s=>[s.card_id,s]));
    for(const c of cloudCards){
      const old=current.get(c.id)||{}, sale=saleMap.get(c.id);
      current.set(c.id,{...old,id:c.id,grid:c.grid,ballMax:c.ball_max||old.ballMax||state.settings.ballMax,status:c.status==='Pendiente'?'Emitido':c.status,buyer:sale?.buyer_alias||old.buyer||'',phone:'',paidAt:sale?.approved_at?String(sale.approved_at).slice(0,16):(old.paidAt||''),notes:old.notes||'',image:old.image||'',createdAt:c.created_at||old.createdAt});
    }
    state.cards=[...current.values()].sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
    if(typeof renderAll==='function')renderAll();
  }

  function metricsHtml(){
    const m=window.IMARA_CLOUD_METRICS||{};
    const approved=sales.filter(s=>s.payment_status==='approved');
    const revenue=approved.reduce((a,s)=>a+(Number(s.amount)||0),0);
    const pending=sales.filter(s=>s.payment_status==='pending').length;
    const paid=Number(m.paidCards||0);
    const participants=Number(m.activeParticipants||0);
    const positions=Number(m.positionsDelivered||0);
    return `<div class="imara-metrics"><div class="imara-metric"><span>Participantes</span><strong>${participants}</strong></div><div class="imara-metric"><span>Pagados</span><strong>${paid}</strong></div><div class="imara-metric"><span>Pendientes</span><strong>${pending}</strong></div><div class="imara-metric"><span>Puestos</span><strong>${positions}</strong></div><div class="imara-metric"><span>${me.role==='admin'?'Recaudo aprobado':'Mis ventas aprobadas'}</span><strong>${money(revenue)}</strong></div></div>`;
  }

  function renderOps(){
    if(!me)return;
    const dash=document.getElementById('view-dashboard');if(!dash)return;
    let p=document.getElementById('imaraOps');if(!p){p=document.createElement('div');p.id='imaraOps';p.className='card imara-ops';dash.appendChild(p);}
    if(me.role==='admin')renderAdmin(p);else renderMember(p);
  }

  function renderAdmin(p){
    const pending=sales.filter(s=>s.payment_status==='pending');
    p.innerHTML=`<div class="section-title"><div><h3>🔐 Centro de operación · Admin</h3><div class="muted">Usuarios, ventas y aprobaciones con mínimo de datos.</div></div><div class="actions"><button class="btn" id="imaraRefresh">↻ Actualizar</button><button class="btn good" id="imaraSyncCards">☁️ Subir cartones</button></div></div>${metricsHtml()}
    <div class="imara-cols"><section class="imara-box"><h4>💳 Pagos pendientes</h4><div class="imara-list">${pending.length?pending.map(s=>`<div class="imara-row"><div><strong>${esc(s.card_id)}${s.buyer_alias?' · '+esc(s.buyer_alias):''}</strong><br><small>Vendedor: ${esc(s.seller_name||'—')} · Celular: <span class="imara-phone">${esc(s.buyer_phone||'')}</span> · ${money(s.amount)}</small></div><div><button class="mini" data-approve="${esc(s.id)}">✅ Aprobar</button> <button class="mini" data-reject="${esc(s.id)}">❌ Rechazar</button></div></div>`).join(''):'<div class="muted">No hay pagos pendientes.</div>'}</div></section>
    <section class="imara-box"><h4>👥 Usuarios vendedores</h4><div class="imara-form"><label>Usuario<input class="input" id="newUser"></label><label>Nombre visible<input class="input" id="newDisplay" placeholder="Opcional"></label><label>Contraseña<input class="input" id="newPass" type="password" minlength="8"></label><label>Rol<select class="input" id="newRole"><option value="member">Miembro</option><option value="admin">Admin</option></select></label><div class="full"><button class="btn primary" id="createUserBtn">Crear usuario</button></div></div><div class="imara-list" style="margin-top:12px">${users.map(u=>`<div class="imara-row"><div><strong>@${esc(u.username)}</strong> · ${esc(u.display_name||'')}<br><small>${String(u.role||'member').toUpperCase()} · ${u.active?'ACTIVO':'BLOQUEADO'}</small></div><div><button class="mini" data-toggle-user="${esc(u.id)}" data-active="${u.active?'1':'0'}">${u.active?'Bloquear':'Activar'}</button> <button class="mini" data-reset-user="${esc(u.id)}">Clave</button></div></div>`).join('')}</div></section></div>
    <div class="imara-security-note">🛡️ El celular se guarda cifrado en Supabase. El navegador no lo copia al almacenamiento local del Bingo.</div>`;
    p.querySelector('#imaraRefresh').onclick=refresh;
    p.querySelector('#imaraSyncCards').onclick=syncCards;
    p.querySelector('#createUserBtn').onclick=createUser;
    p.querySelectorAll('[data-approve]').forEach(b=>b.onclick=()=>processSale(b.dataset.approve,true));
    p.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>processSale(b.dataset.reject,false));
    p.querySelectorAll('[data-toggle-user]').forEach(b=>b.onclick=()=>toggleUser(b.dataset.toggleUser,b.dataset.active!=='1'));
    p.querySelectorAll('[data-reset-user]').forEach(b=>b.onclick=()=>resetUserPass(b.dataset.resetUser));
  }

  function renderMember(p){
    const available=cloudCards.filter(c=>c.status==='Disponible');
    p.innerHTML=`<div class="section-title"><div><h3>📱 Venta de cartones</h3><div class="muted">@${esc(me.username)} · los pagos quedan pendientes hasta aprobación Admin.</div></div><button class="btn" id="imaraRefresh">↻ Actualizar</button></div>${metricsHtml()}
    <div class="imara-cols"><section class="imara-box"><h4>Nueva venta</h4><div class="imara-form"><label>Cartón<select class="input" id="saleCard"><option value="">Selecciona…</option>${available.map(c=>`<option value="${esc(c.id)}">${esc(c.id)}</option>`).join('')}</select></label><label>Celular<input class="input" id="salePhone" inputmode="tel" autocomplete="off" placeholder="3001234567"></label><label>Nombre / apodo<input class="input" id="saleAlias" maxlength="60" placeholder="Opcional"></label><label>Medio de pago<select class="input" id="saleMethod"><option value="">Sin registrar</option><option>Efectivo</option><option>Transferencia</option><option>Nequi</option><option>Daviplata</option><option>Otro</option></select></label><div class="full"><button class="btn primary" id="createSaleBtn">Registrar venta</button></div></div><div class="imara-security-note">🔒 El celular viaja por HTTPS y se cifra antes de almacenarse. No pedimos correo.</div></section>
    <section class="imara-box"><h4>Mis ventas</h4><div class="imara-list">${sales.length?sales.map(s=>`<div class="imara-row"><div><strong>${esc(s.card_id)}${s.buyer_alias?' · '+esc(s.buyer_alias):''}</strong><br><small>Celular: <span class="imara-phone">${esc(s.buyer_phone||'')}</span> · ${esc(String(s.payment_status||'').toUpperCase())} · ${money(s.amount)}</small></div>${s.payment_status==='pending'?`<button class="mini" data-release="${esc(s.id)}">Liberar</button>`:''}</div>`).join(''):'<div class="muted">Aún no registras ventas.</div>'}</div></section></div>`;
    p.querySelector('#imaraRefresh').onclick=refresh;
    p.querySelector('#createSaleBtn').onclick=createSale;
    p.querySelectorAll('[data-release]').forEach(b=>b.onclick=()=>releaseSale(b.dataset.release));
  }

  async function refresh(){
    if(!me)return;
    try{await loadData();}catch(e){console.warn('IMARA refresh:',e.message);}
  }
  async function syncCards(){
    const list=(state.cards||[]).filter(c=>!/^DEMO-/i.test(c.id)).map(c=>({id:c.id,grid:c.grid,ballMax:c.ballMax||state.settings.ballMax}));
    if(!list.length){alert('Primero genera cartones.');return;}
    try{const d=await api('cards-sync',{cards:list});alert(`✅ ${d.count||list.length} cartones sincronizados.`);await refresh();}catch(e){alert(e.message);}
  }
  async function createUser(){
    const username=document.getElementById('newUser').value.trim(),display_name=document.getElementById('newDisplay').value.trim(),password=document.getElementById('newPass').value,role=document.getElementById('newRole').value;
    if(!username||password.length<8){alert('Usuario y contraseña mínima de 8 caracteres.');return;}
    try{await api('user-create',{username,password,display_name:display_name||username,role});await refresh();}catch(e){alert(e.message);}
  }
  async function toggleUser(id,active){try{await api('user-active',{user_id:id,active});await refresh();}catch(e){alert(e.message);}}
  async function resetUserPass(id){const p=prompt('Nueva contraseña (mínimo 8 caracteres):','');if(!p)return;if(p.length<8){alert('Mínimo 8 caracteres.');return;}try{await api('user-password',{user_id:id,password:p});alert('✅ Contraseña actualizada y sesiones anteriores cerradas.');await refresh();}catch(e){alert(e.message);}}
  async function createSale(){
    const card_id=document.getElementById('saleCard').value,buyer_phone=document.getElementById('salePhone').value,buyer_alias=document.getElementById('saleAlias').value.trim(),payment_method=document.getElementById('saleMethod').value;
    if(!card_id||buyer_phone.replace(/\D/g,'').length<7){alert('Selecciona un cartón y escribe el celular.');return;}
    try{await api('sale-create',{card_id,buyer_phone,buyer_alias,payment_method});alert('✅ Venta enviada a aprobación del Admin.');await refresh();}catch(e){alert(e.message);}
  }
  async function releaseSale(id){if(!confirm('¿Liberar este cartón?'))return;try{await api('sale-release',{sale_id:id});await refresh();}catch(e){alert(e.message);}}
  async function processSale(id,approve){try{await api('sale-approve',{sale_id:id,approve});await refresh();}catch(e){alert(e.message);}}

  function installGameSync(){
    if(me?.role!=='admin'||typeof saveState!=='function'||saveState.__imaraSecure)return;
    const original=saveState;
    let gameTimer=null;
    const wrapped=function(){
      const result=original.apply(this,arguments);
      clearTimeout(gameTimer);
      gameTimer=setTimeout(()=>{if(!syncingGame){syncingGame=true;api('game-set',{drawn:state.drawn||[],round:state.round||{}}).catch(()=>{}).finally(()=>syncingGame=false);}},500);
      return result;
    };
    wrapped.__imaraSecure=true;saveState=wrapped;
  }

  async function afterLogin(){
    document.body.classList.remove('imara-secure-locked');
    mountChip();installGameSync();
    await loadData();
    if(refreshTimer)clearInterval(refreshTimer);
    refreshTimer=setInterval(refresh,15000);
  }

  async function init(){
    installStyles();document.body.classList.add('imara-secure-locked');
    if(token){
      try{me=(await api('me')).user;await afterLogin();return;}catch(e){clearSession();}
    }
    showLogin();
  }

  init();
})();