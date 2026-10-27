/* EVO — mapa muscular (frente e costas) com músculos primários e secundários.
   Desenho próprio do EVO, estilizado. Uso: FX_MAP.svg({p:Set|Array, s:Set|Array}, {size:'sm'|'md'}) */
window.FX_MAP = (function(){
  const M='translate(200,0) scale(-1,1)'; // espelha a metade esquerda
  const L=(id,...ds)=>`<g class="mm-r" data-m="${id}">${ds.map(d=>`<path d="${d}"/><path d="${d}" transform="${M}"/>`).join('')}</g>`;
  const C=(id,...ds)=>`<g class="mm-r" data-m="${id}">${ds.map(d=>`<path d="${d}"/>`).join('')}</g>`;
  const N=(...ds)=>ds.map(d=>`<path class="mm-n" d="${d}"/><path class="mm-n" d="${d}" transform="${M}"/>`).join('');
  // silhueta (metade esquerda, do pescoço ao centro entre as pernas)
  const SIL='M92 55 C92 63 90 69 84 73 C72 77 58 78 50 84 C40 92 38 106 37 120 C35 140 32 156 30 168 C26 186 21 205 18 220 C14 230 11 243 15 252 C18 258 25 257 28 250 C30 241 30 233 30 226 C34 208 39 189 42 173 C44 160 46 148 48 137 C50 129 52 123 56 121 C58 141 60 161 63 180 C65 196 64 207 62 217 C60 237 60 260 62 284 C64 300 66 312 66 322 C64 343 62 364 66 386 C68 396 68 404 66 410 C62 417 57 424 65 428 L84 428 C86 420 84 410 84 402 C86 380 88 357 86 337 C86 327 88 318 90 310 C94 290 96 265 98 245 L100 237';
  const outline=`<path class="mm-body" d="${SIL} L100 55 Z"/><path class="mm-body" d="${SIL} L100 55 Z" transform="${M}"/><path class="mm-sil" d="${SIL}"/><path class="mm-sil" d="${SIL}" transform="${M}"/><ellipse class="mm-head" cx="100" cy="33" rx="16.5" ry="21.5"/><path class="mm-sil" d="M92 54 C94 57 106 57 108 54"/>`;
  const DELT='M73 80 C61 80 51 86 47 98 C45 107 45 115 46 121 C52 115 56 107 59 99 C63 90 69 85 77 82 Z';
  const ARM1='M38 170 C33 184 27 201 24 214 C25 219 29 220 31 215 C35 201 39 187 42 174 Z';
  const ARM2='M44 171 C43 187 38 203 34 215 C35 218 38 218 40 213 C44 199 46 185 47 174 Z';
  const HAND='M22 224 C17 233 15 243 18 249 C21 253 25 252 27 247 C28 240 29 232 29 226 Z';
  const front = outline+
    L('trapezio','M90 63 C88 69 82 73 75 77 L86 80 C90 76 92 70 92 63 Z')+
    L('ombros',DELT)+
    L('peito','M81 84 C71 88 63 95 61 106 C61 118 67 126 78 128 C88 130 96 126 98 119 L98 88 C94 84 87 82 81 84 Z')+
    L('biceps','M47 126 C43 136 41 147 41 157 C43 163 47 165 51 161 C54 151 56 140 56 130 C54 124 50 122 47 126 Z')+
    L('antebraco',ARM1,ARM2)+N(HAND)+
    L('obliquos','M64 128 C63 136 64 142 66 146 L72 141 C70 136 68 131 64 128 Z','M66 150 C66 156 68 160 70 163 L75 158 C73 154 70 151 66 150 Z','M70 168 C70 180 75 192 85 200 L85 172 C80 168 75 166 70 168 Z')+
    C('abdomen','M87.5 132 h11 a2 2 0 0 1 2 2 v13 h-13 Z','M101.5 134 a2 2 0 0 1 2 -2 h9 v15 h-11 Z','M87.5 150 h11.5 v15 h-11.5 Z','M101 150 h11.5 v15 h-11.5 Z','M87.5 168 h11.5 v15 h-11.5 Z','M101 168 h11.5 v15 h-11.5 Z','M87.5 186 L112.5 186 C112 203 106 215 100 221 C94 215 88 203 87.5 186 Z')+
    L('quadriceps','M66 223 C62 245 62 270 66 292 C68 302 72 308 76 308 C74 290 74 262 76 236 C74 228 70 223 66 223 Z','M79 220 C77 246 77 274 79 299 C81 306 87 306 88 300 C90 276 90 249 88 226 C86 219 81 216 79 220 Z','M90 268 C88 284 88 297 92 305 C96 301 96 289 94 272 Z')+
    L('adutores','M91 228 C95 240 97 255 95 266 C92 257 90 243 90 231 Z')+
    N('M70 312 C76 316 84 316 88 311 L86 322 C80 326 74 326 69 322 Z')+
    L('panturrilha','M68 331 C64 351 64 372 68 391 C70 395 74 393 74 387 C74 366 74 349 74 333 Z','M77 333 C80 350 82 369 80 389 C79 393 76 392 76 386 C76 366 76 349 76 335 Z')+
    N('M68 410 C64 416 61 421 67 424 L82 424 C83 418 82 412 80 408 Z');
  const back = outline+
    C('trapezio','M100 60 C96 67 90 71 80 75 C72 78 66 80 62 84 C74 88 86 98 92 112 C96 122 98 131 100 140 C102 131 104 122 108 112 C114 98 126 88 138 84 C134 80 128 78 120 75 C110 71 104 67 100 60 Z')+
    L('ombros',DELT)+
    L('costas','M64 96 C62 106 66 115 76 119 C84 121 88 115 88 108 C80 100 72 96 64 96 Z','M62 113 C60 132 64 151 72 167 C78 177 86 183 92 183 C92 169 90 149 88 127 C82 125 70 120 62 113 Z')+
    L('triceps','M46 124 C40 136 38 149 40 159 C44 165 48 165 52 159 C56 148 58 136 56 126 C52 120 48 120 46 124 Z')+
    L('antebraco',ARM1,ARM2)+N(HAND)+
    C('lombar','M89 168 C94 177 98 185 100 191 C102 185 106 177 111 168 L112 195 C106 201 94 201 88 195 Z')+
    L('gluteos','M98 205 C86 201 72 205 66 217 C62 231 66 244 78 248 C88 250 96 246 98 238 Z')+
    L('posteriores','M66 253 C62 272 64 292 70 306 C74 310 78 308 78 302 C76 284 76 266 78 253 Z','M81 252 C81 270 83 290 86 306 C90 308 94 304 94 296 C96 278 96 262 94 250 Z')+
    N('M70 312 C76 316 84 316 88 311 L86 322 C80 326 74 326 69 322 Z')+
    L('panturrilha','M67 327 C61 341 61 357 65 369 C69 373 74 371 76 365 C77 351 75 337 72 327 Z','M80 327 C86 339 88 355 84 367 C82 371 79 369 78 363 C78 349 78 337 78 327 Z')+
    N('M68 376 C68 390 70 400 72 406 L78 406 C78 396 78 386 77 374 Z','M68 410 C64 416 61 421 67 424 L82 424 C83 418 82 412 80 408 Z');
  function svg(sel,opts){
    opts=opts||{}; const P=new Set(sel&&sel.p||[]), Sx=new Set(sel&&sel.s||[]);
    const paint=html=>html.replace(/class="mm-r" data-m="([a-z]+)"/g,(m,id)=>`class="mm-r ${P.has(id)?'mm-p':Sx.has(id)?'mm-s':''}" data-m="${id}"`);
    const fig=(h,lab)=>`<figure class="mm-fig"><svg viewBox="6 6 188 426" role="img" aria-label="${lab}">${paint(h)}</svg>${opts.labels===false?'':`<figcaption>${lab}</figcaption>`}</figure>`;
    return `<div class="mmap ${opts.size?'mm-'+opts.size:''}">${fig(front,'Frente')}${fig(back,'Costas')}</div>`+
      (opts.legend===false?'':`<div class="mm-leg"><span><i class="mm-p"></i>Músculo primário</span><span><i class="mm-s"></i>Músculo secundário</span><span><i></i>Não alvo</span></div>`);
  }
  // termos do campo "músculos" → regiões do mapa
  const RULES=[[/peitoral/,['peito']],[/deltoide|ombro|manguito|^médio$/,['ombros']],[/tríceps/,['triceps']],[/bíceps|^braquial$/,['biceps']],[/braquiorradial|antebraço/,['antebraco']],
    [/latíssimo|redondo|dorsal/,['costas']],[/romboide|trapézio/,['trapezio']],[/eretores/,['lombar']],[/cadeia posterior/,['lombar','gluteos','posteriores']],
    [/glúteo|mínimo/,['gluteos']],[/posteriores|isquiotibiais/,['posteriores']],[/quadríceps/,['quadriceps']],[/adutores/,['adutores']],
    [/gastrocnêmio|sóleo|panturrilha/,['panturrilha']],[/reto do abdômen|core|abdômen/,['abdomen']],[/oblíquos/,['obliquos']],[/flexores do quadril/,['quadriceps']],
    [/corpo inteiro/,['quadriceps','gluteos','posteriores','costas','ombros','peito','abdomen']],[/pernas|membros inferiores/,['quadriceps','gluteos','posteriores','panturrilha']]];
  const GROUP={peito:['peito'],costas:['costas'],ombros:['ombros'],biceps:['biceps'],triceps:['triceps'],antebraco:['antebraco'],quadriceps:['quadriceps'],posteriores:['posteriores'],gluteos:['gluteos'],panturrilha:['panturrilha'],abdomen:['abdomen'],lpo:['quadriceps','gluteos','ombros'],cardio:['quadriceps','panturrilha']};
  const termRegions=t=>{ t=t.trim().toLowerCase(); const out=[]; RULES.forEach(([re,r])=>{ if(re.test(t)) out.push(...r); }); return out; };
  function forExercise(ex){
    if(!ex) return {p:[],s:[]};
    const terms=String(ex.musc||'').split(/,| e /).filter(Boolean);
    const p=new Set(GROUP[ex.grupo]||[]); if(terms[0]) termRegions(terms[0]).forEach(r=>p.add(r));
    const s=new Set(); terms.slice(1).forEach(t=>termRegions(t).forEach(r=>{ if(!p.has(r)) s.add(r); }));
    return {p:[...p],s:[...s]};
  }
  function merge(list){ const p=new Set(), s=new Set(); list.forEach(x=>{ (x.p||[]).forEach(r=>p.add(r)); }); list.forEach(x=>(x.s||[]).forEach(r=>{ if(!p.has(r)) s.add(r); })); return {p:[...p],s:[...s]}; }
  const ACT={corrida:{p:['quadriceps','posteriores','panturrilha','gluteos'],s:['abdomen']},caminhada:{p:['quadriceps','panturrilha'],s:['gluteos','posteriores']},bike:{p:['quadriceps','gluteos'],s:['posteriores','panturrilha']},
    natacao:{p:['costas','ombros'],s:['peito','triceps','abdomen','quadriceps']},cross:{p:['quadriceps','gluteos','ombros','costas'],s:['peito','abdomen','posteriores','triceps','biceps','panturrilha']},
    funcional:{p:['quadriceps','gluteos','abdomen'],s:['ombros','peito','costas','panturrilha']},marcha:{p:['quadriceps','gluteos','panturrilha'],s:['trapezio','lombar','posteriores']},musc:{p:[],s:[]}};
  return {svg,forExercise,merge,forActivity:a=>ACT[a]||{p:[],s:[]}};
})();
