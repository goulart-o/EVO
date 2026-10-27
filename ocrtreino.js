/* EVO — treino por foto: lê o texto da imagem (Tesseract.js, no próprio aparelho) e interpreta em exercícios.
   FX_OCR.read(file, onProgress) -> texto · FX_OCR.parse(texto, lib) -> {kind, nome, rows:[...], wod} */
window.FX_OCR = (function(){
  const TESS='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  const norm=t=>String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  let loading=null;
  function loadLib(){
    if(window.Tesseract) return Promise.resolve();
    if(loading) return loading;
    loading=new Promise((ok,ko)=>{ const s=document.createElement('script'); s.src=TESS; s.onload=ok; s.onerror=()=>{loading=null;ko(new Error('Não foi possível carregar o leitor de texto. Verifique a internet.'));}; document.head.appendChild(s); });
    return loading;
  }
  // reduz, deixa em tons de cinza e aumenta o contraste para ajudar a leitura
  function prep(file){
    return new Promise((ok,ko)=>{ const url=URL.createObjectURL(file), im=new Image();
      im.onload=()=>{ const max=2000, sc=Math.min(1,max/Math.max(im.width,im.height)), c=document.createElement('canvas');
        c.width=Math.round(im.width*sc); c.height=Math.round(im.height*sc); const x=c.getContext('2d'); x.drawImage(im,0,0,c.width,c.height);
        try{ const d=x.getImageData(0,0,c.width,c.height), a=d.data; let sum=0; for(let i=0;i<a.length;i+=4){ const g=.299*a[i]+.587*a[i+1]+.114*a[i+2]; a[i]=a[i+1]=a[i+2]=g; sum+=g; }
          const mean=sum/(a.length/4), dark=mean<110; // quadro escuro: inverte
          for(let i=0;i<a.length;i+=4){ let g=a[i]; if(dark) g=255-g; g=Math.max(0,Math.min(255,(g-128)*1.5+128)); a[i]=a[i+1]=a[i+2]=g; } x.putImageData(d,0,0); }catch(e){}
        URL.revokeObjectURL(url); ok(c); };
      im.onerror=()=>{ URL.revokeObjectURL(url); ko(new Error('Imagem inválida')); }; im.src=url; });
  }
  async function read(file,onProg){
    await loadLib(); const canvas=await prep(file);
    const worker=await Tesseract.createWorker('por',1,{logger:m=>{ if(onProg&&m.status) onProg(m.status,m.progress||0); }});
    try{ const r=await worker.recognize(canvas); return r.data.text||''; } finally { try{ await worker.terminate(); }catch(e){} }
  }

  // ---------- interpretação ----------
  const STOP=new Set(['com','de','da','do','das','dos','no','na','nos','nas','e','a','o','em','ao','para','por','x','-','/','(',')','sentado','em pe']);
  const SYN=[ // apelidos comuns -> id da biblioteca
    [/supino.*inclin.*(halter|hbl|hlt)/,'supino-inclinado-halter'],[/supino.*inclin/,'supino-inclinado-barra'],[/supino.*declin/,'supino-declinado'],[/supino.*(halter|hbl|hlt)/,'supino-reto-halter'],[/supino/,'supino-reto'],
    [/crucifixo.*(inverso|posterior)|peck.*inverso|voador.*inverso/,'crucifixo-inverso'],[/cross ?over|crossover/,'crossover'],[/voador|peck ?deck|fly|crucifixo.*maquina/,'peck-deck'],[/crucifixo/,'crucifixo-halter'],
    [/flexao de braco|flexoes|push ?up/,'flexao-braco'],[/paralela|dips?\b/,'paralelas'],[/barra fixa|pull ?up|chin ?up/,'barra-fixa'],
    [/puxada|pulley frente|pulldown frente|lat ?pull/,'puxada-frente'],[/pulldown|pull ?over/,'pulldown-reto'],[/remada.*curvad/,'remada-curvada'],[/remada.*cavalinho|t ?bar/,'remada-cavalinho'],
    [/remada.*(baixa|sentad|triangulo)/,'remada-baixa'],[/remada.*(unilateral|serrote)|serrote/,'remada-unilateral'],[/remada/,'remada-curvada'],
    [/levantamento terra|terra\b|deadlift/,'levantamento-terra'],[/face ?pull/,'face-pull'],[/desenvolvimento.*(barra|militar)|militar/,'desenvolvimento-barra'],[/desenvolvimento|arnold/,'desenvolvimento-halter'],
    [/elevacao lateral.*(cabo|polia|cross)/,'elevacao-lateral-cabo'],[/elevacao lateral/,'elevacao-lateral'],[/elevacao frontal|frontal/,'elevacao-frontal'],[/encolhimento/,'encolhimento'],
    [/rosca.*martelo|martelo/,'rosca-martelo'],[/rosca.*scott|scott/,'rosca-scott'],[/rosca.*altern/,'rosca-alternada'],[/rosca.*(cabo|polia)/,'rosca-cabo'],[/rosca.*punho/,'rosca-punho'],[/rosca/,'rosca-direta'],
    [/triceps.*corda/,'triceps-corda'],[/triceps.*frances|frances/,'triceps-frances-cabo'],[/triceps.*testa|testa/,'triceps-testa'],[/mergulho.*banco|triceps.*banco/,'mergulho-banco'],[/triceps|pulley|pushdown/,'triceps-barra'],
    [/agachamento.*front/,'agachamento-frontal'],[/hack/,'hack'],[/bulgaro/,'bulgaro'],[/afundo|passada|avanco|lunge/,'afundo'],[/agachamento|squat|agacho/,'agachamento-livre'],
    [/leg ?press|leg 45/,'leg-press'],[/extensora/,'extensora'],[/stiff|rdl/,'stiff'],[/mesa flexora|flexora deitad/,'mesa-flexora'],[/flexora/,'cadeira-flexora'],[/good ?morning/,'good-morning'],
    [/hip ?thrust|elevacao (de )?quadril|elevacao pelvica|pelvica/,'hip-thrust'],[/coice|gluteo.*(cabo|polia|4 apoios|quatro apoios)/,'gluteo-cabo'],[/abducao|abdutora/,'abducao'],[/adutora|aducao/,'adutora'],
    [/panturrilha.*sentad|gemeos sentad/,'panturrilha-sentado'],[/panturrilha|gemeos/,'panturrilha-pe'],
    [/abdominal.*(polia|corda)/,'abdominal-polia'],[/elevacao de pernas|abdominal infra|infra/,'elevacao-pernas'],[/prancha|plank/,'prancha'],[/obliquo|russian twist/,'obliquo'],[/abdominal|crunch|supra/,'abdominal-supra'],
    [/power clean|clean and jerk|clean ?& ?jerk/,'clean-jerk'],[/clean/,'clean'],[/snatch|arranco/,'snatch'],[/thruster/,'thruster'],[/push ?press/,'push-press'],[/kettlebell|kb swing|swing/,'kettlebell-swing'],
    [/wall ?ball/,'wall-ball'],[/burpee/,'burpee'],[/remo|row(er|ing)?\b/,'remo-ergometro'],[/corrida|run\b|correr/,'corrida'],[/double ?under|corda|du\b/,'double-under']];
  const GROUPS=[[/peito|peitoral/,'peito'],[/costas|dorsa/,'costas'],[/ombro/,'ombros'],[/biceps/,'biceps'],[/triceps/,'triceps'],[/antebraco/,'antebraco'],[/perna|quadriceps|coxa/,'quadriceps'],
    [/posterior/,'posteriores'],[/gluteo/,'gluteos'],[/panturrilha/,'panturrilha'],[/abdomen|abdominal|core/,'abdomen']];
  const WOD=/\b(amrap|emom|for time|fortime|rft|rounds?|tabata|wod|chipper|cap|time ?cap|metcon)\b/;
  function bigrams(s){ const o=new Set(); for(let i=0;i<s.length-1;i++) o.add(s.slice(i,i+2)); return o; }
  function sim(a,b){ const A=bigrams(a), B=bigrams(b); if(!A.size||!B.size) return 0; let n=0; A.forEach(x=>{ if(B.has(x)) n++; }); return 2*n/(A.size+B.size); }
  function matchEx(name,lib){
    const n=norm(name).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); if(n.length<3) return null;
    for(const [re,id] of SYN){ if(re.test(n)){ const e=lib.find(x=>x.id===id); if(e) return {id,score:.95}; } }
    let best=null; for(const e of lib){ const s=sim(n,norm(e.nome)); if(!best||s>best.score) best={id:e.id,score:s}; }
    return best&&best.score>=.5?best:null;
  }
  function parseLine(raw){
    let t=' '+norm(raw).replace(/[|]/g,' ').replace(/[×*]/g,'x').replace(/\s+/g,' ')+' ';
    const o={}; let m;
    if((m=t.match(/(\d{1,3}(?:[.,]\d)?)\s*kg/))){ o.kg=+m[1].replace(',','.'); t=t.replace(m[0],' '); }
    if(/falha|\bmax(imo)?\b|amrap/.test(t)) o.falha=true;
    m=t.match(/(\d{1,2})\s*x\s*(\d{1,3})(?:\s*(?:-|a|ate|\/)\s*(\d{1,3}))?/);
    if(m){ o.series=+m[1]; o.repMin=+m[2]; o.repMax=m[3]?+m[3]:+m[2]; t=t.replace(m[0],' '); }
    else if((m=t.match(/(\d{1,2})\s*(?:series|ser|sets?)\s*(?:de|x)?\s*(\d{1,3})(?:\s*(?:-|a|ate)\s*(\d{1,3}))?/))){ o.series=+m[1]; o.repMin=+m[2]; o.repMax=m[3]?+m[3]:+m[2]; t=t.replace(m[0],' '); }
    else if((m=t.match(/(\d{1,2})\s*(?:series|sets?)\b/))){ o.series=+m[1]; t=t.replace(m[0],' '); }
    if(!o.repMin && (m=t.match(/(\d{1,3})\s*(?:-|a|ate)\s*(\d{1,3})\s*(?:reps?|repeticoes|rep)\b/)||t.match(/(\d{1,3})()\s*(?:reps?|repeticoes)\b/))){ o.repMin=+m[1]; o.repMax=m[2]?+m[2]:+m[1]; t=t.replace(m[0],' '); }
    if((m=t.match(/(?:desc(?:anso)?|int(?:ervalo)?|rest)\s*:?\s*(\d{1,3})\s*(s|seg|")?/))){ o.desc=+m[1]; t=t.replace(m[0],' '); }
    else if((m=t.match(/(\d)\s*'\s*(\d{2})?/))){ o.desc=+m[1]*60+(+m[2]||0); t=t.replace(m[0],' '); }
    else if((m=t.match(/(\d{2,3})\s*(s|seg|segundos|")(?=\s)/))){ o.desc=+m[1]; t=t.replace(m[0],' '); }
    if(!o.series && !o.repMin && (m=t.match(/^\s*(\d{1,3})\s+(?=[a-z])/))){ o.lead=+m[1]; t=t.replace(m[0],' '); }
    if((m=t.match(/rir\s*:?\s*(\d)(?:\s*-\s*(\d))?/))){ o.rir=m[2]?m[1]+'–'+m[2]:m[1]; t=t.replace(m[0],' '); }
    o.name=t.replace(/^\s*[\d.)\-•·o*]+\s+/,' ').replace(/\s+/g,' ').trim();
    return o;
  }
  function parse(text,lib){
    const lines=String(text||'').split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>1);
    const all=norm(text); const isWod=WOD.test(all);
    let nome='', grupo=null; const rows=[];
    for(const raw of lines){
      const p=parseLine(raw), n=norm(p.name).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
      const hasNum=p.series||p.repMin||p.lead;
      const gm=GROUPS.find(([re])=>re.test(n));
      if(!p.series && !p.repMin && !p.lead){ // títulos e cabeçalhos
        if(/^(treino|ficha|dia)\b|\btreino [a-e]\b|^(push|pull|legs|upper|lower)( day| [a-e])?$/.test(n) && n.length<50){ if(!nome) nome=raw.replace(/[:\-–]+$/,'').trim(); if(gm) grupo=gm[1]; continue; }
        if(gm && n.split(' ').length<=3 && !/\b(rosca|supino|remada|puxada|agachamento|elevacao|extensora|flexora|prancha|abdominal (supra|infra|polia))\b/.test(n)){ grupo=gm[1]; continue; }
      }
      const ex=matchEx(p.name,lib);
      if(!ex && !hasNum) continue;
      if(!ex && n.length<3) continue;
      const reps=p.repMin||p.lead||10;
      rows.push({raw, exId:ex?ex.id:null, conf:ex?ex.score:0, nomeNovo:ex?'':cap(p.name), grupo,
        series:p.series||(isWod?1:3), repMin:reps, repMax:p.repMax||p.lead||(p.repMin?p.repMin:12), desc:p.desc||(isWod?0:90), rir:p.rir||'2', kg:p.kg||null, nota:p.falha?'Até a falha':(p.kg?`Carga: ${p.kg} kg`:'')});
    }
    const fm=norm(text).match(/(amrap|emom|for time|rft|tabata|chipper)[^\n]*?(\d{1,2})\s*('|min)?/);
    const formato=fm?({amrap:'AMRAP',emom:'EMOM','for time':'For time',rft:'For time',tabata:'Tabata',chipper:'For time'})[fm[1]]:'For time';
    return {kind:isWod?'crossfit':'academia', isWod, nome:nome||'', rows, wod:isWod?String(text).trim():'', formato, cap:fm&&fm[2]?fm[2]+' min':''};
  }
  const cap=s=>String(s||'').replace(/^\w/,c=>c.toUpperCase());
  return {read,parse,parseLine,loadLib};
})();
