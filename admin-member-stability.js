/* BINGO IMARA · Estabilidad formulario de Miembros
   Mantiene el borrador SOLO en memoria mientras el panel Admin se re-renderiza.
   No persiste contraseñas en localStorage/sessionStorage. */
(function(){
  'use strict';
  if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;

  const IDS=['newUser','newDisplay','newPass','newRole'];
  let draft={newUser:'',newDisplay:'',newPass:'',newRole:'member'};
  let touched=false;
  let activeId='';
  let lastInteraction=0;
  let submitting='';
  let submitStarted=0;
  let scheduled=false;

  function field(id){return document.getElementById(id);}
  function isMemberField(el){return !!el&&IDS.includes(el.id);}

  function snapshot(){
    const u=field('newUser'),d=field('newDisplay'),p=field('newPass'),r=field('newRole');
    if(!u||!d||!p||!r)return;
    draft={newUser:u.value,newDisplay:d.value,newPass:p.value,newRole:r.value||'member'};
    touched=true;
  }

  function userExists(username){
    if(!username)return false;
    const ops=document.getElementById('imaraOps');
    if(!ops)return false;
    return ops.textContent.toLowerCase().includes('@'+String(username).trim().toLowerCase());
  }

  function ensureHint(){
    const form=field('newUser')?.closest('.imara-form');
    if(!form||form.querySelector('.imara-member-form-hint'))return;
    const hint=document.createElement('div');
    hint.className='imara-member-form-hint full';
    hint.style.cssText='padding:8px 10px;border-radius:11px;background:rgba(141,107,255,.08);border:1px solid rgba(141,107,255,.18);color:#bfc9dc;font-size:11px';
    hint.textContent='🛡️ Puedes escribir tranquilo: el refresco automático ya no borrará este formulario.';
    form.appendChild(hint);
  }

  function successMessage(username){
    if(typeof toast==='function')toast(`✅ Miembro @${username} creado`);
    const box=document.querySelector('#imaraOps .imara-box:nth-of-type(2)');
    if(!box)return;
    let msg=box.querySelector('.imara-member-created');
    if(!msg){msg=document.createElement('div');msg.className='imara-member-created';box.insertBefore(msg,box.children[1]||null);}
    msg.style.cssText='margin:8px 0 12px;padding:9px 11px;border-radius:11px;background:rgba(43,212,167,.1);border:1px solid rgba(43,212,167,.26);color:#c9f4e7;font-size:12px';
    msg.textContent=`✅ Usuario @${username} creado correctamente.`;
    setTimeout(()=>msg?.remove(),5000);
  }

  function restore(){
    scheduled=false;
    const u=field('newUser'),d=field('newDisplay'),p=field('newPass'),r=field('newRole');
    if(!u||!d||!p||!r)return;
    ensureHint();

    if(submitting&&userExists(submitting)){
      const created=submitting;
      submitting='';submitStarted=0;touched=false;
      draft={newUser:'',newDisplay:'',newPass:'',newRole:'member'};
      u.value='';d.value='';p.value='';r.value='member';
      const btn=document.getElementById('createUserBtn');if(btn){btn.disabled=false;btn.textContent='Crear usuario';}
      successMessage(created);
      return;
    }

    if(submitting&&Date.now()-submitStarted>14000){
      submitting='';submitStarted=0;
      const btn=document.getElementById('createUserBtn');if(btn){btn.disabled=false;btn.textContent='Crear usuario';}
    }

    if(touched){
      if(!u.value)u.value=draft.newUser;
      if(!d.value)d.value=draft.newDisplay;
      if(!p.value)p.value=draft.newPass;
      r.value=draft.newRole||'member';
    }

    const btn=document.getElementById('createUserBtn');
    if(btn&&submitting){btn.textContent='Creando…';}

    if(activeId&&Date.now()-lastInteraction<2500){
      const el=field(activeId);
      if(el&&document.activeElement!==el){
        try{el.focus({preventScroll:true});if(typeof el.setSelectionRange==='function'){const n=el.value.length;el.setSelectionRange(n,n);}}catch(e){}
      }
    }
  }

  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(restore);}

  document.addEventListener('input',e=>{
    if(!isMemberField(e.target))return;
    activeId=e.target.id;lastInteraction=Date.now();snapshot();
  },true);
  document.addEventListener('change',e=>{
    if(!isMemberField(e.target))return;
    activeId=e.target.id;lastInteraction=Date.now();snapshot();
  },true);
  document.addEventListener('focusin',e=>{if(isMemberField(e.target)){activeId=e.target.id;lastInteraction=Date.now();}},true);

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('#createUserBtn');if(!btn)return;
    snapshot();
    const username=(draft.newUser||'').trim();
    if(!username)return;
    submitting=username;submitStarted=Date.now();
    setTimeout(()=>{const b=document.getElementById('createUserBtn');if(b&&submitting){b.textContent='Creando…';}},0);
    setTimeout(schedule,500);
    setTimeout(schedule,1800);
    setTimeout(schedule,4500);
  },true);

  const mo=new MutationObserver(schedule);
  mo.observe(document.body,{childList:true,subtree:true});
  schedule();
})();
