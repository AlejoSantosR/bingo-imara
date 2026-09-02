function renderDashboard(){
  const issued=state.cards.filter(c=>['Emitido','Pagado','Ganador'].includes(c.status)).length;
  const paid=state.cards.filter(c=>['Pagado','Ganador'].includes(c.status)).length;
  const pending=state.cards.filter(c=>c.status==='Emitido').length;
  document.getElementById('kpiIssued').textContent=issued;
  document.getElementById('kpiPaid').textContent=paid;
  document.getElementById('kpiRevenue').textContent=money(paid*state.settings.price);
  document.getElementById('kpiPending').textContent=money(pending*state.settings.price);
  document.getElementById('kpiPriceHint').textContent=`${money(state.settings.price)} por cartón`;
  document.getElementById('totalCardsLabel').textContent=`${state.cards.length} cartones`;
  const counts=['Disponible','Emitido','Pagado','Anulado','Ganador'].map(s=>[s,state.cards.filter(c=>c.status===s).length]);
  document.getElementById('statusSummary').innerHTML=counts.map(([s,n])=>`<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line)"><span><span class="badge ${s}">${s}</span></span><strong>${n}</strong></div>`).join('');
  document.getElementById('roundSummary').innerHTML=`
    <div style="font-size:24px;font-weight:900">${escapeHtml(state.round.name)}</div>
    <div class="muted" style="margin-top:4px">Gana: ${patternName(state.round.pattern)}</div>
    <div style="margin-top:10px"><span class="badge ${state.round.status==='open'?'Pagado':'Anulado'}">${state.round.status==='open'?'Abierta':'Cerrada'}</span></div>
    <div style="margin-top:12px">${state.round.prize ? (state.round.reveal?`🎁 ${escapeHtml(state.round.prize)}`:'🎁 Premio sorpresa') : '🎁 Premio por definir'}</div>`;
  document.getElementById('activityList').innerHTML=state.activity.length?state.activity.slice(0,10).map(a=>`<div style="padding:9px 0;border-bottom:1px solid var(--line)"><strong>${new Date(a.at).toLocaleString('es-CO')}</strong><br><span class="muted">${escapeHtml(a.text)}</span></div>`).join(''):'Aún no hay movimientos.';
}

function renderCards(){
  const q=(document.getElementById('cardSearch')?.value||'').toLowerCase();
  const sf=document.getElementById('statusFilter')?.value||'';
  const rows=state.cards.filter(c=>{
    const hit=[c.id,c.buyer,c.phone].join(' ').toLowerCase().includes(q);
    return hit && (!sf || c.status===sf);
  });
  const body=document.getElementById('cardsBody');
  body.innerHTML=rows.length?rows.map(c=>`<tr>
    <td><strong>${escapeHtml(c.id)}</strong></td>
    <td>${escapeHtml(c.buyer||'—')}</td>
    <td>${escapeHtml(c.phone||'—')}</td>
    <td><span class="badge ${c.status}">${c.status}</span></td>
    <td>${money(state.settings.price)}</td>
    <td>${c.image?'🖼️ Sí':'—'}</td>
    <td><div class="mini-actions">
      <button class="mini" onclick="editCard('${c.id}')">Editar</button>
      <button class="mini" onclick="quickStatus('${c.id}','Emitido')">Emitir</button>
      <button class="mini" onclick="quickStatus('${c.id}','Pagado')">Pagar</button>
      <button class="mini" onclick="printCard('${c.id}')">Imprimir</button>
    </div></td>
  </tr>`).join(''):`<tr><td colspan="7" class="muted">No hay cartones para mostrar.</td></tr>`;
}

function renderGame(){
  document.getElementById('lastBall').textContent=state.drawn.length?state.drawn[state.drawn.length-1]:'—';
  document.getElementById('drawCount').textContent=`${state.drawn.length} / ${state.settings.ballMax}`;
  document.getElementById('boardTitle').textContent=`Tablero 1–${state.settings.ballMax}`;
  document.getElementById('manualBall').max=state.settings.ballMax;
  document.getElementById('drawHistory').innerHTML=state.drawn.length?[...state.drawn].reverse().map(n=>`<span class="chip">${n}</span>`).join(''):'<span class="muted">Aún no se han llamado balotas.</span>';
  renderBoard('ballBoard');
  document.getElementById('roundName').value=state.round.name;
  document.getElementById('roundPattern').value=state.round.pattern;
  document.getElementById('roundPrize').value=state.round.prize;
  document.getElementById('prizeReveal').value=state.round.reveal?'yes':'no';
  document.getElementById('roundStatus').value=state.round.status;
}

let lastAutoWinnerNotice='';
function renderAutoWinnerStatus(){
  const el=document.getElementById('autoWinnerStatus'); if(!el)return;
  const candidates=currentWinningCards();
  if(!candidates.length){
    el.innerHTML='<div class="muted">✅ Sin ganador detectado todavía para <strong>'+escapeHtml(patternName(state.round.pattern))+'</strong>.</div>';
    lastAutoWinnerNotice='';
    return;
  }
  const ids=candidates.map(c=>c.id).sort();
  const key=state.round.name+'|'+state.round.pattern+'|'+ids.join(',');
  el.innerHTML=`<div class="success" style="font-size:15px">⚠️ <strong>${candidates.length} posible${candidates.length===1?'':'s'} ganador${candidates.length===1?'':'es'} detectado${candidates.length===1?'':'s'}.</strong><br><span style="display:inline-block;margin-top:7px">${candidates.map(c=>`<button class="mini" onclick="openCandidate('${c.id}')">🏆 ${escapeHtml(c.id)}${c.buyer?' · '+escapeHtml(c.buyer):''}</button>`).join(' ')}</span><br><small>La detección es automática, pero debes confirmar y registrar el ganador desde “Validar ganador”.</small></div>`;
  if(key!==lastAutoWinnerNotice){
    lastAutoWinnerNotice=key;
    toast(`⚠️ ${candidates.length} posible${candidates.length===1?'':'s'} ganador${candidates.length===1?'':'es'}`);
  }
}
window.openCandidate=function(id){
  showView('validate');
  document.getElementById('winnerInput').value=id;
  document.getElementById('validateBtn').click();
};

function renderWinners(){
  const el=document.getElementById('winnersList');
  el.innerHTML=state.winners.length?state.winners.map(w=>`
    <div style="display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--line)">
      <div><strong>🏆 ${escapeHtml(w.cardId)}</strong> · ${escapeHtml(w.buyer||'Sin nombre')}<div class="muted">${escapeHtml(w.roundName)} · ${patternName(w.pattern)}</div></div>
      <div class="muted">${new Date(w.at).toLocaleString('es-CO')}</div>
    </div>`).join(''):'Aún no hay ganadores.';
}

function renderPublic(){
  const last=state.drawn.length?state.drawn[state.drawn.length-1]:'—';
  document.getElementById('publicLastBall').textContent=last;
  document.getElementById('publicTitle').textContent=state.settings.title;
  document.getElementById('publicPrice').textContent=money(state.settings.price);
  document.querySelector('.public .subtitle').textContent=state.settings.message;
  document.getElementById('publicRoundName').textContent=state.round.name;
  document.getElementById('publicPattern').textContent=`Gana: ${patternName(state.round.pattern)}`;
  document.getElementById('publicDrawCount').textContent=`${state.drawn.length} balotas llamadas`;
  document.getElementById('publicMode').textContent=`Modo 1–${state.settings.ballMax}`;
  document.getElementById('publicPrize').textContent=state.round.reveal && state.round.prize ? `🎁 ${state.round.prize}` : '🎁 SORPRESA';
  renderBoard('publicBoard');
  const latest=state.winners[0];
  document.getElementById('publicWinner').innerHTML=latest?`<div class="winner-banner">🏆 ¡TENEMOS GANADOR! · ${escapeHtml(latest.cardId)} ${latest.buyer?`· ${escapeHtml(latest.buyer)}`:''}</div>`:'';
  const img=document.getElementById('publicLogoImage'), txt=document.getElementById('publicLogoText');
  if(state.settings.logo){ img.src=state.settings.logo; img.classList.remove('hidden'); txt.classList.add('hidden'); }
  else { img.classList.add('hidden'); txt.classList.remove('hidden'); }
  const side=document.getElementById('sideLogo'); if(side){ side.innerHTML=state.settings.logo?`<img src="${state.settings.logo}" alt="IMARA">`:'IM'; }
}

function renderSettings(){
  document.getElementById('settingTitle').value=state.settings.title;
  document.getElementById('settingPrice').value=state.settings.price;
  document.getElementById('settingBallMax').value=String(state.settings.ballMax||99);
  document.getElementById('settingOrganizer').value=state.settings.organizer;
  document.getElementById('settingMessage').value=state.settings.message;
  const lp=document.getElementById('logoPreview');
  if(state.settings.logo){lp.src=state.settings.logo;lp.classList.remove('hidden')}else lp.classList.add('hidden');
}

function renderAll(){
  renderDashboard(); renderCards(); renderGame(); renderAutoWinnerStatus(); renderWinners(); renderPublic(); renderSettings();
  const info=document.getElementById('generateModeInfo');
  if(info){
    const ranges=columnRanges(state.settings.ballMax).map((r,i)=>`${['B','I','N','G','O'][i]} ${r[0]}–${r[1]}`).join(' · ');
    info.textContent=`Cada cartón es único · modo 1–${state.settings.ballMax}: ${ranges} · centro libre.`;
  }
  document.title=`${state.settings.title} · ${state.settings.organizer}`;
}

const viewMeta={
 dashboard:['Inicio','Control general del Bingo IMARA.'],
 cards:['Cartones','Emisión, pagos, compradores e imágenes.'],
 game:['Juego','Sorteo de balotas y configuración de rondas.'],
 validate:['Validar ganador','Confirma automáticamente si el cartón realmente cumple.'],
 public:['Pantalla pública','Vista pensada para TV, videobeam o pantalla compartida.'],
 settings:['Configuración','Datos del evento, logo y respaldos.']
};
function showView(v){
  document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));
  document.getElementById('view-'+v)?.classList.remove('hidden');
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  const m=viewMeta[v]||['','']; document.getElementById('pageTitle').textContent=m[0]; document.getElementById('pageSubtitle').textContent=m[1];
}
document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-view-jump]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.viewJump)));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.close).close()));

document.getElementById('generateBtn').addEventListener('click',()=>document.getElementById('generateDialog').showModal());
document.getElementById('confirmGenerateBtn').addEventListener('click',()=>{
  const n=Math.max(1,Math.min(1000,Number(document.getElementById('generateCount').value)||1));
  const p=(document.getElementById('generatePrefix').value||'IMARA').trim().toUpperCase();
  const start=Math.max(1,Number(document.getElementById('generateStart').value)||1);
  const perPage=Number(document.getElementById('generatePerPage').value)||2;
  const auto=document.getElementById('generateAutoPrint').checked;
  let printWindow=null;
  if(auto) printWindow=window.open('','BingoIMARALote');
  try{
    const created=generateCards(n,p,start);
    document.getElementById('generateDialog').close();
    if(auto) openBatchPrint(created.map(c=>c.id),perPage,printWindow);
  }catch(err){
    if(printWindow) printWindow.close();
    alert(err.message||'No fue posible generar el lote.');
  }
});

document.getElementById('printBatchBtn').addEventListener('click',()=>{
  if(!state.cards.length){alert('Primero genera los cartones.');return;}
  const perPage=Number(prompt('¿Cuántos cartones por hoja? Escribe 1, 2 o 4.','2'))||2;
  openBatchPrint(state.cards.map(c=>c.id),[1,2,4].includes(perPage)?perPage:2);
});

document.getElementById('cardSearch').addEventListener('input',renderCards);
document.getElementById('statusFilter').addEventListener('change',renderCards);

window.editCard=function(id){
  const c=findCard(id); if(!c)return;
  document.getElementById('editCardId').value=c.id;
  document.getElementById('cardDialogTitle').textContent=`Editar ${c.id}`;
  document.getElementById('editBuyer').value=c.buyer;
  document.getElementById('editPhone').value=c.phone;
  document.getElementById('editStatus').value=c.status;
  document.getElementById('editPaidAt').value=c.paidAt||'';
  document.getElementById('editNotes').value=c.notes;
  const p=document.getElementById('editImagePreview');
  if(c.image){p.src=c.image;p.classList.remove('hidden')}else{p.classList.add('hidden');p.removeAttribute('src')}
  document.getElementById('editImage').value='';
  document.getElementById('cardDialog').showModal();
}
window.quickStatus=function(id,status){
  const c=findCard(id); if(!c)return;
  c.status=status;
  if(status==='Pagado' && !c.paidAt)c.paidAt=nowLocalInput();
  addActivity(`${c.id} cambió a ${status}.`);
  saveState();
}
document.getElementById('editImage').addEventListener('change',async e=>{
  const file=e.target.files?.[0]; if(!file)return;
  if(file.size>450*1024){ alert('La imagen supera ~450 KB. Comprímela o usa una más liviana para no llenar el navegador.'); e.target.value=''; return; }
  const data=await fileToDataURL(file);
  const p=document.getElementById('editImagePreview'); p.src=data;p.classList.remove('hidden');
});
document.getElementById('saveCardBtn').addEventListener('click',async()=>{
  const c=findCard(document.getElementById('editCardId').value); if(!c)return;
  c.buyer=document.getElementById('editBuyer').value.trim();
  c.phone=document.getElementById('editPhone').value.trim();
  c.status=document.getElementById('editStatus').value;
  c.paidAt=document.getElementById('editPaidAt').value;
  c.notes=document.getElementById('editNotes').value.trim();
  const f=document.getElementById('editImage').files?.[0];
  if(f)c.image=await fileToDataURL(f);
  if(c.status==='Pagado'&&!c.paidAt)c.paidAt=nowLocalInput();
  addActivity(`Se actualizó ${c.id} (${c.status}).`);
  saveState(); document.getElementById('cardDialog').close();
});
function fileToDataURL(file){ return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);}); }
