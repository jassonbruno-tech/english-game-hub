(()=>{
const TOTAL=15;
const params=new URLSearchParams(location.search);
const player=params.get('equipe')||'blue';
if(!T[player])return;
const PAIRS={blue:'yellow',yellow:'blue',green:'red',red:'green'};
const OTHER_PAIR=(player==='blue'||player==='yellow')?['green','red']:['blue','yellow'];
let tournamentStage='semi';
let nextStage=null;
let aiTimer=null;
let otherWinner=null,otherLoser=null;
const $s=id=>document.getElementById(id);

function rand(arr){return arr[Math.floor(Math.random()*arr.length)]}
function setChipLabels(){
  const c1=$s('chip1'),c2=$s('chip2'),c3=$s('chip3');
  if(c1)c1.textContent='⚔️ Sua semifinal';
  if(c2)c2.textContent='🥉 3º lugar';
  if(c3)c3.textContent='🏆 Final';
}
function setStageTeams(){
  document.querySelectorAll('.chip').forEach(x=>x.classList.remove('current'));
  L=player;
  if(tournamentStage==='semi'){
    R=PAIRS[player];
    $s('stageLabel').textContent='SEMIFINAL';
    $s('chip1')?.classList.add('current');
  }else if(tournamentStage==='final'){
    R=otherWinner;
    $s('stageLabel').textContent='FINAL';
    $s('chip3')?.classList.add('current');
  }else{
    R=otherLoser;
    $s('stageLabel').textContent='DISPUTA DE 3º LUGAR';
    $s('chip2')?.classList.add('current');
  }
  const a=T[L],b=T[R];
  $s('leftName').textContent=a.short;$s('rightName').textContent=b.short;
  $s('leftTeamLabel').textContent=a.icon+' '+a.name;
  $s('rightTeamLabel').textContent=b.icon+' '+b.name+' • CPU';
  $s('leftScoreName').style.color=a.color;$s('rightScoreName').style.color=b.color;
  $s('leftCard').style.setProperty('--team-color',a.color);$s('rightCard').style.setProperty('--team-color',b.color);
  [...$s('leftPeople').children].forEach(p=>p.style.setProperty('--shirt',a.color));
  [...$s('rightPeople').children].forEach(p=>p.style.setProperty('--shirt',b.color));
  resetMoods();
}
function simulateOtherSemi(){
  otherWinner=Math.random()<.5?OTHER_PAIR[0]:OTHER_PAIR[1];
  otherLoser=OTHER_PAIR.find(x=>x!==otherWinner);
}
function aiAnswer(){
  if(rev||ra!==null)return;
  const q=qs[qi];if(!q)return;
  const accuracy=tournamentStage==='final'?0.72:tournamentStage==='third'?0.62:0.66;
  const correct=Math.random()<accuracy;
  const value=correct?q.a:rand(q.o.filter(x=>x!==q.a));
  ra=value;
  [...$s('rightOptions').children].forEach(b=>{b.disabled=true;if(b.dataset.value===value)b.classList.add('selected')});
  $s('rightStatus').textContent='Resposta enviada ✓';
  if(la!==null){stop();$s('arenaMsg').textContent='Respostas bloqueadas...';setTimeout(reveal,450)}
}
function planAi(){
  clearTimeout(aiTimer);
  aiTimer=setTimeout(aiAnswer,2200+Math.floor(Math.random()*4200));
}

startMatch=function(){
  clearTimeout(aiTimer);qi=0;ls=0;rs=0;sd=false;qs=sh(Q);$s('leftScore').textContent=$s('rightScore').textContent=0;resetFaces();setRope(0);$s('nextMatchBtn').style.display='none';setStageTeams();intro();
};
render=function(){
  clearTimeout(auto);clearTimeout(aiTimer);rev=false;la=ra=null;resetMoods();$s('resultBox').style.display='none';$s('resultBox').classList.remove('celebrate');$s('winnerFlash').classList.remove('show');
  $s('leftStatus').textContent='Sua equipe responde';$s('rightStatus').textContent='Adversário pensando...';$s('arenaMsg').textContent='Responda pela sua equipe.';
  if(qi>=qs.length){let pool=sh(Q),last=qs[qs.length-1];qs.push(pool.find(x=>x.q!==last?.q)||pool[0])}
  const q=qs[qi];$s('qText').textContent=q.q;$s('qMeta').textContent=sd?'DESEMPATE — morte súbita':`Pergunta ${qi+1}/${TOTAL}`;
  opts('left',sh(q.o));opts('right',sh(q.o));
  [...$s('rightOptions').children].forEach(b=>{b.style.cursor='default';b.setAttribute('aria-disabled','true')});
  clock();planAi();
};
pick=function(side,v,b){
  if(rev||side!=='left'||la!==null)return;
  const box=$s('leftOptions');[...box.children].forEach(x=>x.classList.remove('selected'));b.classList.add('selected');[...box.children].forEach(x=>x.disabled=true);la=v;$s('leftStatus').textContent='Resposta enviada ✓';
  if(ra!==null){stop();clearTimeout(aiTimer);$s('arenaMsg').textContent='Respostas bloqueadas...';setTimeout(reveal,450)}
};
timeout=function(){
  if(rev)return;
  clearTimeout(aiTimer);
  if(la===null){la='TIME';$s('leftStatus').textContent='TEMPO ESGOTADO ⏰';[...$s('leftOptions').children].forEach(b=>b.disabled=true)}
  if(ra===null){const q=qs[qi],correct=Math.random()<.62;ra=correct?q.a:rand(q.o.filter(x=>x!==q.a));[...$s('rightOptions').children].forEach(b=>{b.disabled=true;if(b.dataset.value===ra)b.classList.add('selected')});$s('rightStatus').textContent='Resposta enviada ✓'}
  $s('arenaMsg').textContent='⏰ TEMPO ESGOTADO!';setTimeout(reveal,250);
};
schedule=function(delay,a,b){
  if(sd){if(a!==b)return setTimeout(endMatch,delay);return auto=setTimeout(next,delay+200)}
  const remaining=Math.max(0,TOTAL-(qi+1));
  if(Math.abs(ls-rs)>remaining)return setTimeout(endMatch,delay);
  if(qi<TOTAL-1)return auto=setTimeout(next,delay+250);
  if(ls===rs){sd=true;$s('resultBox').textContent+=' Empate! Morte súbita.';return auto=setTimeout(next,delay+300)}
  setTimeout(endMatch,delay);
};
endMatch=function(){
  stop();clearTimeout(aiTimer);
  const userWon=ls>rs;
  $s('resultBox').textContent=`🏁 Fim da partida: ${T[L].short} ${ls} × ${rs} ${T[R].short}`;$s('resultBox').style.display='block';$s('arenaMsg').textContent='PARTIDA ENCERRADA';
  if(ls!==rs)pull(userWon?'left':'right');
  if(tournamentStage==='semi'){
    simulateOtherSemi();nextStage=userWon?'final':'third';
    setTimeout(()=>{
      const btn=$s('nextMatchBtn');btn.style.display='inline-block';btn.textContent=userWon?'🏆 IR PARA A FINAL ➜':'🥉 IR PARA A DISPUTA DE 3º LUGAR ➜';
      $s('resultBox').textContent=userWon?`✅ ${T[L].name} CLASSIFICADA PARA A FINAL!`:`➡️ ${T[L].name} vai disputar o 3º lugar.`;
    },2200);
  }else{
    setTimeout(()=>finishTournament(userWon),2200);
  }
};
advance=function(){
  if(tournamentStage!=='semi')return;
  tournamentStage=nextStage;$s('nextMatchBtn').style.display='none';startMatch();
};
function finishTournament(userWon){
  const modal=$s('championModal'),title=$s('championTitle'),text=$s('championText'),again=$s('playAgain');
  const place=tournamentStage==='final'?(userWon?1:2):(userWon?3:4);
  const medal=place===1?'🥇':place===2?'🥈':place===3?'🥉':'🏅';
  title.textContent=place===1?`🏆 ${T[player].name} É A CAMPEÃ!`:`${medal} ${place}º LUGAR — ${T[player].name}`;
  text.textContent=tournamentStage==='final'?(userWon?'Você venceu a final e conquistou o campeonato!':'Você chegou à final e terminou como vice-campeã.'):(userWon?'Você venceu a disputa de 3º lugar e conquistou o pódio!':'Você encerrou o torneio em 4º lugar.');
  again.textContent='JOGAR NOVO CAMPEONATO';again.style.display='inline-block';modal.classList.add('show');
}
reset=function(){
  stop();clearTimeout(auto);clearTimeout(aiTimer);tournamentStage='semi';nextStage=null;otherWinner=null;otherLoser=null;$s('championModal').classList.remove('show');startMatch();
};

setChipLabels();
const brandSmall=document.querySelector('.brand small');if(brandSmall)brandSmall.textContent='Modo torneio • você controla apenas sua equipe';
const rightNote=document.querySelector('.right-note');if(rightNote)rightNote.textContent='Adversário automático';
const testPanel=document.querySelector('.test-panel');if(testPanel)testPanel.style.display='none';
$s('nextMatchBtn').onclick=advance;
$s('playAgain').onclick=()=>reset();
const badge=document.createElement('div');badge.textContent='SIMULAÇÃO 1 COMPUTADOR';badge.style.cssText='position:fixed;right:12px;top:12px;z-index:9999;background:linear-gradient(135deg,#06b6d4,#8b5cf6);color:#fff;font:900 10px Arial;padding:6px 9px;border-radius:999px;box-shadow:0 0 16px #22d3ee88;pointer-events:none';document.body.appendChild(badge);
})();
