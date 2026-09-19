/* Bingo IMARA · Web Push service worker · no fetch caching */
self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{};}catch(_){data={body:event.data?.text?.()||''};}
  const title=String(data.title||'Bingo IMARA');
  const options={
    body:String(data.body||'Tienes un nuevo recordatorio del Bingo IMARA.'),
    icon:'./imara-icon.svg',
    badge:'./imara-icon.svg',
    tag:String(data.tag||'imara-reminder'),
    renotify:true,
    data:{url:String(data.url||'./')}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification.data?.url||'./';
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      try{
        if(new URL(client.url).origin===new URL(target,self.location.origin).origin){
          await client.focus();
          if('navigate' in client)await client.navigate(target);
          return;
        }
      }catch(_){}
    }
    if(self.clients.openWindow)await self.clients.openWindow(target);
  })());
});