(()=>{
const COLORS=[
 {id:'blue',name:'EQUIPE AZUL',emoji:'🔵',hex:'#2563eb'},
 {id:'yellow',name:'EQUIPE AMARELA',emoji:'🟡',hex:'#eab308'},
 {id:'green',name:'EQUIPE VERDE',emoji:'🟢',hex:'#16a34a'},
 {id:'red',name:'EQUIPE VERMELHA',emoji:'🔴',hex:'#dc2626'}
];
const $=id=>document.getElementById(id);
const room=(new URLSearchParams(location.search).get('sala')||'LAB703').replace(/[^a-zA-Z0-9_-]/g,'').toUpperCase();
const deviceKey='tugDeviceId';
let deviceId=localStorage.getItem(deviceKey);
if(!deviceId){deviceId='dev_'+crypto.getRandomValues(new Uint32Array(4)).join('_');localStorage.setItem(deviceKey,deviceId)}
$('roomCode').textContent=room;
const cfg=window.TUG_FIREBASE_CONFIG||{};
const configured=cfg.apiKey&&cfg.databaseURL&&cfg.projectId;
if(!configured){
  $('setupBox').hidden=false;
  $('status').textContent='Multiplayer preparado. Falta conectar o Firebase para sincronizar os 4 computadores.';
  return;
}
firebase.initializeApp(cfg);
const db=firebase.database();
const roomRef=db.ref('tugRooms/'+room);
const teamsRef=roomRef.child('teams');
const meRef=roomRef.child('devices/'+deviceId);
let myColor=null;

async function claimTeam(){
  const existing=(await meRef.once('value')).val();
  if(existing?.color){myColor=existing.color;renderMe();return}
  for(const c of COLORS){
    const ref=teamsRef.child(c.id);
    const tx=await ref.transaction(v=>{
      if(v===null||v?.deviceId===deviceId)return {deviceId,connected:true,joinedAt:firebase.database.ServerValue.TIMESTAMP};
      return;
    });
    if(tx.committed){myColor=c.id;await meRef.set({color:c.id,connected:true,joinedAt:firebase.database.ServerValue.TIMESTAMP});renderMe();return}
  }
  $('status').textContent='Sala cheia. Os 4 computadores de equipe já foram definidos.';
}
function renderMe(){
  const c=COLORS.find(x=>x.id===myColor);if(!c)return;
  $('identity').hidden=false;
  $('teamEmoji').textContent=c.emoji;
  $('teamName').textContent='VOCÊ É A '+c.name;
  $('teamName').style.color=c.hex;
  $('teamCard').style.setProperty('--team',c.hex);
  $('status').textContent='Equipe registrada neste computador. Aguarde as outras equipes.';
}
function renderRoom(snap){
  const v=snap.val()||{};
  const teams=v.teams||{};
  const n=COLORS.filter(c=>teams[c.id]).length;
  $('connected').textContent=n+'/4';
  COLORS.forEach(c=>{
    const el=$('slot-'+c.id); const occupied=!!teams[c.id];
    el.classList.toggle('on',occupied);
    el.querySelector('.slotState').textContent=occupied?'CONECTADA':'AGUARDANDO';
  });
  if(n===4){
    $('status').textContent='As 4 equipes estão conectadas. Campeonato pronto para começar.';
    $('readyBox').hidden=false;
  }
}
roomRef.on('value',renderRoom);
window.addEventListener('beforeunload',()=>{if(myColor){meRef.update({connected:false,lastSeen:firebase.database.ServerValue.TIMESTAMP});teamsRef.child(myColor).update({connected:false,lastSeen:firebase.database.ServerValue.TIMESTAMP})}});
$('enterGame').onclick=()=>{
  if(!myColor)return;
  const u=new URL('tug-of-war-final.html',location.href);u.searchParams.set('sala',room);u.searchParams.set('equipe',myColor);u.searchParams.set('modo','multiplayer');u.searchParams.set('v','20260917-multi1');location.href=u.href;
};
claimTeam().catch(err=>{$('status').textContent='Erro ao conectar à sala: '+err.message});
})();
