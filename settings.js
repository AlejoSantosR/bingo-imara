if(!Array.isArray(state.prizes)) state.prizes=[];

function ordinalPrizeLabel(index){
  const labels=['Primer premio','Segundo premio','Tercer premio','Cuarto premio','Quinto premio','Sexto premio','Séptimo premio','Octavo premio','Noveno premio','Décimo premio'];
  return labels[index] || `Premio ${index+1}`;
}
function prizesArray(){
  if(!Array.isArray(state.prizes)) state.prizes=[];
  return state.prizes;
}
function ensureSettingsExtras(){
  const grid=document.querySelector('#view-settings .grid.two');
  if(!grid) return;

  const legacyPrice=document.getElementById('settingPrice')?.closest('label');
  if(legacyPrice) legacyPrice.style.display='none';

  if(!document.getElementById('prizesConfigCard')){
    const card=document.createElement('div');
    card.className='card';
    card.id='prizesConfigCard';
    card.style.gridColumn='1 / -1';
    card.innerHTML=`
      <div class="section-title">
        <div>
          <h3>🎁 Premios del evento</h3>
          <div class="muted" style="margin-top:4px">Este es el catálogo oficial y su orden. En Juego solo seleccionas cuál corresponde a la ronda.</div>
        </div>
        <div class="actions">
          <button class="btn primary" type="button" onclick="addPrize()">➕ Agregar premio</button>
          <button class="btn good" type="button" onclick="savePrizeConfig()">💾 Guardar premios</button>
        </div>
      </div>
      <div class="form-grid" style="margin-bottom:14px">
        <label>Precio individual mostrado al público
          <input class="input" id="publicSinglePrice" type="number" min="0" value="${Number(state.settings.publicSinglePrice||30000)}">
        </label>
        <label>Combo de 2 mostrado al público
          <input class="input" id="publicComboPrice" type="number" min="0" value="${Number(state.settings.publicComboPrice||50000)}">
        </label>
      </div>
      <div class="notice" style="margin-bottom:14px">El orden se controla con ↑ y ↓. Tú cargas la imagen y el sistema la optimiza y guarda en la nube automáticamente. El catálogo queda disponible para el juego y la pantalla pública.</div>
      <div id="prizeList"></div>`;
    grid.appendChild(card);
  }else{
    const single=document.getElementById('publicSinglePrice'),combo=document.getElementById('publicComboPrice');
    if(single && document.activeElement!==single) single.value=Number(state.settings.publicSinglePrice||30000);
    if(combo && document.activeElement!==combo) combo.value=Number(state.settings.publicComboPrice||50000);
  }

  if(!document.getElementById('demoCardsCard')){
    const card=document.createElement('div');
    card.className='card';
    card.id='demoCardsCard';
    card.style.gridColumn='1 / -1';
    card.innerHTML=`
      <div class="section-title">
        <div>
          <h3>🧪 Cartones de prueba / demo</h3>
          <div class="muted" style="margin-top:4px">Para mostrar el sistema sin crear cartones reales ni afectar recaudo, pagos o ganadores.</div>
        </div>
      </div>
      <div class="form-grid">
        <label>Cantidad de cartones demo
          <input class="input" id="demoCount" type="number" min="1" max="20" value="4">
        </label>
        <label>Cartones por hoja
          <select class="input" id="demoPerPage">
            <option value="1">1 por hoja</option>
            <option value="2" selected>2 por hoja</option>
            <option value="4">4 por hoja</option>
          </select>
        </label>
      </div>
      <div class="success" style="margin-top:12px">✅ Los cartones DEMO llevan marca “NO VÁLIDO”, no se guardan en la base y no pueden convertirse en ganadores.</div>
      <div style="margin-top:12px"><button class="btn primary" id="printDemoBtn" type="button">🖨️ Generar / imprimir demo</button></div>`;
    grid.appendChild(card);
    card.querySelector('#printDemoBtn').addEventListener('click',()=>{
      const count=Math.max(1,Math.min(20,Number(document.getElementById('demoCount').value)||4));
      const perPage=Number(document.getElementById('demoPerPage').value)||2;
      openDemoPrint(count,[1,2,4].includes(perPage)?perPage:2);
    });
  }
}

const PRIZE_API='https://fpevaukkbtruplwptufu.supabase.co/functions/v1/bingo-prizes';
const PRIZE_SESSION='imaraPrivateSessionV1';

async function prizeApi(action,payload={}){
  const token=sessionStorage.getItem(PRIZE_SESSION)||'';
  if(!token)throw new Error('Inicia sesión como Admin para guardar premios.');
  const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),15000);
  try{
    const res=await fetch(PRIZE_API,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},cache:'no-store',signal:ctl.signal,body:JSON.stringify({action,...payload})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||'No fue posible sincronizar los premios.');
    return data;
  }finally{clearTimeout(tm);}
}
async function blobToDataURL(blob){return await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(blob);});}
async function optimizePrizeFile(file){
  if(!file||!String(file.type||'').startsWith('image/'))throw new Error('Selecciona una imagen válida.');
  if(file.size>8*1024*1024)throw new Error('La imagen original supera 8 MB.');
  try{
    const bmp=await createImageBitmap(file),max=1100,scale=Math.min(1,max/Math.max(bmp.width,bmp.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bmp.width*scale));canvas.height=Math.max(1,Math.round(bmp.height*scale));
    const ctx=canvas.getContext('2d');ctx.drawImage(bmp,0,0,canvas.width,canvas.height);bmp.close?.();
    let q=.84,blob=null;
    for(let i=0;i<4;i++){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',q));if(blob&&blob.size<=680000)break;q-=.12;}
    if(!blob)throw new Error();
    return await blobToDataURL(blob);
  }catch(e){
    if(file.size>760000)throw new Error('No pude optimizar esta imagen. Usa JPG, PNG o WEBP de menos de 760 KB.');
    return await fileToDataURL(file);
  }
}
function renderPrizeConfig(){
  ensureSettingsExtras();
  const list=document.getElementById('prizeList'); if(!list)return;
  const active=document.activeElement;
  if(active && active.closest && active.closest('#prizeList')) return;
  const prizes=prizesArray();
  if(!prizes.length){
    list.innerHTML='<div class="muted" style="padding:14px 0">Aún no has registrado premios. Pulsa “Agregar premio”.</div>';
    return;
  }
  list.innerHTML=prizes.map((p,i)=>`
    <div style="display:grid;grid-template-columns:130px 1fr auto;gap:16px;align-items:start;padding:16px 0;border-bottom:1px solid var(--line)">
      <div>
        ${p.image?`<div style="width:118px;height:118px;border-radius:22px;display:grid;place-items:center;background:radial-gradient(circle at 35% 28%,#fff4c2,#e5ad2c 72%,#80530c);overflow:hidden;box-shadow:0 14px 30px rgba(0,0,0,.22)"><img src="${p.image}" alt="${escapeHtml(ordinalPrizeLabel(i))}" style="width:100%;height:100%;object-fit:cover"></div>`:
          `<div style="width:118px;height:118px;border-radius:22px;display:grid;place-items:center;font-size:42px;background:radial-gradient(circle at 35% 28%,#fff4c2,#e5ad2c 72%,#80530c)">🎁</div>`}
        <label class="mini" style="display:block;text-align:center;margin-top:8px;cursor:pointer">🖼️ ${p.image?'Cambiar imagen':'Cargar imagen'}
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden onchange="setPrizeImage('${p.id}',this.files&&this.files[0])">
        </label>
        <div class="muted" style="text-align:center;font-size:10px;margin-top:5px">${p._uploading?'⏳ Subiendo…':p.image_url?'☁️ Guardada en nube':''}</div>
      </div>
      <div class="form-grid">
        <label>Orden<input class="input" value="${escapeHtml(ordinalPrizeLabel(i))}" disabled></label>
        <label>Nombre del premio<input class="input" value="${escapeHtml(p.title||'')}" oninput="updatePrizeField('${p.id}','title',this.value)" placeholder="Ej: Tea Set de Infusión"></label>
        <label class="full">Descripción<textarea class="input" oninput="updatePrizeField('${p.id}','description',this.value)" placeholder="Ej: Set de infusión premium para disfrutar en casa">${escapeHtml(p.description||'')}</textarea></label>
      </div>
      <div class="mini-actions" style="display:grid;gap:6px">
        <button class="mini" type="button" onclick="movePrize('${p.id}',-1)" ${i===0?'disabled':''}>↑ Subir</button>
        <button class="mini" type="button" onclick="movePrize('${p.id}',1)" ${i===prizes.length-1?'disabled':''}>↓ Bajar</button>
        <button class="mini" type="button" onclick="removePrize('${p.id}')" style="color:#ff9aa6">Eliminar</button>
      </div>
    </div>`).join('');
}
window.addPrize=function(){
  const p={id:'P'+Date.now()+Math.random().toString(16).slice(2),title:'',description:'',image:'',image_url:''};
  prizesArray().push(p);
  renderPrizeConfig();
};
window.updatePrizeField=function(id,field,value){
  const p=prizesArray().find(x=>x.id===id); if(!p)return;
  p[field]=value;
};
window.setPrizeImage=async function(id,file){
  if(!file)return;
  const p=prizesArray().find(x=>x.id===id); if(!p)return;
  p._uploading=true;renderPrizeConfig();
  try{
    const dataUrl=await optimizePrizeFile(file);
    p.image=dataUrl;renderPrizeConfig();
    const d=await prizeApi('upload',{id:p.id,data_url:dataUrl});
    p.image_url=d.image_url||'';
    p.image=p.image_url||dataUrl;
    delete p._uploading;
    saveState();
    renderPrizeConfig();
    toast?.('🖼️ Imagen del premio guardada en la nube');
  }catch(e){
    delete p._uploading;renderPrizeConfig();alert(e.message||'No fue posible cargar la imagen.');
  }
};
window.removePrize=async function(id){
  const i=prizesArray().findIndex(x=>x.id===id); if(i<0)return;
  if(!confirm(`¿Eliminar ${ordinalPrizeLabel(i)} de la configuración?`))return;
  state.prizes.splice(i,1);
  await savePrizeConfig(false);
  renderPrizeConfig();
};
window.movePrize=function(id,delta){
  const a=prizesArray(),i=a.findIndex(x=>x.id===id),j=i+delta;
  if(i<0||j<0||j>=a.length)return;
  [a[i],a[j]]=[a[j],a[i]];
  renderPrizeConfig();
};
window.savePrizeConfig=async function(showToast=true){
  const btn=document.querySelector('#prizesConfigCard .btn.good'),old=btn?.textContent||'💾 Guardar premios';
  if(btn){btn.disabled=true;btn.textContent='⏳ Guardando…';}
  try{
    state.settings.publicSinglePrice=Math.max(0,Number(document.getElementById('publicSinglePrice')?.value)||30000);
    state.settings.publicComboPrice=Math.max(0,Number(document.getElementById('publicComboPrice')?.value)||50000);
    const payload=prizesArray().map((p,i)=>({id:p.id,title:String(p.title||'').trim(),description:String(p.description||'').trim(),image_url:p.image_url||(!String(p.image||'').startsWith('data:')?p.image||'':''),sort_order:i}));
    const d=await prizeApi('save',{prizes:payload});
    const map=new Map((d.prizes||[]).map(p=>[p.id,p]));
    state.prizes=prizesArray().filter(p=>String(p.title||'').trim()).map(p=>{const x=map.get(p.id)||{};return {...p,image_url:x.image_url||p.image_url||'',image:x.image_url||p.image_url||p.image||''};});
    addActivity(`Se configuraron ${state.prizes.length} premios del evento.`);
    saveState();
    renderPrizeConfig();
    window.dispatchEvent(new CustomEvent('imara-prizes-updated',{detail:{prizes:state.prizes}}));
    if(showToast)toast('🎁 Premios guardados en la nube');
  }catch(e){alert(e.message||'No fue posible guardar los premios.');}
  finally{if(btn){btn.disabled=false;btn.textContent=old;}}
};
window.usePrizeInRound=function(id){
  const p=prizesArray().find(x=>x.id===id); if(!p)return;
  const i=prizesArray().findIndex(x=>x.id===id);
  const txt=[ordinalPrizeLabel(i),p.title,p.description].filter(Boolean).join(' · ');
  state.round.prizeId=p.id;
  state.round.prizeTitle=p.title||'';
  state.round.prizeDescription=p.description||'';
  state.round.prizeImage=p.image_url||p.image||'';
  state.round.prize=txt;
  state.round.reveal=true;
  const field=document.getElementById('roundPrize');if(field)field.value=txt;
  const reveal=document.getElementById('prizeReveal');if(reveal)reveal.value='yes';
  saveState();
  toast('🎁 Premio asignado a la ronda');
};

const _renderSettingsBase=renderSettings;
renderSettings=function(){
  _renderSettingsBase();
  renderPrizeConfig();
};

document.getElementById('saveSettingsBtn').addEventListener('click',async()=>{
  state.settings.title=document.getElementById('settingTitle').value.trim()||'BINGO IMARA';
  state.settings.publicSinglePrice=Math.max(0,Number(document.getElementById('publicSinglePrice')?.value)||30000);
  state.settings.publicComboPrice=Math.max(0,Number(document.getElementById('publicComboPrice')?.value)||50000);
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
    state=obj;
    if(!Array.isArray(state.prizes))state.prizes=[];
    addActivity('Se restauró un backup.'); saveState();
  }catch(err){alert('El archivo no parece ser un backup válido de Bingo IMARA.');}
  e.target.value='';
});
document.getElementById('wipeBtn').addEventListener('click',()=>{
  if(!confirm('Esto borrará cartones, pagos, balotas, imágenes, premios y ganadores de este navegador. ¿Continuar?'))return;
  state=defaultState(); state.prizes=[]; localStorage.removeItem(KEY); saveState();
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
