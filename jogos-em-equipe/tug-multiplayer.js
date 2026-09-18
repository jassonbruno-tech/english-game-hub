(()=>{
const COLORS=[
 {id:'blue',name:'EQUIPE AZUL',emoji:'🔵',hex:'#2563eb'},
 {id:'yellow',name:'EQUIPE AMARELA',emoji:'🟡',hex:'#eab308'},
 {id:'green',name:'EQUIPE VERDE',emoji:'🟢',hex:'#16a34a'},
 {id:'red',name:'EQUIPE VERMELHA',emoji:'🔴',hex:'#dc2626'}
];
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const room=(params.get('sala')||'LAB703').replace(/[^a-zA-Z0-9_-]/g,'').toUpperCase();
const soloMode=params.get('sim')==='1';
$('roomCode').textContent=room;
function uid(){return 'dev_'+crypto.getRandomValues(new Uint32Array(4)).join('_')}
const deviceKey='tugDeviceId';
const deviceId=soloMode?(sessionStorage.getItem(deviceKey)||uid()):(localStorage.getItem(deviceKey)||uid());
if(soloMode)sessionStorage.setItem(deviceKey,deviceId);else localStorage.setItem(deviceKey,deviceId);

const cfg=window.TUG_SUPABASE_CONFIG||{};
const onlineReady=!!(cfg.url&&cfg.key&&window.supabase?.createClient);
const sb=onlineReady?window.supabase.createClient(cfg.url,cfg.key):null;
let myColor=null,channel=null,heartbeat=null;

function renderMe(){
 const c=COLORS.find(x=>x.id===myColor);if(!c)return;
 const card=$('identity');card.hidden=false;card.style.setProperty('--team',c.hex);
 $('teamEmoji').textContent=c.emoji;$('teamName').textContent='VOCÊ É A '+c.name;$('teamName').style.color=c.hex;
 $('status').textContent=soloMode?'Equipe definida. As outras três equipes serão simuladas neste computador.':'Equipe registrada neste computador. Aguarde as outras equipes.';
}
function renderTeams(rows){
 const teams={};(rows||[]).filter(r=>r.connected).forEach(r=>teams[r.color]=r);
 const n=COLORS.filter(c=>teams[c.id]).length;$('connected').textContent=n+'/4';
 COLORS.forEach(c=>{const el=$('slot-'+c.id),on=!!teams[c.id];el.classList.toggle('on',on);el.querySelector('.slotState').textContent=on?(teams[c.id].device_id===deviceId?'VOCÊ':'CONECTADA'):'AGUARDANDO'});
 $('readyBox').hidden=n!==4;
 if(n===4)$('status').textContent='As 4 equipes estão conectadas. Campeonato pronto para começar.';
}
async function loadTeams(){
 const {data,error}=await sb.from('tug_devices').select('room_code,device_id,color,connected,last_seen').eq('room_code',room);
 if(error)throw error;renderTeams(data);
}
function enterGame(){
 if(!myColor)return;
 const target=soloMode?'tug-simulacao.html':'tug-multiplayer-game.html';
 const u=new URL(target,location.href);u.searchParams.set('sala',room);u.searchParams.set('equipe',myColor);u.searchParams.set('modo',soloMode?'simulacao':'multiplayer');u.searchParams.set('v','20260918-supabase1');location.href=u.href;
}
$('enterGame').onclick=enterGame;

function startSolo(){
 $('setupBox').hidden=true;myColor='blue';renderMe();
 const fake=COLORS.map(c=>({room_code:room,device_id:c.id===myColor?deviceId:'sim_'+c.id,color:c.id,connected:true}));renderTeams(fake);
 $('status').textContent='Simulação pronta: você joga pela Equipe Azul; as outras equipes serão automáticas.';$('readyBox').hidden=false;$('enterGame').textContent='▶ ENTRAR NO CAMPEONATO';
 const badge=document.createElement('div');badge.textContent='SIMULAÇÃO COMPLETA';badge.style.cssText='position:fixed;right:12px;top:12px;z-index:9999;background:linear-gradient(135deg,#06b6d4,#8b5cf6);color:#fff;font:900 11px Arial;padding:7px 10px;border-radius:999px;box-shadow:0 0 16px #22d3ee88';document.body.appendChild(badge);
}

async function startSupabase(){
 $('setupBox').hidden=true;$('status').textContent='Conectando ao campeonato...';
 const {data:color,error}=await sb.rpc('tug_claim_team',{p_room:room,p_device:deviceId});
 if(error)throw error;
 if(!color){$('status').textContent='Sala cheia. Os 4 computadores já foram definidos.';await loadTeams();return}
 myColor=color;renderMe();await loadTeams();
 channel=sb.channel('tug-lobby-'+room)
  .on('postgres_changes',{event:'*',schema:'public',table:'tug_devices',filter:'room_code=eq.'+room},()=>loadTeams().catch(()=>{}))
  .subscribe();
 heartbeat=setInterval(async()=>{if(!myColor)return;await sb.from('tug_devices').update({connected:true,last_seen:new Date().toISOString()}).eq('room_code',room).eq('device_id',deviceId)},20000);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&myColor)sb.from('tug_devices').update({connected:true,last_seen:new Date().toISOString()}).eq('room_code',room).eq('device_id',deviceId)});
 window.addEventListener('pagehide',()=>{if(myColor)sb.rpc('tug_disconnect',{p_room:room,p_device:deviceId})});
}

if(soloMode)startSolo();
else if(onlineReady)startSupabase().catch(err=>{$('setupBox').hidden=false;$('status').textContent='Erro ao conectar ao campeonato: '+err.message});
else{$('setupBox').hidden=false;$('status').textContent='Supabase não carregou. Atualize a página.'}
})();