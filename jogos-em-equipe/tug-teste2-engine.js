(()=>{
const TOTAL=15;
const sb=window.__tugSupabase,room=window.__tugRoom,player=window.__tugPlayer;
if(!sb||!room||!T[player])return;
const opponent=player==='blue'?'yellow':'blue';
const MATCH_ID='semi1';
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
 {q:'Qual personagem é um detetive canino medroso e adora lanches?',o:['Scooby-Doo','Snoopy','Pluto','Pateta'],a:'Scooby-Doo'},
 {q:'Em Os Incríveis, qual é o sobrenome da família?',o:['Parr','Parker','Wayne','Stark'],a:'Parr'},
 {q:'Qual filme famoso tem um parque com dinossauros?',o:['Jurassic Park','Titanic','Avatar','Jumanji'],a:'Jurassic Park'},
 {q:'Quem é o melhor amigo de Woody em Toy Story e usa traje espacial?',o:['Buzz Lightyear','Rex','Slink','Andy'],a:'Buzz Lightyear'},
 {q:'Em Frozen, qual boneco de neve gosta de abraços quentinhos?',o:['Olaf','Sven','Kristoff','Hans'],a:'Olaf'},
 {q:'Qual herói é conhecido como o Homem de Aço?',o:['Superman','Batman','Hulk','Thor'],a:'Superman'},
 {q:'Qual personagem azul corre em altíssima velocidade?',o:['Sonic','Stitch','Dory','Gênio'],a:'Sonic'},
 {q:'Em Moana, quem é o semideus que acompanha a protagonista?',o:['Maui','Hércules','Aladdin','Tarzan'],a:'Maui'}
];
let channel=null,current=null,lastPhase='',lastRound=-1,advanceTimer=null,started=false;
const $=id=>document.getElementById(id);
function randInt(n){return Math.floor(Math.random()*n)}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=randInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function buildOrder(){return shuffle(TEST_Q.map((_,i)=>i)).slice(0,TOTAL)}
function qOf(m){return TEST_Q[(m.question_order||[])[m.round]]||TEST_Q[0]}
function ans(m,t){return m?.answers?.[String(m.round)]?.[t]}
function score(m,t){return Number(m?.scores?.[t]||0)}
function syncCore(m){L=player;R=opponent;ls=score(m,player);rs=score(m,opponent);qi=m.round;sd=m.round>=TOTAL}
function paint(){
 L=player;R=opponent;
 const a=T[player],b=T[opponent];
 $('leftName').textContent=a.short;$('rightName').textContent=b.short;
 $('leftTeamLabel').textContent=a.icon+' '+a.name;$('rightTeamLabel').textContent=b.icon+' '+b.name;
 $('leftScoreName').style.color=a.color;$('rightScoreName').style.color=b.color;
 $('leftCard').style.setProperty('--team-color',a.color);$('rightCard').style.setProperty('--team-color',b.color);
 [...$('leftPeople').children].forEach(p=>p.style.setProperty('--shirt',a.color));
 [...$('rightPeople').children].forEach(p=>p.style.setProperty('--shirt',b.color));
 $('stageLabel').textContent='TESTE 2 COMPUTADORES';
 document.querySelectorAll('.chip').forEach(x=>x.classList.remove('current'));
 if($('chip1')){$('chip1').textContent='🎬 Filmes & Desenhos';$('chip1').classList.add('current')}
 if($('chip2'))$('chip2').textContent='🔵 Azul × Amarela';
 if($('chip3'))$('chip3').textContent='🧪 Teste online';
 const brandSmall=document.querySelector('.brand small');if(brandSmall)brandSmall.textContent='Teste de sincronização em 2 computadores • perguntas em português';
 const rightNote=document.querySelector('.right-note');if(rightNote)rightNote.textContent='A resposta do adversário fica oculta até a revelação';
 const tp=document.querySelector('.test-panel');if(tp)tp.style.display='none';
 resetMoods();resetFaces();setRope(0);
}
async function ensureMatch(){
 const {data,error}=await sb.rpc('tug_get_or_create_match',{p_room:room,p_match_id:MATCH_ID,p_stage:'semi',p_team_a:'blue',p_team_b:'yellow',p_order:buildOrder()});
 if(error)throw error;return data;
}
async function fetchMatch(){
 const {data,error}=await sb.from('tug_matches').select('*').eq('room_code',room).eq('match_id',MATCH_ID).single();
 if(error)throw error;return data;
}
function renderQuestion(m){
 current=m;syncCore(m);rev=false;la=ra=null;
 $('leftScore').textContent=ls;$('rightScore').textContent=rs;
 $('resultBox').style.display='none';$('resultBox').classList.remove('celebrate');
 $('leftStatus').textContent='Sua equipe responde';$('rightStatus').textContent='Aguardando resposta';
 const q=qOf(m);$('qText').textContent=q.q;$('qMeta').textContent=m.round>=TOTAL?'DESEMPATE — MORTE SÚBITA':`Pergunta ${m.round+1}/${TOTAL}`;
 opts('left',sh(q.o));opts('right',sh(q.o));
 [...$('rightOptions').children].forEach(b=>{b.disabled=true;b.classList.remove('selected','correct','wrong');b.style.cursor='default'});
 const mine=ans(m,player),other=ans(m,opponent);
 if(mine!==undefined){la=mine;[...$('leftOptions').children].forEach(b=>{b.disabled=true;if(b.dataset.value===mine)b.classList.add('selected')});$('leftStatus').textContent='Resposta enviada ✓'}
 if(other!==undefined){ra=other;$('rightStatus').textContent='Resposta enviada ✓'}
 $('arenaMsg').textContent=mine!==undefined&&other!==undefined?'As duas equipes responderam. Conferindo...':'Escolha uma resposta.';
 clock();
}
async function submit(value){
 if(!current||current.phase!=='answering')return;
 const {error}=await sb.rpc('tug_submit_answer',{p_room:room,p_match_id:MATCH_ID,p_round:current.round,p_team:player,p_answer:value});
 if(error)throw error;
}
pick=function(side,v,b){
 if(side!=='left'||rev||la!==null||!current||current.phase!=='answering')return;
 la=v;[...$('leftOptions').children].forEach(x=>{x.disabled=true;x.classList.remove('selected')});b.classList.add('selected');
 $('leftStatus').textContent='Resposta enviada ✓';$('arenaMsg').textContent='Resposta enviada. Aguardando o outro computador...';
 submit(v).catch(()=>{$('arenaMsg').textContent='Falha ao enviar. Atualize a página.'});
};
timeout=function(){
 if(rev||!current||current.phase!=='answering')return;
 if(la===null){la='TIME';[...$('leftOptions').children].forEach(b=>b.disabled=true);$('leftStatus').textContent='TEMPO ESGOTADO ⏰';submit('TIME').catch(()=>{})}
};
async function resolveIfReady(m){
 const a=ans(m,m.team_a),b=ans(m,m.team_b);if(a===undefined||b===undefined)return;
 const q=qOf(m);
 await sb.rpc('tug_resolve_round',{p_room:room,p_match_id:MATCH_ID,p_round:m.round,p_correct:q.a,p_total:TOTAL});
}
function reveal(m){
 stop();current=m;syncCore(m);rev=true;
 const q=qOf(m),mine=ans(m,player),other=ans(m,opponent);if(mine===undefined||other===undefined)return;
 la=mine;ra=other;mark('left',mine,q.a);mark('right',other,q.a);
 const okL=mine===q.a,okR=other===q.a;
 $('leftStatus').textContent=okL?'ACERTOU! ✅':mine==='TIME'?'TEMPO ESGOTADO ⏰':'ERROU ✖';
 $('rightStatus').textContent=okR?'ACERTOU! ✅':other==='TIME'?'TEMPO ESGOTADO ⏰':'ERROU ✖';
 $('leftScore').textContent=ls;$('rightScore').textContent=rs;
 if(okL&&okR){$('resultBox').textContent='As duas equipes acertaram!';bothPull()}
 else if(okL){$('resultBox').textContent=T[player].name+' venceu a rodada!';pull('left')}
 else if(okR){$('resultBox').textContent=T[opponent].name+' venceu a rodada!';pull('right')}
 else{$('resultBox').textContent='As duas equipes erraram. Resposta correta: '+q.a+'.';resetFaces()}
 $('resultBox').style.display='block';
 if(m.phase==='resolved'){clearTimeout(advanceTimer);advanceTimer=setTimeout(()=>advance(m.round),3000)}
}
async function advance(round){
 const {error}=await sb.rpc('tug_advance_round',{p_room:room,p_match_id:MATCH_ID,p_round:round,p_next_question:randInt(TEST_Q.length)});
 if(error)throw error;
}
function endScreen(m){
 stop();syncCore(m);const won=m.winner===player;
 const winner=won?$('leftPeople'):$('rightPeople'),loser=won?$('rightPeople'):$('leftPeople');
 winner.classList.add('final-winner');loser.classList.add('final-loser');setFace(winner,'laugh');setFace(loser,'panic');
 $('arenaMsg').textContent=won?'🎉 SUA EQUIPE VENCEU O TESTE!':'👏 TESTE ENCERRADO — A OUTRA EQUIPE VENCEU.';
 if(!document.getElementById('test2End')){
   const box=document.createElement('div');box.id='test2End';box.style.cssText='position:fixed;inset:0;z-index:20000;display:grid;place-items:center;background:#020617cc;backdrop-filter:blur(8px);padding:20px';
   const card=document.createElement('div');card.style.cssText='max-width:620px;width:92%;text-align:center;background:#0f172a;border:2px solid #67e8f9;border-radius:24px;padding:28px;color:#fff;box-shadow:0 0 50px #22d3ee44';
   card.innerHTML='<div style="font-size:54px">'+(won?'🏆':'👏')+'</div><h2 style="margin:8px 0">'+(won?'SUA EQUIPE VENCEU!':'PARTIDA ENCERRADA')+'</h2><p style="color:#cbd5e1">O teste multiplayer entre os dois computadores foi concluído. Placar: '+score(m,player)+' × '+score(m,opponent)+'.</p><p style="color:#94a3b8;font-size:13px">Para uma nova partida, use uma nova sala de teste para não reutilizar o resultado anterior.</p>';
   box.appendChild(card);document.body.appendChild(box);
 }
}
function onMatch(m){
 if(!m?.team_a)return;current=m;syncCore(m);
 if(m.phase==='answering'){
   if(lastRound!==m.round||lastPhase!=='answering'){lastRound=m.round;lastPhase='answering';renderQuestion(m)}
   const mine=ans(m,player),other=ans(m,opponent);
   if(mine!==undefined&&la===null){la=mine;$('leftStatus').textContent='Resposta enviada ✓'}
   if(other!==undefined){ra=other;$('rightStatus').textContent='Resposta enviada ✓'}
   if(ans(m,m.team_a)!==undefined&&ans(m,m.team_b)!==undefined){stop();resolveIfReady(m).catch(()=>{})}
 }else if(m.phase==='resolved'){
   if(lastRound!==m.round||lastPhase!=='resolved'){lastRound=m.round;lastPhase='resolved';reveal(m)}
 }else if(m.phase==='finished'){
   if(lastPhase==='finished')return;lastPhase='finished';reveal(m);setTimeout(()=>endScreen(m),2200);
 }
}
async function begin(){
 if(started)return;started=true;paint();await ensureMatch();
 channel=sb.channel('tug-test2-match-'+room+'-'+player)
   .on('postgres_changes',{event:'UPDATE',schema:'public',table:'tug_matches',filter:'room_code=eq.'+room},payload=>{if(payload.new?.match_id===MATCH_ID)onMatch(payload.new)})
   .subscribe();
 onMatch(await fetchMatch());
 const badge=document.createElement('div');badge.textContent='TESTE 2 PCs • FILMES & DESENHOS';badge.style.cssText='position:fixed;right:12px;top:12px;z-index:9999;background:linear-gradient(135deg,#2563eb,#eab308);color:#fff;font:900 10px Arial;padding:7px 10px;border-radius:999px;box-shadow:0 0 16px #22d3ee88;pointer-events:none';document.body.appendChild(badge);
}
function launch(){begin().catch(e=>{$('arenaMsg').textContent='Erro de sincronização: '+e.message})}
startMatch=launch;reset=launch;
})();