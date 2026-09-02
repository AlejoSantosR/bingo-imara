/* BINGO IMARA · Reinicio seguro para entrega */
(function(){
  const RESET_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-reset';
  const SESSION_KEY='imaraPrivateSessionV1';

  function isAdmin(){ return !!document.querySelector('#privateChip .rp.admin'); }
  function bingoLocalKeys(){
    const keys=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i)||'';
      if(k==='bingoImaraStateV2'||k==='bingoImaraPlayableDemoV1'||k==='imaraPublicSound'||k.startsWith('imaraMobileMarks:')) keys.push(k);
    }
    return keys;
  }
  function cleanLocalBingo(){ bingoLocalKeys().forEach(k=>localStorage.removeItem(k)); }

  async function factoryReset(button){
    if(!isAdmin()){ alert('Solo Admin puede reiniciar la aplicación.'); return; }
    const first=confirm('♻️ REINICIO PARA ENTREGA\n\nEsto eliminará cartones, ventas, pagos, ganadores, balotas y usuarios Miembro tanto de la nube como de este navegador.\n\nSe conservará únicamente tu cuenta Admin actual.\n\n¿Continuar?');
    if(!first)return;
    const typed=prompt('Para confirmar, escribe exactamente: REINICIAR','');
    if(typed!=='REINICIAR'){ alert('Reinicio cancelado. La palabra de confirmación no coincide.'); return; }
    if(!confirm('Última confirmación: esta acción no se puede deshacer salvo que tengas un backup. ¿Reiniciar ahora?'))return;

    const token=sessionStorage.getItem(SESSION_KEY)||'';
    if(!token){ alert('Tu sesión Admin no está disponible. Vuelve a iniciar sesión.'); return; }
    const old=button.textContent;
    button.disabled=true; button.textContent='♻️ Reiniciando…';
    try{
      const r=await fetch(RESET_API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},cache:'no-store',body:JSON.stringify({confirmation:'REINICIAR'})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||'No fue posible reiniciar la aplicación.');
      cleanLocalBingo();
      try{ if(typeof bc!=='undefined'&&bc)bc.postMessage({type:'sync',t:Date.now()}); }catch(e){}
      alert('✅ Aplicación reiniciada.\n\nSe borró la operación anterior y los usuarios Miembro. Tu cuenta Admin se conservó para que puedas preparar la entrega.');
      location.reload();
    }catch(e){
      alert(e.message||'No fue posible reiniciar la aplicación.');
      button.disabled=false; button.textContent=old;
    }
  }

  function mount(){
    const settings=document.querySelector('#view-settings .grid.two');
    if(!settings)return;
    let card=document.getElementById('factoryResetCard');
    if(!isAdmin()){
      if(card)card.remove();
      return;
    }
    if(card)return;
    card=document.createElement('div');
    card.id='factoryResetCard'; card.className='card'; card.style.gridColumn='1 / -1';
    card.innerHTML=`
      <div class="section-title"><div><h3>♻️ Reiniciar aplicación para entrega</h3><div class="muted" style="margin-top:4px">Deja Bingo IMARA limpio para una nueva operación o para entregarlo a un cliente.</div></div></div>
      <div class="danger" style="margin-bottom:12px"><strong>Acción irreversible:</strong> elimina cartones, ventas, pagos, ganadores, balotas y usuarios Miembro de la nube. Conserva únicamente la cuenta Admin con la que estás conectado.</div>
      <div class="notice" style="margin-bottom:12px">💡 Antes de usarlo, descarga un Backup JSON si quieres conservar la operación actual.</div>
      <button class="btn bad" id="factoryResetBtn" type="button">♻️ Reiniciar aplicación</button>`;
    settings.appendChild(card);
    card.querySelector('#factoryResetBtn').addEventListener('click',e=>factoryReset(e.currentTarget));
  }

  const observer=new MutationObserver(mount);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(mount,1200);
  mount();
})();