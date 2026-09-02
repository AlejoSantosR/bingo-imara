document.getElementById('saveSettingsBtn').addEventListener('click',async()=>{
  state.settings.title=document.getElementById('settingTitle').value.trim()||'BINGO IMARA';
  state.settings.price=Math.max(0,Number(document.getElementById('settingPrice').value)||0);
  const newBallMax=Number(document.getElementById('settingBallMax').value)||99;
  if(newBallMax!==Number(state.settings.ballMax||99) && (state.cards.length||state.drawn.length||state.winners.length)){
    const ok=confirm(`Cambiar de ${state.settings.ballMax} a ${newBallMax} balotas requiere reiniciar cartones, balotas y ganadores para mantener la validación correcta. ¿Continuar?`);
    if(!ok){ document.getElementById('settingBallMax').value=String(state.settings.ballMax||99); return; }
    state.cards=[]; state.drawn=[]; state.winners=[];
    addActivity(`Se reinició el juego al cambiar el modo a 1–${newBallMax}.`);
  }
  state.settings.ballMax=newBallMax;
  state.settings.organizer=document.getElementById('settingOrganizer').value.trim()||'PL4 Tribu IMARA';
  state.settings.message=document.getElementById('settingMessage').value.trim();
  const f=document.getElementById('settingLogo').files?.[0];
  if(f){
    if(f.size>450*1024){alert('El logo supera ~450 KB. Usa una imagen más liviana.');return;}
    state.settings.logo=await fileToDataURL(f);
  }
  addActivity('Se actualizó la configuración del evento.');
  saveState();
});

function exportBackup(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`Backup_Bingo_IMARA_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href);
}
document.getElementById('exportBtn').addEventListener('click',exportBackup);
document.getElementById('backupBtn').addEventListener('click',exportBackup);
document.getElementById('importFile').addEventListener('change',async e=>{
  const f=e.target.files?.[0]; if(!f)return;
  try{
    const obj=JSON.parse(await f.text());
    if(!obj.cards||!obj.settings)throw new Error();
    if(!confirm('¿Reemplazar los datos actuales con este backup?'))return;
    state=obj; addActivity('Se restauró un backup.'); saveState();
  }catch(err){alert('El archivo no parece ser un backup válido de Bingo IMARA.');}
  e.target.value='';
});
document.getElementById('wipeBtn').addEventListener('click',()=>{
  if(!confirm('Esto borrará cartones, pagos, balotas, imágenes y ganadores de este navegador. ¿Continuar?'))return;
  state=defaultState(); localStorage.removeItem(KEY); saveState();
});
document.getElementById('openPublicBtn').addEventListener('click',()=>{
  const url=location.href.split('#')[0]+'#public';
  window.open(url,'BingoIMARAPublic');
});

if(location.hash==='#public'){
  document.body.classList.add('public-only');
  showView('public');
  document.addEventListener('click', async ()=>{
    if(!document.fullscreenElement){ try{ await document.documentElement.requestFullscreen(); }catch(e){} }
  }, {once:true});
}else showView('dashboard');

renderAll();
