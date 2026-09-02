/* BINGO IMARA · Cartón móvil táctil */
(function(){
  const LETTERS=['B','I','N','G','O'];

  function toBase64Url(obj){
    const bytes=new TextEncoder().encode(JSON.stringify(obj));
    let binary='';
    bytes.forEach(b=>binary+=String.fromCharCode(b));
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function fromBase64Url(s){
    s=s.replace(/-/g,'+').replace(/_/g,'/');
    while(s.length%4)s+='=';
    const binary=atob(s),bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  function payloadForCard(c){
    return {
      v:1,
      id:c.id,
      buyer:c.buyer||'',
      status:c.status||'',
      grid:c.grid,
      ballMax:Number(c.ballMax||state.settings.ballMax||99),
      title:state.settings.title||'BINGO IMARA',
      organizer:state.settings.organizer||'PL4 Tribu IMARA'
    };
  }
  function mobileUrl(c){
    const base=location.origin+location.pathname;
    return `${base}#mobile=${toBase64Url(payloadForCard(c))}`;
  }
  window.imaraMobileCardUrl=function(id){
    const c=findCard(id);return c?mobileUrl(c):'';
  };
  window.openMobileCard=function(id){
    const c=findCard(id);if(!c)return;
    window.open(mobileUrl(c),'_blank');
  };
  window.shareMobileCard=async function(id){
    const c=findCard(id);if(!c)return;
    const url=mobileUrl(c);
    try{
      if(navigator.share){
        await navigator.share({title:`${c.id} · ${c.buyer||'Bingo IMARA'}`,text:'Tu cartón digital de Bingo IMARA',url});
        return;
      }
      if(navigator.clipboard){await navigator.clipboard.writeText(url);toast('🔗 Enlace del cartón copiado');return;}
    }catch(e){return;}
    prompt('Copia este enlace y envíalo al participante:',url);
  };

  /* PDF/impresión: agrega enlace táctil al cartón móvil. */
  if(typeof printableCardHtml==='function'){
    const basePrintable=printableCardHtml;
    printableCardHtml=function(c,opts={}){
      let html=basePrintable(c,opts);
      const url=mobileUrl(c);
      const mobile=`<div style="margin-top:5px;text-align:center;font-size:9px;font-weight:800">
        <a href="${url}" target="_blank" style="color:#5b42aa;text-decoration:none">📱 Abrir cartón móvil · marcar / desmarcar desde el celular</a>
      </div>`;
      return html.replace('</article>',mobile+'</article>');
    };
  }

  /* Impresión individual con nombre sugerido del participante. */
  window.printCard=function(id){
    const c=findCard(id);if(!c)return;
    const safe=(c.buyer||'Sin nombre').replace(/[\\/:*?"<>|]+/g,' ').trim();
    const w=window.open('',`BingoIMARA_${c.id.replace(/\W/g,'_')}`);
    if(!w){alert('El navegador bloqueó la ventana de impresión. Habilita ventanas emergentes para este sitio.');return;}
    openPrintCards([c],1,w,{demo:/^DEMO-/i.test(c.id)});
    try{w.document.title=`${c.id} - ${safe||'Sin nombre'}`;}catch(e){}
  };

  /* Botones en gestión de cartones. */
  if(typeof renderCards==='function'){
    const baseRenderCards=renderCards;
    renderCards=function(){
      baseRenderCards();
      document.querySelectorAll('#cardsBody tr').forEach(tr=>{
        const first=tr.querySelector('td strong');
        const actions=tr.querySelector('.mini-actions');
        if(!first||!actions||actions.querySelector('[data-mobile-card]'))return;
        const id=first.textContent.trim();
        const open=document.createElement('button');
        open.className='mini';open.type='button';open.dataset.mobileCard=id;open.textContent='📱 Móvil';
        open.addEventListener('click',()=>window.openMobileCard(id));
        const share=document.createElement('button');
        share.className='mini';share.type='button';share.dataset.mobileShare=id;share.textContent='🔗 Compartir';
        share.addEventListener('click',()=>window.shareMobileCard(id));
        actions.append(open,share);
      });
    };
    renderCards();
  }

  function codeFor(value,col){
    if(value==='FREE')return '★';
    return `${LETTERS[col]}-${String(Number(value)).padStart(2,'0')}`;
  }
  function mobileMarksKey(id){return `imaraMobileMarks:${id}`;}
  function loadMarks(id){
    try{return new Set(JSON.parse(localStorage.getItem(mobileMarksKey(id))||'[]'));}catch(e){return new Set();}
  }
  function saveMarks(id,set){localStorage.setItem(mobileMarksKey(id),JSON.stringify([...set]));}

  function renderMobileCard(data){
    const marks=loadMarks(data.id);
    document.body.className='imara-mobile-body';
    document.body.innerHTML=`
      <main class="mobile-card-shell">
        <header class="mobile-card-top">
          <div class="mobile-brand">${window.IMARA_LOGO?`<img src="${window.IMARA_LOGO}" alt="IMARA">`:'IM'}</div>
          <div><div class="mobile-overline">${escapeHtml(data.organizer||'PL4 Tribu IMARA')}</div><h1>${escapeHtml(data.title||'BINGO IMARA')}</h1></div>
        </header>
        <section class="mobile-person">
          <div><span>Cartón</span><strong>${escapeHtml(data.id)}</strong></div>
          <div><span>Participante</span><strong>${escapeHtml(data.buyer||'Sin nombre asignado')}</strong></div>
        </section>
        <div class="mobile-help">Toca una casilla para marcarla con <strong>✕</strong>. Si te equivocas, vuelve a tocarla para desmarcarla.</div>
        <section class="mobile-grid" id="mobileGrid"></section>
        <div class="mobile-actions">
          <button type="button" id="mobileReset">↩ Desmarcar todo</button>
          <button type="button" id="mobileShare">📤 Compartir cartón</button>
        </div>
        <div class="mobile-note">🔒 Tus marcas se guardan solamente en este celular. El ganador oficial siempre lo valida Bingo IMARA con las balotas llamadas y el número de cartón.</div>
      </main>`;

    const style=document.createElement('style');
    style.textContent=`
      *{box-sizing:border-box}body.imara-mobile-body{margin:0;min-height:100vh;padding:18px;background:radial-gradient(circle at 20% 0%,#302450,#111827 48%,#0d1320);font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#fff}
      .mobile-card-shell{width:min(620px,100%);margin:auto}.mobile-card-top{display:flex;align-items:center;gap:13px;margin-bottom:16px}.mobile-brand{width:58px;height:58px;border-radius:18px;display:grid;place-items:center;font-weight:1000;background:linear-gradient(135deg,#ff5b8f,#8d6bff);overflow:hidden}.mobile-brand img{width:100%;height:100%;object-fit:contain}.mobile-overline{font-size:11px;letter-spacing:1.3px;color:#b7c1d6;font-weight:800}.mobile-card-top h1{margin:3px 0 0;font-size:23px}.mobile-person{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.mobile-person>div{background:#18223a;border:1px solid #34415f;border-radius:16px;padding:12px}.mobile-person span{display:block;font-size:10px;color:#aeb8ca;text-transform:uppercase;letter-spacing:1px}.mobile-person strong{display:block;margin-top:3px;font-size:16px}.mobile-help,.mobile-note{padding:11px 13px;border-radius:14px;background:rgba(141,107,255,.12);border:1px solid rgba(141,107,255,.26);font-size:13px;color:#dce2ee}.mobile-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:14px 0}.mobile-cell{aspect-ratio:1;border-radius:13px;border:1px solid #d6ddec;background:#fff;color:#111827;display:grid;place-items:center;position:relative;padding:2px;font-size:clamp(11px,3.5vw,18px);font-weight:1000;touch-action:manipulation}.mobile-cell.head{background:#151d2f;color:#fff;border-color:#36415c;font-size:22px}.mobile-cell.free{background:#e7ddff;color:#5b42aa}.mobile-cell.marked{background:#ffd4e2;border-color:#ff729e;color:#701e46;box-shadow:0 0 0 3px rgba(255,91,143,.16)}.mobile-cell.marked::after{content:"✕";position:absolute;font-size:clamp(30px,10vw,58px);line-height:1;color:rgba(176,20,77,.64);transform:rotate(-9deg);text-shadow:0 1px 0 #fff8}.mobile-cell.free::after{display:none}.mobile-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}.mobile-actions button{min-height:48px;border:1px solid #3a4768;border-radius:14px;background:#1a2540;color:#fff;font-weight:900;font-size:15px}.mobile-actions button:last-child{background:linear-gradient(135deg,#ff5b8f,#8d6bff);border:0}.mobile-note{background:rgba(43,212,167,.08);border-color:rgba(43,212,167,.22);color:#c8f5e8}@media(max-width:420px){body.imara-mobile-body{padding:12px}.mobile-person{grid-template-columns:1fr}.mobile-grid{gap:4px}.mobile-cell{border-radius:9px}}
    `;
    document.head.appendChild(style);

    const grid=document.getElementById('mobileGrid');
    LETTERS.forEach(l=>{const d=document.createElement('div');d.className='mobile-cell head';d.textContent=l;grid.appendChild(d);});
    for(let r=0;r<5;r++)for(let c=0;c<5;c++){
      const v=data.grid[r][c],key=`${r}-${c}`;
      const btn=document.createElement('button');btn.type='button';
      btn.className='mobile-cell'+(v==='FREE'?' free':'')+(marks.has(key)?' marked':'');
      btn.textContent=codeFor(v,c);btn.setAttribute('aria-pressed',marks.has(key)?'true':'false');
      if(v!=='FREE')btn.addEventListener('click',()=>{
        if(marks.has(key))marks.delete(key);else marks.add(key);
        saveMarks(data.id,marks);
        btn.classList.toggle('marked',marks.has(key));btn.setAttribute('aria-pressed',marks.has(key)?'true':'false');
      });
      grid.appendChild(btn);
    }
    document.getElementById('mobileReset').addEventListener('click',()=>{
      if(!confirm('¿Desmarcar todas las casillas de este cartón?'))return;
      marks.clear();saveMarks(data.id,marks);document.querySelectorAll('.mobile-cell.marked').forEach(x=>{x.classList.remove('marked');x.setAttribute('aria-pressed','false');});
    });
    document.getElementById('mobileShare').addEventListener('click',async()=>{
      try{
        if(navigator.share){await navigator.share({title:`${data.id} · Bingo IMARA`,text:`Cartón de ${data.buyer||'participante'}`,url:location.href});return;}
        if(navigator.clipboard){await navigator.clipboard.writeText(location.href);alert('Enlace copiado.');return;}
      }catch(e){return;}
      prompt('Copia este enlace:',location.href);
    });
    document.title=`${data.id} - ${data.buyer||'Bingo IMARA'}`;
  }

  const prefix='#mobile=';
  if(location.hash.startsWith(prefix)){
    try{renderMobileCard(fromBase64Url(location.hash.slice(prefix.length)));}
    catch(e){document.body.innerHTML='<div style="padding:30px;font-family:system-ui">No fue posible abrir este cartón móvil.</div>';}
  }
})();