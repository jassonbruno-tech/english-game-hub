(()=>{
const COLORS=[
 {id:'blue',name:'EQUIPE AZUL',emoji:'🔵',hex:'#2563eb'},
 {id:'yellow',name:'EQUIPE AMARELA',emoji:'🟡',hex:'#eab308'}
];
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const room=(params.get('sala')||'TESTE2FILMES20092026A').replace(/[^a-zA-Z0-9_-]/g,'').toUpperCase();
$('roomCode').textContent=room;
function uid(){return 'dev_'+crypto.getRandomValues(new Uint32Array(4)).join('_')}
const deviceKey='tugDeviceIdTest2';
const deviceId=localStorage.getItem(deviceKey)||uid();localStorage.setItem(deviceKey,deviceId);
const cfg=window.TUG_SUPABASE_CONFIG||{};
const sb=(cfg.url&&cfg.key&&window.supabase?.createClient)?window.supabase.createClient(cfg.url,cfg.key):null;
let myColor=null,channel=null;

function renderMe(){
 const c=COLORS.find(x=>x.id===myColor);if(!c)return;
 $('identity').hidden=false;$('identity').style.setProperty('--team',c.hex);
 $('teamEmoji').textContent=c.emoji;$('teamName').textContent='VOCÊ É A '+c.name;$('teamName').style.color=c.hex;
}
function renderTeams(rows){
 const teams={};(rows||[]).filter(r=>r.connected&&['blue','yellow'].includes(r.color)).forEach(r=>teams[r.color]=r);
 const n=COLORS.filter(c=>teams[c.id]).length;$('connected').textContent=n+'/2';
 COLORS.forEach(c=>{const el=$('slot-'+c.id),on=!!teams[c.id];el.classList.toggle('on',on);el.querySelector('.slotState').textContent=on?(teams[c.id].device_id===deviceId?'VOCÊ':'CONECTADA'):'AGUARDANDO'});
 $('readyBox').hidden=n!==2;
 $('status').textContent=n===2?'Os 2 computadores estão conectados. A partida está pronta.':myColor?'Equipe registrada. Aguardando o outro computador...':'Conectando...';
}
async function loadTeams(){
 const {data,error}=await sb.from('tug_devices').select('*').eq('room_code',room);
 if(error)throw error;renderTeams(data);
}
async function start(){
 if(!sb){$('status').textContent='Supabase não carregou. Atualize a página.';return}
 const {data:color,error}=await sb.rpc('tug_claim_team',{p_room:room,p_device:deviceId});
 if(error)throw error;
 if(!['blue','yellow'].includes(color)){
   await sb.rpc('tug_disconnect',{p_room:room,p_device:deviceId});
   $('status').textContent='Esta sala de teste já tem dois computadores conectados.';await loadTeams();return;
 }
 myColor=color;renderMe();await loadTeams();
 channel=sb.channel('tug-test2-lobby-'+room)
  .on('postgres_changes',{event:'*',schema:'public',table:'tug_devices',filter:'room_code=eq.'+room},()=>loadTeams().catch(()=>{}))
  .subscribe();
 setInterval(()=>sb.from('tug_devices').update({connected:true,last_seen:new Date().toISOString()}).eq('room_code',room).eq('device_id',deviceId),20000);
 window.addEventListener('pagehide',()=>sb.rpc('tug_disconnect',{p_room:room,p_device:deviceId}));
}
$('enterGame').onclick=()=>{
 if(!myColor)return;
 const u=new URL('tug-teste2-game.html',location.href);
 u.searchParams.set('sala',room);u.searchParams.set('equipe',myColor);u.searchParams.set('v','1');location.href=u.href;
};
start().catch(e=>$('status').textContent='Erro de conexão: '+e.message);
})();