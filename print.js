function printableCardHtml(c,opts={}){
  const demo=!!opts.demo;
  const heads=['B','I','N','G','O'];
  const cells=heads.map(h=>`<div class="ph">${h}</div>`).join('')+
    c.grid.flat().map(v=>`<div class="pcell ${v==='FREE'?'free':''}">${v==='FREE'?'★':v}</div>`).join('');
  const logo=state.settings.logo?`<img class="plogo" src="${state.settings.logo}" alt="Logo">`:`<div class="plogoText">IM</div>`;
  return `<article class="ticket ${demo?'demoTicket':''}">
    ${demo?'<div class="demoRibbon">DEMO · NO VÁLIDO</div>':''}
    <header class="ticketTop">
      <div class="identity">${logo}<div><div class="event">${escapeHtml(state.settings.title)}</div><div class="org">${escapeHtml(state.settings.organizer)}</div></div></div>
      <div class="numberBox"><span>${demo?'Prueba':'Cartón'}</span><strong>${escapeHtml(c.id)}</strong></div>
    </header>
    <div class="priceLine"><span>${demo?'Cartón de demostración':`Valor: <strong>${money(state.settings.price)}</strong>`}</span><span>Modo 1–${state.settings.ballMax} · Premios sorpresa 🎁</span></div>
    <div class="pgrid">${cells}</div>
    <footer class="ticketFoot">
      <span>${demo?'No se registra en la base real':`Comprador: <b>${escapeHtml(c.buyer||'________________________')}</b>`}</span>
      <span>${demo?'NO VÁLIDO PARA PREMIOS':'Solo participa si está PAGADO'}</span>
    </footer>
    <div class="experiences">✨ Bienestar · 💵 Efectivo · 👨‍👩‍👧‍👦 Familia · 🎉 Y mucho más</div>
  </article>`;
}

function openPrintCards(cards,perPage=2,existingWindow=null,opts={}){
  if(!cards.length){alert('No hay cartones para imprimir.');return;}
  const w=existingWindow||window.open('',opts.demo?'BingoIMARADemo':'BingoIMARALote');
  if(!w){alert('El navegador bloqueó la ventana de impresión. Habilita ventanas emergentes para este sitio.');return;}
  const per=[1,2,4].includes(Number(perPage))?Number(perPage):2;
  const cssSize=per===1?'148mm':per===2?'94mm':'64mm';
  const gridCols=per===4?2:1;
  const title=opts.demo?'Cartones DEMO':'Cartones';
  w.document.open();
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${title} ${escapeHtml(state.settings.title)}</title><style>
    *{box-sizing:border-box} body{margin:0;background:#e9ecf3;font-family:Arial,Helvetica,sans-serif;color:#101421}
    .toolbar{position:sticky;top:0;z-index:10;padding:10px 14px;background:#11182a;color:#fff;display:flex;gap:10px;align-items:center;justify-content:space-between}
    .toolbar button{border:0;border-radius:9px;padding:9px 14px;font-weight:800;cursor:pointer}.toolbar small{opacity:.75}
    .pages{padding:10mm}.sheet{width:190mm;min-height:277mm;margin:0 auto 10mm;background:#fff;padding:8mm;display:grid;grid-template-columns:repeat(${gridCols},1fr);grid-auto-rows:${cssSize};gap:7mm;align-content:start;page-break-after:always;box-shadow:0 6px 22px #0002}
    .sheet:last-child{page-break-after:auto}.ticket{border:2px solid #151d2f;border-radius:16px;padding:5mm;display:flex;flex-direction:column;overflow:hidden;position:relative;background:linear-gradient(145deg,#fff 0%,#f8f6ff 60%,#fff0f5 100%)}
    .ticketTop{display:flex;justify-content:space-between;gap:10px;align-items:center}.identity{display:flex;align-items:center;gap:10px;min-width:0}.event{font-size:${per===4?'15px':'21px'};font-weight:900;letter-spacing:.3px}.org{font-size:${per===4?'8px':'11px'};color:#657089;margin-top:2px}.plogo,.plogoText{width:${per===4?'30px':'42px'};height:${per===4?'30px':'42px'};border-radius:10px;object-fit:contain}.plogoText{display:grid;place-items:center;color:white;font-weight:900;background:linear-gradient(135deg,#ff5b8f,#8d6bff)}
    .numberBox{text-align:right;white-space:nowrap}.numberBox span{display:block;text-transform:uppercase;font-size:${per===4?'7px':'10px'};color:#6c7485}.numberBox strong{font-size:${per===4?'16px':'24px'};color:#8d3d72}.priceLine{display:flex;justify-content:space-between;margin:${per===4?'4px':'7px'} 0;font-size:${per===4?'8px':'11px'};font-weight:700}
    .pgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:${per===4?'2px':'4px'};flex:1;min-height:0}.ph,.pcell{display:grid;place-items:center;border:1.5px solid #26334f;border-radius:${per===4?'4px':'7px'};font-weight:900}.ph{background:#151d2f;color:#fff;font-size:${per===4?'13px':'20px'}}.pcell{background:white;font-size:${per===4?'12px':'18px'}}.pcell.free{background:#e7ddff;color:#5b42aa}
    .ticketFoot{display:flex;justify-content:space-between;gap:8px;margin-top:${per===4?'3px':'6px'};font-size:${per===4?'7px':'10px'};font-weight:700}.experiences{text-align:center;margin-top:${per===4?'3px':'6px'};font-size:${per===4?'7px':'9px'};color:#5f687a}
    .demoTicket{border-style:dashed}.demoRibbon{position:absolute;top:${per===4?'7px':'10px'};left:-34px;transform:rotate(-35deg);background:#ffbf47;color:#3b2a00;font-size:${per===4?'7px':'10px'};font-weight:1000;padding:4px 38px;z-index:2;box-shadow:0 2px 6px #0002}
    @page{size:A4 portrait;margin:7mm}@media print{body{background:#fff}.toolbar{display:none}.pages{padding:0}.sheet{box-shadow:none;margin:0;width:auto;min-height:0;padding:0;gap:6mm}}
  </style></head><body><div class="toolbar"><div><strong>${cards.length} ${opts.demo?'cartones DEMO':'cartones'} listos</strong> <small>· ${per} por hoja${opts.demo?' · no afectan datos reales':''}</small></div><button onclick="window.print()">🖨️ Imprimir / Guardar PDF</button></div><main class="pages">`);
  for(let i=0;i<cards.length;i+=per){
    w.document.write('<section class="sheet">');
    cards.slice(i,i+per).forEach(c=>w.document.write(printableCardHtml(c,opts)));
    w.document.write('</section>');
  }
  w.document.write('</main></body></html>');
  w.document.close();
  w.focus();
}

function openBatchPrint(ids,perPage=2,existingWindow=null){
  const cards=ids.map(findCard).filter(Boolean);
  openPrintCards(cards,perPage,existingWindow,{demo:false});
}

window.openDemoPrint=function(count=4,perPage=2){
  count=Math.max(1,Math.min(20,Number(count)||4));
  const cards=[], seen=new Set();
  let guard=0;
  while(cards.length<count && guard<count*100){
    guard++;
    const grid=generateGrid(state.settings.ballMax), sig=signature(grid);
    if(seen.has(sig))continue;
    seen.add(sig);
    cards.push({
      id:`DEMO-${String(cards.length+1).padStart(3,'0')}`,
      buyer:'DEMO',status:'Demo',grid,ballMax:state.settings.ballMax
    });
  }
  openPrintCards(cards,perPage,null,{demo:true});
};

window.printCard=function(id){
  const c=findCard(id); if(!c)return;
  openBatchPrint([c.id],1);
};
