/* Ficha Forte — ilustrações próprias dos exercícios.
   Boneco 2D desenhado em SVG por cinemática inversa: cada exercício define a pose
   inicial e final (quadril, inclinação do tronco, alvo das mãos e dos pés) e os equipamentos. */
window.FX_ART = (function(){
const L = {torso:46, ua:27, fa:25, th:36, sh:34, head:9};
const FLOOR = 148;
const rad = d=>d*Math.PI/180;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]], sub=(a,b)=>[a[0]-b[0],a[1]-b[1]], mul=(a,k)=>[a[0]*k,a[1]*k];
const len=a=>Math.hypot(a[0],a[1]);
const lerp=(a,b,k)=>a+(b-a)*k;
const lerpP=(a,b,k)=>[lerp(a[0],b[0],k),lerp(a[1],b[1],k)];
const r1=n=>Math.round(n*10)/10;

// IK de dois segmentos: retorna a articulação intermediária e o ponto final alcançável
function ik(root,target,l1,l2,bend){
  let d=sub(target,root), dist=len(d);
  const max=l1+l2-0.01, min=Math.abs(l1-l2)+0.01;
  if(dist>max){ d=mul(d,max/dist); dist=max; }
  if(dist<min){ d=dist?mul(d,min/dist):[0,min]; dist=min; }
  const end=add(root,d), base=Math.atan2(d[1],d[0]);
  const a=Math.acos(Math.max(-1,Math.min(1,(l1*l1+dist*dist-l2*l2)/(2*l1*dist))));
  const c1=add(root,[l1*Math.cos(base+a),l1*Math.sin(base+a)]), c2=add(root,[l1*Math.cos(base-a),l1*Math.sin(base-a)]);
  const pick = {f:c=>c[0],b:c=>-c[0],u:c=>-c[1],d:c=>c[1],o:c=>Math.abs(c[0]-110)}[bend||'f'];
  return {j:pick(c1)>=pick(c2)?c1:c2, e:end};
}

// ---------- poses ----------
// lado (view 's'): h=quadril, t=tronco (0 em pé, + inclina para frente, -90 deitado de costas com a cabeça à esquerda)
// H/H2 = mãos (perto/longe), F/F2 = pés, eb/kb = lado da dobra do cotovelo/joelho, ft = ângulo do pé
// frente (view 'f'): h=centro do quadril, H/H2 e F/F2 = mão/pé direito e esquerdo na tela, sh = encolher, tilt = inclinação lateral
function pose(p){
  if(p.view==='f') return poseFront(p);
  const v=[Math.sin(rad(p.t)),-Math.cos(rad(p.t))];
  const S=add(p.h,mul(v,L.torso));
  const hang = s=>add(s,[2,50]);
  const H = p.H==='hang'?hang(S):p.H||hang(S), H2=p.H2==='hang'?hang(S):(p.H2||H);
  const F = p.F||add(p.h,[4,70]), F2=p.F2||F;
  const a1=ik(S,H,L.ua,L.fa,p.eb||'b'), a2=ik(S,H2,L.ua,L.fa,p.eb2||p.eb||'b');
  const l1=ik(p.h,F,L.th,L.sh,p.kb||'f'), l2=ik(p.h,F2,L.th,L.sh,p.kb2||p.kb||'f');
  return {view:'s',hip:p.h,S,v,head:add(S,mul(v,15)),arm:[S,a1.j,a1.e],arm2:[S,a2.j,a2.e],leg:[p.h,l1.j,l1.e],leg2:[p.h,l2.j,l2.e],ft:p.ft||0,ft2:p.ft2??p.ft??0};
}
function poseFront(p){
  const c=p.h, tilt=rad(p.tilt||0), sh=p.sh||0;
  const rot=(pt)=>{ const dx=pt[0]-c[0], dy=pt[1]-c[1]; return [c[0]+dx*Math.cos(tilt)-dy*Math.sin(tilt), c[1]+dx*Math.sin(tilt)+dy*Math.cos(tilt)]; };
  const SR=rot([c[0]+15,c[1]-46+sh]), SL=rot([c[0]-15,c[1]-46+sh]), N=rot([c[0],c[1]-46+sh]);
  const HR=[c[0]+9,c[1]], HL=[c[0]-9,c[1]];
  const H=p.H||[SR[0]+4,SR[1]+51], H2=p.H2||[SL[0]-4,SL[1]+51];
  const F=p.F||[HR[0]+1,c[1]+70], F2=p.F2||[HL[0]-1,c[1]+70];
  const a1=ik(SR,H,L.ua,L.fa,p.eb||'o'), a2=ik(SL,H2,L.ua,L.fa,p.eb||'o');
  const l1=ik(HR,F,L.th,L.sh,p.kb||'o'), l2=ik(HL,F2,L.th,L.sh,p.kb||'o');
  return {view:'f',c,SR,SL,N,HR,HL,head:rot([c[0],c[1]-62+sh]),arm:[SR,a1.j,a1.e],arm2:[SL,a2.j,a2.e],leg:[HR,l1.j,l1.e],leg2:[HL,l2.j,l2.e],tilt:p.tilt||0};
}
function lerpPose(a,b,k){
  const o={};
  for(const key of new Set([...Object.keys(a),...Object.keys(b)])){
    const x=a[key], y=b[key];
    if(Array.isArray(x)&&Array.isArray(y)) o[key]=lerpP(x,y,k);
    else if(typeof x==='number'&&typeof y==='number') o[key]=lerp(x,y,k);
    else o[key]= k<.5? (x??y) : (y??x);
  }
  return o;
}

// ---------- desenho ----------
const C = {fig:'var(--fig)',fig2:'var(--fig2)',eq:'var(--eq)',plate:'var(--plate)',hi:'var(--hi)',pad:'var(--pad)',cable:'var(--cable)'};
const line=(a,b,w,c,extra='')=>`<line x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const circ=(p,r,c,extra='')=>`<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r}" fill="${c}" ${extra}/>`;
const poly=(pts,c,extra='')=>`<polygon points="${pts.map(p=>r1(p[0])+','+r1(p[1])).join(' ')}" fill="${c}" ${extra}/>`;
function limb(seg,cu,cl,wu=10,wl=9){ return line(seg[0],seg[1],wu,cu)+line(seg[1],seg[2],wl,cl); }
function foot(seg,ang,c){ const a=rad(ang); return line(seg[2],add(seg[2],[11*Math.cos(a),-11*Math.sin(a)]),7,c); }

function drawSide(P,hi){
  const {hip,S,v}=P, n=[-v[1]*-1*-1, 0]; // placeholder (substituído abaixo)
  const back=[-Math.cos(Math.atan2(v[1],v[0])+Math.PI/2), -Math.sin(Math.atan2(v[1],v[0])+Math.PI/2)];
  const front=mul(back,-1);
  const H=c=>hi.has(c)?C.hi:null;
  let s='';
  // membros de trás
  s+=limb(P.leg2,C.fig2,C.fig2)+foot(P.leg2,P.ft2,C.fig2);
  s+=limb(P.arm2,C.fig2,C.fig2,9,8)+circ(P.arm2[2],4.5,C.fig2);
  // tronco
  s+=line(hip,S,19,C.fig);
  s+=line(add(S,mul(v,4)),add(S,mul(v,10)),8,C.fig);
  s+=circ(P.head,L.head,C.fig);
  if(hi.has('peito')) s+=line(add(add(S,mul(v,-9)),mul(front,5)),add(add(S,mul(v,-20)),mul(front,5)),8,C.hi);
  if(hi.has('abdomen')) s+=line(add(add(hip,mul(v,8)),mul(front,5)),add(add(hip,mul(v,28)),mul(front,5)),7,C.hi);
  if(hi.has('costas')) s+=line(add(add(S,mul(v,-6)),mul(back,5)),add(add(hip,mul(v,14)),mul(back,5)),8,C.hi);
  if(hi.has('gluteos')) s+=circ(add(hip,mul(back,6)),7.5,C.hi);
  // membros da frente
  const legU=H('quadriceps')||H('posteriores')||C.fig, legL=H('panturrilha')||C.fig;
  s+=limb(P.leg,legU,legL)+foot(P.leg,P.ft,C.fig);
  if(hi.has('ombros')) s+=circ(S,7.5,C.hi);
  const armU=H('biceps')||H('triceps')||C.fig, armL=H('antebraco')||C.fig;
  s+=limb(P.arm,armU,armL,9,8)+circ(P.arm[2],4.5,C.fig);
  return s;
}
function drawFront(P,hi){
  let s='';
  const {SR,SL,HR,HL,N}=P;
  s+=limb(P.leg2,hi.has('quadriceps')||hi.has('gluteos')?C.hi:C.fig,hi.has('panturrilha')?C.hi:C.fig);
  s+=limb(P.leg,hi.has('quadriceps')||hi.has('gluteos')?C.hi:C.fig,hi.has('panturrilha')?C.hi:C.fig);
  s+=line(P.leg[2],add(P.leg[2],[6,1]),7,C.fig)+line(P.leg2[2],add(P.leg2[2],[-6,1]),7,C.fig);
  s+=poly([add(SL,[-3,-3]),add(SR,[3,-3]),add(HR,[3,4]),add(HL,[-3,4])],C.fig,'stroke="var(--fig)" stroke-width="6" stroke-linejoin="round"');
  if(hi.has('peito')) s+=poly([add(SL,[2,3]),add(SR,[-2,3]),add(lerpP(SR,HR,.4),[-3,0]),add(lerpP(SL,HL,.4),[3,0])],C.hi,'opacity=".9"');
  if(hi.has('costas')) s+=poly([add(SR,[0,4]),add(lerpP(SR,HR,.75),[-2,0]),add(lerpP(SR,HR,.3),[-7,0])],C.hi)+poly([add(SL,[0,4]),add(lerpP(SL,HL,.75),[2,0]),add(lerpP(SL,HL,.3),[7,0])],C.hi);
  if(hi.has('abdomen')) s+=poly([lerpP(lerpP(SL,HL,.45),lerpP(SR,HR,.45),.3),lerpP(lerpP(SL,HL,.45),lerpP(SR,HR,.45),.7),lerpP(HR,HL,.3),lerpP(HR,HL,.7)],C.hi);
  s+=line(N,P.head,8,C.fig)+circ(P.head,L.head,C.fig);
  const aU=hi.has('biceps')||hi.has('triceps')?C.hi:C.fig, aL=hi.has('antebraco')?C.hi:C.fig;
  s+=limb(P.arm,aU,aL,9,8)+limb(P.arm2,aU,aL,9,8)+circ(P.arm[2],4.5,C.fig)+circ(P.arm2[2],4.5,C.fig);
  if(hi.has('ombros')) s+=circ(SR,7,C.hi)+circ(SL,7,C.hi);
  return s;
}

// ---------- equipamentos ----------
function at(P,ref){
  if(Array.isArray(ref)) return ref;
  switch(ref){ case 'H': return P.arm[2]; case 'H2': return P.arm2[2]; case 'F': return P.leg[2]; case 'F2': return P.leg2[2];
    case 'K': return P.leg[1]; case 'K2': return P.leg2[1]; case 'S': return P.S||P.SR; case 'P': return P.hip||P.c; case 'Hm': return lerpP(P.arm[2],P.arm2[2],.5); }
  return [0,0];
}
function drawEq(list,P,layer){
  let s='';
  for(const e of list){
    if((e.layer||'front')!==layer) continue;
    const p=e.at?add(at(P,e.at),e.off||[0,0]):null;
    switch(e.k){
      case 'bench': s+=`<rect x="${e.x}" y="${e.y}" width="${e.w}" height="7" rx="3" fill="${C.pad}"/>`+line([e.x+8,e.y+6],[e.x+8,FLOOR],4,C.eq)+line([e.x+e.w-8,e.y+6],[e.x+e.w-8,FLOOR],4,C.eq); break;
      case 'back': { // encosto acompanhando o tronco
        const v=P.v, back=[-Math.cos(Math.atan2(v[1],v[0])+Math.PI/2),-Math.sin(Math.atan2(v[1],v[0])+Math.PI/2)];
        const a=add(add(P.hip,mul(back,12)),mul(v,-4)), b=add(add(P.S,mul(back,12)),mul(v,e.ext||6));
        s+=line(a,b,8,C.pad)+(e.leg!==false?line(lerpP(a,b,.3),[lerpP(a,b,.3)[0],FLOOR],4,C.eq):''); break; }
      case 'seat': s+=`<rect x="${r1(p[0]-16)}" y="${r1(p[1]+8)}" width="${e.w||34}" height="7" rx="3" fill="${C.pad}"/>`+line([p[0],p[1]+14],[p[0],FLOOR],4,C.eq); break;
      case 'bar': s+=line(add(p,[-4,0]),add(p,[4,0]),4,C.eq)+circ(p,e.r||13,C.plate,`stroke="var(--eq)" stroke-width="2"`)+circ(p,3,C.eq); break;
      case 'db': s+=`<rect x="${r1(p[0]-9)}" y="${r1(p[1]-3)}" width="18" height="6" rx="2" fill="${C.eq}"/>`+`<rect x="${r1(p[0]-11)}" y="${r1(p[1]-7)}" width="6" height="14" rx="2" fill="${C.plate}"/><rect x="${r1(p[0]+5)}" y="${r1(p[1]-7)}" width="6" height="14" rx="2" fill="${C.plate}"/>`; break;
      case 'kb': s+=`<path d="M${r1(p[0]-6)} ${r1(p[1]+4)} q0 -9 6 -9 q6 0 6 9" stroke="${C.eq}" stroke-width="3" fill="none"/>`+circ(add(p,[0,13]),10,C.plate); break;
      case 'ball': s+=circ(p,11,C.plate,`stroke="var(--eq)" stroke-width="2"`); break;
      case 'cable': { const q=add(at(P,e.to),e.toOff||[0,0]); s+=circ(e.from,5,'none',`stroke="var(--eq)" stroke-width="3"`)+line(e.from,q,2,C.cable)+circ(q,3,C.eq); break; }
      case 'pole': s+=line([e.x,e.y1],[e.x,e.y2],5,C.eq); break;
      case 'hbar': s+=line([e.x1,e.y],[e.x2,e.y],5,C.eq); break;
      case 'rod': s+=line(at(P,e.a),at(P,e.b),4,C.eq); break;
      case 'pt': s+=circ(e.p,e.r||5,C.eq); break;
      case 'pad': s+=line(e.a,e.b,e.w||10,C.pad); break;
      case 'apad': s+=circ(p,e.r||6,C.pad); break;
      case 'mat': s+=`<rect x="${e.x}" y="${FLOOR-3}" width="${e.w}" height="4" rx="2" fill="${C.pad}"/>`; break;
      case 'step': s+=`<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${FLOOR-e.y}" rx="2" fill="${C.pad}"/>`; break;
      case 'sled': { const q=p; s+=line(add(q,[-11,-11]),add(q,[11,11]),6,C.eq)+line([120,140],[205,55],4,C.pad); break; }
      case 'rail': s+=line([e.x1,e.y],[e.x2,e.y],5,C.pad)+circ([e.x2+14,e.y-14],15,'none','stroke="var(--eq)" stroke-width="4"'); break;
      case 'chain': s+=line(at(P,'H'),e.to,2,C.cable); break;
      case 'target': s+=circ(e.p,8,'none','stroke="var(--hi)" stroke-width="3"')+circ(e.p,2.5,C.hi); break;
      case 'rope': { const a=at(P,'H'),b=at(P,'H2'),f=at(P,'F'); s+=`<path d="M${r1(a[0])} ${r1(a[1])} Q ${r1(f[0]+30)} ${r1(f[1]+16)} ${r1(b[0])} ${r1(b[1])}" stroke="var(--cable)" stroke-width="2" fill="none"/>`; break; }
      case 'tbar': s+=line([22,FLOOR-2],at(P,'H'),4,C.eq)+circ(add(at(P,'H'),[-8,4]),10,C.plate); break;
    }
  }
  return s;
}

// ---------- biblioteca de movimentos ----------
const BENCH={k:'bench',x:40,y:104,w:130,layer:'back'};
const lie=(H,extra)=>Object.assign({h:[140,98],t:-90,F:[180,146],kb:'u',H,eb:'d'},extra||{});
const stand=(extra)=>Object.assign({h:[100,76],t:0,F:[104,146]},extra||{});
const fstand=(extra)=>Object.assign({view:'f',h:[110,76]},extra||{});
const fseat=(extra)=>Object.assign({view:'f',h:[110,100],F:[118,146],F2:[102,146]},extra||{});
const A = {
 'supino-reto':{eq:[BENCH,{k:'bar',at:'H'}],a:lie([100,82]),b:lie([97,47])},
 'supino-reto-halter':{eq:[BENCH,{k:'db',at:'H'}],a:lie([104,84]),b:lie([97,47])},
 'supino-inclinado-halter':{eq:[{k:'back',layer:'back'},{k:'seat',at:'P',layer:'back',w:40},{k:'db',at:'H'}],a:{h:[132,96],t:-55,F:[178,146],kb:'u',H:[102,62],eb:'d'},b:{h:[132,96],t:-55,F:[178,146],kb:'u',H:[100,20],eb:'d'}},
 'supino-inclinado-barra':{eq:[{k:'back',layer:'back'},{k:'seat',at:'P',layer:'back',w:40},{k:'bar',at:'H'}],a:{h:[132,96],t:-55,F:[178,146],kb:'u',H:[102,62],eb:'d'},b:{h:[132,96],t:-55,F:[178,146],kb:'u',H:[100,20],eb:'d'}},
 'supino-declinado':{eq:[{k:'back',layer:'back',ext:10},{k:'apad',at:'F',layer:'back',r:6},{k:'bar',at:'H'}],a:{h:[130,92],t:-110,F:[158,122],kb:'u',H:[95,96],eb:'d'},b:{h:[130,92],t:-110,F:[158,122],kb:'u',H:[92,57],eb:'d'}},
 'crucifixo-halter':{eq:[BENCH,{k:'db',at:'H'}],a:lie([66,96],{eb:'u'}),b:lie([97,48],{eb:'u'})},
 'crossover':{eq:[{k:'pole',x:30,y1:-20,y2:148,layer:'back'},{k:'pole',x:190,y1:-20,y2:148,layer:'back'},{k:'cable',from:[188,-8],to:'H'},{k:'cable',from:[32,-8],to:'H2'}],a:fstand({H:[168,34],H2:[52,34],eb:'d'}),b:fstand({H:[116,88],H2:[104,88],eb:'o'})},
 'peck-deck':{eq:[{k:'pad',a:[96,40],b:[96,100],w:30,layer:'back'},{k:'pad',a:[84,104],b:[136,104],w:8,layer:'back'}],a:fseat({H:[166,8],H2:[54,8],eb:'d'}),b:fseat({H:[118,6],H2:[102,6],eb:'o'})},
 'flexao-braco':{eq:[{k:'mat',x:10,w:150}],a:{h:[76,117],t:63,H:[118,146],F:[14,146],eb:'u',ft:-60},b:{h:[80,130],t:80,H:[118,146],F:[14,146],eb:'u',ft:-60}},
 'paralelas':{eq:[{k:'pole',x:112,y1:88,y2:148,layer:'back'},{k:'pt',p:[108,88],r:5}],a:{h:[100,80],t:15,H:[108,86],F:[80,134],kb:'b'},b:{h:[100,98],t:20,H:[108,86],F:[74,146],kb:'b'}},
 'barra-fixa':{noFloor:true,eq:[{k:'hbar',x1:50,x2:170,y:-14},{k:'pole',x:50,y1:-14,y2:150,layer:'back'},{k:'pole',x:170,y1:-14,y2:150,layer:'back'}],a:{view:'f',h:[110,82],H:[142,-12],H2:[78,-12],eb:'o',F:[118,140],F2:[102,140]},b:{view:'f',h:[110,46],H:[142,-12],H2:[78,-12],eb:'d',F:[118,106],F2:[102,106]}},
 'puxada-frente':{eq:[{k:'cable',from:[110,-24],to:'Hm'},{k:'rod',a:'H',b:'H2'},{k:'pad',a:[94,92],b:[126,92],w:8}],a:fseat({h:[110,104],H:[150,-14],H2:[70,-14],eb:'o',F:[120,148],F2:[100,148]}),b:fseat({h:[110,104],H:[146,52],H2:[74,52],eb:'d',F:[120,148],F2:[100,148]})},
 'remada-curvada':{eq:[{k:'bar',at:'H'}],a:{h:[86,84],t:60,F:[106,146],H:[124,112],eb:'b'},b:{h:[86,84],t:60,F:[106,146],H:[108,94],eb:'u'}},
 'remada-cavalinho':{eq:[{k:'tbar'}],a:{h:[84,80],t:45,F:[104,146],H:[118,100],eb:'b'},b:{h:[84,80],t:45,F:[104,146],H:[104,80],eb:'u'}},
 'remada-baixa':{eq:[{k:'cable',from:[196,112],to:'H'},{k:'step',x:146,y:108,w:14},{k:'mat',x:40,w:120}],a:{h:[80,120],t:12,F:[150,112],kb:'u',H:[132,84],eb:'d'},b:{h:[80,120],t:-8,F:[150,112],kb:'u',H:[96,96],eb:'b'}},
 'remada-unilateral':{eq:[{k:'bench',x:24,y:104,w:110,layer:'back'},{k:'db',at:'H'}],a:{h:[70,82],t:80,H:[116,124],H2:[118,104],eb:'b',eb2:'b',F:[64,146],F2:[34,102],kb:'f',kb2:'d'},b:{h:[70,82],t:80,H:[94,96],H2:[118,104],eb:'u',eb2:'b',F:[64,146],F2:[34,102],kb:'f',kb2:'d'}},
 'pulldown-reto':{eq:[{k:'pole',x:200,y1:-24,y2:148,layer:'back'},{k:'cable',from:[196,-14],to:'H'}],a:stand({h:[90,76],t:20,F:[96,146],H:[148,40],eb:'d'}),b:stand({h:[90,76],t:20,F:[96,146],H:[112,82],eb:'d'})},
 'levantamento-terra':{eq:[{k:'bar',at:'H',r:15}],a:{h:[78,98],t:55,F:[106,146],H:[112,124],eb:'b'},b:stand({H:[102,80]})},
 'face-pull':{eq:[{k:'pole',x:200,y1:-24,y2:148,layer:'back'},{k:'cable',from:[196,26],to:'H'}],a:stand({h:[90,76],t:-5,F:[98,146],H:[138,34],eb:'d'}),b:stand({h:[90,76],t:-5,F:[98,146],H:[106,26],eb:'b'})},
 'desenvolvimento-halter':{eq:[{k:'pad',a:[110,40],b:[110,100],w:30,layer:'back'},{k:'db',at:'H'},{k:'db',at:'H2'}],a:fseat({H:[146,44],H2:[74,44],eb:'d'}),b:fseat({H:[134,-2],H2:[86,-2],eb:'o'})},
 'desenvolvimento-barra':{eq:[{k:'bar',at:'H'}],a:stand({H:[114,36],eb:'d'}),b:stand({H:[102,-21],eb:'d'})},
 'elevacao-lateral':{eq:[{k:'db',at:'H'},{k:'db',at:'H2'}],a:fstand({H:[132,80],H2:[88,80]}),b:fstand({H:[172,34],H2:[48,34],eb:'d'})},
 'elevacao-lateral-cabo':{eq:[{k:'pole',x:40,y1:20,y2:148,layer:'back'},{k:'cable',from:[44,140],to:'H'}],a:fstand({H:[106,92],H2:[86,80]}),b:fstand({H:[172,34],H2:[86,80],eb:'d'})},
 'elevacao-frontal':{eq:[{k:'db',at:'H'}],a:stand({H:[106,80]}),b:stand({H:[152,32],eb:'d'})},
 'crucifixo-inverso':{eq:[{k:'db',at:'H'}],a:{h:[80,80],t:70,F:[100,146],H:[124,116],eb:'b'},b:{h:[80,80],t:70,F:[100,146],H:[92,66],eb:'d'}},
 'encolhimento':{eq:[{k:'db',at:'H'},{k:'db',at:'H2'}],a:fstand({H:[129,82],H2:[91,82]}),b:fstand({sh:-7,H:[129,75],H2:[91,75]})},
 'rosca-direta':{eq:[{k:'bar',at:'H'}],a:stand({H:[104,82],eb:'d'}),b:stand({H:[116,38],eb:'d'})},
 'rosca-alternada':{eq:[{k:'db',at:'H'},{k:'db',at:'H2',layer:'back'}],a:stand({H:[104,82],H2:[104,82],eb:'d'}),b:stand({H:[116,38],H2:[104,82],eb:'d'})},
 'rosca-martelo':{eq:[{k:'db',at:'H'},{k:'db',at:'H2',layer:'back'}],a:stand({H:[104,82],eb:'d'}),b:stand({H:[116,38],eb:'d'})},
 'rosca-scott':{eq:[{k:'pad',a:[108,66],b:[140,96],w:10},{k:'seat',at:'P',layer:'back'},{k:'bar',at:'H'}],a:{h:[96,100],t:10,F:[110,146],kb:'f',H:[146,98],eb:'d'},b:{h:[96,100],t:10,F:[110,146],kb:'f',H:[128,52],eb:'d'}},
 'rosca-cabo':{eq:[{k:'cable',from:[150,144],to:'H'}],a:stand({H:[108,82],eb:'d'}),b:stand({H:[116,38],eb:'d'})},
 'triceps-corda':{eq:[{k:'pole',x:150,y1:-24,y2:148,layer:'back'},{k:'cable',from:[146,-16],to:'H'}],a:stand({h:[96,76],t:10,F:[102,146],H:[126,46],eb:'d'}),b:stand({h:[96,76],t:10,F:[102,146],H:[114,84],eb:'d'})},
 'triceps-barra':{eq:[{k:'pole',x:150,y1:-24,y2:148,layer:'back'},{k:'cable',from:[146,-16],to:'H'},{k:'rod',a:'H',b:'H',},],a:stand({h:[96,76],t:10,F:[102,146],H:[126,46],eb:'d'}),b:stand({h:[96,76],t:10,F:[102,146],H:[114,84],eb:'d'})},
 'triceps-frances-cabo':{eq:[{k:'pole',x:22,y1:-24,y2:148,layer:'back'},{k:'cable',from:[26,34],to:'H'}],a:stand({h:[100,76],t:22,F:[112,146],F2:[86,146],H:[100,8],eb:'u'}),b:stand({h:[100,76],t:22,F:[112,146],F2:[86,146],H:[152,-8],eb:'u'})},
 'triceps-testa':{eq:[BENCH,{k:'bar',at:'H'}],a:lie([74,86],{eb:'u'}),b:lie([96,47],{eb:'u'})},
 'mergulho-banco':{eq:[{k:'bench',x:30,y:104,w:44,layer:'back'}],a:{h:[78,100],t:0,H:[62,104],eb:'b',F:[150,146],kb:'u'},b:{h:[80,120],t:0,H:[62,104],eb:'b',F:[150,146],kb:'u'}},
 'rosca-punho':{eq:[{k:'bench',x:56,y:106,w:50,layer:'back'},{k:'bar',at:'H',r:10}],a:{h:[80,100],t:22,F:[122,146],kb:'u',H:[130,104],eb:'d'},b:{h:[80,100],t:22,F:[122,146],kb:'u',H:[130,92],eb:'d'}},
 'agachamento-livre':{eq:[{k:'bar',at:'S',off:[-7,0],r:9}],a:stand({t:5,F:[106,146],H:[92,34],eb:'d'}),b:{h:[74,114],t:40,F:[106,146],H:[96,80],eb:'d'}},
 'agachamento-frontal':{eq:[{k:'bar',at:'S',off:[9,0],r:9}],a:stand({t:3,F:[106,146],H:[112,32],eb:'d'}),b:{h:[78,116],t:22,F:[106,146],H:[104,76],eb:'d'}},
 'leg-press':{eq:[{k:'back',layer:'back',leg:true},{k:'sled',at:'F',layer:'back'}],a:{h:[120,110],t:-60,F:[150,72],kb:'u',H:[118,108],eb:'d'},b:{h:[120,110],t:-60,F:[164,54],kb:'u',H:[118,108],eb:'d'}},
 'hack':{eq:[{k:'back',layer:'back'},{k:'step',x:104,y:142,w:40}],a:{h:[96,72],t:-14,F:[120,140],H:[86,28],eb:'d'},b:{h:[84,106],t:-14,F:[120,140],H:[76,62],eb:'d'}},
 'bulgaro':{eq:[{k:'bench',x:18,y:102,w:44,layer:'back'},{k:'db',at:'H'}],a:{h:[96,76],t:5,F:[126,146],F2:[44,98],kb2:'d',H:'hang'},b:{h:[92,104],t:14,F:[126,146],F2:[44,98],kb2:'d',H:'hang'}},
 'afundo':{eq:[{k:'db',at:'H'}],a:stand({F:[106,146],F2:[96,146],H:'hang'}),b:{h:[92,104],t:0,F:[130,146],F2:[50,146],kb2:'d',H:'hang',ft2:-50}},
 'extensora':{eq:[{k:'pad',a:[74,40],b:[70,104],w:10,layer:'back'},{k:'seat',at:'P',layer:'back'},{k:'apad',at:'F',off:[2,-4],r:7}],a:{h:[88,104],t:-10,F:[126,142],kb:'u',H:[100,110],eb:'d',ft:-70},b:{h:[88,104],t:-10,F:[156,98],kb:'u',H:[100,110],eb:'d',ft:-10}},
 'stiff':{eq:[{k:'db',at:'H'}],a:stand({H:'hang'}),b:{h:[82,80],t:75,F:[104,146],H:'hang'}},
 'mesa-flexora':{eq:[{k:'bench',x:34,y:104,w:130,layer:'back'},{k:'apad',at:'F',off:[0,-6],r:7}],a:{h:[84,96],t:90,H:[142,110],eb:'d',F:[16,96],ft:180},b:{h:[84,96],t:90,H:[142,110],eb:'d',F:[58,42],kb:'d',ft:120}},
 'cadeira-flexora':{eq:[{k:'pad',a:[74,40],b:[70,104],w:10,layer:'back'},{k:'seat',at:'P',layer:'back'},{k:'apad',at:'F',off:[0,-7],r:7}],a:{h:[88,104],t:-10,F:[156,100],kb:'u',H:[100,110],eb:'d'},b:{h:[88,104],t:-10,F:[112,140],kb:'u',H:[100,110],eb:'d'}},
 'good-morning':{eq:[{k:'bar',at:'S',off:[-7,0],r:9}],a:stand({H:[92,34],eb:'d'}),b:{h:[84,80],t:78,F:[104,146],H:[124,62],eb:'u'}},
 'hip-thrust':{eq:[{k:'bench',x:24,y:100,w:44,layer:'back'},{k:'bar',at:'P',off:[0,-12]}],a:{h:[98,128],t:-52,F:[140,146],kb:'u',H:[100,116],eb:'d'},b:{h:[104,96],t:-86,F:[142,146],kb:'u',H:[104,84],eb:'d'}},
 'gluteo-cabo':{eq:[{k:'pole',x:160,y1:20,y2:148,layer:'back'},{k:'cable',from:[14,142],to:'F'}],a:{h:[100,76],t:22,F:[100,146],F2:[106,146],H:[150,62],eb:'d'},b:{h:[100,76],t:22,F:[36,110],F2:[106,146],H:[150,62],eb:'d',ft:-90}},
 'abducao':{eq:[{k:'apad',at:'K',r:7},{k:'apad',at:'K2',r:7},{k:'pad',a:[110,40],b:[110,100],w:30,layer:'back'}],a:fseat({F:[116,146],F2:[104,146]}),b:fseat({F:[148,146],F2:[72,146]})},
 'adutora':{eq:[{k:'apad',at:'K',r:7},{k:'apad',at:'K2',r:7},{k:'pad',a:[110,40],b:[110,100],w:30,layer:'back'}],a:fseat({F:[148,146],F2:[72,146]}),b:fseat({F:[116,146],F2:[104,146]})},
 'panturrilha-pe':{eq:[{k:'step',x:96,y:136,w:36},{k:'db',at:'H'}],a:stand({h:[100,64],F:[106,134],ft:15,H:'hang'}),b:stand({h:[100,54],F:[106,124],ft:-45,H:'hang'})},
 'panturrilha-sentado':{eq:[{k:'seat',at:'P',layer:'back'},{k:'apad',at:'K',off:[2,-6],r:7},{k:'step',x:116,y:140,w:26}],a:{h:[88,104],t:0,F:[126,136],kb:'u',ft:15,H:[118,96],eb:'d'},b:{h:[88,104],t:0,F:[126,126],kb:'u',ft:-40,H:[118,92],eb:'d'}},
 'abdominal-polia':{eq:[{k:'pole',x:150,y1:-24,y2:148,layer:'back'},{k:'cable',from:[146,-16],to:'H'},{k:'mat',x:30,w:120}],a:{h:[90,100],t:10,F:[52,146],kb:'d',H:[108,44],eb:'d',ft:180},b:{h:[90,100],t:70,F:[52,146],kb:'d',H:[136,76],eb:'d',ft:180}},
 'abdominal-supra':{eq:[{k:'mat',x:30,w:160}],a:{h:[104,138],t:-88,F:[154,146],kb:'u',H:[74,130],eb:'u'},b:{h:[104,138],t:-58,F:[154,146],kb:'u',H:[80,112],eb:'u'}},
 'elevacao-pernas':{noFloor:true,eq:[{k:'hbar',x1:60,x2:150,y:-16}],a:{h:[100,84],t:0,H:[102,-14],eb:'b',F:[104,154]},b:{h:[100,84],t:-6,H:[102,-14],eb:'b',F:[170,80]}},
 'prancha':{eq:[{k:'mat',x:6,w:170}],a:{h:[80,124],t:80,H:[150,146],eb:'d',F:[12,146],ft:-60},b:{h:[80,121],t:79,H:[150,146],eb:'d',F:[12,146],ft:-60}},
 'obliquo':{eq:[{k:'db',at:'H'}],a:fstand({H:[129,82]}),b:fstand({tilt:16,H:[150,94]})},
 'clean':{eq:[{k:'bar',at:'H',r:15}],a:{h:[78,98],t:55,F:[106,146],H:[112,124],eb:'b'},b:{h:[88,96],t:10,F:[106,146],H:[112,54],eb:'u'}},
 'snatch':{eq:[{k:'bar',at:'H',r:15}],a:{h:[78,98],t:58,F:[106,146],H:[114,124],eb:'b'},b:{h:[80,108],t:22,F:[106,146],H:[88,4],eb:'b'}},
 'clean-jerk':{eq:[{k:'bar',at:'H',r:15}],a:stand({H:[112,32],eb:'u'}),b:{h:[96,90],t:0,F:[134,146],F2:[56,146],kb2:'d',H:[98,-10],eb:'b'}},
 'thruster':{eq:[{k:'bar',at:'H',r:15}],a:{h:[78,114],t:28,F:[106,146],H:[112,74],eb:'u'},b:stand({H:[100,-21],eb:'b'})},
 'push-press':{eq:[{k:'bar',at:'H',r:15}],a:stand({h:[98,82],F:[106,146],H:[112,36],eb:'u'}),b:stand({H:[100,-21],eb:'b'})},
 'kettlebell-swing':{eq:[{k:'kb',at:'H'}],a:{h:[80,84],t:60,F:[106,146],H:[100,106],eb:'d'},b:stand({H:[152,40],eb:'d'})},
 'wall-ball':{eq:[{k:'ball',at:'Hm'},{k:'target',p:[176,-14]}],a:{view:'f',h:[110,106],H:[122,58],H2:[98,58],eb:'d',F:[132,146],F2:[88,146]},b:fstand({H:[118,-12],H2:[102,-12],eb:'o'})},
 'burpee':{eq:[{k:'mat',x:10,w:160}],a:{h:[76,117],t:63,H:[118,146],F:[14,146],eb:'u',ft:-60},b:{h:[100,62],t:0,F:[104,132],H:[104,-24],eb:'b',ft:-30}},
 'remo-ergometro':{eq:[{k:'rail',x1:20,x2:170,y:140},{k:'chain',to:[184,118]}],a:{h:[86,126],t:28,F:[150,118],kb:'u',H:[146,112],eb:'d'},b:{h:[60,126],t:-22,F:[150,118],kb:'u',H:[78,98],eb:'d'}},
 'corrida':{eq:[],a:{h:[100,74],t:10,F:[126,142],F2:[78,130],kb:'f',kb2:'f',ft2:-50,H:[120,66],H2:[86,92],eb:'d',eb2:'d'},b:{h:[100,74],t:10,F:[78,130],F2:[126,142],kb:'f',kb2:'f',ft:-50,ft2:0,H:[86,92],H2:[120,66],eb:'d',eb2:'d'}},
 'double-under':{eq:[{k:'rope'}],a:fstand({H:[138,82],H2:[82,82],F:[118,146],F2:[102,146]}),b:fstand({h:[110,62],H:[138,68],H2:[82,68],F:[118,132],F2:[102,132]})}
};
// ajustes de destaque por exercício (músculos principais)
const HI = {
 'paralelas':['peito','triceps'],'flexao-braco':['peito','triceps'],'levantamento-terra':['costas','gluteos','posteriores'],'face-pull':['ombros','costas'],
 'crucifixo-inverso':['ombros'],'encolhimento':['ombros'],'agachamento-livre':['quadriceps','gluteos'],'agachamento-frontal':['quadriceps'],
 'leg-press':['quadriceps','gluteos'],'hack':['quadriceps'],'bulgaro':['quadriceps','gluteos'],'afundo':['quadriceps','gluteos'],'stiff':['posteriores','gluteos'],
 'good-morning':['posteriores','costas'],'hip-thrust':['gluteos','posteriores'],'clean':['costas','quadriceps','gluteos'],'snatch':['ombros','gluteos','quadriceps'],
 'clean-jerk':['ombros','quadriceps'],'thruster':['quadriceps','ombros'],'push-press':['ombros','triceps'],'kettlebell-swing':['gluteos','posteriores'],
 'wall-ball':['quadriceps','ombros'],'burpee':['peito','quadriceps'],'remo-ergometro':['costas','quadriceps'],'corrida':['quadriceps','panturrilha'],'double-under':['panturrilha'],
 'mergulho-banco':['triceps'],'remada-baixa':['costas','biceps'],'barra-fixa':['costas','biceps'],'puxada-frente':['costas','biceps'],'abducao':['gluteos'],'adutora':['quadriceps']
};
const GROUP_HI = {peito:['peito'],costas:['costas'],ombros:['ombros'],biceps:['biceps'],triceps:['triceps'],antebraco:['antebraco'],quadriceps:['quadriceps'],posteriores:['posteriores'],gluteos:['gluteos'],panturrilha:['panturrilha'],abdomen:['abdomen'],lpo:['quadriceps','ombros'],cardio:['quadriceps']};

function frame(id,k,grupo){
  const A0=A[id]; if(!A0) return null;
  const spec=lerpPose(A0.a,A0.b,k);
  spec.view=A0.a.view||'s';
  const P=pose(spec);
  const hi=new Set(HI[id]||GROUP_HI[grupo]||[]);
  const body = P.view==='f'?drawFront(P,hi):drawSide(P,hi);
  return (A0.noFloor?'':`<line x1="0" y1="${FLOOR+1}" x2="220" y2="${FLOOR+1}" stroke="var(--line)" stroke-width="3"/>`)+drawEq(A0.eq,P,'back')+body+drawEq(A0.eq,P,'front');
}
const VB='0 -28 220 182';
function svg(id,grupo,opts={}){
  if(!A[id]) return null;
  const ghost = opts.ghost!==false ? `<g opacity=".22">${frame(id,0,grupo)}</g>` : '';
  return `<svg class="exart" viewBox="${VB}" role="img" aria-label="Ilustração da execução">${ghost}<g class="exart-live">${frame(id,opts.k??1,grupo)}</g></svg>`;
}
// anima entre início e fim: sobe (1,2 s), segura, desce (1,6 s), segura
function animate(el,id,grupo){
  if(!A[id]||!el) return ()=>{};
  let raf, t0=performance.now(), stop=false;
  const g=el.querySelector('.exart-live'), label=el.parentElement&&el.parentElement.querySelector('.exart-phase');
  const T=[1200,350,1600,450], tot=T.reduce((a,b)=>a+b,0);
  const ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
  const tick=now=>{
    if(stop||!el.isConnected) return;
    let t=(now-t0)%tot, k, ph;
    if(t<T[0]){k=ease(t/T[0]);ph='Execução';} else if((t-=T[0])<T[1]){k=1;ph='Pico';} else if((t-=T[1])<T[2]){k=1-ease(t/T[2]);ph='Volta controlada';} else {k=0;ph='Início';}
    g.innerHTML=frame(id,k,grupo); if(label) label.textContent=ph;
    raf=requestAnimationFrame(tick);
  };
  if((window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)||document.documentElement.classList.contains('no-motion')){ g.innerHTML=frame(id,1,grupo); return ()=>{}; }
  raf=requestAnimationFrame(tick);
  return ()=>{stop=true;cancelAnimationFrame(raf);};
}
return {svg,animate,has:id=>!!A[id],ids:()=>Object.keys(A)};
})();
