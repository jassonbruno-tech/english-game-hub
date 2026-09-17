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
const testMode=params.get('teste')==='1';
$('roomCode').textContent=room;

function uid(){return 'dev_'+crypto.getRandomValues(new Uint32Array(4)).join('_')}
const deviceKey='tugDeviceId';
let deviceId;
if(testMode){deviceId=sessionStorage.getItem(deviceKey)||uid();sessionStorage.setItem(deviceKey,deviceId)}
else{deviceId=localStorage.getItem(deviceKey)||uid();localStorage.setItem(deviceKey,deviceId)}

const cfg=window.TUG_FIREBASE_CONFIG||{};
const firebaseReady=!!(cfg.apiKey&&cfg.databaseURL&&cfg.projectId&&window.firebase);
let myColor=null;

function renderMe(){
  const c=COLORS.find(x=>x.id===myColor);if(!c)return;
  const card=$('identity');
  card.hidden=false;
  card.style.setProperty('--team',c.hex);
  $('teamEmoji').textContent=c.emoji;
  $('teamName').textContent='VOCÊ É A '+c.name;
  $('teamName').style.color=c.hex;
  $('status').textContent='Equipe registrada neste computador. Aguarde as outras equipes.';
}
function renderTeams(teams){
  teams=teams||{};
  const n=COLORS.filter(c=>teams[c.id]).length;
  $('connected').textContent=n+'/4';
  COLORS.forEach(c=>{
    const el=$('slot-'+c.id),occupied=!!teams[c.id];
    el.classList.toggle('on',occupied);
    el.querySelector('.slotState').textContent=occupied?'CONECTADA':'AGUARDANDO';
  });
  $('readyBox').hidden=n!==4;
  if(n===4)$('status').textContent='As 4 equipes estão conectadas. Campeonato pronto para começar.';
}
function enterGame(){
  if(!myColor)return;
  const u=new URL('tug-of-war-final.html',location.href);
  u.searchParams.set('sala',room);u.searchParams.set('equipe',myColor);u.searchParams.set('modo',testMode?'teste-local':'multiplayer');u.searchParams.set('v','20260917-multi2');
  location.href=u.href;
}
$('enterGame').onclick=enterGame;

/* ===== PRODUÇÃO: FIREBASE ENTRE COMPUTADORES ===== */
async function startFirebase(){
  firebase.initializeApp(cfg);
  const db=firebase.database();
  const roomRef=db.ref('tugRooms/'+room),teamsRef=roomRef.child('teams'),meRef=roomRef.child('devices/'+deviceId);
  async function claim(){
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
  roomRef.on('value',snap=>renderTeams((snap.val()||{}).teams||{}));
  window.addEventListener('beforeunload',()=>{if(myColor){meRef.update({connected:false,lastSeen:firebase.database.ServerValue.TIMESTAMP});teamsRef.child(myColor).update({connected:false,lastSeen:firebase.database.ServerValue.TIMESTAMP})}});
  await claim();
}

/* ===== TESTE LOCAL: 4 ABAS NO MESMO COMPUTADOR ===== */
function startLocal(){
  const key='tugLocalRoom_'+room;
  const channel='BroadcastChannel' in window?new BroadcastChannel(key):null;
  $('setupBox').hidden=true;
  const testBadge=document.createElement('div');testBadge.textContent='MODO TESTE LOCAL';testBadge.style.cssText='position:fixed;right:12px;top:12px;z-index:9999;background:#7c3aed;color:#fff;font:900 11px Arial;padding:7px 10px;border-radius:999px;box-shadow:0 0 16px #a855f7';document.body.appendChild(testBadge);
  function read(){try{return JSON.parse(localStorage.getItem(key)||'{"teams":{},"devices":{}}')}catch{return {teams:{},devices:{}}}}
  function write(v){localStorage.setItem(key,JSON.stringify(v));channel?.postMessage('update');renderTeams(v.teams)}
  function claim(){
    const state=read();
    if(state.devices?.[deviceId]?.color){myColor=state.devices[deviceId].color;renderMe();renderTeams(state.teams);return}
    const free=COLORS.find(c=>!state.teams[c.id]);
    if(!free){$('status').textContent='Sala de teste cheia. Já existem 4 equipes nesta sala.';renderTeams(state.teams);return}
    myColor=free.id;state.teams[free.id]={deviceId,connected:true,joinedAt:Date.now()};state.devices[deviceId]={color:free.id};write(state);renderMe();
  }
  window.addEventListener('storage',e=>{if(e.key===key)renderTeams(read().teams)});channel?.addEventListener('message',()=>renderTeams(read().teams));
  const reset=$('resetLocal');if(reset){reset.hidden=false;reset.onclick=()=>{localStorage.removeItem(key);sessionStorage.removeItem(deviceKey);location.reload()}}
  claim();
}

if(firebaseReady){
  $('setupBox').hidden=true;
  startFirebase().catch(err=>{$('status').textContent='Erro ao conectar à sala: '+err.message});
}else if(testMode){
  startLocal();
}else{
  $('setupBox').hidden=false;
  $('status').textContent='Modo online preparado. Enquanto o Firebase não estiver configurado, use o link de teste local para simular 4 computadores em abas diferentes.';
}
})();
