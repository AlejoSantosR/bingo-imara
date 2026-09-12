/* Bingo IMARA · Integridad de pedidos POS */
(function(){
'use strict';
if(location.hash.startsWith('#public')||location.hash.startsWith('#mobile='))return;
let memberOpened=false;
function role(){const c=document.querySelector('#imaraUserChip .imara-role');if(!c)return '';if(c.classList.contains('admin'))return 'admin';if(c.classList.contains('finance'))return 'finance';if(c.classList.contains('member'))return 'member';return '';}
function memberFirst(){if(role()!=='member')return;const old=document.getElementById('imaraOps');if(old)old.style.display='none';const b=document.querySelector('.nav [data-view="pos"]');if(b&&!memberOpened){memberOpened=true;setTimeout(()=>b.click(),80);}}
function guardFinanceRows(){if(!['admin','finance'].includes(role()))return;document.querySelectorAll('#financeRows tbody tr').forEach(tr=>{const method=tr.querySelector('td:nth-child(5)')?.textContent||'';if(!/Pedido\s+[A-Z0-9]{6}|POS:[A-Z0-9]{6}/.test(method))return;const actions=tr.querySelector('.finance-actions');if(!actions)return;actions.querySelectorAll('[data-paid],[data-refund],[data-fin-reject],[data-edit]').forEach(b=>b.style.display='none');if(!actions.querySelector('.pos-order-only')){const s=document.createElement('span');s.className='pos-order-only';s.textContent='🧾 Gestionar pedido completo en POS';s.style.cssText='font-size:9px;color:var(--muted);padding:6px 2px';actions.prepend(s);}});}
function run(){memberFirst();guardFinanceRows();}
let tries=0;const boot=setInterval(()=>{tries++;run();if(tries>40||role())clearInterval(boot);},500);
setInterval(()=>{if(!document.hidden)run();},4000);run();
})();