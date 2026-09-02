/* BINGO IMARA · Soundscape 2026
   Solo pantalla pública. Sin archivos de audio, SDKs ni consultas de red.
   Web Audio se crea únicamente después de interacción del usuario. */
(function(){
  'use strict';
  if(!location.hash.startsWith('#public')) return;

  const PREF='imaraSound2026';
  let enabled=localStorage.getItem(PREF)==='on';
  let ctx=null, master=null, noiseBuffer=null;
  const timers=new Set();

  function installStyles(){
    if(document.getElementById('imaraSound2026Css')) return;
    const s=document.createElement('style');
    s.id='imaraSound2026Css';
    s.textContent=`
      .imara-sound26{position:fixed;right:16px;bottom:16px;z-index:999990;display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:999px;background:rgba(9,14,25,.76);border:1px solid rgba(255,255,255,.16);box-shadow:0 10px 35px rgba(0,0,0,.28);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
      .imara-sound26 button{border:0;border-radius:999px;padding:9px 13px;color:#fff;background:linear-gradient(135deg,rgba(255,91,143,.88),rgba(141,107,255,.9));font:800 12px/1 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;box-shadow:0 0 24px rgba(141,107,255,.18)}
      .imara-sound26 button.off{background:rgba(255,255,255,.08);box-shadow:none;color:#c7d0e0}
      .imara-sound26 span{font:800 9px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.8px;color:#b9c5d8;text-transform:uppercase;padding-right:5px}
      .imara-sound26.pulse{animation:imaraSoundPulse .5s cubic-bezier(.2,1.3,.3,1)}
      @keyframes imaraSoundPulse{0%{transform:scale(.94)}65%{transform:scale(1.06)}100%{transform:none}}
      @media(max-width:650px){.imara-sound26{right:10px;bottom:10px}.imara-sound26 span{display:none}.imara-sound26 button{padding:10px 12px}}
    `;
    document.head.appendChild(s);
  }

  function ensureAudio(){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return null;
    if(!ctx){
      ctx=new AC({latencyHint:'interactive'});
      master=ctx.createGain();
      master.gain.value=.62;
      const comp=ctx.createDynamicsCompressor();
      comp.threshold.value=-18; comp.knee.value=18; comp.ratio.value=5; comp.attack.value=.003; comp.release.value=.22;
      master.connect(comp).connect(ctx.destination);
    }
    if(ctx.state==='suspended') ctx.resume().catch(()=>{});
    return ctx;
  }

  function at(fn,ms){const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;}

  function osc(freq,start,dur,opt={}){
    if(!enabled) return;
    const c=ensureAudio(); if(!c||!master) return;
    const o=c.createOscillator(),g=c.createGain(),p=c.createStereoPanner?c.createStereoPanner():null;
    o.type=opt.type||'sine'; o.frequency.setValueAtTime(freq,start);
    if(opt.to) o.frequency.exponentialRampToValueAtTime(Math.max(20,opt.to),start+dur);
    g.gain.setValueAtTime(.0001,start);
    g.gain.exponentialRampToValueAtTime(opt.vol||.06,start+(opt.attack||.012));
    g.gain.exponentialRampToValueAtTime(.0001,start+dur);
    if(p){p.pan.value=opt.pan||0;o.connect(g).connect(p).connect(master);}else{o.connect(g).connect(master);}
    o.start(start);o.stop(start+dur+.03);
  }

  function noise(start,dur,opt={}){
    if(!enabled) return;
    const c=ensureAudio(); if(!c||!master) return;
    if(!noiseBuffer){
      noiseBuffer=c.createBuffer(1,Math.max(1,Math.floor(c.sampleRate*.5)),c.sampleRate);
      const d=noiseBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length*.35);
    }
    const src=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain(),p=c.createStereoPanner?c.createStereoPanner():null;
    src.buffer=noiseBuffer;filter.type=opt.filter||'bandpass';filter.frequency.value=opt.freq||1800;filter.Q.value=opt.q||.8;
    g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(opt.vol||.025,start+.02);g.gain.exponentialRampToValueAtTime(.0001,start+dur);
    if(p){p.pan.value=opt.pan||0;src.connect(filter).connect(g).connect(p).connect(master);}else{src.connect(filter).connect(g).connect(master);}
    src.start(start);src.stop(start+dur+.03);
  }

  function shimmer(base=880,delay=0){
    if(!enabled) return;
    const c=ensureAudio();if(!c)return;const t=c.currentTime+delay;
    [1,1.25,1.5,2].forEach((m,i)=>osc(base*m,t+i*.035,.32,{type:i%2?'triangle':'sine',vol:.024/(1+i*.15),pan:(i-1.5)*.22}));
    noise(t,.24,{freq:4600,q:1.4,vol:.012});
  }

  function spinStart(){
    if(!enabled) return;const c=ensureAudio();if(!c)return;const t=c.currentTime;
    noise(t,.42,{freq:1050,q:.55,vol:.035,pan:-.18});
    osc(150,t,.36,{type:'sine',to:315,vol:.045,pan:-.15});
    osc(235,t+.055,.32,{type:'triangle',to:470,vol:.028,pan:.18});
    at(()=>shimmer(720),210);
  }

  function ballReveal(){
    if(!enabled) return;const c=ensureAudio();if(!c)return;const t=c.currentTime;
    osc(392,t,.2,{type:'triangle',vol:.05,pan:-.16});
    osc(587.33,t+.055,.24,{type:'sine',vol:.055,pan:.16});
    osc(783.99,t+.12,.38,{type:'sine',vol:.047});
    shimmer(1046.5,.08);
  }

  function countdownStep(step){
    if(!enabled)return;const c=ensureAudio();if(!c)return;const t=c.currentTime;
    const notes=[329.63,440,587.33,783.99];const f=notes[Math.max(0,Math.min(3,step))];
    osc(f,t,.24,{type:'triangle',vol:.05,pan:step%2?0.12:-0.12});
    osc(f*2,t+.035,.18,{type:'sine',vol:.018});
    if(step===3) shimmer(1174.66,.03);
  }

  function winner(){
    if(!enabled)return;const c=ensureAudio();if(!c)return;const t=c.currentTime;
    noise(t,.55,{freq:2400,q:.7,vol:.026});
    [523.25,659.25,783.99,1046.5].forEach((f,i)=>{
      osc(f,t+i*.105,.48,{type:i%2?'triangle':'sine',vol:.055,pan:(i-1.5)*.12});
      osc(f*2,t+i*.105+.03,.34,{type:'sine',vol:.018});
    });
    at(()=>shimmer(1396.91),360);
    at(()=>shimmer(1760),620);
  }

  function preview(){
    const was=enabled;enabled=true;ensureAudio();spinStart();at(ballReveal,320);at(()=>{enabled=was;},900);
  }

  function installControl(){
    if(document.getElementById('imaraSound26')) return;
    const box=document.createElement('div');box.id='imaraSound26';box.className='imara-sound26';
    box.innerHTML=`<button type="button" id="imaraSound26Btn"></button><span>Audio · Show 2026</span>`;
    document.body.appendChild(box);
    const btn=box.querySelector('button');
    const paint=()=>{btn.textContent=enabled?'🔊 Sonido ON':'🔇 Activar sonido';btn.classList.toggle('off',!enabled);};
    paint();
    btn.addEventListener('click',()=>{
      enabled=!enabled;localStorage.setItem(PREF,enabled?'on':'off');paint();
      box.classList.remove('pulse');void box.offsetWidth;box.classList.add('pulse');
      if(enabled){ensureAudio();preview();}
    });
  }

  function listenGame(){
    if(typeof bc==='undefined'||!bc||typeof bc.addEventListener!=='function') return;
    bc.addEventListener('message',e=>{
      const d=e?.data||{};
      if(d.type==='spin-start'){
        spinStart();
        const ms=Math.max(250,Number(d.duration)||1350);
        at(ballReveal,Math.max(180,ms-110));
      }
      if(d.type==='winner-countdown'){
        countdownStep(0);at(()=>countdownStep(1),560);at(()=>countdownStep(2),1220);at(()=>countdownStep(3),1900);at(winner,2580);
      }
    });
  }

  installStyles();
  installControl();
  listenGame();
})();
