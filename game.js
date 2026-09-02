document.getElementById('drawBtn').addEventListener('click',()=>{
  if(state.round.status!=='open'){alert('La ronda está cerrada. Ábrela antes de continuar.');return;}
  const max=Number(state.settings.ballMax)||99;
  if(state.drawn.length>=max){alert(`Ya salieron las ${max} balotas.`);return;}
  const left=[]; for(let i=1;i<=max;i++) if(!state.drawn.includes(i))left.push(i);
  const n=left[Math.floor(Math.random()*left.length)];
  state.drawn.push(n); addActivity(`Salió la balota ${n}.`); saveState(); animateBall();
});
document.getElementById('manualBtn').addEventListener('click',()=>{
  const n=Number(document.getElementById('manualBall').value);
  const max=Number(state.settings.ballMax)||99;
  if(n<1||n>max||!Number.isInteger(n)){alert(`Ingresa un número entero entre 1 y ${max}.`);return;}
  if(state.drawn.includes(n)){alert('Esa balota ya fue llamada.');return;}
  state.drawn.push(n); document.getElementById('manualBall').value=''; addActivity(`Se marcó manualmente la balota ${n}.`); saveState(); animateBall();
});
document.getElementById('undoDrawBtn').addEventListener('click',()=>{
  if(!state.drawn.length)return;
  const n=state.drawn.pop(); addActivity(`Se deshizo la balota ${n}.`); saveState();
});
document.getElementById('resetDrawBtn').addEventListener('click',()=>{
  if(!confirm('¿Reiniciar todas las balotas llamadas de esta ronda?'))return;
  state.drawn=[]; addActivity('Se reinició el tablero de balotas.'); saveState();
});
document.getElementById('saveRoundBtn').addEventListener('click',()=>{
  state.round={
    name:document.getElementById('roundName').value.trim()||'Ronda',
    pattern:document.getElementById('roundPattern').value,
    prize:document.getElementById('roundPrize').value.trim(),
    reveal:document.getElementById('prizeReveal').value==='yes',
    status:document.getElementById('roundStatus').value
  };
  addActivity(`Ronda configurada: ${state.round.name} (${patternName(state.round.pattern)}).`);
  saveState(); toast('Ronda guardada');
});

document.getElementById('validateBtn').addEventListener('click',()=>{
  const q=document.getElementById('winnerInput').value;
  const c=findCard(q), result=document.getElementById('validationResult'), preview=document.getElementById('winnerCardPreview');
  if(!c){ result.innerHTML='<div class="danger">❌ No existe ese número de cartón.</div>'; preview.innerHTML=''; return; }
  renderBingoCard(c,preview,true);
  if(!['Pagado','Ganador'].includes(c.status)){
    result.innerHTML=`<div class="danger">⛔ ${escapeHtml(c.id)} no puede ganar porque su estado es <strong>${c.status}</strong>. Debe estar Pagado.</div>`; return;
  }
  const ok=validatePattern(c);
  if(!ok){
    result.innerHTML=`<div class="danger">❌ Todavía NO cumple <strong>${patternName(state.round.pattern)}</strong> con las balotas llamadas.</div>`; return;
  }
  result.innerHTML=`<div class="success">✅ ¡BINGO VÁLIDO! ${escapeHtml(c.id)} cumple <strong>${patternName(state.round.pattern)}</strong>. <button class="mini" onclick="registerWinner('${c.id}')">Registrar ganador</button></div>`;
});
window.registerWinner=function(id){
  const c=findCard(id); if(!c)return;
  if(!validatePattern(c)){alert('Este cartón ya no cumple la validación actual.');return;}
  if(!['Pagado','Ganador'].includes(c.status)){alert('El cartón debe estar pagado.');return;}
  c.status='Ganador';
  state.winners.unshift({cardId:c.id,buyer:c.buyer,roundName:state.round.name,pattern:state.round.pattern,prize:state.round.prize,at:new Date().toISOString()});
  addActivity(`🏆 Ganador registrado: ${c.id} en ${state.round.name}.`);
  saveState(); celebrate(); toast(`🏆 ${c.id} registrado como ganador`);
  document.getElementById('validationResult').innerHTML=`<div class="success">🏆 Ganador registrado: <strong>${escapeHtml(c.id)}</strong>.</div>`;
}
