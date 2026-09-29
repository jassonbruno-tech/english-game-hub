// English Game Hub Mobile — 6º ano
// Motor do adversário fantasma. Não altera o campeonato de PC.
export const INITIAL_GHOST = {
  id: "starter-6",
  name: "Lucas",
  synthetic: true,
  // 25 avanços com ritmo humano: pequenas pausas e variação entre acertos.
  timelineMs: [11800,24700,35900,50100,62400,78300,90100,105600,121900,137500,153200,171600,188300,204900,222800,240100,258700,276900,294100,313500,333100,352800,373400,395200,418000]
};

export function normalizeGhost(record){
  if(!record || !Array.isArray(record.timelineMs) || record.timelineMs.length !== 25) return INITIAL_GHOST;
  const times=record.timelineMs.map(Number);
  if(times.some((v,i)=>!Number.isFinite(v)||v<0||(i>0&&v<times[i-1]))) return INITIAL_GHOST;
  return {id:String(record.id||"previous"),name:String(record.name||"Jogador anterior"),synthetic:false,timelineMs:times};
}

export function ghostProgress(timelineMs, elapsedMs){
  let hits=0;
  while(hits<timelineMs.length && elapsedMs>=timelineMs[hits]) hits++;
  return hits;
}

export function buildRaceRecord({id,name,school,studentClass,timelineMs,finishedAt}){
  const clean=timelineMs.slice(0,25).map(Number);
  if(clean.length!==25) throw new Error("A corrida só é válida com 25 acertos.");
  return {id,name,school,studentClass,grade:6,timelineMs:clean,totalTimeMs:clean[24],finishedAt,complete:true};
}