/* BINGO IMARA · Plataforma multiusuario Supabase */
(function(){
  const SUPABASE_URL='https://fpevaukkbtruplwptufu.supabase.co';
  const SUPABASE_KEY='sb_publishable_Yol0FuWEAsM01Q75iOUggg_kYyNlknF';
  if(!window.supabase?.createClient){console.error('Supabase SDK no disponible');return;}
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  window.IMARA_SUPABASE=sb;
  let session=null, profile=null, cloudCards=[], cloudWinners=[], cloudChannel=null, syncTimer=null, gameSyncLock=false;
  const fmtMoney=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function installStyles(){
    if(document.getElementById('cloudPlatformStyles'))return;
    const s=document.createElement('style');s.id='cloudPlatformStyles';s.textContent=`
      .cloud-auth-overlay{position:fixed;inset:0;z-index:1000000;display:grid;place-items:center;padding:20px;background:rgba(6,10,18,.86);backdrop-filter:blur(12px)}
      .cloud-auth-card{width:min(520px,95vw);background:linear-gradient(155deg,#18213a,#251f44);border:1px solid #3b496b;border-radius:28px;padding:24px;box-shadow:0 30px 100px #0009}
      .cloud-auth-card h2{margin:0 0 6px;font-size:28px}.cloud-auth-card p{margin:0 0 18px;color:#b8c3d8}.cloud-auth-grid{display:grid;gap:10px}.cloud-auth-grid input{width:100%}.cloud-auth-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.cloud-error{margin-top:10px;color:#ffadb8;font-size:13px}.cloud-user-chip{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 10px;border:1px solid var(--line);border-radius:12px;background:#121b2f}.role-pill{padding:4px 8px;border-radius:999px;font-size:10px;font-weight:1000;letter-spacing:.8px}.role-admin{background:rgba(141,107,255,.2);color:#d3c8ff}.role-member{background:rgba(43,212,167,.15);color:#8df3d6}.cloud-panel{margin-top:16px}.cloud-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.cloud-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0}.cloud-metric{padding:13px;border-radius:16px;background:#10182a;border:1px solid var(--line)}.cloud-metric span{display:block;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px}.cloud-metric strong{display:block;margin-top:5px;font-size:21px}.sale-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sale-form label{display:grid;gap:5px;font-size:11px;color:var(--muted)}.sale-form .full{grid-column:1/-1}.sale-list{display:grid;gap:8px;margin-top:12px}.sale-row{padding:12px;border:1px solid var(--line);border-radius:14px;background:#10182a;display:flex;align-items:center;justify-content:space-between;gap:12px}.sale-row small{color:var(--muted)}.pay-pending{color:#ffd278}.pay-approved{color:#8df3d6}.pay-rejected{color:#ff9aa6}.mobile-role-nav{display:none}.cloud-sync-badge{font-size:10px;color:#9eb0cd}
      @media(max-width:760px){.cloud-metrics{grid-template-columns:repeat(2,1fr)}.sale-form{grid-template-columns:1fr}.sale-form .full{grid-column:auto}.sale-row{align-items:flex-start;flex-direction:column}.cloud-user-chip{width:100%}.topbar{align-items:flex-start;flex-direction:column}.actions{width:100%}.mobile-role-nav{display:block}.cloud-auth-card{padding:18px;border-radius:22px}}
    `;document.head.appendChild(s);
  }

  function authOverlay(){
    if(location.hash.startsWith('#mobile='))return null;
    let o=document.getElementById('cloudAuthOverlay');if(o)return o;
    o=document.createElement('div');o.id='cloudAuthOverlay';o.className='cloud-auth-overlay';o.innerHTML=`<div class="cloud-auth-card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px"><div class="brand-logo" style="position:static">${window.IMARA_LOGO?`<img src="${window.IMARA_LOGO}" alt="IMARA">`:'IM'}</div><div><h2>Bingo IMARA</h2><p>Acceso seguro para Admin y Miembros.</p></div></div>
      <div class="cloud-auth-grid"><input class="input" id="authName" placeholder="Nombre completo"><input class="input" id="authEmail" type="email" placeholder="Correo"><input class="input" id="authPassword" type="password" minlength="6" placeholder="Contraseña (mín. 6 caracteres)"></div>
      <div class="cloud-auth-actions"><button class="btn primary" id="authLogin">Entrar</button><button class="btn" id="authRegister">Crear cuenta</button></div>
      <div class="footer-note">La primera cuenta registrada queda como Admin. Las siguientes quedan como Miembro.</div><div id="authError" class="cloud-error"></div>
    </div>`;document.body.appendChild(o);
    o.querySelector('#authLogin').onclick=login;o.querySelector('#authRegister').onclick=register;
    return o;
  }
  function authError(msg){const e=document.getElementById('authError');if(e)e.textContent=msg||'';}
  async function login(){authError('');const email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value;const {error}=await sb.auth.signInWithPassword({email,password});if(error)authError(error.message);}
  async function register(){authError('');const name=document.getElementById('authName').value.trim(),email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value;if(!name){authError('Escribe tu nombre.');return;}const {error}=await sb.auth.signUp({email,password,options:{data:{display_name:name}}});if(error)authError(error.message);else authError('Cuenta creada. Si tu proyecto exige confirmación de correo, confirma el mensaje y luego entra.');}
  async function logout(){await sb.auth.signOut();}

  async function loadProfile(){if(!session?.user)return null;const {data,error}=await sb.from('profiles').select('*').eq('id',session.user.id).single();if(error){console.error(error);return null;}profile=data;window.IMARA_USER_PROFILE=profile;renderAccount();return profile;}
  function renderAccount(){
    const actions=document.querySelector('.topbar .actions');if(!actions)return;
    let box=document.getElementById('cloudUserChip');if(!box){box=document.createElement('div');box.id='cloudUserChip';actions.prepend(box);}if(!profile){box.innerHTML='';return;}
    box.className='cloud-user-chip';box.innerHTML=`<strong>${esc(profile.display_name||session.user.email)}</strong><span class="role-pill ${profile.role==='admin'?'role-admin':'role-member'}">${profile.role==='admin'?'ADMIN':'MIEMBRO'}</span><span id="cloudSyncBadge" class="cloud-sync-badge">● nube</span><button class="mini" id="cloudLogout">Salir</button>`;box.querySelector('#cloudLogout').onclick=logout;
  }
  function cloudCardToLocal(c){return {id:c.id,buyer:c.buyer||'',phone:c.phone||'',status:c.status==='Pendiente'?'Emitido':c.status,paidAt:c.paid_at?String(c.paid_at).slice(0,16):'',notes:c.notes||'',image:'',grid:c.grid,ballMax:c.ball_max||state.settings.ballMax,createdAt:c.created_at};}
  function metrics(){
    const approved=cloudCards.filter(c=>c.payment_status==='approved'||['Pagado','Ganador'].includes(c.status));
    const activeBuyers=new Set(approved.map(c=>(c.buyer||'').trim().toLowerCase()).filter(Boolean));
    const pending=cloudCards.filter(c=>c.payment_status==='pending').length;
    const revenue=approved.length*(Number(state?.settings?.price)||30000);
    const available=cloudCards.filter(c=>c.status==='Disponible'&&!c.seller_id).length;
    window.IMARA_CLOUD_METRICS={activeParticipants:activeBuyers.size,paidCards:approved.length,pendingPayments:pending,revenue,available,cloudCards:[...cloudCards],winners:[...cloudWinners]};
    window.dispatchEvent(new CustomEvent('imara-cloud-updated',{detail:window.IMARA_CLOUD_METRICS}));
    return window.IMARA_CLOUD_METRICS;
  }
  async function refreshCloud(){
    if(!profile)return;
    const [{data:cards,error:ce},{data:wins,error:we}]=await Promise.all([sb.from('bingo_cards').select('*').order('id'),sb.from('winners').select('*').order('created_at',{ascending:false})]);
    if(ce)console.error(ce);else cloudCards=cards||[];if(we)console.error(we);else cloudWinners=wins||[];
    if(profile.role==='admin'&&cloudCards.length){const map=new Map(state.cards.map(c=>[c.id,c]));cloudCards.forEach(c=>map.set(c.id,cloudCardToLocal(c)));state.cards=[...map.values()].sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));localStorage.setItem(KEY,JSON.stringify(state));renderAll();}
    metrics();renderCloudPanels();
  }
  async function syncLocalCards(){
    if(profile?.role!=='admin')return;const rows=state.cards.filter(c=>!/^DEMO-/i.test(c.id)).map(c=>({id:c.id,grid:c.grid,ball_max:Number(c.ballMax||state.settings.ballMax||99),buyer:c.buyer||'',phone:c.phone||'',notes:c.notes||'',status:c.status==='Emitido'?'Emitido':c.status,payment_status:['Pagado','Ganador'].includes(c.status)?'approved':'unpaid',paid_at:c.paidAt||null,updated_at:new Date().toISOString()}));
    if(!rows.length){toast('No hay cartones locales para subir');return;}const {error}=await sb.from('bingo_cards').upsert(rows,{onConflict:'id'});if(error){alert(error.message);return;}toast(`☁️ ${rows.length} cartones sincronizados`);await refreshCloud();
  }
  async function submitSale(){
    const card=document.getElementById('memberSaleCard')?.value,buyer=document.getElementById('memberSaleBuyer')?.value.trim(),phone=document.getElementById('memberSalePhone')?.value.trim(),ref=document.getElementById('memberSaleRef')?.value.trim();if(!card||!buyer){toast('Selecciona cartón y comprador');return;}
    const {error}=await sb.rpc('claim_card_sale',{p_card_id:card,p_buyer:buyer,p_phone:phone||'',p_reference:ref||''});if(error){alert(error.message);return;}toast('💳 Venta registrada · pendiente de aprobación');await refreshCloud();
  }
  async function approve(id,ok){const ref=ok?(prompt('Referencia / medio de pago (opcional):','')||''):'';const {error}=await sb.rpc('approve_card_payment',{p_card_id:id,p_approve:ok,p_reference:ref||null});if(error){alert(error.message);return;}toast(ok?'✅ Pago aprobado':'❌ Pago rechazado');await refreshCloud();}
  async function releaseSale(id){if(!confirm(`¿Liberar ${id} y devolverlo a Disponible?`))return;const {error}=await sb.rpc('release_own_pending_sale',{p_card_id:id});if(error){alert(error.message);return;}await refreshCloud();}

  function ensureCloudPanel(){
    const dash=document.getElementById('view-dashboard');if(!dash)return null;let p=document.getElementById('cloudOperationsPanel');if(!p){p=document.createElement('div');p.id='cloudOperationsPanel';p.className='card cloud-panel';dash.appendChild(p);}return p;
  }
  function renderCloudPanels(){
    if(!profile)return;const p=ensureCloudPanel(),m=metrics();if(!p)return;
    const role=profile.role;
    const metricsHtml=`<div class="cloud-metrics"><div class="cloud-metric"><span>Participantes activos</span><strong>${m.activeParticipants}</strong></div><div class="cloud-metric"><span>Cartones pagados</span><strong>${m.paidCards}</strong></div><div class="cloud-metric"><span>Pendientes de aprobar</span><strong>${m.pendingPayments}</strong></div><div class="cloud-metric"><span>Recaudo aprobado</span><strong>${fmtMoney(m.revenue)}</strong></div></div>`;
    if(role==='admin'){
      const pend=cloudCards.filter(c=>c.payment_status==='pending');
      p.innerHTML=`<div class="section-title"><div><h3>☁️ Centro de operación · Admin</h3><div class="muted">Ventas, pagos y sincronización multiusuario.</div></div><div class="cloud-toolbar"><button class="btn" id="cloudRefresh">↻ Actualizar</button><button class="btn good" id="cloudSyncLocal">☁️ Sincronizar cartones</button></div></div>${metricsHtml}<h4>Pagos pendientes</h4><div class="sale-list">${pend.length?pend.map(c=>`<div class="sale-row"><div><strong>${esc(c.id)} · ${esc(c.buyer||'Sin nombre')}</strong><br><small>Vendedor: ${esc(c.seller_name||'—')} · ${esc(c.phone||'sin teléfono')} ${c.payment_reference?'· Ref: '+esc(c.payment_reference):''}</small></div><div class="mini-actions"><button class="mini" data-approve="${esc(c.id)}">✅ Aprobar</button><button class="mini" data-reject="${esc(c.id)}">❌ Rechazar</button></div></div>`).join(''):'<div class="muted">No hay pagos pendientes.</div>'}</div>`;
      p.querySelector('#cloudRefresh').onclick=refreshCloud;p.querySelector('#cloudSyncLocal').onclick=syncLocalCards;p.querySelectorAll('[data-approve]').forEach(b=>b.onclick=()=>approve(b.dataset.approve,true));p.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>approve(b.dataset.reject,false));
    } else {
      const available=cloudCards.filter(c=>!c.seller_id&&c.status==='Disponible');const mine=cloudCards.filter(c=>c.seller_id===session.user.id);
      p.innerHTML=`<div class="section-title"><div><h3>📱 Mis ventas · Miembro</h3><div class="muted">Registra compradores; Admin aprueba el pago.</div></div><button class="btn" id="cloudRefresh">↻ Actualizar</button></div>${metricsHtml}<div class="sale-form"><label>Cartón<select class="input" id="memberSaleCard"><option value="">Selecciona…</option>${available.map(c=>`<option>${esc(c.id)}</option>`).join('')}</select></label><label>Comprador<input class="input" id="memberSaleBuyer" placeholder="Nombre"></label><label>Teléfono<input class="input" id="memberSalePhone" placeholder="Celular"></label><label>Referencia de pago<input class="input" id="memberSaleRef" placeholder="Nequi / transferencia / efectivo"></label><div class="full"><button class="btn primary" id="memberSubmitSale">Registrar venta</button></div></div><h4>Mis cartones</h4><div class="sale-list">${mine.length?mine.map(c=>`<div class="sale-row"><div><strong>${esc(c.id)} · ${esc(c.buyer||'—')}</strong><br><small class="pay-${esc(c.payment_status)}">${esc(c.payment_status.toUpperCase())} · ${esc(c.status)}</small></div>${c.payment_status==='pending'?`<button class="mini" data-release="${esc(c.id)}">Liberar</button>`:''}</div>`).join(''):'<div class="muted">Aún no has registrado ventas.</div>'}</div>`;
      p.querySelector('#cloudRefresh').onclick=refreshCloud;p.querySelector('#memberSubmitSale').onclick=submitSale;p.querySelectorAll('[data-release]').forEach(b=>b.onclick=()=>releaseSale(b.dataset.release));
    }
  }

  function scheduleGameSync(){if(profile?.role!=='admin'||gameSyncLock)return;clearTimeout(syncTimer);syncTimer=setTimeout(pushGameState,180);}
  async function pushGameState(){if(profile?.role!=='admin')return;const latest=state.winners?.[0]||null;await sb.from('game_state').upsert({id:'main',drawn:state.drawn||[],round:state.round||{},latest_winner:latest,updated_by:session.user.id,updated_at:new Date().toISOString()});if(latest&&!/^DEMO-/i.test(latest.cardId||'')){await sb.from('winners').upsert({card_id:latest.cardId,buyer:latest.buyer||'',round_name:latest.roundName||'',pattern:latest.pattern||'',prize:latest.prize||'',position:(state.winners.findIndex(w=>w===latest)+1)||null,created_by:session.user.id},{onConflict:'card_id,round_name,pattern'});} }
  function wrapSaveState(){if(saveState.__cloudWrapped)return;const base=saveState;saveState=function(...args){const r=base(...args);scheduleGameSync();return r;};saveState.__cloudWrapped=true;}
  async function pullGameState(){const {data}=await sb.from('game_state').select('*').eq('id','main').single();if(!data)return;if(profile?.role!=='admin'){gameSyncLock=true;state.drawn=Array.isArray(data.drawn)?data.drawn:[];state.round=data.round||state.round;localStorage.setItem(KEY,JSON.stringify(state));renderAll();gameSyncLock=false;}}
  function realtime(){if(cloudChannel)sb.removeChannel(cloudChannel);cloudChannel=sb.channel('bingo-imara-live').on('postgres_changes',{event:'*',schema:'public',table:'bingo_cards'},()=>refreshCloud()).on('postgres_changes',{event:'*',schema:'public',table:'winners'},()=>refreshCloud()).on('postgres_changes',{event:'UPDATE',schema:'public',table:'game_state',filter:'id=eq.main'},payload=>{if(profile?.role==='admin'&&payload.new?.updated_by===session?.user?.id)return;pullGameState();}).subscribe();}

  async function onSession(next){session=next;window.IMARA_SESSION=session;if(!session){profile=null;authOverlay();return;}document.getElementById('cloudAuthOverlay')?.remove();await loadProfile();if(!profile)return;wrapSaveState();realtime();await Promise.all([refreshCloud(),pullGameState()]);}

  installStyles();
  sb.auth.getSession().then(({data})=>onSession(data.session));
  sb.auth.onAuthStateChange((_event,next)=>setTimeout(()=>onSession(next),0));
})();