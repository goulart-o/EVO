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
   T('leg-press',3,8,12,'2–3',120,'No dia de Legs a TFM vem depois: não vá à falha.'),
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
 {id:'musc',nome:'Musculação',met:5,min:60},
 {id:'cross',nome:'CrossFit',met:7,min:60},
 {id:'tfm',nome:'TFM / corrida 10 km/h',met:8,min:60},
 {id:'corrida',nome:'Corrida leve (8 km/h)',met:8.3,min:30},
 {id:'caminhada',nome:'Caminhada',met:3.5,min:40},
 {id:'bike',nome:'Bicicleta moderada',met:7,min:45},
 {id:'natacao',nome:'Natação moderada',met:6,min:45},
 {id:'funcional',nome:'Funcional / HIIT',met:8,min:40},
 {id:'marcha',nome:'Marcha com carga',met:7.5,min:90},
 {id:'mob',nome:'Mobilidade / alongamento',met:2.5,min:20}
];

const DAYTYPES = [
 {id:'A',nome:'Dia A — treino triplo',desc:'Academia + TFM + CrossFit',acts:['musc','tfm','cross'],adj:-17,pKg:2.3,gKg:0.9,cor:'#E04A3A'},
 {id:'B',nome:'Dia B — sem CrossFit',desc:'Academia + TFM',acts:['musc','tfm'],adj:-17,pKg:2.3,gKg:0.9,cor:'#1F7AE0'},
 {id:'C',nome:'Dia C — descanso',desc:'Fim de semana',acts:[],adj:-3,pKg:2.3,gKg:1.0,cor:'#3E9A57'}
];

// opção: [nome, itens separados por ';', P, C, G, kcal]
const o=(nome,itens,p,c,g,k)=>({nome,itens:itens.split(';').map(s=>s.trim()),p,c,g,kcal:k});
const PRE = {hora:'05:00',nome:'Pré-treino (academia 05:30)',p:0,c:0,g:0,ops:[o('Café preto','Café preto sem açúcar (até 2 xícaras);Opcional: creatina 5 g;Se sentir fraqueza: 15 g de whey em água ou meia banana (desconte do café)',0,0,0,0)]};
const M = (hora,nome,p,c,g,ops)=>({hora,nome,p,c,g,ops});
const MEALS = {
 A:[ PRE,
  M('06:40','Café da manhã — pós-academia / pré-TFM',35,90,10,[
   o('Pão + ovos + banana','Café preto sem açúcar;Pão francês — 2 pães (100 g);1 banana (100 g);Mel — 10 g;1 ovo;5 claras',34,95,8,590),
   o('Tapioca + ovos + whey','Café preto sem açúcar;Tapioca (goma) — 90 g;1 banana (100 g);2 ovos;Whey protein — 1 scoop (30 g)',38,84,11,581),
   o('Mingau de aveia com whey','Leite desnatado — 200 ml;Aveia em flocos — 90 g;½ banana (50 g);Mel — 10 g;Whey protein — ½ scoop (15 g)',32,93,9,564)]),
  M('09:45','Refeição pós-TFM',40,100,10,[
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
  M('06:40','Café da manhã — pós-academia / pré-TFM',35,80,10,[
   o('Pão + ovos + banana','Café preto sem açúcar;Pão francês — 1½ pão (75 g);1 banana (100 g);Mel — 10 g;2 ovos;5 claras',38,81,12,587),
   o('Tapioca + ovos + whey','Café preto sem açúcar;Tapioca (goma) — 80 g;1 banana (100 g);2 ovos;Whey protein — 1 scoop (30 g)',38,78,11,557),
   o('Mingau de aveia com whey','Leite desnatado — 200 ml;Aveia em flocos — 90 g;½ banana (50 g);Mel — 5 g;Whey — ½ scoop (15 g)',32,89,9,549)]),
  M('09:45','Refeição pós-TFM',40,90,10,[
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

const SUBS = {
 carbo:{t:'Carboidrato — 25 g',l:[['Arroz branco cozido','90 g'],['Batata-doce cozida','135 g'],['Mandioca cozida','85 g'],['Batata inglesa cozida','210 g'],['Macarrão cozido','100 g'],['Cuscuz de milho','100 g'],['Pão francês','45 g (≈ 0,9 pão)'],['Tapioca (goma)','40 g'],['Aveia em flocos','40 g'],['Banana','95 g (≈ 1 banana)'],['Feijão carioca cozido','185 g']]},
 prot:{t:'Proteína — 25 g',l:[['Peito de frango grelhado','80 g'],['Patinho grelhado','70 g'],['Tilápia grelhada','95 g'],['Atum em água (drenado)','95 g'],['Ovo inteiro','200 g (≈ 4 ovos)'],['Clara de ovo','230 g (≈ 7 claras)'],['Whey protein','30 g (≈ 1 scoop)'],['Queijo cottage','225 g']]},
 gord:{t:'Gordura — 10 g',l:[['Azeite de oliva','10 g (≈ 1 col. sopa)'],['Abacate','119 g'],['Pasta de amendoim','20 g (≈ 1 col. sopa cheia)'],['Castanha-do-pará','16 g (≈ 3 unidades)']]}
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
const FRASES = {
 perdaBoa:{
  sutil:{t:['PARABÉNS!','CONTINUE ASSIM!','VOCÊ É DEMAIS!','MANDOU BEM!'],f:[
   'Cada passo do seu processo é motivo de orgulho. Parabéns pelo seu empenho!',
   'O resultado de cuidar de si é ver sua saúde e energia mudando a cada dia.',
   'Não é só sobre números na balança, é sobre como você está se sentindo leve e forte.',
   'Seu foco e dedicação estão dando frutos lindos. Continue no seu tempo!',
   'Que incrível ver o resultado de todo o carinho e cuidado que você tem dedicado ao seu corpo.',
   'Você está construindo uma versão mais saudável e disposta de si. Orgulhe-se!',
   'Cada meta alcançada mostra o quanto sua determinação é gigante.',
   'Que alegria ver você se descobrindo mais leve e confiante a cada etapa.',
   'A constância é o verdadeiro segredo, e você está dando um show nisso.',
   'Lembre-se sempre de celebrar as pequenas e grandes vitórias da sua jornada.']},
  agressivo:{t:['CARALHO, QUE ISSO!','MONSTRO!','PORRA, MANDOU BEM!','TÁ VOANDO!'],f:[
   'Finalmente criou vergonha nessa cara e parou de comer que nem um arrombado, parabéns!',
   'Puta que pariu, sumiu metade de você! Agora vê se não volta a virar uma paçoca.',
   'Cancelou a assinatura do rodízio, caralho? Tá fininho, parabéns pela disciplina!',
   'Caralho, que transformação! Parou de ingerir gordura até pelo ar, porra!',
   'Pelo menos a porra da força de vontade serviu pra alguma coisa além de dar desculpa.',
   'Viu como não morrer de infarto antes dos 40 é bom? Continua nessa porra!',
   'Tomou vergonha e fechou essa boca de caçapa, caralho! Mandou bem demais.',
   'Caralho, a gordura foi embora e a dignidade voltou. Não estraga essa merda agora!',
   'Finalmente a gravidade parou de sofrer tanto com você. Boa, caralho!',
   'Parou de comer até o reboco da parede, né, desgraçado? Tá bonitão agora!']}},
 ganhoRuim:{
  sutil:{t:['NÃO DESISTA!','VOCÊ É FORTE!','VAMOS LÁ!','{GUERREIRO}!'],f:[
   'Seu corpo é a sua casa e oscilações fazem parte do ciclo da vida. Seja gentil consigo.',
   'O seu valor nunca será medido por números em uma balança ou pelo tamanho da sua roupa.',
   'O peso muda, mas a sua essência, sua força e sua beleza continuam intactas.',
   'Respire fundo: recomeçar e recalibrar a rotina faz parte da jornada de qualquer pessoa.',
   'Cuide de você por amor ao seu corpo, não por punição. Você merece carinho agora.',
   'Não deixe uma fase definir quem você é. O equilíbrio se reconstrói um dia de cada vez.',
   'Acolha seu momento presente; com paciência e amor-próprio você chega onde quiser.',
   'O importante é como você se sente por dentro. Foque no seu bem-estar e na sua paz.',
   'Corpos mudam e isso é normal. O essencial é continuar cuidando da sua saúde mental e física.',
   'Tenha paciência com o seu tempo; respeitar o próprio ritmo é o primeiro passo.',
   'Não desista. Vamos lá, você é {um guerreiro}!']},
  agressivo:{t:['LEVANTA, PORRA!','BORA, CARALHO!','SEM DESCULPA!','REAGE, {GUERREIRO}!'],f:[
   'Porra, a balança subiu. E daí? Levanta essa cabeça e bora pro treino, caralho!',
   'Caiu? Levanta, porra! {Guerreiro} de verdade não fica no chão chorando.',
   'Um número ruim não apaga o que você já construiu. Volta pro jogo, caralho!',
   'Ligou o foda-se essa semana? Desliga agora e volta pra disciplina, porra!',
   'Chega de desculpa, caralho. Amanhã é dieta no prato e treino na ficha.',
   'Você é mais forte que essa porra de balança. Mostra isso semana que vem!',
   'Escorregou? Normal. Ficar parado é que é inaceitável, caralho!',
   'Puta que pariu, bora reagir! Água, proteína, treino e sono. Sem choro.',
   'Ninguém vai fazer por você, porra. Fecha a ficha de hoje e segue o plano.',
   '{Guerreiro} não desiste na primeira subida. Bora, caralho!']}},
 ganhoBom:{
  sutil:{t:['PARABÉNS!','CRESCENDO!','VOCÊ É DEMAIS!'],f:[
   'Massa chegando! Seu esforço na mesa e no treino está aparecendo.',
   'Crescendo do jeito certo. Continue assim!',
   'Cada quilo é um tijolo na sua construção. Orgulhe-se!',
   'A constância está dando resultado. Siga firme no plano.']},
  agressivo:{t:['MONSTRO!','CARALHO, CRESCEU!','PORRA, É ISSO!'],f:[
   'Caralho, tá crescendo! Continua enchendo esse prato, porra!',
   'Monstro em construção, porra! Segue o plano!',
   'Puta que pariu, que evolução! Bora comer e treinar pesado.']}},
 perdaRuim:{
  sutil:{t:['VAMOS LÁ!','VOCÊ É FORTE!'],f:[
   'Tudo bem oscilar. Capriche nas refeições desta semana.',
   'Seu corpo precisa de energia para crescer. Você consegue!',
   'Uma semana não define o processo. Bora bater as calorias.']},
  agressivo:{t:['COME, PORRA!','BORA, CARALHO!'],f:[
   'Perdeu peso no bulking, caralho? Bora bater essas calorias!',
   'Porra, tá comendo igual passarinho? Enche esse prato!']}},
 estavel:{
  sutil:{t:['FIRME!','CONSTÂNCIA!'],f:[
   'Peso estável. Constância também é vitória!',
   'Manter também é progresso. Siga firme no plano.',
   'Olhe também a cintura e as cargas: elas contam a história completa.']},
  agressivo:{t:['E AÍ, PORRA?','BORA ACELERAR!'],f:[
   'Nem subiu nem desceu. Bora dar aquele gás, caralho!',
   'Parado, porra? Hora de apertar o passo!']}}
};

return {FRASES,G,LIB,TEMPLATES,ACTS,DAYTYPES,MEALS,SUBS,SUPLEMENTOS,RM_TABLE,VOLUME_NIVEL,PERIODS,BENCH,SINAIS_OVERTRAINING};
})();
