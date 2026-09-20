(()=>{
const TOTAL=15;
const sb=window.__tugSupabase,room=window.__tugRoom,player=window.__tugPlayer;
if(!sb||!room||!T[player])return;
if(window.__tugTest2){
const TEST_TOTAL=15, TEST_MATCH='semi1', testOpponent=player==='blue'?'yellow':'blue';
const TEST_Q=[
 {q:'Qual personagem é um ogro verde?',o:['Shrek','Simba','Woody','Nemo'],a:'Shrek'},
 {q:'Em Procurando Nemo, que animal é Nemo?',o:['Peixe-palhaço','Tartaruga','Golfinho','Tubarão'],a:'Peixe-palhaço'},
 {q:'Quem mora em um abacaxi no fundo do mar?',o:['Bob Esponja','Scooby-Doo','Mickey','Sonic'],a:'Bob Esponja'},
 {q:'Qual herói usa um escudo com uma estrela?',o:['Capitão América','Batman','Homem-Aranha','Thor'],a:'Capitão América'},
 {q:'Em Toy Story, qual personagem é um cowboy?',o:['Woody','Buzz','Rex','Forky'],a:'Woody'},
 {q:'Qual princesa tem poderes de gelo em Frozen?',o:['Elsa','Ariel','Mulan','Moana'],a:'Elsa'},
 {q:'Em O Rei Leão, qual é o nome do protagonista?',o:['Simba','Scar','Timon','Rafiki'],a:'Simba'},
 {q:'Qual dupla de desenho vive perseguindo um ao outro?',o:['Tom e Jerry','Shrek e Fiona','Woody e Buzz','Anna e Elsa'],a:'Tom e Jerry'},
 {q:'Qual herói costuma lançar teias?',o:['Homem-Aranha','Hulk','Batman','Superman'],a:'Homem-Aranha'},
 {q:'Em Harry Potter, qual esporte é jogado em vassouras?',o:['Quadribol','Futebol','Basquete','Beisebol'],a:'Quadribol'},
 {q:'Qual personagem é um cão detetive medroso e adora lanches?',o:['Scooby-Doo','Snoopy','Pluto','Pateta'],a:'Scooby-Doo'},
 {q:'Em Os Incríveis, qual é o sobrenome da família?',o:['Parr','Parker','Wayne','Stark'],a:'Parr'},
 {q:'Qual filme famoso tem um parque com dinossauros?',o:['Jurassic Park','Titanic','Avatar','Jumanji'],a:'Jurassic Park'},
 {q:'Quem é o parceiro de Woody que usa traje espacial?',o:['Buzz Lightyear','Rex','Slink','Andy'],a:'Buzz Lightyear'},
 {q:'Em Frozen, qual boneco de neve gosta de abraços quentinhos?',o:['Olaf','Sven','Kristoff','Hans'],a:'Olaf'},
 {q:'Qual herói é conhecido como o Homem de Aço?',o:['Superman','Batman','Hulk','Thor'],a:'Superman'},
 {q:'Qual personagem azul corre em altíssima velocidade?',o:['Sonic','Stitch','Dory','Gênio'],a:'Sonic'},
 {q:'Em Moana, quem é o semideus que acompanha a protagonista?',o:['Maui','Hércules','Aladdin','Tarzan'],a:'Maui'}
];
let testChannel=null,testCurrent=null,testLastRound=-1,testLastPhase='',testTimer=null,testStarted=false;
const tx=id=>document.getElementById(id);
const tshuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const torder=()=>tshuffle(TEST_Q.map((_,i)=>i)).slice(0,TEST_TOTAL);
const tq=m=>TEST_Q[(m.question_order||[])[m.round]]||TEST_Q[0];
const ta=(m,t)=>m?.answers?.[String(m.round)]?.[t];
const ts=(m,t)=>Number(m?.scores?.[t]||0);
function tsync(m){L=player;R=testOpponent;ls=ts(m,player);rs=ts(m,testOpponent);qi=m.round;sd=m.round>=TEST_TOTAL}
function tpaint(){
 L=player;R=testOpponent;const a=T[player],b=T[testOpponent];
 tx('leftName').textContent=a.short;tx('rightName').textContent=b.short;
 tx('leftTeamLabel').textContent=a.icon+' '+a.name;tx('rightTeamLabel').textContent=b.icon+' '+b.name;
 tx('leftScoreName').style.color=a.color;tx('rightScoreName').style.color=b.color;
 tx('leftCard').style.setProperty('--team-color',a.color);tx('rightCard').style.setProperty('--team-color',b.color);
 [...tx('leftPeople').children].forEach(p=>p.style.setProperty('--shirt',a.color));[...tx('rightPeople').children].forEach(p=>p.style.setProperty('--shirt',b.color));
 tx('stageLabel').textContent='TESTE 2 COMPUTADORES';
 document.querySelectorAll('.chip').forEach(x=>x.classList.remove('current'));
 if(tx('chip1')){tx('chip1').textContent='🎬 Filmes & Desenhos';tx('chip1').classList.add('current')}
 if(tx('chip2'))tx('chip2').textContent='🔵 Azul × Amarela';if(tx('chip3'))tx('chip3').textContent='🧪 Teste online';
 const bs=document.querySelector('.brand small');if(bs)bs.textContent='Teste de sincronização em 2 computadores • perguntas em português';
 const rn=document.querySelector('.right-note');if(rn)rn.textContent='Resposta adversária oculta até a revelação';
 const tp=document.querySelector('.test-panel');if(tp)tp.style.display='none';
 resetMoods();resetFaces();setRope(0);
}
async function tensure(){const {error}=await sb.rpc('tug_get_or_create_match',{p_room:room,p_match_id:TEST_MATCH,p_stage:'semi',p_team_a:'blue',p_team_b:'yellow',p_order:torder()});if(error)throw error}
async function tfetch(){const {data,error}=await sb.from('tug_matches').select('*').eq('room_code',room).eq('match_id',TEST_MATCH).single();if(error)throw error;return data}
function trender(m){
 testCurrent=m;tsync(m);rev=false;la=ra=null;tx('leftScore').textContent=ls;tx('rightScore').textContent=rs;
 tx('resultBox').style.display='none';tx('resultBox').classList.remove('celebrate');tx('leftStatus').textContent='Sua equipe responde';tx('rightStatus').textContent='Aguardando resposta';
 const q=tq(m);tx('qText').textContent=q.q;tx('qMeta').textContent=m.round>=TEST_TOTAL?'DESEMPATE — MORTE SÚBITA':'Pergunta '+(m.round+1)+'/'+TEST_TOTAL;
 opts('left',sh(q.o));opts('right',sh(q.o));[...tx('rightOptions').children].forEach(b=>{b.disabled=true;b.classList.remove('selected','correct','wrong');b.style.cursor='default'});
 const mine=ta(m,player),other=ta(m,testOpponent);
 if(mine!==undefined){la=mine;[...tx('leftOptions').children].forEach(b=>{b.disabled=true;if(b.dataset.value===mine)b.classList.add('selected')});tx('leftStatus').textContent='Resposta enviada ✓'}
 if(other!==undefined){ra=other;tx('rightStatus').textContent='Resposta enviada ✓'}
 tx('arenaMsg').textContent=mine!==undefined&&other!==undefined?'As duas equipes responderam. Conferindo...':'Escolha uma resposta.';clock();
}
async function tsubmit(v){if(!testCurrent||testCurrent.phase!=='answering')return;const {error}=await sb.rpc('tug_submit_answer',{p_room:room,p_match_id:TEST_MATCH,p_round:testCurrent.round,p_team:player,p_answer:v});if(error)throw error}
pick=function(side,v,b){if(side!=='left'||rev||la!==null||!testCurrent||testCurrent.phase!=='answering')return;la=v;[...tx('leftOptions').children].forEach(x=>{x.disabled=true;x.classList.remove('selected')});b.classList.add('selected');tx('leftStatus').textContent='Resposta enviada ✓';tx('arenaMsg').textContent='Resposta enviada. Aguardando o outro computador...';tsubmit(v).catch(()=>{})};
timeout=function(){if(rev||!testCurrent||testCurrent.phase!=='answering')return;if(la===null){la='TIME';[...tx('leftOptions').children].forEach(b=>b.disabled=true);tx('leftStatus').textContent='TEMPO ESGOTADO ⏰';tsubmit('TIME').catch(()=>{})}};
async function tresolve(m){if(ta(m,m.team_a)===undefined||ta(m,m.team_b)===undefined)return;const {error}=await sb.rpc('tug_resolve_round',{p_room:room,p_match_id:TEST_MATCH,p_round:m.round,p_correct:tq(m).a,p_total:TEST_TOTAL});if(error)throw error}
function treveal(m){
 stop();testCurrent=m;tsync(m);rev=true;const q=tq(m),mine=ta(m,player),other=ta(m,testOpponent);if(mine===undefined||other===undefined)return;
 la=mine;ra=other;mark('left',mine,q.a);mark('right',other,q.a);const okL=mine===q.a,okR=other===q.a;
 tx('leftStatus').textContent=okL?'ACERTOU! ✅':mine==='TIME'?'TEMPO ESGOTADO ⏰':'ERROU ✖';tx('rightStatus').textContent=okR?'ACERTOU! ✅':other==='TIME'?'TEMPO ESGOTADO ⏰':'ERROU ✖';
 tx('leftScore').textContent=ls;tx('rightScore').textContent=rs;
 if(okL&&okR){tx('resultBox').textContent='As duas equipes acertaram!';bothPull()}else if(okL){tx('resultBox').textContent=T[player].name+' venceu a rodada!';pull('left')}else if(okR){tx('resultBox').textContent=T[testOpponent].name+' venceu a rodada!';pull('right')}else{tx('resultBox').textContent='As duas equipes erraram. Resposta correta: '+q.a+'.';resetFaces()}
 tx('resultBox').style.display='block';if(m.phase==='resolved'){clearTimeout(testTimer);testTimer=setTimeout(()=>tadvance(m.round),3000)}
}
async function tadvance(r){await sb.rpc('tug_advance_round',{p_room:room,p_match_id:TEST_MATCH,p_round:r,p_next_question:Math.floor(Math.random()*TEST_Q.length)})}
function tend(m){
 stop();tsync(m);const won=m.winner===player,w=won?tx('leftPeople'):tx('rightPeople'),l=won?tx('rightPeople'):tx('leftPeople');w.classList.add('final-winner');l.classList.add('final-loser');setFace(w,'laugh');setFace(l,'panic');
 tx('arenaMsg').textContent=won?'🎉 SUA EQUIPE VENCEU O TESTE!':'👏 TESTE ENCERRADO — A OUTRA EQUIPE VENCEU.';
 let box=document.getElementById('test2End');if(!box){box=document.createElement('div');box.id='test2End';box.style.cssText='position:fixed;inset:0;z-index:20000;display:grid;place-items:center;background:#020617cc;backdrop-filter:blur(8px);padding:20px';box.innerHTML='<div style="max-width:620px;width:92%;text-align:center;background:#0f172a;border:2px solid #67e8f9;border-radius:24px;padding:28px;color:#fff;box-shadow:0 0 50px #22d3ee44"><div style="font-size:54px">'+(won?'🏆':'👏')+'</div><h2>'+(won?'SUA EQUIPE VENCEU!':'PARTIDA ENCERRADA')+'</h2><p>Teste multiplayer concluído. Placar: '+ts(m,player)+' × '+ts(m,testOpponent)+'.</p></div>';document.body.appendChild(box)}
}
function ton(m){
 if(!m?.team_a)return;testCurrent=m;tsync(m);
 if(m.phase==='answering'){if(testLastRound!==m.round||testLastPhase!=='answering'){testLastRound=m.round;testLastPhase='answering';trender(m)}if(ta(m,m.team_a)!==undefined&&ta(m,m.team_b)!==undefined){stop();tresolve(m).catch(()=>{})}}
 else if(m.phase==='resolved'){if(testLastRound!==m.round||testLastPhase!=='resolved'){testLastRound=m.round;testLastPhase='resolved';treveal(m)}}
 else if(m.phase==='finished'){if(testLastPhase==='finished')return;testLastPhase='finished';treveal(m);setTimeout(()=>tend(m),2200)}
}
function tReadySequence(done){
 stop();rev=true;
 const ro=tx('roundOverlay'),rn=tx('roundNumber'),ready=document.querySelector('.ready-text'),co=tx('countdownOverlay'),cn=tx('countdownNumber');
 if(rn)rn.textContent='VOCÊ ESTÁ PREPARADO?';
 if(ready)ready.textContent='AS DUAS EQUIPES ESTÃO NA SALA';
 if(ro)ro.classList.add('show');
 setTimeout(()=>{
   if(ro)ro.classList.remove('show');
   let n=3;
   const step=()=>{
     if(co)co.classList.add('show');
     if(cn){cn.textContent=n>0?String(n):'COMEÇAR!';cn.classList.remove('count-pop');void cn.offsetWidth;cn.classList.add('count-pop')}
     if(n>0){n--;setTimeout(step,700)}
     else setTimeout(()=>{if(co)co.classList.remove('show');done()},650);
   };
   step();
 },1600);
}
async function tbegin(){
 if(testStarted)return;testStarted=true;tpaint();await tensure();
 const first=await tfetch();
 tReadySequence(()=>{
   testChannel=sb.channel('tug-test2-'+room+'-'+player).on('postgres_changes',{event:'UPDATE',schema:'public',table:'tug_matches',filter:'room_code=eq.'+room},p=>{if(p.new?.match_id===TEST_MATCH)ton(p.new)}).subscribe();
   ton(first);
 });
}
function tlaunch(){tbegin().catch(e=>{if(tx('arenaMsg'))tx('arenaMsg').textContent='Erro de sincronização: '+e.message})}
startMatch=tlaunch;reset=tlaunch;
return;
}

let matchId=null,stage='semi',opponent=null,currentState=null,nextStage=null;
let channel=null,lastRenderedRound=-1,lastRenderedPhase='',advanceTimer=null,postMatchTimer=null,booted=false;
const $s=id=>document.getElementById(id);

function randInt(n){return Math.floor(Math.random()*n)}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=randInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function buildOrder(n=TOTAL){const out=[];while(out.length<n)out.push(...shuffle(Q.map((_,i)=>i)));return out.slice(0,n)}
function answerAt(m,round,team){return m?.answers?.[String(round)]?.[team]}
function scoreOf(m,team){return Number(m?.scores?.[team]||0)}
function currentQ(m){const idx=(m.question_order||[])[m.round];return Q[idx]||Q[0]}

function cleanupFinalState(){
 clearTimeout(postMatchTimer);
 [$s('leftPeople'),$s('rightPeople')].forEach(el=>{
  if(!el)return;
  el.classList.remove('final-winner','final-loser','winner','loser','pulling');
  el.style.transform='';
  el.querySelectorAll('.tear').forEach(t=>t.style.display='');
 });
 resetFaces();
}
function setHeader(){
 document.querySelectorAll('.chip').forEach(x=>x.classList.remove('current'));
 if($s('chip1'))$s('chip1').textContent='⚔️ Semifinal';
 if($s('chip2'))$s('chip2').textContent='🥉 3º lugar';
 if($s('chip3'))$s('chip3').textContent='🏆 Final';
 if(stage==='semi'){$s('stageLabel').textContent='SEMIFINAL';$s('chip1')?.classList.add('current')}
 else if(stage==='final'){$s('stageLabel').textContent='FINAL';$s('chip3')?.classList.add('current')}
 else{$s('stageLabel').textContent='DISPUTA DE 3º LUGAR';$s('chip2')?.classList.add('current')}
}
function paintTeams(){
 cleanupFinalState();L=player;R=opponent;
 const a=T[L],b=T[R];
 $s('leftName').textContent=a.short;$s('rightName').textContent=b.short;
 $s('leftTeamLabel').textContent=a.icon+' '+a.name;$s('rightTeamLabel').textContent=b.icon+' '+b.name;
 $s('leftScoreName').style.color=a.color;$s('rightScoreName').style.color=b.color;
 $s('leftCard').style.setProperty('--team-color',a.color);$s('rightCard').style.setProperty('--team-color',b.color);
 [...$s('leftPeople').children].forEach(p=>p.style.setProperty('--shirt',a.color));
 [...$s('rightPeople').children].forEach(p=>p.style.setProperty('--shirt',b.color));
 setHeader();resetMoods();resetFaces();setRope(0);
}
function ensureDock(){
 if(document.getElementById('multiAdvanceDock'))return;
 const style=document.createElement('style');
 style.textContent=`
 #multiAdvanceDock{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:10050;display:none;align-items:center;gap:12px;padding:10px 12px 10px 16px;background:linear-gradient(145deg,#071226ee,#151b3aee);border:1px solid #67e8f988;border-radius:20px;box-shadow:0 10px 32px #000b,0 0 24px #22d3ee55;backdrop-filter:blur(10px);max-width:min(920px,94vw)}
 #multiAdvanceDock.show{display:flex}
 #multiAdvanceMsg{font-size:15px;font-weight:900;color:#eaf8ff;white-space:nowrap}
 #multiAdvanceBtn{border:0;border-radius:14px;padding:14px 22px;font-size:clamp(16px,2vw,22px);font-weight:1000;cursor:pointer;color:#04131e;background:linear-gradient(135deg,#facc15,#39ff99,#22d3ee);box-shadow:0 0 22px #22d3ee77,0 5px 0 #0e7490;white-space:nowrap}
 #multiAdvanceBtn:disabled{cursor:wait;filter:grayscale(.55);opacity:.7;box-shadow:none}
 @media(max-width:720px){#multiAdvanceDock{flex-direction:column;width:92vw;text-align:center}#multiAdvanceMsg{white-space:normal}#multiAdvanceBtn{width:100%}}`;
 document.head.appendChild(style);
 const dock=document.createElement('div');dock.id='multiAdvanceDock';
 dock.innerHTML='<div id="multiAdvanceMsg"></div><button id="multiAdvanceBtn" type="button"></button>';
 document.body.appendChild(dock);document.getElementById('multiAdvanceBtn').onclick=goNextStage;
}
function hideDock(){document.getElementById('multiAdvanceDock')?.classList.remove('show')}

async function fetchSemis(){
 const {data,error}=await sb.from('tug_matches').select('*').eq('room_code',room).in('match_id',['semi1','semi2']);
 if(error)throw error;
 const map={};(data||[]).forEach(m=>map[m.match_id]=m);return map;
}
async function showDockAfterSemi(){
 ensureDock();
 const dock=$s('multiAdvanceDock'),msg=$s('multiAdvanceMsg'),btn=$s('multiAdvanceBtn');
 const semis=await fetchSemis(),won=currentState?.winner===player;
 nextStage=won?'final':'third';dock.classList.add('show');
 if(semis.semi1?.winner&&semis.semi2?.winner){
  msg.textContent=won?'🏆 Classificado! A final já está pronta.':'🥉 A disputa de 3º lugar já está pronta.';
  btn.textContent=won?'IR PARA A FINAL ➜':'IR PARA O 3º LUGAR ➜';btn.disabled=false;
 }else{
  msg.textContent=won?'🏆 Classificado! Aguardando a outra semifinal...':'🥉 Aguardando o resultado da outra semifinal...';
  btn.textContent='AGUARDANDO OUTRA SEMIFINAL';btn.disabled=true;
 }
}
function playEndCelebration(userWon){
 cleanupFinalState();
 const winner=userWon?$s('leftPeople'):$s('rightPeople'),loser=userWon?$s('rightPeople'):$s('leftPeople');
 winner.classList.add('final-winner');loser.classList.add('final-loser');
 setFace(winner,'laugh');setFace(loser,'panic');
 $s('arenaMsg').textContent=userWon?'🎉 SUA EQUIPE VENCEU! COMEMORE!':'👏 FIM DE JOGO — A OUTRA EQUIPE VENCEU.';
}

async function ensureMatch(id,teamA,teamB,stg){
 const order=buildOrder();
 const {data,error}=await sb.rpc('tug_get_or_create_match',{p_room:room,p_match_id:id,p_stage:stg,p_team_a:teamA,p_team_b:teamB,p_order:order});
 if(error)throw error;return data;
}
async function fetchMatch(id){
 const {data,error}=await sb.from('tug_matches').select('*').eq('room_code',room).eq('match_id',id).single();
 if(error)throw error;return data;
}
async function startStage(id,teamA,teamB,stg){
 clearTimeout(advanceTimer);clearTimeout(postMatchTimer);hideDock();cleanupFinalState();
 if(channel){await sb.removeChannel(channel);channel=null}
 matchId=id;stage=stg;opponent=teamA===player?teamB:teamA;currentState=null;lastRenderedRound=-1;lastRenderedPhase='';
 paintTeams();await ensureMatch(id,teamA,teamB,stg);
 channel=sb.channel('tug-match-'+room+'-'+id+'-'+player)
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'tug_matches',filter:'room_code=eq.'+room},payload=>{
    if(payload.new?.match_id===matchId)onMatch(payload.new)
  }).subscribe();
 onMatch(await fetchMatch(id));
}

function renderQuestion(m){
 cleanupFinalState();rev=false;la=ra=null;L=player;R=opponent;
 ls=scoreOf(m,player);rs=scoreOf(m,opponent);$s('leftScore').textContent=ls;$s('rightScore').textContent=rs;
 $s('resultBox').style.display='none';$s('resultBox').classList.remove('celebrate');$s('winnerFlash').classList.remove('show');
 $s('leftStatus').textContent='Sua equipe responde';$s('rightStatus').textContent='Aguardando resposta';$s('arenaMsg').textContent='Responda pela sua equipe.';
 const q=currentQ(m);$s('qText').textContent=q.q;$s('qMeta').textContent=m.round>=TOTAL?'DESEMPATE — morte súbita':`Pergunta ${m.round+1}/${TOTAL}`;
 opts('left',sh(q.o));opts('right',sh(q.o));
 [...$s('rightOptions').children].forEach(b=>{b.disabled=true;b.classList.remove('selected','correct','wrong');b.style.cursor='default'});
 const mine=answerAt(m,m.round,player),theirs=answerAt(m,m.round,opponent);
 if(mine!==undefined){la=mine;[...$s('leftOptions').children].forEach(b=>{b.disabled=true;if(b.dataset.value===mine)b.classList.add('selected')});$s('leftStatus').textContent='Resposta enviada ✓'}
 if(theirs!==undefined){ra=theirs;$s('rightStatus').textContent='Resposta enviada ✓'}
 if(mine!==undefined&&theirs!==undefined)$s('arenaMsg').textContent='As duas equipes responderam. Conferindo...';
 clock();
}
async function submitAnswer(value){
 if(!currentState||currentState.phase!=='answering')return;
 const {error}=await sb.rpc('tug_submit_answer',{p_room:room,p_match_id:matchId,p_round:currentState.round,p_team:player,p_answer:value});
 if(error)throw error;
}
pick=function(side,v,b){
 if(side!=='left'||rev||la!==null||!currentState||currentState.phase!=='answering')return;
 la=v;[...$s('leftOptions').children].forEach(x=>{x.disabled=true;x.classList.remove('selected')});b.classList.add('selected');
 $s('leftStatus').textContent='Resposta enviada ✓';$s('arenaMsg').textContent='Resposta enviada. Aguardando a outra equipe...';
 submitAnswer(v).catch(e=>{$s('arenaMsg').textContent='Falha ao enviar resposta. Tente atualizar a página.'});
};
timeout=function(){
 if(rev||!currentState||currentState.phase!=='answering')return;
 if(la===null){la='TIME';[...$s('leftOptions').children].forEach(b=>b.disabled=true);$s('leftStatus').textContent='TEMPO ESGOTADO ⏰';submitAnswer('TIME').catch(()=>{})}
};
async function tryResolve(m){
 if(m.phase!=='answering')return;
 const a=answerAt(m,m.round,m.team_a),b=answerAt(m,m.round,m.team_b);
 if(a===undefined||b===undefined)return;
 const q=currentQ(m);
 const {error}=await sb.rpc('tug_resolve_round',{p_room:room,p_match_id:matchId,p_round:m.round,p_correct:q.a,p_total:TOTAL});
 if(error)throw error;
}
function revealResult(m){
 stop();rev=true;const q=currentQ(m),mine=answerAt(m,m.round,player),theirs=answerAt(m,m.round,opponent);
 if(mine===undefined||theirs===undefined)return;
 la=mine;ra=theirs;mark('left',mine,q.a);mark('right',theirs,q.a);
 const okL=mine===q.a,okR=theirs===q.a;
 $s('leftStatus').textContent=okL?'ACERTOU! ✅':mine==='TIME'?'TEMPO ESGOTADO ⏰':'ERROU ✖';
 $s('rightStatus').textContent=okR?'ACERTOU! ✅':theirs==='TIME'?'TEMPO ESGOTADO ⏰':'ERROU ✖';
 ls=scoreOf(m,player);rs=scoreOf(m,opponent);$s('leftScore').textContent=ls;$s('rightScore').textContent=rs;
 if(okL&&okR){$s('resultBox').textContent='As duas equipes acertaram!';bothPull()}
 else if(okL){$s('resultBox').textContent=T[player].name+' venceu a rodada!';pull('left')}
 else if(okR){$s('resultBox').textContent=T[opponent].name+' venceu a rodada!';pull('right')}
 else{$s('resultBox').textContent='As duas equipes erraram. Resposta correta: '+q.a+'.';resetFaces()}
 $s('resultBox').style.display='block';
 if(m.phase==='resolved'){clearTimeout(advanceTimer);advanceTimer=setTimeout(()=>advanceRound(m.round),3000)}
}
async function advanceRound(round){
 const {error}=await sb.rpc('tug_advance_round',{p_room:room,p_match_id:matchId,p_round:round,p_next_question:randInt(Q.length)});
 if(error)throw error;
}
function onMatch(m){
 currentState=m;if(!m?.team_a||!m?.team_b)return;
 opponent=m.team_a===player?m.team_b:m.team_a;
 ls=scoreOf(m,player);rs=scoreOf(m,opponent);$s('leftScore').textContent=ls;$s('rightScore').textContent=rs;
 if(m.phase==='answering'){
  if(lastRenderedRound!==m.round||lastRenderedPhase!=='answering'){lastRenderedRound=m.round;lastRenderedPhase='answering';renderQuestion(m)}
  const mine=answerAt(m,m.round,player),theirs=answerAt(m,m.round,opponent);
  if(mine!==undefined&&la===null){la=mine;$s('leftStatus').textContent='Resposta enviada ✓'}
  if(theirs!==undefined){ra=theirs;$s('rightStatus').textContent='Resposta enviada ✓'}
  if(answerAt(m,m.round,m.team_a)!==undefined&&answerAt(m,m.round,m.team_b)!==undefined){stop();tryResolve(m).catch(()=>{})}
 }else if(m.phase==='resolved'){
  if(lastRenderedRound!==m.round||lastRenderedPhase!=='resolved'){lastRenderedRound=m.round;lastRenderedPhase='resolved';revealResult(m)}
 }else if(m.phase==='finished'){
  if(lastRenderedPhase==='finished')return;
  lastRenderedPhase='finished';stop();clearTimeout(advanceTimer);revealResult(m);currentState=m;
  const won=m.winner===player;
  $s('arenaMsg').textContent=m.clinched?'🏁 PARTIDA DECIDIDA POR VANTAGEM IRREVERSÍVEL':'🏁 PARTIDA ENCERRADA';
  playEndCelebration(won);
  postMatchTimer=setTimeout(()=>{if(stage==='semi')showDockAfterSemi().catch(()=>{});else finishPlacement(won)},10000);
 }
}
async function goNextStage(){
 const semis=await fetchSemis(),s1=semis.semi1,s2=semis.semi2;
 if(!s1?.winner||!s2?.winner)return showDockAfterSemi();
 hideDock();cleanupFinalState();
 if(nextStage==='final')await startStage('final',s1.winner,s2.winner,'final');
 else await startStage('third',s1.loser,s2.loser,'third');
 intro();
}
function finishPlacement(userWon){
 cleanupFinalState();const modal=$s('championModal'),title=$s('championTitle'),text=$s('championText'),again=$s('playAgain');
 const place=stage==='final'?(userWon?1:2):(userWon?3:4),medal=place===1?'🥇':place===2?'🥈':place===3?'🥉':'🏅';
 title.textContent=place===1?'🏆 '+T[player].name+' É A CAMPEÃ!':medal+' '+place+'º LUGAR — '+T[player].name;
 text.textContent=stage==='final'?(userWon?'Você venceu a final e conquistou o campeonato!':'Você chegou à final e terminou como vice-campeã.'):(userWon?'Você venceu a disputa de 3º lugar e conquistou o pódio!':'Você encerrou o torneio em 4º lugar.');
 again.style.display='none';modal.classList.add('show');
}
async function begin(){
 if(booted)return;booted=true;ensureDock();
 const badge=document.createElement('div');badge.textContent='MULTIPLAYER • SUPABASE • '+room;badge.style.cssText='position:fixed;right:12px;top:12px;z-index:9999;background:linear-gradient(135deg,#06b6d4,#8b5cf6);color:#fff;font:900 10px Arial;padding:6px 9px;border-radius:999px;box-shadow:0 0 16px #22d3ee88;pointer-events:none';document.body.appendChild(badge);
 const brandSmall=document.querySelector('.brand small');if(brandSmall)brandSmall.textContent='Campeonato sincronizado • você controla apenas sua equipe';
 const rightNote=document.querySelector('.right-note');if(rightNote)rightNote.textContent='Resposta adversária oculta até a revelação';
 const testPanel=document.querySelector('.test-panel');if(testPanel)testPanel.style.display='none';
 const semiId=(player==='blue'||player==='yellow')?'semi1':'semi2',a=semiId==='semi1'?'blue':'green',b=semiId==='semi1'?'yellow':'red';
 const semisChannel=sb.channel('tug-semis-'+room+'-'+player)
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'tug_matches',filter:'room_code=eq.'+room},payload=>{
    if(stage==='semi'&&document.getElementById('multiAdvanceDock')?.classList.contains('show')&&['semi1','semi2'].includes(payload.new?.match_id))showDockAfterSemi().catch(()=>{})
  }).subscribe();
 await startStage(semiId,a,b,'semi');
}
function launch(){begin().catch(e=>{$s('arenaMsg').textContent='Erro de sincronização: '+e.message})}
startMatch=launch;reset=launch;$s('playAgain').onclick=()=>location.reload();
})();