(function(){
'use strict';
const D = window.FX_DATA;

/* ---------- utilidades ---------- */
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const sleep = ms=>new Promise(r=>setTimeout(r,ms));
const uid = ()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3);
const clone = o=>JSON.parse(JSON.stringify(o));
const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso = d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today = ()=>iso(new Date());
const pISO = s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays = (s,n)=>{const d=pISO(s);d.setDate(d.getDate()+n);return iso(d)};
const mk = s=>s.slice(0,7);
const mondayOf = s=>{const d=pISO(s);const w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);return iso(d)};
const DOW = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DOWL = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const MES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const fmt = (n,d=0)=>(Number.isFinite(+n)?(+n):0).toLocaleString('pt-BR',{maximumFractionDigits:d,minimumFractionDigits:d});
const dlabel = s=>{const d=pISO(s);return `${DOWL[d.getDay()]}, ${d.getDate()} ${MES[d.getMonth()]}`};
const dshort = s=>{const d=pISO(s);return `${d.getDate()}/${String(d.getMonth()+1).padStart(2,'0')}`};
const num = v=>{const n=parseFloat(String(v).replace(',','.'));return Number.isFinite(n)?n:0};
const round5 = n=>Math.round(n/5)*5;
const css = v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const daysBetween = (a,b)=>Math.round((pISO(b)-pISO(a))/864e5);

/* ---------- armazenamento: nuvem por pessoa (db) com cópia no aparelho ---------- */
const Store = {
  mode:'local', db:null, uid:null, shared:null, timers:{}, busy:{}, pending:{},
  async init(){
    if(window.EVO_READY){ try{ await window.EVO_READY; }catch(e){} }
    const inFrame=(()=>{try{return window.self!==window.top}catch(e){return true}})();
    for(let i=0;inFrame && i<20 && !(window.claude && window.claude.use);i++) await sleep(100);
    if(window.claude && window.claude.use){
      try{
        const [db,user] = await Promise.all([claude.use('db'),claude.use('user')]);
        this.shared = db;
        if(db && user){ const id = await user.id(); if(id){ this.db=db; this.uid=id; this.mode='cloud'; } }
        if(user){ try{ const me = await user.me(); this.meName = me && me.name || ''; }catch(e){} }
        try{ this.downloads = await claude.use('downloads'); }catch(e){}
      }catch(e){}
    }
    this.standalone=!inFrame;
    setSync(this.mode==='cloud'?'ok':'local');
  },
  key(k){ return 'fx1:'+(this.uid||'local')+':'+k; },
  lsGet(k){ try{ const v=localStorage.getItem(this.key(k)) ?? localStorage.getItem('fx1:local:'+k); return v?JSON.parse(v):undefined; }catch(e){ return undefined; } },
  lsSet(k,v){ try{ localStorage.setItem(this.key(k),JSON.stringify(v)); }catch(e){} },
  ref(k){ return this.db.doc('data/users/'+this.uid+'/'+k); },
  async load(k){
    if(this.mode==='cloud'){
      try{ const s = await this.ref(k).get(); if(s.exists){ const v=s.data().v; this.lsSet(k,v); return clone(v); } }
      catch(e){}
    }
    return this.lsGet(k);
  },
  save(k,v){
    this.lsSet(k,v);
    if(this.mode!=='cloud') return;
    setSync('saving');
    clearTimeout(this.timers[k]);
    this.timers[k] = setTimeout(()=>this.write(k,v),800);
  },
  async write(k,v){
    if(this.busy[k]){ this.pending[k]=v; return; }
    this.busy[k]=true;
    try{ await this.ref(k).set({v:clone(v),t:Date.now()}); setSync('ok'); this.wrote=true; }
    catch(e){
      if(e && e.code==='invalid_argument' && !this.wrote){ this.mode='local'; setSync('local'); }
      else if(e && e.code==='unavailable'){ await sleep(800+Math.random()*800); try{ await this.ref(k).set({v:clone(v),t:Date.now()}); setSync('ok'); }catch(_){ setSync('err'); } }
      else setSync('err');
    }
    this.busy[k]=false;
    if(this.pending[k]!==undefined){ const p=this.pending[k]; delete this.pending[k]; this.write(k,p); }
  }
};
function setSync(st){
  const el=$('#sync'); if(!el) return;
  el.className='sync '+(st==='ok'?'ok':st==='err'?'err':'');
  el.querySelector('span').textContent = st==='ok'?'salvo na sua conta':st==='saving'?'salvando…':st==='err'?'erro ao salvar — mantido no aparelho':'salvo neste aparelho';
}

/* ---------- estado ---------- */
const S = { profile:null, cfg:null, tpl:null, prs:null, body:null, lib:null, meta:null, months:{}, logs:{}, imgs:{}, active:null, tab:'hoje', weekStart:mondayOf(today()), dietType:null, chart:{}, prEx:null, montarSel:null };

function defaultProfile(){
  return {nome:'',sexo:'',idade:'',altura:'',peso:'',bf:'',nivel:'iniciante',objetivo:'recomp',fator:1.4,naf:1.725,eq:'auto',
    clima:'quente',cintura:'',mascote:'m',tom:'sutil',pesoMeta:'',onboarded:false,exemplo:false,parceiro:null,pro:null};
}
function defaultCfg(){
  const meals={}; D.DAYTYPES.forEach(t=>meals[t.id]=[]);
  return {acts:clone(D.ACTS),dayTypes:clone(D.DAYTYPES),meals,
    water:{mlKg:35,mlHora:600,calor:500,copo:250,anim:'m'},
    period:{preset:'custom',start:mondayOf(today()),weeks:[]},
    weekPattern:{1:[],2:[],3:[],4:[],5:[],6:[],0:[]},
    rotation:[],rotIdx:0};
}
function loadExample(){
  const s=(act,hora,rot)=>({act,hora,rot:!!rot});
  S.tpl=clone(D.TEMPLATES); S.cfg.meals=mealsWithIds(clone(D.MEALS));
  S.cfg.period={preset:'plano12',start:mondayOf(today()),weeks:clone(D.PERIODS.plano12.weeks)};
  S.cfg.weekPattern={1:[s('musc','05:30',true),s('cross','17:30')],2:[s('musc','05:30',true),s('cross','17:30')],3:[s('musc','05:30',true),s('cross','17:30')],4:[s('musc','05:30',true),s('cross','17:30')],5:[s('musc','05:30',true)],6:[],0:[]};
  S.cfg.rotation=['push','pull','legs']; S.cfg.rotIdx=0; save('tpl'); save('cfg');
}
function mealsWithIds(m){ Object.keys(m).forEach(k=>m[k].forEach(x=>{x.id=x.id||uid();})); return m; }

const exById = id => S.lib.custom.find(e=>e.id===id) || D.LIB.find(e=>e.id===id);
const allEx = ()=>[...D.LIB,...S.lib.custom];
const tplById = id => S.tpl.find(t=>t.id===id);
const actById = id => S.cfg.acts.find(a=>a.id===id) || {id,nome:id,met:5,min:60};
const dtById = id => S.cfg.dayTypes.find(t=>t.id===id) || S.cfg.dayTypes[0];

async function boot(){
  await Store.init();
  const [profile,cfg,tpl,prs,body,lib,meta,chal] = await Promise.all(['profile','cfg','tpl','prs','body','lib','meta','chal'].map(k=>Store.load(k)));
  S.profile = Object.assign(defaultProfile(), profile||{});
  S.profile.ui = Object.assign(defaultUI(), S.profile.ui||{}); if(S.profile.ui.v!==2){ S.profile.ui.v=2; S.profile.ui.accent='dourado'; S.profile.ui.font='padrao'; } applyUI();
  S.cfg = Object.assign(defaultCfg(), cfg||{});
  S.tpl = tpl || [];
  if(S.cfg.actsV!==2){ const ok=new Set(D.ACTS.map(a=>a.id)); const old=S.cfg.acts||[];
    S.cfg.acts=D.ACTS.map(a=>{ const o=old.find(x=>x.id===a.id); return o?Object.assign(clone(a),{met:o.met,min:o.min}):clone(a); });
    S.cfg.dayTypes.forEach(t=>{ t.acts=(t.acts||[]).filter(a=>ok.has(a)); if(t.desc) t.desc=t.desc.replace(/ \+ TFM|TFM \+ /g,''); });
    Object.keys(S.cfg.weekPattern||{}).forEach(k=>S.cfg.weekPattern[k]=(S.cfg.weekPattern[k]||[]).filter(x=>ok.has(x.act)));
    S.cfg.actsV=2; if(cfg) Store.save('cfg',S.cfg); }
  S.prs = prs || {manual:[]};
  S.body = body || {entries:[]};
  S.lib = lib || {custom:[],imgs:{}};
  S.meta = meta || {logMonths:[]};
  S.chal = chal || {};
  try{ S.active = JSON.parse(localStorage.getItem(Store.key('active'))||'null'); }catch(e){}
  if(!S.active && Store.mode==='cloud'){ const a=await Store.load('active'); if(a && a.id) S.active=a; }
  await Promise.all(S.meta.logMonths.map(m=>loadLogs(m)));
  const t=today(); await Promise.all([ensureMonth(mk(t)),ensureMonth(mk(addDays(t,-31))),ensureMonth(mk(addDays(S.weekStart,6)))]);
  let hash=(location.hash||'').slice(1); if(hash==='peso') hash='progresso'; if(hash==='desafios') hash=''; if(TABS.some(x=>x.id===hash)) S.tab=hash; else if(S.profile.ui.startTab && S.profile.ui.startTab!=='ultima') S.tab=S.profile.ui.startTab==='peso'?'progresso':S.profile.ui.startTab;
  try{ const st=localStorage.getItem('fx1:tab'); if(!hash && S.profile.ui.startTab==='ultima' && st && TABS.some(x=>x.id===st)) S.tab=st; }catch(e){}
  renderTabs(); render();
  if(!S.profile.onboarded) openOnboarding();
  proBoot();
}

async function ensureMonth(m){ if(S.months[m]) return S.months[m]; const v=await Store.load('m-'+m); S.months[m]=v||{days:{}}; return S.months[m]; }
async function loadLogs(m){ if(S.logs[m]) return; const v=await Store.load('lg-'+m); S.logs[m]=v||{sessions:[]}; }
function dayRec(d,create){ const m=S.months[mk(d)]; if(!m) return null; if(!m.days[d] && create) m.days[d]={sessions:[],water:0,meals:{}}; return m.days[d]||null; }
function saveMonth(d){ const m=mk(d); Store.save('m-'+m,S.months[m]); }
const save = k=>Store.save(k,S[k]);
function allLogs(){ return Object.values(S.logs).flatMap(l=>l.sessions).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:(a.end||0)-(b.end||0)); }

/* ---------- cálculos ---------- */
function lbm(){ const p=S.profile; return p.bf? p.peso*(1-p.bf/100) : null; }
function bmrAll(){
  const p=S.profile, w=+p.peso, h=+p.altura, a=+p.idade, m=p.sexo!=='f', l=lbm();
  return {
    mifflin:{n:'Mifflin-St Jeor',f:`10×peso + 6,25×altura − 5×idade ${m?'+ 5':'− 161'}`,v:10*w+6.25*h-5*a+(m?5:-161)},
    harris:{n:'Harris-Benedict (revisada)',f:m?'88,4 + 13,4×peso + 4,8×altura − 5,7×idade':'447,6 + 9,2×peso + 3,1×altura − 4,3×idade',v:m?88.362+13.397*w+4.799*h-5.677*a:447.593+9.247*w+3.098*h-4.330*a},
    katch:{n:'Katch-McArdle',f:'370 + 21,6 × massa magra',v:l?370+21.6*l:null},
    cunningham:{n:'Cunningham (atletas)',f:'500 + 22 × massa magra',v:l?500+22*l:null}
  };
}
function bmrKey(){ const p=S.profile; if(p.eq && p.eq!=='auto' && bmrAll()[p.eq].v) return p.eq; return lbm()?'katch':'mifflin'; }
function bmr(){ return bmrAll()[bmrKey()].v; }
function actKcal(actId,min){ const a=actById(actId); const m=min??a.min; return Math.max(0,(a.met-1))*S.profile.peso*m/60; }
function typeExp(dt){ return bmr()*S.profile.fator + dt.acts.reduce((s,a)=>s+actKcal(a),0); }
function typeTarget(dt){
  const exp=typeExp(dt), kcal=round5(exp*(1+dt.adj/100)), w=S.profile.peso;
  const p=Math.round(dt.pKg*w), g=Math.round(dt.gKg*w), c=Math.max(0,Math.round((kcal-4*p-9*g)/4));
  return {exp,kcal,p,g,c};
}
function dayExp(d){ const r=dayRec(d); if(r && r.sessions.length) return bmr()*S.profile.fator + r.sessions.reduce((s,x)=>s+(x.kcal?x.kcal:actKcal(x.act,x.min)),0); return typeExp(dtById(dayTypeOf(d))); }
function dayTypeOf(d){
  const r=dayRec(d); if(r && r.dayType && S.cfg.dayTypes.some(t=>t.id===r.dayType)) return r.dayType;
  let acts;
  if(r && r.sessions.length) acts=r.sessions.map(x=>x.act);
  else { const pat=S.cfg.weekPattern[pISO(d).getDay()]||[]; acts=pat.map(x=>x.act); }
  let best=S.cfg.dayTypes[0], bs=-1;
  for(const t of S.cfg.dayTypes){
    const a=new Set(acts), b=new Set(t.acts); const inter=[...a].filter(x=>b.has(x)).length, uni=new Set([...a,...b]).size;
    const sc = uni===0?1:inter/uni; if(sc>bs){bs=sc;best=t;}
  }
  return best.id;
}
function waterGoal(d){
  const c=S.cfg.water, r=dayRec(d);
  let mins = r && r.sessions.length ? r.sessions.reduce((s,x)=>s+(x.min??actById(x.act).min),0) : dtById(dayTypeOf(d)).acts.reduce((s,a)=>s+actById(a).min,0);
  return Math.round((S.profile.peso*c.mlKg + mins/60*c.mlHora + (S.profile.clima==='quente'?c.calor:0))/50)*50;
}
const e1rm = (kg,reps)=> reps<=0||kg<=0?0: reps===1?kg: kg*(1+reps/30);
function exHistory(exId){
  const out=[]; for(const l of allLogs()){ for(const e of l.ex||[]){ if(e.exId===exId){ const sets=(e.sets||[]).filter(s=>num(s.kg)>0||num(s.reps)>0); if(sets.length) out.push({date:l.date,sets,best:Math.max(...sets.map(s=>e1rm(num(s.kg),num(s.reps)))),top:Math.max(...sets.map(s=>num(s.kg)))}); } } }
  return out;
}
function suggestFor(te){
  const h=exHistory(te.exId); if(!h.length) return null; const last=h[h.length-1];
  const work=last.sets.filter(s=>num(s.kg)>0); if(!work.length) return null;
  const kg=Math.max(...work.map(s=>num(s.kg)));
  const topSets=work.filter(s=>num(s.kg)===kg);
  const hit=topSets.length>= Math.min(te.series,topSets.length) && topSets.every(s=>num(s.reps)>=te.repMax) && topSets.length>=Math.max(1,te.series-1);
  let next=kg; if(hit){ next=kg*1.025; next=Math.max(kg+ (kg<20?0.5:1), Math.round(next*2)/2); }
  return {last,kg,next,hit,text:last.sets.map(s=>`${fmt(num(s.kg),1).replace(',0','')}×${num(s.reps)}`).join(' · ')};
}
function periodWeek(d){
  const p=S.cfg.period; if(!p || !p.weeks || !p.weeks.length) return null;
  const n=Math.floor(daysBetween(p.start,d)/7); if(n<0) return {n:0,before:true,w:null,total:p.weeks.length};
  const idx=n%p.weeks.length; return {n:idx+1,cycle:Math.floor(n/p.weeks.length)+1,w:p.weeks[idx],total:p.weeks.length};
}
function adjSeries(series,prio,w){
  if(!w) return series; switch(w.mode){ case 'minus1': return Math.max(2,series-1); case 'half': return Math.max(1,Math.ceil(series/2)); case 'plus1': return prio?series+1:series; default: return series; }
}
const MODE_TXT = {normal:'Séries da ficha',minus1:'1 série a menos (mín. 2)',half:'Metade das séries',plus1:'+1 série nos prioritários'};

/* ---------- navegação ---------- */
const TABS = [
  {id:'hoje',n:'Hoje'},{id:'treinar',n:'Treinar'},{id:'montar',n:'Fichas'},{id:'agenda',n:'Agenda'},
  {id:'evolucao',n:'Evolução'},{id:'period',n:'Periodização'},{id:'rps',n:'Recordes'},{id:'dieta',n:'Cardápio & macros'},{id:'agua',n:'Água'},
  {id:'progresso',n:'Progresso'},{id:'perfil',n:'Perfil'},{id:'pro',n:'Aluno & profissional'},{id:'config',n:'Ajustes & ajuda'}
];
const ICON = {
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
  treino:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 7v10M18 7v10M3 9.5v5M21 9.5v5M6 12h12"/></svg>',
  dieta:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="13" r="7"/><path d="M12 6v7l4 3"/><path d="M5 3v4M19 3v4"/></svg>',
  prog:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M5 16l4-5 4 3 6-8"/><circle cx="19" cy="6" r="1.5" fill="currentColor"/></svg>',
  mais:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5"/></svg>'
};
const NAV = [
  {id:'g-hoje',n:'Hoje',ic:'home',tabs:['hoje']},
  {id:'g-treino',n:'Treino',ic:'treino',tabs:['treinar','montar','agenda','evolucao']},
  {id:'g-dieta',n:'Dieta',ic:'dieta',tabs:['dieta','agua']},
  {id:'g-prog',n:'Progresso',ic:'prog',tabs:['progresso']},
  {id:'g-mais',n:'Você',ic:'mais',tabs:['perfil','pro','config']}
];
const groupOf = tab => NAV.find(g=>g.tabs.includes(tab)) || NAV[0];
function renderTabs(){
  if(S.tab==='rps'||S.tab==='period'){ S.evoSub=S.tab; S.tab='evolucao'; }
  const g=groupOf(S.tab); S.lastIn=S.lastIn||{}; S.lastIn[g.id]=S.tab;
  const gbtn=(x,cls)=>`<button class="${cls}" data-act="grp" data-id="${x.id}" ${cls==='tab'?`role="tab" aria-selected="${x===g}"`:`aria-current="${x===g}"`}>${ICON[x.ic]}<span>${x.n}</span></button>`;
  $('#tabs').innerHTML = NAV.map(x=>gbtn(x,'tab')).join('');
  $('#bnav').innerHTML = NAV.map(x=>gbtn(x,'')).join('');
  $('#subtabs').innerHTML = (g.tabs.length>1? g.tabs.map(id=>`<button class="stab" data-act="tab" data-id="${id}" aria-selected="${S.tab===id}">${TABS.find(t=>t.id===id).n}</button>`).join('') : '')
;
  const hb=$('#helpBtn'); if(hb) hb.hidden=!HELP_BY_TAB[S.tab];
  const who=$('#whoName'); who.textContent = S.profile.nome || Store.meName || '';
  const st=$('#subtabs .stab[aria-selected="true"]'); st&&st.scrollIntoView({inline:'center',block:'nearest'});
  const fab=$('#fab'); if(fab) fab.hidden = !!S.active && S.tab==='treinar';
}
function go(tab){ if(tab==='rps'||tab==='period'){ S.evoSub=tab; tab='evolucao'; } S.tab=tab; S.animNext=true; try{localStorage.setItem('fx1:tab',tab)}catch(e){} renderTabs(); render(); window.scrollTo({top:0}); }
function render(){
  if(!S.profile) return;
  if(!TABS.some(t=>t.id===S.tab)) S.tab='hoje';
  if(S.tab==='rps'||S.tab==='period'){ S.evoSub=S.tab; S.tab='evolucao'; }
  Object.values(S.chart).forEach(c=>{try{c.destroy()}catch(e){}}); S.chart={};
  const v = !S.profile.onboarded ? (()=>`<div class="card" style="text-align:center;padding:48px 20px"><h2 style="margin:0 0 8px">Bem-vindo ao EVO</h2><p class="muted">Preencha seus dados para começar.</p><button class="btn primary" data-act="onboard">Preencher meus dados</button></div>`) : (VIEWS[S.tab] || VIEWS.hoje);
  $('#main').innerHTML = `<div class="view ${S.animNext?'enter':''}">${v()}</div>`; S.animNext=false;
  if(S.profile.onboarded) (AFTER[S.tab]||(()=>{}))();
  renderTimer();
}

/* ---------- componentes ---------- */
const chip = (t,cor,cls='')=>`<span class="chip ${cls}">${cor?`<i class="dot" style="background:${cor}"></i>`:''}${esc(t)}</span>`;
const stat = (v,unit,l)=>`<div class="stat"><div class="v num">${v}<small>${unit||''}</small></div><div class="l">${l}</div></div>`;
function macroBars(tg,got){
  const L=[['Proteína','p','--prot'],['Carboidrato','c','--carb'],['Gordura','g','--fat']];
  return `<div class="stack">${L.map(([n,k,c])=>{const pct=got?Math.min(100,(got[k]||0)/Math.max(1,tg[k])*100):100;return `<div class="macro-line"><b style="color:var(${c})">${n}</b><div class="bar"><i style="width:${pct}%;background:var(${c})"></i></div><span class="num small">${got?fmt(got[k])+' / ':''}${fmt(tg[k])} g</span></div>`}).join('')}</div>`;
}
function exampleBanner(){ return ''; }
function bottleHTML(pct){
  const v=Math.max(0,Math.min(100,pct||0)), R=54, C=2*Math.PI*R, len=v/100*C;
  return `<div class="wring" id="bottle" role="img" aria-label="${fmt(v)}% da meta de água">
    <svg viewBox="0 0 140 140"><circle class="wr-track" r="${R}" cx="70" cy="70"/><circle class="wr-arc ${pct>=100?'done':''}" r="${R}" cx="70" cy="70" transform="rotate(-90 70 70)" style="--len:${len.toFixed(1)};--c:${C.toFixed(1)}" stroke-dasharray="${len.toFixed(1)} ${C.toFixed(1)}"/></svg>
    <div class="wr-c"><span class="num">${fmt(Math.min(999,pct||0))}<small>%</small></span><em>da meta</em></div></div>`;
}
function splash(){}
function animateBottle(){}
function artThumb(id){ const e=exById(id); return window.FX_ART&&e&&FX_ART.has(id)?FX_ART.svg(id,e.grupo):''; }
function suggestTpl(){
  const r=dayRec(today()); const hoje=r? r.sessions.filter(x=>x.tplId&&!x.done&&(x.act==='musc'||x.act==='cross')).map(x=>tplById(x.tplId)).filter(Boolean):[];
  if(hoje[0]) return hoje[0];
  const R=S.cfg.rotation, last=allLogs().filter(l=>R.includes(l.tplId)).slice(-1)[0];
  return R.length? tplById(last? R[(R.indexOf(last.tplId)+1)%R.length] : R[S.cfg.rotIdx%R.length]) : S.tpl.find(t=>t.kind==='academia');
}
const QI={
  play:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  drop:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/></svg>',
  scale:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 10a3 3 0 0 1 6 0M12 10l1.5-2"/></svg>',
  plate:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg>',
  tape:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/></svg>',
  cal:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>'
};
function quickSheet(){
  const s=suggestTpl();
  const it=(act,ico,bg,label,sub)=>`<button data-act="${act}"><span class="ico" style="background:${bg}">${ico}</span><span>${label}</span>${sub?`<span class="small muted">${sub}</span>`:''}</button>`;
  modal(`<div class="modal-h"><h3>O que você quer registrar?</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
  <div class="sheet">${it('q-train',QI.play,'var(--accent)',S.active?'Voltar ao treino':'Iniciar treino',S.active?S.active.nome:(s?s.nome.split('—')[0].trim():''))}
  ${it('q-water',QI.drop,'var(--water)','Beber água','+'+S.cfg.water.copo+' ml')}
  ${it('q-peso',QI.scale,'var(--good)','Lançar peso','')}
  ${it('food-add" data-slot="'+slotNow()+'" data-date="'+today(),QI.plate,'var(--carb)','Lançar alimento','diário')}
  ${it('watch-new',QI.play,'var(--accent)','Treino do relógio','corrida, CrossFit…')}
  ${it('q-medidas',QI.tape,'var(--prot)','Cintura, FC e sono','')}
  ${it('q-sess',QI.cal,'#7A5AF5','Agendar treino','hoje')}</div>`);
}
function quickPeso(){
  const last=pesoEntries().slice(-1)[0];
  modal(`<div class="modal-h"><h3>Lançar peso de hoje</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
  <div class="quick-peso"><label class="f" style="flex:1">Peso (kg)<input type="number" id="pesoQuick" inputmode="decimal" step="0.1" placeholder="${last?fmt(last.peso,1):fmt(S.profile.peso,1)}" style="font-size:1.5rem;font-family:var(--f-mono)"></label></div>
  <p class="hint">${last?`Último: ${fmt(last.peso,1)} kg em ${dshort(last.date)}.`:'Primeiro registro.'} Pese-se ao acordar, depois do banheiro.</p>
  <button class="btn primary" data-act="peso-quick">Lançar</button>`);
  setTimeout(()=>{const e=$('#pesoQuick'); e&&e.focus();},50);
}
function ringSVG(pct,color,txt){
  const r=42, c=2*Math.PI*r, p=Math.max(0,Math.min(1,pct));
  return `<svg viewBox="0 0 100 100"><circle class="trk" cx="50" cy="50" r="${r}" fill="none" stroke-width="6"/><circle class="val" cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" transform="rotate(-90 50 50)" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${c.toFixed(1)}" data-off="${(c*(1-p)).toFixed(1)}"/><text x="50" y="55" text-anchor="middle" font-family="Outfit,Barlow Condensed,Arial" font-weight="400" font-size="19" fill="var(--ink)">${txt}</text></svg>`;
}
function animateRings(){ requestAnimationFrame(()=>requestAnimationFrame(()=>$$('.ring .val').forEach(el=>el.style.strokeDashoffset=el.dataset.off))); }
/* ---------- VIEWS ---------- */
const VIEWS = {}, AFTER = {};

VIEWS.hoje = ()=>{
  const d=today(), r=dayRec(d), dt=dtById(dayTypeOf(d)), tg=typeTarget(dt), pw=periodWeek(d);
  const sessions = r? r.sessions.slice().sort((a,b)=>(a.hora||'').localeCompare(b.hora||'')) : [];
  const water=(r&&r.water)||0, wg=waterGoal(d), got=mealsGot(d,dt), p=S.profile;
  const done=sessions.filter(x=>x.done).length, meals=S.cfg.meals[dt.id]||[], sel=(r&&r.meals)||{};
  const h=new Date().getHours(), saud=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  const last=pesoEntries().slice(-1)[0], prev=pesoEntries().slice(-2)[0];
  return `
  <div class="head"><div><h2 class="greet">${saud}${p.nome?`, <b>${esc(p.nome.split(' ')[0])}</b>`:''}</h2><div class="sub">${dlabel(d)} · ${chip(dt.nome,dt.cor)} ${pw&&pw.w?chip(`Semana ${pw.n}/${pw.total} · ${pw.w.fase}`,null,'pill-phase'):''}</div></div>
  ${p.parceiro?`<div class="chip">Acompanhado por <b>${esc(p.parceiro.nome)}</b>${p.parceiro.tipo?` · ${esc(p.parceiro.tipo)}`:''}</div>`:''}</div>
  ${exampleBanner()}
  <section class="card"><div class="rings">
    <button class="ring" data-act="go" data-id="${sessions.length?'agenda':'treinar'}">${ringSVG(sessions.length?done/sessions.length:0,'var(--accent)',sessions.length?`${done}/${sessions.length}`:'—')}<span class="rl">Treinos</span></button>
    <button class="ring" data-act="q-meal">${ringSVG(got.kcal/tg.kcal,'var(--carb)',fmt(got.kcal/tg.kcal*100)+'%')}<span class="rv num">${fmt(got.kcal)}</span><span class="rl">de ${fmt(tg.kcal)} kcal</span></button>
    <button class="ring" data-act="go" data-id="agua">${ringSVG(water/wg,'var(--water)',fmt(Math.min(999,water/wg*100))+'%')}<span class="rv num">${fmt(water/1000,1)} L</span><span class="rl">de ${fmt(wg/1000,1)} L</span></button>
  </div></section>
  <div class="today-hero">
    <section class="card"><div class="row between"><h3>Treinos de hoje</h3><button class="btn sm" data-act="add-sess" data-date="${d}">+ Adicionar</button></div>
      ${sessions.length? `<div class="stack">${sessions.map(x=>sessRow(d,x)).join('')}</div>`:`<div class="empty">Nada agendado para hoje.<div class="row"><button class="btn sm primary" data-act="q-train">Treinar agora</button><button class="btn sm" data-act="fill-week">Preencher a semana</button></div></div>`}
      ${pw&&pw.w?`<p class="hint"><b>${esc(pw.w.fase)}:</b> ${MODE_TXT[pw.w.mode]} · RIR ${esc(pw.w.rir)}${pw.w.reps?` · ${esc(pw.w.reps)}`:''}</p>`:''}
    </section>
    <section class="card" id="mealsToday"><div class="row between"><h3>Refeições de hoje</h3><div class="row" style="gap:6px"><button class="btn sm primary" data-act="food-add" data-slot="${slotNow()}" data-date="${d}">+ Alimento</button><button class="btn sm" data-act="go" data-id="dieta">Diário</button></div></div>
      ${meals.length?`<div>${meals.map(m=>{const s=sel[m.id]||{}; const op=m.ops[s.op||0]||m.ops[0]||{kcal:0};
        return `<div class="meal-row ${s.done?'done':''}"><button class="check" aria-pressed="${!!s.done}" data-act="meal-done" data-date="${d}" data-id="${m.id}" aria-label="Comi ${esc(m.nome)}">✓</button>
          <div style="flex:1;min-width:0"><div class="small"><span class="num muted">${esc(m.hora)}</span> <b class="mn">${esc(m.nome)}</b> <span class="muted num">· ${op.kcal} kcal</span></div>
          ${m.ops.length>1?`<select id="hm-${m.id}" data-bind="dmeal.op" data-date="${d}" data-id="${m.id}" aria-label="Opção de ${esc(m.nome)}">${m.ops.map((o,i)=>`<option value="${i}" ${(s.op||0)===i?'selected':''}>${esc(o.nome)}</option>`).join('')}</select>`:''}</div></div>`}).join('')}</div>`:(((dayRec(d)||{}).foods||[]).length?`<p class="small muted">${((dayRec(d)||{}).foods||[]).length} alimento(s) lançados no diário hoje.</p>`:`<div class="empty small">Lance o que comeu em <b>+ Alimento</b> ou carregue um cardápio base em Dieta.</div>`)}
      ${macroBars(tg,got)}
    </section>
  </div>
  <div class="grid g2">
    <section class="card"><div class="row between"><h3>Água</h3><button class="btn sm" data-act="go" data-id="agua">Detalhes</button></div>
      <div class="row" style="align-items:center;gap:14px;flex-wrap:nowrap">
        <div style="width:120px;flex:none">${bottleHTML(water/wg*100)}</div>
        <div class="stack" style="min-width:0"><span class="hint">Faltam <b>${fmt(Math.max(0,wg-water))} ml</b></span>
        <div class="water-btns"><button class="btn sm" data-act="water" data-ml="${S.cfg.water.copo}">+${S.cfg.water.copo} ml</button><button class="btn sm" data-act="water" data-ml="500">+500 ml</button></div></div></div>
    </section>
    <section class="card"><div class="row between"><h3>Peso</h3><button class="btn sm" data-act="go" data-id="progresso">Progresso</button></div>
      <div class="quick-peso">
        <div class="stack" style="min-width:0;flex:1">${last?stat(fmt(last.peso,1),' kg',`último · ${dshort(last.date)}`):'<span class="hint">Nenhum peso lançado ainda.</span>'}
        ${last&&prev&&prev!==last?`<span class="small" style="color:var(${isGood(weightCategory(last.peso-prev.peso))?'--good':'--bad'})">${last.peso-prev.peso>0?'+':''}${fmt(last.peso-prev.peso,1)} kg desde o anterior</span>`:''}
        <button class="btn sm primary" data-act="q-peso" style="justify-self:start">Lançar peso</button></div></div>
    </section>
  </div>
  ${calendarHTML()}
  <section class="card"><div class="row between"><h3>Semana</h3><span class="small muted">gasto × ingestão planejada (kcal)</span></div><div class="chart-box sm"><canvas id="chWeek"></canvas></div></section>`;
};
AFTER.hoje = ()=>{ animateRings(); chartWeek('chWeek', mondayOf(today())); calEnsure().then(ch=>{ if(ch && S.tab==='hoje') render(); }); };
function calRange(view,ref){
  view=view||S.calView; ref=ref||S.calRef||today();
  if(view==='semana'){ const ws=mondayOf(ref); return {days:Array.from({length:7},(_,i)=>addDays(ws,i)),title:`${dshort(ws)} a ${dshort(addDays(ws,6))}`,month:null}; }
  const d=pISO(ref); d.setDate(1); const first=iso(d), ws=mondayOf(first); const m=d.getMonth();
  const last=new Date(d.getFullYear(),m+1,0); const we=addDays(mondayOf(iso(last)),6);
  const n=daysBetween(ws,we)+1; return {days:Array.from({length:n},(_,i)=>addDays(ws,i)),title:`${['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][m]} ${d.getFullYear()}`,month:mk(first)};
}
async function calEnsure(view,ref){ const r=calRange(view,ref); const ms=[...new Set(r.days.map(mk))].filter(m=>!S.months[m]); if(!ms.length) return false; await Promise.all(ms.map(ensureMonth)); return true; }
function sessColor(x){ const t=x.tplId&&tplById(x.tplId); if(t&&t.cor) return t.cor; return ({cross:'#E8A812',tfm:'#17A2A2',corrida:'#17A2A2',caminhada:'#7DB24E',bike:'#7DB24E',natacao:'#2A8BE6',funcional:'#D9412F',marcha:'#8C6A43','des-flexoes':'#E0457B','des-barra':'#7A5AF5'})[x.act]||'#8C9CAC'; }
function calendarHTML(){
  S.calView=S.calView||'semana'; S.calRef=S.calRef||today();
  const R=calRange(), t=today();
  const cell=d=>calCell(d,R,S.calView==='semana','cal-day');
  return `<section class="card"><div class="row between"><h3>Calendário</h3>
    <div class="row"><div class="seg" role="group" aria-label="Visualização"><button aria-pressed="${S.calView==='semana'}" data-act="cal-view" data-id="semana">Semanal</button><button aria-pressed="${S.calView==='mes'}" data-act="cal-view" data-id="mes">Mensal</button></div></div></div>
    <div class="row between"><button class="btn icon" data-act="cal-nav" data-n="-1" aria-label="Anterior">‹</button><b class="cal-title">${R.title}</b><div class="row" style="gap:6px"><button class="btn sm" data-act="cal-nav" data-n="0">Hoje</button><button class="btn icon" data-act="cal-nav" data-n="1" aria-label="Próximo">›</button></div></div>
    <div class="cal ${S.calView==='semana'?'wk':'mo'}">${['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(x=>S.calView==='mes'?`<span class="cal-h">${x}</span>`:'').join('')}${R.days.map(cell).join('')}</div>
    <p class="small muted">Toque num dia para ver e planejar treinos e alimentação. A letra indica o tipo de dia (${S.cfg.dayTypes.map(x=>esc(x.id)).join(', ')}).</p></section>`;
}
function calCell(d,R,wk,act){
  const t=today();
  { const r=dayRec(d), ss=r?r.sessions.slice().sort((a,b)=>(a.hora||'').localeCompare(b.hora||'')):[], dt=dtById(dayTypeOf(d));
    const out=R.month&&mk(d)!==R.month, past=d<t, allDone=ss.length&&ss.every(x=>x.done);
    const meals=(S.cfg.meals[dt.id]||[]), mDone=r&&r.meals?meals.filter(m=>r.meals[m.id]&&r.meals[m.id].done).length:0;
    return `<button class="cal-cell ${d===t?'today':''} ${out?'out':''} ${past?'past':''} ${S.agDate===d&&act==='ag-day'?'sel':''}" data-act="${act}" data-date="${d}" aria-label="${dlabel(d)}: ${ss.length} treinos">
      <span class="cal-top">${wk?`<span class="cal-dow">${DOW[pISO(d).getDay()]}</span>`:''}<span class="cal-num">${pISO(d).getDate()}</span><span class="cal-dt" style="color:${dt.cor}">${esc(dt.id)}</span></span>
      ${wk? `<span class="cal-list">${ss.slice(0,4).map(x=>{const tp=x.tplId&&tplById(x.tplId);return `<span class="cal-ev ${x.done?'done':''}" style="--c:${sessColor(x)}">${esc(tp?tp.nome.split('—')[0].trim():actById(x.act).nome.split(' ')[0])}</span>`}).join('')}${ss.length>4?`<span class="small muted">+${ss.length-4}</span>`:''}</span>`
          : `<span class="cal-dots">${ss.slice(0,5).map(x=>`<i class="${x.done?'done':''}" style="--c:${sessColor(x)}"></i>`).join('')}</span>`}
      <span class="cal-foot">${allDone?'<span class="cal-ok">✓</span>':''}${meals.length&&mDone?`<span class="small muted">${mDone}/${meals.length} ref.</span>`:''}</span></button>`; }
}
function dayModal(d){
  S.dayOpen=d; const t=today(), pw=periodWeek(d);
  $('#modalRoot').innerHTML=`<div class="modal-bg" data-act="bg-close"><div class="modal wide" id="dayModal" role="dialog" aria-modal="true">
  <div class="modal-h"><div><h3>${dlabel(d)}${d===t?' · hoje':''}</h3>${pw&&pw.w?`<span class="small muted">Semana ${pw.n} da periodização · ${esc(pw.w.fase)} · ${MODE_TXT[pw.w.mode]}</span>`:''}</div><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
  ${dayPanel(d,'dm')}
  <div class="row"><button class="btn" data-act="dm-go" data-id="agenda" data-date="${d}">Abrir na Agenda</button><button class="btn" data-act="dm-go" data-id="dieta">Editar cardápios</button><span style="flex:1"></span><button class="btn primary" data-act="close">Pronto</button></div>
  </div></div>`;
}
function dayPanel(d,px){
  const r=dayRec(d), dt=dtById(dayTypeOf(d)), tg=typeTarget(dt), t=today();
  const ss=r?r.sessions.slice().sort((a,b)=>(a.hora||'').localeCompare(b.hora||'')):[];
  const meals=S.cfg.meals[dt.id]||[]; const sel=(r&&r.meals)||{};
  const plan=meals.reduce((s,m)=>{const op=m.ops[(sel[m.id]||{}).op||0]||{p:0,c:0,g:0,kcal:0};return {p:s.p+op.p,c:s.c+op.c,g:s.g+op.g,kcal:s.kcal+op.kcal}},{p:0,c:0,g:0,kcal:0});
  const got=mealsGot(d,dt), canTick=d<=t, water=(r&&r.water)||0, wg=waterGoal(d);
  const pw=periodWeek(d);
  return `
  <div class="row"><label class="f" style="min-width:200px">Tipo de dia<select id="${px}Type" data-bind="daytype" data-date="${d}">${S.cfg.dayTypes.map(x=>`<option value="${x.id}" ${x.id===dt.id?'selected':''}>${esc(x.nome)}</option>`).join('')}</select></label>
    <div class="row" style="gap:20px">${stat(fmt(tg.kcal),' kcal','meta')}${stat(fmt(dayExp(d)),' kcal','gasto estimado')}${stat(fmt(water/1000,1)+'/'+fmt(wg/1000,1),' L','água')}</div></div>
  <div class="grid g2">
   <section class="stack"><div class="row between"><h4>Treinos</h4><button class="btn sm" data-act="add-sess" data-date="${d}">+ Adicionar</button></div>
    ${ss.length?ss.map(x=>{const a=actById(x.act), tp=x.tplId?tplById(x.tplId):null; const exs=tp&&tp.kind==='academia'?tp.ex.map(e=>`${(exById(e.exId)||{nome:e.exId}).nome} ${adjSeries(e.series,e.prio,pw&&pw.w)}×${e.repMin}–${e.repMax}`):[];
      return `<div class="day-sess" style="--c:${sessColor(x)}"><div class="row between" style="flex-wrap:nowrap"><div style="min-width:0"><span class="num small muted">${esc(x.hora||'—')}</span> <b>${esc(tp?tp.nome:a.nome)}</b><div class="small muted">${esc(a.nome)} · ${x.min??a.min} min · ~${fmt(actKcal(x.act,x.min))} kcal${x.nota?' · '+esc(x.nota):''}</div></div>
        <div class="row" style="flex-wrap:nowrap;gap:6px">${(x.act==='musc'||x.act==='cross')&&!x.done&&d===t?`<button class="btn sm primary" data-act="start-from-sess" data-date="${d}" data-sid="${x.id}">Iniciar</button>`:''}<button class="btn icon sm" data-act="edit-sess" data-date="${d}" data-sid="${x.id}" aria-label="Editar">✎</button><button class="check" aria-pressed="${!!x.done}" data-act="toggle-sess" data-date="${d}" data-sid="${x.id}" aria-label="Feito">✓</button></div></div>
        ${exs.length?`<details><summary class="small" style="cursor:pointer">Ver ${exs.length} exercícios</summary><ol class="small" style="margin:6px 0 0;padding-left:20px">${exs.map(e=>`<li>${esc(e)}</li>`).join('')}</ol></details>`:''}
        ${tp&&tp.kind==='crossfit'&&tp.wod&&tp.wod.desc?`<div class="small" style="white-space:pre-wrap">${esc(tp.wod.desc)}</div>`:''}</div>`}).join('')
      :`<div class="empty small">Nenhum treino planejado.<button class="btn sm" data-act="dm-fill" data-date="${d}">Preencher esta semana com o padrão</button></div>`}
   </section>
   <section class="stack"><div class="row between"><h4>Alimentação</h4><span class="mm num small"><span class="p">P ${plan.p}</span> · <span class="c">C ${plan.c}</span> · <span class="g">G ${plan.g}</span> · ${fmt(plan.kcal)}/${fmt(tg.kcal)} kcal</span></div>
    ${meals.length?meals.map(m=>{const s=sel[m.id]||{}; const op=m.ops[s.op||0]||m.ops[0];
      return `<div class="day-meal"><div class="row" style="flex-wrap:nowrap;gap:8px">${canTick?`<button class="check" aria-pressed="${!!s.done}" data-act="meal-done" data-date="${d}" data-id="${m.id}" aria-label="Refeição feita">✓</button>`:''}
        <div style="flex:1;min-width:0"><div class="small"><span class="num muted">${esc(m.hora)}</span> <b>${esc(m.nome)}</b></div>
        ${m.ops.length>1?`<select id="${px}-${m.id}" data-bind="dmeal.op" data-date="${d}" data-id="${m.id}">${m.ops.map((o,i)=>`<option value="${i}" ${(s.op||0)===i?'selected':''}>${esc(o.nome)} · ${o.kcal} kcal</option>`).join('')}</select>`:`<div class="small">${esc(op?op.nome:'')}</div>`}
        ${op?`<div class="small muted">${op.itens.map(esc).join(' · ')}</div>`:''}</div></div></div>`}).join('')
      :`<div class="empty small">Sem cardápio para este tipo de dia. Monte na aba Dieta.</div>`}
    ${canTick?macroBars(tg,got):''}
   </section></div>`;
}
function sessRow(d,x){
  const a=actById(x.act), t=x.tplId?tplById(x.tplId):null;
  const canStart = (x.act==='musc'||x.act==='cross') && !x.done;
  return `<div class="sess ${x.done?'done':''}"><span class="hr">${esc(x.hora||'—')}</span>
    <div class="grow" style="flex:1;min-width:0"><div class="t">${esc(t?t.nome:a.nome)}</div><div class="small muted">${esc(a.nome)} · ${x.min??a.min} min · ~${fmt(actKcal(x.act,x.min))} kcal</div></div>
    ${canStart?`<button class="btn sm primary" data-act="start-from-sess" data-date="${d}" data-sid="${x.id}">Iniciar</button>`:''}
    <button class="check" aria-label="Marcar como feito" aria-pressed="${!!x.done}" data-act="toggle-sess" data-date="${d}" data-sid="${x.id}">✓</button></div>`;
}

/* ----- Treinar ----- */
VIEWS.treinar = ()=>{
  if(S.active) return activeView();
  const d=today(), r=dayRec(d), pw=periodWeek(d);
  if(!S.tpl.length) return `<div class="head"><div><h2>Treinar</h2></div></div><div class="empty">Você ainda não tem fichas de treino.<div class="row"><button class="btn primary" data-act="tpl-restore">Carregar as fichas do plano (Push/Pull/Legs)</button><button class="btn" data-act="go" data-id="montar">Montar a minha</button><button class="btn" data-act="start-free">Treino livre</button><button class="btn" data-act="ocr-start">Treino por foto</button><button class="btn" data-act="watch-new">Lançar treino do relógio</button></div></div>${allLogs().length?`<section class="card"><h3>Histórico</h3><div class="list">${allLogs().slice(-15).reverse().map(l=>`<div class="it"><span class="swatch" style="background:var(--accent)"></span><div class="grow"><div class="t">${esc(l.nome)}</div><div class="small muted">${dlabel(l.date)} · ${l.durMin||'—'} min${l.watch?' · '+watchLine(l):''}</div></div><button class="btn sm" data-act="view-log" data-id="${l.id}">Ver</button></div>`).join('')}</div></section>`:''}`;
  const hoje = r? r.sessions.filter(x=>x.tplId && !x.done && (x.act==='musc'||x.act==='cross')).map(x=>tplById(x.tplId)).filter(Boolean):[];
  const R=S.cfg.rotation, lastRot=allLogs().filter(l=>R.includes(l.tplId)).slice(-1)[0];
  const rot=R.length? tplById(lastRot? R[(R.indexOf(lastRot.tplId)+1)%R.length] : R[S.cfg.rotIdx%R.length]) : null;
  const sug = hoje[0] || rot || S.tpl.find(t=>t.kind==='academia');
  const logs = allLogs(), ws=mondayOf(d);
  const wk=logs.filter(l=>l.date>=ws&&l.date<=addDays(ws,6));
  const wkSets=wk.reduce((s,l)=>s+(l.ex||[]).reduce((a,e)=>a+e.sets.length,0),0), wkVol=wk.reduce((s,l)=>s+(l.vol||0),0);
  const last=logs[logs.length-1];
  const prs=recentPRs(30);
  return `<div class="head"><div><h2>Treinar</h2><div class="sub">Escolha a ficha e registre carga, repetições e RIR de cada série.</div></div><div class="row" style="gap:8px"><button class="btn primary" data-act="ocr-start">Treino por foto</button><button class="btn" data-act="watch-new">Lançar treino do relógio</button><button class="btn" data-act="start-free">+ Treino livre</button></div></div>
  ${sug?`<section class="card hero-train" style="--c:${sug.cor||'var(--accent)'}"><div class="ht-top"><div class="stack" style="gap:4px;min-width:0"><span class="small muted">${hoje.length?'Agendado para hoje':'Sugestão: próxima ficha da rotação'}</span><h3 style="font-size:1.6rem">${esc(sug.nome)}</h3><span class="small muted">${esc(sug.foco||'')}</span>
      ${pw&&pw.w?chip(`Semana ${pw.n} · ${pw.w.fase} · ${MODE_TXT[pw.w.mode]} · RIR ${pw.w.rir}`,null,'pill-phase'):''}</div>
      <button class="btn primary ht-go" data-act="start-tpl" data-id="${sug.id}">Iniciar treino</button></div>
    <div class="ht-map">${mapHTML(musclesTpl(sug),'sm')}</div>
    ${sug.kind==='academia'?`<div class="ht-list">${sug.ex.map(e=>{const x=exById(e.exId)||{nome:e.exId}; const sg=suggestFor(e); return `<button class="ht-ex" data-act="ex-info" data-id="${e.exId}"><span class="lib-thumb">${artThumb(e.exId)}</span><span class="stack" style="gap:1px;min-width:0"><b class="small">${esc(x.nome)}</b><span class="small muted">${adjSeries(e.series,e.prio,pw&&pw.w)}× ${e.repMin}–${e.repMax} · RIR ${esc(e.rir)}${sg?` · última ${fmt(sg.kg,1)} kg`:''}</span></span></button>`}).join('')}</div>`:`<p class="small muted">${esc((sug.wod&&sug.wod.desc)||'Registre o WOD do quadro, o formato e o resultado.')}</p>`}
    ${hoje.length>1?`<div class="row">${hoje.slice(1).map(t=>`<button class="btn sm" data-act="start-tpl" data-id="${t.id}">Também hoje: ${esc(t.nome)}</button>`).join('')}</div>`:''}</section>`:''}
  <div class="grid stats-grid">
    <div class="card">${stat(wk.length,'','treinos nesta semana')}</div>
    <div class="card">${stat(wkSets,'','séries na semana')}</div>
    <div class="card">${stat(fmt(wkVol),' kg','volume na semana')}</div>
    <div class="card">${stat(last?daysBetween(last.date,d):'—',last?(daysBetween(last.date,d)===1?' dia':' dias'):'','desde o último treino')}</div>
  </div>
  <section class="card"><div class="row between"><h3>Suas fichas</h3><button class="btn sm" data-act="go" data-id="montar">Editar fichas</button></div>
    <div class="grid g3">${S.tpl.map(t=>tplCard(t)).join('')}</div></section>
  <div class="grid g2">
    <section class="card"><h3>Volume semanal</h3>${logs.length?`<div class="chart-box sm"><canvas id="chVolW"></canvas></div><p class="small muted">Soma de carga × repetições de todas as séries, por semana.</p>`:`<div class="empty small">Conclua um treino para ver o gráfico.</div>`}</section>
    <section class="card"><div class="row between"><h3>Recordes recentes</h3><button class="btn sm" data-act="go" data-id="rps">RPs</button></div>${prs.length?`<div class="list">${prs.slice(0,6).map(p=>`<div class="it"><span class="lib-thumb">${artThumb(p.exId)}</span><div class="grow"><div class="t small">${esc(p.nome)}</div><div class="small muted">${dshort(p.date)} · ${fmt(p.kg,1)} kg × ${p.reps}</div></div><b class="num">${fmt(p.e1,1)} kg</b></div>`).join('')}</div><p class="small muted">1RM estimado (Epley) — últimos 30 dias.</p>`:`<div class="empty small">Seus recordes de carga aparecem aqui conforme você treina.</div>`}</section>
  </div>
  <section class="card"><h3>Histórico</h3>${logs.length?`<div class="list">${logs.slice(-15).reverse().map(l=>`<div class="it"><span class="swatch" style="background:${(tplById(l.tplId)||{}).cor||'var(--accent)'}"></span><div class="grow"><div class="t">${esc(l.nome)}</div><div class="small muted">${dlabel(l.date)} · ${l.durMin||'—'} min · ${l.watch?watchLine(l):l.kind==='crossfit'&&l.wod?esc(l.wod.resultado||'WOD'):`${(l.ex||[]).reduce((a,e)=>a+e.sets.length,0)} séries · ${fmt(l.vol||0)} kg`}</div></div><button class="btn sm" data-act="view-log" data-id="${l.id}">Ver</button></div>`).join('')}</div>`:`<div class="empty">Nenhum treino registrado ainda. Toque em <b>Iniciar treino</b> acima para começar.</div>`}</section>`;
};
function recentPRs(days){
  const from=addDays(today(),-days), best={}, out=[];
  for(const l of allLogs()){ for(const e of l.ex||[]){ for(const s of e.sets){ const v=e1rm(num(s.kg),num(s.reps)); if(!v) continue; const b=best[e.exId]||0;
    if(v>b){ if(b>0 && l.date>=from) out.push({exId:e.exId,nome:e.nome,date:l.date,kg:num(s.kg),reps:num(s.reps),e1:v}); best[e.exId]=v; } } } }
  const seen=new Set(); return out.reverse().filter(p=>!seen.has(p.exId)&&seen.add(p.exId));
}
function musclesTpl(t){ if(!window.FX_MAP||!t) return {p:[],s:[]}; if(t.kind==='crossfit') return FX_MAP.forActivity('cross'); return FX_MAP.merge(t.ex.map(e=>FX_MAP.forExercise(exById(e.exId)))); }
function musclesLog(l){ if(!window.FX_MAP||!l) return {p:[],s:[]}; if(l.watch) return FX_MAP.forActivity(l.act); if(l.kind==='crossfit'&&!(l.ex||[]).length) return FX_MAP.forActivity('cross'); return FX_MAP.merge((l.ex||[]).map(e=>FX_MAP.forExercise(exById(e.exId)))); }
function mapHTML(sel,size,legend){ return window.FX_MAP? FX_MAP.svg(sel,{size,legend}) : ''; }
function tplCard(t,primary){
  const n=t.ex.length, sets=t.ex.reduce((s,e)=>s+e.series,0);
  const lastL=allLogs().filter(l=>l.tplId===t.id).slice(-1)[0];
  return `<div class="card flat tpl-card" style="border-left:5px solid ${t.cor||'var(--accent)'}"><div class="tc-top"><div><div class="t" style="font-weight:700;font-size:1.05rem">${esc(t.nome)}</div><div class="small muted">${esc(t.foco||'')}</div></div>${(t.ex.length||t.kind==='crossfit')?mapHTML(musclesTpl(t),'xs',false):''}</div>
    ${t.kind==='academia'&&n?`<div class="tpl-thumbs">${t.ex.slice(0,5).map(e=>`<span class="lib-thumb" title="${esc((exById(e.exId)||{}).nome||'')}">${artThumb(e.exId)}</span>`).join('')}${n>5?`<span class="small muted">+${n-5}</span>`:''}</div>`:''}
    <div class="small muted">${t.kind==='crossfit'?'WOD + força opcional':`${n} exercícios · ${sets} séries`} · ${lastL?`último: ${dshort(lastL.date)}`:'ainda não feito'}</div>
    <button class="btn ${primary?'primary':''}" data-act="start-tpl" data-id="${t.id}">Iniciar</button></div>`;
}
function startSession(tplId,sessRef){
  const t=tplId?tplById(tplId):null, pw=periodWeek(today());
  S.active = {id:uid(),date:today(),tplId:t?t.id:null,nome:t?t.nome:'Treino livre',kind:t?t.kind:'academia',start:Date.now(),sess:sessRef||null,
    week:pw&&pw.w?{n:pw.n,fase:pw.w.fase,mode:pw.w.mode}:null,
    wod: t&&t.kind==='crossfit'?Object.assign({formato:'For time',desc:'',cap:'',resultado:'',rx:true},clone(t.wod||{})):null,
    ex:(t?t.ex:[]).map(e=>newActiveEx(e,pw&&pw.w))};
  persistActive(); go('treinar');
}
function newActiveEx(e,w){
  const ex=exById(e.exId)||{nome:e.nome||e.exId}; const n=adjSeries(e.series,e.prio,w); const sg=suggestFor(e);
  return {exId:e.exId,nome:ex.nome,series:n,repMin:e.repMin,repMax:e.repMax,rir:e.rir,desc:e.desc,nota:e.nota||'',prio:e.prio,
    sets:Array.from({length:n},()=>({kg:sg?String(sg.next):'',reps:'',rir:'',ok:false}))};
}
function persistActive(){ try{localStorage.setItem(Store.key('active'),JSON.stringify(S.active))}catch(e){} if(Store.mode==='cloud') Store.save('active',S.active||{}); }
function activeView(){
  const a=S.active, el=Math.floor((Date.now()-a.start)/60000);
  const done=a.ex.reduce((s,e)=>s+e.sets.filter(x=>x.ok).length,0), tot=a.ex.reduce((s,e)=>s+e.sets.length,0);
  return `<div class="head"><div><h2>${esc(a.nome)}</h2><div class="sub">${dlabel(a.date)} · ${el} min · ${done}/${tot} séries ${a.week?` · ${chip('Sem. '+a.week.n+' · '+a.week.fase,null,'pill-phase')}`:''}</div></div>
    <div class="row"><button class="btn danger" data-act="cancel-session">Descartar</button><button class="btn primary" data-act="finish-session">Concluir treino</button></div></div>
  ${a.wod?`<section class="card"><h3>WOD</h3><div class="fgrid"><label class="f">Formato<select id="wodFmt" data-bind="wod.formato">${['For time','AMRAP','EMOM','Rounds for time','Chipper','Intervalado','Força'].map(o=>`<option ${a.wod.formato===o?'selected':''}>${o}</option>`).join('')}</select></label>
    <label class="f">Time cap / duração<input type="text" id="wodCap" data-bind="wod.cap" value="${esc(a.wod.cap)}" placeholder="ex.: 12 min"></label>
    <label class="f">Resultado<input type="text" id="wodRes" data-bind="wod.resultado" value="${esc(a.wod.resultado)}" placeholder="ex.: 8:45 ou 6 rounds + 4"></label>
    <label class="f">Escala<select id="wodRx" data-bind="wod.rx"><option value="true" ${a.wod.rx?'selected':''}>RX</option><option value="false" ${!a.wod.rx?'selected':''}>Adaptado</option></select></label></div>
    <label class="f">Descrição do WOD<textarea id="wodDesc" data-bind="wod.desc" placeholder="Cole o treino do quadro">${esc(a.wod.desc)}</textarea></label></section>`:''}
  ${a.ex.map((e,i)=>activeEx(e,i)).join('')}
  <div class="row"><button class="btn" data-act="pick-ex" data-mode="active">+ Adicionar exercício</button></div>`;
}
function activeEx(e,i){
  const lib=exById(e.exId)||{}, sg=suggestFor(e), img=S.lib.imgs&&S.lib.imgs[e.exId];
  return `<section class="exc" data-ei="${i}"><div class="exc-h">
    <button class="thumb" data-act="ex-info" data-id="${e.exId}" aria-label="Ver execução">${img&&S.imgs[e.exId]?`<img src="${S.imgs[e.exId]}" alt="">`:(artThumb(e.exId)||(D.G[lib.grupo]||{n:'EX'}).n.slice(0,3).toUpperCase())}</button>
    <div class="meta"><div class="t">${esc(e.nome)}</div>
      <div class="small muted">${e.series}× ${e.repMin}–${e.repMax} reps · RIR ${esc(e.rir)} · descanso ${e.desc}s</div>
      ${sg?`<div class="small muted">Última (${dshort(sg.last.date)}): <span class="num">${sg.text}</span></div><div class="suggest">${sg.hit?`Bateu o topo da faixa: suba para ${fmt(sg.next,1)} kg`:`Mantenha ${fmt(sg.kg,1)} kg e busque ${e.repMax} reps`}</div>`:''}
      ${e.nota?`<div class="small">${esc(e.nota)}</div>`:''}</div>
    <div class="row" style="flex-direction:column;gap:4px"><button class="btn icon sm" data-act="ex-up" data-i="${i}" aria-label="Subir">↑</button><button class="btn icon sm" data-act="ex-del" data-i="${i}" aria-label="Remover">✕</button></div></div>
  <div class="sets"><div class="set hd"><span>#</span><span>Carga (kg)</span><span>Reps</span><span>RIR</span><span></span></div>
  ${e.sets.map((s,j)=>`<div class="set ${s.ok?'ok':''}"><span class="idx">${j+1}</span>
    <input type="number" inputmode="decimal" step="0.5" id="kg-${i}-${j}" data-bind="set.kg" data-i="${i}" data-j="${j}" value="${esc(s.kg)}" aria-label="Carga série ${j+1}">
    <input type="number" inputmode="numeric" id="rp-${i}-${j}" data-bind="set.reps" data-i="${i}" data-j="${j}" value="${esc(s.reps)}" placeholder="${e.repMin}–${e.repMax}" aria-label="Repetições série ${j+1}">
    <select id="ri-${i}-${j}" data-bind="set.rir" data-i="${i}" data-j="${j}" aria-label="RIR série ${j+1}">${['','0','1','2','3','4','5+'].map(o=>`<option ${s.rir===o?'selected':''}>${o}</option>`).join('')}</select>
    <button class="check" aria-pressed="${s.ok}" data-act="set-ok" data-i="${i}" data-j="${j}" aria-label="Série feita">✓</button></div>`).join('')}
  <div class="row" style="padding:6px 4px 0"><button class="btn ghost sm" data-act="set-add" data-i="${i}">+ série</button>${e.sets.length>1?`<button class="btn ghost sm" data-act="set-del" data-i="${i}">− série</button>`:''}</div></div></section>`;
}
let timerInt=null;
function startRest(sec){ S.rest={end:Date.now()+sec*1000,total:sec}; renderTimer(); }
function renderTimer(){
  const el=$('#timer'); clearInterval(timerInt);
  if(!S.rest || !((S.tab==='treinar'&&S.active)||S.tab==='desafios')){ el.hidden=true; return; }
  el.hidden=false;
  const tick=()=>{ const left=Math.max(0,Math.round((S.rest.end-Date.now())/1000)); const m=Math.floor(left/60), s=left%60;
    el.innerHTML=`<div class="timer-in"><span>Descanso</span><span class="clock">${m}:${String(s).padStart(2,'0')}</span><span class="small" style="flex:1">${left===0?'Bora para a próxima série!':''}</span><button class="btn sm" data-act="rest-add">+15 s</button><button class="btn sm" data-act="rest-stop">Fechar</button></div>`;
    if(left===0){ clearInterval(timerInt); try{S.profile.ui.vibrar&&navigator.vibrate&&navigator.vibrate(300)}catch(e){} } };
  tick(); timerInt=setInterval(tick,1000);
}
async function finishSession(){
  const a=S.active; const ex=a.ex.map(e=>({exId:e.exId,nome:e.nome,sets:e.sets.filter(s=>s.ok||num(s.reps)>0).map(s=>({kg:num(s.kg),reps:num(s.reps),rir:s.rir}))})).filter(e=>e.sets.length);
  const vol=ex.reduce((t,e)=>t+e.sets.reduce((s,x)=>s+x.kg*x.reps,0),0);
  const before={}; ex.forEach(e=>{const h=exHistory(e.exId); before[e.exId]=h.length?Math.max(...h.map(x=>x.best)):0;});
  const log={id:a.id,date:a.date,tplId:a.tplId,nome:a.nome,kind:a.kind,durMin:Math.max(1,Math.round((Date.now()-a.start)/60000)),end:Date.now(),ex,vol:Math.round(vol),wod:a.wod,week:a.week};
  const m=mk(a.date); await loadLogs(m); S.logs[m].sessions.push(log);
  if(!S.meta.logMonths.includes(m)){ S.meta.logMonths.push(m); save('meta'); }
  Store.save('lg-'+m,S.logs[m]);
  // marca a sessão da agenda
  await ensureMonth(m); const r=dayRec(a.date,true);
  let s = a.sess? r.sessions.find(x=>x.id===a.sess):null;
  if(!s) s=r.sessions.find(x=>!x.done && x.tplId && x.tplId===a.tplId) || r.sessions.find(x=>!x.done && x.act===(a.kind==='crossfit'?'cross':'musc'));
  if(s){ s.done=true; s.logId=log.id; } else r.sessions.push({id:uid(),act:a.kind==='crossfit'?'cross':'musc',hora:new Date(a.start).toTimeString().slice(0,5),min:log.durMin,tplId:a.tplId,done:true,logId:log.id});
  saveMonth(a.date);
  const prs=ex.map(e=>{const b=Math.max(...e.sets.map(x=>e1rm(x.kg,x.reps)));return b>before[e.exId]&&before[e.exId]>0?`${e.nome}: 1RM est. ${fmt(b,1)} kg`:null}).filter(Boolean);
  S.active=null; S.rest=null; persistActive();
  go('treinar');
  modal(`<div class="modal-h"><h3>Treino salvo</h3></div><div class="row" style="gap:24px">${stat(log.durMin,' min','duração')}${stat(fmt(log.vol),' kg','volume total')}${stat(ex.reduce((s,e)=>s+e.sets.length,0),'','séries')}</div>
    ${prs.length?`<div class="note"><b>Novos recordes:</b><br>${prs.map(esc).join('<br>')}</div>`:''}<button class="btn primary" data-act="close">Fechar</button>`);
}

AFTER.treinar = ()=>{
  if(!S.active){ chartVolWeeks('chVolW'); return; } const need=S.active.ex.map(e=>e.exId).filter(id=>S.lib.imgs&&S.lib.imgs[id]&&!(id in S.imgs));
  if(need.length) Promise.all(need.map(id=>Store.load('img-'+id).then(v=>{ if(v) S.imgs[id]=v; else S.imgs[id]=''; }))).then(()=>{ if(S.tab==='treinar') render(); });
};
/* ----- Montar treino ----- */
VIEWS.montar = ()=>{
  const sel = S.montarSel && tplById(S.montarSel);
  return `<div class="head"><div><h2>Montar treino</h2><div class="sub">Crie fichas, troque exercícios e defina séries, faixa de repetições, RIR e descanso.</div></div><div class="row" style="gap:8px"><button class="btn" data-act="ocr-start">Treino por foto</button><button class="btn primary" data-act="tpl-new">+ Nova ficha</button></div></div>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))">
    ${S.tpl.map(t=>`<button class="card flat" style="text-align:left;cursor:pointer;border-left:5px solid ${t.cor};${sel&&sel.id===t.id?'box-shadow:0 0 0 2px var(--accent)':''}" data-act="tpl-sel" data-id="${t.id}"><b>${esc(t.nome)}</b><span class="small muted">${t.kind==='crossfit'?'CrossFit':`${t.ex.length} exercícios · ${t.ex.reduce((s,e)=>s+e.series,0)} séries`}</span></button>`).join('')}
  </div>
  ${sel?`<section class="card"><div class="row between"><h3>Músculos trabalhados — ${esc(sel.nome)}</h3><span class="small muted">atualiza ao mudar os exercícios</span></div>${mapHTML(musclesTpl(sel),'md')}</section>`+tplEditor(sel):`<div class="empty">Toque numa ficha para editar.</div>`}
  <section class="card"><div class="row between"><h3>Rotação automática da academia</h3><span class="small muted">usada para preencher a agenda</span></div>
    <p class="small muted">Ordem das fichas que se repetem nos dias de musculação (ex.: Push → Pull → Legs). Na segunda você continua de onde parou.</p>
    <div class="row">${S.cfg.rotation.map((id,i)=>{const t=tplById(id);return t?`${chip(t.nome,t.cor)}<button class="btn icon sm" data-act="rot-del" data-i="${i}" aria-label="Remover da rotação">✕</button>`:''}).join('<span class="muted">→</span>')}
    <select id="rotAdd" style="width:auto"><option value="">+ adicionar ficha</option>${S.tpl.filter(t=>t.kind==='academia').map(t=>`<option value="${t.id}">${esc(t.nome)}</option>`).join('')}</select></div>
    <p class="small">Próxima na rotação: <b>${esc((tplById(S.cfg.rotation[S.cfg.rotIdx%Math.max(1,S.cfg.rotation.length)])||{nome:'—'}).nome)}</b></p></section>
  <section class="card"><div class="row between"><h3>Séries por grupo muscular na semana</h3>${chip(D.VOLUME_NIVEL[S.profile.nivel].n+' · '+D.VOLUME_NIVEL[S.profile.nivel].faixa)}</div>
    <p class="small muted">Calculado pela agenda desta semana (ou pela rotação, se a semana estiver vazia). A Enciclopédia recomenda até 12 séries/grupo para iniciantes, até 24 para intermediários e 30–35 para avançados; o plano de recomposição trabalha em 10–20.</p>
    <div class="chart-box"><canvas id="chVol"></canvas></div></section>
  <section class="card"><div class="row between"><h3>Biblioteca de exercícios</h3><button class="btn sm" data-act="ex-custom">+ Criar exercício</button></div>
    <div class="row"><input type="search" id="libSearch" placeholder="Buscar exercício" style="max-width:320px"><select id="libGroup" style="width:auto"><option value="">Todos os grupos</option>${Object.entries(D.G).map(([k,g])=>`<option value="${k}">${g.n}</option>`).join('')}</select></div>
    <div id="libList" class="list"></div></section>`;
};
AFTER.montar = ()=>{ chartVolume('chVol'); renderLib(); };
function renderLib(){
  const q=($('#libSearch')||{}).value||'', g=($('#libGroup')||{}).value||'';
  const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const L=allEx().filter(e=>(!g||e.grupo===g)&&(!q||norm(e.nome).includes(norm(q))));
  const el=$('#libList'); if(!el) return;
  el.innerHTML = L.map(e=>`<div class="it"><button class="lib-thumb" data-act="ex-info" data-id="${e.id}" aria-label="Ver execução de ${esc(e.nome)}">${artThumb(e.id)||'<span class="small muted">—</span>'}</button><div class="grow"><div class="t">${esc(e.nome)} ${S.lib.imgs&&S.lib.imgs[e.id]?'<span class="chip">com imagem</span>':''}</div><div class="small muted">${esc((D.G[e.grupo]||{}).n||e.grupo)} · ${esc(e.musc||'')}</div></div><button class="btn sm" data-act="ex-info" data-id="${e.id}">Execução</button></div>`).join('') || '<div class="empty">Nenhum exercício encontrado.</div>';
}
function tplEditor(t){
  return `<section class="card"><div class="row between"><h3>Editando: ${esc(t.nome)}</h3><div class="row"><button class="btn sm" data-act="tpl-dup" data-id="${t.id}">Duplicar</button><button class="btn sm danger" data-act="tpl-del" data-id="${t.id}">Excluir</button></div></div>
  <div class="fgrid"><label class="f">Nome<input type="text" id="tplNome" data-bind="tpl.nome" value="${esc(t.nome)}"></label>
    <label class="f">Foco<input type="text" id="tplFoco" data-bind="tpl.foco" value="${esc(t.foco||'')}"></label>
    <label class="f">Tipo<select id="tplKind" data-bind="tpl.kind"><option value="academia" ${t.kind==='academia'?'selected':''}>Academia</option><option value="crossfit" ${t.kind==='crossfit'?'selected':''}>CrossFit</option></select></label>
    <label class="f">Cor<input type="color" id="tplCor" data-bind="tpl.cor" value="${esc(t.cor||'#1F6FD1')}" style="min-height:40px;width:100%;border:1px solid var(--line);border-radius:9px;background:var(--surface-2)"></label></div>
  ${t.kind==='crossfit'?`<label class="f">WOD padrão (opcional)<textarea id="tplWod" data-bind="tpl.wod">${esc((t.wod&&t.wod.desc)||'')}</textarea></label>`:''}
  <div>${t.ex.map((e,i)=>{const x=exById(e.exId)||{nome:e.exId};return `<div class="tex"><div class="nm"><div style="font-weight:600">${i+1}. ${esc(x.nome)}</div><label class="small muted"><input type="checkbox" id="prio-${i}" data-bind="tex.prio" data-i="${i}" ${e.prio?'checked':''}> prioritário</label></div>
    <label class="f">Séries<input type="number" id="te-s-${i}" data-bind="tex.series" data-i="${i}" value="${e.series}" min="1"></label>
    <label class="f">Reps mín–máx<span class="row" style="flex-wrap:nowrap;gap:4px"><input type="number" id="te-a-${i}" data-bind="tex.repMin" data-i="${i}" value="${e.repMin}"><input type="number" id="te-b-${i}" data-bind="tex.repMax" data-i="${i}" value="${e.repMax}"></span></label>
    <label class="f">RIR<input type="text" id="te-r-${i}" data-bind="tex.rir" data-i="${i}" value="${esc(e.rir)}"></label>
    <label class="f">Descanso (s)<input type="number" id="te-d-${i}" data-bind="tex.desc" data-i="${i}" value="${e.desc}"></label>
    <div class="row acts" style="flex-wrap:nowrap;gap:4px"><button class="btn icon sm" data-act="tex-swap" data-i="${i}" aria-label="Trocar exercício" title="Trocar">⇄</button><button class="btn icon sm" data-act="tex-up" data-i="${i}" aria-label="Subir">↑</button><button class="btn icon sm" data-act="tex-del" data-i="${i}" aria-label="Remover">✕</button></div></div>`}).join('')}</div>
  <div class="row"><button class="btn" data-act="pick-ex" data-mode="tpl">+ Adicionar exercício</button><span class="small muted">Total: ${t.ex.reduce((s,e)=>s+e.series,0)} séries · ~${Math.round(t.ex.reduce((s,e)=>s+e.series*(e.desc+40),0)/60)} min</span></div></section>`;
}

/* ----- Agenda ----- */
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function agHead(title,sub){
  const v=S.agView||'semana';
  return `<div class="head"><div><h2>Agenda</h2><div class="sub">${sub||''}</div></div>
    <div class="seg" role="group" aria-label="Visualização">${[['dia','Diário'],['semana','Semanal'],['mes','Mensal']].map(([k,n])=>`<button aria-pressed="${v===k}" data-act="ag-view" data-id="${k}">${n}</button>`).join('')}</div></div>
  <div class="row between"><button class="btn icon" data-act="ag-nav" data-n="-1" aria-label="Anterior">‹</button><b class="cal-title">${title}</b><div class="row" style="gap:6px"><button class="btn sm" data-act="ag-nav" data-n="0">Hoje</button><button class="btn icon" data-act="ag-nav" data-n="1" aria-label="Próximo">›</button></div></div>`;
}
VIEWS.agenda = ()=>{
  const v=S.agView||'semana';
  if(v==='dia') return agendaDia();
  if(v==='mes') return agendaMes();
  return agendaSemana();
};
function agendaDia(){
  const d=S.agDate=S.agDate||today(), t=today(), pw=periodWeek(d);
  return agHead(dlabel(d)+(d===t?' · hoje':''),pw&&pw.w?chip(`Semana ${pw.n} · ${pw.w.fase} · ${MODE_TXT[pw.w.mode]}`,null,'pill-phase'):'')+
  `<div class="day-strip">${Array.from({length:7},(_,i)=>addDays(mondayOf(d),i)).map(x=>{const r=dayRec(x), n=r?r.sessions.length:0;return `<button class="ds ${x===d?'sel':''} ${x===t?'today':''}" data-act="ag-day" data-date="${x}"><span>${DOW[pISO(x).getDay()]}</span><b class="num">${pISO(x).getDate()}</b><i>${'•'.repeat(Math.min(n,4))||'&nbsp;'}</i></button>`}).join('')}</div>
  <section class="card">${dayPanel(d,'ag')}</section>`;
}
function agendaMes(){
  const ref=S.agMonth=S.agMonth||today(), R=calRange('mes',ref);
  const inMonth=R.days.filter(d=>mk(d)===R.month);
  let plan=0, done=0, kcalE=0, kcalI=0;
  inMonth.forEach(d=>{const r=dayRec(d); if(r){plan+=r.sessions.length; done+=r.sessions.filter(x=>x.done).length;} kcalE+=dayExp(d); kcalI+=typeTarget(dtById(dayTypeOf(d))).kcal;});
  return agHead(R.title,'Toque num dia para abrir o planejamento diário.')+
  `<section class="card"><div class="cal mo ag-mo">${['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(x=>`<span class="cal-h">${x}</span>`).join('')}${R.days.map(d=>calCell(d,R,false,'ag-day')).join('')}</div>
   <div class="art-legend">${S.tpl.map(t=>`<span><i style="background:${t.cor}"></i>${esc(t.nome.split('—')[0].trim())}</span>`).join('')}<span><i style="background:#17A2A2"></i>Corrida</span></div></section>
  <div class="grid g3"><div class="card">${stat(done+'/'+plan,'','treinos feitos / planejados')}</div><div class="card">${stat(fmt(kcalE/inMonth.length),' kcal/dia','gasto médio no mês')}</div><div class="card">${stat(fmt(kcalI/inMonth.length),' kcal/dia','ingestão média planejada')}</div></div>`;
}
function agendaSemana(){
  const ws=S.weekStart, days=Array.from({length:7},(_,i)=>addDays(ws,i)), t=today();
  const pw=periodWeek(ws);
  const exps=days.map(d=>dayExp(d)), tgs=days.map(d=>typeTarget(dtById(dayTypeOf(d))).kcal);
  const avgE=exps.reduce((a,b)=>a+b,0)/7, avgI=tgs.reduce((a,b)=>a+b,0)/7;
  return agHead(`${dshort(ws)} a ${dshort(addDays(ws,6))}`,pw&&pw.w?chip(`Semana ${pw.n} · ${pw.w.fase}`,null,'pill-phase'):'')+`
  <div class="row"><button class="btn" data-act="fill-week">Preencher com a semana padrão</button><button class="btn" data-act="save-pattern">Salvar esta semana como padrão</button><button class="btn ghost" data-act="clear-week">Limpar semana</button></div>
  <div class="week">${days.map(d=>{const r=dayRec(d), dt=dtById(dayTypeOf(d)), ss=r?r.sessions.slice().sort((a,b)=>(a.hora||'').localeCompare(b.hora||'')):[];
    return `<div class="day ${d===t?'is-today':''}"><button class="day-h" data-act="ag-day" data-date="${d}" title="Abrir o dia"><span class="dn">${DOW[pISO(d).getDay()]}</span><span class="dd">${dshort(d)}</span></button>
    <select class="dt-select" id="dt-${d}" data-bind="daytype" data-date="${d}" aria-label="Tipo de dia">${S.cfg.dayTypes.map(x=>`<option value="${x.id}" ${x.id===dt.id?'selected':''}>${esc(x.nome.split('—')[0].trim())}</option>`).join('')}</select>
    ${ss.map(x=>{const a=actById(x.act), tp=x.tplId?tplById(x.tplId):null;return `<button class="dsess ${x.done?'done':''}" style="border-left-color:${tp?tp.cor:'var(--muted)'}" data-act="edit-sess" data-date="${d}" data-sid="${x.id}"><span class="num small muted">${esc(x.hora||'')}</span><span class="x">${esc(tp?tp.nome.split('—')[0]:a.nome)}</span>${tp?`<span class="small muted">${esc(a.nome)}</span>`:''}</button>`}).join('')}
    <button class="btn ghost sm" data-act="add-sess" data-date="${d}">+ treino</button>
    <div class="small muted num">${fmt(dayExp(d))} kcal</div></div>`}).join('')}</div>
  <div class="grid g3"><div class="card">${stat(fmt(avgE),' kcal/dia','Gasto médio semanal')}</div><div class="card">${stat(fmt(avgI),' kcal/dia','Ingestão média planejada')}</div><div class="card">${stat((avgI-avgE>0?'+':'')+fmt(avgI-avgE),' kcal/dia',avgI<avgE?'Déficit médio':'Superávit médio')}<span class="small muted">≈ ${fmt(Math.abs(avgI-avgE)*7/7700,2)} kg de gordura por semana</span></div></div>
  <section class="card"><h3>Gasto × ingestão por dia</h3><div class="chart-box"><canvas id="chWeekA"></canvas></div></section>`;
}
AFTER.agenda = ()=>{ if((S.agView||'semana')==='semana') chartWeek('chWeekA',S.weekStart); const v=S.agView||'semana'; const p= v==='mes'? calEnsure('mes',S.agMonth) : v==='dia'? Promise.all([ensureMonth(mk(S.agDate)),ensureMonth(mk(mondayOf(S.agDate))),ensureMonth(mk(addDays(mondayOf(S.agDate),6)))]).then(()=>false) : Promise.resolve(false); p.then(ch=>{ if(ch&&S.tab==='agenda') render(); }); };

/* ----- Dieta ----- */
function mealsGot(d,dt){
  const r=dayRec(d); const meals=S.cfg.meals[dt.id]||[]; const got={p:0,c:0,g:0,kcal:0};
  if(r&&r.meals) meals.forEach(m=>{const sel=r.meals[m.id]; if(sel && sel.done){ const op=m.ops[sel.op||0]; if(op){got.p+=op.p;got.c+=op.c;got.g+=op.g;got.kcal+=op.kcal;} }});
  if(r&&r.foods&&r.foods.length){ const x=diaryGot(d); got.p+=x.p; got.c+=x.c; got.g+=x.g; got.kcal+=x.kcal; }
  return got;
}
function dietaFull(){
  const d=today(); if(!S.dietType) S.dietType=dayTypeOf(d);
  const dt=dtById(S.dietType), tg=typeTarget(dt), bm=bmrAll(), bk=bmrKey(), p=S.profile;
  const meals=S.cfg.meals[dt.id]||[]; const r=dayRec(d); const isToday=dayTypeOf(d)===dt.id;
  const sumPlan=meals.reduce((s,m)=>{const op=m.ops[((r&&r.meals&&r.meals[m.id])||{}).op||0]||{p:0,c:0,g:0,kcal:0};return {p:s.p+op.p,c:s.c+op.c,g:s.g+op.g,kcal:s.kcal+op.kcal}},{p:0,c:0,g:0,kcal:0});
  const naf=[[1.2,'Sedentário'],[1.375,'Leve (1–3x/sem)'],[1.55,'Moderado (3–5x/sem)'],[1.725,'Intenso (6–7x/sem)'],[1.9,'Muito intenso (2x/dia)']];
  return `<div class="head"><div><h2>Dieta & macros</h2><div class="sub">Taxa metabólica basal, gasto por tipo de dia, calculadora de macros e cardápios com opções.</div></div></div>
  ${exampleBanner()}
  <section class="card"><div class="macro-hero mp">
    <div class="stack" style="gap:14px;min-width:0">${dtPicker(dt)}
      <div><h3>${esc(dt.nome)}</h3><p class="small muted">${esc(dt.desc||'')}${isToday?' · hoje':''}</p></div>
      <div class="row" style="gap:22px">${stat(fmt(tg.kcal),' kcal','meta do dia')}${stat(fmt(tg.exp),' kcal','gasto estimado')}${stat((dt.adj>0?'+':'')+dt.adj,'%','ajuste')}</div>
      ${macroPremium(tg,dt)}
    </div></div>
    <div class="fgrid">
      <label class="f">Ajuste calórico (%)<input type="number" id="dtAdj" data-bind="dt.adj" value="${dt.adj}" step="1"></label>
      <label class="f">Proteína (g/kg)<input type="number" id="dtP" data-bind="dt.pKg" value="${dt.pKg}" step="0.1"></label>
      <label class="f">Gordura (g/kg)<input type="number" id="dtG" data-bind="dt.gKg" value="${dt.gKg}" step="0.1"></label>
      <label class="f">Nome do tipo<input type="text" id="dtNome" data-bind="dt.nome" value="${esc(dt.nome)}"></label></div>
    <div><span class="small muted">Atividades deste tipo de dia (somam ao gasto):</span><div class="row" style="margin-top:6px">${S.cfg.acts.map(a=>`<label class="chip" style="cursor:pointer"><input type="checkbox" id="dta-${a.id}" data-bind="dt.act" data-id="${a.id}" ${dt.acts.includes(a.id)?'checked':''}> ${esc(a.nome)}</label>`).join('')}</div></div>
    <div class="note small">Referências: proteína 1,6–2,5 g/kg para treinados e gordura entre 15–35% das calorias (Enciclopédia do Treinamento); carboidrato é o que sobra e acompanha o tamanho do treino (ciclo de carboidratos). ${tg.g*9/tg.kcal<.15?'<b>Atenção:</b> gordura abaixo de 15% das kcal.':''} ${dt.pKg>2.5?'Proteína acima de 2,5 g/kg não traz ganho extra.':''}</div>
    <div class="row"><button class="btn sm primary" data-act="preset-mil">Carregar plano TFM + CrossFit + Academia</button><button class="btn sm" data-act="dt-new">+ Novo tipo de dia</button>${S.cfg.dayTypes.length>1?`<button class="btn sm danger" data-act="dt-del" data-id="${dt.id}">Excluir este tipo</button>`:''}</div>
  </section><!--§1-->
  <section class="card"><div class="row between"><h3>Cardápio base — ${esc(dt.nome.split('—')[0].trim())}</h3><span class="small muted">Plano de referência. Escolha uma opção por refeição${isToday?' e marque o que comeu (ou lance os alimentos no diário)':''}</span></div>
    <div class="row" style="gap:18px"><span class="num">Plano escolhido: <b>${fmt(sumPlan.kcal)}</b> / ${fmt(tg.kcal)} kcal</span><span class="mm num small"><span class="p">P ${sumPlan.p}</span> · <span class="c">C ${sumPlan.c}</span> · <span class="g">G ${sumPlan.g}</span></span></div>
    ${Math.abs(sumPlan.kcal-tg.kcal)>tg.kcal*.1&&sumPlan.kcal>0?`<div class="note warn small">O cardápio está ${sumPlan.kcal>tg.kcal?'acima':'abaixo'} da meta em ${fmt(Math.abs(sumPlan.kcal-tg.kcal))} kcal. Ajuste as quantidades das opções ou crie as suas.</div>`:''}
    ${meals.length?'':'<div class="empty small">Nenhum cardápio base para este tipo de dia. Carregue o cardápio base pronto ou crie suas refeições.</div>'}
    ${meals.map(m=>{const sel=(r&&r.meals&&r.meals[m.id])||{};return `<div class="meal"><div class="meal-h"><span class="hr">${esc(m.hora)}</span><span class="t">${esc(m.nome)}</span><span class="mm num small"><span class="p">P ${m.p}</span> · <span class="c">C ${m.c}</span> · <span class="g">G ${m.g}</span></span>
      ${isToday?`<button class="check" aria-pressed="${!!sel.done}" data-act="meal-done" data-id="${m.id}" aria-label="Refeição feita">✓</button>`:''}
      <button class="btn icon sm" data-act="meal-edit" data-id="${m.id}" aria-label="Editar refeição">✎</button></div>
      <div class="ops">${m.ops.map((op,i)=>`<button class="op" aria-pressed="${(sel.op||0)===i}" data-act="meal-op" data-id="${m.id}" data-i="${i}"><b>${m.ops.length>1?`Opção ${i+1} · `:''}${esc(op.nome)}</b><ul>${op.itens.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><span class="mm"><span class="p">P ${op.p}</span> · <span class="c">C ${op.c}</span> · <span class="g">G ${op.g}</span> · ${op.kcal} kcal</span></button>`).join('')}</div></div>`}).join('')}
    <div class="row"><button class="btn" data-act="meal-new">+ Nova refeição</button><button class="btn ghost" data-act="meal-reset">Carregar cardápio base</button></div>
  </section><!--§2-->
  <div class="grid g2">
  <section class="card"><h3>Taxa metabólica basal</h3>
    <div class="tbl-wrap"><table><thead><tr><th>Equação</th><th>Fórmula</th><th class="n">kcal</th></tr></thead><tbody>
    ${Object.entries(bm).map(([k,x])=>`<tr class="${k===bk?'hl':''}"><td>${x.n}${k===bk?' ★':''}</td><td class="small muted">${x.f}</td><td class="n">${x.v?fmt(x.v):'—'}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted">${lbm()?'Com o % de gordura informado, a referência é a Katch-McArdle, que usa a massa magra e é mais precisa para quem treina.':'Informe o % de gordura no perfil para liberar Katch-McArdle e Cunningham.'} Trocar a equação: aba Perfil.</p></section>
  <section class="card"><h3>Gasto pelo nível de atividade</h3>
    <p class="small muted">Estimativa rápida: TMB × fator de atividade. O cálculo detalhado (por treino, com METs) está nos tipos de dia e na Agenda.</p>
    <div class="tbl-wrap"><table><thead><tr><th>Nível</th><th class="n">Fator</th><th class="n">kcal/dia</th></tr></thead><tbody>
    ${naf.map(([f,n])=>`<tr class="${+p.naf===f?'hl':''}" data-act="naf" data-v="${f}" style="cursor:pointer"><td>${n}</td><td class="n">${String(f).replace('.',',')}</td><td class="n">${fmt(bmr()*f)}</td></tr>`).join('')}</tbody></table></div>
    <div class="row" style="gap:22px">${stat(fmt(weekAvg().exp),' kcal','gasto médio semanal (detalhado)')}${stat(fmt(weekAvg().kcal),' kcal','ingestão média')}</div></section>
  </div>
<!--§3-->
  <section class="card"><h3>Suplementação com evidência</h3><div class="tbl-wrap"><table><thead><tr><th>Suplemento</th><th>Dose</th><th>Quando</th><th>Observação</th></tr></thead><tbody>${D.SUPLEMENTOS.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}
VIEWS.dieta = ()=>{
  const full=dietaFull(), m=S.dietSub||'cardapio';
  const [p0,p1,p2,p3]=full.split(/<!--§[123]-->/);
  const hi=p0.indexOf('<section class="card"><div class="macro-hero'), head=p0.slice(0,hi), macro=p0.slice(hi);
  const seg=`<div class="seg" role="group" aria-label="Seções da dieta">${[['cardapio','Cardápio do dia'],['metas','Metas & macros'],['gasto','Gasto calórico']].map(([k,n])=>`<button aria-pressed="${m===k}" data-act="diet-sub" data-id="${k}">${n}</button>`).join('')}</div>`;
  const calc = p2||'';
  const bk=bmrKey(), wa=weekAvg();
  const gasto=`<section class="card"><h3>Seu gasto</h3><div class="row" style="gap:26px">${stat(fmt(bmr()),' kcal','taxa metabólica basal')}${stat(fmt(wa.exp),' kcal','gasto médio por dia')}${stat(fmt(wa.kcal),' kcal','meta média por dia')}</div>
    <p class="small muted">Basal pela equação ${esc(bmrAll()[bk].n)}. O gasto soma a sua rotina e os treinos da semana (com as calorias do relógio quando lançadas).</p></section>
    <details class="calc"><summary>Ver cálculo detalhado (equações e níveis de atividade)</summary>${calc}</details>`;
  const supl = p3? `<details class="calc"><summary>Suplementação com evidência</summary>${p3}</details>` : '';
  const body = m==='metas'? macro+supl : m==='gasto'? gasto : (dietMini()+diaryHTML()+p1);
  return head+seg+body;
};
function dtPicker(dt){
  if(S.cfg.dayTypes.length<=4) return `<div class="seg" role="group" aria-label="Tipo de dia">${S.cfg.dayTypes.map(x=>`<button aria-pressed="${x.id===dt.id}" data-act="diet-type" data-id="${x.id}">${esc(x.nome.split('—')[0].trim())}</button>`).join('')}</div>`;
  return `<label class="f dt-pick">Tipo de dia<select id="dtPick" data-bind="dietsel.v">${S.cfg.dayTypes.map(x=>`<option value="${x.id}" ${x.id===dt.id?'selected':''}>${esc(x.nome)}${x.id===dayTypeOf(today())?' · hoje':''}</option>`).join('')}</select></label>`;
}
function loadPresetMilitar(){
  const P=D.PRESET_MILITAR; Store.save('prebkp',{ts:Date.now(),tag:'preset',tpl:clone(S.tpl),cfg:clone(S.cfg)});
  P.acts.forEach(a=>{ if(!S.cfg.acts.some(x=>x.id===a.id)) S.cfg.acts.push(clone(a)); });
  S.cfg.dayTypes=clone(P.dayTypes); S.cfg.meals=mealsWithIds(clone(P.meals)); S.cfg.weekPattern=clone(P.weekPattern);
  S.dietType=dayTypeOf(today()); save('cfg'); render(); toast('Plano carregado: 8 tipos de dia com cardápio');
}
function dietMini(){
  const dt=dtById(S.dietType), tg=typeTarget(dt), d=today(), got=dayTypeOf(d)===dt.id?mealsGot(d,dt):null;
  return `<section class="card"><div class="row between">${dtPicker(dt)}<button class="btn sm" data-act="diet-sub" data-id="metas">Ajustar metas</button></div>
    <div class="row" style="gap:22px">${stat(fmt(tg.kcal),' kcal','meta · '+esc(dt.nome.split('—')[1]||dt.nome).trim())}${got?stat(fmt(got.kcal),' kcal','consumido hoje'):''}</div>${macroBars(tg,got)}</section>`;
}
AFTER.dieta = ()=>{};
function weekAvg(){
  const ws=mondayOf(today()); let e=0,k=0; for(let i=0;i<7;i++){const d=addDays(ws,i); e+=dayExp(d); k+=typeTarget(dtById(dayTypeOf(d))).kcal;} return {exp:e/7,kcal:k/7};
}

/* ----- Água ----- */
VIEWS.agua = ()=>{
  const d=today(), r=dayRec(d), w=(r&&r.water)||0, g=waterGoal(d), c=S.cfg.water, pct=w/g*100;
  const mins = r&&r.sessions.length? r.sessions.reduce((s,x)=>s+(x.min??actById(x.act).min),0) : dtById(dayTypeOf(d)).acts.reduce((s,a)=>s+actById(a).min,0);
  return `<div class="head"><div><h2>Hidratação</h2><div class="sub">Meta calculada pelo peso, pelos minutos de treino do dia e pelo clima.</div></div></div>
  <section class="card"><div class="water-wrap"><div id="bottleBox">${bottleHTML(pct)}</div>
    <div class="stack" style="gap:14px">
      <div class="row" style="gap:24px">${stat(fmt(w/1000,2),' L','bebido hoje')}${stat(fmt(g/1000,2),' L','meta de hoje')}${stat(fmt(Math.max(0,g-w)),' ml','faltam')}</div>
      <div class="bar" style="height:12px"><i style="width:${Math.min(100,pct)}%;background:var(--water)"></i></div>
      <div class="water-btns">${[c.copo,350,500,750,1000].filter((v,i,a)=>a.indexOf(v)===i).map(v=>`<button class="btn" data-act="water" data-ml="${v}">+${v} ml</button>`).join('')}<button class="btn ghost" data-act="water" data-ml="-${c.copo}">Desfazer ${c.copo} ml</button></div>
      <div class="note small">Cálculo de hoje: ${fmt(S.profile.peso,1)} kg × ${c.mlKg} ml = ${fmt(S.profile.peso*c.mlKg)} ml · ${mins} min de treino × ${c.mlHora} ml/h = ${fmt(mins/60*c.mlHora)} ml${S.profile.clima==='quente'?` · clima quente +${c.calor} ml`:''}.<br>Pese-se antes e depois de um treino longo: cada 1 kg perdido = 1–1,5 L para repor. Urina clara é o melhor indicador prático.</div>
    </div></div></section>
  <div class="grid g2">
  <section class="card"><h3>Personalizar a meta</h3><div class="fgrid">
    <label class="f">ml por kg de peso<input type="number" id="wMlKg" data-bind="water.mlKg" value="${c.mlKg}"></label>
    <label class="f">ml por hora de treino<input type="number" id="wMlH" data-bind="water.mlHora" value="${c.mlHora}"></label>
    <label class="f">Extra em clima quente (ml)<input type="number" id="wCal" data-bind="water.calor" value="${c.calor}"></label>
    <label class="f">Tamanho do seu copo (ml)<input type="number" id="wCopo" data-bind="water.copo" value="${c.copo}"></label>
    <label class="f">Clima<select id="wClima" data-bind="profile.clima"><option value="quente" ${S.profile.clima==='quente'?'selected':''}>Quente</option><option value="ameno" ${S.profile.clima!=='quente'?'selected':''}>Ameno</option></select></label></div></section>
  <section class="card"><h3>Últimos 14 dias</h3><div class="chart-box sm"><canvas id="chWater"></canvas></div></section></div>`;
};
AFTER.agua = ()=>chartWater('chWater');

/* ----- Peso ----- */
function pesoEntries(){ return S.body.entries.filter(e=>e.peso).sort((a,b)=>a.date.localeCompare(b.date)); }
function weightCategory(delta){ if(Math.abs(delta)<0.1) return 'estavel'; if(S.profile.objetivo==='bulking') return delta>0?'ganhoBom':'perdaRuim'; return delta<0?'perdaBoa':'ganhoRuim'; }
const isGood = c=>c==='perdaBoa'||c==='ganhoBom'||c==='estavel';
VIEWS.progresso = ()=>{
  const ALL=S.body.entries.slice().sort((a,b)=>a.date.localeCompare(b.date));
  const t0=today(), avgW=(from,to)=>{const L=ALL.filter(e=>e.peso&&e.date>=from&&e.date<=to);return L.length?L.reduce((s,e)=>s+e.peso,0)/L.length:null};
  const a1=avgW(addDays(t0,-6),t0), a0=avgW(addDays(t0,-13),addDays(t0,-7));
  const w1=ALL.filter(e=>e.cintura).slice(-1)[0], w0=ALL.filter(e=>e.cintura&&e.date<=addDays(t0,-14)).slice(-1)[0];
  const sug=adjustSuggestion(a0,a1,w0,w1), fcLast=ALL.filter(e=>e.fc).slice(-1)[0];
  const E=pesoEntries(), p=S.profile, last=E[E.length-1], first=E[0], prev=E[E.length-2];
  const meta=num(p.pesoMeta), t=today();
  const avg=(from,to)=>{const L=E.filter(e=>e.date>=from&&e.date<=to);return L.length?L.reduce((s,e)=>s+e.peso,0)/L.length:null};
  const a7=avg(addDays(t,-6),t);
  const delta=last&&prev? last.peso-prev.peso : null, cat=delta!==null?weightCategory(delta):null;
  return `<div class="head"><div><h2>Progresso</h2><div class="sub">Peso 3–4x por semana ao acordar; cintura 1x por semana na altura do umbigo.</div></div><button class="btn" data-act="body-new">+ Cintura, FC e sono</button></div>
  <section class="card"><div class="peso-entry">
    <div class="stack" style="min-width:0;flex:1">
      <p class="small muted" style="margin:0">Suba na balança ao acordar, depois do banheiro, e lance aqui.</p>
      <div class="row" style="align-items:end"><label class="f" style="flex:1;min-width:120px">Peso (kg)<input type="number" id="pesoIn" inputmode="decimal" step="0.1" placeholder="${last?fmt(last.peso,1):fmt(p.peso,1)}" style="font-size:1.3rem;font-family:var(--f-mono)"></label>
      <label class="f" style="flex:1;min-width:130px">Data<input type="date" id="pesoData" value="${t}"></label>
      <button class="btn primary" data-act="peso-save" style="min-height:44px">Lançar peso</button></div></div></div></section>
  <div class="grid stats-grid">
    <div class="card">${stat(last?fmt(last.peso,1):'—',' kg','peso atual')}${delta!==null?`<span class="small" style="color:var(${isGood(cat)?'--good':'--bad'})">${delta>0?'+':''}${fmt(delta,1)} kg desde o último</span>`:''}</div>
    <div class="card">${stat(first&&last?((last.peso-first.peso>0?'+':'')+fmt(last.peso-first.peso,1)):'—',' kg','variação total')}${first?`<span class="small muted">desde ${dshort(first.date)} (${fmt(first.peso,1)} kg)</span>`:''}</div>
    <div class="card">${stat(a7?fmt(a7,1):'—',' kg','média 7 dias')}<span class="small muted">use a média: o peso diário oscila 1–2 kg</span></div>
    <div class="card">${stat(meta?fmt(meta,1):'—',' kg','meta')}${meta&&last?`<span class="small muted">${Math.abs(last.peso-meta)<0.05?'meta atingida!':`faltam ${fmt(Math.abs(last.peso-meta),1)} kg`}</span>`:'<span class="small muted">defina abaixo</span>'}</div>
    <div class="card">${stat(w1?fmt(w1.cintura,1):'—',' cm','cintura')}${w1&&w0?`<span class="small" style="color:var(${w1.cintura<=w0.cintura?'--good':'--bad'})">${w1.cintura-w0.cintura>0?'+':''}${fmt(w1.cintura-w0.cintura,1)} cm em 2 semanas</span>`:'<span class="small muted">1x por semana</span>'}</div>
    <div class="card">${stat(fcLast?fcLast.fc:'—',' bpm','FC de repouso')}<span class="small muted">ao acordar; 7+ bpm acima do normal indica cansaço</span></div>
  </div>
  <section class="card"><h3>Sua curva</h3>${E.length?`<div class="chart-box" style="height:280px"><canvas id="chPesoT"></canvas></div><p class="small muted">Pontos verdes: o peso foi na direção do seu objetivo. Vermelhos: foi na direção oposta.</p>`:`<div class="empty">Lance o primeiro peso para começar o gráfico.</div>`}</section>
  <div class="grid g2"><section class="card"><h3>Ajuste recomendado</h3><div class="note ${sug.warn?'warn':''}">${sug.txt}</div>
    <details><summary class="small" style="cursor:pointer">Regras de ajuste (avalie a cada 2 semanas)</summary><div class="tbl-wrap"><table><tbody>
    <tr><td>Peso caindo 0,2–0,5 kg/sem, cintura diminuindo, cargas subindo</td><td>Mantenha tudo.</td></tr>
    <tr><td>Peso caindo mais de 0,7 kg/sem e cargas caindo</td><td>+150–200 kcal (40–50 g de carbo) nos dias de treino forte.</td></tr>
    <tr><td>Peso e cintura parados por 3 semanas</td><td>−150 kcal (35–40 g de carbo) nos dias mais leves.</td></tr>
    <tr><td>Peso subindo mais de 0,3 kg/sem e cintura aumentando</td><td>−150 kcal nos dias mais leves.</td></tr>
    <tr><td>Fome intensa, sono ruim, treino péssimo</td><td>Um dia de descanso com +100 g de carbo (refeed) e reveja o sono.</td></tr></tbody></table></div></details></section>
  <section class="card"><h3>Cintura</h3>${ALL.some(e=>e.cintura)?`<div class="chart-box sm"><canvas id="chCint"></canvas></div>`:`<div class="empty">Registre a cintura uma vez por semana em "+ Cintura, FC e sono".</div>`}</section></div>
  <section class="card"><h3>Meta de peso</h3><div class="row" style="align-items:end"><label class="f" style="max-width:220px">Meta (kg)<input type="number" id="pesoMeta" data-bind="profile.pesoMeta" value="${esc(p.pesoMeta)}" step="0.1"></label><span class="small muted">Aparece no gráfico como linha tracejada.</span></div></section>
  <section class="card"><h3>Sinais de excesso de treino</h3><p class="small muted">Se aparecerem 2 ou mais por mais de 3 dias, reduza o CrossFit ou antecipe o deload.</p>
    <div class="stack">${D.SINAIS_OVERTRAINING.map((s,i)=>`<label class="row small" style="flex-wrap:nowrap"><input type="checkbox" id="ot-${i}" data-bind="ot" data-i="${i}" ${(S.body.ot||[])[i]?'checked':''}> ${s}</label>`).join('')}</div>
    ${(S.body.ot||[]).filter(Boolean).length>=2?'<div class="note warn"><b>2 ou mais sinais marcados.</b> Reduza o CrossFit para 3x na semana ou antecipe a semana de deload.</div>':''}</section>
  <section class="card"><h3>Registros</h3>${ALL.length?`<div class="tbl-wrap"><table><thead><tr><th>Data</th><th class="n">Peso</th><th class="n">Variação</th><th class="n">Cintura</th><th class="n">FC rep.</th><th class="n">Sono</th><th></th></tr></thead><tbody>${ALL.slice().reverse().slice(0,60).map(e=>{const pv=e.peso?E.filter(x=>x.date<e.date).slice(-1)[0]:null;const d=pv?e.peso-pv.peso:null;const c=d!==null?weightCategory(d):null;return `<tr><td>${dshort(e.date)}</td><td class="n">${e.peso?fmt(e.peso,1):'—'}</td><td class="n" style="color:${c?`var(${isGood(c)?'--good':'--bad'})`:'inherit'}">${d===null?'—':(d>0?'+':'')+fmt(d,1)}</td><td class="n">${e.cintura?fmt(e.cintura,1):'—'}</td><td class="n">${e.fc||'—'}</td><td class="n">${e.sono?fmt(e.sono,1)+' h':'—'}</td><td><button class="btn ghost sm" data-act="body-del" data-id="${e.id}">Excluir</button></td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">Sem registros ainda.</div>'}</section>`;
};
const AFTER_PESO = ()=>{
  const E=pesoEntries(); if(!E.length) return; const meta=num(S.profile.pesoMeta);
  const ma=E.map(e=>{const L=E.filter(x=>x.date<=e.date&&x.date>=addDays(e.date,-6));return +(L.reduce((s,x)=>s+x.peso,0)/L.length).toFixed(2)});
  const cols=E.map((e,i)=>i===0?css('--muted'):isGood(weightCategory(e.peso-E[i-1].peso))?css('--good'):css('--bad'));
  const ds=[{label:'Peso (kg)',data:E.map(e=>e.peso),borderColor:css('--line'),pointBackgroundColor:cols,pointBorderColor:cols,pointRadius:5,pointHoverRadius:7,borderWidth:1.5,tension:.25},
    {label:'Média 7 dias',data:ma,borderColor:css('--accent'),pointRadius:0,borderWidth:3,tension:.35}];
  if(meta) ds.push({label:'Meta',data:E.map(()=>meta),borderColor:css('--good'),borderDash:[6,5],pointRadius:0,borderWidth:1.5});
  mkChart('chPesoT',{type:'line',data:{labels:E.map(e=>dshort(e.date)),datasets:ds},options:baseOpts()});
};
function savePeso(kg,date){
  const E=pesoEntries(); const prev=E.filter(e=>e.date<date).slice(-1)[0];
  const ex=S.body.entries.find(e=>e.date===date&&e.peso);
  if(ex) ex.peso=kg; else S.body.entries.push({id:uid(),date,peso:kg,cintura:null,fc:null,sono:null});
  if(date>=(E.length?E[E.length-1].date:'')){ S.profile.peso=kg; save('profile'); }
  save('body'); render();
  celebrate(prev?kg-prev.peso:null);
}
function celebrate(delta){
  toast(delta===null||delta===undefined?'Peso registrado':`Peso registrado · ${delta>0?'+':''}${fmt(delta,1)} kg desde o último`);
}

/* ----- RPs ----- */
VIEWS.rps = ()=>{
  const exIds=[...new Set(allLogs().flatMap(l=>(l.ex||[]).map(e=>e.exId)))];
  const auto=exIds.map(id=>{const h=exHistory(id); if(!h.length) return null; const b=h.reduce((a,x)=>x.best>a.best?x:a,h[0]); const t=Math.max(...h.map(x=>x.top)); return {id,nome:(exById(id)||{nome:id}).nome,best:b.best,date:b.date,top:t,n:h.length};}).filter(Boolean).sort((a,b)=>b.best-a.best);
  if(!S.prEx && auto.length) S.prEx=auto[0].id;
  const cats=[...new Set(D.BENCH.map(b=>b.cat))];
  return `<div class="head"><div><h2>Recordes pessoais</h2><div class="sub">RPs registrados por você e recordes calculados automaticamente dos treinos.</div></div><button class="btn primary" data-act="pr-new">+ Registrar RP</button></div>
  ${cats.map(c=>`<section class="card"><h3>${c}</h3><div class="grid g4">${D.BENCH.filter(b=>b.cat===c).concat(c==='Levantamentos'?S.prs.manual.filter(m=>m.custom&&!D.BENCH.some(b=>b.id===m.bid)).reduce((acc,m)=>acc.some(x=>x.id===m.bid)?acc:acc.concat([{id:m.bid,nome:m.nomeCustom,tipo:m.tipo,cat:c}]),[]):[]).map(b=>{const best=bestPR(b);
    return `<button class="pr-card" style="text-align:left;cursor:pointer" data-act="pr-hist" data-id="${b.id}"><span class="small muted">${esc(b.nome)}</span><span class="v num">${best?prFmt(best.valor,b.tipo):'—'}</span><span class="small muted">${best?dshort(best.data)+(best.reps&&b.tipo==='kg'&&best.reps>1?` · ${best.reps} reps`:''):(b.desc?esc(b.desc):'toque para registrar')}</span></button>`}).join('')}</div></section>`).join('')}
  <section class="card"><div class="row between"><h3>Calculados dos treinos</h3><span class="small muted">1RM estimado (Epley) da melhor série</span></div>
    ${auto.length?`<div class="tbl-wrap"><table><thead><tr><th>Exercício</th><th class="n">1RM est.</th><th class="n">Maior carga</th><th class="n">Data</th></tr></thead><tbody>${auto.map(a=>`<tr data-act="pr-ex" data-id="${a.id}" style="cursor:pointer" class="${a.id===S.prEx?'hl':''}"><td>${esc(a.nome)}</td><td class="n">${fmt(a.best,1)} kg</td><td class="n">${fmt(a.top,1)} kg</td><td class="n">${dshort(a.date)}</td></tr>`).join('')}</tbody></table></div>
    <h4>Evolução — ${esc((exById(S.prEx)||{nome:''}).nome)}</h4><div class="chart-box"><canvas id="chPr"></canvas></div>`:`<div class="empty">Conclua treinos na aba Treinar e os recordes aparecem aqui.</div>`}</section>
  <section class="card"><h3>Calculadora de % de 1RM</h3><p class="small muted">Informe uma série (carga × repetições). O app estima seu 1RM e mostra a carga de cada faixa da tabela de intensidade da Enciclopédia do Treinamento.</p>
    <div class="fgrid"><label class="f">Carga (kg)<input type="number" id="rmKg" value="100" step="0.5"></label><label class="f">Repetições<input type="number" id="rmReps" value="8"></label></div>
    <div id="rmOut"></div></section>`;
};
AFTER.rps = ()=>{ calcRM(); if(S.prEx) chartPr('chPr',S.prEx); };
function prKey(b){ return b.id; }
function bestPR(b){ const L=S.prs.manual.filter(m=>m.bid===prKey(b)); if(!L.length) return null; return L.reduce((a,x)=>prBetter(x.valor,a.valor,b.tipo)?x:a,L[0]); }
function prBetter(a,b,tipo){ return tipo==='tempo'? a<b : a>b; }
function prFmt(v,tipo){ if(tipo==='tempo'){const m=Math.floor(v/60), s=Math.round(v%60); return `${m}:${String(s).padStart(2,'0')}`;} if(tipo==='kg') return fmt(v,1).replace(',0','')+' kg'; if(tipo==='dist') return fmt(v)+' m'; return fmt(v); }
function parseTime(s){ s=String(s).trim(); if(s.includes(':')){const [m,x]=s.split(':');return num(m)*60+num(x);} return num(s)*60; }
function calcRM(){
  const kg=num(($('#rmKg')||{}).value), r=num(($('#rmReps')||{}).value), out=$('#rmOut'); if(!out) return;
  const ep=e1rm(kg,r), br= r<37? kg*36/(37-r):0, one=r===1?kg:(ep+br)/2;
  out.innerHTML=`<div class="row" style="gap:24px;margin:8px 0">${stat(fmt(one,1),' kg','1RM estimado')}<span class="small muted">Epley ${fmt(ep,1)} · Brzycki ${fmt(br,1)}</span></div>
  <div class="tbl-wrap"><table><thead><tr><th>Faixa</th><th class="n">% 1RM</th><th class="n">Carga</th><th>Intensidade</th></tr></thead><tbody>${D.RM_TABLE.map(([f,p,i])=>`<tr><td>${f}</td><td class="n">${p}%</td><td class="n">${fmt(Math.round(one*p/100*2)/2,1)} kg</td><td>${i}</td></tr>`).join('')}</tbody></table></div>`;
}

/* ----- Periodização ----- */
VIEWS.period = ()=>{
  const p=S.cfg.period, pw=periodWeek(today());
  return `<div class="head"><div><h2>Periodização</h2><div class="sub">${esc((D.PERIODS[p.preset]||{nome:'Personalizada'}).nome)} · início em ${dshort(p.start)}${pw&&pw.w?` · você está na semana ${pw.n} de ${pw.total}${pw.cycle>1?` (ciclo ${pw.cycle})`:''}`:pw&&pw.before?' · começa em breve':''}</div></div></div>
  ${periodGuide()}
  <section class="card" id="perAtual"><h3>Modelo em uso</h3><div class="seg" role="group">${Object.entries(D.PERIODS).map(([k,x])=>`<button aria-pressed="${p.preset===k}" data-act="per-preset" data-id="${k}">${x.nome}</button>`).join('')}</div>
    <p class="small muted">${esc((D.PERIODS[p.preset]||{}).fonte||'')}</p>
    <div class="fgrid"><label class="f">Data de início<input type="date" id="perStart" data-bind="period.start" value="${p.start}"></label><label class="f">Nível<select id="perNivel" data-bind="profile.nivel">${Object.entries(D.VOLUME_NIVEL).map(([k,v])=>`<option value="${k}" ${S.profile.nivel===k?'selected':''}>${v.n}</option>`).join('')}</select></label></div>
    <div class="note small">Volume recomendado para o seu nível: <b>${D.VOLUME_NIVEL[S.profile.nivel].faixa}</b> por grupo muscular na semana. Aumente o volume de forma gradual (15–30% a cada 2–6 semanas) e, se a carga parar de subir, reduza o volume ou faça um deload.</div></section>
  <section class="card"><h3>Semanas</h3><div class="chart-box sm"><canvas id="chPer"></canvas></div>
    <div class="wk">${p.weeks.map((w,i)=>`<div class="wkc ${pw&&pw.n===i+1?'now':''}"><span class="small muted">Semana ${i+1}${pw&&pw.n===i+1?' · agora':''}</span><span class="n">${esc(w.fase)}</span><span>${MODE_TXT[w.mode]}</span><span class="small">RIR ${esc(w.rir)}${w.reps?` · ${esc(w.reps)}`:''}</span><span class="small muted">${esc(w.foco)}</span><button class="btn ghost sm" data-act="per-edit" data-i="${i}">Editar</button></div>`).join('')}</div>
    <div class="row"><button class="btn sm" data-act="per-add">+ Semana</button>${p.weeks.length>1?`<button class="btn sm ghost" data-act="per-pop">− Última semana</button>`:''}</div></section>
  <section class="card"><h3>Princípios para naturais</h3><div class="tbl-wrap"><table><tbody>
    <tr><td><b>Frequência ~2x/semana</b></td><td>Cada músculo a cada 4–5 dias rende mais que 1x por semana.</td></tr>
    <tr><td><b>Proximidade da falha (RIR)</b></td><td>RIR = repetições que ainda sobrariam. Compostos com RIR 2–3; isoladores com RIR 0–1.</td></tr>
    <tr><td><b>Progressão dupla</b></td><td>Completou o topo da faixa em todas as séries? Aumente 2–5% na carga e volte ao início da faixa. O app sugere isso automaticamente.</td></tr>
    <tr><td><b>Interferência</b></td><td>Corrida e CrossFit competem com a hipertrofia: sessões curtas, pernas com baixo estresse na coluna e carboidrato alto nos dias de treino.</td></tr>
    <tr><td><b>Sono curto</b></td><td>Dormiu menos de 6 h? Faça 1 série a menos por exercício com RIR 3. Duas noites seguidas: troque a academia por descanso.</td></tr></tbody></table></div></section>`;
};
AFTER.period = ()=>chartPeriod('chPer');

const PER_INFO = {
  plano12:{n:'Recomposição 12 semanas',tag:'Fadiga controlada',cor:'var(--good)',
    oque:'Divide 12 semanas em fases: Readaptação (1–2), Acumulação (3–6), Deload (7), Intensificação (8–11) e Deload com avaliação (12). A faixa de repetições da ficha não muda; o que muda é o número de séries e o quanto você chega perto da falha (RIR).',
    serve:'Ganhar músculo e perder gordura ao mesmo tempo, voltar a treinar depois de uma pausa e combinar musculação com CrossFit, corrida ou natação sem estourar a recuperação.',
    quem:'Quem está voltando, quem está em leve déficit calórico e quem treina mais de uma modalidade por dia.',
    pro:'Simples de seguir; o app ajusta as séries sozinho; deloads programados evitam excesso de treino.',
    contra:'Progride mais devagar em força máxima do que um bloco focado em força.'},
  linear:{n:'Linear por blocos',tag:'Do leve ao pesado',cor:'var(--accent)',
    oque:'Começa com mais repetições e menos carga e fica mais pesado a cada bloco de ~3 semanas: 12–15 RM (70% de 1RM) → 10–12 RM (75%) → 8–10 RM (80%) → 6–8 RM (85%) → 4–6 RM (90%), com deloads no meio e no fim.',
    serve:'Construir base técnica e resistência primeiro e depois converter em força e hipertrofia. Mostra o progresso de carga com clareza.',
    quem:'Iniciantes e intermediários, quem prefere rotina previsível e quem quer subir as cargas dos básicos (supino, agachamento, terra).',
    pro:'Fácil de entender e de medir; cada fase tem um objetivo claro.',
    contra:'As semanas finais, pesadas, acumulam fadiga; respeite o deload. Pouca variação pode cansar quem gosta de mudar.'},
  ondulatoria:{n:'Ondulatória semanal',tag:'Varia a intensidade',cor:'var(--carb)',
    oque:'Alterna a faixa de intensidade a cada semana em ondas de 3: moderada (8–12 RM, 70–80%, 20–22 séries/grupo), pesada (6–8 RM, 80–90%, 18–20 séries) e leve (12–20 RM, 60–70%, 22–24 séries, sem ir à falha). Usa séries de aquecimento, feeder sets e top sets.',
    serve:'Estimular o músculo com cargas diferentes, evitar estagnação e recuperar sem precisar de deloads longos (a semana leve já recupera).',
    quem:'Intermediários e avançados que sabem quanto levantam em cada faixa, estimam bem o RIR e têm rotina estável (sono, alimentação, frequência).',
    pro:'Muita variação de estímulo; bom para quem estagnou.',
    contra:'Exige percepção de carga: se você faz 6–8 podendo fazer 10, a ondulação se perde. Faltas e sono ruim atrapalham.'}
};
const PER_Q = [
  {k:'obj',q:'Qual é o seu objetivo principal agora?',o:[['recomp','Ganhar músculo e perder gordura ao mesmo tempo'],['hiper','Ganhar massa muscular (hipertrofia)'],['forca','Ficar mais forte nos básicos'],['cond','Saúde e condicionamento geral']]},
  {k:'exp',q:'Há quanto tempo você treina musculação sem parar?',o:[['ini','Menos de 6 meses ou voltando de uma pausa'],['int','De 6 meses a 3 anos'],['ava','Mais de 3 anos']]},
  {k:'rir',q:'Você sabe quanto de carga consegue em cada faixa de repetições e quantas reps ainda sobravam (RIR)?',o:[['sim','Sim, tenho boa noção'],['medio','Mais ou menos'],['nao','Não, ainda estou aprendendo']]},
  {k:'esp',q:'Você faz outro treino intenso além da musculação (CrossFit, corrida, natação, luta)?',o:[['muito','Sim, quase todo dia'],['as','Às vezes, 1–2x por semana'],['nao','Não']]},
  {k:'rot',q:'Como é a sua rotina de sono e de treino?',o:[['estavel','Estável: durmo bem e raramente falto'],['varia','Varia bastante: plantões, viagens, sono curto']]},
  {k:'var',q:'O que você prefere no treino?',o:[['previs','Rotina previsível, ver a carga subir passo a passo'],['variar','Variar estímulos e intensidades'],['tanto','Tanto faz']]}
];
function perScore(ans){
  const s={plano12:0,linear:0,ondulatoria:0}, why={plano12:[],linear:[],ondulatoria:[]};
  const add=(k,n,t)=>{s[k]+=n; if(n>0&&t) why[k].push(t);};
  ({recomp:()=>{add('plano12',3,'foi feita para recomposição corporal');},hiper:()=>{add('linear',1);add('ondulatoria',1,'varia o estímulo para hipertrofia');add('plano12',1);},
    forca:()=>{add('linear',2,'termina em blocos pesados, ideal para força');add('ondulatoria',1);},cond:()=>{add('plano12',1,'controla a fadiga');add('linear',1);}})[ans.obj]?.();
  ({ini:()=>{add('plano12',2,'começa com readaptação, bom para quem está voltando');add('linear',2,'é a forma mais simples de começar');add('ondulatoria',-2);},
    int:()=>{add('plano12',1);add('linear',1);add('ondulatoria',1);},ava:()=>{add('ondulatoria',3,'avançados respondem bem à variação de intensidade');}})[ans.exp]?.();
  ({sim:()=>{add('ondulatoria',2,'você já tem percepção de carga e RIR');},medio:()=>{add('linear',1);add('plano12',1);},nao:()=>{add('plano12',2,'mantém a faixa de reps fixa, mais fácil de acertar');add('linear',1);add('ondulatoria',-2);}})[ans.rir]?.();
  ({muito:()=>{add('plano12',3,'tem deloads e séries ajustadas para quem faz CrossFit/corrida/natação');add('ondulatoria',-1);},as:()=>{add('plano12',1);add('linear',1);},nao:()=>{add('linear',1);add('ondulatoria',1);}})[ans.esp]?.();
  ({estavel:()=>{add('ondulatoria',1);add('linear',1,'rotina estável segura a progressão');},varia:()=>{add('plano12',2,'tolera melhor uma rotina irregular');add('ondulatoria',-2);}})[ans.rot]?.();
  ({previs:()=>{add('linear',2,'você prefere ver a carga subir passo a passo');add('plano12',1);},variar:()=>{add('ondulatoria',2,'você gosta de variar');},tanto:()=>{}})[ans.var]?.();
  const order=['plano12','linear','ondulatoria'].sort((x,y)=>s[y]-s[x]||0);
  return {best:order[0],second:order[1],s,why};
}
function periodGuide(){
  const m=S.perMode||'entender';
  const tabs=`<div class="seg" role="group" aria-label="Como escolher">${[['entender','Como funciona'],['quiz','Me ajude a escolher'],['direto','Escolher direto']].map(([k,n])=>`<button aria-pressed="${m===k}" data-act="per-mode" data-id="${k}">${n}</button>`).join('')}</div>`;
  let body='';
  if(m==='entender'){
    body=`<div class="stack"><p><b>Periodização</b> é organizar o treino em fases. Em vez de repetir o mesmo treino para sempre, você muda de forma planejada o <b>volume</b> (quantas séries), a <b>intensidade</b> (carga, em % do seu máximo de 1 repetição, ou faixa de repetições) e o <b>esforço</b> (RIR: quantas repetições ainda sobrariam). Assim o corpo continua recebendo estímulo novo e tem tempo para se recuperar.</p>
      <div class="per-terms"><div><b>Macrociclo</b><span>o plano inteiro (ex.: 12 semanas)</span></div><div><b>Mesociclo</b><span>blocos de 2–6 semanas com um foco</span></div><div><b>Microciclo</b><span>a semana de treino</span></div><div><b>Deload</b><span>semana mais leve (metade das séries) para recuperar</span></div><div><b>RIR</b><span>repetições em reserva: RIR 2 = parou com 2 sobrando</span></div><div><b>Top set</b><span>a série mais pesada do exercício, perto da falha</span></div></div>
      <p class="small muted">Sinal de que está funcionando: as cargas ou as repetições sobem ao longo das semanas. Se a carga parar de subir, reduza o volume ou faça um deload.</p></div>
      <div class="grid g3">${Object.entries(PER_INFO).map(([k,x])=>perCard(k,x,false)).join('')}</div>`;
  } else if(m==='direto'){
    body=`<div class="grid g3">${Object.entries(PER_INFO).map(([k,x])=>perCard(k,x,true)).join('')}</div>`;
  } else {
    const st=S.perQuiz=S.perQuiz||{i:0,ans:{}};
    if(st.i<PER_Q.length){
      const q=PER_Q[st.i];
      body=`<div class="quiz"><div class="row between"><span class="small muted">Pergunta ${st.i+1} de ${PER_Q.length}</span>${st.i>0?`<button class="btn ghost sm" data-act="perq-back">Voltar</button>`:''}</div>
        <div class="bar"><i style="width:${st.i/PER_Q.length*100}%"></i></div><h3>${q.q}</h3>
        <div class="qopts">${q.o.map(([v,t])=>`<button class="qopt" aria-pressed="${st.ans[q.k]===v}" data-act="perq" data-k="${q.k}" data-v="${v}">${t}</button>`).join('')}</div></div>`;
    } else {
      const r=perScore(st.ans), b=PER_INFO[r.best], s2=PER_INFO[r.second];
      body=`<div class="quiz-res"><span class="small muted">Recomendação para você</span><h3 style="font-size:1.6rem">${b.n}</h3>${chip(b.tag,b.cor)}
        <p>${b.serve}</p>${r.why[r.best].length?`<div class="note small"><b>Por quê:</b> ${[...new Set(r.why[r.best])].join('; ')}.</div>`:''}
        <div class="row"><label class="f" style="max-width:200px">Começar em<input type="date" id="perQuizStart" value="${pISO(today()).getDay()===1?today():addDays(mondayOf(today()),7)}"></label>
          <button class="btn primary" data-act="per-apply" data-id="${r.best}">Usar ${b.n}</button><button class="btn" data-act="per-apply" data-id="${r.second}">Prefiro a 2ª opção: ${s2.n}</button></div>
        <button class="btn ghost sm" data-act="perq-reset">Refazer perguntas</button></div>`;
    }
  }
  return `<section class="card"><div class="row between"><h3>Escolher a periodização</h3>${tabs}</div>${body}</section>`;
}
function perCard(k,x,pick){
  const on=S.cfg.period.preset===k;
  return `<div class="per-card ${on?'on':''}" style="--c:${x.cor}"><div class="row between"><b class="per-n">${x.n}</b>${on?chip('em uso','var(--good)'):''}</div>${chip(x.tag,x.cor)}
    <div><h4>Como funciona</h4><p class="small">${x.oque}</p></div><div><h4>Para que serve</h4><p class="small">${x.serve}</p></div><div><h4>Para quem</h4><p class="small">${x.quem}</p></div>
    <div class="small"><span style="color:var(--good);font-weight:700">+</span> ${x.pro}<br><span style="color:var(--warn);font-weight:700">!</span> ${x.contra}</div>
    ${pick?`<button class="btn ${on?'':'primary'}" data-act="per-apply" data-id="${k}">${on?'Reiniciar este modelo':'Usar este modelo'}</button>`:''}</div>`;
}

/* ----- Progresso ----- */
AFTER.progresso = ()=>{ AFTER_PESO(); chartBody('chCint','cintura'); };
function adjustSuggestion(a0,a1,w0,w1){
  if(!a0||!a1) return {txt:'Registre o peso por pelo menos duas semanas para receber a recomendação de ajuste.'};
  const dw=a1-a0, dc=w0&&w1? w1.cintura-w0.cintura : null;
  if(dw<-0.7) return {warn:true,txt:`Peso caindo ${fmt(-dw,2)} kg/semana. Se as cargas também estão caindo, adicione 150–200 kcal (40–50 g de carboidrato) nos dias de treino forte.`};
  if(dw<=-0.2) return {txt:`Peso caindo ${fmt(-dw,2)} kg/semana${dc!==null?` e cintura ${dc<0?'diminuindo':'estável'}`:''}. Está no ritmo: mantenha o plano.`};
  if(dw>0.3 && (dc===null||dc>0)) return {warn:true,txt:`Peso subindo ${fmt(dw,2)} kg/semana${dc!==null?' com cintura aumentando':''}. Retire 150 kcal dos dias mais leves.`};
  if(Math.abs(dw)<0.2 && dc!==null && Math.abs(dc)<0.5) return {warn:true,txt:'Peso e cintura parados. Se isso durar 3 semanas, retire 150 kcal (35–40 g de carboidrato) dos dias mais leves.'};
  return {txt:`Variação de ${dw>0?'+':''}${fmt(dw,2)} kg/semana. Continue registrando e compare a cintura.`};
}

/* ----- Perfil & parceiros ----- */
VIEWS.perfil = ()=>{
  const p=S.profile, bm=bmrAll(), pro=p.pro||{};
  return `<div class="head"><div><h2>Perfil</h2><div class="sub">Seus dados, a equação de TMB, atividades e backup.</div></div></div>
  <section class="card"><h3>Seus dados</h3>${profileForm()}
    <div class="row" style="gap:24px">${stat(fmt(bmr()),' kcal','TMB · '+bm[bmrKey()].n)}${stat(lbm()?fmt(lbm(),1):'—',' kg','massa magra')}${stat(fmt(p.peso/((p.altura/100)**2),1),'','IMC')}</div></section>
  <section class="card"><h3>Atividades e gasto (METs)</h3><div class="met-box">
      <p><b>MET</b> (equivalente metabólico) mede quanto uma atividade gasta de energia em comparação com o repouso. <b>1 MET</b> é o que o corpo gasta parado, sentado: cerca de <b>1 kcal por kg de peso por hora</b>. Uma atividade de <b>8 METs</b> gasta 8 vezes isso.</p>
      <div class="met-scale">${[['1','Repouso, sentado'],['2,5','Alongamento, mobilidade'],['3,5','Caminhada leve'],['5','Musculação'],['7','CrossFit, bicicleta'],['8–10','Corrida 8–10 km/h'],['11+','Corrida rápida']].map(([m,n])=>`<div><b class="num">${m}</b><span>${n}</span></div>`).join('')}</div>
      <p class="small">No app, o gasto de cada treino é calculado assim: <b>(MET − 1) × peso (kg) × horas</b>. Tiramos 1 MET porque o gasto em repouso já entra na TMB e no fator de rotina; assim não contamos duas vezes.</p>
      <p class="small">Exemplo com o seu peso (${fmt(S.profile.peso,1)} kg): 60 min de musculação (5 METs) = (5 − 1) × ${fmt(S.profile.peso,1)} × 1 ≈ <b>${fmt(4*S.profile.peso)} kcal</b>.</p>
      <p class="small muted">Os valores vêm do Compêndio de Atividades Físicas (Ainsworth, 2011) e são médias. Treino mais intenso (pouco descanso, circuito, WOD puxado) merece MET maior; treino leve, menor. Ajuste o MET e a duração típica de cada atividade abaixo.</p></div>
    <div class="tbl-wrap"><table><thead><tr><th>Atividade</th><th class="n">MET</th><th class="n">Minutos</th><th class="n">kcal</th></tr></thead><tbody>${S.cfg.acts.map((a,i)=>`<tr><td><input type="text" id="an-${i}" data-bind="act.nome" data-i="${i}" value="${esc(a.nome)}"></td><td class="n"><input type="number" id="am-${i}" data-bind="act.met" data-i="${i}" value="${a.met}" step="0.1" style="width:80px"></td><td class="n"><input type="number" id="ami-${i}" data-bind="act.min" data-i="${i}" value="${a.min}" style="width:80px"></td><td class="n">${fmt(actKcal(a.id))}</td></tr>`).join('')}</tbody></table></div>
    <button class="btn sm" data-act="act-new">+ Atividade</button></section>
  <section class="card link-card"><div><h3>Aluno & profissional</h3><p class="small muted">${p.turma?`Você é acompanhado por <b>${esc(p.turma.nome)}</b>.`:(p.pro&&p.pro.turma?`Sua turma: código <b class="num">${esc(p.pro.turma)}</b>.`:'Entre na turma do seu professor ou nutricionista, ou crie a sua para acompanhar alunos.')}</p></div><button class="btn primary" data-act="go-pro">Abrir</button></section>
  <section class="card"><h3>Backup</h3><p class="small muted">Status: ${Store.mode==='cloud'?'seus dados ficam salvos na sua conta e só você os vê.':'seus dados ficam salvos neste aparelho. Faça backup antes de trocar de celular.'}</p>
    <div class="row"><button class="btn" data-act="export">Exportar meus dados</button><label class="btn">Importar backup<input type="file" id="impFile" accept="application/json,.json" hidden></label><button class="btn danger" data-act="reset-all">Apagar tudo</button></div>
    <div id="expOut"></div></section>
  <p class="small muted">Os números do app são estimativas a partir dos dados informados. Avaliação de composição corporal e acompanhamento de nutricionista e profissional de educação física permitem refinar tudo. Em caso de dor, lesão ou condição de saúde, procure atendimento.</p>`;
};
AFTER.perfil = ()=>{
  const f=$('#impFile'); f&&f.addEventListener('change',importFile);
};
function profileForm(){
  const p=S.profile;
  return `<div class="fgrid">
    <label class="f">Nome<input type="text" id="pNome" data-bind="profile.nome" value="${esc(p.nome)}"></label>
    <label class="f">Sexo<select id="pSexo" data-bind="profile.sexo">${p.sexo?'':'<option value="" selected disabled>Selecione</option>'}<option value="m" ${p.sexo==='m'?'selected':''}>Masculino</option><option value="f" ${p.sexo==='f'?'selected':''}>Feminino</option></select></label>
    <label class="f">Idade<input type="number" id="pIdade" data-bind="profile.idade" value="${p.idade}"></label>
    <label class="f">Altura (cm)<input type="number" id="pAlt" data-bind="profile.altura" value="${p.altura}"></label>
    <label class="f">Peso (kg)<input type="number" id="pPeso" data-bind="profile.peso" value="${p.peso}" step="0.1"></label>
    <label class="f">% de gordura<input type="number" id="pBf" data-bind="profile.bf" value="${p.bf||''}" step="0.1" placeholder="opcional"></label>
    <label class="f">Nível de treino<select id="pNivel" data-bind="profile.nivel">${Object.entries(D.VOLUME_NIVEL).map(([k,v])=>`<option value="${k}" ${p.nivel===k?'selected':''}>${v.n}</option>`).join('')}</select></label>
    <label class="f">Objetivo<select id="pObj" data-bind="profile.objetivo">${[['cutting','Perder gordura'],['recomp','Recomposição'],['manter','Manter'],['bulking','Ganhar massa']].map(([k,n])=>`<option value="${k}" ${p.objetivo===k?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="f">Rotina fora do treino<select id="pFator" data-bind="profile.fator">${[[1.2,'Sentado a maior parte do dia'],[1.3,'Leve, alguns deslocamentos'],[1.4,'Ativo (militar, em pé)'],[1.5,'Muito ativo / braçal']].map(([v,n])=>`<option value="${v}" ${+p.fator===v?'selected':''}>${n} (×${String(v).replace('.',',')})</option>`).join('')}</select></label>
    <label class="f">Equação da TMB<select id="pEq" data-bind="profile.eq">${[['auto','Automática'],['katch','Katch-McArdle'],['mifflin','Mifflin-St Jeor'],['harris','Harris-Benedict'],['cunningham','Cunningham']].map(([k,n])=>`<option value="${k}" ${p.eq===k?'selected':''}>${n}</option>`).join('')}</select></label>
  </div>`;
}

/* ----- Configurações ----- */
const ACCENTS=[['dourado','Dourado','#9C7A3C','#C9A96B'],['azul','Azul','#1F6FD1','#4C9BFF'],['vermelho','Vermelho','#C8372B','#F06450'],['verde','Verde','#23855A','#4CC07F'],['roxo','Roxo','#6A4BD1','#9F86FF'],
  ['laranja','Laranja','#C9620F','#F59A45'],['rosa','Rosa','#C2367A','#F27AB3'],['grafite','Grafite','#2F3B47','#B8C6D3'],['ciano','Ciano','#0E8A9A','#3CC6D6']];
const FONTS={
  padrao:{n:'Premium — Outfit + Manrope',d:'"Outfit","Avenir Next",system-ui,sans-serif',b:'"Manrope",system-ui,sans-serif',q:'family=Outfit:wght@300;400;500;600;700&family=Manrope:wght@400;500;600;700'},
  esportiva:{n:'Esportiva — Barlow',d:'"Barlow Condensed","Arial Narrow",Arial,sans-serif',b:'"Barlow",system-ui,sans-serif',q:'family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700'},
  forte:{n:'Forte — Oswald + Source Sans',d:'"Oswald","Arial Narrow",sans-serif',b:'"Source Sans 3",system-ui,sans-serif',q:'family=Oswald:wght@500;600;700&family=Source+Sans+3:wght@400;600;700'},
  impacto:{n:'Impacto — Bebas Neue + Nunito Sans',d:'"Bebas Neue",Impact,sans-serif',b:'"Nunito Sans",system-ui,sans-serif',q:'family=Bebas+Neue&family=Nunito+Sans:wght@400;600;700'},
  arredondada:{n:'Arredondada — Nunito',d:'"Nunito",system-ui,sans-serif',b:'"Nunito",system-ui,sans-serif',q:'family=Nunito:wght@400;600;700;800'},
  classica:{n:'Clássica — Roboto Condensed + Roboto',d:'"Roboto Condensed","Arial Narrow",sans-serif',b:'"Roboto",system-ui,sans-serif',q:'family=Roboto+Condensed:wght@600;700&family=Roboto:wght@400;500;700'},
  sistema:{n:'Do sistema (mais leve)',d:'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',b:'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',q:''}
};
const SIZES={p:['Pequeno',13],m:['Médio',14],g:['Grande',15.5],xg:['Extra grande',17]};
function defaultUI(){ return {v:2,theme:'sistema',accent:'dourado',custom:'',font:'padrao',size:'m',motion:true,vibrar:true,startTab:'hoje'}; }
let hostTheme;
function applyUI(){
  const u=S.profile.ui, root=document.documentElement;
  S.applyingTheme=true; root.setAttribute('data-theme','dark'); setTimeout(()=>{S.applyingTheme=false;},0);
  ['--accent','--accent-soft','--accent-ink','--f-display','--f-body'].forEach(k=>root.style.removeProperty(k));
  root.style.fontSize='';
  root.classList.toggle('no-motion',!u.motion);
}
const HELP = [
  {tab:'hoje',t:'Hoje',r:'O painel do seu dia.',p:['Os três anéis no topo mostram o dia: treinos feitos, calorias consumidas e água. Toque num anel para ir à seção.','Refeições de hoje: marque ✓ ao comer e troque a opção do cardápio ali mesmo.','Peso: toque em Lançar peso para registrar sem sair da página.','Mostra os treinos agendados para hoje (academia, corrida, CrossFit, natação e caminhada), com o botão Iniciar e a caixinha para marcar como feito.','Macros de hoje: as calorias e os gramas de proteína, carbo e gordura que você já comeu, somando as refeições marcadas na aba Dieta.','Água: o anel do dia, com botões rápidos para registrar copos.','Calendário semanal ou mensal: toque num dia para planejar treinos e escolher o cardápio daquele dia.','Gráfico da semana: gasto estimado × ingestão planejada.']},
  {tab:'treinar',t:'Treinar',r:'Onde você executa o treino e registra cada série.',p:['Treino por foto: fotografe a ficha, o quadro do box ou um print (ou cole o texto). O app lê no próprio celular, reconhece exercícios, séries, repetições e descanso e abre uma tela para você conferir e corrigir antes de salvar como ficha ou já começar o treino.','Lançar treino do relógio: escolha o tipo (corrida, CrossFit, musculação…), informe duração e as métricas que o relógio mostrou (distância, calorias, FC média e máxima, Training Effect, VO₂máx…). As calorias do relógio passam a contar no gasto do dia.','No topo aparece a ficha de hoje (ou a próxima da rotação). Toque em Iniciar treino.','Em cada exercício, anote carga (kg), repetições e RIR e toque no ✓ para marcar a série. O cronômetro de descanso começa sozinho.','A linha verde mostra a sugestão de carga: quando você bate o topo da faixa de repetições em todas as séries, o app manda subir 2–5% (progressão dupla).','As séries já vêm ajustadas pela semana da periodização (ex.: no deload, metade das séries).','Ao concluir, o treino vai para o histórico, marca a agenda como feito e avisa se você bateu recorde.']},
  {tab:'montar',t:'Montar treino',r:'Crie e edite as suas fichas.',p:['Toque numa ficha para editar nome, cor e exercícios. Em cada exercício ajuste séries, faixa de repetições, RIR e descanso.','⇄ troca o exercício, ↑ muda a ordem, ✕ remove. "Prioritário" recebe +1 série nas semanas de intensificação.','Rotação automática: a ordem das fichas usada para preencher a agenda (ex.: Push → Pull → Legs).','Gráfico de séries por grupo muscular: compara o volume da semana com o limite do seu nível.','Biblioteca: todos os exercícios com ilustração animada, músculos e execução. Você pode criar exercícios e adicionar fotos.']},
  {tab:'agenda',t:'Agenda',r:'Planeje os treinos no visual diário, semanal ou mensal.',p:['Diário: tudo de um dia — tipo de dia, treinos, cardápio, macros e água.','Semanal: os 7 dias lado a lado. "Preencher com a semana padrão" monta a semana com a rotação; "Salvar esta semana como padrão" guarda a sua rotina.','Mensal: o mês inteiro com bolinhas coloridas por treino. Toque num dia para abrir o diário.','O tipo de dia (A, B, C) define a meta de calorias e o cardápio. O app escolhe sozinho pelos treinos do dia, mas você pode trocar.']},
  {tab:'dieta',t:'Dieta & macros',r:'Calorias, macros e cardápios.',p:['Diário alimentar: toque em + Alimento, busque no banco (mais de 170 alimentos) ou crie o seu, informe os gramas já pesados e o app calcula kcal, proteína, carboidrato e gordura. Repetir de ontem copia uma refeição inteira.','Cardápio base: plano de referência por tipo de dia. Carregar cardápio base traz o modelo pronto, que você pode editar.','TMB: calculada por 4 equações. Com % de gordura, a referência é a Katch-McArdle.','Tipos de dia: cada um tem as atividades que somam ao gasto, um ajuste calórico (déficit ou superávit) e a proteína e gordura por kg. O carboidrato é o que sobra (ciclo de carboidratos).','Cardápio: cada refeição tem opções. Escolha uma e, no dia de hoje, marque ✓ quando comer.','✎ edita a refeição e as opções; você pode criar as suas. Há tabela de substituições e suplementos com evidência.']},
  {tab:'agua',t:'Hidratação',r:'Meta de água do dia.',p:['Meta = peso × ml por kg + minutos de treino × ml por hora + extra em clima quente. Tudo personalizável.','O anel mostra quanto da meta você já bebeu. Use os botões para somar copos.']},
  {tab:'rps',t:'RPs',r:'Seus recordes pessoais.',p:['Levantamentos (1RM), WODs de referência (Fran, Murph…), ginástica e corrida: toque no cartão para registrar e ver o histórico.','"Calculados dos treinos": o app estima o 1RM das suas séries registradas e mostra a evolução por exercício.','Calculadora de % de 1RM: informe carga × repetições e veja a carga de cada faixa.']},
  {tab:'period',t:'Periodização',r:'Organiza o treino em fases.',p:['Como funciona: explica volume, intensidade, RIR, deload e os três modelos.','Me ajude a escolher: 6 perguntas e o app recomenda o modelo.','A semana atual aparece em Hoje e em Treinar, e o app ajusta as séries automaticamente.','Você pode editar cada semana (fase, séries, RIR, faixa de repetições).']},
  {tab:'progresso',t:'Progresso',r:'Peso, medidas e ajustes.',p:['Lance o peso (de preferência ao acordar). O gráfico mostra a curva e a média de 7 dias.','"+ Cintura, FC e sono" registra as outras medidas.','Ajuste recomendado: com 2 semanas de dados, o app sugere mexer nas calorias seguindo as regras do plano.','Defina sua meta de peso: ela aparece como linha tracejada no gráfico.']},
  {tab:'perfil',t:'Perfil',r:'Seus dados, gasto das atividades e backup.',p:['Dados: idade, altura, peso, % de gordura, nível, objetivo e rotina. Tudo recalcula a partir daqui.','Atividades e METs: ajuste o gasto de cada tipo de treino.','Backup: exporte e importe seus dados.']},
  {tab:'pro',t:'Aluno & profissional',r:'Liga o aluno ao professor, nutricionista ou academia para acompanhar a evolução e receber prescrições.',p:['Profissional: escolha Sou profissional, preencha seus dados e crie a turma. Você recebe um código de 6 letras.','Mande o link do app e o código aos alunos. Cada aluno escolhe Sou aluno, digita o código e autoriza o compartilhamento.','Na lista de alunos aparecem peso (com gráfico), treinos da semana, água e refeições marcadas. Bolinha verde: em dia; amarela: atenção; cinza: sem atualizar há mais de 7 dias.','Para prescrever: monte as fichas, a dieta e a periodização no seu próprio app, abra o aluno e toque em Enviar. Escolha o que vai e escreva uma mensagem.','O aluno vê o aviso na tela Hoje, confere e aplica. Se não gostar, desfaz na mesma aba. O resumo dele se atualiza sozinho a cada registro.','O aluno pode mandar um recado (dor, dúvida, pedido de troca). Ele aparece no cartão do aluno para o profissional.','Funciona pelo link do Claude com login e acesso de Colaborador. Na versão do GitHub, use o backup.']}
];
const HELP_BY_TAB = new Proxy({},{get:(o,k)=>HELP.find(h=>h.tab===(k==='evolucao'?(S.evoSub||'rps'):k))});
const GLOSS = [
  ['TMB','Taxa metabólica basal: o que o corpo gasta em repouso total, só para se manter vivo.'],
  ['GET','Gasto energético total do dia: TMB + rotina + treinos.'],
  ['MET','Equivalente metabólico: quantas vezes a atividade gasta mais que o repouso.'],
  ['Déficit / superávit','Comer menos (perder gordura) ou mais (ganhar massa) do que o gasto.'],
  ['Macros','Proteína, carboidrato e gordura, em gramas. 1 g de proteína ou carbo = 4 kcal; 1 g de gordura = 9 kcal.'],
  ['1RM','A carga máxima para 1 repetição completa. O app estima a partir de outras séries.'],
  ['RIR','Repetições em reserva: quantas ainda sobrariam ao parar a série. RIR 0 = falha.'],
  ['Progressão dupla','Primeiro aumente as repetições até o topo da faixa; depois suba a carga e volte ao início da faixa.'],
  ['Deload','Semana mais leve (metade das séries) para o corpo se recuperar.'],
  ['Volume','Quantidade de trabalho: séries por grupo muscular na semana, ou carga × repetições.'],
  ['Ciclo de carboidratos','Mais carbo nos dias de treino forte, menos nos dias leves.']
];
function helpView(){
  return `<section class="card"><h3>Navegando no app</h3><ul class="ch-ol">
      <li><b>Barra de baixo</b> (no celular) ou <b>abas do topo</b> (no computador): Hoje, Treino, Dieta, Progresso e Você.</li>
      <li>Em <b>Treino</b>, <b>Dieta</b> e <b>Você</b>, as páginas da seção aparecem como botões logo abaixo do título do app (ex.: Treinar, Fichas, Agenda, Periodização, Recordes).</li>
      <li>O botão <b>+</b> no canto da tela abre os registros rápidos: iniciar treino, beber água, lançar peso, marcar refeição, medidas e agendar treino.</li>
      <li>O botão <b>?</b> no topo explica a página em que você está.</li></ul></section>
    <section class="card"><h3>Primeiros passos</h3><ol class="ch-ol">
      <li><b>Perfil & parceiros:</b> preencha seus dados (peso, altura, % de gordura, objetivo). <button class="btn ghost sm" data-act="go" data-id="perfil">Abrir</button></li>
      <li><b>Montar treino:</b> confira as fichas e a rotação. <button class="btn ghost sm" data-act="go" data-id="montar">Abrir</button></li>
      <li><b>Agenda:</b> toque em "Preencher com a semana padrão". <button class="btn ghost sm" data-act="go" data-id="agenda">Abrir</button></li>
      <li><b>Dieta:</b> confira as metas de cada tipo de dia e escolha as opções do cardápio. <button class="btn ghost sm" data-act="go" data-id="dieta">Abrir</button></li>
      <li><b>Todo dia:</b> abra Hoje, inicie o treino, marque as refeições, registre a água e lance o peso 3–4x por semana.</li></ol></section>
    <section class="card"><h3>Como funciona cada parte</h3><div class="help-list">${HELP.map(h=>`<details class="help-it"><summary><b>${h.t}</b><span class="small muted">${h.r}</span></summary><ul class="small ch-ol">${h.p.map(x=>`<li>${x}</li>`).join('')}</ul><button class="btn sm" data-act="go" data-id="${h.tab}">Ir para ${h.t}</button></details>`).join('')}</div></section>
    <section class="card"><h3>Glossário</h3><div class="var-list">${GLOSS.map(([t,d])=>`<div><b>${t}</b><span class="small muted">${d}</span></div>`).join('')}</div></section>
    <section class="card"><h3>Dúvidas frequentes</h3>
      <details class="faq"><summary>Onde ficam meus dados?</summary><p class="small">Com login (conta Claude), na nuvem, separados por pessoa e visíveis só para você. Sem login, apenas neste aparelho: faça backup em Perfil & parceiros.</p></details>
      <details class="faq"><summary>Como compartilho o app com alguém?</summary><p class="small">Pelo menu Compartilhar do link. Para a pessoa salvar os próprios dados, dê acesso de Colaborador.</p></details>
      <details class="faq"><summary>Os números de calorias são exatos?</summary><p class="small">São estimativas com margem de ~10%. Acompanhe peso e cintura por 2–3 semanas e use o "Ajuste recomendado" da aba Progresso para calibrar.</p></details>
      <details class="faq"><summary>Errei um lançamento. Como corrijo?</summary><p class="small">Peso e medidas: botão Excluir na tabela de Registros (Progresso). Treinos: Treinar → Histórico → Ver → Excluir registro. RPs: toque no cartão e exclua no histórico.</p></details>
      <details class="faq"><summary>Posso usar só uma parte do app?</summary><p class="small">Sim. Cada aba funciona sozinha; em Configurações você escolhe em qual aba o app abre.</p></details>
    </section>`;
}
function googleBox(){
  const C=window.EVO_CLOUD, A=window.EVO_AUTH;
  if(C&&C.configured){ if(A&&A.user) return `<div class="row"><span class="small muted">Entrou com Google${A.user.email?' · '+esc(A.user.email):''}</span><button class="btn ghost sm" data-act="evo-logout">Sair da conta</button></div>`; return `<button class="btn primary" data-act="evo-login">Entrar com Google</button>`; }
  if(C) return '<div class="note small">Login com Google desativado nesta cópia: o arquivo firebase-config.js ainda não foi preenchido (veja o README).</div>';
  return `<div class="note small"><b>Entrar com Google:</b> nesta versão o login é feito pela conta Claude de quem abre o link, que já identifica cada pessoa e guarda os dados dela separados. O botão "Entrar com Google" entra quando o app for publicado como aplicativo próprio (com Firebase Authentication, por exemplo), junto com o domínio e os termos de uso.</div>
    <button class="btn" disabled title="Disponível na versão de aplicativo próprio"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Entrar com Google (em breve)</button>`;
}
VIEWS.config = ()=>{
  const u=S.profile.ui, cloud=Store.mode==='cloud', m=S.cfgMode||'config';
  const top=`<div class="head"><div><h2>Configurações & ajuda</h2><div class="sub">${m==='ajuda'?'Como usar cada parte do app, com explicações.':'Aparência, conta e preferências do app. As escolhas ficam salvas no seu perfil.'}</div></div><div class="seg" role="group">${[['config','Configurações'],['ajuda','Ajuda']].map(([k,n])=>`<button aria-pressed="${m===k}" data-act="cfg-mode" data-id="${k}">${n}</button>`).join('')}</div></div>`;
  if(m==='ajuda') return top+helpView();
  return top+`
  <section class="card"><h3>Conta</h3>
    <div class="acct"><div class="avatar">${esc(((Store.meName||S.profile.nome||'?').trim()[0]||'?').toUpperCase())}</div>
      <div class="stack" style="gap:2px;min-width:0"><b>${cloud?esc(Store.meName||S.profile.nome||'Conectado'):'Sem login'}</b><span class="small muted">${cloud?(window.EVO_AUTH&&window.EVO_AUTH.user?'Conectado com a sua conta Google.':'Conectado com a sua conta Claude.')+' Seus dados ficam salvos na nuvem, só você os vê, e aparecem em qualquer aparelho em que você abrir o app.':(Store.standalone?'Versão independente: os dados ficam salvos neste navegador. Use Exportar/Importar em Perfil & parceiros para levar seus dados para outro aparelho.':'Você está usando o app sem login: os dados ficam salvos só neste aparelho. Abra o app pelo link enquanto estiver conectado à sua conta Claude para salvar na nuvem.')}</span></div>
      ${chip(cloud?'Na nuvem':'Neste aparelho',cloud?'var(--good)':'var(--warn)')}</div>
    ${googleBox()}
  </section>
  <section class="card"><h3>Preferências</h3>
    <label class="row" style="flex-wrap:nowrap"><input type="checkbox" id="uiMotion" ${u.motion?'checked':''}> Animações (ilustrações dos exercícios e transições)</label>
    <label class="row" style="flex-wrap:nowrap"><input type="checkbox" id="uiVib" ${u.vibrar?'checked':''}> Vibrar no fim do descanso e nas comemorações (celular)</label>
    <label class="f" style="max-width:320px">Abrir o app na aba<select id="uiStart"><option value="ultima" ${u.startTab==='ultima'?'selected':''}>Última aba usada</option>${TABS.filter(t=>t.id!=='rps'&&t.id!=='period'&&t.id!=='config').map(t=>`<option value="${t.id}" ${u.startTab===t.id?'selected':''}>${t.n}</option>`).join('')}</select></label>
    </section>`;
};
AFTER.config = ()=>{
  const c=$('#uiCustom'); c&&c.addEventListener('input',e=>{ S.profile.ui.accent='custom'; S.profile.ui.custom=e.target.value; applyUI(); });
  c&&c.addEventListener('change',()=>{ save('profile'); render(); });
  const m=$('#uiMotion'); m&&m.addEventListener('change',e=>{ S.profile.ui.motion=e.target.checked; applyUI(); save('profile'); });
  const v=$('#uiVib'); v&&v.addEventListener('change',e=>{ S.profile.ui.vibrar=e.target.checked; save('profile'); });
  const s=$('#uiStart'); s&&s.addEventListener('change',e=>{ S.profile.ui.startTab=e.target.value; save('profile'); toast('Aba inicial salva'); });
};

/* ---------- gráficos ---------- */
function baseOpts(extra){
  const ink=css('--muted'), grid=css('--line');
  return Object.assign({responsive:true,maintainAspectRatio:false,animation:{duration:500},
    plugins:{legend:{labels:{color:ink,boxWidth:12,font:{family:'Barlow',size:12}}},tooltip:{titleFont:{family:'Barlow'},bodyFont:{family:'IBM Plex Mono'}}},
    scales:{x:{ticks:{color:ink,font:{family:'Barlow'}},grid:{display:false},border:{color:grid}},y:{ticks:{color:ink,font:{family:'IBM Plex Mono',size:11}},grid:{color:grid},border:{display:false}}}},extra||{});
}
function mkChart(id,cfg){ const c=document.getElementById(id); if(!c||!window.Chart) return; S.chart[id]=new Chart(c,cfg); }
function chartWeek(id,ws){
  const days=Array.from({length:7},(_,i)=>addDays(ws,i));
  mkChart(id,{type:'bar',data:{labels:days.map(d=>DOW[pISO(d).getDay()]+' '+dshort(d)),datasets:[
    {label:'Gasto',data:days.map(d=>Math.round(dayExp(d))),backgroundColor:css('--line'),borderRadius:5},
    {label:'Ingestão planejada',data:days.map(d=>typeTarget(dtById(dayTypeOf(d))).kcal),backgroundColor:css('--accent'),borderRadius:5}]},options:baseOpts()});
}
function macroPremium(tg,dt){
  const kc=[['Proteína','p',tg.p*4,tg.p,`${fmt(dt.pKg,1)} g/kg`],['Carboidrato','c',tg.c*4,tg.c,`${fmt(tg.c/(num(S.profile.peso)||1),1)} g/kg`],['Gordura','g',tg.g*9,tg.g,`${fmt(dt.gKg,1)} g/kg`]];
  const tot=kc.reduce((s,x)=>s+x[2],0)||1, R=78, C=2*Math.PI*R, gap=3; let acc=0;
  const arcs=kc.map(([n,k,v],i)=>{ const len=Math.max(0,v/tot*C-gap), off=-acc; acc+=v/tot*C;
    return `<circle class="mp-arc mp-${k}" r="${R}" cx="100" cy="100" style="--len:${len.toFixed(1)};--c:${C.toFixed(1)};--d:${i*0.12}s" stroke-dasharray="${len.toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>`; }).join('');
  return `<div class="mp-wrap">
    <div class="mp-ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="mp-track" r="${R}" cx="100" cy="100"/><circle class="mp-inner" r="62" cx="100" cy="100"/><g transform="rotate(-90 100 100)">${arcs}</g></svg>
      <div class="mp-center"><span class="mp-k num">${fmt(tg.kcal)}</span><span class="mp-u">kcal / dia</span></div></div>
    <div class="mp-rows">${kc.map(([n,k,v,g,sub])=>{ const pc=Math.round(v/tot*100); return `<div class="mp-row"><div class="mp-top"><span class="mp-n"><i class="mp-dot mp-${k}"></i>${n}</span><span class="mp-g num">${g}<small> g</small></span></div>
      <div class="mp-bar"><i class="mp-${k}" style="width:${pc}%"></i></div><div class="mp-s"><span>${sub}</span><span>${fmt(v)} kcal · ${pc}%</span></div></div>`; }).join('')}</div></div>`;
}
function chartMacro(id,tg){
  mkChart(id,{type:'doughnut',data:{labels:['Proteína','Carboidrato','Gordura'],datasets:[{data:[tg.p*4,tg.c*4,tg.g*9],backgroundColor:[css('--prot'),css('--carb'),css('--fat')],borderColor:css('--surface'),borderWidth:3}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${fmt(c.raw)} kcal (${Math.round(c.raw/tg.kcal*100)}%)`}}}}});
}
function chartBmr(id){
  const b=Object.values(bmrAll()).filter(x=>x.v);
  mkChart(id,{type:'bar',data:{labels:b.map(x=>x.n.split(' (')[0]),datasets:[{label:'kcal/dia',data:b.map(x=>Math.round(x.v)),backgroundColor:b.map(x=>x===bmrAll()[bmrKey()]?css('--accent'):css('--line')),borderRadius:5}]},options:baseOpts({indexAxis:'y',plugins:{legend:{display:false}}})});
}
function chartWater(id){
  const days=Array.from({length:14},(_,i)=>addDays(today(),i-13));
  mkChart(id,{type:'bar',data:{labels:days.map(dshort),datasets:[{label:'Bebido (L)',data:days.map(d=>((dayRec(d)||{}).water||0)/1000),backgroundColor:css('--water'),borderRadius:4},{type:'line',label:'Meta (L)',data:days.map(d=>waterGoal(d)/1000),borderColor:css('--muted'),borderDash:[4,4],pointRadius:0,borderWidth:1.5}]},options:baseOpts()});
}
function chartPr(id,exId){
  const h=exHistory(exId);
  mkChart(id,{type:'line',data:{labels:h.map(x=>dshort(x.date)),datasets:[{label:'1RM estimado (kg)',data:h.map(x=>+x.best.toFixed(1)),borderColor:css('--accent'),backgroundColor:css('--accent-soft'),fill:true,tension:.3,pointRadius:3},{label:'Maior carga (kg)',data:h.map(x=>x.top),borderColor:css('--prot'),pointRadius:2,tension:.3}]},options:baseOpts()});
}
function chartBody(id,field){
  const E=S.body.entries.filter(e=>e[field]).sort((a,b)=>a.date.localeCompare(b.date)); if(!E.length) return;
  const ma=E.map((e,i)=>{const L=E.filter(x=>x.date<=e.date&&x.date>=addDays(e.date,-6));return +(L.reduce((s,x)=>s+x[field],0)/L.length).toFixed(2)});
  mkChart(id,{type:'line',data:{labels:E.map(e=>dshort(e.date)),datasets:[{label:field==='peso'?'Peso (kg)':'Cintura (cm)',data:E.map(e=>e[field]),borderColor:css('--muted'),pointRadius:3,showLine:false},{label:'Média 7 dias',data:ma,borderColor:field==='peso'?css('--accent'):css('--prot'),tension:.35,pointRadius:0,borderWidth:2.5}]},options:baseOpts()});
}
function chartPeriod(id){
  const W=S.cfg.period.weeks, vol=W.map(w=>({minus1:.8,normal:1,half:.5,plus1:1.15}[w.mode]||1)*100), rir=W.map(w=>{const m=String(w.rir).match(/\d+(?:[.,]\d+)?/g);return m?m.map(Number).reduce((a,b)=>a+b,0)/m.length:2;});
  mkChart(id,{data:{labels:W.map((_,i)=>'S'+(i+1)),datasets:[{type:'bar',label:'Volume relativo (%)',data:vol,backgroundColor:css('--accent-soft'),borderColor:css('--accent'),borderWidth:1,borderRadius:4,yAxisID:'y'},{type:'line',label:'RIR médio',data:rir,borderColor:css('--prot'),pointRadius:3,tension:.2,yAxisID:'y1'}]},
    options:baseOpts({scales:{x:{ticks:{color:css('--muted')},grid:{display:false}},y:{min:0,max:130,ticks:{color:css('--muted')},grid:{color:css('--line')}},y1:{position:'right',min:0,max:5,reverse:true,ticks:{color:css('--muted')},grid:{display:false}}}})});
}
function weeklySets(){
  const ws=mondayOf(today()), cnt={};
  let tpls=[]; for(let i=0;i<7;i++){const r=dayRec(addDays(ws,i)); if(r) r.sessions.forEach(x=>{if(x.tplId&&x.act==='musc') tpls.push(x.tplId);});}
  if(!tpls.length){ const n=Object.values(S.cfg.weekPattern).flat().filter(x=>x.rot).length||5; for(let i=0;i<n;i++) tpls.push(S.cfg.rotation[i%Math.max(1,S.cfg.rotation.length)]); }
  const pw=periodWeek(today());
  tpls.forEach(id=>{const t=tplById(id); if(!t) return; t.ex.forEach(e=>{const x=exById(e.exId); if(!x) return; const g=(D.G[x.grupo]||{n:x.grupo}).n; cnt[g]=(cnt[g]||0)+adjSeries(e.series,e.prio,pw&&pw.w);});});
  return cnt;
}
function chartVolume(id){
  const c=weeklySets(), L=Object.keys(c), max=D.VOLUME_NIVEL[S.profile.nivel].max;
  mkChart(id,{type:'bar',data:{labels:L,datasets:[{label:'Séries/semana',data:L.map(k=>c[k]),backgroundColor:L.map(k=>c[k]>max?css('--bad'):c[k]<10?css('--carb'):css('--good')),borderRadius:5}]},
    options:baseOpts({plugins:{legend:{display:false},tooltip:{callbacks:{afterLabel:()=>`Limite do nível: ${max}`}}}})});
}

function chartVolWeeks(id){
  const L=allLogs(); if(!L.length) return; const ws=mondayOf(today()); const weeks=Array.from({length:8},(_,i)=>addDays(ws,-7*(7-i)));
  mkChart(id,{type:'bar',data:{labels:weeks.map(w=>dshort(w)),datasets:[{label:'Volume (kg)',data:weeks.map(w=>L.filter(l=>l.date>=w&&l.date<=addDays(w,6)).reduce((s,l)=>s+(l.vol||0),0)),backgroundColor:weeks.map((w,i)=>i===7?css('--accent'):css('--accent-soft')),borderColor:css('--accent'),borderWidth:1,borderRadius:5}]},options:baseOpts({plugins:{legend:{display:false}}})});
}
/* ---------- modais ---------- */
function modal(html,wide){ $('#modalRoot').innerHTML=`<div class="modal-bg" data-act="bg-close"><div class="modal ${wide===true?'wide':''} ${wide==='onboard'?'locked':''}" role="dialog" aria-modal="true">${html}</div></div>`; const f=$('#modalRoot input,#modalRoot select,#modalRoot button.primary'); f&&f.focus({preventScroll:true}); }
function closeModalIfOpen(){ if($('#modalRoot').innerHTML){ S.returnDay=null; $('#modalRoot').innerHTML=''; S.dayOpen=null; } }
function closeModal(){ $('#modalRoot').innerHTML=''; const rd=S.returnDay; S.returnDay=null; S.dayOpen=null; if(rd) dayModal(rd); }
function confirmBox(txt,onYes,yesLabel='Confirmar'){ modal(`<h3>${esc(txt)}</h3><div class="row"><button class="btn" data-act="close">Cancelar</button><button class="btn primary danger" id="cfYes">${esc(yesLabel)}</button></div>`); $('#cfYes').onclick=()=>{closeModal();onYes();}; }
let toastT; function toast(t){ let el=$('.toast'); if(!el){el=document.createElement('div');el.className='toast';document.body.appendChild(el);} el.textContent=t; el.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>el.hidden=true,2600); }

function openOnboarding(){
  modal(`<div class="modal-h"><h3>Monte o seu app</h3></div>
  <p class="small muted">Preencha seus dados para o app calcular TMB, gasto semanal, macros e água. Sexo, idade, altura e peso são obrigatórios; o resto pode ficar para depois.</p>
  ${profileForm()}
  ${S.profile.onboarded?'':`<label class="perm" style="margin-top:4px"><input type="checkbox" id="obEx"><span><b>Começar com um modelo pronto</b><small>fichas Push/Pull/Legs + CrossFit, cardápios A/B/C, semana padrão e periodização de 12 semanas. Sem marcar, o app começa vazio e você monta tudo.</small></span></label>`}
  <div id="obErr"></div><div class="row"><button class="btn primary" data-act="onboard-done">Começar</button></div>`,'onboard');
}
function exInfo(id){
  const e=exById(id); if(!e) return; const has=S.lib.imgs&&S.lib.imgs[id];
  const show=src=>modal(`<div class="modal-h"><h3>${esc(e.nome)}</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
    ${FX_ART.has(id)?`<div class="art-stage" id="artStage"><span class="exart-phase">Início</span>${FX_ART.svg(id,e.grupo,{k:0})}</div><div class="art-legend"><span><i style="background:var(--hi)"></i>músculo principal</span><span><i style="background:var(--fig);opacity:.25"></i>posição inicial</span><span><i style="background:var(--plate)"></i>carga</span></div>`:''}
    ${src?`<img class="ex-img" src="${src}" alt="Execução de ${esc(e.nome)}">`:(FX_ART.has(id)?'':`<div class="empty">Sem ilustração. Adicione uma foto da execução.</div>`)}
    <div><h4>Músculos usados</h4>${mapHTML(FX_MAP.forExercise(e),'md')}</div>
    <div class="row">${chip((D.G[e.grupo]||{n:e.grupo}).n)}</div>
    <div><h4>Músculos</h4><p>${esc(e.musc||'—')}</p></div><div><h4>Execução</h4><p>${esc(e.dica||'—')}</p></div>
    <div class="row"><label class="btn">${src?'Trocar foto':'Adicionar foto própria'}<input type="file" accept="image/*" id="exImgIn" hidden></label>${src?`<button class="btn ghost danger" data-act="ex-img-del" data-id="${id}">Remover imagem</button>`:''}${e.custom?`<button class="btn ghost danger" data-act="ex-custom-del" data-id="${id}">Excluir exercício</button>`:''}</div>`);
  const bind=()=>{const inp=$('#exImgIn'); inp&&inp.addEventListener('change',ev=>uploadExImg(id,ev.target.files[0])); const st=$('#artStage svg'); if(st) FX_ART.animate(st,id,e.grupo);};
  if(has && !S.imgs[id]){ show(null); Store.load('img-'+id).then(v=>{ if(v){S.imgs[id]=v; show(v); bind();} }); }
  else show(S.imgs[id]);
  bind();
}
function uploadExImg(id,file){
  if(!file) return; const rd=new FileReader();
  rd.onload=()=>{ const im=new Image(); im.onload=()=>{ const max=560, sc=Math.min(1,max/Math.max(im.width,im.height)); const c=document.createElement('canvas'); c.width=Math.round(im.width*sc); c.height=Math.round(im.height*sc);
    const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(im,0,0,c.width,c.height); const url=c.toDataURL('image/jpeg',.72);
    S.imgs[id]=url; S.lib.imgs=S.lib.imgs||{}; S.lib.imgs[id]=1; Store.save('img-'+id,url); save('lib'); exInfo(id); if(S.tab==='montar') renderLib(); toast('Imagem salva'); }; im.src=rd.result; };
  rd.readAsDataURL(file);
}
function pickExercise(onPick,title){
  modal(`<div class="modal-h"><h3>${title||'Escolher exercício'}</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
  <div class="row"><input type="search" id="pkQ" placeholder="Buscar" style="flex:1"><select id="pkG" style="width:auto"><option value="">Todos</option>${Object.entries(D.G).map(([k,g])=>`<option value="${k}">${g.n}</option>`).join('')}</select></div>
  <div class="pick-list" id="pkL"></div><button class="btn ghost" data-act="ex-custom">+ Criar exercício novo</button>`);
  const draw=()=>{const q=$('#pkQ').value, g=$('#pkG').value; const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    $('#pkL').innerHTML=allEx().filter(e=>(!g||e.grupo===g)&&(!q||norm(e.nome).includes(norm(q)))).map(e=>`<button data-pick="${e.id}"><b>${esc(e.nome)}</b><span class="small muted">${esc((D.G[e.grupo]||{}).n||'')} · ${esc(e.musc||'')}</span></button>`).join('');};
  draw(); $('#pkQ').addEventListener('input',draw); $('#pkG').addEventListener('change',draw);
  $('#pkL').addEventListener('click',ev=>{const b=ev.target.closest('[data-pick]'); if(b){closeModal(); onPick(b.dataset.pick);}});
}
function sessModal(d,sid){
  const r=dayRec(d,true); const x=sid?r.sessions.find(s=>s.id===sid):{act:'musc',hora:'05:30',min:null,tplId:'',nota:''};
  modal(`<div class="modal-h"><h3>${sid?'Editar treino':'Adicionar treino'} · ${dlabel(d)}</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
  <div class="fgrid"><label class="f">Atividade<select id="smAct">${S.cfg.acts.map(a=>`<option value="${a.id}" ${a.id===x.act?'selected':''}>${esc(a.nome)}</option>`).join('')}</select></label>
  <label class="f">Horário<input type="time" id="smHora" value="${esc(x.hora||'')}"></label>
  <label class="f">Duração (min)<input type="number" id="smMin" value="${x.min??''}" placeholder="${actById(x.act).min}"></label>
  <label class="f">Ficha<select id="smTpl"><option value="">— nenhuma —</option>${S.tpl.map(t=>`<option value="${t.id}" ${t.id===x.tplId?'selected':''}>${esc(t.nome)}</option>`).join('')}</select></label></div>
  <label class="f">Anotação<input type="text" id="smNota" value="${esc(x.nota||'')}"></label>
  <div class="row">${sid?`<button class="btn danger" id="smDel">Excluir</button>`:''}<span style="flex:1"></span><button class="btn" data-act="close">Cancelar</button><button class="btn primary" id="smOk">Salvar</button></div>`);
  $('#smOk').onclick=()=>{ const v={act:$('#smAct').value,hora:$('#smHora').value,min:$('#smMin').value?num($('#smMin').value):null,tplId:$('#smTpl').value||null,nota:$('#smNota').value};
    if(sid) Object.assign(x,v); else r.sessions.push(Object.assign({id:uid(),done:false},v)); saveMonth(d); closeModal(); render(); };
  if(sid) $('#smDel').onclick=()=>{ r.sessions=r.sessions.filter(s=>s.id!==sid); saveMonth(d); closeModal(); render(); };
}
function prModal(bid){
  const b=D.BENCH.find(x=>x.id===bid) || (bid?{id:bid,nome:(S.prs.manual.find(m=>m.bid===bid)||{}).nomeCustom||bid,tipo:(S.prs.manual.find(m=>m.bid===bid)||{}).tipo||'kg'}:null);
  const hist=b?S.prs.manual.filter(m=>m.bid===b.id).sort((a,c)=>c.data.localeCompare(a.data)):[];
  modal(`<div class="modal-h"><h3>${b?esc(b.nome):'Registrar RP'}</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
  ${b&&b.desc?`<p class="small muted">${esc(b.desc)}</p>`:''}
  <div class="fgrid">${b?'':`<label class="f">Movimento<select id="prMov">${D.BENCH.map(x=>`<option value="${x.id}">${esc(x.nome)}</option>`).join('')}<option value="__new">Outro (digitar)…</option></select></label><label class="f">Nome (se outro)<input type="text" id="prNome"></label><label class="f">Tipo<select id="prTipo"><option value="kg">Carga (kg)</option><option value="reps">Repetições</option><option value="tempo">Tempo (mm:ss)</option><option value="dist">Distância (m)</option></select></label>`}
    <label class="f">Valor${b?` (${b.tipo==='tempo'?'mm:ss':b.tipo==='kg'?'kg':b.tipo==='dist'?'m':'reps'})`:''}<input type="text" id="prVal" inputmode="decimal"></label>
    <label class="f">Data<input type="date" id="prData" value="${today()}"></label><label class="f">Nota<input type="text" id="prNota" placeholder="ex.: RX, com cinto"></label></div>
  <div class="row"><button class="btn primary" id="prOk">Salvar RP</button></div>
  ${hist.length?`<h4>Histórico</h4><div class="list">${hist.map(h=>`<div class="it"><div class="grow"><b class="num">${prFmt(h.valor,b.tipo)}</b> <span class="small muted">${dshort(h.data)} ${esc(h.nota||'')}</span></div><button class="btn ghost sm danger" data-act="pr-del" data-id="${h.id}">Excluir</button></div>`).join('')}</div>`:''}`);
  $('#prOk').onclick=()=>{
    let bb=b, nomeCustom=null, custom=false;
    if(!bb){ const mv=$('#prMov').value; if(mv==='__new'){ nomeCustom=$('#prNome').value.trim(); if(!nomeCustom){toast('Digite o nome do movimento');return;} bb={id:'c-'+nomeCustom.toLowerCase().replace(/[^a-z0-9]+/g,'-'),tipo:$('#prTipo').value}; custom=true; } else bb=D.BENCH.find(x=>x.id===mv); }
    const raw=$('#prVal').value; const v=bb.tipo==='tempo'?parseTime(raw):num(raw); if(!v){toast('Informe um valor');return;}
    const prev=bestPR(bb); S.prs.manual.push({id:uid(),bid:bb.id,tipo:bb.tipo,valor:v,data:$('#prData').value||today(),nota:$('#prNota').value,custom,nomeCustom});
    save('prs'); closeModal(); render(); toast(!prev||prBetter(v,prev.valor,bb.tipo)?'Novo recorde pessoal!':'Registro salvo');
  };
}
function bodyModal(){
  const last=S.body.entries.slice(-1)[0]||{};
  modal(`<div class="modal-h"><h3>Registrar medidas</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
  <div class="fgrid"><label class="f">Data<input type="date" id="bdD" value="${today()}"></label><label class="f">Peso (kg)<input type="number" id="bdP" step="0.1" placeholder="${last.peso||S.profile.peso}"></label>
  <label class="f">Cintura (cm)<input type="number" id="bdC" step="0.1"></label><label class="f">FC de repouso (bpm)<input type="number" id="bdF"></label><label class="f">Sono (h)<input type="number" id="bdS" step="0.5"></label></div>
  <div class="row"><button class="btn primary" id="bdOk">Salvar</button></div>`);
  $('#bdOk').onclick=()=>{ const e={id:uid(),date:$('#bdD').value||today(),peso:num($('#bdP').value)||null,cintura:num($('#bdC').value)||null,fc:num($('#bdF').value)||null,sono:num($('#bdS').value)||null};
    if(!e.peso&&!e.cintura&&!e.fc&&!e.sono){toast('Preencha ao menos um campo');return;}
    const prevP=pesoEntries().filter(x=>x.date<e.date).slice(-1)[0]; S.body.entries.push(e); save('body'); if(e.peso && e.date>=today()){ S.profile.peso=e.peso; save('profile'); } closeModal(); render(); if(e.peso && prevP && !(e.sono && e.sono<6)) { celebrate(e.peso-prevP.peso); return; }
    if(e.sono && e.sono<6) modal(`<h3>Sono curto</h3><p>Com menos de 6 horas, faça a academia com 1 série a menos por exercício e mantenha 3 repetições em reserva. Duas noites seguidas assim: troque a academia por descanso. Um cochilo de 20 min após o almoço ajuda.</p><button class="btn primary" data-act="close">Entendi</button>`); };
}
function mealModal(mid){
  const list=S.cfg.meals[S.dietType]=S.cfg.meals[S.dietType]||[]; const m=mid?list.find(x=>x.id===mid):{id:uid(),hora:'12:00',nome:'Nova refeição',p:0,c:0,g:0,ops:[{nome:'Opção',itens:[],p:0,c:0,g:0,kcal:0}]};
  const opRow=(op,i)=>`<div class="card flat" data-op="${i}"><div class="row between"><b>Opção ${i+1}</b><button class="btn ghost sm danger" data-opdel="${i}">Remover</button></div>
    <label class="f">Nome<input type="text" data-k="nome" value="${esc(op.nome)}"></label><label class="f">Itens (um por linha)<textarea data-k="itens">${esc(op.itens.join('\n'))}</textarea></label>
    <div class="fgrid"><label class="f">Proteína (g)<input type="number" data-k="p" value="${op.p}"></label><label class="f">Carbo (g)<input type="number" data-k="c" value="${op.c}"></label><label class="f">Gordura (g)<input type="number" data-k="g" value="${op.g}"></label><label class="f">kcal (vazio = calcular)<input type="number" data-k="kcal" value="${op.kcal||''}"></label></div></div>`;
  modal(`<div class="modal-h"><h3>${mid?'Editar refeição':'Nova refeição'}</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
  <div class="fgrid"><label class="f">Horário<input type="time" id="mlH" value="${esc(m.hora)}"></label><label class="f">Nome<input type="text" id="mlN" value="${esc(m.nome)}"></label><label class="f">Meta P (g)<input type="number" id="mlP" value="${m.p}"></label><label class="f">Meta C (g)<input type="number" id="mlC" value="${m.c}"></label><label class="f">Meta G (g)<input type="number" id="mlG" value="${m.g}"></label></div>
  <div class="stack" id="mlOps">${m.ops.map(opRow).join('')}</div><button class="btn sm" id="mlAddOp">+ Opção</button>
  <div class="row">${mid?`<button class="btn danger" id="mlDel">Excluir refeição</button>`:''}<span style="flex:1"></span><button class="btn" data-act="close">Cancelar</button><button class="btn primary" id="mlOk">Salvar</button></div>`,true);
  const read=()=>$$('#mlOps [data-op]').map(c=>{const g=k=>c.querySelector(`[data-k="${k}"]`).value; const o={nome:g('nome'),itens:g('itens').split('\n').map(s=>s.trim()).filter(Boolean),p:num(g('p')),c:num(g('c')),g:num(g('g')),kcal:num(g('kcal'))}; if(!o.kcal) o.kcal=Math.round(o.p*4+o.c*4+o.g*9); return o;});
  $('#mlAddOp').onclick=()=>{ const ops=read(); ops.push({nome:'Nova opção',itens:[],p:0,c:0,g:0,kcal:0}); $('#mlOps').innerHTML=ops.map(opRow).join(''); };
  $('#mlOps').addEventListener('click',ev=>{const b=ev.target.closest('[data-opdel]'); if(b){const ops=read(); ops.splice(+b.dataset.opdel,1); $('#mlOps').innerHTML=ops.map(opRow).join('');}});
  $('#mlOk').onclick=()=>{ Object.assign(m,{hora:$('#mlH').value,nome:$('#mlN').value,p:num($('#mlP').value),c:num($('#mlC').value),g:num($('#mlG').value),ops:read()}); if(!m.ops.length) m.ops=[{nome:'Livre',itens:[],p:m.p,c:m.c,g:m.g,kcal:m.p*4+m.c*4+m.g*9}];
    if(!mid) list.push(m); list.sort((a,b)=>a.hora.localeCompare(b.hora)); save('cfg'); closeModal(); render(); };
  if(mid) $('#mlDel').onclick=()=>{ S.cfg.meals[S.dietType]=list.filter(x=>x.id!==mid); save('cfg'); closeModal(); render(); };
}
function customExModal(){
  modal(`<div class="modal-h"><h3>Criar exercício</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
  <div class="fgrid"><label class="f">Nome<input type="text" id="cxN"></label><label class="f">Grupo<select id="cxG">${Object.entries(D.G).map(([k,g])=>`<option value="${k}">${g.n}</option>`).join('')}</select></label></div>
  <label class="f">Músculos<input type="text" id="cxM"></label><label class="f">Como executar<textarea id="cxD"></textarea></label>
  <div class="row"><button class="btn primary" id="cxOk">Criar</button></div>`);
  $('#cxOk').onclick=()=>{ const n=$('#cxN').value.trim(); if(!n){toast('Dê um nome ao exercício');return;} const g=$('#cxG').value;
    const e={id:'cx-'+uid(),nome:n,grupo:g,musc:$('#cxM').value,dica:$('#cxD').value,guia:'',custom:true}; S.lib.custom.push(e); save('lib'); closeModal(); render(); toast('Exercício criado'); };
}
function weekEdit(i){
  const w=S.cfg.period.weeks[i];
  modal(`<div class="modal-h"><h3>Semana ${i+1}</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
  <div class="fgrid"><label class="f">Fase<input type="text" id="wkF" value="${esc(w.fase)}"></label><label class="f">Séries<select id="wkM">${Object.entries(MODE_TXT).map(([k,n])=>`<option value="${k}" ${w.mode===k?'selected':''}>${n}</option>`).join('')}</select></label>
  <label class="f">RIR<input type="text" id="wkR" value="${esc(w.rir)}"></label><label class="f">Faixa de reps (opcional)<input type="text" id="wkReps" value="${esc(w.reps||'')}"></label></div>
  <label class="f">Foco<textarea id="wkFo">${esc(w.foco)}</textarea></label><div class="row"><button class="btn primary" id="wkOk">Salvar</button></div>`);
  $('#wkOk').onclick=()=>{ Object.assign(w,{fase:$('#wkF').value,mode:$('#wkM').value,rir:$('#wkR').value,reps:$('#wkReps').value,foco:$('#wkFo').value}); S.cfg.period.preset='custom'; save('cfg'); closeModal(); render(); };
}
function viewLog(id){
  const l=allLogs().find(x=>x.id===id); if(!l) return;
  modal(`<div class="modal-h"><h3>${esc(l.nome)}</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div><p class="muted">${dlabel(l.date)} · ${l.durMin} min${l.watch?' · lançado do relógio':' · '+fmt(l.vol)+' kg'}${l.week?` · semana ${l.week.n} (${esc(l.week.fase)})`:''}</p>
  ${l.wod?`<div class="card flat"><b>${esc(l.wod.formato)}</b> ${esc(l.wod.cap||'')} · <b>${esc(l.wod.resultado||'')}</b> ${l.wod.rx?'RX':'adaptado'}<p class="small" style="white-space:pre-wrap">${esc(l.wod.desc||'')}</p></div>`:''}
  ${l.watch?watchDetail(l):''}
  <div><h4>Músculos usados</h4>${mapHTML(musclesLog(l),'md')}</div>
  ${(l.ex||[]).map(e=>`<div><b>${esc(e.nome)}</b><div class="small num">${e.sets.map(s=>`${fmt(s.kg,1).replace(',0','')} kg × ${s.reps}${s.rir!==''&&s.rir!=null?` @RIR ${esc(s.rir)}`:''}`).join(' · ')}</div></div>`).join('')}
  <div class="row"><button class="btn danger" id="lgDel">Excluir registro</button></div>`);
  $('#lgDel').onclick=()=>confirmBox('Excluir este treino do histórico?',()=>{ const m=mk(l.date); S.logs[m].sessions=S.logs[m].sessions.filter(x=>x.id!==id); Store.save('lg-'+m,S.logs[m]); render(); },'Excluir');
}

/* ---------- parceiros ---------- */
function genCode(){ const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({length:6},()=>A[Math.floor(Math.random()*A.length)]).join(''); }
async function publishModel(){
  const pro=S.profile.pro||{}; if(!pro.nome){toast('Preencha o nome do profissional ou academia');return;}
  if(!Store.shared){ toast('Abra o app pelo link com login para publicar'); return; }
  const payload={};
  if($('#pubT').checked) payload.tpl=S.tpl, payload.rotation=S.cfg.rotation, payload.custom=S.lib.custom;
  if($('#pubD').checked) payload.dayTypes=S.cfg.dayTypes, payload.meals=S.cfg.meals, payload.acts=S.cfg.acts;
  if($('#pubP').checked) payload.period={preset:S.cfg.period.preset,weeks:S.cfg.period.weeks};
  if($('#pubW').checked) payload.weekPattern=S.cfg.weekPattern;
  const code=genCode();
  try{ await Store.shared.doc('modelos/'+code).set({autor:{nome:pro.nome,tipo:pro.tipo||'Academia',registro:pro.registro||'',contato:pro.contato||''},criado:Date.now(),payload:clone(payload)});
    pro.codes=[{code,date:today()}].concat(pro.codes||[]).slice(0,10); S.profile.pro=pro; save('profile'); render();
    modal(`<h3>Modelo publicado</h3><p>Envie este código aos seus alunos:</p><div class="stat"><div class="v num" style="user-select:all;font-size:2.6rem;letter-spacing:.1em">${code}</div></div><p class="small muted">O aluno abre o app, vai em Perfil & parceiros e digita o código.</p><div class="row"><button class="btn" data-act="copy" data-text="${code}">Copiar código</button><button class="btn primary" data-act="close">Fechar</button></div>`);
  }catch(e){ toast(e&&e.code==='invalid_argument'?'Sem permissão para publicar: peça acesso de colaborador ao dono do app':'Não foi possível publicar agora'); }
}
async function importCode(){
  const code=($('#impCode').value||'').trim().toUpperCase(), out=$('#impOut'); if(!code) return;
  if(!Store.shared){ out.innerHTML='<p class="small muted">Disponível quando o app é aberto pelo link com login.</p>'; return; }
  out.innerHTML='<p class="small muted">Buscando…</p>';
  try{ const s=await Store.shared.doc('modelos/'+code).get(); if(!s.exists){ out.innerHTML='<p class="small" style="color:var(--bad)">Código não encontrado. Confira as letras com o profissional.</p>'; return; }
    const m=s.data(), p=m.payload||{};
    out.innerHTML=`<div class="note"><b>${esc(m.autor.nome)}</b> · ${esc(m.autor.tipo)}${m.autor.registro?' · '+esc(m.autor.registro):''}<br>Inclui: ${[p.tpl&&`${p.tpl.length} fichas`,p.meals&&'cardápios e macros',p.period&&'periodização',p.weekPattern&&'semana padrão'].filter(Boolean).join(', ')}</div><button class="btn primary" id="impGo">Importar para o meu app</button>`;
    $('#impGo').onclick=()=>{ applyPayload(p,code,m.autor); renderTabs(); render(); toast('Modelo importado'); };
  }catch(e){ out.innerHTML='<p class="small" style="color:var(--bad)">Não foi possível buscar agora. Tente de novo.</p>'; }
}

/* ---------- backup ---------- */
async function exportData(){
  const months={}; for(const m of Object.keys(S.months)) months[m]=S.months[m];
  const data={app:'evo',v:1,date:today(),profile:S.profile,cfg:S.cfg,tpl:S.tpl,prs:S.prs,body:S.body,lib:S.lib,meta:S.meta,chal:S.chal,months,logs:S.logs};
  const txt=JSON.stringify(data);
  if(Store.downloads){ try{ await Store.downloads.save({filename:`evo-${today()}.json`,data:txt}); toast('Backup gerado'); return; }catch(e){} }
  try{ const inFrame=window.self!==window.top; if(!inFrame){ const u=URL.createObjectURL(new Blob([txt],{type:'application/json'})); const l=document.createElement('a'); l.href=u; l.download=`evo-${today()}.json`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000); toast('Backup baixado'); return; } }catch(e){}
  $('#expOut').innerHTML=`<label class="f">Copie e guarde este texto<textarea id="expTxt" readonly>${esc(txt)}</textarea></label><button class="btn sm" data-act="copy-exp">Copiar</button>`;
}
function importFile(ev){
  const f=ev.target.files[0]; if(!f) return; const rd=new FileReader();
  rd.onload=()=>{ try{ const d=JSON.parse(rd.result); if(d.app!=='evo'&&d.app!=='ficha-forte') throw 0;
    if(d.tipo==='modelo' && d.payload){ const p=d.payload, n=(p.dayTypes||[]).length;
      confirmBox(`Aplicar o modelo "${d.nome||'sem nome'}"? ${n?n+' tipos de dia com cardápio, ':''}${p.weekPattern?'semana padrão, ':''}${(p.tpl||[]).length?'fichas, ':''}substituindo os atuais. Seus registros (treinos, peso, diário) não mudam.`,()=>{ applyPayload(p,'modelo',null); renderTabs(); render(); toast('Modelo aplicado'); },'Aplicar');
      ev.target.value=''; return; }
    confirmBox('Substituir os dados atuais pelo backup?',()=>{ ['profile','cfg','tpl','prs','body','lib','meta','chal'].forEach(k=>{ if(d[k]){S[k]=d[k]; save(k);} });
      Object.entries(d.months||{}).forEach(([m,v])=>{S.months[m]=v; Store.save('m-'+m,v);}); Object.entries(d.logs||{}).forEach(([m,v])=>{S.logs[m]=v; Store.save('lg-'+m,v);});
      renderTabs(); render(); toast('Backup restaurado'); },'Restaurar');
  }catch(e){ toast('Arquivo inválido: use um backup exportado pelo EVO'); } };
  rd.readAsText(f);
}

/* ---------- agenda: preencher semana ---------- */
async function fillWeek(ws){
  ws=ws||S.weekStart; await ensureMonth(mk(ws)); await ensureMonth(mk(addDays(ws,6)));
  for(let i=0;i<7;i++){ const d=addDays(ws,i), r=dayRec(d,true); if(r.sessions.length) continue;
    (S.cfg.weekPattern[pISO(d).getDay()]||[]).forEach(p=>{ let tplId=p.tplId||null;
      if(p.act==='musc' && p.rot && S.cfg.rotation.length){ tplId=S.cfg.rotation[S.cfg.rotIdx%S.cfg.rotation.length]; S.cfg.rotIdx++; }
      if(p.act==='cross' && !tplId){ const w=S.tpl.find(t=>t.kind==='crossfit'); tplId=w?w.id:null; }
      r.sessions.push({id:uid(),act:p.act,hora:p.hora,min:p.min??null,tplId,done:false}); });
  }
  saveMonth(ws); saveMonth(addDays(ws,6)); save('cfg'); render(); toast('Semana preenchida');
}

/* ---------- ações ---------- */
const ACT = {
  tab:t=>go(t.dataset.id),
  grp:t=>{ const g=NAV.find(x=>x.id===t.dataset.id); S.lastIn=S.lastIn||{}; go(S.lastIn[g.id]&&g.tabs.includes(S.lastIn[g.id])?S.lastIn[g.id]:g.tabs[0]); },
  'help-page':()=>{ const h=HELP_BY_TAB[S.tab]; if(!h) return; modal(`<div class="modal-h"><h3>Como funciona: ${h.t}</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div><p class="muted">${h.r}</p><ul class="ch-ol">${h.p.map(x=>`<li>${x}</li>`).join('')}</ul><div class="row"><button class="btn" data-act="help-all">Ver a ajuda completa</button><button class="btn primary" data-act="close">Entendi</button></div>`); },
  'help-all':()=>{ closeModal(); S.cfgMode='ajuda'; go('config'); },
  fab:()=>quickSheet(),
  'q-water':()=>{ closeModal(); ACT.water({dataset:{ml:String(S.cfg.water.copo)}}); },
  'q-peso':()=>{ closeModal(); quickPeso(); },
  'q-medidas':()=>{ closeModal(); bodyModal(); },
  'q-sess':()=>{ closeModal(); sessModal(today()); },
  'q-train':()=>{ closeModal(); if(S.active){ go('treinar'); return; } const s=suggestTpl(); if(s) startSession(s.id); else go('treinar'); },
  'q-meal':()=>{ closeModal(); go('hoje'); setTimeout(()=>{const m=$('#mealsToday'); m&&m.scrollIntoView({behavior:'smooth'});},120); },
  'peso-quick':()=>{ const el=$('#pesoQuick'); const kg=num(el&&el.value); if(!kg||kg<25||kg>350){ toast('Informe um peso válido em kg'); return; } closeModal(); savePeso(kg,today()); }, go:t=>go(t.dataset.id), close:closeModal,
  'bg-close':(t,e)=>{ if(e.target===t && !$('#modalRoot .modal.locked')) closeModal(); },
  onboard:openOnboarding,
  'onboard-done':()=>{ const p=S.profile, miss=[['sexo','sexo'],['idade','idade'],['altura','altura'],['peso','peso']].filter(([k])=>!(k==='sexo'?p.sexo:num(p[k])>0)).map(x=>x[1]);
    if(miss.length){ $('#obErr').innerHTML=`<p class="small bad">Preencha: ${miss.join(', ')}.</p>`; return; }
    const ex=$('#obEx'); if(ex&&ex.checked) loadExample();
    const first=!p.onboarded; p.onboarded=true; p.exemplo=false; save('profile'); closeModal(); renderTabs(); render(); if(first) toast(ex&&ex.checked?'Modelo carregado. Ajuste o que quiser.':'Tudo pronto. Comece montando suas fichas em Treino › Fichas.'); },
  'add-sess':t=>{ if($('#dayModal')) S.returnDay=t.dataset.date; sessModal(t.dataset.date); }, 'edit-sess':t=>{ if($('#dayModal')) S.returnDay=t.dataset.date; sessModal(t.dataset.date,t.dataset.sid); },
  'cal-view':t=>{ S.calView=t.dataset.id; render(); },
  'cal-nav':t=>{ const n=+t.dataset.n; if(n===0) S.calRef=today(); else if(S.calView==='semana') S.calRef=addDays(S.calRef,7*n); else { const d=pISO(S.calRef); d.setDate(1); d.setMonth(d.getMonth()+n); S.calRef=iso(d); } calEnsure().then(render); },
  'cal-day':t=>dayModal(t.dataset.date),
  'ag-view':t=>{ S.agView=t.dataset.id; if(S.agView==='dia') S.agDate=S.agDate||today(); if(S.agView==='mes') S.agMonth=S.agMonth||S.weekStart; render(); },
  'ag-day':t=>{ const d=t.dataset.date; S.agView='dia'; S.agDate=d; S.weekStart=mondayOf(d); Promise.all([ensureMonth(mk(d))]).then(()=>{ render(); window.scrollTo({top:0}); }); },
  'ag-nav':t=>{ const n=+t.dataset.n, v=S.agView||'semana';
    if(v==='dia'){ S.agDate = n===0? today() : addDays(S.agDate||today(),n); S.weekStart=mondayOf(S.agDate); }
    else if(v==='mes'){ if(n===0) S.agMonth=today(); else { const d=pISO(S.agMonth||today()); d.setDate(1); d.setMonth(d.getMonth()+n); S.agMonth=iso(d);} }
    else { S.weekStart = n===0? mondayOf(today()) : addDays(S.weekStart,7*n); }
    const ds = v==='mes'? calRange('mes',S.agMonth).days : v==='dia'? [S.agDate,mondayOf(S.agDate),addDays(mondayOf(S.agDate),6)] : [S.weekStart,addDays(S.weekStart,6)];
    Promise.all([...new Set(ds.map(mk))].map(ensureMonth)).then(render); },
  'dm-go':t=>{ S.returnDay=null; closeModal(); if(t.dataset.date){ S.weekStart=mondayOf(t.dataset.date); S.agView='dia'; S.agDate=t.dataset.date; } go(t.dataset.id); },
  'dm-fill':t=>{ const inModal=!!$('#dayModal'); fillWeek(mondayOf(t.dataset.date)).then(()=>{ if(inModal) dayModal(t.dataset.date); }); },
  'toggle-sess':t=>{ const r=dayRec(t.dataset.date,true), s=r.sessions.find(x=>x.id===t.dataset.sid); if(s){s.done=!s.done; saveMonth(t.dataset.date); render();} },
  'start-from-sess':t=>{ S.returnDay=null; closeModal(); const r=dayRec(t.dataset.date), s=r.sessions.find(x=>x.id===t.dataset.sid); if(S.active){toast('Conclua ou descarte o treino em andamento');go('treinar');return;} startSession(s.tplId || (s.act==='cross'?(S.tpl.find(x=>x.kind==='crossfit')||{}).id:null), s.id); },
  'start-tpl':t=>{ if(S.active){toast('Já existe um treino em andamento');return;} const r=dayRec(today()); const s=r&&r.sessions.find(x=>x.tplId===t.dataset.id&&!x.done); startSession(t.dataset.id,s&&s.id); },
  'start-free':()=>{ if(S.active){toast('Já existe um treino em andamento');return;} startSession(null); },
  'set-ok':t=>{ const e=S.active.ex[+t.dataset.i], s=e.sets[+t.dataset.j]; s.ok=!s.ok; if(s.ok&&!s.reps) s.reps=String(e.repMax); persistActive(); if(s.ok) startRest(e.desc||90); render(); },
  'set-add':t=>{ const e=S.active.ex[+t.dataset.i]; const l=e.sets[e.sets.length-1]||{}; e.sets.push({kg:l.kg||'',reps:'',rir:'',ok:false}); persistActive(); render(); },
  'set-del':t=>{ S.active.ex[+t.dataset.i].sets.pop(); persistActive(); render(); },
  'ex-up':t=>{ const i=+t.dataset.i; if(i>0){ const a=S.active.ex; [a[i-1],a[i]]=[a[i],a[i-1]]; persistActive(); render(); } },
  'ex-del':t=>{ S.active.ex.splice(+t.dataset.i,1); persistActive(); render(); },
  'rest-add':()=>{ S.rest.end+=15000; renderTimer(); }, 'rest-stop':()=>{ S.rest=null; renderTimer(); },
  'cancel-session':()=>confirmBox('Descartar este treino? As séries registradas serão perdidas.',()=>{ S.active=null; S.rest=null; persistActive(); render(); },'Descartar'),
  'finish-session':finishSession,
  'view-log':t=>viewLog(t.dataset.id),
  'pick-ex':t=>{ const mode=t.dataset.mode; pickExercise(id=>{ const base={exId:id,series:3,repMin:8,repMax:12,rir:'2',desc:90,nota:'',prio:false};
    if(mode==='active'){ S.active.ex.push(newActiveEx(base,(periodWeek(today())||{}).w)); persistActive(); }
    else { tplById(S.montarSel).ex.push(base); save('tpl'); } render(); }); },
  'ex-info':t=>exInfo(t.dataset.id),
  'ex-img-del':t=>{ const id=t.dataset.id; delete S.imgs[id]; if(S.lib.imgs) delete S.lib.imgs[id]; save('lib'); Store.save('img-'+id,''); closeModal(); render(); },
  'ex-custom':customExModal,
  'ex-custom-del':t=>{ S.lib.custom=S.lib.custom.filter(e=>e.id!==t.dataset.id); save('lib'); closeModal(); render(); },
  'tpl-sel':t=>{ S.montarSel=t.dataset.id; render(); },
  'tpl-restore':()=>{ S.tpl=clone(D.TEMPLATES); S.cfg.rotation=['push','pull','legs']; save('tpl'); save('cfg'); render(); toast('Fichas carregadas'); },
  'tpl-new':()=>{ const t={id:'t-'+uid(),nome:'Nova ficha',kind:'academia',foco:'',cor:'#7A5AF5',ex:[]}; S.tpl.push(t); S.montarSel=t.id; save('tpl'); render(); },
  'tpl-dup':t=>{ const o=clone(tplById(t.dataset.id)); o.id='t-'+uid(); o.nome+=' (cópia)'; S.tpl.push(o); S.montarSel=o.id; save('tpl'); render(); },
  'tpl-del':t=>confirmBox('Excluir esta ficha?',()=>{ S.tpl=S.tpl.filter(x=>x.id!==t.dataset.id); S.cfg.rotation=S.cfg.rotation.filter(x=>x!==t.dataset.id); S.montarSel=null; save('tpl'); save('cfg'); render(); },'Excluir'),
  'tex-up':t=>{ const a=tplById(S.montarSel).ex, i=+t.dataset.i; if(i>0){[a[i-1],a[i]]=[a[i],a[i-1]]; save('tpl'); render();} },
  'tex-del':t=>{ tplById(S.montarSel).ex.splice(+t.dataset.i,1); save('tpl'); render(); },
  'tex-swap':t=>{ const i=+t.dataset.i; pickExercise(id=>{ tplById(S.montarSel).ex[i].exId=id; save('tpl'); render(); },'Trocar exercício'); },
  'rot-del':t=>{ S.cfg.rotation.splice(+t.dataset.i,1); save('cfg'); render(); },
  wk:t=>{ const n=+t.dataset.n; S.weekStart = n===0? mondayOf(today()) : addDays(S.weekStart,n); Promise.all([ensureMonth(mk(S.weekStart)),ensureMonth(mk(addDays(S.weekStart,6)))]).then(render); },
  'fill-week':()=>fillWeek(S.tab==='agenda'?S.weekStart:mondayOf(today())),
  'save-pattern':()=>{ const pat={}; for(let i=0;i<7;i++){ const d=addDays(S.weekStart,i), r=dayRec(d); pat[pISO(d).getDay()]=(r?r.sessions:[]).map(x=>({act:x.act,hora:x.hora,min:x.min,rot:x.act==='musc'&&S.cfg.rotation.includes(x.tplId),tplId:x.act==='musc'&&S.cfg.rotation.includes(x.tplId)?null:x.tplId})); } S.cfg.weekPattern=pat; save('cfg'); toast('Semana padrão salva'); },
  'clear-week':()=>confirmBox('Remover todos os treinos desta semana?',()=>{ for(let i=0;i<7;i++){const d=addDays(S.weekStart,i), r=dayRec(d); if(r){r.sessions=[]; delete r.dayType;}} saveMonth(S.weekStart); saveMonth(addDays(S.weekStart,6)); render(); },'Limpar'),
  'diet-sub':t=>{ S.dietSub=t.dataset.id; render(); },
  'diet-type':t=>{ S.dietType=t.dataset.id; render(); },
  'dt-new':()=>{ const id='D'+uid().slice(0,4); S.cfg.dayTypes.push({id,nome:'Novo tipo de dia',desc:'',acts:[],adj:0,pKg:2,gKg:1,cor:'#7A5AF5'}); S.cfg.meals[id]=[]; S.dietType=id; save('cfg'); render(); },
  'dt-del':t=>confirmBox('Excluir este tipo de dia e o cardápio dele?',()=>{ S.cfg.dayTypes=S.cfg.dayTypes.filter(x=>x.id!==t.dataset.id); delete S.cfg.meals[t.dataset.id]; S.dietType=S.cfg.dayTypes[0].id; save('cfg'); render(); },'Excluir'),
  'meal-op':t=>{ const d=t.dataset.date||today(); const r=dayRec(d,true); r.meals=r.meals||{}; const cur=r.meals[t.dataset.id]||{}; r.meals[t.dataset.id]=Object.assign(cur,{op:+t.dataset.i}); saveMonth(d); render(); },
  'meal-done':t=>{ const d=t.dataset.date||today(); const r=dayRec(d,true); r.meals=r.meals||{}; const cur=r.meals[t.dataset.id]||{op:0}; cur.done=!cur.done; r.meals[t.dataset.id]=cur; saveMonth(d); render(); },
  'meal-edit':t=>mealModal(t.dataset.id), 'meal-new':()=>mealModal(null),
  'meal-reset':()=>confirmBox('Carregar o cardápio base para os dias A, B e C? As refeições atuais desses dias serão substituídas.',()=>{ const m=mealsWithIds(clone(D.MEALS)); Object.assign(S.cfg.meals,m); save('cfg'); render(); },'Restaurar'),
  'cfg-mode':t=>{ S.cfgMode=t.dataset.id; render(); },
  ui:t=>{ S.profile.ui[t.dataset.k]=t.dataset.v; applyUI(); save('profile'); render(); },
  'ui-reset':()=>{ S.profile.ui=defaultUI(); applyUI(); save('profile'); render(); toast('Aparência restaurada'); },
  naf:t=>{ S.profile.naf=+t.dataset.v; save('profile'); render(); },
  water:t=>{ const d=today(), r=dayRec(d,true); const before=r.water||0; r.water=Math.max(0,before+ +t.dataset.ml); saveMonth(d);
    const g=waterGoal(d); render(); animateBottle(before/g*100,r.water/g*100);
    if(+t.dataset.ml>0 && before<g && r.water>=g) toast('Meta de água do dia atingida'); },
  'pr-new':()=>prModal(null), 'pr-hist':t=>prModal(t.dataset.id),
  'pr-del':t=>{ S.prs.manual=S.prs.manual.filter(m=>m.id!==t.dataset.id); save('prs'); closeModal(); render(); },
  'pr-ex':t=>{ S.prEx=t.dataset.id; render(); },
  'per-mode':t=>{ S.perMode=t.dataset.id; render(); },
  perq:t=>{ const st=S.perQuiz=S.perQuiz||{i:0,ans:{}}; st.ans[t.dataset.k]=t.dataset.v; st.i++; render(); },
  'perq-back':()=>{ S.perQuiz.i=Math.max(0,S.perQuiz.i-1); render(); },
  'perq-reset':()=>{ S.perQuiz={i:0,ans:{}}; render(); },
  'per-apply':t=>{ const k=t.dataset.id, el=$('#perQuizStart'); const start=el&&el.value?el.value:mondayOf(today());
    confirmBox(`Usar "${D.PERIODS[k].nome}" começando em ${dshort(start)}? As semanas atuais serão substituídas.`,()=>{ S.cfg.period.preset=k; S.cfg.period.weeks=clone(D.PERIODS[k].weeks); S.cfg.period.start=start; save('cfg'); render(); toast('Periodização aplicada'); setTimeout(()=>{const x=$('#perAtual'); x&&x.scrollIntoView({behavior:'smooth'});},100); },'Usar'); },
  'per-preset':t=>{ const k=t.dataset.id; confirmBox(`Trocar para "${D.PERIODS[k].nome}"? As semanas atuais serão substituídas.`,()=>{ S.cfg.period.preset=k; S.cfg.period.weeks=clone(D.PERIODS[k].weeks); save('cfg'); render(); },'Trocar'); },
  'per-edit':t=>weekEdit(+t.dataset.i),
  'per-add':()=>{ S.cfg.period.weeks.push({fase:'Nova fase',mode:'normal',rir:'2',reps:'',foco:''}); S.cfg.period.preset='custom'; save('cfg'); render(); },
  'per-pop':()=>{ S.cfg.period.weeks.pop(); S.cfg.period.preset='custom'; save('cfg'); render(); },
  'body-new':bodyModal,
  'peso-save':()=>{ const kg=num($('#pesoIn').value); if(!kg||kg<25||kg>350){ toast('Informe um peso válido em kg'); return; } savePeso(kg,$('#pesoData').value||today()); },
  'body-del':t=>{ S.body.entries=S.body.entries.filter(e=>e.id!==t.dataset.id); save('body'); render(); },
  'act-new':()=>{ S.cfg.acts.push({id:'a-'+uid(),nome:'Nova atividade',met:5,min:45}); save('cfg'); render(); },
  'imp-code':importCode, 'pub-model':publishModel,
  copy:t=>{ const txt=t.dataset.text; try{ navigator.clipboard.writeText(txt).then(()=>toast('Copiado'),()=>toast('Selecione e copie o código')); }catch(e){ toast('Selecione e copie o código'); } },
  'copy-exp':()=>{ const ta=$('#expTxt'); try{ navigator.clipboard.writeText(ta.value).then(()=>toast('Copiado'),()=>{ta.select();}); }catch(e){ ta.select(); } },
  export:exportData,
  'reset-all':()=>confirmBox('Apagar todos os seus dados deste app? Isso não pode ser desfeito.',()=>{
    S.profile=defaultProfile(); S.cfg=defaultCfg(); S.tpl=clone(D.TEMPLATES); S.prs={manual:[]}; S.body={entries:[]}; S.lib={custom:[],imgs:{}}; S.chal={}; save('chal');
    ['profile','cfg','tpl','prs','body','lib'].forEach(save); Object.keys(S.months).forEach(m=>{S.months[m]={days:{}}; Store.save('m-'+m,S.months[m]);}); Object.keys(S.logs).forEach(m=>{S.logs[m]={sessions:[]}; Store.save('lg-'+m,S.logs[m]);});
    S.active=null; persistActive(); renderTabs(); render(); openOnboarding(); },'Apagar tudo')
};
document.addEventListener('click',e=>{ const t=e.target.closest('[data-act]'); if(!t) return; const f=ACT[t.dataset.act]; if(f){ if(t.tagName==='BUTTON'||t.tagName==='A') e.preventDefault(); f(t,e); if(S.dayOpen && $('#dayModal') && t.closest('#dayModal') && !['close','cal-day'].includes(t.dataset.act)) dayModal(S.dayOpen); } });

/* ---------- campos ligados ao estado ---------- */
const BIND = {
  'dietsel':(k,v)=>{ S.dietType=v; return true; },
  'profile':(k,v)=>{ const numF=['idade','altura','peso','bf','fator']; S.profile[k]=numF.includes(k)?num(v):v; if(k==='objetivo') applyObjective(v); save('profile'); return true; },
  'water':(k,v)=>{ S.cfg.water[k]=num(v); save('cfg'); return true; },
  'pro':(k,v)=>{ S.profile.pro=S.profile.pro||{}; S.profile.pro[k]=v; save('profile'); return false; },
  'period':(k,v)=>{ S.cfg.period[k]=v; save('cfg'); return true; },
  'dt':(k,v,el)=>{ const dt=dtById(S.dietType); if(k==='act'){ const id=el.dataset.id; dt.acts=el.checked?[...new Set([...dt.acts,id])]:dt.acts.filter(a=>a!==id); } else dt[k]=k==='nome'?v:num(v); save('cfg'); return true; },
  'act':(k,v,el)=>{ const a=S.cfg.acts[+el.dataset.i]; a[k]=k==='nome'?v:num(v); save('cfg'); return k!=='nome'; },
  'tpl':(k,v)=>{ const t=tplById(S.montarSel); if(k==='wod'){ t.wod=Object.assign(t.wod||{formato:'For time'},{desc:v}); } else t[k]=v; save('tpl'); return k==='kind'||k==='cor'; },
  'tex':(k,v,el)=>{ const e=tplById(S.montarSel).ex[+el.dataset.i]; e[k]= k==='prio'?el.checked : k==='rir'?v : num(v); save('tpl'); return false; },
  'set':(k,v,el)=>{ const s=S.active.ex[+el.dataset.i].sets[+el.dataset.j]; s[k]=v; persistActive(); return false; },
  'wod':(k,v)=>{ S.active.wod[k]= k==='rx'? v==='true' : v; persistActive(); return false; },
  'daytype':(k,v,el)=>{ const d=el.dataset.date; const r=dayRec(d,true); r.dayType=v; saveMonth(d); return true; },
  'dmeal':(k,v,el)=>{ const d=el.dataset.date, r=dayRec(d,true); r.meals=r.meals||{}; const cur=r.meals[el.dataset.id]||{}; cur.op=+v; r.meals[el.dataset.id]=cur; saveMonth(d); return true; },
  'ot':(k,v,el)=>{ S.body.ot=S.body.ot||[]; S.body.ot[+el.dataset.i]=el.checked; save('body'); return true; }
};
function applyObjective(o){ const adj={cutting:-20,recomp:-10,manter:0,bulking:12}[o]; if(adj===undefined) return; toast('Ajuste calórico dos tipos de dia atualizado'); S.cfg.dayTypes.forEach(t=>{ t.adj = t.acts.length||adj>0? adj : Math.min(0,adj+7); }); save('cfg'); }
function onBind(e){
  const el=e.target; if(el.id==='libSearch'||el.id==='libGroup'){ renderLib(); return; }
  if(el.id==='rmKg'||el.id==='rmReps'){ calcRM(); return; }
  if(el.id==='rotAdd' && el.value){ S.cfg.rotation.push(el.value); save('cfg'); render(); return; }
  const b=el.dataset && el.dataset.bind; if(!b) return;
  const [ns,k]=b.split('.'); const h=BIND[ns]; if(!h) return;
  const v= el.type==='checkbox'? el.checked : el.value;
  const rerender=h(k,v,el);
  if(el.closest('#dayModal')){ render(); dayModal(S.dayOpen); return; }
  if(e.type==='change' && rerender){ const inModal=el.closest('.modal'); if(!inModal){ renderTabs(); render(); } }
}
document.addEventListener('input',e=>{ const t=e.target; if(t.matches('input[type=text],input[type=number],textarea,input[type=search]')) onBindSoft(e); });
document.addEventListener('change',onBind);
function onBindSoft(e){ const el=e.target; if(el.id==='libSearch'){ renderLib(); return; } if(el.id==='rmKg'||el.id==='rmReps'){ calcRM(); return; }
  const b=el.dataset&&el.dataset.bind; if(!b) return; const [ns,k]=b.split('.'); const h=BIND[ns]; if(h) h(k,el.type==='checkbox'?el.checked:el.value,el); }

window.addEventListener('hashchange',()=>{ const h=location.hash.slice(1); if(TABS.some(x=>x.id===h)) go(h); });
const mq=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)'); mq&&mq.addEventListener&&mq.addEventListener('change',()=>{ if(S.profile){ applyUI(); render(); } });
new MutationObserver(()=>{ if(!S.profile||S.applyingTheme) return; hostTheme=document.documentElement.getAttribute('data-theme'); applyUI(); render(); }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
setInterval(()=>{ if(S.active && S.tab==='treinar'){ const s=$('.head .sub'); if(s){ const el=Math.floor((Date.now()-S.active.start)/60000); s.firstChild && (s.innerHTML=s.innerHTML.replace(/· \d+ min ·/,`· ${el} min ·`)); } } },30000);

/* ---------- aluno & profissional ---------- */
/* Banco compartilhado (regras declaradas na publicação):
   turmas/<uidProfissional>            → dados públicos da turma (só o profissional escreve)
   alunos/<uidAluno>                   → resumo do aluno (só o aluno escreve)
   presc/<uidProfissional>/para/<uidAluno> → prescrição (só o profissional escreve)          */
const PRO = { alunos:null, loading:false, nova:null, sentAt:{} };
const canPro = ()=> !!(Store.shared && Store.uid);
function proMode(){ return S.profile.modoPro || (S.profile.pro && S.profile.pro.turma ? 'pro' : 'aluno'); }

const PERM_DEF=[['perfil','Dados básicos','idade, altura, objetivo e nível'],['peso','Peso','peso atual, histórico e meta'],['medidas','Medidas','cintura e % de gordura'],['treinos','Treinos','treinos feitos, cargas e periodização'],['prs','Recordes','recordes dos últimos 30 dias'],['dieta','Dieta','adesão ao cardápio e macros atuais'],['agua','Água','consumo em relação à meta'],['fichas','Fichas de treino','para o profissional ajustar e devolver']];
const PERM_KEYS={perfil:['objetivo','sexo','idade','altura','nivel'],peso:['pesoAtual','pesoMeta','pesos'],medidas:['cintura','bf'],treinos:['treinos7','treinos30','ultimos','periodo','metaTreinos'],prs:['prs'],dieta:['refeicoes7','kcalAlvo','dietaAtual'],agua:['agua7','aguaMlKg'],fichas:['fichas','tplFull']};
function permDefault(){ const o={auto:false}; PERM_DEF.forEach(([k])=>o[k]=true); return o; }
function turmaPerm(){ const t=S.profile.turma; if(!t) return permDefault(); t.perm=Object.assign(permDefault(),t.perm||{}); return t.perm; }
function permChecks(perm,prefix){ return `<div class="perm-list">${PERM_DEF.map(([k,n,d])=>`<label class="perm"><input type="checkbox" ${prefix?`id="${prefix}${k}"`:`data-act="perm" data-id="${k}"`} ${perm[k]?'checked':''}><span><b>${n}</b><small>${d}</small></span></label>`).join('')}</div>
  <label class="perm perm-auto"><input type="checkbox" ${prefix?`id="${prefix}auto"`:'data-act="perm" data-id="auto"'} ${perm.auto?'checked':''}><span><b>Aplicar automaticamente o que o profissional mudar</b><small>dieta, treinos e metas entram sozinhos no app; você ainda pode desfazer</small></span></label>`; }
function buildResumo(){
  const full=buildResumoFull(), perm=turmaPerm();
  Object.entries(PERM_KEYS).forEach(([k,keys])=>{ if(!perm[k]) keys.forEach(x=>delete full[x]); });
  full.perm=Object.assign({},perm); return full;
}
function buildResumoFull(){
  const p=S.profile, t=today(), L=allLogs();
  const d7=addDays(t,-6), d30=addDays(t,-29);
  const pes=pesoEntries().slice(-24).map(e=>[e.date,+e.peso]);
  const cint=S.body.entries.filter(e=>e.cintura).sort((a,b)=>a.date.localeCompare(b.date));
  let agua=0, ref=0, refN=0;
  for(let i=0;i<7;i++){ const d=addDays(t,-i), r=dayRec(d), g=waterGoal(d);
    agua+= r&&g? Math.min(1,(r.water||0)/g) : 0;
    const n=(S.cfg.meals[dayTypeOf(d)]||[]).length; refN+=n; ref+= r&&r.meals? Math.min(n,Object.values(r.meals).filter(x=>x&&x.done).length):0; }
  const best=e=>{ let b=null; (e.sets||[]).forEach(s=>{ const v=e1rm(num(s.kg),num(s.reps)); if(!b||v>b.v) b={v,kg:num(s.kg),reps:num(s.reps)}; }); return b; };
  const pw=periodWeek(t);
  return {
    turma:p.turma.code, proId:p.turma.proId, nome:p.nome||Store.meName||'Aluno', objetivo:p.objetivo, sexo:p.sexo, idade:+p.idade||null, altura:+p.altura||null,
    nivel:p.nivel, pesoAtual:+p.peso||null, pesoMeta:+p.pesoMeta||null, bf:+p.bf||null, pesos:pes,
    cintura: cint.length? {v:+cint[cint.length-1].cintura, ini:+cint[0].cintura, date:cint[cint.length-1].date} : null,
    treinos7:L.filter(l=>l.date>=d7).length, treinos30:L.filter(l=>l.date>=d30).length,
    ultimos:L.slice(-6).reverse().map(l=>({date:l.date,nome:l.nome||'',dur:l.durMin||0,vol:l.vol||0,
      top:(l.ex||[]).map(e=>({n:e.nome||(exById(e.exId)||{}).nome||e.exId,b:best(e)})).filter(x=>x.b&&x.b.kg>0).slice(0,3).map(x=>`${x.n} ${fmt(x.b.kg,1).replace(',0','')}×${x.b.reps}`)})),
    prs:recentPRs(30).slice(0,6).map(r=>({n:r.nome||(exById(r.exId)||{}).nome||r.exId,kg:r.kg,reps:r.reps,date:r.date})),
    agua7:Math.round(agua/7*100), refeicoes7: refN? Math.round(ref/refN*100) : null,
    fichas:S.tpl.map(x=>x.nome).slice(0,12), periodo: pw&&pw.w? `Semana ${pw.n}/${pw.total} · ${pw.w.fase}` : null,
    kcalAlvo: Math.round(typeTarget(dtById(dayTypeOf(t))).kcal),
    dietaAtual: S.cfg.dayTypes.map(x=>({id:x.id,nome:x.nome||x.id,adj:x.adj,pKg:x.pKg,gKg:x.gKg,kcal:Math.round(typeTarget(x).kcal)})),
    aguaMlKg:S.cfg.water.mlKg, metaTreinos:+p.metaTreinos||null,
    tplFull:clone(S.tpl).map(x=>{ delete x.from; return x; }),
    prescTs:(p.presc&&p.presc.ts)||0, recado:p.turma.recado||'', recadoTs:p.turma.recadoTs||0,
    atualizado:Date.now()
  };
}
let resumoT=null;
function queueResumo(ms){ if(!canPro()||!S.profile||!S.profile.turma) return; clearTimeout(resumoT); resumoT=setTimeout(syncResumo,ms??4000); }
async function syncResumo(){
  if(!canPro()||!S.profile.turma) return false;
  try{ await Store.shared.doc('alunos/'+Store.uid).set(buildResumo()); S.profile.turma.sync=Date.now(); Store.lsSet('profile',S.profile); return true; }
  catch(e){ if(e&&e.code==='invalid_argument') S.proErr='Sem permissão para enviar o resumo. Peça ao dono do app acesso de Colaborador ao link.'; return false; }
}
(function hookSave(){ const orig=Store.save.bind(Store);
  Store.save=function(k,v){ orig(k,v); if(/^(body|meta|tpl|cfg|lg-|m-)/.test(k) || (k==='profile' && S.profile && S.profile.turma)) queueResumo(); }; })();

async function proBoot(){
  if(!canPro()) return;
  const t=S.profile.turma; if(!t) return;
  await checkPresc(true); queueResumo(1500);
}
async function checkPresc(silent){
  const t=S.profile.turma; if(!canPro()||!t) return null;
  try{ const s=await Store.shared.doc(`presc/${t.proId}/para/${Store.uid}`).get();
    if(s.exists){ const d=s.data(); if(d.ts>((S.profile.presc&&S.profile.presc.ts)||0) && d.turma===t.code){ PRO.nova=d;
      if(turmaPerm().auto){ PRO.auto=d; prescAplicar(true); return d; }
      if(!silent||S.tab==='hoje'||S.tab==='pro') render(); return d; } }
    PRO.nova=null; if(!silent) toast('Nenhuma prescrição nova'); }
  catch(e){ if(!silent) toast('Não foi possível verificar agora'); }
  return null;
}
function prescBanner(){
  const a=PRO.auto; if(a && !PRO.nova) return `<div class="presc-banner"><div class="pb-ic">${ICON.mais}</div><div><b>${esc(a.de.nome)} atualizou seu plano</b><div class="small muted">${prescIncl(a.payload)}${a.msg?` · “${esc(a.msg.slice(0,90))}${a.msg.length>90?'…':''}”`:''}</div></div><div class="row" style="gap:6px"><button class="btn ghost sm" data-act="presc-desfazer">Desfazer</button><button class="btn primary sm" data-act="auto-ok">Ok</button></div></div>`;
  const n=PRO.nova; if(!n) return '';
  return `<div class="presc-banner"><div class="pb-ic">${ICON.mais}</div><div><b>${esc(n.de.nome)} enviou uma nova prescrição</b><div class="small muted">${prescIncl(n.payload)}${n.msg?` · “${esc(n.msg.slice(0,90))}${n.msg.length>90?'…':''}”`:''}</div></div><button class="btn primary sm" data-act="presc-ver">Ver e aplicar</button></div>`;
}
function prescIncl(p){ p=p||{}; return [p.tpl&&`${p.tpl.length} ficha${p.tpl.length>1?'s':''}`,p.metas&&'metas',p.dayTypes&&'dieta e macros',p.period&&'periodização',p.weekPattern&&'semana padrão'].filter(Boolean).join(', ')||'apenas mensagem'; }

/* aplica um pacote (modelo por código ou prescrição); tag identifica a origem */
function applyPayload(p,tag,autor){
  Store.save('prebkp',{ts:Date.now(),tag,tpl:clone(S.tpl),cfg:clone(S.cfg)}); S.hasBkp=true;
  if(p.tpl && p.tpl.length){
    const suf='-'+tag.toLowerCase(); S.tpl=p.replaceTpl? [] : S.tpl.filter(t=>t.from!==tag);
    const ids=new Set(S.tpl.map(t=>t.id)), map={};
    const names=new Set(S.tpl.map(t=>t.nome)), who=autor&&autor.nome?autor.nome.split(' ')[0]:tag;
    p.tpl.forEach(t=>{ const nt=clone(t); const old=nt.id; if(ids.has(nt.id)) nt.id=nt.id+suf; nt.from=tag; if(names.has(nt.nome)) nt.nome=nt.nome+' · '+who; map[old]=nt.id; S.tpl.push(nt); });
    if(p.rotation) { S.cfg.rotation=p.rotation.map(id=>map[id]||id).filter(id=>S.tpl.some(t=>t.id===id)); S.cfg.rotIdx=0; }
    if(p.weekPattern) Object.values(p.weekPattern).forEach(arr=>(arr||[]).forEach(x=>{ if(x.tplId&&map[x.tplId]) x.tplId=map[x.tplId]; }));
  }
  if(p.custom){ p.custom.forEach(e=>{ if(!S.lib.custom.some(x=>x.id===e.id)) S.lib.custom.push(e); }); save('lib'); }
  if(p.acts) p.acts.forEach(a=>{ if(!S.cfg.acts.some(x=>x.id===a.id)) S.cfg.acts.push(clone(a)); });
  if(p.dayTypes){ S.cfg.dayTypes=clone(p.dayTypes); S.cfg.meals=mealsWithIds(clone(p.meals||{})); }
  if(p.period){ S.cfg.period.weeks=clone(p.period.weeks); S.cfg.period.preset=p.period.preset||'custom'; if(p.period.start) S.cfg.period.start=p.period.start; }
  if(p.weekPattern) S.cfg.weekPattern=clone(p.weekPattern);
  if(p.metas){ const m=p.metas;
    if(m.pesoMeta) S.profile.pesoMeta=m.pesoMeta; if(m.treinosSemana) S.profile.metaTreinos=m.treinosSemana; if(m.aguaMlKg) S.cfg.water.mlKg=m.aguaMlKg;
    S.cfg.dayTypes.forEach(dt=>{ if(m.pKg) dt.pKg=m.pKg; if(m.gKg) dt.gKg=m.gKg; if(m.adj!=null && m.adj!=='') dt.adj=m.adj; }); }
  if(autor) S.profile.parceiro=autor;
  save('tpl'); save('cfg'); save('profile');
}
function collectPayload(o){
  const payload={};
  if(o.t) payload.tpl=clone(S.tpl), payload.rotation=clone(S.cfg.rotation), payload.custom=clone(S.lib.custom);
  if(o.d) payload.dayTypes=clone(S.cfg.dayTypes), payload.meals=clone(S.cfg.meals), payload.acts=clone(S.cfg.acts);
  if(o.p) payload.period={preset:S.cfg.period.preset,weeks:clone(S.cfg.period.weeks),start:o.start||null};
  if(o.w) payload.weekPattern=clone(S.cfg.weekPattern);
  return payload;
}
function autorInfo(){ const pro=S.profile.pro||{}; return {nome:pro.nome||S.profile.nome||Store.meName||'Profissional',tipo:pro.tipo||'Educador físico',registro:pro.registro||'',contato:pro.contato||''}; }

/* ----- aluno ----- */
async function turmaEntrar(){
  const code=($('#turmaCode').value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,''), out=$('#turmaOut');
  if(code.length<5){ out.innerHTML='<p class="small bad">Digite o código de 6 caracteres que o profissional passou.</p>'; return; }
  const perm={}; [...PERM_DEF.map(x=>x[0]),'auto'].forEach(k=>{ const el=$('#jp-'+k); perm[k]=!!(el&&el.checked); });
  out.innerHTML='<p class="small muted">Procurando turma…</p>';
  try{
    const q=await Store.shared.collection('turmas').where('code','==',code).get();
    const docs=q.docs.filter(d=>d.exists).sort((a,b)=>(a.data().criado||0)-(b.data().criado||0));
    if(!docs.length){ out.innerHTML='<p class="small bad">Turma não encontrada. Confira o código com o profissional.</p>'; return; }
    const d=docs[0], t=d.data();
    if(d.id===Store.uid){ out.innerHTML='<p class="small bad">Esse é o código da sua própria turma. Envie-o aos seus alunos.</p>'; return; }
    S.profile.turma={code,proId:d.id,nome:t.nome,tipo:t.tipo,registro:t.registro||'',contato:t.contato||'',desde:today(),perm};
    S.profile.parceiro={nome:t.nome,tipo:t.tipo,registro:t.registro||'',contato:t.contato||''};
    save('profile');
    const ok=await syncResumo();
    if(!ok){ const err=S.proErr||'Não foi possível enviar seu resumo agora.'; delete S.profile.turma; save('profile'); out.innerHTML=`<p class="small bad">${esc(err)}</p>`; return; }
    await checkPresc(true); render(); toast('Você entrou na turma de '+t.nome);
  }catch(e){ out.innerHTML='<p class="small bad">Não foi possível buscar agora. Tente de novo.</p>'; }
}
async function turmaSair(){
  confirmBox('Sair da turma? Seu resumo deixa de ser compartilhado com o profissional. Suas fichas e dados continuam no seu app.',async()=>{
  try{ await Store.shared.doc('alunos/'+Store.uid).delete(); }catch(e){}
  delete S.profile.turma; PRO.nova=null; save('profile'); render(); toast('Você saiu da turma'); },'Sair da turma');
}
function prescModal(){
  const n=PRO.nova; if(!n) return; const p=n.payload||{};
  const det=[];
  if(p.tpl) det.push(`<li><b>Fichas:</b> ${p.tpl.map(t=>esc(t.nome)).join(', ')}${p.rotation?` <span class="muted">(rodízio ${p.rotation.length})</span>`:''}</li>`);
  if(p.dayTypes) det.push(`<li><b>Dieta:</b> ${p.dayTypes.map(t=>`${esc(t.nome||t.id)} (${t.adj>0?'+':''}${t.adj}% · P ${t.pKg} g/kg · G ${t.gKg} g/kg)`).join('; ')}</li>`);
  if(p.period) det.push(`<li><b>Periodização:</b> ${p.period.weeks.length} semanas${p.period.start?' a partir de '+dshort(p.period.start):''}</li>`);
  if(p.weekPattern) det.push('<li><b>Semana padrão:</b> horários e atividades de cada dia</li>');
  if(p.metas) det.push(`<li><b>Metas:</b> ${metasTxt(p.metas)}</li>`);
  if(p.replaceTpl) det.push('<li class="muted">As fichas enviadas substituem as suas fichas atuais.</li>');
  modal(`<div class="modal-h"><h3>Prescrição de ${esc(n.de.nome)}</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
    <p class="small muted">${esc(n.de.tipo||'')}${n.de.registro?' · '+esc(n.de.registro):''} · enviada em ${new Date(n.ts).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}</p>
    ${n.msg?`<div class="note">${esc(n.msg).replace(/\n/g,'<br>')}</div>`:''}
    ${det.length?`<ul class="ch-ol">${det.join('')}</ul><p class="small muted">Ao aplicar, as fichas enviadas entram na sua lista (as antigas desse profissional são trocadas) e a dieta, a periodização e a semana substituem as atuais. Você pode desfazer depois.</p>`:''}
    <div class="row"><button class="btn" data-act="presc-depois">Depois</button>${det.length?`<button class="btn primary" data-act="presc-aplicar">Aplicar no meu app</button>`:`<button class="btn primary" data-act="presc-aplicar">Marcar como lida</button>`}</div>`);
}
function metasTxt(m){ return [m.pesoMeta&&`peso ${fmt(m.pesoMeta,1)} kg`,m.treinosSemana&&`${m.treinosSemana} treinos/semana`,m.aguaMlKg&&`água ${m.aguaMlKg} ml/kg`,m.pKg&&`proteína ${fmt(m.pKg,1)} g/kg`,m.gKg&&`gordura ${fmt(m.gKg,1)} g/kg`,(m.adj!=null&&m.adj!=='')&&`calorias ${m.adj>0?'+':''}${m.adj}% do gasto`].filter(Boolean).join(' · '); }
function prescAplicar(auto){
  const n=PRO.nova; if(!n) return auto===true?null:closeModal();
  if(n.payload && Object.keys(n.payload).length) applyPayload(n.payload,'p-'+n.turma,n.de);
  S.profile.presc={ts:n.ts,de:n.de.nome,msg:n.msg||'',em:Date.now(),incl:prescIncl(n.payload)}; PRO.nova=null; save('profile');
  if(auto!==true) closeModal(); renderTabs(); render(); toast(auto===true?n.de.nome+' atualizou seu plano':'Prescrição aplicada'); queueResumo(500);
}
async function prescDesfazer(){
  const b=await Store.load('prebkp'); if(!b||!b.tpl){ toast('Nada para desfazer'); return; }
  confirmBox('Voltar fichas, dieta e periodização para como estavam antes da última importação?',()=>{
  S.tpl=b.tpl; S.cfg=Object.assign(defaultCfg(),b.cfg); save('tpl'); save('cfg'); Store.save('prebkp',{}); S.hasBkp=false; PRO.auto=null; render(); toast('Restaurado'); },'Desfazer');
}
async function recadoEnviar(){
  const v=($('#recadoTxt').value||'').trim(); if(!S.profile.turma) return;
  S.profile.turma.recado=v.slice(0,600); S.profile.turma.recadoTs=Date.now(); save('profile');
  const ok=await syncResumo(); toast(ok?'Recado enviado':'Recado salvo; será enviado quando houver conexão'); render();
}

/* ----- profissional ----- */
async function turmaCriar(){
  const pro=S.profile.pro=S.profile.pro||{}; if(!pro.nome){ toast('Preencha seu nome ou o nome da academia'); $('#proNome')&&$('#proNome').focus(); return; }
  const code=pro.turma||genCode();
  try{ await Store.shared.doc('turmas/'+Store.uid).set({code,nome:pro.nome,tipo:pro.tipo||'Educador físico',registro:pro.registro||'',contato:pro.contato||'',criado:pro.turmaCriada||Date.now()});
    pro.turma=code; pro.turmaCriada=pro.turmaCriada||Date.now(); S.profile.modoPro='pro'; save('profile'); render(); proLoad();
    toast('Turma criada · código '+code);
  }catch(e){ toast(e&&e.code==='invalid_argument'?'Sem permissão: peça ao dono do app acesso de Colaborador':'Não foi possível criar agora'); }
}
async function turmaAtualizarDados(){ const pro=S.profile.pro; if(!pro||!pro.turma||!canPro()) return;
  try{ await Store.shared.doc('turmas/'+Store.uid).set({code:pro.turma,nome:pro.nome||'',tipo:pro.tipo||'',registro:pro.registro||'',contato:pro.contato||'',criado:pro.turmaCriada||Date.now()}); toast('Dados da turma atualizados'); }catch(e){ toast('Não foi possível atualizar'); } }
async function turmaNovoCodigo(){
  confirmBox('Gerar um novo código? Alunos atuais saem da lista e precisam entrar de novo com o novo código.',async()=>{ S.profile.pro.turma=genCode(); await turmaCriar(); },'Gerar novo código');
}
async function proLoad(){
  const pro=S.profile.pro; if(!canPro()||!pro||!pro.turma) return;
  PRO.loading=true; paintAlunos();
  try{ const q=await Store.shared.collection('alunos').where('proId','==',Store.uid).where('turma','==',pro.turma).get();
    PRO.alunos=q.docs.filter(d=>d.exists).map(d=>Object.assign({uid:d.id},d.data())).filter(a=>a.proId===Store.uid).sort((a,b)=>(b.atualizado||0)-(a.atualizado||0));
  }catch(e){ PRO.alunos=PRO.alunos||[]; toast('Não foi possível carregar os alunos'); }
  PRO.loading=false; paintAlunos();
}
function spark(pts,w=120,h=34){
  if(!pts||pts.length<2) return '<span class="small muted">poucos registros</span>';
  const ys=pts.map(p=>p[1]), mn=Math.min(...ys), mx=Math.max(...ys), r=(mx-mn)||1;
  const xy=ys.map((y,i)=>[(i/(ys.length-1))*(w-4)+2, h-3-((y-mn)/r)*(h-6)]);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><polyline fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" points="${xy.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ')}"/><circle cx="${xy[xy.length-1][0].toFixed(1)}" cy="${xy[xy.length-1][1].toFixed(1)}" r="2.4" fill="var(--accent)"/></svg>`;
}
function ago(ts){ if(!ts) return '—'; const m=Math.round((Date.now()-ts)/60000); if(m<2) return 'agora'; if(m<60) return `há ${m} min`; const h=Math.round(m/60); if(h<24) return `há ${h} h`; const d=Math.round(h/24); return `há ${d} dia${d>1?'s':''}`; }
const OBJ_TXT={recomp:'Recomposição',cut:'Perder gordura',bulk:'Ganhar massa',manter:'Manutenção',perda:'Perder gordura',ganho:'Ganhar massa'};
function alunoStatus(a){
  const dias=(Date.now()-(a.atualizado||0))/864e5;
  if(dias>7) return ['off','Sem atualizar há '+Math.round(dias)+' dias'];
  if((a.treinos7||0)===0) return ['warn','Nenhum treino em 7 dias'];
  if(a.agua7!=null && a.agua7<50) return ['warn','Água abaixo de 50%'];
  return ['ok','Em dia'];
}
function pesoDelta(a){ const p=a.pesos||[]; if(p.length<2) return null; return p[p.length-1][1]-p[0][1]; }
function paintAlunos(){
  const el=$('#proList'); if(!el) return;
  if(PRO.loading && !PRO.alunos){ el.innerHTML='<p class="small muted">Carregando alunos…</p>'; return; }
  const L=PRO.alunos||[];
  if(!L.length){ el.innerHTML=`<div class="empty-pro"><p><b>Nenhum aluno ainda.</b></p><p class="small muted">Envie o código da turma. Quando o aluno entrar, ele aparece aqui com peso, treinos e adesão.</p></div>`; return; }
  const ativos=L.filter(a=>alunoStatus(a)[0]==='ok').length;
  el.innerHTML=`<div class="row small muted" style="margin-bottom:8px">${L.length} aluno${L.length>1?'s':''} · ${ativos} em dia</div><div class="aluno-grid">${L.map(a=>{
    const [st,stt]=alunoStatus(a), dp=pesoDelta(a);
    return `<button class="aluno-card" data-act="aluno-abrir" data-id="${esc(a.uid)}">
      <div class="ac-top"><span class="ac-av">${esc((a.nome||'A').trim().slice(0,1).toUpperCase())}</span><div class="ac-n"><b>${esc(a.nome||'Aluno')}</b><span class="small muted">${esc(OBJ_TXT[a.objetivo]||a.objetivo||'')}${a.idade?' · '+a.idade+' anos':''}</span></div><span class="ac-st ${st}" title="${esc(stt)}"></span></div>
      <div class="ac-mid"><div><div class="v num">${a.pesoAtual?fmt(a.pesoAtual,1):'—'}<small> kg</small></div><div class="small ${dp==null?'muted':dp<0?'good':''}">${dp==null?'—':(dp>0?'+':'')+fmt(dp,1)+' kg'}</div></div>${spark(a.pesos)}</div>
      <div class="ac-kpi"><span><b class="num">${a.treinos7||0}</b> treinos/7d</span><span><b class="num">${a.agua7??'—'}%</b> água</span><span><b class="num">${a.refeicoes7??'—'}${a.refeicoes7==null?'':'%'}</b> dieta</span></div>
      <div class="small muted ac-ft">${esc(stt)} · ${ago(a.atualizado)}${a.recado&&a.recadoTs>((PRO.sentAt[a.uid])||0)?' · <b class="accent">recado novo</b>':''}</div></button>`; }).join('')}</div>`;
}
const HID='<p class="small muted hid">O aluno não compartilhou.</p>';
async function alunoAbrir(id){
  const a=(PRO.alunos||[]).find(x=>x.uid===id); if(!a) return; S.proAluno=id;
  const pm=Object.assign(permDefault(),a.perm||{});
  let last=null; try{ const s=await Store.shared.doc(`presc/${Store.uid}/para/${id}`).get(); if(s.exists) last=s.data(); }catch(e){}
  const dp=pesoDelta(a), c=a.cintura, dt0=(a.dietaAtual||[])[0]||{}, first=(a.nome||'aluno').split(' ')[0];
  const copias=S.tpl.filter(t=>t.from==='edit-'+id);
  const tplList=S.tpl.map(t=>`<label class="perm sm"><input type="checkbox" class="psTpl" value="${esc(t.id)}" ${copias.length?(t.from==='edit-'+id?'checked':''):''}><span><b>${esc(t.nome)}</b><small>${t.kind==='crossfit'?'WOD':t.ex.length+' exercícios'}</small></span></label>`).join('');
  modal(`<div class="modal-h"><h3>${esc(a.nome||'Aluno')}</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
   <p class="small muted">${pm.perfil?`${esc(OBJ_TXT[a.objetivo]||'')}${a.idade?' · '+a.idade+' anos':''}${a.altura?' · '+a.altura+' cm':''}${a.nivel?' · '+esc(a.nivel):''} · `:''}atualizado ${ago(a.atualizado)}</p>
   <div class="row" style="gap:22px;flex-wrap:wrap">${pm.peso?stat(a.pesoAtual?fmt(a.pesoAtual,1):'—',' kg','peso'+(dp!=null?` (${dp>0?'+':''}${fmt(dp,1)})`:''))+stat(a.pesoMeta?fmt(a.pesoMeta,1):'—',' kg','meta'):''}${pm.medidas?stat(c?fmt(c.v,1):'—',' cm','cintura'+(c&&c.ini!==c.v?` (${c.v-c.ini>0?'+':''}${fmt(c.v-c.ini,1)})`:''))+stat(a.bf?fmt(a.bf,1):'—','%','gordura'):''}${pm.treinos?stat(a.treinos30||0,'','treinos em 30 dias'):''}${pm.dieta?stat(a.kcalAlvo||'—',' kcal','alvo de hoje'):''}</div>
   ${pm.peso&&(a.pesos||[]).length>1?`<div class="spark-lg">${spark(a.pesos,520,90)}<div class="row between small muted"><span>${dshort(a.pesos[0][0])}</span><span>${dshort(a.pesos[a.pesos.length-1][0])}</span></div></div>`:''}
   <div class="grid g2"><div><h4>Últimos treinos</h4>${!pm.treinos?HID:(a.ultimos||[]).length?`<ul class="plain small">${a.ultimos.map(l=>`<li><b>${dshort(l.date)}</b> · ${esc(l.nome)} · ${l.dur} min${l.top.length?`<br><span class="muted">${l.top.map(esc).join(' · ')}</span>`:''}</li>`).join('')}</ul>`:'<p class="small muted">Nenhum treino registrado.</p>'}
     ${pm.treinos&&a.periodo?`<p class="small">Periodização: ${esc(a.periodo)}</p>`:''}</div>
   <div><h4>Recordes (30 dias)</h4>${!pm.prs?HID:(a.prs||[]).length?`<ul class="plain small">${a.prs.map(r=>`<li>${esc(r.n)} · <b class="num">${fmt(r.kg,1).replace(',0','')} kg × ${r.reps}</b> <span class="muted">${dshort(r.date)}</span></li>`).join('')}</ul>`:'<p class="small muted">Sem recordes novos.</p>'}
   <h4>Adesão (7 dias)</h4><p class="small">Água: ${pm.agua?`<b>${a.agua7??'—'}%</b> da meta`:'<span class="muted">não compartilhado</span>'} · Refeições: ${pm.dieta?`<b>${a.refeicoes7??'—'}${a.refeicoes7==null?'':'%'}</b>`:'<span class="muted">não compartilhado</span>'}</p>
   ${pm.dieta&&(a.dietaAtual||[]).length?`<p class="small muted">Dieta atual: ${a.dietaAtual.map(x=>`${esc(x.nome)} ${x.kcal} kcal (${x.adj>0?'+':''}${x.adj}%)`).join(' · ')} · P ${fmt(dt0.pKg,1)} g/kg · G ${fmt(dt0.gKg,1)} g/kg</p>`:''}</div></div>
   ${a.recado?`<div class="note"><b>Recado do aluno</b> <span class="small muted">${ago(a.recadoTs)}</span><br>${esc(a.recado).replace(/\n/g,'<br>')}</div>`:''}
   <div class="presc-box"><h4>Alterar o plano de ${esc(first)}</h4>
     ${last?`<p class="small">Última alteração enviada ${ago(last.ts)} · ${a.prescTs>=last.ts?'<span class="good">aplicada</span>':'<span class="warn-t">aguardando o aluno aplicar</span>'}${pm.auto?' · o aluno aplica automaticamente':''}</p>`:pm.auto?'<p class="small good">O aluno autorizou: suas alterações entram direto no app dele.</p>':''}
     <details open><summary><b>Metas</b></summary><div class="fgrid" style="margin-top:8px">
       <label class="f">Meta de peso (kg)<input type="number" step="0.1" id="mtPeso" value="${a.pesoMeta||''}"></label>
       <label class="f">Treinos por semana<input type="number" min="1" max="14" id="mtTreinos" value="${a.metaTreinos||''}"></label>
       <label class="f">Água (ml por kg)<input type="number" min="20" max="70" id="mtAgua" value="${a.aguaMlKg||''}"></label></div></details>
     <details open><summary><b>Dieta</b></summary><div class="fgrid" style="margin-top:8px">
       <label class="f">Proteína (g/kg)<input type="number" step="0.1" id="mtP" value="${dt0.pKg??''}"></label>
       <label class="f">Gordura (g/kg)<input type="number" step="0.1" id="mtG" value="${dt0.gKg??''}"></label>
       <label class="f">Calorias vs. gasto (%)<input type="number" step="1" id="mtAdj" placeholder="manter" value=""></label></div>
       <label class="small"><input type="checkbox" id="psD"> Enviar também meus tipos de dia e cardápios</label></details>
     <details open><summary><b>Treinos</b></summary><div style="margin-top:8px">
       ${pm.fichas&&(a.tplFull||[]).length?`<div class="row small" style="margin-bottom:8px"><button class="btn sm" data-act="aluno-fichas" data-id="${esc(id)}">${copias.length?'Trazer de novo as fichas do aluno':'Trazer as fichas do aluno para editar'}</button><span class="muted">Elas vão para Treino › Fichas com “· ${esc(first)}” no nome. Edite lá e volte aqui.</span></div>`:'<p class="small muted">Monte as fichas em Treino › Fichas e marque abaixo o que enviar.</p>'}
       <div class="perm-list">${tplList||'<p class="small muted">Você ainda não tem fichas.</p>'}</div>
       <label class="small"><input type="checkbox" id="psRepl" ${copias.length?'checked':''}> Substituir as fichas atuais do aluno</label></div></details>
     <details><summary><b>Periodização e semana</b></summary><div class="row small" style="margin-top:8px"><label><input type="checkbox" id="psP"> Minha periodização</label><label><input type="checkbox" id="psW"> Minha semana padrão</label></div>
       <label class="f small">Começar a periodização em<input type="date" id="psStart" value="${mondayOf(addDays(today(),7))}"></label></details>
     <label class="f">Mensagem ao aluno<textarea id="psMsg" rows="3" placeholder="Ex.: nesta fase, foque na técnica e mantenha 2 repetições em reserva."></textarea></label>
     <div class="row"><button class="btn" data-act="close">Fechar</button><button class="btn primary" data-act="presc-enviar" data-id="${esc(id)}">Enviar para ${esc(first)}</button></div></div>`,true);
  PRO.sentAt[id]=Date.now(); paintAlunos();
}
function alunoFichas(t){
  const id=t.dataset.id, a=(PRO.alunos||[]).find(x=>x.uid===id); if(!a||!a.tplFull) return;
  const first=(a.nome||'Aluno').split(' ')[0];
  S.tpl=S.tpl.filter(x=>x.from!=='edit-'+id);
  a.tplFull.forEach(x=>{ const nt=clone(x); nt.origNome=nt.nome; nt.nome=nt.nome+' · '+first; nt.id=nt.id+'-e'+id.slice(0,5).toLowerCase(); nt.from='edit-'+id; S.tpl.push(nt); });
  save('tpl'); closeModal(); toast(a.tplFull.length+' fichas de '+first+' copiadas. Edite em Fichas.'); S.montarSel=S.tpl.find(x=>x.from==='edit-'+id).id; go('montar');
}
const numOr=(sel)=>{ const v=($(sel)||{}).value; return v===''||v==null? null : num(v); };
async function prescEnviar(t){
  const id=t.dataset.id, a=(PRO.alunos||[]).find(x=>x.uid===id), pro=S.profile.pro;
  const ids=[...document.querySelectorAll('.psTpl:checked')].map(x=>x.value);
  const payload=collectPayload({t:false,d:$('#psD').checked,p:$('#psP').checked,w:$('#psW').checked,start:$('#psStart').value||null});
  if(ids.length){ payload.tpl=S.tpl.filter(x=>ids.includes(x.id)).map(x=>{ const n=clone(x); if(n.origNome){ n.nome=n.origNome; delete n.origNome; } delete n.from; return n; });
    payload.rotation=payload.tpl.filter(x=>x.kind!=='crossfit').map(x=>x.id); payload.custom=clone(S.lib.custom); if($('#psRepl').checked) payload.replaceTpl=true; }
  const m={pesoMeta:numOr('#mtPeso'),treinosSemana:numOr('#mtTreinos'),aguaMlKg:numOr('#mtAgua'),pKg:numOr('#mtP'),gKg:numOr('#mtG'),adj:numOr('#mtAdj')};
  const orig={pesoMeta:a.pesoMeta||null,treinosSemana:a.metaTreinos||null,aguaMlKg:a.aguaMlKg||null,pKg:((a.dietaAtual||[])[0]||{}).pKg??null,gKg:((a.dietaAtual||[])[0]||{}).gKg??null,adj:null};
  const metas={}; Object.keys(m).forEach(k=>{ if(m[k]!=null && m[k]!==orig[k]) metas[k]=m[k]; }); if(Object.keys(metas).length) payload.metas=metas;
  const msg=($('#psMsg').value||'').trim().slice(0,1500);
  if(!Object.keys(payload).length && !msg){ toast('Altere alguma meta, escolha fichas ou escreva uma mensagem'); return; }
  t.disabled=true; t.textContent='Enviando…';
  try{ await Store.shared.doc(`presc/${Store.uid}/para/${id}`).set({turma:pro.turma,de:autorInfo(),ts:Date.now(),msg,payload});
    closeModal(); toast('Enviado para '+((a&&a.nome)||'o aluno'));
  }catch(e){ t.disabled=false; t.textContent='Tentar de novo'; toast(e&&e.code==='invalid_argument'?'Sem permissão para enviar':'Não foi possível enviar agora'); }
}

/* ----- tela ----- */
VIEWS.pro = ()=>{
  const m=proMode(), p=S.profile, pro=p.pro||{};
  const seg=`<div class="seg" role="group"><button data-act="pro-modo" data-id="aluno" aria-pressed="${m==='aluno'}">Sou aluno</button><button data-act="pro-modo" data-id="pro" aria-pressed="${m==='pro'}">Sou profissional</button></div>`;
  const off=!canPro()?`<div class="note warn"><b>Conexão aluno ↔ profissional indisponível neste modo.</b><br><span class="small">${Store.standalone?(window.EVO_CLOUD&&window.EVO_CLOUD.configured?'Entre com sua conta Google para usar.</span> <button class="btn sm primary" data-act="evo-login">Entrar com Google</button><span>':'Esta cópia ainda não foi ligada ao Firebase. Veja o passo a passo no arquivo LEIA-ME (README) do projeto.'):'Ela funciona quando o app é aberto pelo link do Claude, com login.'}</span></div>`:'';
  const err=S.proErr?`<div class="note warn small">${esc(S.proErr)}</div>`:'';
  return `<div class="head"><div><h2>Aluno & profissional</h2><div class="sub">O aluno salva tudo na nuvem e escolhe o que mostrar. O profissional acompanha e altera dieta, treinos e metas.</div></div>${seg}</div>${off}${err}
  ${m==='aluno'?alunoView():proView()}
`;
};
function alunoView(){
  const p=S.profile, t=p.turma;
  const how=`<ol class="how"><li><b>Peça o código</b> da turma ao seu professor, nutricionista ou academia.</li><li><b>Digite aqui</b> e autorize. Seu resumo (peso, treinos, adesão) passa a aparecer para ele.</li><li><b>Receba prescrições</b>: quando ele enviar fichas ou dieta, um aviso aparece em Hoje para você aplicar.</li></ol>`;
  if(!t) return `<section class="card"><h3>Entrar na turma do seu profissional</h3>${how}
    <div class="join"><label class="f">Código da turma<input type="text" id="turmaCode" maxlength="8" placeholder="ex.: K7Q2XM" autocomplete="off" style="text-transform:uppercase;letter-spacing:.12em;font-size:1.2rem"></label>
    <div><div class="eyebrow" style="margin-bottom:6px">O que o profissional pode ver</div>${permChecks(permDefault(),'jp-')}<p class="small muted">Seu nome sempre aparece. Só o profissional da turma vê esses dados, e você pode mudar ou sair quando quiser.</p></div>
    <button class="btn primary" data-act="turma-entrar" ${canPro()?'':'disabled'}>Entrar na turma</button><div id="turmaOut"></div></div></section>`;
  const pr=p.presc;
  return `<section class="card pro-hero"><div class="row between" style="align-items:flex-start;gap:14px"><div><div class="eyebrow">Acompanhado por</div><h3 style="margin:.15em 0">${esc(t.nome)}</h3><div class="small muted">${esc(t.tipo||'')}${t.registro?' · '+esc(t.registro):''}${t.contato?' · '+esc(t.contato):''} · desde ${dshort(t.desde)}</div></div><span class="pill">Turma ${esc(t.code)}</span></div>
    ${p.metaTreinos?`<div class="small" style="margin-top:8px">Meta: <b>${p.metaTreinos} treinos por semana</b></div>`:''}
    <div class="row small muted" style="margin-top:10px">Resumo enviado ${ago(t.sync)} · atualiza sozinho quando você registra treino, peso, água ou refeições.</div>
    <div class="row"><button class="btn sm" data-act="resumo-sync">Atualizar agora</button><button class="btn sm" data-act="presc-check">Verificar prescrição</button><button class="btn ghost sm" data-act="turma-sair">Sair da turma</button></div></section>
  ${PRO.nova?`<section class="card">${prescBanner()}</section>`:''}
  <section class="card"><h3>O que ${esc(t.nome.split(' ')[0])} pode ver e alterar</h3><p class="small muted">Desmarque o que não quer compartilhar. A mudança vale na hora.</p>${permChecks(turmaPerm())}</section>
  <section class="card"><h3>Prescrição atual</h3>${pr?`<p><b>${esc(pr.de)}</b> · aplicada ${ago(pr.em)}<br><span class="small muted">${esc(pr.incl||'')}</span></p>${pr.msg?`<div class="note small">${esc(pr.msg).replace(/\n/g,'<br>')}</div>`:''}<button class="btn ghost sm" data-act="presc-desfazer">Desfazer última aplicação</button>`:'<p class="small muted">Ainda nenhuma prescrição recebida. Quando chegar, aparece um aviso na tela Hoje.</p>'}</section>
  <section class="card"><h3>Recado para ${esc(t.nome.split(' ')[0])}</h3><p class="small muted">Dúvidas, dores, pedidos de ajuste. Aparece no seu cartão para o profissional.</p>
    <textarea id="recadoTxt" rows="3" maxlength="600" placeholder="Ex.: senti o ombro no supino, posso trocar por halteres?">${esc(t.recado||'')}</textarea>
    <div class="row"><button class="btn primary sm" data-act="recado-enviar">Enviar recado</button>${t.recadoTs?`<span class="small muted">último ${ago(t.recadoTs)}</span>`:''}</div></section>`;
}
function proView(){
  const pro=S.profile.pro||{};
  const dados=`<div class="fgrid"><label class="f">Nome / academia<input type="text" id="proNome" data-bind="pro.nome" value="${esc(pro.nome||'')}"></label>
    <label class="f">Tipo<select id="proTipo" data-bind="pro.tipo">${['Educador físico','Nutricionista','Academia','Box de CrossFit'].map(o=>`<option ${(pro.tipo||'Educador físico')===o?'selected':''}>${o}</option>`).join('')}</select></label>
    <label class="f">Registro (CREF/CRN)<input type="text" id="proReg" data-bind="pro.registro" value="${esc(pro.registro||'')}"></label>
    <label class="f">Contato<input type="text" id="proCont" data-bind="pro.contato" value="${esc(pro.contato||'')}" placeholder="WhatsApp ou e-mail"></label></div>`;
  if(!pro.turma) return `<section class="card"><h3>Crie sua turma</h3>
    <ol class="how"><li><b>Crie a turma</b> e receba um código.</li><li><b>Envie o código</b> e o link do app aos alunos. Eles entram em Você › Aluno & profissional.</li><li><b>Acompanhe e prescreva</b>: veja peso, treinos e adesão de cada um e envie fichas, dieta e periodização montadas no seu app.</li></ol>
    ${dados}<button class="btn primary" data-act="turma-criar" ${canPro()?'':'disabled'}>Criar turma e gerar código</button></section>`;
  return `<section class="card pro-hero"><div class="row between" style="align-items:center;gap:16px;flex-wrap:wrap"><div><div class="eyebrow">Código da turma</div><div class="turma-code num" style="user-select:all">${esc(pro.turma)}</div><div class="small muted">${esc(pro.nome||'')} · ${esc(pro.tipo||'Educador físico')}${pro.registro?' · '+esc(pro.registro):''}</div></div>
    <div class="row"><button class="btn sm" data-act="copy" data-text="${esc(`Entre na minha turma no app EVO: abra o link, vá em Você › Aluno & profissional e digite o código ${pro.turma}.`)}">Copiar convite</button><button class="btn sm" data-act="pro-load">Atualizar lista</button></div></div></section>
  <section class="card"><h3>Alunos</h3><div id="proList"></div></section>
  <section class="card"><details><summary><b>Dados do profissional</b> <span class="small muted">· aparecem para os alunos</span></summary><div style="margin-top:10px">${dados}<div class="row"><button class="btn sm" data-act="turma-dados">Salvar na turma</button><button class="btn ghost sm" data-act="turma-novo">Gerar novo código</button></div></div></details></section>`;
}
AFTER.pro = ()=>{ if(proMode()==='pro' && S.profile.pro && S.profile.pro.turma){ if(PRO.alunos) paintAlunos(); if(!PRO.alunos && !PRO.loading) proLoad(); } };
Object.assign(ACT, {
  'pro-modo':t=>{ S.profile.modoPro=t.dataset.id; save('profile'); render(); },
  'turma-entrar':turmaEntrar, 'turma-sair':turmaSair, 'turma-criar':turmaCriar, 'turma-dados':turmaAtualizarDados, 'turma-novo':turmaNovoCodigo,
  'pro-load':proLoad, 'aluno-abrir':t=>alunoAbrir(t.dataset.id), 'presc-enviar':prescEnviar,
  'presc-ver':prescModal, 'presc-aplicar':prescAplicar, 'presc-depois':()=>closeModal(), 'presc-check':()=>checkPresc(false), 'presc-desfazer':prescDesfazer,
  'resumo-sync':async()=>{ const ok=await syncResumo(); toast(ok?'Resumo atualizado':'Não foi possível atualizar'); render(); },
  'evo-login':()=>window.EVO_AUTH&&window.EVO_AUTH.login(), 'evo-logout':()=>window.EVO_AUTH&&window.EVO_AUTH.logout(),
  'recado-enviar':recadoEnviar, 'go-pro':()=>go('pro'),
  'perm':t=>{ const p=turmaPerm(); p[t.dataset.id]=t.checked; save('profile'); queueResumo(300); toast(t.checked?'Compartilhando':'Deixou de compartilhar'); },
  'auto-ok':()=>{ PRO.auto=null; render(); }, 'aluno-fichas':alunoFichas
});

{ const _h=VIEWS.hoje; VIEWS.hoje=()=>prescBanner()+_h(); }
/* ---------- diário alimentar (banco de alimentos) ---------- */
const SLOTS=['Café da manhã','Lanche da manhã','Almoço','Lanche da tarde','Jantar','Ceia'];
const FOODS=()=>[...(S.lib.foods||[]), ...(window.FX_FOODS||[])];
const normTxt=t=>String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function slotNow(){ const h=new Date().getHours(); return h<9?0:h<11?1:h<15?2:h<18?3:h<21?4:5; }
function foodCalc(f,g){ const k=g/100; return {kcal:Math.round(f.kcal*k),p:+(f.p*k).toFixed(1),c:+(f.c*k).toFixed(1),gd:+(f.g*k).toFixed(1)}; }
function diaryGot(d){ const r=dayRec(d), o={p:0,c:0,g:0,kcal:0}; ((r&&r.foods)||[]).forEach(x=>{o.p+=x.p;o.c+=x.c;o.g+=x.gd;o.kcal+=x.kcal;}); o.p=Math.round(o.p); o.c=Math.round(o.c); o.g=Math.round(o.g); return o; }
function diaryHTML(d){
  d=d||today(); const r=dayRec(d), L=(r&&r.foods)||[], got=diaryGot(d), tg=typeTarget(dtById(dayTypeOf(d)));
  const left=Math.round(tg.kcal-got.kcal);
  return `<section class="card diary"><div class="row between"><div><h3>Diário alimentar</h3><span class="small muted">${d===today()?'Hoje':dlabel(d)} · lance o que comeu, já pesado, e o app calcula os macros</span></div><button class="btn primary sm" data-act="food-add" data-slot="${slotNow()}" data-date="${d}">+ Alimento</button></div>
    <div class="dy-sum"><div><span class="num dy-k">${fmt(got.kcal)}</span><span class="dy-l">kcal consumidas</span></div><div><span class="num dy-k ${left<0?'over':''}">${fmt(Math.abs(left))}</span><span class="dy-l">${left<0?'kcal acima da meta':'kcal restantes'}</span></div>
      <div class="dy-m">${[['P','p','--prot'],['C','c','--carb'],['G','g','--fat']].map(([l,k,c])=>`<span><i style="background:var(${c})"></i>${l} <b class="num">${got[k]}</b>/${tg[k]} g</span>`).join('')}</div></div>
    ${SLOTS.map((s,i)=>{ const it=L.filter(x=>x.slot===i); const sk=it.reduce((a,x)=>a+x.kcal,0);
      return `<div class="dy-slot"><div class="dy-h"><b>${s}</b><span class="small muted num">${it.length?fmt(sk)+' kcal':''}</span><button class="btn ghost sm" data-act="food-add" data-slot="${i}" data-date="${d}">+ adicionar</button></div>
      ${it.map(x=>`<div class="dy-it"><div class="grow"><span>${esc(x.n)}</span><span class="small muted num">${fmt(x.g)} g · P ${fmt(x.p,1)} · C ${fmt(x.c,1)} · G ${fmt(x.gd,1)}</span></div><span class="num small">${fmt(x.kcal)} kcal</span><button class="btn icon sm" data-act="food-del" data-id="${x.id}" data-date="${d}" aria-label="Remover">✕</button></div>`).join('')}
      ${!it.length&&i<5&&yesterdaySlot(d,i).length?`<button class="btn ghost sm" data-act="food-copy" data-slot="${i}" data-date="${d}">Repetir de ontem (${yesterdaySlot(d,i).length} itens)</button>`:''}</div>`; }).join('')}
  </section>`;
}
function yesterdaySlot(d,i){ const r=dayRec(addDays(d,-1)); return ((r&&r.foods)||[]).filter(x=>x.slot===i); }
function foodModal(slot,d){
  S.fdPick=null; d=d||today();
  const recent=[]; const seen=new Set();
  for(let k=0;k<10;k++){ const r=dayRec(addDays(d,-k)); ((r&&r.foods)||[]).slice().reverse().forEach(x=>{ if(x.fid&&!seen.has(x.fid)){ seen.add(x.fid); recent.push(x.fid); } }); }
  S.fdRecent=recent.slice(0,8);
  modal(`<div class="modal-h"><h3>Adicionar alimento</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
    <label class="f">Refeição<select id="fdSlot">${SLOTS.map((s,i)=>`<option value="${i}" ${+slot===i?'selected':''}>${s}</option>`).join('')}</select></label>
    <input type="hidden" id="fdDate" value="${d}">
    <div id="fdStep"></div>`);
  foodSearch('');
}
function foodSearch(q){
  const box=$('#fdStep'); if(!box) return;
  box.innerHTML=`<input type="search" id="fdQ" placeholder="Buscar alimento (ex.: arroz, frango, banana)" value="${esc(q)}" autocomplete="off">
    <div class="fd-list" id="fdL"></div><button class="btn ghost sm" data-act="food-new">+ Criar alimento que não está na lista</button>`;
  const inp=$('#fdQ'); inp.addEventListener('input',()=>paintFoods(inp.value)); paintFoods(q); setTimeout(()=>inp.focus(),30);
}
function paintFoods(q){
  const el=$('#fdL'); if(!el) return; const n=normTxt(q).trim(), all=FOODS();
  let list; if(!n){ const rec=S.fdRecent.map(id=>all.find(f=>f.id===id)).filter(Boolean); list=rec.length?rec:all.slice(0,0); }
  else { const words=n.split(/\s+/); list=all.filter(f=>words.every(w=>normTxt(f.n).includes(w)||normTxt(f.grupo).includes(w))).slice(0,40); }
  if(!n && !list.length){ const groups=[...new Set(all.map(f=>f.grupo))]; el.innerHTML=`<p class="small muted">Digite para buscar entre ${all.length} alimentos ou escolha um grupo:</p><div class="row">${groups.map(g=>`<button class="chip" data-act="food-group" data-id="${esc(g)}">${esc(g)}</button>`).join('')}</div>`; return; }
  el.innerHTML=(!n?'<p class="small muted">Recentes</p>':'')+(list.length?list.map(f=>`<button class="fd-it" data-act="food-pick" data-id="${f.id}"><span class="grow"><b>${esc(f.n)}</b><span class="small muted">${esc(f.grupo)}${f.custom?' · criado por você':''}</span></span><span class="small num">${fmt(f.kcal)} kcal<br><span class="muted">P ${fmt(f.p,1)} · C ${fmt(f.c,1)} · G ${fmt(f.g,1)}</span></span></button>`).join('')+'<p class="small muted">Valores por 100 g (ou 100 ml).</p>':'<p class="small muted">Nada encontrado. Tente outro nome ou crie o alimento.</p>');
}
function foodPick(id){
  const f=FOODS().find(x=>x.id===id); if(!f) return; S.fdPick=f;
  const box=$('#fdStep'); const g0=f.u||100;
  box.innerHTML=`<div class="fd-sel"><div><b>${esc(f.n)}</b><div class="small muted">${fmt(f.kcal)} kcal por 100 g · porção: ${esc(f.un||'')} (${fmt(g0)} g)</div></div><button class="btn ghost sm" data-act="food-back">Trocar</button></div>
    <label class="f">Quantidade consumida (g${/ml/.test(f.un||'')?' ou ml':''})<input type="number" id="fdG" inputmode="decimal" value="${g0}" min="0" step="1" style="font-size:1.4rem"></label>
    <div class="row">${[0.5,1,1.5,2].map(m=>`<button class="chip" data-act="food-mult" data-v="${Math.round(g0*m)}">${m===1?'1 porção':m+'×'} · ${Math.round(g0*m)} g</button>`).join('')}</div>
    <div class="fd-prev" id="fdPrev"></div>
    <div class="row"><button class="btn primary" data-act="food-save">Adicionar</button></div>`;
  const gi=$('#fdG'); gi.addEventListener('input',foodPrev); foodPrev(); setTimeout(()=>{gi.focus();gi.select();},30);
}
function foodPrev(){ const f=S.fdPick, g=num(($('#fdG')||{}).value), el=$('#fdPrev'); if(!f||!el) return; const m=foodCalc(f,g);
  el.innerHTML=`<div><span class="num">${fmt(m.kcal)}</span><small>kcal</small></div><div><span class="num">${fmt(m.p,1)}</span><small>proteína</small></div><div><span class="num">${fmt(m.c,1)}</span><small>carboidrato</small></div><div><span class="num">${fmt(m.gd,1)}</span><small>gordura</small></div>`; }
function foodSave(){
  const f=S.fdPick, g=num($('#fdG').value), d=$('#fdDate').value||today(), slot=+$('#fdSlot').value; if(!f) return; if(!(g>0)){ toast('Informe a quantidade em gramas'); return; }
  ensureMonth(mk(d)).then(()=>{ const r=dayRec(d,true); r.foods=r.foods||[]; r.foods.push(Object.assign({id:uid(),slot,fid:f.id,n:f.n,g},foodCalc(f,g))); saveMonth(d);
    toast(`${f.n} · ${fmt(foodCalc(f,g).kcal)} kcal`); foodModal(slot,d); render(); });
}
function foodNewModal(){
  modal(`<div class="modal-h"><h3>Criar alimento</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
  <p class="small muted">Copie os valores da tabela nutricional da embalagem. Se o rótulo for por porção, converta para 100 g.</p>
  <div class="fgrid"><label class="f" style="grid-column:1/-1">Nome<input type="text" id="nfN" placeholder="Ex.: Pão integral da marca X"></label>
  <label class="f">kcal por 100 g<input type="number" id="nfK" step="1"></label><label class="f">Proteína (g)<input type="number" id="nfP" step="0.1"></label>
  <label class="f">Carboidrato (g)<input type="number" id="nfC" step="0.1"></label><label class="f">Gordura (g)<input type="number" id="nfG" step="0.1"></label>
  <label class="f">Porção usual (g)<input type="number" id="nfU" step="1" value="100"></label><label class="f">Nome da porção<input type="text" id="nfUn" placeholder="1 unidade"></label></div>
  <div class="row"><button class="btn primary" data-act="food-new-save">Salvar alimento</button></div>`);
}
function foodNewSave(){
  const n=$('#nfN').value.trim(); if(!n){ toast('Digite o nome'); return; }
  const f={id:'u-'+uid(),n,grupo:'Meus alimentos',kcal:num($('#nfK').value),p:num($('#nfP').value),c:num($('#nfC').value),g:num($('#nfG').value),u:num($('#nfU').value)||100,un:$('#nfUn').value||'porção',custom:true};
  if(!f.kcal) f.kcal=Math.round(f.p*4+f.c*4+f.g*9);
  S.lib.foods=S.lib.foods||[]; S.lib.foods.unshift(f); save('lib'); toast('Alimento criado'); foodModal(slotNow(),today()); foodPick(f.id);
}

/* ---------- treino do relógio ---------- */
const WATCH_T=[['corrida','Corrida','corrida',true],['musc','Academia','musc',false],['cross','CrossFit','cross',false],['natacao','Natação','natacao',true],['caminhada','Caminhada','caminhada',false]];
const WATCH_F=[['dist','Distância (km)',0.01,'dist'],['kcal','Calorias (kcal)',1],['fcMax','FC máxima (bpm)',1],['fcMin','FC mínima (bpm)',1]];
function watchModal(){
  const now=new Date(), hh=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  modal(`<div class="modal-h"><h3>Lançar treino do relógio</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
  <p class="small muted">Copie do resumo do treino no app do relógio: tempo de treino, calorias e frequência máxima e mínima. Na corrida e na natação, também a distância (o pace é calculado).</p>
  <div class="seg wt-seg" role="group">${WATCH_T.map(([k,n],i)=>`<button aria-pressed="${i===0}" data-act="wt-type" data-id="${k}">${n}</button>`).join('')}</div>
  <div class="fgrid">
    <label class="f">Data<input type="date" id="wtD" value="${today()}"></label><label class="f">Início<input type="time" id="wtH" value="${hh}"></label>
    <label class="f">Tempo de treino (min)<input type="number" id="wtDur" inputmode="decimal" step="1"></label>
    ${WATCH_F.map(([k,n,st,only])=>`<label class="f ${only?'wt-dist':''}">${n}<input type="number" id="wt-${k}" inputmode="decimal" step="${st}"></label>`).join('')}
    <div class="f wt-dist wt-pacebox"><span>Pace médio</span><b id="wtPace" class="num">—</b></div></div>
  <div class="row"><button class="btn primary" data-act="wt-save">Salvar treino</button></div>`);
  S.wtType='corrida'; wtToggle();
  ['wtDur','wt-dist'].forEach(id=>{ const e=$('#'+id); e&&e.addEventListener('input',wtPace); });
}
function wtToggle(){ const t=WATCH_T.find(x=>x[0]===S.wtType), sw=S.wtType==='natacao'; document.querySelectorAll('#modalRoot .wt-dist').forEach(e=>e.hidden=!t[3]); document.querySelectorAll('#modalRoot .wt-seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===S.wtType));
  const lab=$('#wt-dist')&&$('#wt-dist').closest('label'); if(lab){ lab.firstChild.textContent=sw?'Distância (m)':'Distância (km)'; $('#wt-dist').step=sw?'25':'0.01'; }
  const pb=$('#modalRoot .wt-pacebox span'); if(pb) pb.textContent=sw?'Pace médio (por 100 m)':'Pace médio'; wtPace(); }
function swimPace(min,m){ if(!(min>0&&m>0)) return ''; const p=min/(m/100), mm=Math.floor(p), ss=Math.round((p-mm)*60); return `${mm}:${String(ss===60?0:ss).padStart(2,'0')} /100 m`; }
function paceTxt(min,km){ if(!(min>0&&km>0)) return ''; const p=min/km, m=Math.floor(p), s=Math.round((p-m)*60); return `${m}:${String(s===60?0:s).padStart(2,'0')} /km`; }
function wtPace(){ const el=$('#wtPace'); if(!el) return; const t=WATCH_T.find(x=>x[0]===S.wtType), min=num($('#wtDur').value), d=num(($('#wt-dist')||{}).value);
  if(!(t[3]&&min>0&&d>0)){ el.textContent='—'; return; } el.textContent = S.wtType==='natacao' ? swimPace(min,d) : `${paceTxt(min,d)} · ${fmt(d/(min/60),1)} km/h`; }
async function wtSave(){
  const t=WATCH_T.find(x=>x[0]===S.wtType), d=$('#wtD').value||today(), min=num($('#wtDur').value);
  if(!(min>0)){ toast('Informe o tempo de treino em minutos'); return; }
  const fa=num(($('#wt-fcMax')||{}).value), fi=num(($('#wt-fcMin')||{}).value); if(fa&&fi&&fi>fa){ toast('A FC mínima não pode ser maior que a máxima'); return; }
  const w={tipo:t[1]}; WATCH_F.forEach(([k,,,only])=>{ if(only&&!t[3]) return; const v=num(($('#wt-'+k)||{}).value); if(v) w[k]=v; });
  if(w.dist && t[0]==='natacao'){ w.distM=w.dist; w.dist=+(w.dist/1000).toFixed(3); w.pace=swimPace(min,w.distM); } else if(w.dist) w.pace=paceTxt(min,w.dist);
  const log={id:uid(),date:d,kind:'relogio',act:t[2],nome:t[1]+' (relógio)',durMin:Math.round(min),end:Date.now(),ex:[],vol:0,watch:w};
  const m=mk(d); await loadLogs(m); S.logs[m].sessions.push(log); if(!S.meta.logMonths.includes(m)){ S.meta.logMonths.push(m); save('meta'); } Store.save('lg-'+m,S.logs[m]);
  await ensureMonth(m); const r=dayRec(d,true); const hora=$('#wtH').value||'';
  let s=r.sessions.find(x=>!x.done && x.act===t[2]); if(s){ Object.assign(s,{done:true,logId:log.id,min:log.durMin,kcal:w.kcal||null}); } else r.sessions.push({id:uid(),act:t[2],hora,min:log.durMin,done:true,logId:log.id,kcal:w.kcal||null});
  saveMonth(d); closeModal(); render(); toast(`${t[1]} salvo${w.kcal?' · '+fmt(w.kcal)+' kcal':''}`);
}
function watchLine(l){ const w=l.watch||{}; return [w.distM?`${fmt(w.distM)} m`:w.dist&&`${fmt(w.dist,2)} km`,w.pace,w.kcal&&`${fmt(w.kcal)} kcal`,(w.fcMin||w.fcMax)&&`FC ${w.fcMin||'—'}–${w.fcMax||'—'} bpm`].filter(Boolean).join(' · '); }
function watchDetail(l){ const w=l.watch||{}; const items=[['Tempo de treino',l.durMin+' min'],['Calorias',w.kcal&&fmt(w.kcal)+' kcal'],['FC máxima',w.fcMax&&w.fcMax+' bpm'],['FC mínima',w.fcMin&&w.fcMin+' bpm'],['Distância',w.distM?fmt(w.distM)+' m':w.dist&&fmt(w.dist,2)+' km'],['Pace',w.pace],['FC média',w.fcMed&&w.fcMed+' bpm'],['Cadência',w.cad&&w.cad+' ppm'],['Elevação',w.elev&&w.elev+' m'],['TE aeróbico',w.teAer&&fmt(w.teAer,1)],['TE anaeróbico',w.teAna&&fmt(w.teAna,1)],['Carga',w.carga],['VO₂máx',w.vo2&&fmt(w.vo2,1)],['Recuperação',w.recup&&w.recup+' h'],['Passos',w.passos&&fmt(w.passos)]].filter(x=>x[1]);
  return `<div class="wt-grid">${items.map(([a,b])=>`<div><small>${a}</small><b class="num">${b}</b></div>`).join('')}</div>${w.nota?`<p class="small">${esc(w.nota)}</p>`:''}`; }
Object.assign(ACT,{
  'food-add':t=>foodModal(+t.dataset.slot,t.dataset.date), 'food-pick':t=>foodPick(t.dataset.id), 'food-back':()=>foodSearch(($('#fdQ')||{}).value||''),
  'food-group':t=>{ const q=$('#fdQ'); if(q){ q.value=t.dataset.id; paintFoods(t.dataset.id); } },
  'food-mult':t=>{ $('#fdG').value=t.dataset.v; foodPrev(); }, 'food-save':foodSave, 'food-new':foodNewModal, 'food-new-save':foodNewSave,
  'food-del':t=>{ const d=t.dataset.date, r=dayRec(d); if(!r) return; r.foods=(r.foods||[]).filter(x=>x.id!==t.dataset.id); saveMonth(d); render(); },
  'food-copy':t=>{ const d=t.dataset.date, i=+t.dataset.slot, src=yesterdaySlot(d,i); const r=dayRec(d,true); r.foods=r.foods||[]; src.forEach(x=>r.foods.push(Object.assign({},x,{id:uid()}))); saveMonth(d); render(); toast('Refeição repetida'); },
  'watch-new':watchModal, 'wt-type':t=>{ S.wtType=t.dataset.id; wtToggle(); }, 'wt-save':wtSave
});

/* ---------- treino por foto ---------- */
function ocrStart(){
  modal(`<div class="modal-h"><h3>Treino por foto</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
  <p class="small muted">Fotografe a ficha, o quadro do box ou um print com o treino. O app lê o texto no próprio celular, monta os exercícios e mostra tudo para você conferir antes de salvar.</p>
  <div class="ocr-pick">
    <label class="ocr-opt"><input type="file" accept="image/*" id="ocrFile" hidden><span class="ocr-ic"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.6"/></svg></span><b>Foto ou imagem</b><small>câmera, galeria ou print</small></label>
    <button class="ocr-opt" data-act="ocr-text"><span class="ocr-ic">T</span><b>Colar texto</b><small>copiado do WhatsApp, notas…</small></button></div>
  <div id="ocrProg"></div>
  <p class="small muted">Funciona melhor com texto impresso ou letra de forma, foto reta e boa luz.</p>`);
  $('#ocrFile').addEventListener('change',e=>{ const f=e.target.files[0]; if(f) ocrRun(f); });
}
async function ocrRun(file){
  const box=$('#ocrProg'); const st={'loading tesseract core':'Carregando o leitor','initializing tesseract':'Preparando','loading language traineddata':'Baixando o português (só na 1ª vez)','initializing api':'Preparando','recognizing text':'Lendo o texto'};
  box.innerHTML=`<div class="ocr-bar"><i style="width:4%"></i></div><p class="small muted" id="ocrSt">Carregando o leitor de texto…</p>`;
  const img=URL.createObjectURL(file);
  try{
    const text=await FX_OCR.read(file,(s,p)=>{ const el=$('#ocrSt'), bar=$('#ocrProg .ocr-bar i'); if(el) el.textContent=(st[s]||'Processando')+(s==='recognizing text'?` · ${Math.round(p*100)}%`:'…'); if(bar) bar.style.width=(s==='recognizing text'?30+p*70:Math.min(28,4+p*24))+'%'; });
    if(!text.trim()){ box.innerHTML='<p class="small bad">Não encontrei texto na imagem. Tente uma foto mais próxima e reta, ou cole o texto.</p>'; return; }
    ocrReview(text,img);
  }catch(e){ box.innerHTML=`<p class="small bad">${esc(e.message||'Não foi possível ler a imagem.')} Você pode colar o texto do treino.</p><button class="btn sm" data-act="ocr-text">Colar texto</button>`; }
}
function ocrReview(text,img){
  const r=FX_OCR.parse(text,allEx());
  S.ocr={text,img:img||S.ocr&&S.ocr.img||null,kind:r.kind,nome:r.nome||(r.kind==='crossfit'?'WOD':'Ficha da foto'),rows:r.rows,wod:r.wod||text,formato:r.formato,cap:r.cap};
  ocrPaint();
}
function ocrSync(){
  const o=S.ocr; if(!o) return; const v=id=>($('#'+id)||{}).value;
  if($('#ocrNome')) o.nome=v('ocrNome'); if($('#ocrTxt')) o.text=v('ocrTxt'); if($('#ocrWod')) o.wod=v('ocrWod'); if($('#ocrFmt')) o.formato=v('ocrFmt'); if($('#ocrCap')) o.cap=v('ocrCap');
  o.rows.forEach((r,i)=>{ ['series','repMin','repMax','desc'].forEach(k=>{ const e=$(`#oc-${k}-${i}`); if(e) r[k]=num(e.value); }); const g=$(`#oc-g-${i}`); if(g) r.grupo=g.value; const n=$(`#oc-n-${i}`); if(n) r.nomeNovo=n.value; });
}
function ocrPaint(){
  const o=S.ocr, cf=o.kind==='crossfit';
  const rowsHTML=o.rows.map((r,i)=>{ const e=r.exId&&exById(r.exId);
    return `<div class="oc-row ${e?'':'new'}"><div class="oc-ex">${e?`<button class="oc-name" data-act="ocr-pick" data-i="${i}"><b>${esc(e.nome)}</b><small>${r.conf<.9?'confira · ':''}lido: “${esc(r.raw.slice(0,46))}”</small></button>`:
      `<div class="oc-name"><input type="text" id="oc-n-${i}" value="${esc(r.nomeNovo)}" aria-label="Nome do exercício"><small>não encontrei na biblioteca: será criado · <button class="linkbtn" data-act="ocr-pick" data-i="${i}">escolher da lista</button></small>
      <select id="oc-g-${i}" aria-label="Grupo muscular">${Object.entries(D.G).map(([k,g])=>`<option value="${k}" ${r.grupo===k?'selected':''}>${g.n}</option>`).join('')}</select></div>`}
      <button class="btn icon sm" data-act="ocr-del" data-i="${i}" aria-label="Remover">✕</button></div>
      <div class="oc-nums"><label>Séries<input type="number" id="oc-series-${i}" value="${r.series}" min="1"></label><label>Reps<input type="number" id="oc-repMin-${i}" value="${r.repMin}" min="0"></label><label>até<input type="number" id="oc-repMax-${i}" value="${r.repMax}" min="0"></label><label>Desc. (s)<input type="number" id="oc-desc-${i}" value="${r.desc}" min="0" step="15"></label></div></div>`; }).join('');
  modal(`<div class="modal-h"><h3>Confira o treino</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
  <div class="oc-top">${o.img?`<img class="oc-img" src="${o.img}" alt="Foto do treino">`:''}<div class="stack" style="gap:10px;min-width:0;flex:1">
    <div class="seg" role="group"><button aria-pressed="${!cf}" data-act="ocr-kind" data-id="academia">Academia</button><button aria-pressed="${cf}" data-act="ocr-kind" data-id="crossfit">CrossFit / WOD</button></div>
    <label class="f">Nome<input type="text" id="ocrNome" value="${esc(o.nome)}"></label>
    <p class="small muted">${o.rows.length} exercício${o.rows.length===1?'':'s'} reconhecido${o.rows.length===1?'':'s'}. Toque no nome para trocar.</p></div></div>
  ${cf?`<div class="fgrid"><label class="f">Formato<select id="ocrFmt">${['For time','AMRAP','EMOM','Tabata','Rounds','Outro'].map(f=>`<option ${o.formato===f?'selected':''}>${f}</option>`).join('')}</select></label><label class="f">Time cap / duração<input type="text" id="ocrCap" value="${esc(o.cap||'')}" placeholder="ex.: 15 min"></label>
    <label class="f" style="grid-column:1/-1">Descrição do WOD<textarea id="ocrWod" rows="5">${esc(o.wod||'')}</textarea></label></div>`:''}
  <div class="oc-list">${rowsHTML||'<div class="empty small">Nenhum exercício reconhecido. Corrija o texto abaixo e toque em Ler de novo, ou adicione manualmente.</div>'}</div>
  <button class="btn sm" data-act="ocr-add">+ Exercício</button>
  <details class="oc-raw"><summary class="small">Texto lido da foto (corrija e leia de novo)</summary><textarea id="ocrTxt" rows="7">${esc(o.text)}</textarea><button class="btn sm" data-act="ocr-reparse">Ler de novo</button></details>
  <div class="row"><button class="btn" data-act="ocr-save" data-go="0">Salvar como ficha</button><button class="btn primary" data-act="ocr-save" data-go="1">Salvar e treinar agora</button></div>`,true);
}
function ocrSave(t){
  ocrSync(); const o=S.ocr; if(!o) return;
  if(o.kind!=='crossfit' && !o.rows.length){ toast('Adicione pelo menos um exercício'); return; }
  const ex=o.rows.map(r=>{ let id=r.exId; if(!id){ const nome=(r.nomeNovo||'Exercício').trim(); const ex0=allEx().find(x=>x.nome.toLowerCase()===nome.toLowerCase());
      if(ex0) id=ex0.id; else { id='cx-'+uid(); S.lib.custom.push({id,nome,grupo:r.grupo||'peito',musc:'',dica:'',guia:'',custom:true}); } }
    return {exId:id,series:Math.max(1,r.series||3),repMin:r.repMin||0,repMax:Math.max(r.repMin||0,r.repMax||r.repMin||0),rir:r.rir||'2',desc:r.desc||0,nota:r.nota||'',prio:false}; });
  save('lib');
  const cores=['#C9A96B','#E5533F','#3E9A57','#1F7AE0','#7A5AF5','#F0B323'];
  const tpl={id:'t-'+uid(),nome:o.nome||'Ficha da foto',kind:o.kind,foco:o.kind==='crossfit'?(o.formato||''):'',cor:cores[S.tpl.length%cores.length],ex:o.kind==='crossfit'?ex:ex};
  if(o.kind==='crossfit') tpl.wod={formato:o.formato||'For time',desc:o.wod||'',cap:o.cap||''};
  S.tpl.push(tpl); save('tpl'); const agora=t.dataset.go==='1'; S.ocr=null; closeModal();
  if(agora){ startSession(tpl.id); } else { S.montarSel=tpl.id; go('montar'); }
  toast('Ficha criada: '+tpl.nome);
}
Object.assign(ACT,{
  'ocr-start':ocrStart,
  'ocr-text':()=>{ modal(`<div class="modal-h"><h3>Colar treino</h3><button class="btn icon" data-act="close" aria-label="Fechar">✕</button></div>
    <p class="small muted">Cole o treino como veio (uma linha por exercício). Exemplo: <i>Supino reto 4x8-10</i>.</p><textarea id="ocrPaste" rows="10" placeholder="Treino A&#10;Supino reto 4x8-10&#10;Crucifixo 3x12&#10;Tríceps corda 3x12"></textarea>
    <div class="row"><button class="btn primary" data-act="ocr-paste-go">Montar treino</button></div>`); setTimeout(()=>{const e=$('#ocrPaste'); e&&e.focus();},40); },
  'ocr-paste-go':()=>{ const t=($('#ocrPaste').value||'').trim(); if(!t){ toast('Cole o texto do treino'); return; } S.ocr=null; ocrReview(t,null); },
  'ocr-kind':t=>{ ocrSync(); S.ocr.kind=t.dataset.id; ocrPaint(); },
  'ocr-del':t=>{ ocrSync(); S.ocr.rows.splice(+t.dataset.i,1); ocrPaint(); },
  'ocr-add':()=>{ ocrSync(); const o=S.ocr; pickExercise(id=>{ o.rows.push({raw:'adicionado',exId:id,conf:1,nomeNovo:'',grupo:null,series:3,repMin:10,repMax:12,desc:90,rir:'2'}); ocrPaint(); },'Adicionar exercício'); },
  'ocr-pick':t=>{ ocrSync(); const o=S.ocr, i=+t.dataset.i; pickExercise(id=>{ o.rows[i].exId=id; o.rows[i].conf=1; ocrPaint(); },'Trocar exercício'); },
  'ocr-reparse':()=>{ ocrSync(); const o=S.ocr; const keep={img:o.img}; ocrReview(o.text,keep.img); },
  'ocr-save':ocrSave
});


/* ----- Evolução (recordes + periodização) ----- */
VIEWS.evolucao = ()=>{ const m=S.evoSub||'rps';
  return `<div class="seg evo-seg" role="group" aria-label="Evolução"><button aria-pressed="${m==='rps'}" data-act="evo-sub" data-id="rps">Recordes</button><button aria-pressed="${m==='period'}" data-act="evo-sub" data-id="period">Periodização</button></div>`+(m==='period'?VIEWS.period():VIEWS.rps()); };
AFTER.evolucao = ()=>{ const f=AFTER[S.evoSub||'rps']; f&&f(); };
ACT['evo-sub']=t=>{ S.evoSub=t.dataset.id; renderTabs(); render(); };
ACT['preset-mil']=()=>confirmBox('Carregar o plano com 8 tipos de dia (descanso, só academia, só TFM, só CrossFit e todas as combinações), cardápio base de cada um e a semana padrão? Seus tipos de dia, cardápios e semana atuais serão substituídos.',loadPresetMilitar,'Carregar');
if(window.EVO_DEBUG) window.__evo={go,savePeso,closeModalIfOpen,S,today,addDays};
boot().catch(err=>{ console.error(err); $('#main').innerHTML=`<div class="view"><div class="card"><h3>Não foi possível carregar</h3><p class="muted">${esc(err&&err.message||err)}</p></div></div>`; });
})();
