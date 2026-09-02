const KEY = 'bingoImaraStateV2';
const CHANNEL = 'bingo-imara-sync-v2';
let bc = null;
try { bc = new BroadcastChannel(CHANNEL); } catch(e) {}

const defaultState = () => ({
  version: 2,
  settings: {
    title: 'BINGO IMARA',
    organizer: 'PL4 Tribu IMARA',
    price: 30000,
    message: 'Una experiencia para compartir, conectar y sorprendernos.',
    logo: window.IMARA_LOGO || '',
    ballMax: 99
  },
  cards: [],
  drawn: [],
  round: { name:'Ronda 1', pattern:'line', prize:'', reveal:false, status:'open' },
  winners: [],
  activity: []
});

let state = loadState();

function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed, {settings:Object.assign(defaultState().settings, parsed.settings||{}), round:Object.assign(defaultState().round, parsed.round||{})});
  }catch(e){ return defaultState(); }
}
function saveState(message='Actualización guardada'){
  localStorage.setItem(KEY, JSON.stringify(state));
  if(bc) bc.postMessage({type:'sync', t:Date.now()});
  renderAll();
}
if(bc) bc.onmessage = () => { state = loadState(); renderAll(); };
window.addEventListener('storage', e => { if(e.key===KEY){ state=loadState(); renderAll(); }});

function money(n){ return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0); }
function escapeHtml(v=''){ return String(v).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m])); }
function nowLocalInput(){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,16); }
function addActivity(text){
  state.activity.unshift({at:new Date().toISOString(), text});
  state.activity = state.activity.slice(0,30);
}
function animateBall(){
  ['lastBall','publicLastBall'].forEach(id=>{
    const el=document.getElementById(id); if(!el)return;
    el.classList.remove('ball-pop'); void el.offsetWidth; el.classList.add('ball-pop');
  });
}
function toast(msg){
  const old=document.querySelector('.toast'); if(old)old.remove();
  const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.appendChild(el);
  setTimeout(()=>el.remove(),2600);
}
function celebrate(){
  const colors=['#ff5b8f','#8d6bff','#2bd4a7','#ffbf47','#ffffff'];
  for(let i=0;i<90;i++){
    const x=document.createElement('i'); x.className='confetti';
    x.style.left=Math.random()*100+'vw'; x.style.background=colors[i%colors.length];
    x.style.setProperty('--dur',(2.4+Math.random()*2.2)+'s');
    x.style.setProperty('--rot',(Math.random()*360)+'deg');
    x.style.setProperty('--drift',((Math.random()-.5)*240)+'px');
    x.style.animationDelay=(Math.random()*.65)+'s'; document.body.appendChild(x);
    setTimeout(()=>x.remove(),5200);
  }
}
function cardId(n,prefix='IMARA'){ return `${prefix}-${String(n).padStart(3,'0')}`; }

function sampleUnique(min,max,count){
  const a=[]; for(let i=min;i<=max;i++)a.push(i);
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a.slice(0,count).sort((x,y)=>x-y);
}
function columnRanges(max){
  max=Number(max)||99;
  if(max===75) return [[1,15],[16,30],[31,45],[46,60],[61,75]];
  if(max===90) return [[1,18],[19,36],[37,54],[55,72],[73,90]];
  if(max===99) return [[1,20],[21,40],[41,60],[61,80],[81,99]];
  const ranges=[]; let start=1;
  for(let c=0;c<5;c++){
    const end=Math.floor(((c+1)*max)/5);
    ranges.push([start,end]); start=end+1;
  }
  return ranges;
}
function generateGrid(max=state.settings.ballMax){
  const ranges=columnRanges(max);
  const cols=ranges.map(([a,b])=>sampleUnique(a,b,5));
  const grid=[];
  for(let r=0;r<5;r++){
    const row=[];
    for(let c=0;c<5;c++) row.push(r===2&&c===2 ? 'FREE' : cols[c][r]);
    grid.push(row);
  }
  return grid;
}
function signature(grid){ return grid.flat().join(','); }

function generateCards(count,prefix,startNumber){
  prefix=(prefix||'IMARA').trim().toUpperCase();
  const existingGrids = new Set(state.cards.map(c=>signature(c.grid)));
  const existingIds = new Set(state.cards.map(c=>c.id.toUpperCase()));
  let nextNum=Math.max(1,Number(startNumber)||1);
  const createdCards=[];
  let guard=0;
  while(createdCards.length<count && guard<count*200){
    guard++;
    while(existingIds.has(cardId(nextNum,prefix).toUpperCase())) nextNum++;
    const grid=generateGrid(state.settings.ballMax), sig=signature(grid);
    if(existingGrids.has(sig)) continue;
    const card={
      id:cardId(nextNum++,prefix), buyer:'', phone:'', status:'Disponible', paidAt:'', notes:'', image:'',
      grid, ballMax:state.settings.ballMax, createdAt:new Date().toISOString()
    };
    existingGrids.add(sig); existingIds.add(card.id.toUpperCase());
    state.cards.push(card); createdCards.push(card);
  }
  if(createdCards.length!==count) throw new Error(`Solo se pudieron crear ${createdCards.length} de ${count} cartones.`);
  addActivity(`Se generó un lote de ${createdCards.length} cartones (${createdCards[0]?.id} a ${createdCards[createdCards.length-1]?.id}).`);
  saveState();
  return createdCards;
}

function normalizeCardQuery(q){
  q=String(q||'').trim().toUpperCase();
  if(/^\d+$/.test(q)){
    const n=Number(q);
    const found=state.cards.find(c => Number((c.id.match(/(\d+)$/)||[])[1])===n);
    return found?.id || q;
  }
  return q;
}
function findCard(q){
  const norm=normalizeCardQuery(q);
  return state.cards.find(c=>c.id.toUpperCase()===norm);
}

function patternName(p){ return ({line:'Línea',corners:'4 esquinas',x:'X completa',full:'Cartón lleno'})[p]||p; }
function cellMarked(v){ return v==='FREE' || state.drawn.includes(Number(v)); }
function validatePattern(card){
  const m=card.grid.map(row=>row.map(cellMarked));
  if(state.round.pattern==='full') return m.flat().every(Boolean);
  if(state.round.pattern==='corners') return m[0][0]&&m[0][4]&&m[4][0]&&m[4][4];
  if(state.round.pattern==='x'){
    return [0,1,2,3,4].every(i=>m[i][i]) && [0,1,2,3,4].every(i=>m[i][4-i]);
  }
  const rows=m.some(r=>r.every(Boolean));
  const cols=[0,1,2,3,4].some(c=>m.every(r=>r[c]));
  const d1=[0,1,2,3,4].every(i=>m[i][i]);
  const d2=[0,1,2,3,4].every(i=>m[i][4-i]);
  return rows||cols||d1||d2;
}

function renderBoard(targetId, cls='num'){
  const el=document.getElementById(targetId); if(!el)return;
  el.innerHTML='';
  const max=Number(state.settings.ballMax)||99;
  const latest=state.drawn.length?state.drawn[state.drawn.length-1]:null;
  for(let i=1;i<=max;i++){
    const d=document.createElement('div');
    d.className=cls+(state.drawn.includes(i)?' hit':'')+(i===latest?' latest':'');
    d.textContent=i;
    el.appendChild(d);
  }
}

function renderBingoCard(card, target, highlight=true){
  if(!card){ target.innerHTML='<div class="muted">Sin cartón.</div>'; return; }
  const heads=['B','I','N','G','O'];
  let html=`<div class="bingo-card"><div class="bingo-head"><div><strong>${escapeHtml(card.id)}</strong><div style="font-size:12px;color:#61708a">${escapeHtml(card.buyer||'Sin comprador')}</div></div><span class="badge ${card.status}">${card.status}</span></div><div class="bingo-grid">`;
  heads.forEach(h=>html+=`<div class="cell head">${h}</div>`);
  for(let r=0;r<5;r++) for(let c=0;c<5;c++){
    const v=card.grid[r][c], marked=cellMarked(v);
    html+=`<div class="cell ${v==='FREE'?'free':''} ${highlight&&marked?'called':''}">${v==='FREE'?'★':v}</div>`;
  }
  html+='</div></div>';
  target.innerHTML=html;
}
