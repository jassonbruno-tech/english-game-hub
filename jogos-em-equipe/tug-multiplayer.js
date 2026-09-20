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
const test2Mode=params.get('teste2')==='1';
$('roomCode').textContent=room;
function uid(){return 'dev_'+crypto.getRandomValues(new Uint32Array(4)).join('_')}
const deviceKey='tugDeviceId';
const test2SessionKey='tugTest2Session';
const deviceId=soloMode?(sessionStorage.getItem(deviceKey)||uid()):(localStorage.getItem(deviceKey)||uid());
const test2Session=test2Mode?(sessionStorage.getItem(test2SessionKey)||uid()):null;
if(test2Mode)sessionStorage.setItem(test2SessionKey,test2Session);
if(soloMode)sessionStorage.setItem(deviceKey,deviceId);else localStorage.setItem(deviceKey,deviceId);

const cfg=window.TUG_SUPABASE_CONFIG||{};
const onlineReady=!!(cfg.url&&cfg.key&&window.supabase?.createClient);
const sb=onlineReady?window.supabase.createClient(cfg.url,cfg.key):null;
let myColor=null,channel=null,heartbeat=null,goingToGame=false;

function renderMe(){
 const c=COLORS.find(x=>x.id===myColor);if(!c)return;
 const card=$('identity');card.hidden=false;card.style.setProperty('--team',c.hex);
 $('teamEmoji').textContent=c.emoji;$('teamName').textContent='VOCÊ É A '+c.name;$('teamName').style.color=c.hex;
 $('status').textContent=soloMode?'Equipe definida. As outras três equipes serão simuladas neste computador.':test2Mode?(myColor==='blue'?'Você é a Equipe Azul. Aguardando a Equipe Amarela...':'Você é a Equipe Amarela. Aguardando a Equipe Azul...'):'Equipe registrada neste computador. Aguarde as outras equipes.';
}
function renderTeams(rows){
 const teams={};const cutoff=Date.now()-10000;(rows||[]).filter(r=>r.connected&&(!test2Mode||!r.last_seen||new Date(r.last_seen).getTime()>cutoff)).forEach(r=>teams[r.color]=r);
 const activeColors=test2Mode?COLORS.slice(0,2):COLORS;
 const n=activeColors.filter(c=>teams[c.id]).length;$('connected').textContent=n+'/'+(test2Mode?2:4);
 COLORS.forEach(c=>{const el=$('slot-'+c.id);if(test2Mode&&['green','red'].includes(c.id)){el.style.display='none';return}const on=!!teams[c.id];el.classList.toggle('on',on);el.querySelector('.slotState').textContent=on?(teams[c.id].device_id===(test2Mode?test2Session:deviceId)?'VOCÊ':'CONECTADA'):'AGUARDANDO'});
 $('readyBox').hidden=test2Mode?true:n!==4;
 const readyTitle=$('readyBox')?.querySelector('b');if(readyTitle&&test2Mode)readyTitle.textContent='✅ OS 2 COMPUTADORES ESTÃO PRONTOS';
 if(n===(test2Mode?2:4))$('status').textContent=test2Mode?'Os 2 computadores estão conectados. Preparando a partida...':'As 4 equipes estão conectadas. Campeonato pronto para começar.';
 if(test2Mode)updateTest2Gate(n);
}
function updateTest2Gate(n){
 if(!test2Mode)return;
 let gate=document.getElementById('test2Gate');
 if(!gate){
   gate=document.createElement('div');gate.id='test2Gate';
   gate.style.cssText='position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:radial-gradient(circle at 50% 15%,#172554,#020617 68%);color:#fff;padding:24px;font-family:Arial,sans-serif';
   gate.innerHTML='<div style="max-width:720px;width:94%;text-align:center;background:#0f172ae8;border:2px solid #60a5fa;border-radius:28px;padding:34px;box-shadow:0 0 60px #2563eb55"><div id="test2GateEmoji" style="font-size:72px"></div><h1 id="test2GateTitle" style="margin:8px 0;font-size:clamp(30px,5vw,52px)"></h1><p id="test2GateMsg" style="font-size:20px;color:#cbd5e1;margin:12px 0 0"></p><div id="test2GateDots" style="font-size:34px;letter-spacing:10px;margin-top:24px">● ○ ○</div></div>';
   document.body.appendChild(gate);
 }
 const c=COLORS.find(x=>x.id===myColor)||COLORS[0],other=myColor==='yellow'?'AZUL':'AMARELA';
 document.getElementById('test2GateEmoji').textContent=c.emoji;
 document.getElementById('test2GateTitle').textContent='VOCÊ É A '+c.name;
 if(n<2){
   gate.style.display='grid';
   document.getElementById('test2GateMsg').textContent='AGUARDANDO A EQUIPE '+other+' ENTRAR NA SALA...';
   document.getElementById('test2GateDots').textContent='● ○ ○';
 }else{
   document.getElementById('test2GateMsg').textContent='ADVERSÁRIO CONECTADO! PREPARANDO A PARTIDA...';
   document.getElementById('test2GateDots').textContent='● ● ●';
   if(!goingToGame)setTimeout(()=>{if(!goingToGame)enterGame()},700);
 }
}
async function loadTeams(){
 if(test2Mode){
   const cutoff=new Date(Date.now()-5000).toISOString();
   const {data,error}=await sb.from('tug_test2_presence').select('room_code,color,session_id,last_seen').eq('room_code',room).gte('last_seen',cutoff);
   if(error)throw error;
   const rows=(data||[]).map(r=>({room_code:r.room_code,color:r.color,device_id:r.session_id,connected:true,last_seen:r.last_seen}));
   renderTeams(rows);
   return;
 }
 const {data,error}=await sb.from('tug_devices').select('room_code,device_id,color,connected,last_seen').eq('room_code',room);
 if(error)throw error;renderTeams(data);
}
function enterGame(){
 if(!myColor)return;
 const target=soloMode?'tug-simulacao.html':'tug-multiplayer-game.html';
 const u=new URL(target,location.href);u.searchParams.set('sala',room);u.searchParams.set('equipe',myColor);u.searchParams.set('modo',soloMode?'simulacao':test2Mode?'teste2':'multiplayer');if(test2Mode){u.searchParams.set('teste2','1');u.searchParams.set('sessao',test2Session)}u.searchParams.set('v','20260920-svg-eyes3');goingToGame=true;location.href=u.href;
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
 const claimArgs=test2Mode?{p_room:room,p_session:test2Session}:{p_room:room,p_device:deviceId};
 const {data:color,error}=await sb.rpc(test2Mode?'tug_test2_claim':'tug_claim_team',claimArgs);
 if(error)throw error;
 if(!color){$('status').textContent=test2Mode?'Sala de teste cheia. Azul e Amarela já estão ocupadas.':'Sala cheia. Os 4 computadores já foram definidos.';await loadTeams();return}
 myColor=color;renderMe();await loadTeams();
 channel=sb.channel('tug-lobby-'+room+'-'+(test2Session||deviceId))
  .on('postgres_changes',{event:'*',schema:'public',table:test2Mode?'tug_test2_presence':'tug_devices',filter:'room_code=eq.'+room},()=>loadTeams().catch(()=>{}))
  .subscribe();
 heartbeat=setInterval(async()=>{if(!myColor)return;if(test2Mode)await sb.rpc('tug_test2_ping',{p_room:room,p_session:test2Session});else await sb.from('tug_devices').update({connected:true,last_seen:new Date().toISOString()}).eq('room_code',room).eq('device_id',deviceId)},test2Mode?1500:20000);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&myColor){if(test2Mode)sb.rpc('tug_test2_ping',{p_room:room,p_session:test2Session});else sb.from('tug_devices').update({connected:true,last_seen:new Date().toISOString()}).eq('room_code',room).eq('device_id',deviceId)}});
 window.addEventListener('pagehide',()=>{if(myColor&&!goingToGame){if(test2Mode)sb.rpc('tug_test2_leave',{p_room:room,p_session:test2Session});else sb.rpc('tug_disconnect',{p_room:room,p_device:deviceId})}});
}

if(test2Mode){
  document.querySelector('.slots').style.gridTemplateColumns='1fr 1fr';
  const help=document.querySelector('.testHelp');if(help)help.style.display='none';
  const counter=document.querySelector('.counter');if(counter)counter.firstChild.textContent='Computadores conectados: ';
  const hero=document.querySelector('.hero h1');if(hero)hero.textContent='🎬 TUG OF WAR — TESTE 2 PCs';
}

if(soloMode)startSolo();
else if(onlineReady)startSupabase().catch(err=>{$('setupBox').hidden=false;$('status').textContent='Erro ao conectar ao campeonato: '+err.message});
else{$('setupBox').hidden=false;$('status').textContent='Supabase não carregou. Atualize a página.'}
})();