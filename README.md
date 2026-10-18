# EVO

Aplicativo web (PWA) para controlar **treinos de academia e CrossFit**, **dieta e macros**, **hidratação**, **periodização** e **recordes**. Funciona no navegador do celular ou do computador, pode ser instalado na tela inicial e continua funcionando offline depois da primeira visita.

## Navegação

Barra inferior (celular) ou abas no topo (computador) com 5 seções: **Hoje**, **Treino** (Treinar, Fichas, Agenda, Periodização, Recordes), **Dieta** (Cardápio & macros, Água), **Progresso** e **Você** (Perfil, Aluno & profissional, Ajustes & ajuda). O botão **+** abre os registros rápidos e o **?** explica cada página.

## Funcionalidades

| Aba | O que faz |
|---|---|
| **Hoje** | Treinos do dia, macros consumidos, água e calendário semanal/mensal com planejamento de treino e cardápio por dia |
| **Treinar** | Execução do treino: carga, repetições e RIR por série, cronômetro de descanso, sugestão de progressão de carga, histórico, volume semanal e recordes recentes |
| **Montar treino** | Criação e edição de fichas, rotação automática (ex.: Push/Pull/Legs), séries por grupo muscular e biblioteca com 70 exercícios ilustrados e animados |
| **Agenda** | Visualização diária, semanal e mensal; semana padrão; tipo de dia (A/B/C) |
| **Dieta & macros** | TMB (Mifflin-St Jeor, Harris-Benedict, Katch-McArdle, Cunningham), gasto por METs, ciclo de carboidratos, cardápios com opções, substituições e suplementos |
| **Hidratação** | Meta personalizada (peso, treino e clima) com animação da garrafa (com sede, cheia, transbordando) |
| **RPs** | Recordes de levantamentos, WODs de referência e corrida; 1RM estimado dos treinos; calculadora de % de 1RM |
| **Periodização** | Recomposição 12 semanas, linear por blocos e ondulatória; questionário para escolher o modelo |
| **Progresso** | Peso com mascote motivacional (sutil ou agressivo), cintura, FC de repouso, sono e ajuste calórico recomendado |
| **Perfil** | Dados pessoais, METs e backup |
| **Aluno & profissional** | Turma com código, resumo do aluno com permissões, prescrição de dieta, treinos e metas |
| **Configurações & ajuda** | Tema, cor, fonte, tamanho do texto, animações e guia de uso |

## Como rodar no computador

O app é estático (HTML, CSS e JavaScript, sem build). Basta servir a pasta:

```bash
# Python
python3 -m http.server 8000
# ou Node
npx serve .
```

Abra `http://localhost:8000`. (Abrir o `index.html` direto pelo arquivo também funciona, mas sem modo offline.)

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (ex.: `evo`).
2. Envie os arquivos desta pasta:
   ```bash
   git init
   git add .
   git commit -m "EVO: primeira versão"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/evo.git
   git push -u origin main
   ```
3. No repositório: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
4. Em 1–2 minutos o app fica em `https://SEU-USUARIO.github.io/evo/`.
5. No celular, abra o link e use **Adicionar à tela inicial** para instalar.


## Login com Google, nuvem e aluno ↔ profissional (Firebase)

Sem configurar nada, o app funciona só no aparelho. Para ter **login com Google**, **dados na nuvem** e a **conexão aluno ↔ profissional**, ligue o app a um projeto gratuito do Firebase (plano Spark). Leva uns 15 minutos e só precisa ser feito uma vez.

1. Entre em <https://console.firebase.google.com> com sua conta Google e clique em **Criar projeto** (ex.: `evo-app`). Pode desativar o Google Analytics.
2. **Login:** menu **Build › Authentication › Vamos começar › Sign-in method › Google › Ativar** e salve.
   Depois, em **Authentication › Settings › Domínios autorizados › Adicionar domínio**, coloque `SEU-USUARIO.github.io`.
3. **Banco:** menu **Build › Firestore Database › Criar banco de dados** › escolha a região `southamerica-east1 (São Paulo)` › **modo de produção**.
4. **Regras de segurança:** no Firestore, aba **Regras**, apague o que estiver lá, cole todo o conteúdo do arquivo `firestore.rules` deste projeto e clique em **Publicar**. São elas que garantem que só o próprio aluno e o profissional da turma dele veem os dados.
5. **Chaves do app:** engrenagem **Configurações do projeto › Seus apps › ícone `</>` (Web)** › dê um nome › **Registrar app**. Copie o objeto `firebaseConfig` que aparece.
6. No GitHub, abra o arquivo `firebase-config.js`, clique no lápis (editar) e troque `window.EVO_FIREBASE = null;` pelo objeto copiado, assim:
   ```js
   window.EVO_FIREBASE = {
     apiKey: "AIza...",
     authDomain: "evo-app-xxxx.firebaseapp.com",
     projectId: "evo-app-xxxx",
     storageBucket: "evo-app-xxxx.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123"
   };
   ```
   Clique em **Commit changes**. Em 1–2 minutos o site atualiza.
7. Abra o app: aparece a tela **Entrar com Google**. Pronto.

> As chaves do `firebase-config.js` podem ficar públicas: quem protege os dados são as regras do passo 4 e o login.

### Como usar a turma

- **Profissional:** Você › Aluno & profissional › **Sou profissional** › preencha os dados › **Criar turma**. Envie o código e o link do app.
- **Aluno:** Você › Aluno & profissional › **Sou aluno** › digite o código › escolha o que compartilhar (peso, medidas, treinos, recordes, dieta, água, fichas) › **Entrar na turma**. Pode mudar as permissões ou sair a qualquer momento.
- O profissional abre o aluno e altera **metas** (peso, treinos por semana, água), **dieta** (proteína, gordura, calorias) e **treinos** (pode trazer as fichas do aluno, editar em Fichas e devolver). Se o aluno marcou *Aplicar automaticamente*, a mudança entra sozinha no app dele; senão, aparece um aviso em Hoje para ele aplicar. O aluno sempre pode desfazer.

Limites do plano gratuito do Firebase: 50 mil leituras e 20 mil gravações por dia, o suficiente para centenas de alunos.

## Estrutura

```
index.html            página, estilos e estrutura
app.js                lógica do app (telas, cálculos, armazenamento)
data.js               biblioteca de exercícios, fichas, cardápios, periodizações, frases dos mascotes
exart.js              ilustrações animadas dos exercícios (SVG gerado por código)
firebase-config.js    chaves do seu projeto Firebase (opcional)
cloud.js              login Google e banco na nuvem (só age com o firebase-config preenchido)
firestore.rules       regras de segurança para colar no Firebase
sw.js                 service worker (modo offline)
manifest.webmanifest  instalação como app (PWA)
icons/                ícones do app
*.webp                garrafas da hidratação, prato de macros e mascotes
mascot/               camadas animadas dos garrafões (corpo, boca e braços)
```

## Dados

Nesta versão os dados ficam no **navegador** (`localStorage`) de cada pessoa. Para trocar de aparelho, use **Perfil & parceiros → Exportar meus dados** e depois **Importar backup**.

A troca de modelos por código (profissional → aluno) e o login com Google precisam de um servidor. Próximo passo sugerido: **Firebase** (Authentication com Google + Firestore). A camada de armazenamento está isolada no objeto `Store` em `app.js`, o que facilita a troca.

## Referências usadas

- Plano de Recomposição Corporal (12 semanas) — base das fichas Push/Pull/Legs, cardápios A/B/C e periodização.
- Enciclopédia do Treinamento e Nutrição Esportiva — tabela de % de 1RM, volume por nível, faixas de macronutrientes e periodização ondulatória.
- Ainsworth et al. (2011), *Compendium of Physical Activities* — valores de MET.

## Aviso

Os valores do app são estimativas. Avaliação de composição corporal e acompanhamento de nutricionista e profissional de educação física permitem refinar os números. Em caso de dor, lesão ou condição de saúde, procure atendimento.
