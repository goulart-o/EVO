/* Dados-base do Ficha Forte: biblioteca de exercícios, modelos do plano de recomposição,
   cardápios, periodizações e tabelas da Enciclopédia do Treinamento e Nutrição. */
window.FX_DATA = (function(){
const G = {
  peito:{n:'Peito',guia:'Os Peitorais'}, costas:{n:'Costas',guia:'As Costas'}, ombros:{n:'Ombros',guia:'Os Ombros'},
  biceps:{n:'Bíceps',guia:'Os Braços e os Antebraços'}, triceps:{n:'Tríceps',guia:'Os Braços e os Antebraços'},
  antebraco:{n:'Antebraço',guia:'Os Braços e os Antebraços'}, quadriceps:{n:'Quadríceps',guia:'As Pernas'},
  posteriores:{n:'Posteriores',guia:'As Pernas'}, gluteos:{n:'Glúteos',guia:'Os Glúteos'},
  panturrilha:{n:'Panturrilha',guia:'As Pernas'}, abdomen:{n:'Abdômen',guia:'Os Abdominais'},
  lpo:{n:'LPO / CrossFit',guia:''}, cardio:{n:'Condicionamento',guia:''}
};
// [id, nome, grupo, músculos envolvidos, dica de execução]
const EX = [
 ['supino-reto','Supino reto com barra','peito','Peitoral maior, deltoide anterior, tríceps','Escápulas encaixadas e pés firmes. Desça a barra controlando até tocar o meio do peito e empurre de volta sem tirar o quadril do banco.'],
 ['supino-inclinado-halter','Supino inclinado com halteres (30°)','peito','Peitoral clavicular, deltoide anterior, tríceps','Banco a 30°. Desça até sentir o alongamento do peito e suba aproximando os halteres no topo, sem bater um no outro.'],
 ['supino-inclinado-barra','Supino inclinado com barra','peito','Peitoral clavicular, deltoide anterior','Barra desce na parte alta do peito, cotovelos levemente abaixo da linha dos ombros.'],
 ['supino-reto-halter','Supino reto com halteres','peito','Peitoral maior, tríceps','Maior amplitude que a barra. Punhos alinhados aos cotovelos durante todo o movimento.'],
 ['supino-declinado','Supino declinado','peito','Peitoral inferior, tríceps','Pés presos no apoio. Barra desce na parte baixa do peito.'],
 ['crucifixo-halter','Crucifixo com halteres','peito','Peitoral maior','Cotovelos levemente flexionados e fixos. Abra até o alongamento confortável e feche como um abraço.'],
 ['crossover','Crucifixo no cross-over (cabo médio)','peito','Peitoral maior','Polias na altura do peito. Cotovelos semiflexionados e fixos; leve as mãos à frente do corpo.'],
 ['peck-deck','Voador / peck-deck','peito','Peitoral maior','Ombros para trás e peito aberto. Feche os braços sem deixar os ombros rolarem para frente.'],
 ['flexao-braco','Flexão de braço','peito','Peitoral, tríceps, core','Corpo em linha reta do calcanhar à cabeça. Desça até o peito quase tocar o chão.'],
 ['paralelas','Mergulho nas paralelas','peito','Peitoral inferior, tríceps','Tronco levemente inclinado à frente para ênfase no peito. Desça até os ombros ficarem na linha dos cotovelos.'],
 ['barra-fixa','Barra fixa pronada','costas','Latíssimo do dorso, redondo maior, bíceps','Pegada pronada um pouco mais aberta que os ombros. Puxe o peito em direção à barra e desça até estender os braços. Use elástico se não completar 6 reps.'],
 ['puxada-frente','Puxada frente no pulley','costas','Latíssimo do dorso, bíceps','Tronco levemente inclinado para trás. Puxe a barra até a parte alta do peito levando os cotovelos para baixo.'],
 ['remada-curvada','Remada curvada com barra','costas','Latíssimo, romboides, trapézio médio, deltoide posterior','Tronco a ~45°, coluna neutra. Puxe a barra em direção ao umbigo sem embalo.'],
 ['remada-cavalinho','Remada cavalinho (T-bar)','costas','Latíssimo, romboides, trapézio','Peito apoiado ou tronco firme. Puxe com os cotovelos próximos ao corpo.'],
 ['remada-baixa','Remada baixa no cabo (triângulo)','costas','Latíssimo, romboides, bíceps','Peito para fora. Puxe o triângulo até o abdômen e segure 1 s com as escápulas juntas.'],
 ['remada-unilateral','Remada unilateral com halter','costas','Latíssimo, redondo maior','Joelho e mão apoiados no banco. Puxe o cotovelo em direção ao quadril.'],
 ['pulldown-reto','Pulldown com braços estendidos','costas','Latíssimo do dorso','Braços quase estendidos. Leve a barra até as coxas pela força das costas.'],
 ['levantamento-terra','Levantamento terra','costas','Eretores da coluna, glúteos, posteriores, trapézio','Barra colada às canelas, coluna neutra. Empurre o chão com as pernas e estenda o quadril no topo.'],
 ['face-pull','Face pull na polia','ombros','Deltoide posterior, manguito rotador, trapézio médio','Corda na altura do rosto. Puxe abrindo as mãos e girando os ombros para fora. Ótimo para a saúde do ombro.'],
 ['desenvolvimento-halter','Desenvolvimento com halteres sentado','ombros','Deltoide anterior e médio, tríceps','Banco a 80–85°. Suba até perto da extensão sem travar os cotovelos.'],
 ['desenvolvimento-barra','Desenvolvimento militar com barra','ombros','Deltoides, tríceps, trapézio','Em pé, glúteos e abdômen contraídos. Barra sobe em linha reta passando perto do rosto.'],
 ['elevacao-lateral','Elevação lateral com halteres','ombros','Deltoide médio','Suba até a linha do ombro com os cotovelos levemente flexionados. Desça devagar.'],
 ['elevacao-lateral-cabo','Elevação lateral no cabo','ombros','Deltoide médio','Polia baixa do lado oposto. Tensão constante durante todo o movimento.'],
 ['elevacao-frontal','Elevação frontal','ombros','Deltoide anterior','Suba até a altura dos olhos sem balançar o tronco.'],
 ['crucifixo-inverso','Crucifixo inverso / posterior','ombros','Deltoide posterior','Tronco inclinado ou na máquina. Abra os braços conduzindo pelos cotovelos.'],
 ['encolhimento','Encolhimento com halteres','ombros','Trapézio superior','Suba os ombros em direção às orelhas, pause 1 s e desça controlando.'],
 ['rosca-direta','Rosca direta com barra W','biceps','Bíceps braquial, braquial','Cotovelos fixos ao lado do corpo. Não balance o tronco.'],
 ['rosca-alternada','Rosca alternada com halteres','biceps','Bíceps braquial','Gire o punho (supinação) durante a subida.'],
 ['rosca-martelo','Rosca martelo','biceps','Braquial, braquiorradial','Pegada neutra. Dá espessura ao braço e trabalha o antebraço.'],
 ['rosca-scott','Rosca Scott','biceps','Bíceps braquial','Braços apoiados no banco. Desça até quase estender, sem relaxar embaixo.'],
 ['rosca-cabo','Rosca no cabo','biceps','Bíceps braquial','Tensão constante. Cotovelos fixos.'],
 ['triceps-corda','Tríceps na polia com corda','triceps','Tríceps braquial','Cotovelos colados ao corpo. Abra a corda no final da extensão.'],
 ['triceps-frances-cabo','Tríceps francês no cabo (acima da cabeça)','triceps','Tríceps (ênfase na cabeça longa)','Braços acima da cabeça, cotovelos apontando para frente. Estenda totalmente.'],
 ['triceps-testa','Tríceps testa com barra W','triceps','Tríceps braquial','Cotovelos apontados para cima e fixos. Desça a barra em direção à testa.'],
 ['triceps-barra','Tríceps na polia com barra','triceps','Tríceps braquial','Cotovelos fixos ao lado do tronco. Estenda e controle a volta.'],
 ['mergulho-banco','Mergulho entre bancos','triceps','Tríceps, peitoral','Mãos no banco atrás do corpo. Desça até o cotovelo a 90°.'],
 ['rosca-punho','Rosca de punho com barra','antebraco','Flexores do antebraço','Antebraços apoiados nas coxas. Movimento só do punho.'],
 ['agachamento-livre','Agachamento livre com barra','quadriceps','Quadríceps, glúteos, adutores, eretores','Barra apoiada no trapézio. Desça com o quadril para trás e para baixo, joelhos acompanhando a ponta dos pés.'],
 ['agachamento-frontal','Agachamento frontal','quadriceps','Quadríceps, core','Barra apoiada nos deltoides, cotovelos altos. Tronco mais vertical.'],
 ['leg-press','Leg press 45°','quadriceps','Quadríceps, glúteos','Pés na largura do quadril. Amplitude máxima sem tirar o quadril do banco.'],
 ['hack','Agachamento no hack','quadriceps','Quadríceps','Costas apoiadas. Desça até a coxa paralela ou abaixo.'],
 ['bulgaro','Agachamento búlgaro com halteres','quadriceps','Quadríceps, glúteos','Pé de trás apoiado no banco. Tronco levemente inclinado; joelho acompanha a ponta do pé.'],
 ['afundo','Afundo / passada','quadriceps','Quadríceps, glúteos','Passo largo. Joelho de trás desce em direção ao chão.'],
 ['extensora','Cadeira extensora','quadriceps','Quadríceps','Segure 1 s no topo e desça em 2–3 s.'],
 ['stiff','Stiff com halteres (RDL)','posteriores','Isquiotibiais, glúteos, eretores','Quadril para trás com a coluna neutra. Pare quando sentir o alongamento atrás da coxa.'],
 ['mesa-flexora','Mesa flexora','posteriores','Isquiotibiais','Quadril colado no banco. Controle a volta.'],
 ['cadeira-flexora','Cadeira flexora','posteriores','Isquiotibiais','Coxas presas pelo apoio. Flexione até o fim e volte devagar.'],
 ['good-morning','Good morning','posteriores','Isquiotibiais, eretores, glúteos','Barra nas costas, joelhos semiflexionados. Incline o tronco levando o quadril para trás.'],
 ['hip-thrust','Elevação de quadril (hip thrust)','gluteos','Glúteo máximo, isquiotibiais','Costas apoiadas no banco. Suba o quadril até alinhar com o tronco e contraia 1 s.'],
 ['gluteo-cabo','Glúteo no cabo (coice)','gluteos','Glúteo máximo','Estenda o quadril para trás sem arquear a lombar.'],
 ['abducao','Abdução de quadril na máquina','gluteos','Glúteo médio e mínimo','Tronco levemente inclinado à frente. Abra as pernas com controle.'],
 ['adutora','Adutora na máquina','gluteos','Adutores','Feche as pernas com controle e segure 1 s.'],
 ['panturrilha-pe','Panturrilha em pé','panturrilha','Gastrocnêmio','Pausa de 1 s embaixo e em cima. Amplitude completa.'],
 ['panturrilha-sentado','Panturrilha sentado','panturrilha','Sóleo','Joelhos a 90°. Movimento lento e completo.'],
 ['abdominal-polia','Abdominal na polia (ajoelhado)','abdomen','Reto do abdômen','Flexione a coluna levando o peito ao quadril. Não puxe com os braços.'],
 ['abdominal-supra','Abdominal supra','abdomen','Reto do abdômen','Tire as escápulas do chão enrolando a coluna. Queixo afastado do peito.'],
 ['elevacao-pernas','Elevação de pernas na barra','abdomen','Reto do abdômen (porção inferior), flexores do quadril','Suba as pernas enrolando a pelve, sem balanço.'],
 ['prancha','Prancha','abdomen','Core','Cotovelos sob os ombros, glúteos contraídos, corpo em linha.'],
 ['obliquo','Rotação / abdominal oblíquo','abdomen','Oblíquos','Gire o tronco com controle, sem embalo.'],
 ['clean','Power clean','lpo','Cadeia posterior, trapézio, quadríceps','Puxe a barra do chão, estenda o quadril com explosão e receba na posição de front rack.'],
 ['snatch','Snatch (arranco)','lpo','Corpo inteiro','Pegada larga. Leve a barra do chão até acima da cabeça em um movimento.'],
 ['clean-jerk','Clean & jerk','lpo','Corpo inteiro','Clean até o ombro, depois impulso das pernas para levar a barra acima da cabeça.'],
 ['thruster','Thruster','lpo','Quadríceps, glúteos, ombros','Agachamento frontal seguido de desenvolvimento em um só movimento.'],
 ['push-press','Push press','lpo','Ombros, tríceps, pernas','Pequeno impulso das pernas e termine o empurrão com os braços.'],
 ['kettlebell-swing','Kettlebell swing','lpo','Glúteos, posteriores, core','Movimento de dobradiça do quadril. Os braços só guiam.'],
 ['wall-ball','Wall ball','lpo','Pernas, ombros','Agache com a bola e lance no alvo ao subir.'],
 ['burpee','Burpee','cardio','Corpo inteiro','Peito no chão, levante e salte com as mãos acima da cabeça.'],
 ['remo-ergometro','Remo ergômetro','cardio','Corpo inteiro','Ordem: pernas, tronco, braços. Volte na ordem inversa.'],
 ['corrida','Corrida','cardio','Membros inferiores, sistema cardiorrespiratório','Passada curta, cadência alta, tronco levemente à frente.'],
 ['double-under','Double under (corda)','cardio','Panturrilhas, coordenação','Salto único com a corda passando duas vezes. Punhos fazem o giro.']
];
const LIB = EX.map(([id,nome,grupo,musc,dica])=>({id,nome,grupo,musc,dica,guia:G[grupo].guia}));

const T = (exId,series,repMin,repMax,rir,desc,nota,prio)=>({exId,series,repMin,repMax,rir,desc,nota:nota||'',prio:!!prio});
const TEMPLATES = [
 {id:'push',nome:'Push — Empurrar',kind:'academia',foco:'Peito, ombros e tríceps',cor:'#E04A3A',ex:[
   T('supino-reto',3,6,8,'2',120,'Aquecimento: 10 reps a ~50% e 5 reps a ~75% da carga de trabalho.'),
   T('supino-inclinado-halter',3,8,10,'2',90,'',true),
   T('desenvolvimento-halter',3,8,10,'2',90),
   T('elevacao-lateral',4,12,20,'1',60,'Prioridade estética (ombro largo).',true),
   T('crossover',2,12,15,'1',60),
   T('triceps-corda',3,10,15,'1',60,'',true),
   T('triceps-frances-cabo',2,10,12,'1–2',60)]},
 {id:'pull',nome:'Pull — Puxar',kind:'academia',foco:'Dorsais, espessura das costas, deltoide posterior e bíceps',cor:'#1F7AE0',ex:[
   T('barra-fixa',3,6,10,'2',120,'Aquecimento: 2 séries de aproximação.'),
   T('remada-curvada',3,6,8,'2',120),
   T('remada-baixa',3,8,12,'2',90,'',true),
   T('remada-unilateral',2,10,12,'1–2',60,'Repetições para cada lado.'),
   T('face-pull',3,12,15,'1',60),
   T('elevacao-lateral-cabo',2,12,15,'1',45),
   T('rosca-direta',3,8,12,'1–2',60,'',true),
   T('rosca-martelo',2,10,12,'1',60)]},
 {id:'legs',nome:'Legs — Pernas',kind:'academia',foco:'Quadríceps, posteriores, glúteos, panturrilhas e abdômen',cor:'#3E9A57',ex:[
   T('leg-press',3,8,12,'2–3',120,'Não vá à falha: as pernas precisam recuperar para o CrossFit.'),
   T('stiff',3,8,10,'2–3',120),
   T('bulgaro',2,10,12,'2–3',90,'Repetições para cada perna.'),
   T('extensora',3,12,15,'1',60),
   T('mesa-flexora',3,10,12,'1',60),
   T('panturrilha-pe',3,10,15,'1',60),
   T('abdominal-polia',3,12,15,'1–2',45)]},
 {id:'wod',nome:'CrossFit — WOD do dia',kind:'crossfit',foco:'Força + condicionamento',cor:'#F0B323',ex:[],wod:{formato:'For time',desc:'',cap:''}}
];

// Atividades com METs (Compêndio de Atividades Físicas, Ainsworth 2011)
const ACTS = [
 {id:'musc',nome:'Academia',met:5,min:60},
 {id:'corrida',nome:'Corrida',met:8.3,min:40},
 {id:'cross',nome:'CrossFit',met:7,min:60},
 {id:'natacao',nome:'Natação',met:6,min:45},
 {id:'caminhada',nome:'Caminhada',met:3.5,min:40}
];

const DAYTYPES = [
 {id:'A',nome:'Dia A — treino duplo',desc:'Academia + CrossFit',acts:['musc','cross'],adj:-17,pKg:2.3,gKg:0.9,cor:'#E04A3A'},
 {id:'B',nome:'Dia B — só academia',desc:'Academia',acts:['musc'],adj:-17,pKg:2.3,gKg:0.9,cor:'#1F7AE0'},
 {id:'C',nome:'Dia C — descanso',desc:'Fim de semana',acts:[],adj:-3,pKg:2.3,gKg:1.0,cor:'#3E9A57'}
];

// opção: [nome, itens separados por ';', P, C, G, kcal]
const o=(nome,itens,p,c,g,k)=>({nome,itens:itens.split(';').map(s=>s.trim()),p,c,g,kcal:k});
const PRE = {hora:'05:00',nome:'Pré-treino (academia 05:30)',p:0,c:0,g:0,ops:[o('Café preto','Café preto sem açúcar (até 2 xícaras);Opcional: creatina 5 g;Se sentir fraqueza: 15 g de whey em água ou meia banana (desconte do café)',0,0,0,0)]};
const M = (hora,nome,p,c,g,ops)=>({hora,nome,p,c,g,ops});
const MEALS = {
 A:[ PRE,
  M('06:40','Café da manhã — pós-academia',35,90,10,[
   o('Pão + ovos + banana','Café preto sem açúcar;Pão francês — 2 pães (100 g);1 banana (100 g);Mel — 10 g;1 ovo;5 claras',34,95,8,590),
   o('Tapioca + ovos + whey','Café preto sem açúcar;Tapioca (goma) — 90 g;1 banana (100 g);2 ovos;Whey protein — 1 scoop (30 g)',38,84,11,581),
   o('Mingau de aveia com whey','Leite desnatado — 200 ml;Aveia em flocos — 90 g;½ banana (50 g);Mel — 10 g;Whey protein — ½ scoop (15 g)',32,93,9,564)]),
  M('09:45','Lanche da manhã',40,100,10,[
   o('Batata-doce + frango','Legumes e salada — 100 g;Batata-doce cozida — 350 g;Peito de frango grelhado — 110 g;1 banana (100 g);Azeite — 5 g',40,94,8,612),
   o('Pão + ovos + whey + fruta','Pão francês — 2 pães (100 g);1 ovo;Whey protein — 1 scoop (30 g);1 banana (100 g);Mel — 15 g',40,101,9,636),
   o('Cuscuz + ovos + mamão','Cuscuz de milho — 250 g;2 ovos;6 claras;Mamão — 320 g',41,99,12,656)]),
  M('11:30','Almoço',45,110,20,[
   o('Arroz, feijão e frango','Legumes e salada — 200 g;Arroz branco cozido — 310 g;Feijão carioca cozido — 110 g;Peito de frango grelhado — 90 g;Azeite — 15 g',45,110,19,806),
   o('Arroz, feijão e patinho','Legumes e salada — 200 g;Arroz branco cozido — 310 g;Feijão carioca cozido — 100 g;Patinho grelhado — 80 g;Azeite — 10 g',44,109,17,786),
   o('Macarrão à bolonhesa magra','Legumes e salada — 200 g;Macarrão cozido — 390 g;Carne moída magra (patinho) — 70 g;Azeite — 10 g',48,106,20,803)]),
  M('15:30','Lanche pré-CrossFit',30,90,15,[
   o('Sanduíche de frango + banana com amendoim','Queijo muçarela light — 20 g;Pão de forma integral — 3 fatias (75 g);Peito de frango — 40 g;Pasta de amendoim — 15 g;1½ banana (150 g);Mel — 10 g',31,87,15,569),
   o('Iogurte + granola + whey + fruta','Iogurte natural desnatado — 170 g;Granola sem açúcar — 70 g;1 banana (100 g);Whey — ½ scoop (15 g);Pasta de amendoim — 10 g',29,89,15,582),
   o('Wrap de atum + maçã','Legumes e salada — 50 g;Wrap integral — 3 unidades (120 g);Atum em água — 70 g;Abacate — 60 g;1 maçã (130 g)',31,85,15,582)]),
  M('19:00','Jantar pós-CrossFit',45,110,20,[
   o('Arroz, feijão, frango e legumes','Legumes e salada — 200 g;Arroz branco cozido — 310 g;Feijão carioca cozido — 100 g;Peito de frango — 90 g;Azeite — 15 g',44,109,19,798),
   o('Batata + arroz + tilápia','Legumes e salada — 200 g;Batata inglesa cozida — 330 g;Arroz branco cozido — 220 g;Tilápia grelhada — 130 g;Azeite — 15 g',46,109,19,802),
   o('Mandioca + patinho + salada','Legumes e salada — 200 g;Mandioca cozida — 340 g;Patinho grelhado — 110 g;Azeite — 10 g',45,110,19,804)])],
 B:[ PRE,
  M('06:40','Café da manhã — pós-academia',35,80,10,[
   o('Pão + ovos + banana','Café preto sem açúcar;Pão francês — 1½ pão (75 g);1 banana (100 g);Mel — 10 g;2 ovos;5 claras',38,81,12,587),
   o('Tapioca + ovos + whey','Café preto sem açúcar;Tapioca (goma) — 80 g;1 banana (100 g);2 ovos;Whey protein — 1 scoop (30 g)',38,78,11,557),
   o('Mingau de aveia com whey','Leite desnatado — 200 ml;Aveia em flocos — 90 g;½ banana (50 g);Mel — 5 g;Whey — ½ scoop (15 g)',32,89,9,549)]),
  M('09:45','Lanche da manhã',40,90,10,[
   o('Batata-doce + frango','Legumes e salada — 100 g;Batata-doce cozida — 310 g;Peito de frango — 110 g;1 banana (100 g);Azeite — 5 g',40,87,8,581),
   o('Pão + ovos + whey + fruta','Pão francês — 2 pães (100 g);1 ovo;Whey — 1 scoop (30 g);1 banana (100 g);Mel — 15 g',40,101,9,636),
   o('Cuscuz + ovos + mamão','Cuscuz de milho — 240 g;2 ovos;6 claras;Mamão — 270 g',41,91,12,625)]),
  M('11:30','Almoço',45,95,20,[
   o('Arroz, feijão e frango','Legumes e salada — 200 g;Arroz branco cozido — 260 g;Feijão carioca cozido — 110 g;Peito de frango — 100 g;Azeite — 15 g',47,96,19,758),
   o('Arroz, feijão e patinho','Legumes e salada — 200 g;Arroz branco cozido — 260 g;Feijão carioca cozido — 90 g;Patinho grelhado — 90 g;Azeite — 10 g',46,93,18,737),
   o('Macarrão à bolonhesa magra','Legumes e salada — 200 g;Macarrão cozido — 350 g;Carne moída magra — 70 g;Azeite — 10 g',46,96,19,750)]),
  M('15:30','Lanche da tarde',30,55,15,[
   o('Sanduíche de frango + banana com amendoim','Queijo muçarela light — 20 g;Pão de forma integral — 2 fatias (50 g);Peito de frango — 50 g;Pasta de amendoim — 15 g;½ banana (50 g);Mel — 5 g',30,45,14,409),
   o('Iogurte + granola + whey + fruta','Iogurte natural desnatado — 170 g;Granola sem açúcar — 50 g;½ banana (50 g);Whey — ½ scoop (15 g);Pasta de amendoim — 15 g',28,63,15,479),
   o('Wrap de atum + maçã','Legumes e salada — 50 g;Wrap integral — 2 unidades (80 g);Atum em água — 80 g;Abacate — 90 g;½ maçã (65 g)',30,57,14,466)]),
  M('19:30','Jantar',45,70,20,[
   o('Arroz, feijão, frango e legumes','Legumes e salada — 200 g;Arroz branco cozido — 180 g;Feijão carioca cozido — 80 g;Peito de frango — 110 g;Azeite — 15 g',47,69,19,649),
   o('Batata + arroz + tilápia','Legumes e salada — 200 g;Batata inglesa cozida — 210 g;Arroz branco cozido — 130 g;Tilápia grelhada — 140 g;Azeite — 15 g',45,70,19,637),
   o('Mandioca + patinho + salada','Legumes e salada — 200 g;Mandioca cozida — 210 g;Patinho grelhado — 110 g;Azeite — 10 g',44,71,19,642)])],
 C:[
  M('07:30','Café da manhã',40,70,15,[
   o('Pão + ovos + banana','Café preto sem açúcar;Pão francês — 1½ pão (75 g);1 banana (100 g);Mel — 10 g;3 ovos;5 claras',44,81,17,658),
   o('Tapioca + ovos + whey','Café preto sem açúcar;Tapioca (goma) — 60 g;1 banana (100 g);3 ovos;Whey — 1 scoop (30 g)',44,67,16,580),
   o('Mingau de aveia com whey','Leite desnatado — 200 ml;Aveia em flocos — 70 g;½ banana (50 g);Mel — 5 g;Whey — 1 scoop (30 g)',41,77,8,530)]),
  M('12:00','Almoço',50,90,25,[
   o('Arroz, feijão e frango','Legumes e salada — 200 g;Arroz branco cozido — 240 g;Feijão carioca cozido — 110 g;Peito de frango — 110 g;Azeite — 20 g',49,90,24,792),
   o('Arroz, feijão e patinho','Legumes e salada — 200 g;Arroz branco cozido — 250 g;Feijão carioca cozido — 90 g;Patinho grelhado — 100 g;Azeite — 10 g',49,90,19,746),
   o('Macarrão à bolonhesa magra','Legumes e salada — 200 g;Macarrão cozido — 330 g;Carne moída magra — 90 g;Azeite — 10 g',52,90,21,768)]),
  M('16:00','Lanche da tarde',35,45,15,[
   o('Sanduíche de frango + banana com amendoim','Queijo muçarela light — 20 g;Pão de forma integral — 2 fatias (50 g);Peito de frango — 70 g;Pasta de amendoim — 15 g;½ banana (50 g);Mel — 5 g',36,45,14,440),
   o('Iogurte + granola + whey + fruta','Iogurte natural desnatado — 170 g;Granola sem açúcar — 30 g;½ banana (50 g);Whey — 1 scoop (30 g);Pasta de amendoim — 15 g',38,50,13,455),
   o('Wrap de atum + maçã','Legumes e salada — 50 g;Wrap integral — 1½ unidade (60 g);Atum em água — 100 g;Abacate — 100 g;½ maçã (65 g)',34,48,14,438)]),
  M('20:00','Jantar',50,60,25,[
   o('Arroz, feijão, frango e legumes','Legumes e salada — 200 g;Arroz branco cozido — 150 g;Feijão carioca cozido — 80 g;Peito de frango — 120 g;Azeite — 15 g',49,61,19,626),
   o('Batata + arroz + tilápia','Legumes e salada — 200 g;Batata inglesa cozida — 190 g;Arroz branco cozido — 110 g;Tilápia grelhada — 160 g;Azeite — 20 g',50,62,25,671),
   o('Mandioca + patinho + salada','Legumes e salada — 200 g;Mandioca cozida — 170 g;Patinho grelhado — 130 g;Azeite — 10 g',51,59,20,636)]),
  M('22:00','Ceia',20,5,5,[
   o('Cottage + morangos','Queijo cottage — 140 g;Morango — 20 g',16,6,6,143),
   o('Ovos mexidos','1 ovo;4 claras',21,1,5,140),
   o('Iogurte com whey','Iogurte natural desnatado — 170 g;Whey — ½ scoop (15 g)',19,12,1,131)])]
};

const SUPLEMENTOS = [
 ['Creatina monohidratada','5 g/dia','Qualquer horário, todos os dias','Forte. Aumenta força e massa magra; não precisa de saturação (ISSN, 2017).'],
 ['Whey protein','20–40 g','Quando faltar praticidade','É alimento. Ajuda a bater a meta de proteína. Prefira marcas com laudo.'],
 ['Cafeína','até ~3 mg/kg','Antes do treino; evite após 14–15 h','Forte para desempenho. À tarde prejudica o sono.'],
 ['Eletrólitos (sódio)','conforme o suor','Treino longo no calor','Previne cãibras e queda de rendimento.'],
 ['Vitamina D / Ômega-3','conforme exame','—','Só com exame e indicação profissional.']
];

// Tabela de intensidade da Enciclopédia (faixa de RM → % de 1RM)
const RM_TABLE = [
 ['1RM',100,'Alta'],['2–3 RM',95,'Alta'],['4–6 RM',90,'Alta'],['6–8 RM',85,'Alta'],['8–10 RM',80,'Alta'],
 ['10–12 RM',75,'Moderada'],['12–15 RM',70,'Moderada'],['15–18 RM',65,'Moderada'],['18–25 RM',60,'Moderada'],
 ['25–35 RM',50,'Baixa'],['35–45 RM',40,'Baixa'],['45–60 RM',30,'Baixa']
];
const VOLUME_NIVEL = {
 iniciante:{n:'Iniciante (até 6 meses)',max:12,faixa:'até 12 séries'},
 intermediario:{n:'Intermediário (6 meses a 3 anos)',max:24,faixa:'até 24 séries'},
 avancado:{n:'Avançado (3 anos ou mais)',max:35,faixa:'até 30–35 séries'}
};

const W=(fase,mode,rir,reps,foco)=>({fase,mode,rir,reps:reps||'',foco});
const PERIODS = {
 plano12:{nome:'Recomposição 12 semanas',fonte:'Plano de Recomposição Corporal',weeks:[
  W('Readaptação','minus1','3–4','','Técnica e cargas conservadoras. 1 série a menos por exercício (mín. 2).'),
  W('Readaptação','minus1','3–4','','Técnica e cargas conservadoras. A dor muscular tende a ser maior.'),
  W('Acumulação','normal','2 compostos / 1 isoladores','','Progressão dupla toda semana.'),
  W('Acumulação','normal','2 / 1','','Progressão dupla toda semana.'),
  W('Acumulação','normal','2 / 1','','Progressão dupla toda semana.'),
  W('Acumulação','normal','2 / 1','','Progressão dupla toda semana.'),
  W('Deload','half','4','','Metade das séries, mesma carga. CrossFit em intensidade moderada.'),
  W('Intensificação','plus1','1–2','','+1 série nos exercícios prioritários. Última série dos isoladores até a falha técnica.'),
  W('Intensificação','plus1','1–2','','+1 série nos prioritários.'),
  W('Intensificação','plus1','1–2','','+1 série nos prioritários.'),
  W('Intensificação','plus1','1–2','','+1 série nos prioritários.'),
  W('Deload + avaliação','half','4','','Medidas, fotos e testes. Reinicie o ciclo com as novas cargas.')]},
 ondulatoria:{nome:'Ondulatória semanal',fonte:'Enciclopédia do Treinamento — 2.11',weeks:[]},
 linear:{nome:'Linear por blocos',fonte:'Enciclopédia do Treinamento — intensidade da carga',weeks:[
  W('Resistência','normal','2–3','12–15 RM (70%)','Volume de repetições alto, técnica.'),
  W('Resistência','normal','2','12–15 RM (70%)',''),
  W('Resistência','normal','1–2','12–15 RM (70%)',''),
  W('Hipertrofia','normal','2','10–12 RM (75%)',''),
  W('Hipertrofia','normal','1–2','10–12 RM (75%)',''),
  W('Hipertrofia','normal','1','8–10 RM (80%)',''),
  W('Deload','half','4','','Metade das séries.'),
  W('Força-hipertrofia','normal','2','8–10 RM (80%)',''),
  W('Força-hipertrofia','normal','1–2','6–8 RM (85%)',''),
  W('Força-hipertrofia','normal','1','6–8 RM (85%)',''),
  W('Força','normal','1–2','4–6 RM (90%)','Top sets pesados, menos volume.'),
  W('Deload + testes','half','4','','Teste de 10RM ou 1RM e reinicie.')]}
};
for(let i=0;i<12;i++){
  const k=i%3;
  PERIODS.ondulatoria.weeks.push(i===11?W('Deload','half','4','','Recuperação antes do próximo ciclo.'):
    k===0?W('Onda moderada','normal','1–5','8–12 RM (70–80%)','20–22 séries/grupo. 1 warm-up, 2 feeder sets e 1 top set até a falha.'):
    k===1?W('Onda pesada','normal','1–3','6–8 RM (80–90%)','18–20 séries/grupo. 1 warm-up, 1 feeder e 2 top sets.'):
          W('Onda leve','normal','1–5','12–20 RM (60–70%)','22–24 séries/grupo. Sem séries até a falha (recuperação ativa).'));
}

const BENCH = [
 {id:'b-agach',nome:'Agachamento livre (1RM)',cat:'Levantamentos',tipo:'kg'},
 {id:'b-front',nome:'Agachamento frontal (1RM)',cat:'Levantamentos',tipo:'kg'},
 {id:'b-terra',nome:'Levantamento terra (1RM)',cat:'Levantamentos',tipo:'kg'},
 {id:'b-supino',nome:'Supino reto (1RM)',cat:'Levantamentos',tipo:'kg'},
 {id:'b-militar',nome:'Desenvolvimento militar (1RM)',cat:'Levantamentos',tipo:'kg'},
 {id:'b-pushpress',nome:'Push press (1RM)',cat:'Levantamentos',tipo:'kg'},
 {id:'b-clean',nome:'Power clean (1RM)',cat:'Levantamentos',tipo:'kg'},
 {id:'b-cj',nome:'Clean & jerk (1RM)',cat:'Levantamentos',tipo:'kg'},
 {id:'b-snatch',nome:'Snatch (1RM)',cat:'Levantamentos',tipo:'kg'},
 {id:'b-fran',nome:'Fran',cat:'WODs de referência',tipo:'tempo',desc:'21-15-9 thrusters 43 kg + pull-ups'},
 {id:'b-grace',nome:'Grace',cat:'WODs de referência',tipo:'tempo',desc:'30 clean & jerks 61 kg'},
 {id:'b-isabel',nome:'Isabel',cat:'WODs de referência',tipo:'tempo',desc:'30 snatches 61 kg'},
 {id:'b-diane',nome:'Diane',cat:'WODs de referência',tipo:'tempo',desc:'21-15-9 terra 102 kg + HSPU'},
 {id:'b-helen',nome:'Helen',cat:'WODs de referência',tipo:'tempo',desc:'3 rounds: 400 m corrida, 21 KB swings, 12 pull-ups'},
 {id:'b-karen',nome:'Karen',cat:'WODs de referência',tipo:'tempo',desc:'150 wall balls'},
 {id:'b-murph',nome:'Murph',cat:'WODs de referência',tipo:'tempo',desc:'1,6 km, 100 pull-ups, 200 flexões, 300 agachamentos, 1,6 km'},
 {id:'b-cindy',nome:'Cindy',cat:'WODs de referência',tipo:'reps',desc:'AMRAP 20 min: 5 pull-ups, 10 flexões, 15 agachamentos (rounds)'},
 {id:'b-pullmax',nome:'Barra fixa — máx. repetições',cat:'Ginástica',tipo:'reps'},
 {id:'b-muscleup',nome:'Muscle-up — máx. repetições',cat:'Ginástica',tipo:'reps'},
 {id:'b-du',nome:'Double unders — máx. sem parar',cat:'Ginástica',tipo:'reps'},
 {id:'b-5k',nome:'Corrida 5 km',cat:'Corrida',tipo:'tempo'},
 {id:'b-cooper',nome:'Corrida 12 min (Cooper)',cat:'Corrida',tipo:'dist'},
 {id:'b-flexao',nome:'Flexão de braço — máx.',cat:'Corrida',tipo:'reps'}
];

const SINAIS_OVERTRAINING = [
 'Frequência cardíaca de repouso 7+ bpm acima do normal',
 'Cargas caindo em duas sessões seguidas do mesmo treino',
 'Sono ruim mesmo cansado, irritabilidade, falta de vontade de treinar',
 'Dores articulares persistentes (joelho, ombro, lombar)',
 'Queda de rendimento na corrida'
];


// Frases dos mascotes do controle de peso. {guerreiro} vira "guerreiro" ou "guerreira" conforme o perfil.


/* Plano pronto: TFM + CrossFit + Academia — 8 tipos de dia com cardápio base (85 kg, recomposição) */
const PRESET_MILITAR = {"nome": "TFM + CrossFit + Academia (8 tipos de dia)", "acts": [{"id": "tfm", "nome": "TFM", "met": 7, "min": 90}], "dayTypes": [{"id": "R", "nome": "Descanso", "desc": "Sem treino", "acts": [], "adj": -15, "pKg": 2.0, "gKg": 1.0, "cor": "#6B6B6B"}, {"id": "M", "nome": "Só academia", "desc": "Academia 05:30", "acts": ["musc"], "adj": -12, "pKg": 2.4, "gKg": 0.9, "cor": "#C9A96B"}, {"id": "T", "nome": "Só TFM", "desc": "TFM 07:30", "acts": ["tfm"], "adj": -12, "pKg": 2.2, "gKg": 0.9, "cor": "#3E9A57"}, {"id": "X", "nome": "Só CrossFit", "desc": "CrossFit à noite", "acts": ["cross"], "adj": -12, "pKg": 2.1, "gKg": 0.9, "cor": "#E5533F"}, {"id": "MT", "nome": "Academia + TFM", "desc": "Academia 05:30 + TFM 07:30", "acts": ["musc", "tfm"], "adj": -12, "pKg": 2.5, "gKg": 0.9, "cor": "#1F7AE0"}, {"id": "MX", "nome": "Academia + CrossFit", "desc": "Academia 05:30 + CrossFit à noite", "acts": ["musc", "cross"], "adj": -12, "pKg": 2.5, "gKg": 0.9, "cor": "#F0B323"}, {"id": "TX", "nome": "TFM + CrossFit", "desc": "TFM 07:30 + CrossFit à noite", "acts": ["tfm", "cross"], "adj": -12, "pKg": 2.3, "gKg": 0.9, "cor": "#7A5AF5"}, {"id": "MTX", "nome": "Academia + TFM + CrossFit", "desc": "Academia 05:30 + TFM 07:30 + CrossFit à noite", "acts": ["musc", "tfm", "cross"], "adj": -12, "pKg": 2.6, "gKg": 0.9, "cor": "#E9D3A1"}], "meals": {"R": [{"hora": "07:00", "nome": "Café da manhã", "p": 18, "c": 42, "g": 11, "ops": [{"nome": "Opção base", "itens": ["Pão francês — 1 un. (50 g)", "Ovos (cozidos ou mexidos sem óleo) — 2 un.", "Banana prata — 1 un. (≈45 g)", "Café sem açúcar à vontade"], "p": 18, "c": 42, "g": 11, "kcal": 340}]}, {"hora": "10:00", "nome": "Lanche da manhã", "p": 11, "c": 42, "g": 3, "ops": [{"nome": "Opção base", "itens": ["Iogurte natural desnatado — 170 g", "Aveia em flocos — 25 g", "Mamão papaia — 150 g"], "p": 11, "c": 42, "g": 3, "kcal": 228}]}, {"hora": "11:30", "nome": "Almoço", "p": 49, "c": 41, "g": 19, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 95 g", "Feijão carioca cozido — 85 g", "Peito de frango grelhado — 130 g", "Alface — 40 g", "Tomate — 80 g", "Azeite — 15 g (≈2 colher de sopa)"], "p": 49, "c": 41, "g": 19, "kcal": 542}]}, {"hora": "15:30", "nome": "Lanche da tarde", "p": 33, "c": 23, "g": 18, "ops": [{"nome": "Opção base", "itens": ["Batata doce cozida — 95 g", "Peito de frango cozido / desfiado — 80 g", "Pasta de amendoim integral — 30 g"], "p": 33, "c": 23, "g": 18, "kcal": 380}]}, {"hora": "19:30", "nome": "Jantar", "p": 51, "c": 34, "g": 25, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 95 g", "Patinho grelhado — 130 g", "Brócolis cozido — 80 g", "Cenoura cozida — 60 g", "Azeite — 15 g (≈2 colher de sopa)"], "p": 51, "c": 34, "g": 25, "kcal": 577}]}, {"hora": "22:30", "nome": "Ceia", "p": 9, "c": 22, "g": 3, "ops": [{"nome": "Opção base", "itens": ["Queijo cottage — 80 g", "Maçã — 130 g"], "p": 9, "c": 22, "g": 3, "kcal": 151}]}], "M": [{"hora": "05:00", "nome": "Pré-treino (academia 05:30)", "p": 0, "c": 0, "g": 0, "ops": [{"nome": "Café preto", "itens": ["Café preto sem açúcar", "Opcional: creatina 5 g"], "p": 0, "c": 0, "g": 0, "kcal": 0}]}, {"hora": "06:40", "nome": "Café da manhã — pós-academia", "p": 46, "c": 80, "g": 14, "ops": [{"nome": "Opção base", "itens": ["Pão francês — 2 un. (100 g)", "Ovos (cozidos ou mexidos sem óleo) — 2 un.", "Banana prata — 1 un. (≈70 g)", "Café sem açúcar à vontade", "Whey protein — 1 scoop (30 g)"], "p": 46, "c": 80, "g": 14, "kcal": 635}]}, {"hora": "10:00", "nome": "Lanche da manhã", "p": 13, "c": 52, "g": 4, "ops": [{"nome": "Opção base", "itens": ["Iogurte natural desnatado — 170 g", "Aveia em flocos — 40 g", "Mamão papaia — 150 g"], "p": 13, "c": 52, "g": 4, "kcal": 287}]}, {"hora": "11:30", "nome": "Almoço", "p": 51, "c": 58, "g": 16, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 155 g", "Feijão carioca cozido — 85 g", "Peito de frango grelhado — 130 g", "Alface — 40 g", "Tomate — 80 g", "Azeite — 12 g (≈2 colher de sopa)"], "p": 51, "c": 58, "g": 16, "kcal": 592}]}, {"hora": "15:30", "nome": "Lanche da tarde", "p": 32, "c": 34, "g": 15, "ops": [{"nome": "Opção base", "itens": ["Batata doce cozida — 155 g", "Peito de frango cozido / desfiado — 80 g", "Pasta de amendoim integral — 25 g"], "p": 32, "c": 34, "g": 15, "kcal": 397}]}, {"hora": "19:30", "nome": "Jantar", "p": 53, "c": 51, "g": 22, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 155 g", "Patinho grelhado — 130 g", "Brócolis cozido — 80 g", "Cenoura cozida — 60 g", "Azeite — 12 g (≈2 colher de sopa)"], "p": 53, "c": 51, "g": 22, "kcal": 627}]}, {"hora": "22:30", "nome": "Ceia", "p": 9, "c": 22, "g": 3, "ops": [{"nome": "Opção base", "itens": ["Queijo cottage — 80 g", "Maçã — 130 g"], "p": 9, "c": 22, "g": 3, "kcal": 151}]}], "T": [{"hora": "07:00", "nome": "Café da manhã", "p": 27, "c": 114, "g": 14, "ops": [{"nome": "Opção base", "itens": ["Pão francês — 3 un. (150 g)", "Ovos (cozidos ou mexidos sem óleo) — 2 un.", "Banana prata — 1 un. (≈100 g)", "Café sem açúcar à vontade"], "p": 27, "c": 114, "g": 14, "kcal": 694}]}, {"hora": "09:45", "nome": "Lanche pós-TFM", "p": 15, "c": 87, "g": 5, "ops": [{"nome": "Opção base", "itens": ["Iogurte natural desnatado — 170 g", "Aveia em flocos — 55 g", "Mamão papaia — 150 g", "Mel — 30 g"], "p": 15, "c": 87, "g": 5, "kcal": 439}]}, {"hora": "11:30", "nome": "Almoço", "p": 52, "c": 74, "g": 16, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 210 g", "Feijão carioca cozido — 85 g", "Peito de frango grelhado — 130 g", "Alface — 40 g", "Tomate — 80 g", "Azeite — 12 g (≈2 colher de sopa)"], "p": 52, "c": 74, "g": 16, "kcal": 663}]}, {"hora": "15:30", "nome": "Lanche da tarde", "p": 33, "c": 44, "g": 15, "ops": [{"nome": "Opção base", "itens": ["Batata doce cozida — 210 g", "Peito de frango cozido / desfiado — 80 g", "Pasta de amendoim integral — 25 g"], "p": 33, "c": 44, "g": 15, "kcal": 439}]}, {"hora": "19:30", "nome": "Jantar", "p": 54, "c": 67, "g": 22, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 210 g", "Patinho grelhado — 130 g", "Brócolis cozido — 80 g", "Cenoura cozida — 60 g", "Azeite — 12 g (≈2 colher de sopa)"], "p": 54, "c": 67, "g": 22, "kcal": 698}]}, {"hora": "22:30", "nome": "Ceia", "p": 9, "c": 22, "g": 3, "ops": [{"nome": "Opção base", "itens": ["Queijo cottage — 80 g", "Maçã — 130 g"], "p": 9, "c": 22, "g": 3, "kcal": 151}]}], "X": [{"hora": "07:00", "nome": "Café da manhã", "p": 22, "c": 81, "g": 13, "ops": [{"nome": "Opção base", "itens": ["Pão francês — 2 un. (100 g)", "Ovos (cozidos ou mexidos sem óleo) — 2 un.", "Banana prata — 1 un. (≈85 g)", "Café sem açúcar à vontade"], "p": 22, "c": 81, "g": 13, "kcal": 529}]}, {"hora": "10:00", "nome": "Lanche da manhã", "p": 14, "c": 59, "g": 5, "ops": [{"nome": "Opção base", "itens": ["Iogurte natural desnatado — 170 g", "Aveia em flocos — 50 g", "Mamão papaia — 150 g"], "p": 14, "c": 59, "g": 5, "kcal": 327}]}, {"hora": "11:30", "nome": "Almoço", "p": 52, "c": 67, "g": 19, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 185 g", "Feijão carioca cozido — 85 g", "Peito de frango grelhado — 130 g", "Alface — 40 g", "Tomate — 80 g", "Azeite — 15 g (≈2 colher de sopa)"], "p": 52, "c": 67, "g": 19, "kcal": 657}]}, {"hora": "15:30", "nome": "Lanche da tarde — pré-CrossFit", "p": 27, "c": 56, "g": 3, "ops": [{"nome": "Opção base", "itens": ["Batata doce cozida — 185 g", "Peito de frango cozido / desfiado — 80 g", "Banana prata — 1 un. (≈85 g)"], "p": 27, "c": 56, "g": 3, "kcal": 356}]}, {"hora": "20:45", "nome": "Jantar — pós-CrossFit", "p": 53, "c": 60, "g": 25, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 185 g", "Patinho grelhado — 130 g", "Brócolis cozido — 80 g", "Cenoura cozida — 60 g", "Azeite — 15 g (≈2 colher de sopa)"], "p": 53, "c": 60, "g": 25, "kcal": 692}]}, {"hora": "22:30", "nome": "Ceia", "p": 9, "c": 22, "g": 3, "ops": [{"nome": "Opção base", "itens": ["Queijo cottage — 80 g", "Maçã — 130 g"], "p": 9, "c": 22, "g": 3, "kcal": 151}]}], "MT": [{"hora": "05:00", "nome": "Pré-treino (academia 05:30)", "p": 0, "c": 0, "g": 0, "ops": [{"nome": "Café preto", "itens": ["Café preto sem açúcar", "Opcional: creatina 5 g"], "p": 0, "c": 0, "g": 0, "kcal": 0}]}, {"hora": "06:40", "nome": "Café da manhã — pós-academia", "p": 50, "c": 120, "g": 16, "ops": [{"nome": "Opção base", "itens": ["Pão francês — 3 un. (150 g)", "Ovos (cozidos ou mexidos sem óleo) — 2 un.", "Banana prata — 2 un. (≈110 g)", "Café sem açúcar à vontade", "Whey protein — 1 scoop (30 g)"], "p": 50, "c": 120, "g": 16, "kcal": 824}]}, {"hora": "09:45", "nome": "Lanche pós-TFM", "p": 16, "c": 94, "g": 6, "ops": [{"nome": "Opção base", "itens": ["Iogurte natural desnatado — 170 g", "Aveia em flocos — 65 g", "Mamão papaia — 150 g", "Mel — 30 g"], "p": 16, "c": 94, "g": 6, "kcal": 478}]}, {"hora": "11:30", "nome": "Almoço", "p": 53, "c": 82, "g": 15, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 240 g", "Feijão carioca cozido — 85 g", "Peito de frango grelhado — 130 g", "Alface — 40 g", "Tomate — 80 g", "Azeite — 11 g (≈1 colher de sopa)"], "p": 53, "c": 82, "g": 15, "kcal": 692}]}, {"hora": "15:30", "nome": "Lanche da tarde", "p": 32, "c": 48, "g": 13, "ops": [{"nome": "Opção base", "itens": ["Batata doce cozida — 240 g", "Peito de frango cozido / desfiado — 80 g", "Pasta de amendoim integral — 20 g"], "p": 32, "c": 48, "g": 13, "kcal": 433}]}, {"hora": "19:30", "nome": "Jantar", "p": 55, "c": 75, "g": 21, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 240 g", "Patinho grelhado — 130 g", "Brócolis cozido — 80 g", "Cenoura cozida — 60 g", "Azeite — 11 g (≈1 colher de sopa)"], "p": 55, "c": 75, "g": 21, "kcal": 727}]}, {"hora": "22:30", "nome": "Ceia", "p": 9, "c": 22, "g": 3, "ops": [{"nome": "Opção base", "itens": ["Queijo cottage — 80 g", "Maçã — 130 g"], "p": 9, "c": 22, "g": 3, "kcal": 151}]}], "MX": [{"hora": "05:00", "nome": "Pré-treino (academia 05:30)", "p": 0, "c": 0, "g": 0, "ops": [{"nome": "Café preto", "itens": ["Café preto sem açúcar", "Opcional: creatina 5 g"], "p": 0, "c": 0, "g": 0, "kcal": 0}]}, {"hora": "06:40", "nome": "Café da manhã — pós-academia", "p": 50, "c": 117, "g": 16, "ops": [{"nome": "Opção base", "itens": ["Pão francês — 3 un. (150 g)", "Ovos (cozidos ou mexidos sem óleo) — 2 un.", "Banana prata — 1 un. (≈100 g)", "Café sem açúcar à vontade", "Whey protein — 1 scoop (30 g)"], "p": 50, "c": 117, "g": 16, "kcal": 814}]}, {"hora": "10:00", "nome": "Lanche da manhã", "p": 15, "c": 62, "g": 5, "ops": [{"nome": "Opção base", "itens": ["Iogurte natural desnatado — 170 g", "Aveia em flocos — 55 g", "Mamão papaia — 150 g"], "p": 15, "c": 62, "g": 5, "kcal": 346}]}, {"hora": "11:30", "nome": "Almoço", "p": 52, "c": 75, "g": 19, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 215 g", "Feijão carioca cozido — 85 g", "Peito de frango grelhado — 130 g", "Alface — 40 g", "Tomate — 80 g", "Azeite — 15 g (≈2 colher de sopa)"], "p": 52, "c": 75, "g": 19, "kcal": 696}]}, {"hora": "15:30", "nome": "Lanche da tarde — pré-CrossFit", "p": 28, "c": 66, "g": 3, "ops": [{"nome": "Opção base", "itens": ["Batata doce cozida — 215 g", "Peito de frango cozido / desfiado — 80 g", "Banana prata — 1 un. (≈100 g)"], "p": 28, "c": 66, "g": 3, "kcal": 394}]}, {"hora": "20:45", "nome": "Jantar — pós-CrossFit", "p": 54, "c": 68, "g": 25, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 215 g", "Patinho grelhado — 130 g", "Brócolis cozido — 80 g", "Cenoura cozida — 60 g", "Azeite — 15 g (≈2 colher de sopa)"], "p": 54, "c": 68, "g": 25, "kcal": 730}]}, {"hora": "22:30", "nome": "Ceia", "p": 9, "c": 22, "g": 3, "ops": [{"nome": "Opção base", "itens": ["Queijo cottage — 80 g", "Maçã — 130 g"], "p": 9, "c": 22, "g": 3, "kcal": 151}]}], "TX": [{"hora": "07:00", "nome": "Café da manhã", "p": 31, "c": 150, "g": 16, "ops": [{"nome": "Opção base", "itens": ["Pão francês — 4 un. (200 g)", "Ovos (cozidos ou mexidos sem óleo) — 2 un.", "Banana prata — 2 un. (≈125 g)", "Café sem açúcar à vontade"], "p": 31, "c": 150, "g": 16, "kcal": 868}]}, {"hora": "09:45", "nome": "Lanche pós-TFM", "p": 17, "c": 101, "g": 7, "ops": [{"nome": "Opção base", "itens": ["Iogurte natural desnatado — 170 g", "Aveia em flocos — 70 g", "Mamão papaia — 150 g", "Mel — 35 g"], "p": 17, "c": 101, "g": 7, "kcal": 514}]}, {"hora": "11:30", "nome": "Almoço", "p": 54, "c": 89, "g": 19, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 265 g", "Feijão carioca cozido — 85 g", "Peito de frango grelhado — 130 g", "Alface — 40 g", "Tomate — 80 g", "Azeite — 15 g (≈2 colher de sopa)"], "p": 54, "c": 89, "g": 19, "kcal": 760}]}, {"hora": "15:30", "nome": "Lanche da tarde — pré-CrossFit", "p": 28, "c": 81, "g": 3, "ops": [{"nome": "Opção base", "itens": ["Batata doce cozida — 265 g", "Peito de frango cozido / desfiado — 80 g", "Banana prata — 2 un. (≈125 g)"], "p": 28, "c": 81, "g": 3, "kcal": 457}]}, {"hora": "20:45", "nome": "Jantar — pós-CrossFit", "p": 55, "c": 82, "g": 26, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 265 g", "Patinho grelhado — 130 g", "Brócolis cozido — 80 g", "Cenoura cozida — 60 g", "Azeite — 15 g (≈2 colher de sopa)"], "p": 55, "c": 82, "g": 26, "kcal": 794}]}, {"hora": "22:30", "nome": "Ceia", "p": 9, "c": 22, "g": 3, "ops": [{"nome": "Opção base", "itens": ["Queijo cottage — 80 g", "Maçã — 130 g"], "p": 9, "c": 22, "g": 3, "kcal": 151}]}], "MTX": [{"hora": "05:00", "nome": "Pré-treino (academia 05:30)", "p": 0, "c": 0, "g": 0, "ops": [{"nome": "Café preto", "itens": ["Café preto sem açúcar", "Opcional: creatina 5 g"], "p": 0, "c": 0, "g": 0, "kcal": 0}]}, {"hora": "06:40", "nome": "Café da manhã — pós-academia", "p": 54, "c": 155, "g": 18, "ops": [{"nome": "Opção base", "itens": ["Pão francês — 4 un. (200 g)", "Ovos (cozidos ou mexidos sem óleo) — 2 un.", "Banana prata — 2 un. (≈135 g)", "Café sem açúcar à vontade", "Whey protein — 1 scoop (30 g)"], "p": 54, "c": 155, "g": 18, "kcal": 998}]}, {"hora": "09:45", "nome": "Lanche pós-TFM", "p": 18, "c": 112, "g": 7, "ops": [{"nome": "Opção base", "itens": ["Iogurte natural desnatado — 170 g", "Aveia em flocos — 80 g", "Mamão papaia — 150 g", "Mel — 40 g"], "p": 18, "c": 112, "g": 7, "kcal": 568}]}, {"hora": "11:30", "nome": "Almoço", "p": 54, "c": 96, "g": 19, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 290 g", "Feijão carioca cozido — 85 g", "Peito de frango grelhado — 130 g", "Alface — 40 g", "Tomate — 80 g", "Azeite — 15 g (≈2 colher de sopa)"], "p": 54, "c": 96, "g": 19, "kcal": 792}]}, {"hora": "15:30", "nome": "Lanche da tarde — pré-CrossFit", "p": 29, "c": 88, "g": 3, "ops": [{"nome": "Opção base", "itens": ["Batata doce cozida — 290 g", "Peito de frango cozido / desfiado — 80 g", "Banana prata — 2 un. (≈135 g)"], "p": 29, "c": 88, "g": 3, "kcal": 486}]}, {"hora": "20:45", "nome": "Jantar — pós-CrossFit", "p": 56, "c": 89, "g": 26, "ops": [{"nome": "Opção base", "itens": ["Arroz branco cozido — 290 g", "Patinho grelhado — 130 g", "Brócolis cozido — 80 g", "Cenoura cozida — 60 g", "Azeite — 15 g (≈2 colher de sopa)"], "p": 56, "c": 89, "g": 26, "kcal": 826}]}, {"hora": "22:30", "nome": "Ceia", "p": 9, "c": 22, "g": 3, "ops": [{"nome": "Opção base", "itens": ["Queijo cottage — 80 g", "Maçã — 130 g"], "p": 9, "c": 22, "g": 3, "kcal": 151}]}]}, "weekPattern": {"1": [{"act": "musc", "hora": "05:30", "rot": true}, {"act": "tfm", "hora": "07:30"}, {"act": "cross", "hora": "19:30"}], "2": [{"act": "musc", "hora": "05:30", "rot": true}, {"act": "tfm", "hora": "07:30"}, {"act": "cross", "hora": "19:30"}], "3": [{"act": "musc", "hora": "05:30", "rot": true}, {"act": "tfm", "hora": "07:30"}, {"act": "cross", "hora": "19:30"}], "4": [{"act": "musc", "hora": "05:30", "rot": true}, {"act": "tfm", "hora": "07:30"}, {"act": "cross", "hora": "19:30"}], "5": [{"act": "musc", "hora": "05:30", "rot": true}, {"act": "tfm", "hora": "07:30"}], "6": [], "0": []}};
return {PRESET_MILITAR,G,LIB,TEMPLATES,ACTS,DAYTYPES,MEALS,SUPLEMENTOS,RM_TABLE,VOLUME_NIVEL,PERIODS,BENCH,SINAIS_OVERTRAINING};
})();
