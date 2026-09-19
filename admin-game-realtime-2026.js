/* Bingo IMARA · Admin Realtime bridge · SAFE 2026
   Una sola conexión Realtime para el Dashboard Admin.
   No modifica ventas, POS, finanzas ni reglas del juego. */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
if(window.__imaraAdminGameRealtime2026)return;
window.__imaraAdminGameRealtime2026=true;

const SUPABASE_URL='https://fpevaukkbtruplwptufu.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_Yol0FuWEAsM01Q75iOUggg_kYyNlknF';
const REALTIME_AUTH='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZXZhdWtrYnRydXBsd3B0dWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMjA1MTIsImV4cCI6MjEwMzg5NjUxMn0.zEfiiwIBigfCJcV4d_BOnZRp2Qx6SZRdiyfG5Kyp7UQ';
const TOPIC='imara:game:main';

let client=null,channel=null,connected=false,connecting=false,reconnectTimer=null,fallbackTimer=null,reconnectDelay=1800;

function isAdmin(){return !!document.querySelector('#imaraUserChip .imara-role.admin');}
function emit(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}));}
function clearTimers(){clearTimeout(reconnectTimer);clearTimeout(fallbackTimer);}
function scheduleFallback(){
 clearTimeout(fallbackTimer);
 if(connected||document.hidden||!navigator.onLine||!isAdmin())return;
 fallbackTimer=setTimeout(()=>{
   if(!connected&&isAdmin()){
     emit('imara-game-sync-request',{reason:'realtime-disconnected',at:Date.now()});
     scheduleFallback();
   }
 },15000+Math.floor(Math.random()*1800));
}
function scheduleReconnect(delay=reconnectDelay){
 clearTimeout(reconnectTimer);
 scheduleFallback();
 if(document.hidden||!navigator.onLine||!isAdmin())return;
 reconnectTimer=setTimeout(()=>connect(),delay+Math.floor(Math.random()*650));
 reconnectDelay=Math.min(12000,Math.round(reconnectDelay*1.7));
}
async function disconnect(){
 connected=false;connecting=false;clearTimers();
 if(client&&channel){try{await client.removeChannel(channel);}catch(_){}}
 channel=null;
 emit('imara-game-realtime-status',{connected:false});
}
async function connect(){
 if(connected||connecting||document.hidden||!navigator.onLine||!isAdmin())return;
 connecting=true;
 try{
   if(!client){
     const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm');
     client=mod.createClient(SUPABASE_URL,PUBLISHABLE_KEY,{
       auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
       realtime:{params:{eventsPerSecond:10}}
     });
     client.realtime.setAuth(REALTIME_AUTH);
   }
   if(channel){try{await client.removeChannel(channel);}catch(_){} channel=null;}
   channel=client.channel(TOPIC,{config:{private:true}});
   channel
    .on('broadcast',{event:'game-state'},msg=>{
      const payload=msg?.payload;
      if(payload?.game)emit('imara-game-realtime',payload);
    })
    .subscribe(status=>{
      if(status==='SUBSCRIBED'){
        connected=true;connecting=false;reconnectDelay=1800;clearTimers();
        emit('imara-game-realtime-status',{connected:true});
        return;
      }
      if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
        connected=false;connecting=false;
        emit('imara-game-realtime-status',{connected:false,status});
        scheduleReconnect(status==='TIMED_OUT'?3200:1800);
      }
    });
 }catch(e){
   connected=false;connecting=false;
   console.warn('Admin Realtime:',e);
   scheduleReconnect(3500);
 }
}

const observer=new MutationObserver(()=>{if(isAdmin()&&!connected&&!connecting)connect();});
observer.observe(document.documentElement,{childList:true,subtree:true});

document.addEventListener('visibilitychange',()=>{
 if(document.hidden)return;
 if(isAdmin()&&!connected){emit('imara-game-sync-request',{reason:'visible',at:Date.now()});connect();}
});
window.addEventListener('online',()=>{if(isAdmin()){emit('imara-game-sync-request',{reason:'online',at:Date.now()});connect();}});
window.addEventListener('offline',()=>{connected=false;connecting=false;clearTimers();emit('imara-game-realtime-status',{connected:false,status:'OFFLINE'});});
window.addEventListener('pagehide',()=>{observer.disconnect();disconnect();});

if(isAdmin())connect();
})();