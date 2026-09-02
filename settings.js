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

  if(!document.getElementById('prizesConfigCard')){
    const card=document.createElement('div');
    card.className='card';
    card.id='prizesConfigCard';
    card.style.gridColumn='1 / -1';
    card.innerHTML=`
      <div class="section-title">
        <div>
          <h3>🎁 Premios del evento</h3>
          <div class="muted" style="margin-top:4px">Organízalos como Primer premio, Segundo premio, Tercer premio… con texto e imagen.</div>
        </div>
        <div class="actions">
          <button class="btn primary" type="button" onclick="addPrize()">➕ Agregar premio</button>
          <button class="btn good" type="button" onclick="savePrizeConfig()">💾 Guardar premios</button>
        </div>
      </div>
      <div class="notice" style="margin-bottom:14px">Las imágenes de premios se guardan en el navegador y también viajan en el Backup JSON. Usa imágenes livianas (máx. aprox. 350 KB por premio).</div>
      <div id="prizeList"></div>`;
    grid.appendChild(card);
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
function renderPrizeConfig(){
  ensureSettingsExtras();
  const list=document.getElementById('prizeList'); if(!list)return;
  const prizes=prizesArray();
  if(!prizes.length){
    list.innerHTML='<div class="muted" style="padding:14px 0">Aún no has registrado premios. Pulsa “Agregar premio”.</div>';
    return;
  }
  list.innerHTML=prizes.map((p,i)=>`
    <div style="display:grid;grid-template-columns:110px 1fr auto;gap:14px;align-items:start;padding:14px 0;border-bottom:1px solid var(--line)">
      <div>
        ${p.image?`<img src="${p.image}" alt="${escapeHtml(ordinalPrizeLabel(i))}" style="width:100px;height:100px;object-fit:cover;border-radius:16px;border:1px solid var(--line)">`:
          `<div style="width:100px;height:100px;border-radius:16px;border:1px dashed var(--line);display:grid;place-items:center;font-size:34px">🎁</div>`}
        <label class="mini" style="display:block;text-align:center;margin-top:7px;cursor:pointer">🖼️ Imagen
          <input type="file" accept="image/*" hidden onchange="setPrizeImage('${p.id}',this.files&&this.files[0])">
        </label>
      </div>
      <div class="form-grid">
        <label>Orden<input class="input" value="${escapeHtml(ordinalPrizeLabel(i))}" disabled></label>
        <label>Nombre del premio<input class="input" value="${escapeHtml(p.title||'')}" oninput="updatePrizeField('${p.id}','title',this.value)" placeholder="Ej: Bono de bienestar"></label>
        <label class="full">Descripción<textarea class="input" oninput="updatePrizeField('${p.id}','description',this.value)" placeholder="Ej: Sesión de spa para dos personas">${escapeHtml(p.description||'')}</textarea></label>
        <label class="full" style="display:flex;grid-template-columns:auto 1fr;align-items:center;gap:10px;color:var(--text)">
          <input type="checkbox" ${p.showPublic?'checked':''} onchange="updatePrizeField('${p.id}','showPublic',this.checked)" style="width:20px;height:20px">
          Mostrar este premio en la pantalla pública
        </label>
      </div>
      <div class="mini-actions" style="display:grid">
        <button class="mini" type="button" onclick="movePrize('${p.id}',-1)" ${i===0?'disabled':''}>↑ Subir</button>
        <button class="mini" type="button" onclick="movePrize('${p.id}',1)" ${i===prizes.length-1?'disabled':''}>↓ Bajar</button>
        <button class="mini" type="button" onclick="usePrizeInRound('${p.id}')">🎱 Usar en ronda</button>
        <button class="mini" type="button" onclick="removePrize('${p.id}')" style="color:#ff9aa6">Eliminar</button>
      </div>
    </div>`).join('');
}
window.addPrize=function(){
  const p={id:'P'+Date.now()+Math.random().toString(16).slice(2),title:'',description:'',image:'',showPublic:false};
  prizesArray().push(p);
  renderPrizeConfig();
};
window.updatePrizeField=function(id,field,value){
  const p=prizesArray().find(x=>x.id===id); if(!p)return;
  p[field]=value;
};
window.setPrizeImage=async function(id,file){
  if(!file)return;
  if(file.size>350*1024){alert('La imagen supera ~350 KB. Usa una imagen más liviana para no llenar el almacenamiento del navegador.');return;}
  const p=prizesArray().find(x=>x.id===id); if(!p)return;
  p.image=await fileToDataURL(file);
  renderPrizeConfig();
};
window.removePrize=function(id){
  const i=prizesArray().findIndex(x=>x.id===id); if(i<0)return;
  if(!confirm(`¿Eliminar ${ordinalPrizeLabel(i)} de la configuración?`))return;
  state.prizes.splice(i,1); savePrizeConfig(false);
};
window.movePrize=function(id,delta){
  const a=prizesArray(), i=a.findIndex(x=>x.id===id), j=i+delta;
  if(i<0||j<0||j>=a.length)return;
  [a[i],a[j]]=[a[j],a[i]];
  renderPrizeConfig();
};
window.savePrizeConfig=function(showToast=true){
  addActivity(`Se configuraron ${prizesArray().length} premios del evento.`);
  saveState();
  if(showToast) toast('🎁 Premios guardados');
};
window.usePrizeInRound=function(id){
  const p=prizesArray().find(x=>x.id===id); if(!p)return;
  const i=prizesArray().findIndex(x=>x.id===id);
  const txt=[ordinalPrizeLabel(i),p.title,p.description].filter(Boolean).join(' · ');
  state.round.prize=txt;
  const field=document.getElementById('roundPrize'); if(field)field.value=txt;
  saveState();
  toast('🎁 Premio asignado a la ronda');
};

function renderPublicPrizeGallery(){
  const host=document.querySelector('#view-public .public-hero'); if(!host)return;
  let wrap=document.getElementById('publicPrizeGallery');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.id='publicPrizeGallery';
    wrap.style.marginTop='16px';
    host.appendChild(wrap);
  }
  const visible=prizesArray().map((p,i)=>({...p,_i:i})).filter(p=>p.showPublic);
  if(!visible.length){wrap.innerHTML='';wrap.classList.add('hidden');return;}
  wrap.classList.remove('hidden');
  wrap.innerHTML=`<div class="public-prize"><div class="muted">PREMIOS IMARA</div>
    <div style="display:grid;gap:8px;margin-top:9px;max-height:220px;overflow:auto">
      ${visible.map(p=>`<div style="display:grid;grid-template-columns:${p.image?'54px ':''}1fr;gap:9px;align-items:center;text-align:left;padding:8px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.04)">
        ${p.image?`<img src="${p.image}" alt="" style="width:54px;height:54px;object-fit:cover;border-radius:10px">`:''}
        <div><strong>${escapeHtml(ordinalPrizeLabel(p._i))}${p.title?' · '+escapeHtml(p.title):''}</strong>${p.description?`<div class="muted" style="font-size:11px;margin-top:3px">${escapeHtml(p.description)}</div>`:''}</div>
      </div>`).join('')}
    </div></div>`;
}

const _renderSettingsBase=renderSettings;
renderSettings=function(){
  _renderSettingsBase();
  renderPrizeConfig();
};
const _renderPublicBase=renderPublic;
renderPublic=function(){
  _renderPublicBase();
  renderPublicPrizeGallery();
};

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
